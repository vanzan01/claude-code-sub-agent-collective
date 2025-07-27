#!/bin/bash
# Post-Task Hook: Verify actual work and enforce deliverables

# Read JSON input from stdin
INPUT=$(cat)

# Extract tool parameters using jq
SUBAGENT_TYPE=$(echo "$INPUT" | jq -r '.tool_input.subagent_type // ""')

# Detect git changes for comprehensive work validation
UNSTAGED_CHANGES=$(git diff --name-only 2>/dev/null | wc -l)
UNTRACKED_FILES=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l)
STAGED_CHANGES=$(git diff --cached --name-only 2>/dev/null | wc -l)
TOTAL_GIT_CHANGES=$((UNSTAGED_CHANGES + UNTRACKED_FILES + STAGED_CHANGES))

# Get baseline changes from pre-task for comparison
BASELINE_CHANGES=0
if [ -f /tmp/git-baseline.txt ]; then
    BASELINE_CHANGES=$(wc -l < /tmp/git-baseline.txt 2>/dev/null || echo 0)
fi

# Calculate net changes made during the task
NET_CHANGES=$((TOTAL_GIT_CHANGES - BASELINE_CHANGES))

echo "POST-TASK: $(date)" >> /tmp/task-monitor.log
echo "  git_changes_detected: $TOTAL_GIT_CHANGES" >> /tmp/task-monitor.log
echo "  net_changes_made: $NET_CHANGES" >> /tmp/task-monitor.log
echo "  unstaged: $UNSTAGED_CHANGES, untracked: $UNTRACKED_FILES, staged: $STAGED_CHANGES" >> /tmp/task-monitor.log

# Agent-specific enforcement logic
case "$SUBAGENT_TYPE" in
  "implementation-agent")
    if [[ $TOTAL_GIT_CHANGES -eq 0 ]]; then
      echo "ERROR: implementation-agent claimed implementation but git shows no changes" >&2
      echo "ENFORCEMENT: Blocking fictional response - no git modifications detected" >&2
      echo "REQUIRED: Use Write, Edit, or MultiEdit tools to make actual changes" >&2
      echo "GIT STATUS: $(git status --porcelain 2>/dev/null || echo 'No git repository')" >&2
      exit 1  # This blocks the Task tool response
    fi
    echo "  enforcement_result: PASSED - $TOTAL_GIT_CHANGES git changes detected" >> /tmp/task-monitor.log
    ;;
  
  "research-agent")
    # Check for research tool usage patterns in logs
    if ! grep -q "Context7\|WebSearch\|WebFetch" /tmp/task-monitor.log; then
      echo "WARNING: research-agent may not have used research tools" >&2
      echo "  enforcement_result: WARNING - no research tool usage detected" >> /tmp/task-monitor.log
    else
      echo "  enforcement_result: PASSED - research tools used" >> /tmp/task-monitor.log
    fi
    ;;
    
  "quality-agent")
    # Check for actual code analysis tool usage
    if ! grep -q "Read\|Grep\|Bash" /tmp/task-monitor.log; then
      echo "WARNING: quality-agent may not have analyzed actual files" >&2
      echo "  enforcement_result: WARNING - no file analysis tools detected" >> /tmp/task-monitor.log
    else
      echo "  enforcement_result: PASSED - analysis tools used" >> /tmp/task-monitor.log
    fi
    ;;
    
  "functional-testing-agent")
    # Check for browser automation tool usage
    if ! grep -q "playwright" /tmp/task-monitor.log; then
      echo "WARNING: functional-testing-agent may not have used browser automation" >&2
      echo "  enforcement_result: WARNING - no Playwright usage detected" >> /tmp/task-monitor.log
    else
      echo "  enforcement_result: PASSED - browser automation tools used" >> /tmp/task-monitor.log
    fi
    ;;
    
  "devops-agent")
    if [[ $TOTAL_GIT_CHANGES -eq 0 ]]; then
      echo "  enforcement_result: BLOCKED - devops-agent made no git changes" >> /tmp/task-monitor.log
      echo "ERROR: devops-agent claimed deployment setup but git shows no changes" >&2
      echo "GIT STATUS: $(git status --porcelain 2>/dev/null || echo 'No git repository')" >&2
      echo "---" >> /tmp/task-monitor.log
      exit 1
    else
      echo "  enforcement_result: ALLOWED - $TOTAL_GIT_CHANGES git changes detected" >> /tmp/task-monitor.log
    fi
    ;;
    
  *)
    echo "  enforcement_result: SKIPPED - no enforcement rules for $SUBAGENT_TYPE" >> /tmp/task-monitor.log
    ;;
esac

echo "  final_git_status: $TOTAL_GIT_CHANGES total changes" >> /tmp/task-monitor.log
echo "---" >> /tmp/task-monitor.log