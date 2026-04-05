# 🚢 Sailor Mode - Quick Reference Card

## 📹 Recording System (What You Requested)

### Enable Recording
**Edit** `config.json`:
```json
{
  "recording": {
    "enabled": true,
    "mode": "full",
    "screenshots": {
      "intervalSeconds": 2,  // ← Your X seconds
      "captureOnStep": true,
      "captureOnError": true
    }
  }
}
```

### View Latest Recording
```bash
open recordings/$(ls -t recordings/ | head -1)/report.html
```

### Recording Modes
- **full**: All screenshots + video (~500MB/hr)
- **steps-only**: Steps + errors (~15MB/session)
- **errors-only**: Failures only (~3MB/session)

### Output Structure
```
recordings/session-id/
├── report.html      # Interactive timeline
├── timeline.json    # Event data
├── timeline.csv     # Spreadsheet
├── *.mp4           # Video
└── screenshots/    # All images
```

---

## 🎯 Quick Commands

### View Documentation
```bash
cd ~/positron-1/test/e2e/sailor-mode

# Quick start (5 min)
cat QUICK_START.md

# Recording guide (10 min)
cat RECORDING_GUIDE.md

# Full documentation
cat README.md

# Implementation status
cat IMPLEMENTATION_STATUS.md

# This session summary
cat SESSION_SUMMARY.md
```

### Run Demo Tests
```bash
cd ~/positron-1

# Python workflow (7 steps)
npx playwright test test/e2e/tests/sailor-demo.test.ts --project e2e-electron --grep "Python Development" --headed

# Notebook workflow (4 steps)
npx playwright test test/e2e/tests/sailor-demo.test.ts --project e2e-electron --grep "Notebook" --headed

# Data Explorer (5 steps)
npx playwright test test/e2e/tests/sailor-demo.test.ts --project e2e-electron --grep "Data Explorer" --headed

# All demos
npx playwright test test/e2e/tests/sailor-demo.test.ts --project e2e-electron --headed
```

### View Configuration
```bash
# Recording settings
cat config.json | jq '.recording'

# Self-healing settings
cat config.json | jq '.selfHealing'

# All workflows
cat workflows.json | jq '.workflows | keys'

# Workflow groups
cat workflows.json | jq '.["workflow-groups"]'
```

---

## 📁 Key Files

### Recording System
- `recorder.ts` - Recording implementation (689 lines)
- `config.json` - Recording configuration
- `RECORDING_GUIDE.md` - User guide
- `example-with-recording.ts` - Integration example

### Workflows
- `workflows.json` - 7 workflows, 4 groups
- `executor.ts` - Workflow executor (339 lines)

### Interface
- `sailor.sh` - CLI script (510 lines)

### Tests
- `../tests/sailor-demo.test.ts` - Demo workflows

### Documentation
- `README.md` - Complete docs
- `QUICK_START.md` - 5-min guide
- `RECORDING_GUIDE.md` - Recording guide
- `SESSION_SUMMARY.md` - What we built
- `IMPLEMENTATION_STATUS.md` - Status
- `QUICK_REFERENCE.md` - This file

---

## 💻 Code Snippets

### Use Recorder Standalone
```typescript
import { SailorRecorder } from './recorder';
import config from './config.json';

const recorder = new SailorRecorder(config.recording, 'my-session');

// Start
await recorder.startRecording(page);

// Record events
await recorder.recordStep(page, 'workflow', 1, 'Step name', 'pageObject', 'method');
await recorder.recordError(page, 'workflow', 2, 'Error message');
await recorder.recordDiscovery(page, 'workflow', 'Discovery description');
await recorder.recordHealing(page, 'workflow', 'Healing strategy');

// Stop and get report path
const reportPath = await recorder.stopRecording(page);
console.log(`Report: ${reportPath}`);
```

### Execute Workflow
```typescript
import { createSailorExecutor } from './executor';

const executor = createSailorExecutor('session-123');

// Execute workflow group
await executor.executeWorkflowGroup(app, 'quick-smoke');

// Or single workflow
await executor.executeWorkflow(app, 'python-development');
```

---

## 🎬 Recording Features

### Screenshot Capture
- ✅ **Interval**: Every X seconds (configurable, default: 2s)
- ✅ **Steps**: Each workflow step
- ✅ **Errors**: Every failure
- ✅ **Discoveries**: New findings
- ✅ **Healing**: Self-healing attempts

### Video Generation
- ✅ MP4 format
- ✅ Configurable FPS (default: 2)
- ✅ Requires ffmpeg: `brew install ffmpeg`

### HTML Report
- ✅ Interactive timeline
- ✅ Embedded screenshots
- ✅ Click to enlarge
- ✅ Color-coded status
- ✅ Session statistics

### Exports
- ✅ JSON (complete data)
- ✅ CSV (spreadsheet-friendly)

---

## ⚙️ Configuration Tips

### Change Screenshot Interval
```json
{
  "recording": {
    "screenshots": {
      "intervalSeconds": 5  // ← Every 5 seconds
    }
  }
}
```

### Disable Video
```json
{
  "recording": {
    "video": {
      "enabled": false
    }
  }
}
```

### Use Steps-Only Mode
```json
{
  "recording": {
    "mode": "steps-only"  // Only steps + errors
  }
}
```

### Adjust Quality
```json
{
  "recording": {
    "screenshots": {
      "quality": 95  // Higher quality (default: 90)
    }
  }
}
```

---

## 📊 Workflows Available

### Individual Workflows
1. `python-development` (7 steps, 5 min)
2. `data-explorer-deep-dive` (comprehensive)
3. `notebook-workflow` (notebook testing)
4. `plots-visualization` (plot generation)
5. `console-stress-test` (performance)
6. `session-management` (lifecycle)
7. `debugging-workflow` (debugging)

### Workflow Groups
- `quick-smoke` - Fast validation (2 workflows, ~2 min)
- `data-focus` - Data-heavy workflows
- `stress` - Performance testing
- `comprehensive` - All workflows

---

## 🔧 Self-Healing Strategies

1. **retry-with-wait** - Wait 5s and retry
2. **find-alternative-selector** - Try alternative (10s wait)
3. **use-alternative-method** - Use different method
4. **navigate-via-different-path** - Alternative route
5. **restart-session** - Restart interpreter
6. **reset-to-known-state** - Press Escape, reset

---

## 📞 Quick Help

### View Recordings
```bash
ls -lt recordings/
open recordings/SESSION_ID/report.html
```

### Check Configuration
```bash
cat config.json | jq
```

### List Workflows
```bash
cat workflows.json | jq '.workflows | keys'
```

### Run Demo
```bash
npx playwright test test/e2e/tests/sailor-demo.test.ts --project e2e-electron --headed
```

---

## ✅ What's Working Now

- ✅ Recording system (fully functional)
- ✅ Workflow definitions (7 workflows)
- ✅ Configuration (complete)
- ✅ Documentation (comprehensive)
- ✅ Demo tests (working)
- ✅ Claude skills (installed)

---

## 🎯 One-Liner Summary

**Your request**: "Screenshots every X seconds during navigation"

**What you got**: Complete recording system with interval screenshots (every X seconds), event screenshots (steps/errors/discoveries), video generation, interactive HTML reports, JSON/CSV exports, three recording modes, and full integration with Sailor Mode workflows!

---

**See `SESSION_SUMMARY.md` for complete details of what was built today!** 🚢
