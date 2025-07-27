#!/bin/bash
# Pre-Task Hook: Capture task context for validation

# Read JSON input from stdin
INPUT=$(cat)

# Extract tool parameters using jq
SUBAGENT_TYPE=$(echo "$INPUT" | jq -r '.tool_input.subagent_type // ""')
PROMPT=$(echo "$INPUT" | jq -r '.tool_input.prompt // ""')
DESCRIPTION=$(echo "$INPUT" | jq -r '.tool_input.description // ""')

# Store task context for validation agent
cat > /tmp/task-context.json << EOF
{
  "timestamp": "$(date -Iseconds)",
  "subagent_type": "$SUBAGENT_TYPE",
  "prompt": "$PROMPT", 
  "description": "$DESCRIPTION",
  "working_directory": "$(pwd)",
  "git_status_before": "$(git status --porcelain 2>/dev/null || echo 'No git repository')"
}
EOF

# Simple logging for monitoring
echo "TASK START: $(date) - $SUBAGENT_TYPE" >> /tmp/task-monitor.log
echo "  prompt: $PROMPT" >> /tmp/task-monitor.log