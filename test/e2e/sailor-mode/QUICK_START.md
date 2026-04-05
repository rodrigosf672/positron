# 🚀 Sailor Mode Quick Start (5 Minutes)

Get autonomous POM-based testing running in 5 minutes.

## What is Sailor Mode?

Sailor Mode autonomously navigates Positron using Page Object Model patterns, validates behavior, self-heals on failures, and generates tests + documentation automatically.

**Think of it as:** An intelligent robot that knows how to use Positron (via POMs), follows user workflows, finds bugs, and writes tests for you.

---

## 1. Verify Setup (30 seconds)

```bash
cd ~/positron-1/test/e2e/sailor-mode

# Check everything is ready
./sailor.sh help
```

You should see the Sailor Mode menu. If not, check that:
- Claude CLI is installed: `claude --version`
- Skill exists: `ls ~/.claude/skills/positron-sailor-mode.md`

---

## 2. Run Your First Sailor Session (2 minutes)

### Option A: Quick Smoke Test (Fastest)

```bash
./sailor.sh user-journey --workflows quick-smoke
```

**What happens:**
- Executes 2 quick workflows (~2 minutes)
- Tests Python session and notebook creation
- Generates 2 regression tests
- Creates a report

**Expected output:**
```
Starting User Journey
Workflow Group: quick-smoke

[00:00] Loading workflows...
[00:05] Executing: Python Development Workflow
[00:45] ✓ Python workflow complete
[00:50] Executing: Notebook Workflow  
[01:30] ✓ Notebook workflow complete

Session Complete!
Workflows: 2/2 ✓
Tests generated: 2
Duration: 1 minute 35 seconds
```

### Option B: Deep Dive (More Thorough)

```bash
./sailor.sh deep-dive console
```

**What happens:**
- Tests console feature exhaustively (~5 minutes)
- Tests code execution, output, errors, interrupts
- Self-heals any failures
- Generates multiple tests
- Updates POM docs with findings

---

## 3. See What Was Generated (30 seconds)

### View Generated Tests

```bash
ls -l ~/positron-1/test/e2e/tests/sailor-generated/
```

You'll see files like:
- `python-development.test.ts`
- `notebook-workflow.test.ts`

### Open a Generated Test

```bash
cat ~/positron-1/test/e2e/tests/sailor-generated/python-development.test.ts
```

You'll see a complete, runnable test that Sailor Mode created from its successful workflow execution.

### View the Recording

```bash
# Find latest recording
ls -lt sailor-mode/recordings/

# Open the HTML report (adjust session ID)
open sailor-mode/recordings/sailor_20260402_143052/report.html
```

The recording includes:
- **Screenshots** taken every 2 seconds + at each step/error/discovery
- **Interactive HTML report** with timeline and embedded screenshots
- **Video** (if enabled) created from screenshots
- **Timeline data** in JSON and CSV formats

### View the Report

```bash
# Find latest report
ls -lt sailor-mode/reports/

# View it (adjust filename)
cat sailor-mode/reports/latest.txt
```

---

## 4. Run Generated Tests (1 minute)

```bash
cd ~/positron-1

# Run all sailor-generated tests
npx playwright test test/e2e/tests/sailor-generated/ --project e2e-electron
```

These tests should pass since they were generated from successful workflows!

---

## 5. Try Other Modes (Optional)

### Data Explorer Deep Dive

```bash
./sailor.sh deep-dive data-explorer
```

Tests all Data Explorer features: sorting, filtering, summary panel, etc.

### Stress Test

```bash
./sailor.sh stress-test
```

Tests Positron under load: large datasets, long computations, many sessions.

### User Journey

```bash
./sailor.sh user-journey python-development
```

Executes the complete Python development workflow end-to-end.

---

## Understanding the Output

When Sailor Mode runs, you'll see:

```
[00:00] Loading POM documentation...
[00:05] Found 50 page objects           ← POMs loaded
[00:10] Loading workflows...
[00:15] Found 2 workflows

[00:20] Workflow 1/2: Python Development
[00:35] ✓ Step 1/7: Start Python        ← Using page objects
[00:50] ✓ Step 2/7: Create variable
[01:05] ✗ Step 3/7: Verify variable (timeout)
[01:10] → Self-healing: Retry with wait ← Auto-healing!
[01:25] ✓ Step 3/7: Verified (healed)
[01:30] → Discovery: Variables need 5s  ← Records findings
[01:35] → Updating POM docs              ← Updates docs!
[01:40] ✓ Steps 4-7 completed
[01:45] ✓ Test generated                 ← Creates test!

[01:50] Workflow 2/2: Notebook Workflow
...

Session Complete!
Workflows: 2/2 ✓
Tests: 2 generated
POM updates: 1
Success rate: 100%
```

---

## What Just Happened?

1. **Loaded POMs**: Read all 50 page object definitions
2. **Loaded Workflows**: Loaded predefined user workflows
3. **Executed Steps**: Used page objects to navigate Positron
4. **Validated**: Checked expected behavior at each step
5. **Self-Healed**: Fixed failures automatically
6. **Recorded Discoveries**: Noted timeout needs adjustment
7. **Updated Docs**: Added finding to POM documentation
8. **Generated Tests**: Created regression tests from successful workflows
9. **Created Report**: Comprehensive session report

---

## Next Steps

### Integrate with CI

Run Sailor Mode nightly to catch regressions:

```yaml
# .github/workflows/sailor-mode.yml
- name: Run Sailor Mode
  run: |
    cd test/e2e/sailor-mode
    ./sailor.sh user-journey --workflows comprehensive
```

### Create Custom Workflows

Add your own workflow to `workflows.json`:

```json
{
  "my-workflow": {
    "name": "My Custom Test",
    "steps": [
      {
        "name": "My step",
        "pageObject": "console",
        "method": "executeCode",
        "params": ["Python", "print('hello')"]
      }
    ]
  }
}
```

Then run it:
```bash
./sailor.sh user-journey my-workflow
```

### Review and Commit Tests

Review generated tests and commit them:

```bash
# Review
cat test/e2e/tests/sailor-generated/*.test.ts

# Run locally
npx playwright test test/e2e/tests/sailor-generated/

# If good, commit
git add test/e2e/tests/sailor-generated/
git commit -m "Add Sailor Mode generated tests"
```

---

## Common Commands

```bash
# Quick smoke test (2 min)
./sailor.sh user-journey --workflows quick-smoke

# Deep dive on feature (5-15 min)
./sailor.sh deep-dive <feature>

# Stress test (30-60 min)
./sailor.sh stress-test

# View session history
./sailor.sh list-sessions

# View specific session report
./sailor.sh view-session <session-id>

# Resume from checkpoint
./sailor.sh --resume
```

---

## Troubleshooting

### "Skill not found"

```bash
# Check skill exists
ls ~/.claude/skills/positron-sailor-mode.md

# If missing, it was created earlier - check the file exists
```

### "Workflows not found"

```bash
# Check workflows file
cat sailor-mode/workflows.json | jq '.workflows | keys'
```

### "Tests not generated"

```bash
# Check test generation is enabled
cat sailor-mode/config.json | jq '.testGeneration.enabled'

# Ensure directory exists
mkdir -p test/e2e/tests/sailor-generated
```

---

## Comparison: Traditional vs Sailor Mode

### Traditional Approach

```typescript
// You write this:
test('should create variable', async ({ app, python }) => {
    await app.workbench.console.executeCode('Python', 'x = 42');
    await app.workbench.variables.expectVariableToBe('x', '42');
});

// Problems:
// - Manual test writing
// - No self-healing
// - Manual POM updates
// - One scenario at a time
```

### Sailor Mode Approach

```bash
# You run this:
./sailor.sh user-journey python-development

# Sailor Mode:
# - Executes entire workflow automatically
# - Self-heals on failures
# - Updates POMs with discoveries
# - Generates regression tests
# - Creates comprehensive report
# - Tests multiple scenarios systematically
```

---

## What You Get

After 5 minutes, you have:

✅ **Autonomous testing** - Sailor navigates and tests for you
✅ **Generated tests** - Real, runnable Playwright tests
✅ **Updated docs** - POM documentation reflects reality
✅ **Bug reports** - Issues found and documented
✅ **Self-healing** - Failures automatically fixed
✅ **Comprehensive report** - Know exactly what was tested

---

## The Power of POM-Based Sailor Mode

### Without Sailor Mode:
- Write tests manually
- Run tests
- Tests fail
- Debug and fix manually
- Update docs manually
- Repeat

### With Sailor Mode:
```bash
./sailor.sh deep-dive data-explorer
```
- ✅ Tests written automatically
- ✅ Failures self-healed
- ✅ Docs updated automatically
- ✅ Bugs reported with reproduction tests
- ✅ Comprehensive coverage achieved

---

## Ready to Sail? ⛵

```bash
cd ~/positron-1/test/e2e/sailor-mode
./sailor.sh user-journey --workflows quick-smoke
```

That's it! Sailor Mode will navigate Positron, validate behavior, and generate tests for you.

**More Info:**
- Full docs: `sailor-mode/README.md`
- Workflows: `sailor-mode/workflows.json`
- Reports: `sailor-mode/reports/`
- Generated tests: `test/e2e/tests/sailor-generated/`

Happy sailing! 🚢
