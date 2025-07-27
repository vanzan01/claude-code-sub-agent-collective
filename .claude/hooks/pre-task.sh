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

# Record current filesystem state for comparison
find . -type f \( -name "*.js" -o -name "*.tsx" -o -name "*.ts" -o -name "*.json" -o -name "*.md" -o -name "*.sh" -o -name "*.yml" -o -name "*.yaml" -o -name "*.example" -o -name "Dockerfile" \) | wc -l > /tmp/pre-task-count.txt

echo "  pre-task files: $(cat /tmp/pre-task-count.txt)" >> /tmp/task-monitor.log
echo "  working_directory: $(pwd)" >> /tmp/task-monitor.log