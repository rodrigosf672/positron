#!/bin/bash

# Positron Sailor Mode - POM-Based Autonomous Testing
# Navigates Positron systematically using Page Object Model patterns

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

print_msg() {
    local color=$1
    shift
    echo -e "${color}$@${NC}"
}

print_header() {
    print_msg $CYAN "╔════════════════════════════════════════════════════════════╗"
    print_msg $CYAN "║      Positron Sailor Mode - Autonomous Testing            ║"
    print_msg $CYAN "╚════════════════════════════════════════════════════════════╝"
    echo ""
}

show_usage() {
    print_header
    cat << EOF
Usage: $0 <mode> [options]

Modes:
  deep-dive <feature>    Exhaustive testing of a specific feature
  user-journey <name>    Execute a typical user workflow
  stress-test            Test system under load
  regression             Re-run previously failed scenarios
  fuzzing                Test with unexpected inputs
  custom <workflow>      Execute a custom workflow

Options:
  --duration <seconds>   Maximum execution time (default: from config)
  --no-healing           Disable self-healing
  --no-tests             Don't generate regression tests
  --no-doc-updates       Don't update POM documentation
  --resume              Resume from last checkpoint
  --workflows <group>    Use workflow group (quick-smoke, data-focus, stress, comprehensive)

Examples:
  # Deep dive on Data Explorer
  $0 deep-dive data-explorer

  # Execute user journey
  $0 user-journey python-development

  # Stress test
  $0 stress-test --duration 3600

  # Use workflow group
  $0 user-journey --workflows quick-smoke

  # Resume from checkpoint
  $0 --resume

EOF
}

check_dependencies() {
    if ! command -v claude &> /dev/null; then
        print_msg $RED "Error: Claude CLI not found"
        echo "Please install Claude Code first"
        exit 1
    fi

    if [ ! -f "$HOME/.claude/skills/positron-sailor-mode.md" ]; then
        print_msg $RED "Error: Sailor Mode skill not found"
        echo "Expected: $HOME/.claude/skills/positron-sailor-mode.md"
        exit 1
    fi

    if [ ! -f "$SCRIPT_DIR/config.json" ]; then
        print_msg $RED "Error: Sailor Mode config not found"
        echo "Expected: $SCRIPT_DIR/config.json"
        exit 1
    fi
}

create_session_dir() {
    local session_id=$(date +%Y%m%d_%H%M%S)
    local session_dir="$SCRIPT_DIR/sessions/$session_id"
    mkdir -p "$session_dir"
    echo "$session_dir"
}

start_deep_dive() {
    local feature="$1"
    local duration="${2:-3600}"

    print_msg $BLUE "Starting Deep Dive on: $feature"
    print_msg $YELLOW "Estimated duration: ${duration}s"
    echo ""

    local session_dir=$(create_session_dir)
    local prompt_file="$session_dir/prompt.txt"

    cat > "$prompt_file" << EOF
Activate Sailor Mode: Deep Dive

Feature: $feature
Mode: deep-dive
Max Duration: ${duration} seconds
Self-healing: Enabled
Documentation updates: Enabled
Test generation: Enabled

Execute all workflows related to "$feature" from the workflow definitions.
For each workflow:
1. Execute each step using the corresponding page object
2. Validate expected outcomes
3. Record discoveries
4. Self-heal on failures
5. Generate regression tests

Provide live updates during execution with:
- Current workflow and step
- Success/failure status
- Self-healing attempts
- Discoveries made

Generate a comprehensive report at the end including:
- Workflows executed
- Success rate
- Tests generated
- POM updates
- Bugs found

Begin execution now.
EOF

    print_msg $GREEN "Prompt saved to: $prompt_file"
    print_msg $YELLOW "Invoking Claude with Sailor Mode skill..."
    echo ""

    # Invoke Claude interactively with the prompt
    echo "Using the positron-sailor-mode skill: $(cat "$prompt_file")" | claude

    print_msg $GREEN "\n✓ Sailor Mode session complete"
    print_msg $BLUE "Session directory: $session_dir"
}

start_user_journey() {
    local workflow="$1"
    local workflows_group="$2"

    if [ -z "$workflow" ] && [ -z "$workflows_group" ]; then
        print_msg $RED "Error: Workflow name or group required"
        echo "Usage: $0 user-journey <workflow-name> OR $0 user-journey --workflows <group>"
        echo ""
        echo "Available workflows:"
        jq -r '.workflows | keys[]' "$SCRIPT_DIR/workflows.json"
        echo ""
        echo "Available groups:"
        jq -r '.["workflow-groups"] | keys[]' "$SCRIPT_DIR/workflows.json"
        exit 1
    fi

    print_msg $BLUE "Starting User Journey"
    if [ -n "$workflows_group" ]; then
        print_msg $YELLOW "Workflow Group: $workflows_group"
    else
        print_msg $YELLOW "Workflow: $workflow"
    fi
    echo ""

    local session_dir=$(create_session_dir)
    local prompt_file="$session_dir/prompt.txt"

    if [ -n "$workflows_group" ]; then
        cat > "$prompt_file" << EOF
Activate Sailor Mode: User Journey

Workflow Group: $workflows_group
Mode: user-journey
Self-healing: Enabled
Documentation updates: Enabled
Test generation: Enabled

Load the workflow group "$workflows_group" from sailor-mode/workflows.json.
Execute each workflow in sequence:
1. Execute each step using page objects
2. Validate expected outcomes
3. Record any deviations from expected behavior
4. Self-heal on failures
5. Generate regression tests

Report progress and results.
EOF
    else
        cat > "$prompt_file" << EOF
Activate Sailor Mode: User Journey

Workflow: $workflow
Mode: user-journey
Self-healing: Enabled
Documentation updates: Enabled
Test generation: Enabled

Load workflow "$workflow" from sailor-mode/workflows.json.
Execute the workflow:
1. Execute each step using page objects
2. Validate expected outcomes
3. Self-heal on failures
4. Generate regression test

Report progress and results.
EOF
    fi

    print_msg $YELLOW "Invoking Claude with Sailor Mode skill..."
    echo ""

    echo "Using the positron-sailor-mode skill: $(cat "$prompt_file")" | claude

    print_msg $GREEN "\n✓ User Journey complete"
    print_msg $BLUE "Session directory: $session_dir"
}

start_stress_test() {
    local duration="${1:-3600}"

    print_msg $BLUE "Starting Stress Test"
    print_msg $YELLOW "Duration: ${duration}s"
    echo ""

    local session_dir=$(create_session_dir)
    local prompt_file="$session_dir/prompt.txt"

    cat > "$prompt_file" << EOF
Activate Sailor Mode: Stress Test

Mode: stress-test
Max Duration: ${duration} seconds
Self-healing: Enabled
Test generation: Enabled

Execute stress test workflows:
1. Large dataset operations (100K+ rows)
2. Long-running computations
3. Multiple concurrent sessions
4. Many variables (1000+)
5. Rapid session switching
6. Memory-intensive operations

For each test:
- Monitor performance
- Record response times
- Detect memory leaks
- Test stability
- Self-heal on failures

Report findings including:
- Performance metrics
- Issues discovered
- System limits identified
- Recommendations

Begin stress testing.
EOF

    echo "Using the positron-sailor-mode skill: $(cat "$prompt_file")" | claude

    print_msg $GREEN "\n✓ Stress Test complete"
}

start_regression() {
    print_msg $BLUE "Starting Regression Testing"
    echo ""

    local session_dir=$(create_session_dir)
    local prompt_file="$session_dir/prompt.txt"

    cat > "$prompt_file" << EOF
Activate Sailor Mode: Regression Testing

Mode: regression
Self-healing: Disabled (validate fixes)
Test generation: Disabled

Tasks:
1. Load previously failed scenarios from sailor-mode/sessions/
2. Re-execute each failed workflow
3. Verify fixes are working
4. Check for regressions
5. Report which issues are resolved and which remain

Report:
- Scenarios re-tested
- Previously failed but now passing
- Still failing (regressions)
- New issues discovered

Begin regression testing.
EOF

    echo "Using the positron-sailor-mode skill: $(cat "$prompt_file")" | claude

    print_msg $GREEN "\n✓ Regression Testing complete"
}

start_fuzzing() {
    local duration="${1:-3600}"

    print_msg $BLUE "Starting Fuzzing Mode"
    print_msg $YELLOW "Duration: ${duration}s"
    echo ""

    local session_dir=$(create_session_dir)
    local prompt_file="$session_dir/prompt.txt"

    cat > "$prompt_file" << EOF
Activate Sailor Mode: Fuzzing

Mode: fuzzing
Max Duration: ${duration} seconds
Self-healing: Enabled
Test generation: Enabled (for bugs found)

Test edge cases and unexpected inputs:

Console:
- Special characters in code
- Extremely long lines
- Malformed syntax
- Unicode characters
- Binary data

Variables:
- Very long variable names
- Special characters in names
- Extremely large values
- Nested structures (deep nesting)

Data Explorer:
- Empty DataFrames
- Single row/column DataFrames
- Very wide DataFrames (1000+ columns)
- DataFrames with special column names
- Missing values (NaN, None, null)

For each test:
- Execute the edge case
- Observe behavior
- Report crashes or unexpected behavior
- Generate bug reproduction test if issue found

Report all issues discovered.
EOF

    echo "Using the positron-sailor-mode skill: $(cat "$prompt_file")" | claude

    print_msg $GREEN "\n✓ Fuzzing complete"
}

resume_from_checkpoint() {
    print_msg $BLUE "Resuming from checkpoint..."

    local checkpoint_dir="$SCRIPT_DIR/checkpoints"
    if [ ! -d "$checkpoint_dir" ]; then
        print_msg $RED "Error: No checkpoints found"
        exit 1
    fi

    local latest_checkpoint=$(ls -t "$checkpoint_dir" | head -1)
    if [ -z "$latest_checkpoint" ]; then
        print_msg $RED "Error: No checkpoints found"
        exit 1
    fi

    print_msg $YELLOW "Latest checkpoint: $latest_checkpoint"
    echo ""

    local prompt_file="$checkpoint_dir/$latest_checkpoint/resume.txt"
    cat > "$prompt_file" << EOF
Resume Sailor Mode from checkpoint: $latest_checkpoint

Load the checkpoint state and continue from where it left off.
Review what was completed and what remains.
Continue execution.
EOF

    echo "Using the positron-sailor-mode skill: $(cat "$prompt_file")" | claude

    print_msg $GREEN "\n✓ Resumed session complete"
}

list_sessions() {
    print_msg $BLUE "Recent Sailor Mode Sessions"
    print_msg $BLUE "============================"
    echo ""

    if [ ! -d "$SCRIPT_DIR/sessions" ]; then
        print_msg $YELLOW "No sessions found"
        return
    fi

    local sessions=$(ls -t "$SCRIPT_DIR/sessions" 2>/dev/null || echo "")
    if [ -z "$sessions" ]; then
        print_msg $YELLOW "No sessions found"
        return
    fi

    for session in $sessions; do
        local session_path="$SCRIPT_DIR/sessions/$session"
        if [ -f "$session_path/prompt.txt" ]; then
            local mode=$(grep "Mode:" "$session_path/prompt.txt" | head -1 | cut -d: -f2 | xargs)
            print_msg $GREEN "├─ $session ($mode)"
        else
            print_msg $GREEN "├─ $session"
        fi
    done
    echo ""
}

view_session() {
    local session_id="$1"

    if [ -z "$session_id" ]; then
        print_msg $RED "Error: Session ID required"
        echo "Usage: $0 view-session <session-id>"
        echo ""
        list_sessions
        exit 1
    fi

    local session_path="$SCRIPT_DIR/sessions/$session_id"
    if [ ! -d "$session_path" ]; then
        print_msg $RED "Error: Session not found: $session_id"
        exit 1
    fi

    print_msg $BLUE "Session: $session_id"
    print_msg $BLUE "===================="
    echo ""

    if [ -f "$session_path/prompt.txt" ]; then
        print_msg $YELLOW "Prompt:"
        cat "$session_path/prompt.txt"
        echo ""
    fi

    if [ -f "$session_path/report.txt" ]; then
        print_msg $YELLOW "Report:"
        cat "$session_path/report.txt"
    fi
}

# Main
main() {
    check_dependencies

    local mode="${1:-}"

    case "$mode" in
        deep-dive)
            shift
            start_deep_dive "$@"
            ;;
        user-journey)
            shift
            start_user_journey "$@"
            ;;
        stress-test)
            shift
            start_stress_test "$@"
            ;;
        regression)
            start_regression
            ;;
        fuzzing)
            shift
            start_fuzzing "$@"
            ;;
        --resume|resume)
            resume_from_checkpoint
            ;;
        list-sessions|list)
            list_sessions
            ;;
        view-session|view)
            shift
            view_session "$@"
            ;;
        help|--help|-h|"")
            show_usage
            ;;
        *)
            print_msg $RED "Error: Unknown mode: $mode"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

main "$@"
