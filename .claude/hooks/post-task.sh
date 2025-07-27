#!/bin/bash
# Post-Task Hook: Agent-Based Work Validation

# Read JSON input from stdin  
INPUT=$(cat)

# Extract tool parameters using jq
SUBAGENT_TYPE=$(echo "$INPUT" | jq -r '.tool_input.subagent_type // ""')

# Read task context captured by pre-hook
if [ ! -f /tmp/task-context.json ]; then
    echo "ERROR: No task context found - pre-hook may have failed" >&2
    exit 1
fi

TASK_PROMPT=$(jq -r '.prompt' /tmp/task-context.json)
WORKING_DIR=$(jq -r '.working_directory' /tmp/task-context.json)

# Capture current state after task execution
CURRENT_GIT_STATUS=$(git status --porcelain 2>/dev/null || echo "No git repository")

# Log task completion
echo "TASK COMPLETE: $(date) - $SUBAGENT_TYPE" >> /tmp/task-monitor.log

# Agent-based validation based on subagent type
case "$SUBAGENT_TYPE" in
  "implementation-agent")
    echo "  validation: Calling completion-gate for implementation validation" >> /tmp/task-monitor.log
    
    # Create validation context for completion-gate agent
    VALIDATION_PROMPT="Validate that implementation work was actually completed for this task:

Task: $TASK_PROMPT

Please examine the current codebase and determine if:
1. Real implementation work was performed (not just fictional descriptions)
2. The task requirements were actually fulfilled
3. Code changes align with the requested functionality

Respond with either 'COMPLETE' if real implementation work was done, or 'INCOMPLETE' if the work appears fictional or inadequate.

Focus on whether actual deliverables exist that fulfill the task requirements."

    # Validate implementation work by checking for actual changes
    GIT_CHANGES=$(git status --porcelain 2>/dev/null | wc -l)
    
    if [[ $GIT_CHANGES -eq 0 ]]; then
        echo "  enforcement_result: BLOCKED - no git changes detected" >> /tmp/task-monitor.log
        echo "ERROR: implementation-agent claimed implementation but made no actual changes" >&2
        echo "REQUIRED: Use Write, Edit, or MultiEdit tools to create actual deliverables" >&2
        echo "TASK: $TASK_PROMPT" >&2
        exit 2
    else
        echo "  enforcement_result: PASSED - $GIT_CHANGES git changes detected" >> /tmp/task-monitor.log
    fi
    ;;
    
  "devops-agent")
    echo "  validation: Calling completion-gate for devops validation" >> /tmp/task-monitor.log
    
    VALIDATION_PROMPT="Validate that DevOps/deployment work was actually completed for this task:

Task: $TASK_PROMPT

Please examine if real infrastructure/deployment artifacts were created and configured properly.

Respond with either 'COMPLETE' if real DevOps work was done, or 'INCOMPLETE' if the work appears fictional."

    VALIDATION_RESULT=$(echo "$VALIDATION_PROMPT" | timeout 60 claude task completion-gate 2>/dev/null || echo "VALIDATION_TIMEOUT")
    
    if echo "$VALIDATION_RESULT" | grep -qi "INCOMPLETE\|FICTIONAL\|TIMEOUT"; then
        echo "  enforcement_result: BLOCKED - completion-gate rejected devops work" >> /tmp/task-monitor.log
        echo "ERROR: Completion-gate validation failed for devops-agent" >&2
        exit 2
    else
        echo "  enforcement_result: PASSED - completion-gate approved devops work" >> /tmp/task-monitor.log
    fi
    ;;
    
  "functional-testing-agent")
    echo "  validation: Calling quality-gate for testing validation" >> /tmp/task-monitor.log
    
    VALIDATION_PROMPT="Validate that functional testing work was actually performed for this task:

Task: $TASK_PROMPT

Check if real browser testing or test automation was executed.

Respond with either 'COMPLETE' if real testing was performed, or 'INCOMPLETE' if fictional."

    VALIDATION_RESULT=$(echo "$VALIDATION_PROMPT" | timeout 60 claude task quality-gate 2>/dev/null || echo "VALIDATION_TIMEOUT")
    
    if echo "$VALIDATION_RESULT" | grep -qi "INCOMPLETE\|FICTIONAL\|TIMEOUT"; then
        echo "  enforcement_result: WARNING - quality-gate flagged testing work" >> /tmp/task-monitor.log
        echo "WARNING: Testing validation concern: $VALIDATION_RESULT" >&2
    else
        echo "  enforcement_result: PASSED - quality-gate approved testing work" >> /tmp/task-monitor.log
    fi
    ;;
    
  "research-agent"|"general-purpose")
    # Research agents don't claim implementation, so allow without deep validation
    echo "  enforcement_result: ALLOWED - research/analysis work permitted" >> /tmp/task-monitor.log
    ;;
    
  *)
    echo "  enforcement_result: SKIPPED - no validation rules for $SUBAGENT_TYPE" >> /tmp/task-monitor.log
    ;;
esac

echo "---" >> /tmp/task-monitor.log

# Clean up context file
rm -f /tmp/task-context.json