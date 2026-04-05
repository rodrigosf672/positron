/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Sailor Mode Recording Utility
 *
 * Captures screenshots, videos, and traces during autonomous navigation
 */

import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface RecordingConfig {
	enabled: boolean;
	mode: 'full' | 'steps-only' | 'errors-only';
	outputDirectory: string;
	screenshots: {
		enabled: boolean;
		intervalSeconds: number;
		captureOnStep: boolean;
		captureOnError: boolean;
		captureOnDiscovery: boolean;
		fullPage: boolean;
		quality: number;
	};
	video: {
		enabled: boolean;
		fps: number;
		format: string;
		quality: string;
	};
	annotations: {
		enabled: boolean;
		showStepNumbers: boolean;
		showTimestamps: boolean;
		highlightElements: boolean;
	};
	timeline: {
		enabled: boolean;
		includeScreenshots: boolean;
		includePageObjects: boolean;
		includeTimings: boolean;
	};
}

interface RecordingEntry {
	timestamp: number;
	step: number;
	workflow: string;
	action: string;
	pageObject?: string;
	method?: string;
	screenshot?: string;
	status: 'success' | 'failure' | 'healing';
	duration?: number;
	annotation?: string;
}

export class SailorRecorder {
	private config: RecordingConfig;
	private sessionId: string;
	private recordingDir: string;
	private screenshotsDir: string;
	private timeline: RecordingEntry[] = [];
	private intervalHandle?: NodeJS.Timeout;
	private currentStep: number = 0;
	private startTime: number;
	private screenshotCounter: number = 0;

	constructor(config: RecordingConfig, sessionId: string) {
		this.config = config;
		this.sessionId = sessionId;
		this.startTime = Date.now();

		// Create recording directories
		this.recordingDir = path.join(config.outputDirectory, sessionId);
		this.screenshotsDir = path.join(this.recordingDir, 'screenshots');

		fs.mkdirSync(this.screenshotsDir, { recursive: true });
	}

	/**
	 * Start recording with automatic screenshot capture
	 */
	async startRecording(page: Page): Promise<void> {
		if (!this.config.enabled) return;

		console.log(`[Recorder] Starting recording: ${this.sessionId}`);

		// Start interval-based screenshots
		if (this.config.screenshots.enabled && this.config.screenshots.intervalSeconds > 0) {
			this.intervalHandle = setInterval(async () => {
				await this.captureScreenshot(page, 'interval', 'auto');
			}, this.config.screenshots.intervalSeconds * 1000);
		}

		// Add timeline entry
		this.addTimelineEntry({
			timestamp: Date.now(),
			step: 0,
			workflow: 'initialization',
			action: 'Recording started',
			status: 'success'
		});
	}

	/**
	 * Stop recording and generate artifacts
	 */
	async stopRecording(page: Page): Promise<string> {
		if (!this.config.enabled) return '';

		console.log(`[Recorder] Stopping recording: ${this.sessionId}`);

		// Stop interval screenshots
		if (this.intervalHandle) {
			clearInterval(this.intervalHandle);
		}

		// Final screenshot
		await this.captureScreenshot(page, 'final', 'Session complete');

		// Add timeline entry
		this.addTimelineEntry({
			timestamp: Date.now(),
			step: this.currentStep,
			workflow: 'finalization',
			action: 'Recording stopped',
			status: 'success',
			duration: Date.now() - this.startTime
		});

		// Generate artifacts
		await this.generateTimeline();

		if (this.config.video.enabled) {
			await this.generateVideo();
		}

		// Generate HTML report
		const reportPath = await this.generateHTMLReport();

		console.log(`[Recorder] Recording saved: ${this.recordingDir}`);
		return reportPath;
	}

	/**
	 * Capture screenshot at specific moment
	 */
	async captureScreenshot(
		page: Page,
		type: 'step' | 'error' | 'discovery' | 'interval' | 'final',
		annotation?: string
	): Promise<string | null> {
		if (!this.config.screenshots.enabled) return null;

		try {
			this.screenshotCounter++;
			const timestamp = Date.now();
			const filename = `${String(this.screenshotCounter).padStart(5, '0')}_${type}_${timestamp}.png`;
			const filepath = path.join(this.screenshotsDir, filename);

			await page.screenshot({
				path: filepath,
				fullPage: this.config.screenshots.fullPage,
				quality: this.config.screenshots.quality,
			});

			// Add annotation if enabled
			if (this.config.annotations.enabled && annotation) {
				await this.annotateScreenshot(filepath, annotation, type);
			}

			return filepath;
		} catch (error) {
			console.error(`[Recorder] Failed to capture screenshot: ${error}`);
			return null;
		}
	}

	/**
	 * Record a workflow step
	 */
	async recordStep(
		page: Page,
		workflow: string,
		step: number,
		action: string,
		pageObject?: string,
		method?: string
	): Promise<void> {
		this.currentStep = step;

		// Capture screenshot if enabled
		let screenshot: string | null = null;
		if (this.config.screenshots.captureOnStep) {
			screenshot = await this.captureScreenshot(
				page,
				'step',
				`Step ${step}: ${action}`
			);
		}

		// Add to timeline
		this.addTimelineEntry({
			timestamp: Date.now(),
			step,
			workflow,
			action,
			pageObject,
			method,
			screenshot: screenshot || undefined,
			status: 'success'
		});
	}

	/**
	 * Record an error
	 */
	async recordError(
		page: Page,
		workflow: string,
		step: number,
		error: string
	): Promise<void> {
		// Always capture screenshot on error
		const screenshot = await this.captureScreenshot(
			page,
			'error',
			`ERROR: ${error}`
		);

		this.addTimelineEntry({
			timestamp: Date.now(),
			step,
			workflow,
			action: `Error: ${error}`,
			screenshot: screenshot || undefined,
			status: 'failure'
		});
	}

	/**
	 * Record a discovery
	 */
	async recordDiscovery(
		page: Page,
		workflow: string,
		discovery: string
	): Promise<void> {
		let screenshot: string | null = null;
		if (this.config.screenshots.captureOnDiscovery) {
			screenshot = await this.captureScreenshot(
				page,
				'discovery',
				`Discovery: ${discovery}`
			);
		}

		this.addTimelineEntry({
			timestamp: Date.now(),
			step: this.currentStep,
			workflow,
			action: `Discovery: ${discovery}`,
			screenshot: screenshot || undefined,
			status: 'success',
			annotation: discovery
		});
	}

	/**
	 * Record healing attempt
	 */
	async recordHealing(
		page: Page,
		workflow: string,
		strategy: string
	): Promise<void> {
		const screenshot = await this.captureScreenshot(
			page,
			'error',
			`Healing: ${strategy}`
		);

		this.addTimelineEntry({
			timestamp: Date.now(),
			step: this.currentStep,
			workflow,
			action: `Self-healing: ${strategy}`,
			screenshot: screenshot || undefined,
			status: 'healing'
		});
	}

	/**
	 * Add entry to timeline
	 */
	private addTimelineEntry(entry: RecordingEntry): void {
		if (this.config.timeline.enabled) {
			this.timeline.push(entry);
		}
	}

	/**
	 * Annotate screenshot with text overlay
	 */
	private async annotateScreenshot(
		filepath: string,
		text: string,
		type: string
	): Promise<void> {
		if (!this.config.annotations.enabled) return;

		try {
			// Use ImageMagick to add annotation
			// This requires ImageMagick to be installed
			const timestamp = new Date().toLocaleTimeString();
			const stepNumber = this.config.annotations.showStepNumbers
				? `Step ${this.currentStep}`
				: '';
			const timeDisplay = this.config.annotations.showTimestamps
				? timestamp
				: '';

			const annotation = [stepNumber, timeDisplay, text]
				.filter(Boolean)
				.join(' | ');

			// Simple annotation using ImageMagick (if available)
			try {
				execSync(
					`convert "${filepath}" -gravity North -pointsize 20 -fill white -stroke black -strokewidth 2 -annotate +0+10 "${annotation}" "${filepath}"`,
					{ stdio: 'ignore' }
				);
			} catch {
				// ImageMagick not available, skip annotation
			}
		} catch (error) {
			// Annotation failed, continue without it
		}
	}

	/**
	 * Generate timeline JSON
	 */
	private async generateTimeline(): Promise<void> {
		if (!this.config.timeline.enabled) return;

		const timelinePath = path.join(this.recordingDir, 'timeline.json');
		fs.writeFileSync(timelinePath, JSON.stringify(this.timeline, null, 2));

		// Also generate CSV for easy analysis
		const csvPath = path.join(this.recordingDir, 'timeline.csv');
		const csv = this.timelineToCSV();
		fs.writeFileSync(csvPath, csv);
	}

	/**
	 * Convert timeline to CSV
	 */
	private timelineToCSV(): string {
		const headers = ['Timestamp', 'Step', 'Workflow', 'Action', 'PageObject', 'Method', 'Status', 'Duration', 'Screenshot'];
		const rows = this.timeline.map(entry => [
			new Date(entry.timestamp).toISOString(),
			entry.step,
			entry.workflow,
			entry.action,
			entry.pageObject || '',
			entry.method || '',
			entry.status,
			entry.duration || '',
			entry.screenshot ? path.basename(entry.screenshot) : ''
		]);

		return [headers, ...rows].map(row => row.join(',')).join('\n');
	}

	/**
	 * Generate video from screenshots
	 */
	private async generateVideo(): Promise<void> {
		if (!this.config.video.enabled) return;

		const videoPath = path.join(this.recordingDir, `sailor-session-${this.sessionId}.mp4`);

		try {
			console.log('[Recorder] Generating video from screenshots...');

			// Use ffmpeg to create video from screenshots
			// Requires ffmpeg to be installed
			execSync(
				`ffmpeg -framerate ${this.config.video.fps} -pattern_type glob -i '${this.screenshotsDir}/*.png' -c:v libx264 -pix_fmt yuv420p "${videoPath}"`,
				{ stdio: 'inherit' }
			);

			console.log(`[Recorder] Video generated: ${videoPath}`);
		} catch (error) {
			console.error('[Recorder] Failed to generate video (ffmpeg required)');
			console.error('[Recorder] Install with: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)');
		}
	}

	/**
	 * Generate HTML report with embedded screenshots
	 */
	private async generateHTMLReport(): Promise<string> {
		const reportPath = path.join(this.recordingDir, 'report.html');

		const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sailor Mode Recording - ${this.sessionId}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #1e1e1e;
            color: #d4d4d4;
            padding: 20px;
        }
        .container { max-width: 1400px; margin: 0 auto; }
        header {
            background: #2d2d2d;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        h1 { color: #61dafb; margin-bottom: 10px; }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background: #252526;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #61dafb;
        }
        .stat-value { font-size: 32px; font-weight: bold; color: #61dafb; }
        .stat-label { color: #858585; margin-top: 5px; }
        .timeline {
            background: #2d2d2d;
            padding: 30px;
            border-radius: 8px;
        }
        .timeline-entry {
            display: grid;
            grid-template-columns: 80px 150px 1fr 400px;
            gap: 20px;
            padding: 20px;
            margin: 10px 0;
            background: #252526;
            border-radius: 8px;
            border-left: 4px solid #858585;
            align-items: start;
        }
        .timeline-entry.success { border-left-color: #4ec9b0; }
        .timeline-entry.failure { border-left-color: #f48771; }
        .timeline-entry.healing { border-left-color: #dcdcaa; }
        .step-number {
            font-size: 24px;
            font-weight: bold;
            color: #858585;
        }
        .timestamp {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #858585;
        }
        .action-details h3 {
            color: #61dafb;
            margin-bottom: 8px;
        }
        .action-text { color: #d4d4d4; margin: 5px 0; }
        .page-object {
            font-family: 'Courier New', monospace;
            color: #4ec9b0;
            font-size: 12px;
        }
        .screenshot-container {
            position: relative;
        }
        .screenshot {
            width: 100%;
            border-radius: 4px;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .screenshot:hover { transform: scale(1.05); }
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            margin-top: 8px;
        }
        .status-badge.success { background: #4ec9b0; color: #000; }
        .status-badge.failure { background: #f48771; color: #000; }
        .status-badge.healing { background: #dcdcaa; color: #000; }
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        .modal.active { display: flex; }
        .modal-content {
            max-width: 90%;
            max-height: 90%;
        }
        .close-modal {
            position: absolute;
            top: 20px;
            right: 40px;
            font-size: 40px;
            color: white;
            cursor: pointer;
        }
        .video-container {
            margin: 30px 0;
            text-align: center;
        }
        video {
            max-width: 100%;
            border-radius: 8px;
        }
        .download-links {
            margin: 20px 0;
        }
        .download-btn {
            display: inline-block;
            padding: 10px 20px;
            background: #61dafb;
            color: #000;
            text-decoration: none;
            border-radius: 6px;
            margin: 5px;
            font-weight: bold;
        }
        .download-btn:hover { background: #4fa8c5; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🚢 Sailor Mode Recording</h1>
            <p>Session ID: ${this.sessionId}</p>
            <p>Duration: ${this.formatDuration(Date.now() - this.startTime)}</p>

            <div class="download-links">
                <a href="timeline.json" download class="download-btn">📄 Download Timeline (JSON)</a>
                <a href="timeline.csv" download class="download-btn">📊 Download Timeline (CSV)</a>
                ${this.config.video.enabled ? '<a href="sailor-session-' + this.sessionId + '.mp4" download class="download-btn">🎥 Download Video</a>' : ''}
            </div>
        </header>

        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">${this.timeline.length}</div>
                <div class="stat-label">Total Steps</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.timeline.filter(e => e.status === 'success').length}</div>
                <div class="stat-label">Successful</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.timeline.filter(e => e.status === 'failure').length}</div>
                <div class="stat-label">Failures</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.timeline.filter(e => e.status === 'healing').length}</div>
                <div class="stat-label">Self-Heals</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.screenshotCounter}</div>
                <div class="stat-label">Screenshots</div>
            </div>
        </div>

        ${this.config.video.enabled ? this.generateVideoSection() : ''}

        <div class="timeline">
            <h2>Timeline</h2>
            ${this.timeline.map((entry, index) => this.generateTimelineEntryHTML(entry, index)).join('')}
        </div>
    </div>

    <div id="modal" class="modal" onclick="closeModal()">
        <span class="close-modal">&times;</span>
        <img id="modal-image" class="modal-content">
    </div>

    <script>
        function openModal(src) {
            document.getElementById('modal').classList.add('active');
            document.getElementById('modal-image').src = src;
        }
        function closeModal() {
            document.getElementById('modal').classList.remove('active');
        }
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    </script>
</body>
</html>
`;

		fs.writeFileSync(reportPath, html);
		return reportPath;
	}

	private generateVideoSection(): string {
		return `
        <div class="video-container">
            <h2>Session Video</h2>
            <video controls>
                <source src="sailor-session-${this.sessionId}.mp4" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        </div>
        `;
	}

	private generateTimelineEntryHTML(entry: RecordingEntry, index: number): string {
		const relativeTime = this.formatDuration(entry.timestamp - this.startTime);
		const timestamp = new Date(entry.timestamp).toLocaleTimeString();

		return `
        <div class="timeline-entry ${entry.status}">
            <div class="step-number">
                ${entry.step > 0 ? `#${entry.step}` : '⚙️'}
            </div>
            <div class="timestamp">
                <div>${timestamp}</div>
                <div>+${relativeTime}</div>
            </div>
            <div class="action-details">
                <h3>${entry.workflow}</h3>
                <div class="action-text">${entry.action}</div>
                ${entry.pageObject ? `<div class="page-object">POM: ${entry.pageObject}.${entry.method || ''}</div>` : ''}
                <span class="status-badge ${entry.status}">${entry.status.toUpperCase()}</span>
            </div>
            ${entry.screenshot ? `
            <div class="screenshot-container">
                <img src="screenshots/${path.basename(entry.screenshot)}"
                     alt="Screenshot ${index}"
                     class="screenshot"
                     onclick="openModal(this.src)">
            </div>
            ` : '<div></div>'}
        </div>
        `;
	}

	private formatDuration(ms: number): string {
		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);

		if (hours > 0) {
			return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
		} else if (minutes > 0) {
			return `${minutes}m ${seconds % 60}s`;
		} else {
			return `${seconds}s`;
		}
	}
}

// CLI interface
if (require.main === module) {
	console.log('Sailor Mode Recorder');
	console.log('This utility is used by the Sailor Mode skill to record sessions.');
	console.log('Usage: Import and use the SailorRecorder class in your automation scripts.');
}
