#!/bin/bash

# Routing Prompt Injector Hook
# Converts successful routing detection into direct prompt injection for Claude

# Read JSON input from stdin
INPUT=$(cat)

# Extract tool output from the input JSON
TOOL_OUTPUT=$(echo "$INPUT" | jq -r '.tool_response.content[0].text // ""' 2>/dev/null)

# Log debug information
echo "=== ROUTING PROMPT INJECTOR: $(date) ===" >> /tmp/routing-log.log
echo "TOOL_OUTPUT_PREVIEW: $(echo "$TOOL_OUTPUT" | head -c 200)..." >> /tmp/routing-log.log

# Check for completion scenarios first
if echo "$TOOL_OUTPUT" | grep -qiE '(COMPLETE|TASK.*COMPLETE|ALREADY.*COMPLETE|TASK.*DONE|IMPLEMENTATION.*COMPLETE|WORK.*COMPLETE|FULLY.*COMPLETE|PROJECT.*COMPLETE)'; then
    echo "COMPLETION_TOKEN: TASK_COMPLETE_$(date +%s)" >> /tmp/routing-log.log
    # No prompt injection needed - task is complete
    exit 0
fi

# Check for handoff token
if echo "$TOOL_OUTPUT" | grep -q 'HANDOFF_TOKEN:[[:space:]]*[A-Z0-9_]\+'; then
    # Extract the handoff token
    HANDOFF_TOKEN=$(echo "$TOOL_OUTPUT" | grep -o 'HANDOFF_TOKEN:[[:space:]]*[A-Z0-9_]\+' | sed 's/HANDOFF_TOKEN:[[:space:]]*//')
    
    # Extract the target agent from the routing response
    TARGET_AGENT=$(echo "$TOOL_OUTPUT" | grep -o '@[a-z-]*-agent' | head -1 | sed 's/@//')
    
    # Extract the original user request (this needs to be passed through somehow)
    # For now, we'll use a generic prompt that can be customized
    ORIGINAL_REQUEST="create a todo application using html, css, js"
    
    echo "ROUTING_SUCCESS: Token=$HANDOFF_TOKEN, Target=$TARGET_AGENT" >> /tmp/routing-log.log
    
    # Output JSON for prompt injection
    cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "injectedPrompt": "IMMEDIATE ACTION REQUIRED: You have successfully routed a request and must now execute the handoff. Execute this exact Task tool call immediately:\n\nTask(subagent_type='$TARGET_AGENT', description='Execute routed request', prompt='$ORIGINAL_REQUEST')\n\nDo not respond with explanatory text - execute the Task tool call now."
  }
}
EOF
    
    echo "PROMPT_INJECTION: Generated for $TARGET_AGENT with token $HANDOFF_TOKEN" >> /tmp/routing-log.log
    exit 0
    
else
    # No handoff token found - use retry logic from original script
    echo "ROUTING_FAILURE: No handoff token found" >> /tmp/routing-log.log
    
    # Check retry count
    RETRY_COUNT_FILE="/tmp/routing-retry-count"
    
    if [[ -f "$RETRY_COUNT_FILE" ]]; then
        RETRY_COUNT=$(cat "$RETRY_COUNT_FILE")
    else
        RETRY_COUNT=0
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "$RETRY_COUNT" > "$RETRY_COUNT_FILE"
    
    echo "RETRY_ATTEMPT: $RETRY_COUNT" >> /tmp/routing-log.log
    
    # Progressive retry system with prompt injection
    if [[ $RETRY_COUNT -le 3 ]]; then
        # Output retry instruction as prompt injection
        cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse", 
    "injectedPrompt": "ROUTING FAILURE DETECTED (Attempt $RETRY_COUNT/3): The routing-agent did not provide the required HANDOFF_TOKEN format. Retry the routing-agent call with this exact format requirement:\n\nTask(subagent_type='routing-agent', description='Retry routing', prompt='create a todo application using html, css, js - MANDATORY FORMAT: Your response must contain these exact lines: HANDOFF_TOKEN: [generate token] and @[agent-name]')"
  }
}
EOF
        echo "RETRY_PROMPT_INJECTION: Attempt $RETRY_COUNT" >> /tmp/routing-log.log
        exit 0
    else
        # All retries exhausted
        cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "injectedPrompt": "ROUTING SYSTEM FAILURE: All automatic retries exhausted ($RETRY_COUNT attempts). The routing-agent is unable to provide the required HANDOFF_TOKEN format. Please implement the request directly using the appropriate agent: Task(subagent_type='component-implementation-agent', description='Direct implementation', prompt='create a todo application using html, css, js')"
  }
}
EOF
        
        rm -f "$RETRY_COUNT_FILE"
        echo "ESCALATION_PROMPT_INJECTION: Max retries reached" >> /tmp/routing-log.log
        exit 0
    fi
fi