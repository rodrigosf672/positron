# 📹 Sailor Mode Recording Guide

Visual documentation of autonomous navigation sessions with screenshots, videos, and interactive reports.

## Quick Start

Recording is **enabled by default**. Just run Sailor Mode:

```bash
cd ~/positron-1/test/e2e/sailor-mode

# Run any mode - recording happens automatically
./sailor.sh user-journey --workflows quick-smoke
```

After completion:

```bash
# View the recording
open recordings/$(ls -t recordings/ | head -1)/report.html
```

## What Gets Recorded

### Automatic Captures

- **Interval screenshots**: Every 2 seconds (configurable)
- **Step screenshots**: Each workflow step execution
- **Error screenshots**: Every failure
- **Discovery screenshots**: When new patterns are found
- **Healing screenshots**: Self-healing attempts

### Generated Artifacts

- **report.html**: Interactive timeline with embedded screenshots
- **timeline.json**: Complete event data
- **timeline.csv**: Spreadsheet-friendly timeline
- **sailor-session-*.mp4**: Video replay (requires ffmpeg)
- **screenshots/**: All captured images

## Configuration

Edit `config.json` to customize:

```json
{
  "recording": {
    "enabled": true,
    "mode": "full",  // "full" | "steps-only" | "errors-only"
    "screenshots": {
      "intervalSeconds": 2,  // Screenshot interval
      "captureOnStep": true,
      "captureOnError": true,
      "captureOnDiscovery": true,
      "fullPage": true,      // Capture entire page
      "quality": 90          // 0-100
    },
    "video": {
      "enabled": true,
      "fps": 2              // Frames per second
    },
    "annotations": {
      "enabled": true,
      "showStepNumbers": true,
      "showTimestamps": true
    }
  }
}
```

## Recording Modes

### Full Mode (Default)
```json
"mode": "full"
```
- All screenshots (interval + events)
- Video generation
- Complete timeline
- **Best for**: Debugging, demonstrations, comprehensive analysis

### Steps-Only Mode
```json
"mode": "steps-only"
```
- Screenshots at steps and errors only
- No interval screenshots
- Video generation
- **Best for**: Test documentation, efficiency, CI integration

### Errors-Only Mode
```json
"mode": "errors-only"
```
- Screenshots on failures only
- No video
- Minimal overhead
- **Best for**: CI failure analysis, production runs

## Viewing Recordings

### HTML Report (Recommended)

```bash
# Open latest
open recordings/$(ls -t recordings/ | head -1)/report.html
```

**Features:**
- Interactive timeline
- Click screenshots to enlarge
- Color-coded status (success/failure/healing)
- Session statistics
- Download links for raw data

### Timeline Data

```bash
# JSON (detailed)
cat recordings/SESSION_ID/timeline.json | jq

# CSV (analysis)
open recordings/SESSION_ID/timeline.csv
```

### Video

```bash
# Play video
open recordings/SESSION_ID/*.mp4
```

## Installation (Optional Tools)

### ffmpeg (for video generation)

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt install ffmpeg

# Windows
choco install ffmpeg
```

### ImageMagick (for annotations)

```bash
# macOS
brew install imagemagick

# Ubuntu/Debian
sudo apt install imagemagick

# Windows
choco install imagemagick
```

**Note**: Sailor Mode works without these tools but skips video/annotation features.

## Use Cases

### 1. Debugging Failures

```bash
# Run deep dive with full recording
./sailor.sh deep-dive data-explorer

# Review failure in report
open recordings/$(ls -t recordings/ | head -1)/report.html
# Find the red (failure) timeline entry
# View screenshot to see exact failure state
```

### 2. Documenting Workflows

```bash
# Use steps-only mode for efficiency
vim config.json  # Set "mode": "steps-only"

./sailor.sh user-journey python-development

# Share the report with team
open recordings/$(ls -t recordings/ | head -1)/report.html
```

### 3. Creating Presentations

```bash
# Generate video
vim config.json  # Ensure video.enabled: true

./sailor.sh user-journey --workflows quick-smoke

# Use the generated video
open recordings/$(ls -t recordings/ | head -1)/*.mp4
```

### 4. Performance Analysis

```bash
# Run with recording
./sailor.sh stress-test

# Analyze timeline CSV
open recordings/$(ls -t recordings/ | head -1)/timeline.csv
# Look at "Duration" column to find slow operations
```

### 5. CI Integration

```bash
# Use errors-only mode in CI
vim config.json  # Set "mode": "errors-only"

# In CI pipeline
./sailor.sh user-journey --workflows comprehensive

# Upload report artifact on failure
# Team can view exact failure state from screenshots
```

## Timeline Entry Structure

Each timeline entry contains:

```json
{
  "timestamp": 1680523852000,
  "step": 3,
  "workflow": "Python Development Workflow",
  "action": "Execute code in console",
  "pageObject": "console",
  "method": "executeCode",
  "screenshot": "path/to/screenshot.png",
  "status": "success",  // "success" | "failure" | "healing"
  "duration": 2500,
  "annotation": "Optional description"
}
```

## Performance Impact

### Full Mode
- **Disk**: ~500MB/hour (1800 screenshots at 2s intervals)
- **CPU**: Low (screenshot capture is async)
- **Time**: +2-5% (screenshot I/O)

### Steps-Only Mode
- **Disk**: ~15MB/session (20-50 screenshots typical)
- **CPU**: Minimal
- **Time**: +1% (negligible)

### Errors-Only Mode
- **Disk**: ~3MB/session (0-10 screenshots typical)
- **CPU**: Negligible
- **Time**: <1% (only on failures)

## Troubleshooting

### No Video Generated

**Cause**: ffmpeg not installed

**Solution**:
```bash
brew install ffmpeg  # macOS
sudo apt install ffmpeg  # Linux
```

### No Annotations on Screenshots

**Cause**: ImageMagick not installed (optional feature)

**Solution**:
```bash
brew install imagemagick  # macOS
sudo apt install imagemagick  # Linux
```

Or disable annotations:
```json
{
  "annotations": {
    "enabled": false
  }
}
```

### Recording Directory Full

**Cause**: Too many old recordings

**Solution**:
```bash
# Delete old recordings
rm -rf recordings/sailor_2026*

# Or keep only last 5
cd recordings && ls -t | tail -n +6 | xargs rm -rf
```

### Screenshots Blurry

**Cause**: Low quality setting

**Solution**:
```json
{
  "screenshots": {
    "quality": 90  // Increase from default
  }
}
```

## Examples

### Minimal Recording (CI)

```json
{
  "recording": {
    "enabled": true,
    "mode": "errors-only",
    "screenshots": {
      "enabled": true,
      "captureOnError": true,
      "quality": 70
    },
    "video": {
      "enabled": false
    },
    "annotations": {
      "enabled": false
    }
  }
}
```

### Maximum Recording (Debugging)

```json
{
  "recording": {
    "enabled": true,
    "mode": "full",
    "screenshots": {
      "enabled": true,
      "intervalSeconds": 1,
      "captureOnStep": true,
      "captureOnError": true,
      "captureOnDiscovery": true,
      "fullPage": true,
      "quality": 95
    },
    "video": {
      "enabled": true,
      "fps": 2
    },
    "annotations": {
      "enabled": true,
      "showStepNumbers": true,
      "showTimestamps": true,
      "highlightElements": true
    }
  }
}
```

### Balanced Recording (Default)

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
      "fps": 2
    },
    "annotations": {
      "enabled": true,
      "showStepNumbers": true,
      "showTimestamps": true
    }
  }
}
```

## Command Reference

```bash
# View latest recording
open recordings/$(ls -t recordings/ | head -1)/report.html

# List all recordings
ls -lh recordings/

# View specific recording
open recordings/sailor_20260402_143052/report.html

# Extract timeline data
jq '.[] | select(.status == "failure")' recordings/SESSION_ID/timeline.json

# Count screenshots
ls recordings/SESSION_ID/screenshots/*.png | wc -l

# Check recording size
du -sh recordings/SESSION_ID/

# Clean old recordings (keep last 10)
cd recordings && ls -t | tail -n +11 | xargs rm -rf
```

## Summary

- **Enabled by default** - just run Sailor Mode
- **Three modes**: full, steps-only, errors-only
- **Multiple formats**: HTML report, JSON, CSV, video
- **Low overhead** - configurable performance impact
- **Optional tools** - ffmpeg (video), ImageMagick (annotations)
- **Easy viewing** - interactive HTML report with screenshots

**Get started:**
```bash
./sailor.sh user-journey --workflows quick-smoke
open recordings/$(ls -t recordings/ | head -1)/report.html
```
