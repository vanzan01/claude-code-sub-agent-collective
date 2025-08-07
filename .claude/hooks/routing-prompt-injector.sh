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
    
    # Output JSON for prompt injection with @agent syntax
    cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "injectedPrompt": "🎯 ROUTING SUCCESS DETECTED - EXECUTING HANDOFF\n\nHandoff Token: $HANDOFF_TOKEN\nTarget Agent: $TARGET_AGENT\n\n@$TARGET_AGENT $ORIGINAL_REQUEST"
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
        # Output retry instruction with @agent syntax
        cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse", 
    "injectedPrompt": "🔄 ROUTING RETRY $RETRY_COUNT/3: No HANDOFF_TOKEN detected. Automatically retrying routing-agent with format requirements.\n\n@routing-agent $ORIGINAL_REQUEST\n\nMANDATORY FORMAT REQUIREMENT: Your response MUST end with these exact two lines:\nHANDOFF_TOKEN: [generate a unique token]\n@[target-agent-name]\n\nThe handoff token must be in format: HANDOFF_TOKEN: [A-Z0-9_]+ and the agent name must start with @"
  }
}
EOF
        echo "RETRY_PROMPT_INJECTION: Attempt $RETRY_COUNT" >> /tmp/routing-log.log
        exit 0
    else
        # All retries exhausted - execute fallback agent directly
        cat << EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "injectedPrompt": "❌ ROUTING SYSTEM FAILURE: All retries exhausted ($RETRY_COUNT attempts). Executing fallback direct implementation.\n\n@component-implementation-agent $ORIGINAL_REQUEST"
  }
}
EOF
        
        rm -f "$RETRY_COUNT_FILE"
        echo "ESCALATION_PROMPT_INJECTION: Max retries reached" >> /tmp/routing-log.log
        exit 0
    fi
fi