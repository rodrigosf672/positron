/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Example: Sailor Mode with Recording
 *
 * This example demonstrates how to use the SailorRecorder
 * during autonomous workflow execution.
 */

import { test, expect } from '@playwright/test';
import { SailorRecorder } from './recorder';
import config from './config.json';
import workflows from './workflows.json';

test.describe('Sailor Mode with Recording Example', () => {
	test('should execute workflow with recording', async ({ page }) => {
		// Generate session ID
		const sessionId = `sailor_${new Date().toISOString().replace(/[:.]/g, '_')}`;

		// Initialize recorder
		const recorder = new SailorRecorder(config.recording, sessionId);

		// Start recording
		await recorder.startRecording(page);

		try {
			// Navigate to application
			await page.goto('https://example.com');

			// Execute workflow steps
			const workflow = workflows.workflows['python-development'];

			for (let i = 0; i < workflow.steps.length; i++) {
				const step = workflow.steps[i];

				try {
					// Record the step
					await recorder.recordStep(
						page,
						workflow.name,
						i + 1,
						step.name,
						step.pageObject,
						step.method
					);

					// Execute the step using page objects
					// Example: await app.workbench[step.pageObject][step.method](...step.params);

					// Validate step success
					// Example: await expect(page.locator('.success')).toBeVisible();

					console.log(`✓ Step ${i + 1}/${workflow.steps.length}: ${step.name}`);

				} catch (error) {
					// Record error
					await recorder.recordError(
						page,
						workflow.name,
						i + 1,
						error.message
					);

					// Attempt self-healing
					console.log(`→ Self-healing attempt for step ${i + 1}`);

					try {
						// Try healing strategy
						await recorder.recordHealing(
							page,
							workflow.name,
							'Retry with longer timeout'
						);

						// Retry with increased timeout
						await page.waitForTimeout(5000);
						// Retry step execution here

						console.log(`✓ Step ${i + 1} healed successfully`);

						// Record discovery
						await recorder.recordDiscovery(
							page,
							workflow.name,
							`Step "${step.name}" needs additional wait time`
						);

					} catch (healingError) {
						console.error(`✗ Healing failed for step ${i + 1}`);
						throw healingError;
					}
				}
			}

			console.log('\n✓ Workflow completed successfully');

		} finally {
			// Stop recording and generate report
			const reportPath = await recorder.stopRecording(page);

			console.log('\n╔════════════════════════════════════════════════════════╗');
			console.log('║           Recording Complete                           ║');
			console.log('╚════════════════════════════════════════════════════════╝');
			console.log(`\nSession ID: ${sessionId}`);
			console.log(`Report: ${reportPath}`);
			console.log(`\nOpen report with:`);
			console.log(`  open ${reportPath}`);
		}
	});
});

/**
 * Integration with Sailor Mode Skill
 *
 * The positron-sailor-mode skill should integrate the recorder as follows:
 *
 * 1. Load configuration and workflows
 * 2. Initialize SailorRecorder with session ID
 * 3. Start recording before workflow execution
 * 4. For each workflow step:
 *    - Record step with recordStep()
 *    - Execute step using page objects
 *    - On error: recordError() + attempt healing
 *    - On success: continue
 *    - On discovery: recordDiscovery()
 *    - On healing: recordHealing()
 * 5. Stop recording after all workflows complete
 * 6. Report path to user
 *
 * Benefits:
 * - Visual documentation of autonomous navigation
 * - Easy debugging of failures
 * - Demonstration material for stakeholders
 * - Timeline analysis for performance optimization
 * - Video recordings for presentations
 */
