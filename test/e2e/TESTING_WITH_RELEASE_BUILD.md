# Testing with Positron Release Build

## Setup

The `BUILD` environment variable is configured to always use the Positron release build at `/Applications/Positron.app` for e2e tests.

### Configuration Location
```bash
# In your ~/.zshrc:
export BUILD=/Applications/Positron.app
```

### Apply Now (Without Restarting Shell)
```bash
source ~/.zshrc
```

## Quick Test Runner

Use `./test/e2e/run-test.sh` for convenient test execution:

### Basic Usage
```bash
# Run with visible window
./test/e2e/run-test.sh tests/sailor-plots-demo.test.ts --headed

# Run specific test by pattern
./test/e2e/run-test.sh tests/sailor-demo.test.ts --grep "Python Development" --headed

# Run with debugger
./test/e2e/run-test.sh tests/console/console-python.test.ts --debug

# Without headed (background)
./test/e2e/run-test.sh tests/sailor-plots-demo.test.ts
```

### Paths
You can use either:
- Full path: `test/e2e/tests/sailor-plots-demo.test.ts`
- Short path: `tests/sailor-plots-demo.test.ts` (auto-prefixed)

## Manual Execution

If you prefer to run tests manually:

```bash
# The BUILD variable is already set in your shell
cd ~/positron-1

# Run any test
npx playwright test test/e2e/tests/sailor-plots-demo.test.ts --project e2e-electron --headed

# Check BUILD is set
echo $BUILD
# Should output: /Applications/Positron.app
```

## Sailor Mode Tests

### Plots Demo
```bash
./test/e2e/run-test.sh tests/sailor-plots-demo.test.ts --headed
```

**Workflows**:
- Plots and Visualization (8 steps)
- Generate Bar Chart (3 steps)
- Generate Scatter Plot (3 steps)

### General Demo
```bash
./test/e2e/run-test.sh tests/sailor-demo.test.ts --headed
```

**Workflows**:
- Python Development (7 steps)
- Notebook Workflow (4 steps)
- Data Explorer Features (5 steps)

## Benefits of Using Release Build

✅ **Stable Environment** - Tests against production build  
✅ **Faster Startup** - No development build compilation  
✅ **Real User Experience** - Same as end users see  
✅ **Consistent Results** - Reduces flakiness from dev builds  

## Verify Setup

```bash
# Check environment variable
echo $BUILD
# Expected: /Applications/Positron.app

# Check release build exists
ls -la /Applications/Positron.app
# Should show the Positron.app bundle

# Test a quick workflow
./test/e2e/run-test.sh tests/sailor-plots-demo.test.ts --grep "Bar Chart" --headed
```

## Troubleshooting

### BUILD not set after adding to ~/.zshrc
```bash
# Reload your shell config
source ~/.zshrc

# Or open a new terminal
```

### Release build not found
```bash
# Check if Positron is installed
ls -la /Applications/ | grep Positron

# If not at /Applications/Positron.app, update BUILD variable:
export BUILD=/path/to/your/Positron.app
```

### Tests still using dev build
```bash
# Verify BUILD is set
echo $BUILD

# Force it for current session
export BUILD=/Applications/Positron.app

# Then run test
npx playwright test <test-file> --project e2e-electron --headed
```

## See Also

- Sailor Mode: `sailor-mode/QUICK_START.md`
- Recording Guide: `sailor-mode/RECORDING_GUIDE.md`
- E2E Testing: `CLAUDE.md`
