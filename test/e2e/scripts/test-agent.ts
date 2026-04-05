#!/usr/bin/env node
/**
 * Autonomous Test Agent for Positron E2E Tests
 *
 * This agent monitors CI runs, detects failures, analyzes them,
 * applies fixes, and updates documentation automatically.
 *
 * Usage:
 *   npm run test-agent -- monitor    # Start CI monitoring
 *   npm run test-agent -- heal <test-file>  # Fix specific test
 *   npm run test-agent -- analyze <log-file>  # Analyze failure log
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const CONFIG_PATH = path.join(__dirname, '../.claude-test-agent.config.json');
const POM_DOC_PATH = '/Users/rodrigosilvaferreira/POSITRON_POM_DOCUMENTATION.md';

interface AgentConfig {
    monitoring: {
        enabled: boolean;
        checkIntervalSeconds: number;
        autoHealOnFailure: boolean;
    };
    healing: {
        enabled: boolean;
        maxAttempts: number;
        strategies: string[];
    };
    documentation: {
        autoUpdate: boolean;
        pomDocPath: string;
        commitChanges: boolean;
    };
}

interface FailureAnalysis {
    type: 'timeout' | 'selector-not-found' | 'assertion-failed' | 'race-condition' | 'unknown';
    testFile: string;
    testName: string;
    errorMessage: string;
    stackTrace: string;
    suggestedFixes: string[];
    pageObjectsInvolved: string[];
}

class TestAgent {
    private config: AgentConfig;
    private logFile: string;

    constructor() {
        this.config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
        this.logFile = path.join(__dirname, '../.agent-logs/test-agent.log');
        this.ensureLogDirectory();
    }

    private ensureLogDirectory() {
        const logDir = path.dirname(this.logFile);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    }

    private log(message: string, level: 'info' | 'error' | 'warn' = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
        console.log(logMessage.trim());
        fs.appendFileSync(this.logFile, logMessage);
    }

    /**
     * Monitor CI runs and auto-heal failures
     */
    async monitorCI() {
        this.log('Starting CI monitoring...');

        if (!this.config.monitoring.enabled) {
            this.log('CI monitoring is disabled in config', 'warn');
            return;
        }

        while (true) {
            try {
                // Check latest CI runs
                const runs = this.getLatestCIRuns();

                for (const run of runs) {
                    if (run.status === 'failure' && this.config.monitoring.autoHealOnFailure) {
                        this.log(`Detected failure in run ${run.id}: ${run.name}`);
                        await this.healCIFailure(run);
                    }
                }

                // Wait before next check
                await this.sleep(this.config.monitoring.checkIntervalSeconds * 1000);
            } catch (error) {
                this.log(`Error in monitoring loop: ${error}`, 'error');
                await this.sleep(60000); // Wait 1 minute on error
            }
        }
    }

    /**
     * Get latest CI runs from GitHub Actions
     */
    private getLatestCIRuns(): Array<{ id: string; name: string; status: string; url: string }> {
        try {
            const output = execSync(
                'gh run list --workflow="E2E Tests" --json databaseId,name,status,conclusion,url --limit 5',
                { encoding: 'utf-8' }
            );

            const runs = JSON.parse(output);
            return runs.map((run: any) => ({
                id: run.databaseId.toString(),
                name: run.name,
                status: run.conclusion || run.status,
                url: run.url
            }));
        } catch (error) {
            this.log(`Failed to fetch CI runs: ${error}`, 'error');
            return [];
        }
    }

    /**
     * Analyze and heal a CI failure
     */
    private async healCIFailure(run: { id: string; name: string; url: string }) {
        this.log(`Analyzing failure in run ${run.id}...`);

        try {
            // Download failure logs
            const logs = this.downloadCILogs(run.id);

            // Analyze failures
            const failures = this.analyzeFailureLogs(logs);

            if (failures.length === 0) {
                this.log('No actionable failures found', 'warn');
                return;
            }

            // Attempt to heal each failure
            for (const failure of failures) {
                await this.healTestFailure(failure);
            }

        } catch (error) {
            this.log(`Failed to heal CI failure: ${error}`, 'error');
        }
    }

    /**
     * Download CI logs for a specific run
     */
    private downloadCILogs(runId: string): string {
        try {
            this.log(`Downloading logs for run ${runId}...`);
            const output = execSync(`gh run view ${runId} --log`, { encoding: 'utf-8' });
            return output;
        } catch (error) {
            this.log(`Failed to download logs: ${error}`, 'error');
            return '';
        }
    }

    /**
     * Analyze failure logs and extract structured failure information
     */
    private analyzeFailureLogs(logs: string): FailureAnalysis[] {
        const failures: FailureAnalysis[] = [];

        // Extract Playwright test failures
        const failurePattern = /●.*?\.test\.ts.*?\n([\s\S]*?)(?=●|$)/g;
        const matches = logs.matchAll(failurePattern);

        for (const match of matches) {
            const failureText = match[0];

            // Extract test file and name
            const testFileMatch = failureText.match(/([\w-]+\.test\.ts)/);
            const testNameMatch = failureText.match(/● (.*?) ›/);

            if (!testFileMatch || !testNameMatch) continue;

            // Classify failure type
            let type: FailureAnalysis['type'] = 'unknown';
            let suggestedFixes: string[] = [];

            if (failureText.includes('Timeout') || failureText.includes('exceeded')) {
                type = 'timeout';
                suggestedFixes = [
                    'Increase timeout value',
                    'Add explicit wait condition',
                    'Verify element selector is correct'
                ];
            } else if (failureText.includes('not found') || failureText.includes('not visible')) {
                type = 'selector-not-found';
                suggestedFixes = [
                    'Update selector in page object',
                    'Add wait for element to appear',
                    'Check if UI structure changed'
                ];
            } else if (failureText.includes('Expected') || failureText.includes('toBe')) {
                type = 'assertion-failed';
                suggestedFixes = [
                    'Update test expectation',
                    'Verify application behavior',
                    'Add intermediate state verification'
                ];
            }

            // Extract page objects involved
            const pageObjectsInvolved: string[] = [];
            const pomPattern = /app\.workbench\.(\w+)/g;
            const pomMatches = failureText.matchAll(pomPattern);
            for (const pom of pomMatches) {
                if (!pageObjectsInvolved.includes(pom[1])) {
                    pageObjectsInvolved.push(pom[1]);
                }
            }

            failures.push({
                type,
                testFile: testFileMatch[1],
                testName: testNameMatch[1],
                errorMessage: failureText.split('\n')[0],
                stackTrace: failureText,
                suggestedFixes,
                pageObjectsInvolved
            });
        }

        return failures;
    }

    /**
     * Attempt to heal a specific test failure
     */
    private async healTestFailure(failure: FailureAnalysis): Promise<boolean> {
        this.log(`Healing failure in ${failure.testFile}: ${failure.testName}`);
        this.log(`Failure type: ${failure.type}`);

        if (!this.config.healing.enabled) {
            this.log('Auto-healing is disabled', 'warn');
            return false;
        }

        // Read the test file
        const testFilePath = this.findTestFile(failure.testFile);
        if (!testFilePath) {
            this.log(`Could not find test file: ${failure.testFile}`, 'error');
            return false;
        }

        const testContent = fs.readFileSync(testFilePath, 'utf-8');

        // Apply healing strategies based on failure type
        let healedContent = testContent;
        let healed = false;

        switch (failure.type) {
            case 'timeout':
                healed = this.healTimeoutFailure(failure, testContent);
                break;
            case 'selector-not-found':
                healed = this.healSelectorFailure(failure, testContent);
                break;
            case 'assertion-failed':
                healed = this.healAssertionFailure(failure, testContent);
                break;
            default:
                this.log(`No healing strategy for failure type: ${failure.type}`, 'warn');
        }

        if (healed) {
            this.log(`Successfully applied fix for ${failure.testFile}`);

            // Update POM documentation if needed
            if (this.config.documentation.autoUpdate) {
                this.updatePOMDocumentation(failure);
            }

            return true;
        }

        return false;
    }

    /**
     * Heal timeout failures by increasing timeouts or adding waits
     */
    private healTimeoutFailure(failure: FailureAnalysis, testContent: string): boolean {
        this.log('Applying timeout healing strategy...');

        // This is a placeholder - in real implementation, Claude would:
        // 1. Identify the failing line
        // 2. Increase timeout or add proper wait
        // 3. Write the updated file

        this.log('NOTE: Timeout healing requires Claude analysis', 'warn');
        this.log(`Analysis needed for: ${failure.testFile}`);
        this.log(`Error: ${failure.errorMessage}`);
        this.log(`Suggested fixes: ${failure.suggestedFixes.join(', ')}`);

        return false;
    }

    /**
     * Heal selector not found failures by updating selectors
     */
    private healSelectorFailure(failure: FailureAnalysis, testContent: string): boolean {
        this.log('Applying selector healing strategy...');

        this.log('NOTE: Selector healing requires Claude analysis', 'warn');
        this.log(`Page objects involved: ${failure.pageObjectsInvolved.join(', ')}`);

        return false;
    }

    /**
     * Heal assertion failures by updating expectations
     */
    private healAssertionFailure(failure: FailureAnalysis, testContent: string): boolean {
        this.log('Applying assertion healing strategy...');

        this.log('NOTE: Assertion healing requires Claude analysis', 'warn');

        return false;
    }

    /**
     * Update POM documentation based on learnings from failures
     */
    private updatePOMDocumentation(failure: FailureAnalysis) {
        this.log('Updating POM documentation...');

        // This would be handled by Claude to:
        // 1. Read the POM doc
        // 2. Find relevant section
        // 3. Add notes about common failure patterns
        // 4. Update best practices

        this.log(`Documentation update needed for: ${failure.pageObjectsInvolved.join(', ')}`);
    }

    /**
     * Find test file in the test directory
     */
    private findTestFile(filename: string): string | null {
        const possiblePaths = [
            path.join(__dirname, '../tests', filename),
            path.join(__dirname, '../tests/console', filename),
            path.join(__dirname, '../tests/notebooks', filename),
            path.join(__dirname, '../tests/variables', filename),
            // Add more directories as needed
        ];

        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                return p;
            }
        }

        return null;
    }

    /**
     * Sleep for specified milliseconds
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// CLI Interface
const command = process.argv[2];
const agent = new TestAgent();

switch (command) {
    case 'monitor':
        agent.monitorCI().catch(console.error);
        break;
    case 'heal':
        const testFile = process.argv[3];
        if (!testFile) {
            console.error('Usage: test-agent heal <test-file>');
            process.exit(1);
        }
        console.log(`Healing test: ${testFile}`);
        console.log('Note: This requires Claude to analyze and fix the test');
        break;
    case 'analyze':
        const logFile = process.argv[3];
        if (!logFile) {
            console.error('Usage: test-agent analyze <log-file>');
            process.exit(1);
        }
        console.log(`Analyzing log file: ${logFile}`);
        break;
    default:
        console.log('Positron E2E Test Agent');
        console.log('');
        console.log('Commands:');
        console.log('  monitor    Start CI monitoring and auto-healing');
        console.log('  heal       Heal a specific test file');
        console.log('  analyze    Analyze a failure log');
        console.log('');
        console.log('Examples:');
        console.log('  npm run test-agent -- monitor');
        console.log('  npm run test-agent -- heal my-test.test.ts');
        console.log('  npm run test-agent -- analyze failure.log');
}
