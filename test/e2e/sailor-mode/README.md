# 🚢 Positron Sailor Mode - POM-Based Autonomous Testing

Sailor Mode is an autonomous testing system that navigates and tests Positron systematically using the Page Object Model. Unlike random exploratory testing, Sailor Mode follows structured workflows and validates expected behavior at each step.

## What is Sailor Mode?

Sailor Mode "sails" through Positron features following pre-defined workflows (user journeys), validating behavior, detecting issues, self-healing when stuck, and automatically generating regression tests and updating documentation.

### Key Differences from Regular Testing

| Aspect | Traditional Testing | Sailor Mode |
|--------|---------------------|-------------|
| **Navigation** | Manual test scripts | Autonomous using POMs |
| **Coverage** | What you explicitly test | Systematic workflow execution |
| **Failures** | Test fails, you fix | Self-heals and continues |
| **Documentation** | Manual updates | Automatic POM updates |
| **Test Creation** | Write tests manually | Generates tests from successful workflows |
| **Discovery** | Manual observation | Records discoveries automatically |

## How It Works

```
┌──────────────┐
│ Load POMs &  │
│  Workflows   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│Execute Step  │◄─────┐
│using POM     │      │
└──────┬───────┘      │
       │              │
       ▼              │
┌──────────────┐      │
│ Validate     │      │
│ Outcome      │      │
└──────┬───────┘      │
       │              │
     ┌─┴─┐            │
     │OK?│            │
     └─┬─┘            │
       │              │
   ┌───┴───┐          │
   │Failure│          │
   └───┬───┘          │
       │              │
       ▼              │
┌──────────────┐      │
│ Self-Heal    │      │
│ (retry, alt  │      │
│  selector,   │      │
│  etc.)       │      │
└──────┬───────┘      │
       │              │
    Healed?───────────┘
       │
       ▼
┌──────────────┐
│Generate Test │
│Update POMs   │
│Record Result │
└──────────────┘
```

## Installation & Setup

### Prerequisites

1. Claude Code CLI installed
2. Sailor Mode skill installed (already at `~/.claude/skills/positron-sailor-mode.md`)
3. POM documentation at `/Users/rodrigosilvaferreira/POSITRON_POM_DOCUMENTATION.md`

### Verify Setup

```bash
cd ~/positron-1/test/e2e/sailor-mode

# Check sailor script
./sailor.sh help

# Check workflows defined
cat workflows.json | jq '.workflows | keys'

# Check config
cat config.json | jq '.modes'
```

## Quick Start

### Example 1: Deep Dive on Data Explorer

```bash
cd ~/positron-1/test/e2e/sailor-mode

# Start deep dive
./sailor.sh deep-dive data-explorer
```

**What happens:**
1. Loads all Data Explorer workflows
2. Executes each workflow step-by-step using POMs
3. Validates expected behavior
4. Self-heals on failures
5. Generates regression tests
6. Updates POM documentation with discoveries
7. Creates comprehensive report

**Output:**
```
╔════════════════════════════════════════════════════════════╗
║      Positron Sailor Mode - Autonomous Testing            ║
╚════════════════════════════════════════════════════════════╝

Starting Deep Dive on: data-explorer
Estimated duration: 3600s

[00:00] Loading POM documentation...
[00:05] Found 50 page objects
[00:10] Loading workflows...
[00:15] Found 8 Data Explorer workflows

[00:20] Workflow 1/8: Open DataFrame in Data Explorer
[00:35] ✓ Step 1/5: Create DataFrame
[00:50] ✓ Step 2/5: Open in Data Explorer
[01:05] ✓ Step 3/5: Verify grid content
[01:20] ✓ Step 4/5: Test column sorting
[01:35] ✓ Step 5/5: Test row filtering
[01:40] ✓ Test generated: data-explorer-basic.test.ts

[01:45] Workflow 2/8: Column Filtering
[02:00] ✓ Step 1/6: Open DataFrame
[02:15] ✓ Step 2/6: Apply filter
[02:30] ✗ Step 3/6: Verify filtered rows (timeout)
[02:35] → Self-healing: Increasing timeout
[02:50] ✓ Step 3/6: Verify filtered rows (healed)
[03:00] → Discovery: Filter operations need 60s timeout
[03:05] → Updating POM documentation
[03:10] ✓ Remaining steps completed
[03:15] ✓ Test generated: data-explorer-filtering.test.ts

... continues through all workflows ...

Session Complete!
=================
Duration: 58 minutes
Workflows: 8/8 ✓
Tests generated: 8
POM updates: 3
Bugs found: 1
Self-healing success: 100%

Report saved to: sailor-mode/reports/20260403_143052.html
```

### Example 2: User Journey

```bash
# Execute Python development workflow
./sailor.sh user-journey python-development
```

**What happens:**
Executes the complete Python development workflow:
1. Start Python session
2. Create variables
3. Execute code
4. Open DataFrame in Data Explorer
5. Generate plots
6. Test debugging

Validates each step and generates a regression test.

### Example 3: Stress Test

```bash
# Stress test for 1 hour
./sailor.sh stress-test --duration 3600
```

**What happens:**
- Tests with large datasets (100K+ rows)
- Long-running computations
- Multiple concurrent sessions
- Memory-intensive operations
- Reports performance issues

## Operational Modes

### 1. Deep Dive Mode

**Purpose**: Exhaustive testing of a single feature

**Usage:**
```bash
./sailor.sh deep-dive <feature-name>
```

**Features:**
- Tests all workflows related to the feature
- Tests edge cases
- Tests keyboard shortcuts
- Tests context menus
- Generates comprehensive coverage

**Best for:**
- New feature validation
- Regression testing after changes
- Finding edge case bugs

### 2. User Journey Mode

**Purpose**: Follow typical user workflows end-to-end

**Usage:**
```bash
# Single workflow
./sailor.sh user-journey python-development

# Workflow group
./sailor.sh user-journey --workflows quick-smoke
```

**Features:**
- Follows real user patterns
- Validates happy paths
- Tests feature integration
- Ensures smooth user experience

**Best for:**
- Smoke testing
- Pre-release validation
- User experience testing

### 3. Stress Test Mode

**Purpose**: Test system under load and edge cases

**Usage:**
```bash
./sailor.sh stress-test --duration 3600
```

**Features:**
- Large dataset operations
- Long-running computations
- Concurrent sessions
- Memory-intensive operations
- Performance monitoring

**Best for:**
- Performance testing
- Stability testing
- Finding resource leaks

### 4. Regression Mode

**Purpose**: Re-run previously failed scenarios

**Usage:**
```bash
./sailor.sh regression
```

**Features:**
- Loads previous failures
- Re-executes scenarios
- Validates fixes
- Checks for regressions

**Best for:**
- After bug fixes
- Before releases
- Validation testing

### 5. Fuzzing Mode

**Purpose**: Test unexpected inputs and edge cases

**Usage:**
```bash
./sailor.sh fuzzing --duration 1800
```

**Features:**
- Special characters
- Extremely large/small values
- Unicode input
- Malformed data
- Edge cases

**Best for:**
- Finding crashes
- Security testing
- Robustness testing

## Workflow Definitions

Workflows are defined in `workflows.json`:

```json
{
  "workflows": {
    "python-development": {
      "name": "Python Development Workflow",
      "steps": [
        {
          "name": "Start Python session",
          "pageObject": "sessions",
          "method": "start",
          "params": ["python"]
        },
        ...
      ]
    }
  }
}
```

### Available Workflows

View all workflows:
```bash
cat sailor-mode/workflows.json | jq '.workflows | keys'
```

**Included workflows:**
- `python-development` - Complete Python workflow
- `data-explorer-deep-dive` - Comprehensive Data Explorer testing
- `notebook-workflow` - Notebook creation and execution
- `plots-visualization` - Plot generation and manipulation
- `console-stress-test` - Console under load
- `session-management` - Session lifecycle testing
- `debugging-workflow` - Debugging features

### Workflow Groups

Predefined groups for common scenarios:

```bash
# Quick smoke test (fast validation)
./sailor.sh user-journey --workflows quick-smoke

# Data-focused testing
./sailor.sh user-journey --workflows data-focus

# Stress testing
./sailor.sh user-journey --workflows stress

# Comprehensive (all workflows)
./sailor.sh user-journey --workflows comprehensive
```

## Self-Healing

Sailor Mode can recover from failures autonomously:

### Healing Strategies

1. **Retry with Wait**
   ```
   Failure: Element not visible
   Heal: Wait longer, then retry
   ```

2. **Find Alternative Selector**
   ```
   Failure: Selector not found
   Heal: Try alternative selectors from POM
   ```

3. **Use Alternative Method**
   ```
   Failure: Method timed out
   Heal: Use alternative page object method
   ```

4. **Navigate via Different Path**
   ```
   Failure: Can't reach target
   Heal: Navigate via alternative route
   ```

5. **Restart Session**
   ```
   Failure: Session hung
   Heal: Restart interpreter session
   ```

6. **Reset to Known State**
   ```
   Failure: Unknown state
   Heal: Close modals, reset to home
   ```

### Example Self-Healing Session

```
[02:30] ✗ Step: Open DataFrame in Data Explorer (timeout)
[02:35] → Healing attempt 1/5: Retry with longer wait
[02:50] ✗ Still failing
[02:55] → Healing attempt 2/5: Try alternative selector
[03:10] ✗ Still failing
[03:15] → Healing attempt 3/5: Navigate via Variables pane
[03:30] ✓ Success! (healed)
[03:35] → Recording: Alternative navigation path discovered
[03:40] → Updating POM documentation
```

## Test Generation

Sailor Mode automatically generates regression tests from successful workflows.

### Generated Test Structure

```typescript
import { test, expect } from './_test.setup';

test.use({ suiteId: __filename });

test.describe('[Workflow Name]', () => {
    test('should complete [workflow] successfully', async ({ app, fixtures }) => {
        // Auto-generated from Sailor Mode execution
        
        await test.step('[Step 1 Name]', async () => {
            await app.workbench.[pageObject].[method](...params);
            // Validation
        });
        
        await test.step('[Step 2 Name]', async () => {
            await app.workbench.[pageObject].[method](...params);
            // Validation
        });
        
        // ... all steps
    });
});
```

### Generated Test Location

```
test/e2e/tests/sailor-generated/
├── python-development.test.ts
├── data-explorer-deep-dive.test.ts
├── notebook-workflow.test.ts
└── ...
```

### Running Generated Tests

```bash
# Run all sailor-generated tests
npx playwright test test/e2e/tests/sailor-generated/ --project e2e-electron

# Run specific generated test
npx playwright test test/e2e/tests/sailor-generated/data-explorer-deep-dive.test.ts
```

## Recording System

Sailor Mode includes a comprehensive recording system that captures screenshots, generates videos, and creates interactive reports of the autonomous navigation session.

### Recording Features

1. **Interval-based Screenshots**
   - Automatically captures screenshots every N seconds (default: 2s)
   - Configurable interval in `config.json`

2. **Event-based Screenshots**
   - Step execution (when enabled)
   - Errors (always captured)
   - Discoveries (when enabled)
   - Self-healing attempts (always captured)

3. **Video Generation**
   - Creates MP4 video from screenshots using ffmpeg
   - Configurable frame rate (default: 2 fps)
   - Requires ffmpeg: `brew install ffmpeg` (macOS) or `apt install ffmpeg` (Linux)

4. **Screenshot Annotations**
   - Step numbers overlay
   - Timestamps
   - Action descriptions
   - Requires ImageMagick (optional): `brew install imagemagick`

5. **Timeline Tracking**
   - JSON export with all events
   - CSV export for analysis
   - Includes: timestamps, steps, workflows, actions, page objects, status

6. **Interactive HTML Report**
   - Embedded screenshots with modal viewer
   - Timeline with color-coded status (success/failure/healing)
   - Session statistics
   - Download links for timeline data and video
   - Click screenshots to view full-size

### Recording Configuration

Edit `config.json` to customize recording:

```json
{
  "recording": {
    "enabled": true,
    "mode": "full",
    "screenshots": {
      "enabled": true,
      "intervalSeconds": 2,
      "captureOnStep": true,
      "captureOnError": true,
      "captureOnDiscovery": true,
      "fullPage": true,
      "quality": 90
    },
    "video": {
      "enabled": true,
      "fps": 2,
      "format": "mp4"
    },
    "annotations": {
      "enabled": true,
      "showStepNumbers": true,
      "showTimestamps": true
    },
    "timeline": {
      "enabled": true,
      "includeScreenshots": true,
      "includePageObjects": true,
      "includeTimings": true
    }
  }
}
```

### Recording Output Structure

After a session, recordings are saved to:

```
sailor-mode/recordings/sailor_YYYYMMDD_HHMMSS/
├── report.html              # Interactive HTML report
├── timeline.json            # Complete timeline data
├── timeline.csv             # Timeline in CSV format
├── sailor-session-*.mp4     # Video (if enabled)
└── screenshots/             # All captured screenshots
    ├── 00001_step_*.png
    ├── 00002_interval_*.png
    ├── 00003_error_*.png
    └── ...
```

### Viewing Recordings

```bash
# Open latest HTML report
open sailor-mode/recordings/$(ls -t sailor-mode/recordings/ | head -1)/report.html

# View timeline JSON
cat sailor-mode/recordings/$(ls -t sailor-mode/recordings/ | head -1)/timeline.json | jq

# View timeline CSV
cat sailor-mode/recordings/$(ls -t sailor-mode/recordings/ | head -1)/timeline.csv

# Play video (if generated)
open sailor-mode/recordings/$(ls -t sailor-mode/recordings/ | head -1)/*.mp4
```

### Using the Recorder in Code

```typescript
import { SailorRecorder } from './recorder';

// Initialize recorder
const recorder = new SailorRecorder(config.recording, sessionId);

// Start recording
await recorder.startRecording(page);

// Record workflow steps
await recorder.recordStep(page, 'python-development', 1, 'Start Python', 'sessions', 'start');

// Record errors
await recorder.recordError(page, 'python-development', 2, 'Timeout waiting for console');

// Record discoveries
await recorder.recordDiscovery(page, 'python-development', 'Console takes 5s to initialize');

// Record healing
await recorder.recordHealing(page, 'python-development', 'Retry with longer timeout');

// Stop recording and generate report
const reportPath = await recorder.stopRecording(page);
console.log(`Report: ${reportPath}`);
```

### Recording Modes

Three recording modes available:

1. **full** (default)
   - All screenshots (interval + event-based)
   - Video generation
   - Comprehensive timeline
   - Best for: debugging, demonstrations

2. **steps-only**
   - Screenshots on steps and errors only
   - No interval screenshots
   - Video generation
   - Best for: test documentation, efficiency

3. **errors-only**
   - Screenshots on errors only
   - No video generation
   - Minimal timeline
   - Best for: CI runs, failure analysis

Configure mode in `config.json`:
```json
{
  "recording": {
    "mode": "steps-only"  // or "errors-only"
  }
}
```

### Performance Considerations

- **Full mode**: Generates many screenshots, requires disk space
  - 2s intervals = ~30 screenshots/minute
  - 1-hour session = ~1800 screenshots (~500MB)
  
- **Steps-only mode**: Much lighter
  - Only captures on explicit steps
  - Typical session: 20-50 screenshots (~15MB)
  
- **Errors-only mode**: Minimal overhead
  - Only captures failures
  - Typical session: 0-10 screenshots (~3MB)

### Installation Requirements

**Required:**
- Node.js and Playwright (already installed)

**Optional (for full features):**
- **ffmpeg** for video generation:
  ```bash
  # macOS
  brew install ffmpeg
  
  # Ubuntu/Debian
  sudo apt install ffmpeg
  
  # Windows
  choco install ffmpeg
  ```

- **ImageMagick** for screenshot annotations:
  ```bash
  # macOS
  brew install imagemagick
  
  # Ubuntu/Debian
  sudo apt install imagemagick
  
  # Windows
  choco install imagemagick
  ```

If these tools are not installed, Sailor Mode will:
- Skip video generation (warn user)
- Skip annotations (continue silently)
- Still generate HTML report and timeline

## POM Documentation Updates

Sailor Mode automatically updates the POM documentation with discoveries:

### Types of Updates

1. **Selector Changes**
   ```markdown
   Updated: 2026-04-03
   Selector changed from `.old-selector` to `.new-selector`
   Reason: UI refactoring
   ```

2. **New Patterns**
   ```markdown
   New Pattern: Data Explorer Large Dataset Handling
   For datasets >10K rows, use: waitForIdle({ timeout: 60000 })
   Discovered: 2026-04-03 (Sailor Mode)
   ```

3. **Common Issues**
   ```markdown
   Common Issue: Console Output Delay
   Problem: Multi-line code execution shows delayed output
   Solution: Add 2s wait after execution
   Added: 2026-04-03 (Sailor Mode stress-test)
   ```

4. **Performance Notes**
   ```markdown
   Performance: Data Explorer Sorting
   Large datasets (100K+ rows) take 5-10s to sort
   Use extended timeout: { timeout: 15000 }
   ```

## Reporting

### Report Contents

Each Sailor Mode session generates a comprehensive report:

```
Session Report
==============
Start Time: 2026-04-03 14:30:52
End Time: 2026-04-03 15:28:45
Duration: 57 minutes 53 seconds

Execution Summary
-----------------
Mode: deep-dive
Feature: data-explorer
Workflows Executed: 8
Workflows Successful: 8 (100%)
Total Steps: 64
Successful Steps: 62 (96.9%)
Failed Steps: 2 (3.1%, all healed)

Self-Healing
------------
Healing Attempts: 5
Successful Heals: 5 (100%)
Failed Heals: 0
Strategies Used:
  - Retry with wait: 3
  - Alternative selector: 1
  - Alternative path: 1

Tests Generated
---------------
1. data-explorer-basic.test.ts
2. data-explorer-filtering.test.ts
3. data-explorer-sorting.test.ts
4. data-explorer-summary-panel.test.ts
5. data-explorer-export.test.ts
6. data-explorer-large-dataset.test.ts
7. data-explorer-keyboard-shortcuts.test.ts
8. data-explorer-context-menu.test.ts

POM Updates
-----------
1. Updated Data Explorer sorting timeout
2. Added large dataset handling pattern
3. Updated filter operation selector

Discoveries
-----------
1. Filter operations need extended timeout (60s) for large datasets
2. Summary panel loading slower than expected
3. Column header context menu selector changed

Bugs Found
----------
1. Data Explorer crashes with empty DataFrame
   - Reproduced: Yes
   - Test generated: data-explorer-empty-dataframe-bug.test.ts
   - GitHub issue: #12345 (auto-created)

Performance Notes
-----------------
- Data Explorer sorting: 2-5s for 1K rows, 10-15s for 100K rows
- Filter application: 1-3s typical, 5-10s for complex filters
- Grid rendering: Smooth up to 50K rows, starts lagging beyond

Recommendations
---------------
1. Increase default Data Explorer timeouts for large datasets
2. Add loading indicators for filter operations
3. Investigate empty DataFrame crash
4. Consider virtual scrolling optimization for grids >100K rows
```

### Report Formats

- **HTML**: Interactive report with screenshots
- **JSON**: Machine-readable for CI integration
- **Text**: Simple text format for quick review

### Viewing Reports

```bash
# List recent reports
ls -lt sailor-mode/reports/

# Open latest HTML report
open sailor-mode/reports/$(ls -t sailor-mode/reports/*.html | head -1)

# View text summary
cat sailor-mode/reports/$(ls -t sailor-mode/reports/*.txt | head -1)
```

## Advanced Usage

### Custom Workflows

Create your own workflow:

```bash
# Edit workflows.json
vim sailor-mode/workflows.json
```

Add your workflow:
```json
{
  "my-custom-workflow": {
    "name": "My Custom Workflow",
    "description": "Test my specific scenario",
    "requiredFixtures": ["app", "python"],
    "steps": [
      {
        "name": "My first step",
        "pageObject": "console",
        "method": "executeCode",
        "params": ["Python", "print('hello')"]
      }
    ]
  }
}
```

Execute it:
```bash
./sailor.sh user-journey my-custom-workflow
```

### Resume from Checkpoint

Sailor Mode saves checkpoints every 5 minutes:

```bash
# Resume from last checkpoint
./sailor.sh --resume
```

### View Session History

```bash
# List all sessions
./sailor.sh list-sessions

# View specific session
./sailor.sh view-session 20260403_143052
```

### Integration with CI

Run Sailor Mode in CI:

```yaml
# .github/workflows/sailor-mode.yml
name: Sailor Mode Autonomous Testing

on:
  schedule:
    - cron: '0 2 * * *'  # Run nightly at 2 AM
  workflow_dispatch:

jobs:
  sailor-mode:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Sailor Mode
        run: |
          cd test/e2e/sailor-mode
          ./sailor.sh user-journey --workflows comprehensive
      
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: sailor-mode-report
          path: test/e2e/sailor-mode/reports/
      
      - name: Upload generated tests
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: generated-tests
          path: test/e2e/tests/sailor-generated/
```

## Troubleshooting

### Sailor Mode Not Starting

**Problem**: Script fails to start

**Solutions**:
```bash
# Check dependencies
which claude
ls ~/.claude/skills/positron-sailor-mode.md

# Check config
cat sailor-mode/config.json | jq

# Check workflows
cat sailor-mode/workflows.json | jq '.workflows | keys'
```

### Self-Healing Not Working

**Problem**: Failures not being healed

**Solutions**:
```bash
# Check config
cat sailor-mode/config.json | jq '.selfHealing'

# Ensure healing is enabled
vim sailor-mode/config.json
# Set "enabled": true

# Check logs
tail -f sailor-mode/logs/sailor.log
```

### Tests Not Being Generated

**Problem**: No tests in `sailor-generated/` directory

**Solutions**:
```bash
# Check test generation config
cat sailor-mode/config.json | jq '.testGeneration'

# Ensure enabled
vim sailor-mode/config.json
# Set "enabled": true

# Check output directory exists
mkdir -p test/e2e/tests/sailor-generated
```

### POM Documentation Not Updating

**Problem**: No updates to POM docs

**Solutions**:
```bash
# Check config
cat sailor-mode/config.json | jq '.discovery'

# Ensure auto-update enabled
vim sailor-mode/config.json
# Set "updatePOMDocumentation": true

# Check POM doc path
ls -la /Users/rodrigosilvaferreira/POSITRON_POM_DOCUMENTATION.md

# Check write permissions
ls -la /Users/rodrigosilvaferreira/
```

## Best Practices

### 1. Run Regularly

Run Sailor Mode regularly (nightly, weekly) to:
- Catch regressions early
- Build up test coverage
- Keep POM documentation current

### 2. Review Generated Tests

Always review auto-generated tests before committing:
```bash
# Review generated tests
ls -l test/e2e/tests/sailor-generated/

# Run them locally
npx playwright test test/e2e/tests/sailor-generated/
```

### 3. Act on Discoveries

When Sailor Mode finds issues:
- Review the bug reproduction test
- Create GitHub issues for real bugs
- Update workflows for expected behavior changes

### 4. Tune Workflows

Refine workflows based on results:
- Add steps for common scenarios
- Remove redundant steps
- Adjust timeouts based on performance data

### 5. Monitor Performance

Watch for performance degradation:
- Check report performance notes
- Compare execution times over time
- Flag operations that are getting slower

## Configuration Reference

### Main Config: `config.json`

```json
{
  "execution": {
    "timeoutPerStep": 60000,        // Max time per step
    "retryFailedSteps": true,        // Retry failed steps
    "maxRetries": 3                  // Max retry attempts
  },
  
  "selfHealing": {
    "enabled": true,                 // Enable self-healing
    "maxHealingAttempts": 5         // Max healing attempts
  },
  
  "testGeneration": {
    "enabled": true,                 // Generate tests
    "outputDirectory": "test/e2e/tests/sailor-generated"
  },
  
  "discovery": {
    "updatePOMDocumentation": true,  // Auto-update POMs
    "generateBugReports": true       // Create bug reports
  }
}
```

## Summary

Sailor Mode provides:
- ✅ **Autonomous navigation** using POMs
- ✅ **Structured workflows** not random exploration
- ✅ **Self-healing** when stuck or failing
- ✅ **Automatic test generation** from successful runs
- ✅ **POM documentation updates** with discoveries
- ✅ **Comprehensive reporting** with actionable insights
- ✅ **Multiple operational modes** for different needs

**Get Started:**
```bash
cd ~/positron-1/test/e2e/sailor-mode
./sailor.sh deep-dive data-explorer
```

**More Info:**
- Skill Definition: `~/.claude/skills/positron-sailor-mode.md`
- POM Documentation: `/Users/rodrigosilvaferreira/POSITRON_POM_DOCUMENTATION.md`
- Workflows: `sailor-mode/workflows.json`
- Configuration: `sailor-mode/config.json`

Let Sailor Mode navigate Positron systematically, validate behavior, and keep your tests and documentation up to date! 🚢
