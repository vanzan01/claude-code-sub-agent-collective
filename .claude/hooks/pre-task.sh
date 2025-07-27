#!/bin/bash
# Pre-Task Hook: Monitor Task tool invocations

# Read JSON input from stdin
INPUT=$(cat)

# Extract tool parameters using jq
SUBAGENT_TYPE=$(echo "$INPUT" | jq -r '.tool_input.subagent_type // ""')
PROMPT=$(echo "$INPUT" | jq -r '.tool_input.prompt // ""')

# Log the task invocation with timestamp
echo "TASK CALL: $(date)" >> /tmp/task-monitor.log
echo "  subagent_type: $SUBAGENT_TYPE" >> /tmp/task-monitor.log  
echo "  prompt: $PROMPT" >> /tmp/task-monitor.log

# Record current git state for comprehensive change detection
git status --porcelain > /tmp/git-baseline.txt 2>/dev/null || echo "" > /tmp/git-baseline.txt

# Count current changes for logging
UNSTAGED_CHANGES=$(git diff --name-only 2>/dev/null | wc -l)
UNTRACKED_FILES=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l)
STAGED_CHANGES=$(git diff --cached --name-only 2>/dev/null | wc -l)
BASELINE_CHANGES=$((UNSTAGED_CHANGES + UNTRACKED_FILES + STAGED_CHANGES))

echo "  git_baseline_changes: $BASELINE_CHANGES" >> /tmp/task-monitor.log
echo "  working_directory: $(pwd)" >> /tmp/task-monitor.log