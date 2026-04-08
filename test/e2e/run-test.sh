#!/bin/bash
# Quick e2e test runner with release build

set -e

# Always use release build
export BUILD=/Applications/Positron.app

# Default options
PROJECT="e2e-electron"
HEADED=""

# Show usage
show_usage() {
		cat << EOF
Usage: $0 <test-file> [options]

Run e2e tests against Positron release build

Options:
	--headed							Run with visible browser window
	--project <name>			Test project (default: e2e-electron)
	--grep <pattern>			Run tests matching pattern
	--debug								Run with Playwright inspector

Examples:
	$0 tests/console/console-python.test.ts --headed
	$0 tests/sailor-plots-demo.test.ts --grep "Plots" --headed
	$0 tests/sailor-demo.test.ts --headed --debug

EOF
}

# Parse arguments
if [ $# -eq 0 ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
		show_usage
		exit 0
fi

TEST_FILE="$1"
shift

# Add test/e2e/ prefix if not present
if [[ ! "$TEST_FILE" =~ ^test/e2e/ ]]; then
		TEST_FILE="test/e2e/$TEST_FILE"
fi

# Check if test file exists
if [ ! -f "$TEST_FILE" ]; then
		echo "Error: Test file not found: $TEST_FILE"
		exit 1
fi

# Build command
CMD="npx playwright test $TEST_FILE --project $PROJECT"

# Add remaining arguments
while [ $# -gt 0 ]; do
		case "$1" in
				--headed)
						CMD="$CMD --headed"
						shift
						;;
				--debug)
						CMD="$CMD --debug"
						shift
						;;
				--project)
						PROJECT="$2"
						CMD="$CMD --project $2"
						shift 2
						;;
				--grep)
						CMD="$CMD --grep '$2'"
						shift 2
						;;
				*)
						CMD="$CMD $1"
						shift
						;;
		esac
done

echo "🎯 Running: $CMD"
echo "📦 Using build: $BUILD"
echo ""

# Run the test
eval $CMD
