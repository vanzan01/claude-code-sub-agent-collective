#!/bin/bash

# Routing Executor Hook
# Enhanced routing validation with actionable feedback and automatic handoff execution

# Read JSON input from stdin
INPUT=$(cat)

# Extract tool output from the input JSON
TOOL_OUTPUT=$(echo "$INPUT" | jq -r '.tool_response.content[0].text // ""' 2>/dev/null)

# Log debug information
echo "=== ROUTING EXECUTOR: $(date) ===" >> /tmp/routing-log.log
echo "TOOL_OUTPUT_PREVIEW: $(echo "$TOOL_OUTPUT" | head -c 200)..." >> /tmp/routing-log.log

# Check for completion scenarios first (before token validation)
# Handles cases where agents detect work is already done vs. requiring new routing
# Patterns: COMPLETE, TASK.*COMPLETE, ALREADY.*COMPLETE, TASK.*DONE, etc.
if echo "$TOOL_OUTPUT" | grep -qiE '(COMPLETE|TASK.*COMPLETE|ALREADY.*COMPLETE|TASK.*DONE|IMPLEMENTATION.*COMPLETE|WORK.*COMPLETE|FULLY.*COMPLETE|PROJECT.*COMPLETE)'; then
    echo ""
    echo "✅ TASK COMPLETION DETECTED"
    echo "📋 AGENT RESPONSE: Task appears to be already complete"
    echo "🎯 STATUS: No further routing required"
    echo ""
    echo "COMPLETION_TOKEN: TASK_COMPLETE_$(date +%s)" >> /tmp/routing-log.log
    exit 0
fi

# Check for handoff token
if echo "$TOOL_OUTPUT" | grep -q 'HANDOFF_TOKEN:[[:space:]]*[A-Z0-9_]\+'; then
    # Extract the handoff token
    HANDOFF_TOKEN=$(echo "$TOOL_OUTPUT" | grep -o 'HANDOFF_TOKEN:[[:space:]]*[A-Z0-9_]\+' | sed 's/HANDOFF_TOKEN:[[:space:]]*//')
    
    # Extract the target agent from the routing response
    TARGET_AGENT=$(echo "$TOOL_OUTPUT" | grep -o '@[a-z-]*-agent' | head -1 | sed 's/@//')
    
    # Extract routing reasoning if available
    ROUTING_REASON=$(echo "$TOOL_OUTPUT" | grep -o 'ROUTE TO: @[^[:space:]]*' | head -1)
    if [[ -z "$ROUTING_REASON" ]]; then
        ROUTING_REASON=$(echo "$TOOL_OUTPUT" | grep -A1 -B1 'component-implementation-agent\|feature-implementation-agent\|routing-agent' | head -3 | tr '\n' ' ')
    fi
    
    echo "ROUTING_SUCCESS: Token=$HANDOFF_TOKEN, Target=$TARGET_AGENT" >> /tmp/routing-log.log
    
    # Reset retry count on successful routing
    RETRY_COUNT_FILE="/tmp/routing-retry-count"
    if [[ -f "$RETRY_COUNT_FILE" ]]; then
        RETRY_COUNT=$(cat "$RETRY_COUNT_FILE")
        echo "RETRY_SUCCESS: Success after $RETRY_COUNT attempts" >> /tmp/routing-log.log
        rm -f "$RETRY_COUNT_FILE"
    fi
    
    # Provide clear, actionable success message with automatic invocation guidance
    echo ""
    echo "🎯 ROUTING SUCCESS: Valid handoff token found ($HANDOFF_TOKEN)"
    echo "📋 TARGET AGENT: $TARGET_AGENT"
    echo "🔄 ROUTING ANALYSIS: $ROUTING_REASON"
    echo ""
    echo "✅ AUTOMATIC ROUTING INSTRUCTION:"
    echo "   IMMEDIATELY invoke the Task tool with subagent_type='$TARGET_AGENT'"
    echo "   Use your original user request as the prompt parameter"
    echo ""
    echo "🚀 NEXT STEP: Execute Task tool now - do not implement directly"
    echo ""
    
    # Exit with success (code 0) - this ensures no stderr and clear success indication
    exit 0
    
else
    # No handoff token found - routing failed
    echo "ROUTING_FAILURE: No handoff token found in output" >> /tmp/routing-log.log
    echo "FAILED_OUTPUT: $TOOL_OUTPUT" >> /tmp/routing-log.log
    
    # Check retry count and implement progressive retry system
    RETRY_COUNT_FILE="/tmp/routing-retry-count"
    
    # Initialize or read retry count
    if [[ -f "$RETRY_COUNT_FILE" ]]; then
        RETRY_COUNT=$(cat "$RETRY_COUNT_FILE")
    else
        RETRY_COUNT=0
    fi
    
    # Increment retry count
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "$RETRY_COUNT" > "$RETRY_COUNT_FILE"
    
    echo "RETRY_ATTEMPT: $RETRY_COUNT" >> /tmp/routing-log.log
    
    # Progressive retry system with different approaches
    if [[ $RETRY_COUNT -le 3 ]]; then
        # Automatic retry attempts
        case $RETRY_COUNT in
            1)
                echo "🔄 ROUTING RETRY 1/3: Attempting with basic format reminder" >&2
                echo "RETRY: Call routing-agent again with this exact prompt addition:" >&2
                echo "" >&2
                echo "MANDATORY FORMAT - Your response must contain these exact lines:" >&2
                echo "HANDOFF_TOKEN: [generate a token]" >&2
                echo "@[agent-name]" >&2
                ;;
            2)
                echo "🔄 ROUTING RETRY 2/3: Attempting with explicit template enforcement" >&2
                echo "RETRY: Call routing-agent with this mandatory template:" >&2
                echo "" >&2
                echo "Add to your prompt: 'You MUST end your response with exactly:'" >&2
                echo "HANDOFF_TOKEN: [TOKEN]" >&2
                echo "@component-implementation-agent (or other appropriate agent)" >&2
                echo "" >&2
                echo "Available agents: @component-implementation-agent, @feature-implementation-agent, @infrastructure-implementation-agent" >&2
                ;;
            3)
                echo "🔄 ROUTING RETRY 3/3: Final attempt with format skeleton injection" >&2
                echo "RETRY: Call routing-agent with this exact ending requirement:" >&2
                echo "" >&2
                echo "Add to prompt: 'Your response must end with these two lines (fill in the brackets):'" >&2
                echo "HANDOFF_TOKEN: [YOUR_TOKEN_HERE]" >&2
                echo "@[AGENT_NAME_HERE]" >&2
                echo "" >&2
                echo "Replace [YOUR_TOKEN_HERE] with a token like COMP_A1B2" >&2
                echo "Replace [AGENT_NAME_HERE] with: component-implementation-agent" >&2
                ;;
        esac
        
        echo "" >&2
        echo "⚠️  AUTOMATIC RETRY SYSTEM ACTIVE - Do not escalate to user yet" >&2
        
        # Exit with retry code (1) - indicates retry needed but not user escalation
        exit 1
        
    else
        # All retries exhausted - escalate to user
        echo "❌ ROUTING FAILURE: All automatic retries exhausted ($RETRY_COUNT attempts)" >&2
        echo "The routing-agent consistently failed to provide required HANDOFF_TOKEN format." >&2
        echo "" >&2
        echo "🔄 ESCALATION TO USER REQUIRED:" >&2
        echo "1. Manual routing decision needed" >&2
        echo "2. Consider direct agent invocation" >&2
        echo "3. Or implement task directly if routing continues to fail" >&2
        echo "⚠️  Automatic retry system has been exhausted" >&2
        
        # Reset retry count for future routing attempts
        rm -f "$RETRY_COUNT_FILE"
        
        # Exit with blocking error (code 2) - stderr will be fed back to Claude for user escalation
        exit 2
    fi
fi