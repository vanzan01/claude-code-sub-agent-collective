#!/bin/bash
# Post-Workflow Hook: Automatic Routing Enforcement
# Ensures workflow-agent routing instructions are ALWAYS followed

# Read JSON input from stdin  
INPUT=$(cat)

# Extract tool parameters
SUBAGENT_TYPE=$(echo "$INPUT" | jq -r '.tool_input.subagent_type // ""')
TOOL_RESULT=$(echo "$INPUT" | jq -r '.tool_result // ""')

# Only process workflow-agent responses
if [[ "$SUBAGENT_TYPE" != "workflow-agent" ]]; then
    exit 0
fi

echo "WORKFLOW ROUTING ENFORCEMENT: $(date)" >> /tmp/routing-log.log

# Parse routing instructions from workflow-agent response
NEXT_AGENT=$(echo "$TOOL_RESULT" | grep -o "Execute [a-zA-Z-]* with" | sed 's/Execute //' | sed 's/ with//')

if [[ -n "$NEXT_AGENT" ]]; then
    echo "  ROUTING FOUND: $NEXT_AGENT" >> /tmp/routing-log.log
    
    # Extract context/prompt for next agent
    CONTEXT=$(echo "$TOOL_RESULT" | sed -n '/Context:/,/Success Criteria:/p' | sed '1d;$d')
    
    if [[ -z "$CONTEXT" ]]; then
        # Fallback: use task description from workflow plan
        CONTEXT=$(echo "$TOOL_RESULT" | grep "Task:" | head -1 | sed 's/.*Task: //')
    fi
    
    echo "  CONTEXT: $CONTEXT" >> /tmp/routing-log.log
    echo "  EXECUTING: claude task --subagent-type $NEXT_AGENT" >> /tmp/routing-log.log
    
    # AUTO-EXECUTE THE NEXT AGENT
    echo "$CONTEXT" | claude task --subagent-type "$NEXT_AGENT" --prompt-from-stdin
    
    echo "  ROUTING COMPLETE: $(date)" >> /tmp/routing-log.log
else
    echo "  NO ROUTING FOUND - workflow-agent response may be analysis only" >> /tmp/routing-log.log
fi

echo "---" >> /tmp/routing-log.log