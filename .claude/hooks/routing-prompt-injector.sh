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
echo "FULL_INPUT_JSON: $INPUT" >> /tmp/routing-log.log

# Check for completion scenarios first - must be actual completion statements, not just words containing "COMPLETE"
if echo "$TOOL_OUTPUT" | grep -qiE '(^COMPLETE|TASK[[:space:]]+COMPLETE|ALREADY[[:space:]]+COMPLETE|TASK[[:space:]]+DONE|IMPLEMENTATION[[:space:]]+COMPLETE|WORK[[:space:]]+COMPLETE|FULLY[[:space:]]+COMPLETE)'; then
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
    
    # Extract the original user request from the tool parameters
    ORIGINAL_REQUEST=$(echo "$INPUT" | jq -r '.tool_request.params.prompt // ""' 2>/dev/null)
    
    # Fallback: try different JSON paths
    if [[ -z "$ORIGINAL_REQUEST" || "$ORIGINAL_REQUEST" == "null" ]]; then
        ORIGINAL_REQUEST=$(echo "$INPUT" | jq -r '.tool_call.parameters.prompt // ""' 2>/dev/null)
    fi
    
    # Last fallback: extract from tool output if routing-agent echoed it
    if [[ -z "$ORIGINAL_REQUEST" || "$ORIGINAL_REQUEST" == "null" ]]; then
        ORIGINAL_REQUEST="implement the user's request"
    fi
    
    echo "ROUTING_SUCCESS: Token=$HANDOFF_TOKEN, Target=$TARGET_AGENT" >> /tmp/routing-log.log
    
    # Generate natural routing continuation that works with Claude's built-in agent routing
    cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "injectedPrompt": "Based on the routing analysis, I'll now use the @$TARGET_AGENT to handle this request. This agent MUST BE USED PROACTIVELY to implement the solution.\n\nHandoff Token: $HANDOFF_TOKEN\n\nUsing @$TARGET_AGENT to: $ORIGINAL_REQUEST"
  }
}
EOF
    
    echo "PROMPT_INJECTION: Generated for $TARGET_AGENT with token $HANDOFF_TOKEN" >> /tmp/routing-log.log
    exit 0
    
else
    # No handoff token found - use retry logic from original script
    echo "ROUTING_FAILURE: No handoff token found" >> /tmp/routing-log.log
    
    # Extract the original user request for retry
    ORIGINAL_REQUEST=$(echo "$INPUT" | jq -r '.tool_request.params.prompt // ""' 2>/dev/null)
    if [[ -z "$ORIGINAL_REQUEST" || "$ORIGINAL_REQUEST" == "null" ]]; then
        ORIGINAL_REQUEST=$(echo "$INPUT" | jq -r '.tool_call.parameters.prompt // ""' 2>/dev/null)
    fi
    if [[ -z "$ORIGINAL_REQUEST" || "$ORIGINAL_REQUEST" == "null" ]]; then
        ORIGINAL_REQUEST="implement the user's request"
    fi
    
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
    
    # Progressive retry system with automatic Task tool execution
    if [[ $RETRY_COUNT -le 3 ]]; then
        # Output natural retry instruction 
        cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse", 
    "injectedPrompt": "Routing attempt $RETRY_COUNT/3: The routing-agent needs to provide a clearer handoff format. I'll retry the @routing-agent with specific format requirements.\n\nRequest: $ORIGINAL_REQUEST\n\nNote: Response MUST end with HANDOFF_TOKEN: [TOKEN] and @[agent-name]"
  }
}
EOF
        echo "RETRY_PROMPT_INJECTION: Attempt $RETRY_COUNT" >> /tmp/routing-log.log
        exit 0
    else
        # All retries exhausted - use natural fallback with dynamic agent selection
        # Determine fallback agent based on request type
        FALLBACK_AGENT="component-implementation-agent"
        if echo "$ORIGINAL_REQUEST" | grep -qi "test\|spec"; then
            FALLBACK_AGENT="testing-implementation-agent"
        elif echo "$ORIGINAL_REQUEST" | grep -qi "deploy\|infrastructure\|build"; then
            FALLBACK_AGENT="devops-agent"
        elif echo "$ORIGINAL_REQUEST" | grep -qi "research\|analyze\|investigate"; then
            FALLBACK_AGENT="research-agent"
        fi
        
        cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "injectedPrompt": "Routing failed after $RETRY_COUNT attempts. Using fallback approach with @$FALLBACK_AGENT. This agent MUST BE USED PROACTIVELY to handle the request.\n\nFallback execution for: $ORIGINAL_REQUEST\n\nUsing @$FALLBACK_AGENT as the most appropriate agent for this type of work."
  }
}
EOF
        
        rm -f "$RETRY_COUNT_FILE"
        echo "ESCALATION_PROMPT_INJECTION: Max retries reached" >> /tmp/routing-log.log
        exit 0
    fi
fi