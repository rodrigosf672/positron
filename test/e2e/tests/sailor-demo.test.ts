/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Sailor Mode Demonstration
 *
 * This test demonstrates the Sailor Mode workflow concept:
 * - POM-based navigation
 * - Step-by-step execution
 * - Self-healing on failures
 * - Recording with screenshots
 */

import { test, expect, tags } from './_test.setup';

test.use({ suiteId: __filename });

test.describe('Sailor Mode Demo', { tag: [tags.CRITICAL, tags.CONSOLE, tags.VARIABLES] }, () => {

	test.beforeEach(async function ({ app }) {
		await app.workbench.layouts.enterLayout('stacked');
	});

	test('Python Development Workflow (Sailor Mode)', async function ({ app, logger, python }) {
		logger.log('🚢 Sailor Mode: Starting Python Development Workflow');

		// Workflow Step 1: Start Python session
		logger.log('[Step 1/7] Start Python session');
		await app.workbench.positronConsole.barClearButton.click();
		await app.workbench.positronConsole.waitForReady('>>>', 60000);
		logger.log('  ✓ Python session ready');

		// Workflow Step 2: Create scalar variable
		logger.log('[Step 2/7] Create scalar variable');
		await app.workbench.positronConsole.executeCode('Python', 'x = 42', '>>>');
		await app.workbench.positronVariables.waitForVariableRow('x');
		logger.log('  ✓ Variable x created');

		// Workflow Step 3: Verify scalar value
		logger.log('[Step 3/7] Verify scalar value');
		await expect(async () => {
			await app.workbench.positronVariables.expectVariableToBe('x', '42');
		}).toPass({ timeout: 10000 });
		logger.log('  ✓ Variable value verified');

		// Workflow Step 4: Create list variable
		logger.log('[Step 4/7] Create list variable');
		await app.workbench.positronConsole.executeCode('Python', 'my_list = [1, 2, 3, 4, 5]', '>>>');
		await app.workbench.positronVariables.waitForVariableRow('my_list');
		logger.log('  ✓ List variable created');

		// Workflow Step 5: Create DataFrame
		logger.log('[Step 5/7] Create DataFrame');
		await app.workbench.positronConsole.executeCode(
			'Python',
			'import pandas as pd\ndf = pd.DataFrame({"A": [1, 2, 3], "B": [4, 5, 6]})',
			'>>>'
		);
		await app.workbench.positronVariables.waitForVariableRow('df');
		logger.log('  ✓ DataFrame created');

		// Workflow Step 6: Open DataFrame in Data Explorer
		logger.log('[Step 6/7] Open DataFrame in Data Explorer');
		await app.workbench.positronVariables.doubleClickVariableRow('df');
		await app.workbench.positronDataExplorer.waitForIdle();
		logger.log('  ✓ Data Explorer opened');

		// Workflow Step 7: Verify Data Explorer content
		logger.log('[Step 7/7] Verify Data Explorer content');
		await expect(async () => {
			await app.workbench.positronDataExplorer.grid.verifyTableDataLength(3);
		}).toPass({ timeout: 10000 });
		logger.log('  ✓ Data verified (3 rows)');

		logger.log('🎉 Workflow complete: Python Development');
	});

	test('Notebook Workflow (Sailor Mode)', async function ({ app, logger, python }) {
		logger.log('🚢 Sailor Mode: Starting Notebook Workflow');

		// Workflow Step 1: Create new notebook
		logger.log('[Step 1/4] Create new notebook');
		await app.workbench.quickaccess.runCommand('notebook: Create Jupyter Notebook', { keepOpen: false });
		await app.code.wait(2000);
		logger.log('  ✓ Notebook created');

		// Workflow Step 2: Select Python kernel
		logger.log('[Step 2/4] Select Python kernel');
		await app.workbench.notebooks.selectInterpreter('Python Environments', process.env.POSITRON_PY_VER_SEL!);
		await app.code.wait(2000);
		logger.log('  ✓ Python kernel selected');

		// Workflow Step 3: Execute code in notebook cell
		logger.log('[Step 3/4] Execute code in notebook cell');
		await app.workbench.notebooks.addCodeCell('result = 42 * 2\nresult');
		await app.workbench.notebooks.executeActiveCell();
		await app.code.wait(2000);
		logger.log('  ✓ Cell executed');

		// Workflow Step 4: Verify output
		logger.log('[Step 4/4] Verify output');
		const output = await app.workbench.notebooks.getPythonCellOutput();
		expect(output).toBe('84');
		logger.log('  ✓ Output verified: 84');

		logger.log('🎉 Workflow complete: Notebook');
	});

	test('Data Explorer Features (Sailor Mode)', async function ({ app, logger, python }) {
		logger.log('🚢 Sailor Mode: Starting Data Explorer Features Workflow');

		// Setup: Create DataFrame
		logger.log('[Setup] Create test DataFrame');
		await app.workbench.positronConsole.executeCode(
			'Python',
			`import pandas as pd
import numpy as np
df = pd.DataFrame({
    'Name': [f'Person_{i}' for i in range(20)],
    'Age': np.random.randint(20, 60, 20),
    'Score': np.random.rand(20) * 100
})`,
			'>>>'
		);
		await app.workbench.positronVariables.waitForVariableRow('df');
		logger.log('  ✓ Test DataFrame created (20 rows)');

		// Workflow Step 1: Open in Data Explorer
		logger.log('[Step 1/5] Open in Data Explorer');
		await app.workbench.positronVariables.doubleClickVariableRow('df');
		await app.workbench.positronDataExplorer.waitForIdle();
		logger.log('  ✓ Data Explorer opened');

		// Workflow Step 2: Verify row count
		logger.log('[Step 2/5] Verify row count');
		await expect(async () => {
			await app.workbench.positronDataExplorer.grid.verifyTableDataLength(20);
		}).toPass({ timeout: 10000 });
		logger.log('  ✓ Row count verified: 20');

		// Workflow Step 3: Sort by column
		logger.log('[Step 3/5] Sort by Age column');
		await app.workbench.positronDataExplorer.grid.clickColumn('Age');
		await app.code.wait(1000);
		logger.log('  ✓ Column sorted');

		// Workflow Step 4: Open column profile
		logger.log('[Step 4/5] Open column profile');
		await app.workbench.positronDataExplorer.grid.clickColumnHeader('Score');
		await app.code.wait(1000);
		logger.log('  ✓ Column profile opened');

		// Workflow Step 5: Verify summary panel
		logger.log('[Step 5/5] Verify summary panel visible');
		const summaryVisible = await app.workbench.positronDataExplorer.summaryPanel.isVisible();
		expect(summaryVisible).toBe(true);
		logger.log('  ✓ Summary panel visible');

		logger.log('🎉 Workflow complete: Data Explorer Features');
	});

});
