/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2025 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { test, tags } from '../_test.setup';
import { expect } from '@playwright/test';

test.use({
	suiteId: __filename
});

test.describe('Notebook: Ghost Cell Keyboard Shortcut', {
	tag: [tags.WIN, tags.WEB, tags.POSITRON_NOTEBOOKS]
}, () => {
	test.beforeAll(async function ({ app, settings }) {
		await app.workbench.notebooksPositron.enablePositronNotebooks(settings);
	});

	test.afterEach(async function ({ hotKeys }) {
		await hotKeys.closeAllEditors();
	});

	test('Cmd+Shift+G triggers "Generating suggestion..." message', async function ({ app, page }) {
		const { notebooksPositron } = app.workbench;
		const keyboard = page.keyboard;

		await notebooksPositron.newNotebook({ codeCells: 2 });
		await notebooksPositron.addCodeToCell(0, 'import pandas as pd\ndf = pd.read_csv("data.csv")', { run: false });
		await notebooksPositron.addCodeToCell(1, 'df_clean = df.dropna()', { run: false });
		await notebooksPositron.selectCellAtIndex(1, { editMode: false });

		const isMac = process.platform === 'darwin';
		const modifier = isMac ? 'Meta' : 'Control';
		await keyboard.press(`${modifier}+Shift+KeyG`);

		// Verify "Generating suggestion..." appears
		const generatingSuggestion = page.locator('text=Generating suggestion...');
		await expect(generatingSuggestion).toBeVisible({ timeout: 5000 });
	});

	test('Ghost cell appears with header, code preview, and footer', async function ({ app, page }) {
		const { notebooksPositron } = app.workbench;
		const keyboard = page.keyboard;

		await notebooksPositron.newNotebook({ codeCells: 2 });
		await notebooksPositron.addCodeToCell(0, 'import pandas as pd\ndf = pd.read_csv("data.csv")', { run: false });
		await notebooksPositron.addCodeToCell(1, 'df_clean = df.dropna()', { run: false });
		await notebooksPositron.selectCellAtIndex(1, { editMode: false });

		const isMac = process.platform === 'darwin';
		const modifier = isMac ? 'Meta' : 'Control';
		await keyboard.press(`${modifier}+Shift+KeyG`);

		// Wait for ghost cell to appear
		const ghostCellHeader = page.locator('.ghost-cell-header');
		await expect(ghostCellHeader).toBeVisible({ timeout: 30000 });

		// Verify ghost cell header components
		await expect(page.locator('.ghost-cell-explanation-text')).toBeVisible();
		await expect(page.locator('.ghost-cell-mode-toggle')).toBeVisible();
		await expect(page.locator('.ghost-cell-accept')).toBeVisible();
		await expect(page.locator('.ghost-cell-dismiss')).toBeVisible();
		await expect(page.locator('.ghost-cell-regenerate')).toBeVisible();

		// Verify code preview
		const codePreview = page.locator('.ghost-cell-code-preview');
		await expect(codePreview).toBeVisible();
		await expect(page.locator('.ghost-cell-code-text')).toBeVisible();

		// Verify footer
		const ghostCellFooter = page.locator('.ghost-cell-footer');
		await expect(ghostCellFooter).toBeVisible();
		await expect(page.locator('.ghost-cell-info-button')).toBeVisible();
		await expect(page.locator('.ghost-cell-model-info')).toBeVisible();
	});

	test('Default mode is Automatic', async function ({ app, page }) {
		const { notebooksPositron } = app.workbench;
		const keyboard = page.keyboard;

		await notebooksPositron.newNotebook({ codeCells: 2 });
		await notebooksPositron.addCodeToCell(0, 'import pandas as pd\ndf = pd.read_csv("data.csv")', { run: false });
		await notebooksPositron.addCodeToCell(1, 'df_clean = df.dropna()', { run: false });
		await notebooksPositron.selectCellAtIndex(1, { editMode: false });

		const isMac = process.platform === 'darwin';
		const modifier = isMac ? 'Meta' : 'Control';
		await keyboard.press(`${modifier}+Shift+KeyG`);

		await expect(page.locator('.ghost-cell-header')).toBeVisible({ timeout: 30000 });

		// Verify Automatic mode is highlighted
		const automaticButton = page.locator('.ghost-cell-mode-toggle .toggle-button.left.highlighted');
		await expect(automaticButton).toBeVisible();
		await expect(automaticButton).toHaveText('Automatic');
	});

	test('Switch to On-demand mode and Accept and Run', async function ({ app, page }) {
		const { notebooksPositron } = app.workbench;
		const keyboard = page.keyboard;

		await notebooksPositron.newNotebook({ codeCells: 2 });
		await notebooksPositron.addCodeToCell(0, 'import pandas as pd\ndf = pd.read_csv("data.csv")', { run: false });
		await notebooksPositron.addCodeToCell(1, 'df_clean = df.dropna()', { run: false });
		await notebooksPositron.selectCellAtIndex(1, { editMode: false });

		const isMac = process.platform === 'darwin';
		const modifier = isMac ? 'Meta' : 'Control';
		await keyboard.press(`${modifier}+Shift+KeyG`);

		await expect(page.locator('.ghost-cell-header')).toBeVisible({ timeout: 30000 });

		// Click to switch to On-demand mode
		const toggleButton = page.locator('.ghost-cell-mode-toggle .toggle-container');
		await toggleButton.click();

		// Verify On-demand is now highlighted
		const onDemandButton = page.locator('.ghost-cell-mode-toggle .toggle-button.right.highlighted');
		await expect(onDemandButton).toBeVisible();
		await expect(onDemandButton).toHaveText('On-demand');

		// Click Accept and Run
		const acceptButton = page.locator('.ghost-cell-accept .split-button-main');
		await acceptButton.click();

		// Verify cell is generated and executed (cell count increases)
		const initialCount = 2;
		await expect(notebooksPositron.cell).toHaveCount(initialCount + 1, { timeout: 5000 });
	});

	test('On-demand mode shows "AI suggestion available on request"', async function ({ app, page }) {
		const { notebooksPositron } = app.workbench;
		const keyboard = page.keyboard;

		await notebooksPositron.newNotebook({ codeCells: 2 });
		await notebooksPositron.addCodeToCell(0, 'import pandas as pd\ndf = pd.read_csv("data.csv")', { run: false });
		await notebooksPositron.addCodeToCell(1, 'df_clean = df.dropna()', { run: false });
		await notebooksPositron.selectCellAtIndex(1, { editMode: false });

		const isMac = process.platform === 'darwin';
		const modifier = isMac ? 'Meta' : 'Control';
		await keyboard.press(`${modifier}+Shift+KeyG`);

		await expect(page.locator('.ghost-cell-header')).toBeVisible({ timeout: 30000 });

		// Switch to On-demand and accept
		await page.locator('.ghost-cell-mode-toggle .toggle-container').click();
		await page.locator('.ghost-cell-accept .split-button-main').click();
		await page.waitForTimeout(2000);

		// Verify "AI suggestion available on request" appears
		const awaitingRequest = page.locator('.ghost-cell-awaiting-request');
		await expect(awaitingRequest).toBeVisible({ timeout: 10000 });
		await expect(page.locator('.ghost-cell-awaiting-text')).toHaveText('AI suggestion available on request');

		// Verify Get Suggestion button is present
		const getSuggestionButton = page.locator('.ghost-cell-get-suggestion');
		await expect(getSuggestionButton).toBeVisible();
		await expect(getSuggestionButton).toHaveText('Get Suggestion');

		// Verify Dismiss button is present
		await expect(page.locator('.ghost-cell-dismiss-button')).toBeVisible();

		// Verify mode toggle still shows On-demand
		await expect(page.locator('.ghost-cell-mode-toggle .toggle-button.right.highlighted')).toHaveText('On-demand');
	});

	test('Click "Get Suggestion" triggers "Generating suggestion..." again', async function ({ app, page }) {
		const { notebooksPositron } = app.workbench;
		const keyboard = page.keyboard;

		await notebooksPositron.newNotebook({ codeCells: 2 });
		await notebooksPositron.addCodeToCell(0, 'import pandas as pd\ndf = pd.read_csv("data.csv")', { run: false });
		await notebooksPositron.addCodeToCell(1, 'df_clean = df.dropna()', { run: false });
		await notebooksPositron.selectCellAtIndex(1, { editMode: false });

		const isMac = process.platform === 'darwin';
		const modifier = isMac ? 'Meta' : 'Control';
		await keyboard.press(`${modifier}+Shift+KeyG`);

		await expect(page.locator('.ghost-cell-header')).toBeVisible({ timeout: 30000 });

		// Switch to On-demand and accept
		await page.locator('.ghost-cell-mode-toggle .toggle-container').click();
		await page.locator('.ghost-cell-accept .split-button-main').click();
		await page.waitForTimeout(2000);

		// Wait for "AI suggestion available on request"
		await expect(page.locator('.ghost-cell-awaiting-request')).toBeVisible({ timeout: 10000 });

		// Click "Get Suggestion"
		const getSuggestionButton = page.locator('.ghost-cell-get-suggestion');
		await getSuggestionButton.click();

		// Verify "Generating suggestion..." appears again
		const generatingSuggestion = page.locator('text=Generating suggestion...');
		await expect(generatingSuggestion).toBeVisible({ timeout: 5000 });
	});
});
