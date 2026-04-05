/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Sailor Mode Workflow Executor
 *
 * Executes POM-based workflows with recording and self-healing
 */

import { test, expect } from '@playwright/test';
import { Application } from '../application';
import { SailorRecorder } from './recorder';
import config from './config.json';
import workflows from './workflows.json';
import * as fs from 'fs';
import * as path from 'path';

interface WorkflowStep {
	name: string;
	pageObject: string;
	method: string;
	params: any[];
	validation?: {
		type: string;
		pageObject: string;
		method: string;
		params: any[];
	};
}

interface Workflow {
	name: string;
	description: string;
	requiredFixtures: string[];
	estimatedDuration: string;
	steps: WorkflowStep[];
}

interface WorkflowGroup {
	[key: string]: string[];
}

export class SailorExecutor {
	private recorder?: SailorRecorder;
	private sessionId: string;
	private healingAttempts: Map<string, number> = new Map();

	constructor(sessionId?: string) {
		this.sessionId = sessionId || `sailor_${new Date().toISOString().replace(/[:.]/g, '_')}`;
	}

	/**
	 * Execute a workflow group
	 */
	async executeWorkflowGroup(
		app: Application,
		groupName: string
	): Promise<void> {
		const workflowGroups: WorkflowGroup = (workflows as any)['workflow-groups'];

		if (!workflowGroups[groupName]) {
			throw new Error(`Workflow group not found: ${groupName}`);
		}

		const workflowNames = workflowGroups[groupName];
		console.log(`\n╔════════════════════════════════════════════════════════════╗`);
		console.log(`║      Sailor Mode: ${groupName}                            ║`);
		console.log(`╚════════════════════════════════════════════════════════════╝\n`);
		console.log(`Workflows to execute: ${workflowNames.join(', ')}\n`);

		// Initialize recorder if enabled
		if (config.recording.enabled) {
			this.recorder = new SailorRecorder(config.recording, this.sessionId);
			await this.recorder.startRecording(app.workbench.code.page);
		}

		for (const workflowName of workflowNames) {
			await this.executeWorkflow(app, workflowName);
		}

		// Stop recording
		if (this.recorder) {
			const reportPath = await this.recorder.stopRecording(app.workbench.code.page);
			console.log(`\n📹 Recording saved: ${reportPath}`);
		}
	}

	/**
	 * Execute a single workflow
	 */
	async executeWorkflow(
		app: Application,
		workflowName: string
	): Promise<void> {
		const workflowDef: Workflow = (workflows.workflows as any)[workflowName];

		if (!workflowDef) {
			throw new Error(`Workflow not found: ${workflowName}`);
		}

		console.log(`\n[Workflow] ${workflowDef.name}`);
		console.log(`Description: ${workflowDef.description}`);
		console.log(`Estimated duration: ${workflowDef.estimatedDuration}`);
		console.log(`Steps: ${workflowDef.steps.length}\n`);

		for (let i = 0; i < workflowDef.steps.length; i++) {
			const step = workflowDef.steps[i];
			await this.executeStep(app, workflowDef.name, i + 1, step);
		}

		console.log(`✓ Workflow complete: ${workflowDef.name}\n`);
	}

	/**
	 * Execute a single step
	 */
	private async executeStep(
		app: Application,
		workflowName: string,
		stepNumber: number,
		step: WorkflowStep
	): Promise<void> {
		const stepId = `${workflowName}:${stepNumber}`;

		try {
			console.log(`[${stepNumber}] ${step.name}`);

			// Record step if recorder enabled
			if (this.recorder) {
				await this.recorder.recordStep(
					app.workbench.code.page,
					workflowName,
					stepNumber,
					step.name,
					step.pageObject,
					step.method
				);
			}

			// Get page object
			const pageObject = this.getPageObject(app, step.pageObject);

			// Execute method
			const method = (pageObject as any)[step.method];
			if (typeof method !== 'function') {
				throw new Error(`Method not found: ${step.pageObject}.${step.method}`);
			}

			await method.apply(pageObject, step.params);

			// Execute validation if specified
			if (step.validation) {
				const validationPO = this.getPageObject(app, step.validation.pageObject);
				const validationMethod = (validationPO as any)[step.validation.method];

				if (typeof validationMethod !== 'function') {
					throw new Error(`Validation method not found: ${step.validation.pageObject}.${step.validation.method}`);
				}

				await validationMethod.apply(validationPO, step.validation.params);
			}

			console.log(`  ✓ Success\n`);

		} catch (error: any) {
			console.error(`  ✗ Failed: ${error.message}\n`);

			// Record error
			if (this.recorder) {
				await this.recorder.recordError(
					app.workbench.code.page,
					workflowName,
					stepNumber,
					error.message
				);
			}

			// Attempt self-healing if enabled
			if (config.selfHealing.enabled) {
				const healed = await this.attemptHealing(
					app,
					workflowName,
					stepNumber,
					step,
					error,
					stepId
				);

				if (!healed) {
					throw error; // Re-throw if healing failed
				}
			} else {
				throw error;
			}
		}
	}

	/**
	 * Attempt to self-heal a failed step
	 */
	private async attemptHealing(
		app: Application,
		workflowName: string,
		stepNumber: number,
		step: WorkflowStep,
		error: Error,
		stepId: string
	): Promise<boolean> {
		const attempts = this.healingAttempts.get(stepId) || 0;

		if (attempts >= config.selfHealing.maxHealingAttempts) {
			console.log(`  → Max healing attempts reached (${attempts})`);
			return false;
		}

		this.healingAttempts.set(stepId, attempts + 1);

		// Try each healing strategy
		for (const strategy of config.selfHealing.strategies) {
			console.log(`  → Healing attempt ${attempts + 1}/${config.selfHealing.maxHealingAttempts}: ${strategy}`);

			// Record healing attempt
			if (this.recorder) {
				await this.recorder.recordHealing(
					app.workbench.code.page,
					workflowName,
					strategy
				);
			}

			try {
				switch (strategy) {
					case 'retry-with-wait':
						await app.workbench.code.page.waitForTimeout(5000);
						await this.executeStepWithoutRecording(app, step);
						console.log(`  ✓ Healed with: ${strategy}\n`);
						return true;

					case 'find-alternative-selector':
						// This would require alternative selectors in the workflow definition
						// For now, just retry with longer timeout
						await app.workbench.code.page.waitForTimeout(10000);
						await this.executeStepWithoutRecording(app, step);
						console.log(`  ✓ Healed with: ${strategy}\n`);
						return true;

					case 'use-alternative-method':
						// This would require alternative methods in the workflow definition
						// For now, skip this strategy
						continue;

					case 'navigate-via-different-path':
						// This would require alternative navigation paths
						// For now, skip this strategy
						continue;

					case 'restart-session':
						// This would restart the Python/R session
						// Complex to implement, skip for now
						continue;

					case 'reset-to-known-state':
						// Close any open modals, dialogs
						await app.workbench.code.page.keyboard.press('Escape');
						await app.workbench.code.page.waitForTimeout(1000);
						await this.executeStepWithoutRecording(app, step);
						console.log(`  ✓ Healed with: ${strategy}\n`);
						return true;

					default:
						continue;
				}
			} catch (healingError) {
				// This strategy didn't work, try next one
				continue;
			}
		}

		console.log(`  ✗ All healing strategies failed\n`);
		return false;
	}

	/**
	 * Execute step without recording (for healing retries)
	 */
	private async executeStepWithoutRecording(
		app: Application,
		step: WorkflowStep
	): Promise<void> {
		const pageObject = this.getPageObject(app, step.pageObject);
		const method = (pageObject as any)[step.method];

		if (typeof method !== 'function') {
			throw new Error(`Method not found: ${step.pageObject}.${step.method}`);
		}

		await method.apply(pageObject, step.params);

		if (step.validation) {
			const validationPO = this.getPageObject(app, step.validation.pageObject);
			const validationMethod = (validationPO as any)[step.validation.method];
			await validationMethod.apply(validationPO, step.validation.params);
		}
	}

	/**
	 * Get page object from app
	 */
	private getPageObject(app: Application, poName: string): any {
		// Map page object names to actual objects
		const poMap: { [key: string]: any } = {
			'console': app.workbench.console,
			'variables': app.workbench.variables,
			'dataExplorer': app.workbench.positronDataExplorer,
			'sessions': app.workbench.positronConsole,
			'plots': app.workbench.positronPlots,
			'viewer': app.workbench.positronViewer,
			'connections': app.workbench.positronConnections,
			'help': app.workbench.positronHelp,
			'notebooks': app.workbench.notebooks,
			// Add more as needed
		};

		const po = poMap[poName];
		if (!po) {
			throw new Error(`Page object not found: ${poName}`);
		}

		return po;
	}

	/**
	 * Generate report
	 */
	async generateReport(
		workflowsExecuted: string[],
		successCount: number,
		failureCount: number
	): Promise<void> {
		const reportDir = path.join(__dirname, 'reports');
		fs.mkdirSync(reportDir, { recursive: true });

		const reportPath = path.join(reportDir, `${this.sessionId}.txt`);
		const report = `
Sailor Mode Session Report
===========================
Session ID: ${this.sessionId}
Date: ${new Date().toISOString()}

Summary
-------
Workflows executed: ${workflowsExecuted.length}
Successful: ${successCount}
Failed: ${failureCount}
Success rate: ${(successCount / (successCount + failureCount) * 100).toFixed(1)}%

Workflows
---------
${workflowsExecuted.map((w, i) => `${i + 1}. ${w}`).join('\n')}

Recording
---------
${this.recorder ? `Recording saved to: recordings/${this.sessionId}/` : 'Recording disabled'}

`;

		fs.writeFileSync(reportPath, report);
		console.log(`\n📄 Report saved: ${reportPath}`);
	}
}

// Export for use in tests
export function createSailorExecutor(sessionId?: string): SailorExecutor {
	return new SailorExecutor(sessionId);
}
