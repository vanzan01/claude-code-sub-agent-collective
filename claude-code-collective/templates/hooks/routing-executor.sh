#!/bin/bash
# routing-executor.sh
# Claude Code Sub-Agent Collective - Routing Execution Hook
# Executes routing decisions and agent handoffs

# Set up logging
LOG_FILE="/tmp/routing-executor.log"
ROUTING_DIR="{{PROJECT_ROOT}}/.claude-collective/routing"

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }
log() {
    echo "[$(timestamp)] $1" >> "$LOG_FILE"
}

# Initialize environment variables
USER_PROMPT=${USER_PROMPT:-""}
TOOL_NAME=${TOOL_NAME:-""}
AGENT_NAME=${AGENT_NAME:-"hub-controller"}
CLAUDE_PROJECT_DIR=${CLAUDE_PROJECT_DIR:-"{{PROJECT_ROOT}}"}

# Ensure routing directory exists
mkdir -p "$ROUTING_DIR"

log "ROUTING EXECUTOR TRIGGERED - Agent: $AGENT_NAME, Tool: $TOOL_NAME"

# Detect routing instructions
detect_routing_instruction() {
    local prompt="$1"
    
    # Look for explicit routing instructions
    if echo "$prompt" | grep -qi -E "ROUTE TO:|route.*to.*@|handoff.*to.*@"; then
        local target_agent=$(echo "$prompt" | grep -oE "@[a-z-]*agent" | head -1)
        echo "explicit_route=$target_agent"
        return 0
    fi
    
    # Look for implicit routing based on task type
    if echo "$prompt" | grep -qi -E "(implement|create.*code|build.*component)"; then
        echo "implicit_route=@implementation-agent"
        return 0
    elif echo "$prompt" | grep -qi -E "(test|validate|verify)"; then
        echo "implicit_route=@testing-agent"
        return 0
    elif echo "$prompt" | grep -qi -E "(research|analyze|investigate)"; then
        echo "implicit_route=@research-agent"
        return 0
    fi
    
    echo "no_route_needed=true"
    return 1
}

# Log routing decision
log_routing_decision() {
    local route_info="$1"
    local prompt="$2"
    
    local log_entry=$(cat <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "from_agent": "$AGENT_NAME",
  "routing_info": "$route_info",
  "prompt_length": ${#prompt},
  "tool": "$TOOL_NAME"
}
EOF
)
    
    echo "$log_entry" >> "$ROUTING_DIR/routing-decisions.json"
    log "Routing decision logged: $route_info"
}

# Execute routing if needed
execute_routing() {
    local target_agent="$1"
    local context="$2"
    
    if [[ -n "$target_agent" && "$target_agent" != "no_route_needed" ]]; then
        log "Executing route to: $target_agent"
        
        echo "🔄 ROUTING EXECUTION:"
        echo "   From: $AGENT_NAME"
        echo "   To: $target_agent"
        echo "   Context: Hub-and-spoke coordination pattern"
        echo "   Status: Routing instruction logged"
        
        # Create routing instruction file for the next agent
        local routing_file="$ROUTING_DIR/route-$(date +%s).json"
        cat > "$routing_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "from_agent": "$AGENT_NAME",
  "to_agent": "$target_agent",
  "context": $(echo "$context" | jq -R -s '.'),
  "routing_type": "hub_and_spoke",
  "status": "pending_execution"
}
EOF
        
        log "Created routing instruction: $routing_file"
    fi
}

# Main routing execution logic
main() {
    log "Starting routing execution for tool: $TOOL_NAME"
    
    # Only process routing for certain tools
    if [[ "$TOOL_NAME" == "Task" || "$TOOL_NAME" == "Agent" ]]; then
        # Detect routing instruction
        local route_info=$(detect_routing_instruction "$USER_PROMPT")
        
        if [[ $? -eq 0 ]]; then
            eval "$route_info"
            
            # Log the routing decision
            log_routing_decision "$route_info" "$USER_PROMPT"
            
            # Execute routing if explicit route detected
            if [[ -n "$explicit_route" ]]; then
                execute_routing "$explicit_route" "$USER_PROMPT"
            elif [[ -n "$implicit_route" ]]; then
                execute_routing "$implicit_route" "$USER_PROMPT"
            fi
        else
            log "No routing instruction detected"
        fi
    else
        log "Tool $TOOL_NAME does not require routing"
    fi
    
    return 0
}

# Execute main function
main "$@"