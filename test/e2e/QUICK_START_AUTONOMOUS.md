# 🤖 Quick Start: Autonomous Testing with Claude

Get started with AI-powered test development, CI monitoring, and self-healing in 5 minutes.

## What You Get

✅ **AI Test Writer** - Claude generates complete, working tests using POM patterns  
✅ **CI Monitor** - Automatically detects test failures in CI  
✅ **Self-Healing** - Claude fixes common failures automatically  
✅ **Doc Updates** - POM documentation stays current automatically  
✅ **GitHub Integration** - Monitors PRs and comments with fixes  

---

## Prerequisites

```bash
# 1. Ensure Claude Code CLI is installed
claude --version

# 2. Ensure GitHub CLI is installed (for CI integration)
gh --version

# 3. Install TypeScript execution (for test agent)
npm install -g tsx
```

---

## 5-Minute Setup

### Step 1: Verify Skill is Installed

The skill was automatically created at:
```bash
~/.claude/skills/positron-e2e-tests.md
```

Test it:
```bash
# In Claude Code, type:
/positron-e2e-tests

# Or in chat:
"Use the positron-e2e-tests skill to help me"
```

### Step 2: Test the Helper Script

```bash
cd ~/positron-1/test/e2e

# Check status
./scripts/claude-test-helper.sh check-status

# View available commands
./scripts/claude-test-helper.sh help
```

### Step 3: Write Your First AI-Generated Test

```bash
# Option A: Using helper script
./scripts/claude-test-helper.sh write-test "Create a Python variable and verify it appears in variables pane"

# Option B: Direct with Claude
claude -m "Using positron-e2e-tests skill, write a test that creates a Python variable named 'x' with value 42 and verifies it in the variables pane"
```

Claude will generate a complete test file like:
```typescript
import { test, expect } from './_test.setup';

test.use({ suiteId: __filename });

test.describe('Variables Pane', () => {
    test('should display Python variable', async ({ app, python }) => {
        await test.step('Create variable', async () => {
            await app.workbench.console.executeCode('Python', 'x = 42');
        });
        
        await test.step('Verify in variables pane', async () => {
            await app.workbench.variables.expectVariableToBe('x', '42');
        });
    });
});
```

### Step 4: Run the Test

```bash
# Run locally
npx playwright test your-test.test.ts --project e2e-electron

# If it passes, push to CI
git add your-test.test.ts
git commit -m "Add variable pane test"
git push
```

### Step 5: Start CI Monitoring (Optional)

In a terminal, start the autonomous monitor:

```bash
cd ~/positron-1/test/e2e
./scripts/claude-test-helper.sh monitor-ci
```

This runs continuously and:
- Checks CI every 5 minutes
- Detects failures
- Reports findings
- Can auto-heal if configured

---

## Usage Patterns

### Pattern 1: Interactive Test Writing

```bash
# Start a conversation with Claude
claude

# Then say:
"Use the positron-e2e-tests skill. I need help writing a test for the Data Explorer."

# Claude will ask clarifying questions:
"What specific Data Explorer functionality are you testing?"

# You answer:
"I want to test that clicking a column header sorts the data"

# Claude generates the test with proper POMs
```

### Pattern 2: Fix a Failing Test

```bash
# Your test failed in CI. Get logs:
gh run view 12345 --log > failure.log

# Ask Claude to fix it:
claude -m "Analyze failure.log and fix the failing test using the positron-e2e-tests skill"

# Or use the helper:
./scripts/claude-test-helper.sh heal-test my-failing-test.test.ts
```

Claude will:
1. Read the test file
2. Analyze the failure
3. Classify it (timeout, selector, assertion, race condition)
4. Apply the appropriate fix
5. Update POMs if needed
6. Update documentation
7. Tell you what changed and why

### Pattern 3: Batch Fix All Failures

```bash
# Get CI logs for failed run
gh run view 12345 --log > failures.log

# Ask Claude to fix all:
claude -m "Using positron-e2e-tests skill, analyze failures.log and fix all failing tests. Apply fixes and update POM documentation."
```

Claude will:
- Extract all failures
- Group by type
- Fix each one
- Create a single commit
- Update documentation
- Provide a summary

### Pattern 4: Proactive Improvements

```bash
# Ask Claude to find potential issues:
claude -m "Using positron-e2e-tests skill, analyze all tests in test/e2e/tests/console/ for potential race conditions and missing waits. Suggest improvements."
```

Claude will:
- Read all tests in directory
- Identify patterns that could fail
- Suggest preventive fixes
- Optionally apply them

### Pattern 5: Update POM Documentation

```bash
# After adding new selectors or methods:
./scripts/claude-test-helper.sh update-pom

# Or tell Claude:
claude -m "I just updated the Console page object with a new method clearHistory(). Update the POM documentation with this new method including signature, description, and usage example."
```

---

## Real-World Example: Complete Workflow

### Scenario: Add a new Data Explorer feature test

**Step 1: Ask Claude to write the test**

```bash
claude
```

```
Using the positron-e2e-tests skill, write a comprehensive test for:

Feature: Data Explorer column filtering
- Open a DataFrame with 100 rows
- Click the filter button on the "Age" column  
- Set filter to "Age > 30"
- Verify only rows where Age > 30 are displayed
- Clear the filter
- Verify all 100 rows are visible again

Use proper page objects, include assertions, and follow best practices.
```

**Step 2: Claude generates the test**

```typescript
import { test, expect } from './_test.setup';

test.use({ suiteId: __filename });

test.describe('Data Explorer - Column Filtering', () => {
    test('should filter DataFrame by column condition', async ({ app, python }) => {
        await test.step('Create DataFrame with 100 rows', async () => {
            await app.workbench.console.executeCode(
                'Python',
                `import pandas as pd
import numpy as np
df = pd.DataFrame({
    'Name': [f'Person_{i}' for i in range(100)],
    'Age': np.random.randint(20, 60, 100)
})`
            );
        });

        await test.step('Open DataFrame in Data Explorer', async () => {
            await app.workbench.variables.doubleClickVariableRow('df');
            await app.workbench.dataExplorer.waitForIdle();
        });

        await test.step('Apply filter: Age > 30', async () => {
            await app.workbench.dataExplorer.selectColumnHeader('Age');
            await app.workbench.dataExplorer.filterButton.click();
            await app.workbench.dataExplorer.filters.setFilter('Age', '>', '30');
            await app.workbench.dataExplorer.waitForIdle();
        });

        await test.step('Verify filtered rows', async () => {
            const rowCount = await app.workbench.dataExplorer.grid.getDisplayedRowCount();
            expect(rowCount).toBeLessThan(100);
            expect(rowCount).toBeGreaterThan(0);
        });

        await test.step('Clear filter', async () => {
            await app.workbench.dataExplorer.filters.clearAllFilters();
            await app.workbench.dataExplorer.waitForIdle();
        });

        await test.step('Verify all rows restored', async () => {
            await app.workbench.dataExplorer.grid.verifyTableDataLength(100);
        });
    });
});
```

**Claude also provides:**
```bash
# Save to:
test/e2e/tests/data-explorer/filtering.test.ts

# Run with:
npx playwright test test/e2e/tests/data-explorer/filtering.test.ts --project e2e-electron

# POM References:
- Data Explorer: /Users/rodrigosilvaferreira/POSITRON_POM_DOCUMENTATION.md lines 750-1176
- Variables: /Users/rodrigosilvaferreira/POSITRON_POM_DOCUMENTATION.md lines 614-749
```

**Step 3: Run locally**

```bash
npx playwright test test/e2e/tests/data-explorer/filtering.test.ts --project e2e-electron
```

Result: ✅ Test passes

**Step 4: Push to CI**

```bash
git add test/e2e/tests/data-explorer/filtering.test.ts
git commit -m "Add Data Explorer column filtering test"
git push origin feature/data-explorer-filtering
```

**Step 5: CI runs... and fails!**

```
Error: Timeout 30000ms exceeded waiting for app.workbench.dataExplorer.waitForIdle()
```

**Step 6: Auto-heal**

```bash
# Download CI logs
gh run view 12345 --log > ci-failure.log

# Ask Claude to fix:
./scripts/claude-test-helper.sh heal-test filtering.test.ts
```

**Claude analyzes:**
```
Failure Analysis:
- Type: timeout
- Location: waitForIdle() after filtering
- Cause: Large dataset takes longer to filter
- Fix: Increase timeout to 60000ms
```

**Claude applies fix:**
```diff
- await app.workbench.dataExplorer.waitForIdle();
+ await app.workbench.dataExplorer.waitForIdle({ timeout: 60000 });
```

**Claude updates POM doc:**
```markdown
### Data Explorer - waitForIdle()

**Note**: For operations on large datasets (>50 rows) or after filtering,
increase timeout:

\`\`\`typescript
await app.workbench.dataExplorer.waitForIdle({ timeout: 60000 });
\`\`\`

**Common Issue**: Default timeout may be insufficient for filtering operations.
Added: 2026-04-03 (from CI failure analysis)
```

**Claude commits:**
```bash
git commit -am "Fix: Increase Data Explorer timeout for large datasets

- Updated waitForIdle() timeout to 60000ms after filtering
- Added note to POM documentation about large dataset timeouts
- Resolves CI failure in run #12345"
```

**Step 7: Push fix**

```bash
git push origin feature/data-explorer-filtering
```

**Step 8: CI passes ✅**

The autonomous system:
- Detected the failure
- Analyzed the root cause
- Applied the correct fix
- Updated documentation
- Committed with meaningful message

---

## Configuration

### Enable Auto-Healing

Edit `test/e2e/.claude-test-agent.config.json`:

```json
{
  "healing": {
    "enabled": true,
    "maxAttempts": 3,
    "requireApprovalForChanges": false  // Set to true if you want manual approval
  }
}
```

### Enable Auto-Documentation Updates

```json
{
  "documentation": {
    "autoUpdate": true,
    "pomDocPath": "/Users/rodrigosilvaferreira/POSITRON_POM_DOCUMENTATION.md",
    "commitChanges": true  // Auto-commit documentation updates
  }
}
```

### Customize Monitoring Interval

```json
{
  "monitoring": {
    "checkIntervalSeconds": 300  // Check CI every 5 minutes
  }
}
```

---

## Commands Cheat Sheet

```bash
# Write a test
./scripts/claude-test-helper.sh write-test "description"

# Fix a failing test
./scripts/claude-test-helper.sh heal-test my-test.test.ts

# Monitor CI continuously
./scripts/claude-test-helper.sh monitor-ci

# Analyze logs
./scripts/claude-test-helper.sh analyze-logs failure.log

# Update POM documentation
./scripts/claude-test-helper.sh update-pom

# Check CI status
./scripts/claude-test-helper.sh check-status

# Interactive mode (recommended)
claude  # Then use the skill naturally
```

---

## Tips & Tricks

### 1. Be Specific with Claude

```bash
# ❌ Vague
"Write a test for the console"

# ✅ Specific
"Write a test that executes Python code 'x = [1, 2, 3]' in the console and verifies the variable appears in the variables pane with type 'list' and value '[1, 2, 3]'"
```

### 2. Reference POM Documentation

```bash
"Using the positron-e2e-tests skill, show me examples from the POM documentation for how to use the Data Explorer page object"
```

### 3. Ask for Explanation

```bash
"Why did you use waitForIdle() instead of a regular timeout?"
```

Claude will explain the reasoning based on POM patterns.

### 4. Iterate with Claude

```bash
"The test is too long. Can you refactor it to use a helper function?"
"Add more assertions to verify the data is correct"
"This test is flaky. Can you make it more stable?"
```

### 5. Learn from Failures

```bash
"Explain what went wrong in this test failure and how the fix prevents it in the future"
```

---

## Troubleshooting

### Problem: Skill not working

**Solution:**
```bash
# Verify skill exists
ls -la ~/.claude/skills/positron-e2e-tests.md

# If missing, recreate it:
cp /path/to/backup/positron-e2e-tests.md ~/.claude/skills/
```

### Problem: CI monitoring not detecting failures

**Solution:**
```bash
# Check GitHub CLI is authenticated
gh auth status

# Verify workflow name is correct
gh run list --workflow="E2E Tests"

# Check monitoring config
cat test/e2e/.claude-test-agent.config.json | jq '.monitoring'
```

### Problem: Auto-healing not applying fixes

**Solution:**
```bash
# Check healing is enabled
cat test/e2e/.claude-test-agent.config.json | jq '.healing.enabled'

# Check file permissions
ls -la test/e2e/tests/

# Run healing manually with Claude
claude -m "Fix test-file.test.ts using positron-e2e-tests skill"
```

---

## Next Steps

1. **Write your first AI-generated test** (5 min)
2. **Push to CI and watch monitoring** (passive)
3. **Try auto-healing on a failure** (10 min)
4. **Review POM documentation updates** (5 min)
5. **Iterate and improve** (ongoing)

The system learns from every test run and continuously improves!

---

## More Resources

- **Full Documentation**: `test/e2e/AUTONOMOUS_TESTING.md`
- **POM Documentation**: `/Users/rodrigosilvaferreira/POSITRON_POM_DOCUMENTATION.md`
- **Skill Definition**: `~/.claude/skills/positron-e2e-tests.md`
- **Config**: `test/e2e/.claude-test-agent.config.json`
- **Logs**: `test/e2e/.agent-logs/test-agent.log`

---

## Summary

You now have:
- ✅ AI-powered test generation with POM expertise
- ✅ Continuous CI monitoring
- ✅ Automatic failure detection and healing
- ✅ Self-updating documentation
- ✅ GitHub integration

Just write tests naturally with Claude, push to CI, and let the autonomous system handle failures and documentation. The more you use it, the smarter it gets!

**Start now**: 
```bash
claude -m "Using positron-e2e-tests skill, help me write my first test"
```
