# 🎯 Autonomous Testing System - Quick Navigation

Welcome to the complete autonomous testing system for Positron!

## What Do You Want to Do?

### 📝 Write Tests with AI

**Quick Start:**
```bash
claude -m "Using positron-e2e-tests skill, write a test for X"
```

**Full Guide:** `QUICK_START_AUTONOMOUS.md` (5 min)

---

### 🚢 Run Sailor Mode (Autonomous Navigation)

**Quick Start:**
```bash
cd sailor-mode
./sailor.sh user-journey --workflows quick-smoke
```

**Full Guide:** `sailor-mode/QUICK_START.md` (5 min)

---

### 📹 View Session Recordings

**Quick View:**
```bash
open sailor-mode/recordings/$(ls -t sailor-mode/recordings/ | head -1)/report.html
```

**Features:**
- Screenshots every 2 seconds
- Interactive HTML timeline
- Video generation
- Failure analysis

**Full Guide:** `sailor-mode/RECORDING_GUIDE.md` (10 min)

---

### 🔍 Monitor CI and Auto-Heal Failures

**Quick Start:**
```bash
npx tsx scripts/test-agent.ts monitor
```

**Full Guide:** `AUTONOMOUS_TESTING.md` (20 min)

---

### 📚 Reference POMs

**Location:** `/Users/rodrigosilvaferreira/POSITRON_POM_DOCUMENTATION.md`

**Contents:** All 50 page objects with complete API documentation

---

### 🎓 Understand the Complete System

**Read:** `COMPLETE_SYSTEM_OVERVIEW.md` (15 min)

**Covers:**
- How all components work together
- Complete workflow examples
- Best practices
- Troubleshooting

---

## Quick Commands

```bash
# Write test
claude -m "Using positron-e2e-tests, write test for X"

# Fix failing test
./scripts/claude-test-helper.sh heal-test my-test.test.ts

# Quick smoke test (2 min)
cd sailor-mode && ./sailor.sh user-journey --workflows quick-smoke

# Deep dive on feature (15 min)
cd sailor-mode && ./sailor.sh deep-dive data-explorer

# Monitor CI
npx tsx scripts/test-agent.ts monitor

# Check CI status
./scripts/claude-test-helper.sh check-status
```

---

## Documentation Index

| File | What It Is | When to Read |
|------|-----------|--------------|
| `README_AUTONOMOUS_SYSTEM.md` | This file - navigation hub | Start here |
| `QUICK_START_AUTONOMOUS.md` | 5-min test writing guide | Want to write tests |
| `sailor-mode/QUICK_START.md` | 5-min Sailor Mode guide | Want autonomous testing |
| `sailor-mode/RECORDING_GUIDE.md` | Recording system guide | Want visual session docs |
| `AUTONOMOUS_TESTING.md` | Full test agent docs | Deep dive on test agent |
| `sailor-mode/README.md` | Full Sailor Mode docs | Deep dive on Sailor |
| `COMPLETE_SYSTEM_OVERVIEW.md` | Complete system architecture | Want full picture |
| `/Users/rodrigosilvaferreira/POSITRON_POM_DOCUMENTATION.md` | All POMs reference | Need POM details |

---

## System Components

1. **POM Documentation** - 50 page objects, 4,841 lines
2. **positron-e2e-tests skill** - AI test writer
3. **Test Agent** - CI monitoring & healing
4. **positron-sailor-mode skill** - Autonomous navigator
5. **Sailor Mode** - Systematic testing
6. **Workflow Definitions** - User journey patterns

---

## What Each Component Does

### POM Documentation
✅ Complete reference for all page objects
✅ API documentation with signatures
✅ Usage examples
✅ Best practices

### Test Writing Skill
✅ Generate tests with AI
✅ Fix failing tests
✅ Analyze CI failures
✅ Update documentation

### Test Agent
✅ Monitor CI continuously
✅ Detect failures automatically
✅ Apply healing strategies
✅ Commit fixes

### Sailor Mode
✅ Navigate autonomously using POMs
✅ Execute workflows systematically
✅ Self-heal on failures
✅ Generate regression tests
✅ Update POM documentation
✅ Record sessions with screenshots & video

---

## First Time? Start Here

### Step 1: Quick Test (2 min)
```bash
cd sailor-mode
./sailor.sh user-journey --workflows quick-smoke
```

### Step 2: Review Results
```bash
ls -l reports/
cat reports/latest.txt
ls -l ../tests/sailor-generated/
```

### Step 3: Read a Quick Start (5 min)
- Test Writing: `QUICK_START_AUTONOMOUS.md`
- Sailor Mode: `sailor-mode/QUICK_START.md`

### Step 4: Try Interactive Test Writing
```bash
claude -m "Using positron-e2e-tests skill, write a test that creates a DataFrame and opens it in Data Explorer"
```

---

## The Power of This System

### Traditional Testing
- ❌ Write tests manually (30-60 min)
- ❌ Fix failures manually (15-30 min)
- ❌ Update docs manually (often outdated)
- ❌ Limited coverage

### With Autonomous System
- ✅ Generate tests with AI (2-5 min)
- ✅ Auto-heal failures
- ✅ Auto-update documentation
- ✅ Systematic coverage
- ✅ Continuous monitoring

---

## Need Help?

### Common Issues

**Skills not working?**
```bash
ls ~/.claude/skills/positron-e2e-tests.md
ls ~/.claude/skills/positron-sailor-mode.md
```

**Tests not generating?**
```bash
cat sailor-mode/config.json | jq '.testGeneration.enabled'
mkdir -p tests/sailor-generated
```

**Self-healing not working?**
```bash
cat .claude-test-agent.config.json | jq '.healing.enabled'
cat sailor-mode/config.json | jq '.selfHealing.enabled'
```

---

## Quick Links

- **Skills Directory**: `~/.claude/skills/`
- **POM Documentation**: `/Users/rodrigosilvaferreira/POSITRON_POM_DOCUMENTATION.md`
- **Test Agent Config**: `.claude-test-agent.config.json`
- **Sailor Config**: `sailor-mode/config.json`
- **Workflows**: `sailor-mode/workflows.json`
- **Generated Tests**: `tests/sailor-generated/`
- **Reports**: `sailor-mode/reports/`

---

## Get Started Now

```bash
# Option 1: Sailor Mode Quick Smoke (2 min)
cd sailor-mode
./sailor.sh user-journey --workflows quick-smoke

# Option 2: Interactive Test Writing (5 min)
claude -m "Using positron-e2e-tests skill, help me write a test"

# Option 3: Read Quick Start (5 min)
cat QUICK_START_AUTONOMOUS.md
```

---

**The autonomous system is ready. Let it handle testing, healing, and documentation while you focus on building features!** 🚀
