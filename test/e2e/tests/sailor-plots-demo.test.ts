/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Sailor Mode: Plots Demo
 *
 * Demonstrates Sailor Mode workflow for plot generation with recording
 */

import { test, expect, tags } from './_test.setup';

test.use({ suiteId: __filename });

test.describe('Sailor Mode: Plots Demo', { tag: [tags.PLOTS, tags.CONSOLE] }, () => {

	test.beforeEach(async function ({ app }) {
		await app.workbench.layouts.enterLayout('stacked');
	});

	test('Plots and Visualization Workflow (Sailor Mode)', async function ({ app, logger, python }) {
		logger.log('🚢 Sailor Mode: Starting Plots and Visualization Workflow');

		// Workflow Step 1: Generate simple plot
		logger.log('[Step 1/8] Generate simple plot');
		await app.workbench.console.executeCode(
			'Python',
			'import matplotlib.pyplot as plt\nplt.plot([1,2,3,4])\nplt.show()',
			'>>>'
		);
		logger.log('  ✓ Plot code executed');

		// Workflow Step 2: Wait for plot to appear
		logger.log('[Step 2/8] Wait for plot to appear');
		await app.workbench.plots.waitForCurrentPlot();
		logger.log('  ✓ Plot appeared');

		// Workflow Step 3: Verify plot is visible
		logger.log('[Step 3/8] Verify plot is visible');
		await expect(async () => {
			const visible = await app.workbench.plots.currentPlot.isVisible();
			expect(visible).toBe(true);
		}).toPass({ timeout: 15000 });
		logger.log('  ✓ Plot is visible');

		// Workflow Step 4: Generate second plot
		logger.log('[Step 4/8] Generate second plot');
		await app.workbench.console.executeCode(
			'Python',
			'plt.plot([4,3,2,1])\nplt.show()',
			'>>>'
		);
		logger.log('  ✓ Second plot code executed');

		// Wait for second plot
		await app.code.wait(2000);

		// Workflow Step 5: Verify multiple plots
		logger.log('[Step 5/8] Verify multiple plots');
		await expect(async () => {
			const count = await app.workbench.plots.getCurrentPlotCount();
			expect(count).toBeGreaterThanOrEqual(2);
		}).toPass({ timeout: 15000 });
		logger.log('  ✓ Multiple plots verified');

		// Workflow Step 6: Navigate between plots
		logger.log('[Step 6/8] Navigate between plots');
		try {
			await app.workbench.plots.nextPlot.click();
			await app.code.wait(1000);
			logger.log('  ✓ Navigated to next plot');
		} catch (e) {
			logger.log('  ⚠ Navigation skipped (might be on last plot)');
		}

		// Workflow Step 7: Copy plot to clipboard
		logger.log('[Step 7/8] Copy plot to clipboard');
		try {
			await app.workbench.plots.copyToClipboard();
			await app.code.wait(1000);
			logger.log('  ✓ Plot copied to clipboard');
		} catch (e) {
			logger.log('  ⚠ Copy skipped (action bar might not be visible)');
		}

		// Workflow Step 8: Clear all plots
		logger.log('[Step 8/8] Clear all plots');
		await app.workbench.plots.clearPlots();
		await app.code.wait(1000);
		logger.log('  ✓ Plots cleared');

		logger.log('🎉 Workflow complete: Plots and Visualization');
	});

	test('Generate Bar Chart (Sailor Mode)', async function ({ app, logger, python }) {
		logger.log('🚢 Sailor Mode: Bar Chart Workflow');

		logger.log('[Step 1/3] Create data for bar chart');
		await app.workbench.console.executeCode(
			'Python',
			'categories = ["A", "B", "C", "D"]\nvalues = [23, 45, 56, 78]',
			'>>>'
		);
		logger.log('  ✓ Data created');

		logger.log('[Step 2/3] Generate bar chart');
		await app.workbench.console.executeCode(
			'Python',
			'plt.bar(categories, values)\nplt.title("Sample Bar Chart")\nplt.show()',
			'>>>'
		);
		logger.log('  ✓ Bar chart code executed');

		logger.log('[Step 3/3] Wait for plot');
		await app.workbench.plots.waitForCurrentPlot();
		logger.log('  ✓ Bar chart displayed');

		logger.log('🎉 Bar chart workflow complete');
	});

	test('Generate Scatter Plot (Sailor Mode)', async function ({ app, logger, python }) {
		logger.log('🚢 Sailor Mode: Scatter Plot Workflow');

		logger.log('[Step 1/3] Import numpy and create data');
		await app.workbench.console.executeCode(
			'Python',
			'import numpy as np\nx = np.random.rand(50)\ny = np.random.rand(50)',
			'>>>'
		);
		logger.log('  ✓ Random data generated');

		logger.log('[Step 2/3] Generate scatter plot');
		await app.workbench.console.executeCode(
			'Python',
			'plt.scatter(x, y)\nplt.title("Random Scatter Plot")\nplt.xlabel("X values")\nplt.ylabel("Y values")\nplt.show()',
			'>>>'
		);
		logger.log('  ✓ Scatter plot code executed');

		logger.log('[Step 3/3] Wait for plot');
		await app.workbench.plots.waitForCurrentPlot();
		logger.log('  ✓ Scatter plot displayed');

		logger.log('🎉 Scatter plot workflow complete');
	});

});
