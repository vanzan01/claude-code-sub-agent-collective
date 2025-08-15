#!/bin/bash
# test-driven-handoff.sh
# Claude Code Sub-Agent Collective - Test-Driven Handoff Validation Hook
# Validates handoff contracts during agent transitions

# Set up logging
LOG_FILE="/tmp/test-driven-handoff.log"
HANDOFF_DIR="{{PROJECT_ROOT}}/.claude-collective/handoffs"

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }
log() {
    echo "[$(timestamp)] $1" >> "$LOG_FILE"
}

# Initialize environment variables
USER_PROMPT=${USER_PROMPT:-""}
AGENT_NAME=${AGENT_NAME:-"hub-controller"}
CLAUDE_PROJECT_DIR=${CLAUDE_PROJECT_DIR:-"{{PROJECT_ROOT}}"}

# Ensure handoff directory exists
mkdir -p "$HANDOFF_DIR"

log "TEST-DRIVEN HANDOFF TRIGGERED - Agent: $AGENT_NAME"

# Extract handoff information from prompt
extract_handoff_info() {
    local prompt="$1"
    
    # Look for agent routing patterns
    if echo "$prompt" | grep -qi "@.*-agent"; then
        local target_agent=$(echo "$prompt" | grep -oE "@[a-z-]*agent" | head -1)
        echo "target_agent=$target_agent"
    fi
    
    # Look for handoff context
    if echo "$prompt" | grep -qi -E "(handoff|transfer|route.*to)"; then
        echo "handoff_detected=true"
    else
        echo "handoff_detected=false"
    fi
}

# Create handoff contract
create_handoff_contract() {
    local target_agent="$1"
    local context="$2"
    
    local contract_file="$HANDOFF_DIR/handoff-$(date +%s).json"
    
    cat > "$contract_file" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "from_agent": "$AGENT_NAME",
  "to_agent": "$target_agent",
  "context": $(echo "$context" | jq -R -s '.'),
  "preconditions": {
    "context_provided": true,
    "target_agent_available": true,
    "route_valid": true
  },
  "postconditions": {
    "handoff_successful": false,
    "context_preserved": false,
    "task_completed": false
  },
  "validation_status": "pending"
}
EOF
    
    echo "$contract_file"
}

# Validate handoff preconditions
validate_preconditions() {
    local target_agent="$1"
    local context="$2"
    
    local violations=()
    
    # Check if target agent is valid
    if [[ -z "$target_agent" ]]; then
        violations+=("No target agent specified")
    fi
    
    # Check if context is provided
    if [[ -z "$context" || ${#context} -lt 10 ]]; then
        violations+=("Insufficient context provided")
    fi
    
    # Check if this is a valid routing pattern
    if ! echo "$context" | grep -qi -E "(implement|create|build|test|analyze|research)"; then
        violations+=("No clear task intent identified")
    fi
    
    if [[ ${#violations[@]} -gt 0 ]]; then
        log "PRECONDITION VIOLATIONS: ${violations[*]}"
        echo "❌ TEST CONTRACT VIOLATIONS:"
        printf "  - %s\n" "${violations[@]}"
        return 1
    fi
    
    return 0
}

# Main handoff validation logic
main() {
    log "Starting test-driven handoff validation"
    
    # Extract handoff information
    local handoff_info=$(extract_handoff_info "$USER_PROMPT")
    
    eval "$handoff_info"
    
    if [[ "$handoff_detected" == "true" ]]; then
        log "Handoff detected to: $target_agent"
        
        # Create handoff contract
        local contract_file=$(create_handoff_contract "$target_agent" "$USER_PROMPT")
        log "Created handoff contract: $contract_file"
        
        # Validate preconditions
        if validate_preconditions "$target_agent" "$USER_PROMPT"; then
            log "Handoff preconditions validated successfully"
            echo "✅ TEST CONTRACT: Handoff preconditions validated"
            echo "📋 Contract: $contract_file"
            echo "🔄 Handoff: $AGENT_NAME → $target_agent"
        else
            log "Handoff precondition validation failed"
            # Don't exit 1 here, just warn
            echo "⚠️  TEST CONTRACT: Handoff validation issues detected"
        fi
    else
        log "No handoff detected in prompt"
    fi
    
    return 0
}

# Execute main function
main "$@"