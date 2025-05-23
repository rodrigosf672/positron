/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024-2025 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

// CSS.
import './languageModelModalDialog.css';

// React.
import React, { useEffect } from 'react';

// Other dependencies.
import { PositronModalReactRenderer } from '../../../browser/positronModalReactRenderer/positronModalReactRenderer.js';
import { IKeybindingService } from '../../../../platform/keybinding/common/keybinding.js';
import { ILayoutService } from '../../../../platform/layout/browser/layoutService.js';
import { OKCancelModalDialog } from '../../../browser/positronComponents/positronModalDialog/positronOKCancelModalDialog.js';
import { VerticalStack } from '../../../browser/positronComponents/positronModalDialog/components/verticalStack.js';
import { DropDownListBoxItem } from '../../../browser/positronComponents/dropDownListBox/dropDownListBoxItem.js';
import { LabeledTextInput } from '../../../browser/positronComponents/positronModalDialog/components/labeledTextInput.js';
import { IPositronAssistantService, IPositronLanguageModelConfig, IPositronLanguageModelSource, PositronLanguageModelType } from '../common/interfaces/positronAssistantService.js';
import { localize } from '../../../../nls.js';
import { ProgressBar } from '../../../../base/browser/ui/positronComponents/progressBar.js';
import { LanguageModelButton } from './components/languageModelButton.js';
import { DropDownListBox } from '../../../browser/positronComponents/dropDownListBox/dropDownListBox.js';
import { OKModalDialog } from '../../../browser/positronComponents/positronModalDialog/positronOKModalDialog.js';
import { IConfigurationService } from '../../../../platform/configuration/common/configuration.js';
import { LanguageModelConfigComponent } from './components/languageModelConfigComponent.js';
import { RadioButtonItem } from '../../../browser/positronComponents/positronModalDialog/components/radioButton.js';
import { RadioGroup } from '../../../browser/positronComponents/positronModalDialog/components/radioGroup.js';
import { IDisposable } from '../../../../base/common/lifecycle.js';

export const showLanguageModelModalDialog = (
	keybindingService: IKeybindingService,
	layoutService: ILayoutService,
	configurationService: IConfigurationService,
	positronAssistantService: IPositronAssistantService,
	sources: IPositronLanguageModelSource[],
	onAction: (config: IPositronLanguageModelConfig, action: string) => Promise<void>,
	onCancel: () => void,
	onClose: () => void,
) => {
	const renderer = new PositronModalReactRenderer({
		keybindingService: keybindingService,
		layoutService: layoutService,
		container: layoutService.activeContainer
	});

	renderer.render(
		<div className='language-model-modal-dialog'>
			<LanguageModelConfiguration
				configurationService={configurationService}
				keybindingService={keybindingService}
				layoutService={layoutService}
				positronAssistantService={positronAssistantService}
				renderer={renderer}
				sources={sources}
				onAction={onAction}
				onCancel={onCancel}
				onClose={onClose}
			/>
		</div>
	);
};

interface LanguageModelConfigurationProps {
	keybindingService: IKeybindingService;
	layoutService: ILayoutService;
	positronAssistantService: IPositronAssistantService;
	sources: IPositronLanguageModelSource[];
	configurationService: IConfigurationService;
	renderer: PositronModalReactRenderer;
	onAction: (config: IPositronLanguageModelConfig, action: string) => Promise<void>;
	onCancel: () => void;
	onClose: () => void;
}

export interface LanguageModelUIConfiguration extends IPositronLanguageModelConfig {
	signedIn?: boolean;
	isTest?: boolean;
	apiKey?: string;
}

const LanguageModelConfiguration = (props: React.PropsWithChildren<LanguageModelConfigurationProps>) => {
	const [type, setType] = React.useState<PositronLanguageModelType>(PositronLanguageModelType.Chat);

	const useNewConfig = props.configurationService.getValue<boolean>('positron.assistant.newModelConfiguration') ?? true;
	const enabledProviders = props.sources.map(source => source.provider.id);
	const hasAnthropic = enabledProviders.includes('anthropic');
	const hasMistral = enabledProviders.includes('mistral');
	const defaultSource = props.sources.find(source => {
		// If Anthropic is available, prefer it for chat models
		if (type === 'chat') {
			if (hasAnthropic) {
				return source.provider.id === 'anthropic';
			}
			// If Mistral is available, prefer it for completion models
			if (hasMistral) {
				return source.provider.id === 'mistral';
			}
			// In all other cases, prefer the first available provider
			return true;
		}
		return false;
	})!;

	const [source, setSource] = React.useState<IPositronLanguageModelSource>(defaultSource);
	const [providerConfig, setProviderConfig] = React.useState<LanguageModelUIConfiguration>({ ...defaultSource.defaults, name: defaultSource.provider.displayName, provider: defaultSource.provider.id, type: defaultSource.type });
	const [apiKey, setApiKey] = React.useState<string>();
	const [baseUrl, setBaseUrl] = React.useState<string | undefined>(defaultSource.defaults.baseUrl);
	const [resourceName, setResourceName] = React.useState<string | undefined>(defaultSource.defaults.resourceName);
	const [project, setProject] = React.useState<string | undefined>(defaultSource.defaults.project);
	const [location, setLocation] = React.useState<string | undefined>(defaultSource.defaults.location);
	const [toolCalls, setToolCalls] = React.useState<boolean | undefined>(defaultSource.defaults.toolCalls);
	const [numCtx, setNumCtx] = React.useState<number | undefined>(defaultSource.defaults.numCtx);
	const [model, setModel] = React.useState<string>(defaultSource.defaults.model);
	const [name, setName] = React.useState<string>(defaultSource.defaults.name);
	const [authMethod, setAuthMethod] = React.useState<string>('apiKey');
	const [showProgress, setShowProgress] = React.useState(false);
	const [errorMessage, setError] = React.useState<string>();

	useEffect(() => {
		setSource(defaultSource);
		setAuthMethod(defaultSource.defaults.oauth ? 'oauth' : 'apiKey')
	}, [defaultSource]);

	useEffect(() => {
		const disposables: IDisposable[] = [];
		disposables.push(props.positronAssistantService.onChangeLanguageModelConfig((newConfig) => {
			// find newSource in props.sources and update it
			const index = props.sources.findIndex(source => source.provider.id === newConfig.provider.id);
			const updatedSource = { ...source, supportedOptions: source.supportedOptions, signedIn: newConfig.signedIn };
			if (index >= 0) {
				props.sources[index] = updatedSource;
			}

			// if newSource matches source, update source
			if (source.provider.id === newConfig.provider.id) {
				setSource(updatedSource);
			}

		}));

		return () => { disposables.forEach(d => d.dispose()); }
	}, [props.positronAssistantService, props.sources, source]);

	useEffect(() => {
		setModel(source.defaults.model);
		setName(source.defaults.name);
		setApiKey(source.defaults.apiKey);
		setBaseUrl(source.defaults.baseUrl);
		setResourceName(source.defaults.resourceName);
		setProject(source.defaults.project);
		setLocation(source.defaults.location);
		setToolCalls(source.defaults.toolCalls);
		setNumCtx(source.defaults.numCtx);
	}, [source]);

	useEffect(() => {
		const authMethod = source.defaults.oauth ? 'oauth' : 'apiKey';
		setAuthMethod(authMethod);
	}, [source.defaults.oauth]);

	const authMethodRadioButtons: RadioButtonItem[] = [
		new RadioButtonItem({
			identifier: 'oauth',
			title: localize('positron.newConnectionModalDialog.oauth', "OAuth"),
			disabled: !source.supportedOptions.includes('oauth'),
		}),
		new RadioButtonItem({
			identifier: 'apiKey',
			title: localize('positron.newConnectionModalDialog.apiKey', "API Key"),
			disabled: !source.supportedOptions.includes('apiKey'),
		}),
	];

	const providers = props.sources
		.filter(source => source.type === 'chat' || (source.type === 'completion' && source.provider.id === 'copilot'))
		.sort((a, b) => {
			if (a.provider.id === 'echo' || a.provider.id === 'error') {
				return 1;
			}
			if (b.provider.id === 'echo' || b.provider.id === 'error') {
				return -1;
			}
			return a.provider.displayName.localeCompare(b.provider.displayName);
		})
		.map(source => new DropDownListBoxItem({
			identifier: source.provider.id,
			title: source.provider.displayName,
			value: source,
		}))

	const onAccept = () => {
		if (useNewConfig) {
			props.onClose();
			props.renderer.dispose();
		} else {
			setShowProgress(true);
			setError(undefined);
			props.onAction({
				type: type,
				provider: source.provider.id,
				model: model,
				name: name,
				apiKey: apiKey,
				baseUrl: baseUrl,
				resourceName: resourceName,
				project: project,
				location: location,
				toolCalls: toolCalls,
				numCtx: numCtx,
			}, 'save')
				.catch((e) => {
					setError(e.message);
				}).finally(() => {
					setShowProgress(false);
					props.onClose();
					props.renderer.dispose();
				});
		}
	}

	const onSignIn = async () => {
		if (!source) {
			return;
		}
		setShowProgress(true);
		setError(undefined);
		if (providerConfig) {
			if (authMethod === 'apiKey') {
				props.onAction(
					providerConfig,
					source.signedIn ? 'delete' : 'save')
					.catch((e) => {
						setError(e.message);
					}).finally(() => {
						setShowProgress(false);
					});
			} else {
				props.onAction(
					providerConfig,
					source.signedIn ? 'oauth-signout' : 'oauth-signin')
					.catch((e) => {
						setError(e.message);
					}).finally(() => {
						setShowProgress(false);
					});
			}
		} else {
			setShowProgress(false);
			setError(localize('positron.newConnectionModalDialog.incompleteConfig', 'The configuration is incomplete.'));
		}
	}
	const onCancel = async () => {
		props.onCancel();
		props.renderer.dispose();
	}

	function oldDialog() {
		return <OKCancelModalDialog
			cancelButtonTitle={(() => localize('positron.languageModelModalDialog.cancel', "Cancel"))()}
			catchErrors={true}
			height={540}
			okButtonTitle={(() => localize('positron.languageModelModalDialog.save', "Save"))()}
			renderer={props.renderer}
			title={(() => localize('positron.languageModelModalDialog.title', "Add a Language Model Provider"))()}
			width={540}
			onAccept={onAccept}
			onCancel={onCancel}
		>
			<VerticalStack>
				<label>
					{(() => localize('positron.newConnectionModalDialog.type', "Type"))()}
					<DropDownListBox<string, PositronLanguageModelType>
						entries={[
							new DropDownListBoxItem({
								identifier: 'chat',
								title: (() => localize('positron.newConnectionModalDialog.chat', "Chat"))(),
								value: 'chat',
							}),
							new DropDownListBoxItem({
								identifier: 'completion',
								title: (() => localize('positron.newConnectionModalDialog.completion', "Completion"))(),
								value: 'completion',
							})
						]}
						keybindingService={props.keybindingService}
						layoutService={props.layoutService}
						selectedIdentifier={type}
						title={(() => localize('positron.newConnectionModalDialog.selectType', "SelectType"))()}
						onSelectionChanged={(item) => setType(item.options.value)}
					/>
				</label>
				<label>
					{(() => localize('positron.newConnectionModalDialog.provider', "Provider"))()}
					<DropDownListBox
						entries={providers}
						keybindingService={props.keybindingService}
						layoutService={props.layoutService}
						selectedIdentifier={source?.provider.id}
						title={(() => localize('positron.newConnectionModalDialog.selectProvider', "Select Provider"))()}
						onSelectionChanged={(item) => setSource(item.options.value)}
					/>
				</label>

				<LabeledTextInput
					label={(() => localize('positron.newConnectionModalDialog.name', "Name"))()}
					validator={(value) => value ? undefined : localize('positron.newConnectionModalDialog.missingName', 'A model name is required')}
					value={name}
					onChange={e => { setName(e.currentTarget.value) }}
				/>
				<LabeledTextInput
					label={(() => localize('positron.newConnectionModalDialog.model', "Model"))()}
					validator={(value) => value ? undefined : localize('positron.newConnectionModalDialog.missingModel', 'A model is required')}
					value={model}
					onChange={e => { setModel(e.currentTarget.value) }}
				/>
				{source?.supportedOptions.includes('baseUrl') &&
					<LabeledTextInput
						label={(() => localize('positron.newConnectionModalDialog.baseURL', "Base URL"))()}
						value={baseUrl ?? ''}
						onChange={e => { setBaseUrl(e.currentTarget.value) }}
					/>}
				{source?.supportedOptions.includes('project') &&
					<LabeledTextInput
						label={(() => localize('positron.newConnectionModalDialog.project', "Google Cloud Project ID"))()}
						value={project ?? ''}
						onChange={e => { setProject(e.currentTarget.value) }}
					/>}
				{source?.supportedOptions.includes('location') &&
					<LabeledTextInput
						label={(() => localize('positron.newConnectionModalDialog.location', "Google Cloud Location"))()}
						value={location ?? ''}
						onChange={e => { setLocation(e.currentTarget.value) }}
					/>}
				{source?.supportedOptions.includes('resourceName') &&
					<LabeledTextInput
						label={(() => localize('positron.newConnectionModalDialog.resourceName', "Azure resource name"))()}
						value={resourceName ?? ''}
						onChange={e => { setResourceName(e.currentTarget.value) }}
					/>}
				{source?.supportedOptions.includes('apiKey') &&
					<LabeledTextInput
						label={(() => localize('positron.newConnectionModalDialog.apiKey', "API Key"))()}
						type='password'
						validator={(value) => value ? undefined : localize('positron.newConnectionModalDialog.missingApiKey', 'An API key is required')}
						value={apiKey ?? ''}
						onChange={e => { setApiKey(e.currentTarget.value) }}
					/>
				}
				{source?.supportedOptions.includes('numCtx') &&
					<LabeledTextInput
						label={(() => localize('positron.newConnectionModalDialog.numCtx', "Context Window size"))()}
						type='number'
						value={numCtx ?? 2048}
						onChange={e => { setNumCtx(parseInt(e.currentTarget.value)) }}
					/>
				}
				{source?.supportedOptions.includes('toolCalls') &&
					<div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
						<input
							checked={toolCalls}
							id='toolCallsCheckbox'
							type='checkbox'
							onChange={e => { setToolCalls(e.target.checked) }}
						/>
						<label htmlFor='toolCallsCheckbox'>
							{(() => localize('positron.newConnectionModalDialog.toolCalls', "Enable tool calling"))()}
						</label>
					</div>
				}
				{showProgress &&
					<ProgressBar />
				}
			</VerticalStack>
		</OKCancelModalDialog>
	}

	function newDialog() {
		return <OKModalDialog
			height={400}
			okButtonTitle={(() => localize('positron.languageModelModalDialog.done', "Done"))()}
			renderer={props.renderer}
			title={(() => localize('positron.languageModelModalDialog.title', "Add a Language Model Provider"))()}
			width={600}
			onAccept={onAccept}
		>
			<VerticalStack>
				<label className='language-model-section'>
					{(() => localize('positron.newConnectionModalDialog.provider', "Provider"))()}
				</label>
				<div className='language-model button-container'>
					{
						providers.map(provider => {
							return <LanguageModelButton
								key={provider.options.identifier}
								disabled={showProgress}
								displayName={provider.options.title ?? provider.options.identifier}
								identifier={provider.options.identifier}
								selected={provider.options.identifier === source.provider.id}
								onClick={() => {
									setSource(provider.options.value);
									setProviderConfig({ ...provider.options.value, ...provider.options.value.defaults, provider: provider.options.identifier });
									setError(undefined);
								}}
							/>
						})
					}
				</div>
				<label className='language-model-section'>
					{(() => localize('positron.newConnectionModalDialog.authentication', "Authentication"))()}
				</label>
				<div className='language-model-authentication-method-container'>
					<RadioGroup
						entries={authMethodRadioButtons}
						initialSelectionId={authMethod}
						name='authMethod'
						onSelectionChanged={(authMethod) => {
							setAuthMethod(authMethod);
						}}
					/>
				</div>
				<LanguageModelConfigComponent
					provider={providerConfig}
					source={source}
					onChange={(config) => {
						setProviderConfig(config);
					}}
					onSignIn={onSignIn}
					signingIn={showProgress}
				/>
				{showProgress &&
					<ProgressBar />
				}
				{errorMessage &&
					<div className='language-model-error error error-msg'>{errorMessage}</div>
				}
			</VerticalStack>
		</OKModalDialog>;
	}

	if (useNewConfig) {
		return newDialog();
	} else {
		return oldDialog();
	}
}
