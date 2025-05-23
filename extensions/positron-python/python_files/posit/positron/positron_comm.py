#
# Copyright (C) 2023-2024 Posit Software, PBC. All rights reserved.
# Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
#

from __future__ import annotations

import enum
import logging
import threading
from typing import TYPE_CHECKING, Callable, Generic, TypeVar

import comm

from . import (
    connections_comm,
    data_explorer_comm,
    help_comm,
    plot_comm,
    ui_comm,
    variables_comm,
)
from ._vendor.pydantic import ValidationError
from ._vendor.pydantic.generics import GenericModel

if TYPE_CHECKING:
    from .utils import JsonData, JsonRecord

logger = logging.getLogger(__name__)


## Create an enum of JSON-RPC error codes
@enum.unique
class JsonRpcErrorCode(enum.IntEnum):
    # Documentation below is taken directly from https://www.jsonrpc.org/specification#error_object
    # for convenience.

    # Invalid JSON was received by the server.
    # An error occurred on the server while parsing the JSON text.
    PARSE_ERROR = -32700

    # The JSON sent is not a valid Request object.
    INVALID_REQUEST = -32600

    # The method does not exist / is not available.
    METHOD_NOT_FOUND = -32601

    # Invalid method parameter(s).
    INVALID_PARAMS = -32602

    # Internal JSON-RPC error.
    INTERNAL_ERROR = -32603


T_content = TypeVar(
    "T_content",
    data_explorer_comm.DataExplorerBackendMessageContent,
    help_comm.HelpBackendMessageContent,
    plot_comm.PlotBackendMessageContent,
    variables_comm.VariablesBackendMessageContent,
    ui_comm.UiBackendMessageContent,
    connections_comm.ConnectionsBackendMessageContent,
)


class CommMessage(GenericModel, Generic[T_content]):
    """A generic message received from the frontend-side of a comm."""

    content: T_content


class PositronComm:
    """
    A wrapper around a base IPython comm that provides a JSON-RPC interface.

    Paramaters
    ----------
    comm
        The wrapped IPython comm.

    Attributes
    ----------
    comm
        The wrapped IPython comm.
    comm_id
    """

    def __init__(self, comm: comm.base_comm.BaseComm) -> None:
        self.comm = comm
        self.send_lock = threading.RLock()

    @classmethod
    def create(cls, target_name: str, comm_id: str) -> PositronComm:
        """
        Create a Positron comm.

        Parameters
        ----------
        target_name
            The name of the target for the comm, as defined in the frontend.
        comm_id
            The unique identifier for the comm.

        Returns:
        --------
        PositronComm
            The new PositronComm instance.
        """
        base_comm = comm.create_comm(target_name=target_name, comm_id=comm_id)
        return cls(base_comm)

    @property
    def comm_id(self) -> str:
        """The unique identifier of this comm."""
        return self.comm.comm_id

    def on_close(self, callback: Callable[[JsonRecord], None]):
        """
        Register a callback for when the frontend-side version of this comm is closed.

        Paramaters:
        -----------
        callback
            Called when the comm is closed, with the raw close message.
        """
        self.comm.on_close(callback)

    def on_msg(
        self,
        callback: Callable[[CommMessage[T_content], JsonRecord], None],
        content_cls: type[T_content],
    ) -> None:
        """
        Register a callback for an RPC request from the frontend.

        Parameters
        ----------
        callback
            Called when a message is received, with both the parsed message `msg: CommMessage` and
            original `raw_msg`. Not called if the `raw_msg` could not be parsed; instead, a JSON-RPC
            error will be sent to the frontend.
        content_cls
            The Pydantic model to parse the message with.
        """

        def _handle_msg(
            raw_msg: JsonRecord,
        ) -> None:
            try:
                comm_msg = CommMessage[content_cls].parse_obj(raw_msg)
            except ValidationError as exception:
                # Check if the error is due to an unknown method
                for error in exception.errors():
                    # Since Pydantic doesn't support discriminated unions with a single type,
                    # we use a constant `method` in those cases, and have to check them separately.
                    if (
                        # Comms with multiple backend request methods will have a discriminated_union error
                        error["loc"] == ("content", "data")
                        and error["type"] == "value_error.discriminated_union.invalid_discriminator"
                        and error["ctx"]["discriminator_key"] == "method"
                    ):
                        method = error["ctx"]["discriminator_value"]
                        self.send_error(
                            JsonRpcErrorCode.METHOD_NOT_FOUND,
                            f"Unknown method '{method}'",
                        )
                        return

                    elif (
                        # Comms with a single backend request method will have a const error
                        error["loc"] == ("content", "data", "method")
                        and error["type"] == "value_error.const"
                    ):
                        method = error["ctx"]["given"]
                        self.send_error(
                            JsonRpcErrorCode.METHOD_NOT_FOUND,
                            f"Unknown method '{method}'",
                        )
                        return

                self.send_error(
                    JsonRpcErrorCode.INVALID_REQUEST,
                    f"Invalid request: {exception}",
                )
                return

            callback(comm_msg, raw_msg)

        def handle_msg(raw_msg: JsonRecord) -> None:
            try:
                with self.send_lock:
                    _handle_msg(raw_msg)
            except Exception as exception:
                self.send_error(
                    JsonRpcErrorCode.INTERNAL_ERROR,
                    f"Internal error: {exception}",
                )

        self.comm.on_msg(handle_msg)

    def handle_msg(self, raw_msg: JsonRecord) -> None:
        """
        Handle a raw JSON-RPC message from the frontend-side version of this comm.

        Parameters
        ----------
        raw_msg
            The raw JSON-RPC message.
        """
        return self.comm.handle_msg(raw_msg)

    @property
    def messages(self):
        """Messages sent to the frontend-side version of this comm, when recorded for testing purposes."""
        return getattr(self.comm, "messages")  # noqa: B009

    def send_result(self, data: JsonData = None, metadata: JsonRecord | None = None) -> None:
        """
        Send a JSON-RPC result to the frontend-side version of this comm.

        Parameters
        ----------
        data
            The result data to send.
        metadata
            The metadata to send with the result.
        """
        result = {
            "jsonrpc": "2.0",
            "result": data,
        }
        self.comm.send(
            data=result,
            metadata=metadata,
            buffers=None,
        )

    def send_event(self, name: str, payload: JsonRecord) -> None:
        """
        Send a JSON-RPC notification (event) to the frontend-side version of this comm.

        Parameters
        ----------
        name
            The name of the event.
        payload
            The payload of the event.
        """
        event = {
            "jsonrpc": "2.0",
            "method": name,
            "params": payload,
        }
        with self.send_lock:
            self.comm.send(data=event)

    def send_error(self, code: JsonRpcErrorCode, message: str | None = None) -> None:
        """
        Send a JSON-RPC result to the frontend-side version of this comm.

        Parameters
        ----------
        code
            The error code to send.
        message
            The error message to send.
        """
        error = {
            "jsonrpc": "2.0",
            "error": {
                "code": code.value,
                "message": message,
            },
        }
        self.comm.send(
            data=error,
            metadata=None,
            buffers=None,
        )

    def close(self) -> None:
        """Close the frontend-side version of this comm."""
        self.comm.close()

    def open(self) -> None:
        """Open the frontend-side version of this comm."""
        self.comm.open()
