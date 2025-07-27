#!/bin/bash
# Pre-Task Hook: Monitor Task tool invocations

# Log the task invocation with timestamp
echo "TASK CALL: $(date)" >> /tmp/task-monitor.log
echo "  subagent_type: $SUBAGENT_TYPE" >> /tmp/task-monitor.log  
echo "  prompt: $PROMPT" >> /tmp/task-monitor.log

# Record current filesystem state for comparison
ls -la > /tmp/pre-task-files.txt
find . -name "*.js" -o -name "*.tsx" -o -name "*.ts" -o -name "*.json" -o -name "*.md" | wc -l > /tmp/pre-task-count.txt

echo "  pre-task files: $(cat /tmp/pre-task-count.txt)" >> /tmp/task-monitor.log
echo "  working_directory: $(pwd)" >> /tmp/task-monitor.log