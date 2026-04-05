# Autonomous Testing System for Positron E2E Tests

This document explains how to use the autonomous testing agent system that monitors CI, self-heals test failures, and updates documentation automatically.

## Overview

The autonomous testing system consists of three main components:

1. **POM Testing Skill** (`~/.claude/skills/positron-e2e-tests.md`)
   - Expert assistant for writing tests
   - Access to complete POM documentation
   - CI monitoring and analysis capabilities

2. **Test Agent** (`test/e2e/scripts/test-agent.ts`)
   - Autonomous CI monitoring
   - Failure detection and classification
   - Self-healing strategies

3. **Configuration** (`test/e2e/.claude-test-agent.config.json`)
   - Control agent behavior
   - Enable/disable features
   - Set thresholds and limits

## Quick Start

### 1. Writing Tests with POM Skill

Use the `positron-e2e-tests` skill when writing tests:

```bash
# In Claude Code, type:
/positron-e2e-tests
```

Or mention it in your request:
```
"Help me write a test using the positron-e2e-tests skill"
```

The skill will:
- Reference the complete POM documentation
- Generate proper test structure
- Follow Positron conventions
- Include appropriate assertions
- Provide run commands

### 2. Autonomous CI Monitoring

Start the monitoring agent:

```bash
cd test/e2e
npx tsx scripts/test-agent.ts monitor
```

This will:
- Monitor CI runs every 5 minutes (configurable)
- Detect failures automatically
- Classify failure types
- Report findings

### 3. Manual Test Healing

To heal a specific failed test:

```bash
# Tell Claude:
"Analyze and fix the failing test in my-test.test.ts using auto-heal"
```

Claude will:
1. Read the test file
2. Analyze the failure
3. Apply appropriate fix
4. Update page objects if needed
5. Update POM documentation
6. Commit changes

## Workflow: Complete Test Development Cycle

### Step 1: Write Test with Skill

```bash
# In Claude Code:
"I need to write a test that creates a DataFrame in Python and 
opens it in the Data Explorer. Use the positron-e2e-tests skill."
```

Claude will generate:
```typescript
import { test, expect } from './_test.setup';

test.use({
    suiteId: __filename
});

test.describe('Data Explorer', () => {
    test('should open DataFrame in Data Explorer', async ({ app, python }) => {
        await test.step('Create DataFrame', async () => {
            await app.workbench.console.executeCode(
                'Python',
                `import pandas as pd
df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})`
            );
        });

        await test.step('Open in Data Explorer', async () => {
            await app.workbench.variables.doubleClickVariableRow('df');
            await app.workbench.dataExplorer.waitForIdle();
        });

        await test.step('Verify data', async () => {
            await app.workbench.dataExplorer.grid.verifyTableDataLength(3);
        });
    });
});
```

### Step 2: Run Locally

```bash
npx playwright test your-test.test.ts --project e2e-electron
```

### Step 3: Push to CI

```bash
git add your-test.test.ts
git commit -m "Add Data Explorer test"
git push origin your-branch
```

### Step 4: Monitor CI (Automatic)

If you started the monitoring agent, it will automatically:
1. Detect your CI run
2. Monitor for completion
3. If it fails, analyze the failure
4. Report findings to you

### Step 5: Auto-Heal (if failure detected)

Tell Claude:
```bash
"The test failed in CI. Auto-heal it using the test agent."
```

Claude will:
1. Fetch CI logs
2. Analyze failure (timeout, selector, assertion, etc.)
3. Apply appropriate fix:
   - **Timeout**: Increase timeout or add proper wait
   - **Selector**: Update page object selector
   - **Assertion**: Update test expectation
   - **Race condition**: Add state verification
4. Update POM documentation if needed
5. Push fix

### Step 6: Verify Fix

The agent will suggest:
```bash
# Re-run the test locally
npx playwright test your-test.test.ts --project e2e-electron

# Or push to CI again
git push origin your-branch
```

## Configuration

Edit `test/e2e/.claude-test-agent.config.json`:

```json
{
  "monitoring": {
    "enabled": true,              // Enable CI monitoring
    "checkIntervalSeconds": 300,  // Check every 5 minutes
    "autoHealOnFailure": true     // Automatically fix failures
  },

  "healing": {
    "enabled": true,              // Enable self-healing
    "maxAttempts": 3,             // Max healing attempts per test
    "requireApprovalForChanges": false  // Auto-apply fixes
  },

  "documentation": {
    "autoUpdate": true,           // Update POM doc automatically
    "commitChanges": true         // Auto-commit doc updates
  }
}
```

## Healing Strategies

The agent applies different strategies based on failure type:

### 1. Timeout Failures

**Symptoms:**
```
Error: Timeout 30000ms exceeded waiting for...
```

**Healing Actions:**
- Increase timeout to 60000ms
- Add explicit `waitFor` condition
- Verify selector is correct
- Add retry mechanism

**Example Fix:**
```typescript
// Before (fails)
await element.click({ timeout: 30000 });

// After (healed)
await expect(element).toBeVisible({ timeout: 60000 });
await element.click();
```

### 2. Selector Not Found

**Symptoms:**
```
Error: Locator not found: .my-selector
```

**Healing Actions:**
- Update selector in page object
- Add wait for element
- Check if UI structure changed
- Use alternative selector strategy

**Example Fix:**
```typescript
// Update page object
// Before
get myButton(): Locator { 
    return this.page.locator('.old-selector'); 
}

// After
get myButton(): Locator { 
    return this.page.locator('.new-selector'); 
}
```

### 3. Assertion Failures

**Symptoms:**
```
Error: Expected "actual" to equal "expected"
```

**Healing Actions:**
- Update test expectation
- Verify application behavior changed
- Add intermediate verification
- Update POM documentation

**Example Fix:**
```typescript
// Before (fails)
await expect(value).toBe('42');

// After (healed)
await expect(value).toBe('43');  // App behavior changed
```

### 4. Race Conditions

**Symptoms:**
- Flaky tests
- Intermittent failures
- "Element not ready" errors

**Healing Actions:**
- Add proper state verification
- Use polling patterns
- Add `waitForLoadState`
- Increase stability waits

**Example Fix:**
```typescript
// Before (flaky)
await button.click();
await input.fill('text');

// After (stable)
await button.click();
await expect(button).toHaveAttribute('data-state', 'active');
await input.fill('text');
```

## POM Documentation Updates

When the agent discovers:
- **New selector**: Adds to page object documentation
- **New method**: Documents with signature and example
- **New pattern**: Adds to "Usage Patterns" section
- **Common pitfall**: Adds to "Best Practices" section

Example update:
```markdown
### Common Issues

#### Timeout in Data Explorer Grid

**Problem**: Grid loading times out with default 30s

**Solution**: Use `waitForIdle()` before grid operations

**Example**:
\`\`\`typescript
await app.workbench.dataExplorer.waitForIdle();
await app.workbench.dataExplorer.grid.selectCell(0, 0);
\`\`\`

**Added**: 2026-04-03 (from CI failure analysis)
```

## Advanced Usage

### Custom Healing Strategy

Tell Claude:
```bash
"When test X fails with timeout, instead of increasing timeout,
add a retry mechanism. Update the healing strategy."
```

### Multi-Test Healing

```bash
"Analyze all failing tests in the console/ directory and fix them."
```

Claude will:
1. Find all failing tests
2. Classify each failure
3. Apply fixes in batch
4. Update documentation
5. Create a single commit

### Preventive Analysis

```bash
"Analyze all tests for potential race conditions before CI runs."
```

Claude will:
1. Read all test files
2. Identify missing waits
3. Suggest improvements
4. Apply fixes proactively

## Integration with GitHub

The agent can interact with GitHub:

```bash
# Check PR status
gh pr checks 123

# Get CI logs
gh run view 456 --log

# Comment on PR (if failure healed)
gh pr comment 123 --body "Test failure auto-healed in commit abc123"
```

## Monitoring Commands

### View Agent Logs

```bash
tail -f test/e2e/.agent-logs/test-agent.log
```

### Check Configuration

```bash
cat test/e2e/.claude-test-agent.config.json
```

### Manual Analysis

```bash
# Download CI logs
gh run view <run-id> --log > failure.log

# Ask Claude to analyze
"Analyze the failure log in failure.log and suggest fixes"
```

## Best Practices

### 1. Use Descriptive Test Names

Good test names help the agent understand what's being tested:

```typescript
// Good
test('should display Python variable in variables pane after execution', ...)

// Bad
test('test1', ...)
```

### 2. Add Comments for Complex Logic

Help the agent understand intent:

```typescript
// Wait for session to be fully initialized before executing code
// This prevents race conditions with interpreter startup
await app.workbench.console.waitForReady('>>>');
```

### 3. Use test.step() for Clarity

Makes failures easier to debug:

```typescript
await test.step('Create DataFrame', async () => { ... });
await test.step('Open in Data Explorer', async () => { ... });
```

### 4. Follow POM Patterns

The agent understands POM patterns better:

```typescript
// Good - uses page object
await app.workbench.console.executeCode('Python', code);

// Bad - direct Playwright API
await page.locator('.console-input').fill(code);
```

### 5. Enable Auto-Commit

Let the agent commit fixes:

```json
{
  "documentation": {
    "commitChanges": true
  }
}
```

## Troubleshooting

### Agent Not Detecting Failures

Check:
1. Is monitoring enabled in config?
2. Is `gh` CLI authenticated?
3. Are you checking the right workflow name?

```bash
# Verify gh CLI works
gh run list --workflow="E2E Tests"

# Check config
cat test/e2e/.claude-test-agent.config.json
```

### Healing Not Working

Check:
1. Is healing enabled in config?
2. Does Claude have file write permissions?
3. Are there compilation errors?

```bash
# Check config
jq '.healing.enabled' test/e2e/.claude-test-agent.config.json

# Try manual healing
"Manually analyze and fix test-file.test.ts"
```

### Documentation Not Updating

Check:
1. Is auto-update enabled?
2. Does POM doc path exist?
3. Are there git conflicts?

```bash
# Verify path
ls -la /Users/rodrigosilvaferreira/POSITRON_POM_DOCUMENTATION.md

# Check git status
git status
```

## Examples

### Example 1: Timeout Healing

**CI Failure:**
```
Error: Timeout 30000ms exceeded
  at app.workbench.dataExplorer.waitForIdle()
```

**Claude Analysis:**
```
Type: timeout
Cause: Data Explorer takes longer to load large datasets
Fix: Increase timeout to 60000ms
```

**Applied Fix:**
```diff
- await app.workbench.dataExplorer.waitForIdle();
+ await app.workbench.dataExplorer.waitForIdle({ timeout: 60000 });
```

**POM Doc Update:**
```markdown
Note: For large datasets (>10000 rows), increase timeout:
`await dataExplorer.waitForIdle({ timeout: 60000 });`
```

### Example 2: Selector Update

**CI Failure:**
```
Error: Locator not found: .positron-console-input
```

**Claude Analysis:**
```
Type: selector-not-found
Cause: Console input class name changed
Fix: Update selector in console.ts page object
```

**Applied Fix:**
```diff
// pages/console.ts
- get consoleInput(): Locator { return this.page.locator('.positron-console-input'); }
+ get consoleInput(): Locator { return this.page.locator('.console-input-container input'); }
```

**POM Doc Update:**
```markdown
Updated: Selector changed from `.positron-console-input` 
to `.console-input-container input` (2026-04-03)
```

### Example 3: Assertion Update

**CI Failure:**
```
Error: Expected "Python 3.10.0" to equal "Python 3.11.0"
```

**Claude Analysis:**
```
Type: assertion-failed
Cause: CI environment updated Python version
Fix: Update test to check for 3.11.0 or use flexible pattern
```

**Applied Fix:**
```diff
- await app.workbench.sessions.expectInterpreterToBe('Python 3.10.0');
+ await app.workbench.sessions.expectInterpreterToBe(/Python 3\.1[01]\.0/);
```

## Getting Help

Ask Claude:
```bash
"How do I use the autonomous testing system?"
"My test is failing with timeout - auto-heal it"
"Update the POM documentation with the new selector I just added"
"Monitor CI for the next hour and report any failures"
```

## Summary

The autonomous testing system provides:
- ✅ Intelligent test writing assistance
- ✅ Automatic CI monitoring
- ✅ Self-healing for common failure patterns
- ✅ Automatic documentation updates
- ✅ GitHub integration
- ✅ Comprehensive logging

Just write tests, push to CI, and let the agent handle failures and documentation!
