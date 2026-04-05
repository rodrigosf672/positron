#!/bin/bash

# Claude Test Helper Script
# Provides easy commands to interact with the autonomous testing system

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
POM_DOC="/Users/rodrigosilvaferreira/POSITRON_POM_DOCUMENTATION.md"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_msg() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

# Show usage
show_usage() {
    cat << EOF
$(print_msg $BLUE "Positron E2E Test Helper")
$(print_msg $BLUE "========================")

Usage: $0 <command> [options]

Commands:
  write-test <description>    Generate a new test based on description
  heal-test <test-file>       Analyze and fix a failing test
  monitor-ci                  Start CI monitoring agent
  analyze-logs <log-file>     Analyze failure logs
  update-pom                  Update POM documentation
  check-status                Check CI status for latest runs

Examples:
  $0 write-test "Test Python variable creation"
  $0 heal-test console-basic.test.ts
  $0 monitor-ci
  $0 analyze-logs failure.log
  $0 check-status

EOF
}

# Verify Claude is available
check_claude() {
    if ! command -v claude &> /dev/null; then
        print_msg $RED "Error: Claude CLI not found"
        echo "Please install Claude Code first"
        exit 1
    fi
}

# Write a new test
write_test() {
    local description="$1"

    if [ -z "$description" ]; then
        print_msg $RED "Error: Test description required"
        echo "Usage: $0 write-test \"description\""
        exit 1
    fi

    print_msg $BLUE "Generating test: $description"
    print_msg $YELLOW "Using positron-e2e-tests skill..."

    # Create a prompt file
    local prompt_file="/tmp/claude-test-prompt.txt"
    cat > "$prompt_file" << EOF
Using the positron-e2e-tests skill, write a complete e2e test for:

$description

Requirements:
- Follow Positron test conventions
- Use appropriate page objects from POM documentation
- Include proper test.use({ suiteId: __filename })
- Use test.step() for clarity
- Add appropriate assertions
- Provide the run command

After generating the test, save it to an appropriate file in test/e2e/tests/
EOF

    # Invoke Claude with the skill
    claude -m "$(<$prompt_file)"

    rm -f "$prompt_file"
    print_msg $GREEN "✓ Test generated"
}

# Heal a failing test
heal_test() {
    local test_file="$1"

    if [ -z "$test_file" ]; then
        print_msg $RED "Error: Test file required"
        echo "Usage: $0 heal-test <test-file>"
        exit 1
    fi

    # Find the test file
    local full_path=""
    if [ -f "$test_file" ]; then
        full_path="$test_file"
    elif [ -f "$PROJECT_ROOT/test/e2e/tests/$test_file" ]; then
        full_path="$PROJECT_ROOT/test/e2e/tests/$test_file"
    else
        # Search for it
        full_path=$(find "$PROJECT_ROOT/test/e2e/tests" -name "$test_file" 2>/dev/null | head -1)
    fi

    if [ -z "$full_path" ]; then
        print_msg $RED "Error: Test file not found: $test_file"
        exit 1
    fi

    print_msg $BLUE "Healing test: $full_path"
    print_msg $YELLOW "Analyzing failure and applying fix..."

    # Create healing prompt
    local prompt_file="/tmp/claude-heal-prompt.txt"
    cat > "$prompt_file" << EOF
Using the positron-e2e-tests skill, analyze and fix the failing test:

File: $full_path

Steps:
1. Read the test file
2. Identify the failure (check CI logs if needed)
3. Classify failure type (timeout, selector, assertion, race condition)
4. Apply appropriate fix
5. Update page objects if needed
6. Update POM documentation if selectors or patterns changed
7. Run the test locally to verify fix

Provide:
- Analysis of what failed and why
- The specific fix applied
- Any POM documentation updates
- Command to re-run the test
EOF

    claude -m "$(<$prompt_file)"

    rm -f "$prompt_file"
    print_msg $GREEN "✓ Healing completed"
}

# Monitor CI
monitor_ci() {
    print_msg $BLUE "Starting CI monitoring..."
    print_msg $YELLOW "Press Ctrl+C to stop"

    cd "$PROJECT_ROOT/test/e2e"
    npx tsx scripts/test-agent.ts monitor
}

# Analyze failure logs
analyze_logs() {
    local log_file="$1"

    if [ -z "$log_file" ]; then
        print_msg $RED "Error: Log file required"
        echo "Usage: $0 analyze-logs <log-file>"
        exit 1
    fi

    if [ ! -f "$log_file" ]; then
        print_msg $RED "Error: Log file not found: $log_file"
        exit 1
    fi

    print_msg $BLUE "Analyzing failure logs: $log_file"

    local prompt_file="/tmp/claude-analyze-prompt.txt"
    cat > "$prompt_file" << EOF
Using the positron-e2e-tests skill, analyze these failure logs:

File: $log_file

Extract:
1. All failing tests (file names and test names)
2. Failure types (timeout, selector, assertion, etc.)
3. Page objects involved
4. Suggested fixes for each failure

Then:
- Group similar failures
- Prioritize fixes
- Provide a fix plan

Optionally apply fixes if requested.
EOF

    # Read log file content
    local log_content="$(<$log_file)"

    claude -m "$(<$prompt_file)" --context "$log_content"

    rm -f "$prompt_file"
    print_msg $GREEN "✓ Analysis completed"
}

# Update POM documentation
update_pom() {
    print_msg $BLUE "Updating POM documentation..."

    local prompt_file="/tmp/claude-update-pom-prompt.txt"
    cat > "$prompt_file" << EOF
Review and update the POM documentation at:
$POM_DOC

Check for:
1. Missing page objects (compare with test/e2e/pages/)
2. Outdated selectors or methods
3. Missing examples
4. New patterns discovered in recent tests

Update the documentation with any findings.
EOF

    claude -m "$(<$prompt_file)"

    rm -f "$prompt_file"
    print_msg $GREEN "✓ POM documentation updated"
}

# Check CI status
check_status() {
    print_msg $BLUE "Checking CI status..."

    if ! command -v gh &> /dev/null; then
        print_msg $RED "Error: GitHub CLI (gh) not found"
        echo "Please install: brew install gh"
        exit 1
    fi

    print_msg $YELLOW "Recent E2E test runs:"
    gh run list --workflow="E2E Tests" --limit 5

    echo ""
    print_msg $YELLOW "Recent PR checks:"
    gh pr checks --repo posit-dev/positron 2>/dev/null || echo "No PR found in current branch"
}

# Main command dispatcher
main() {
    check_claude

    local command="${1:-}"

    case "$command" in
        write-test)
            shift
            write_test "$@"
            ;;
        heal-test)
            shift
            heal_test "$@"
            ;;
        monitor-ci)
            monitor_ci
            ;;
        analyze-logs)
            shift
            analyze_logs "$@"
            ;;
        update-pom)
            update_pom
            ;;
        check-status)
            check_status
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            if [ -z "$command" ]; then
                show_usage
            else
                print_msg $RED "Error: Unknown command: $command"
                echo ""
                show_usage
                exit 1
            fi
            ;;
    esac
}

main "$@"
