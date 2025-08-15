#!/bin/bash
# test-driven-handoff.sh
# TRUE Test-Driven Handoffs with Contract Validation
# Executes actual test contracts to validate agent handoffs

# Set up logging
LOG_FILE="/tmp/test-driven-handoff.log"
timestamp() { date '+%Y-%m-%d %H:%M:%S'; }

log() {
    echo "[$(timestamp)] $1" >> "$LOG_FILE"
}

# Initialize environment variables
EVENT=${EVENT:-""}
SUBAGENT_NAME=${SUBAGENT_NAME:-""}
AGENT_OUTPUT=${AGENT_OUTPUT:-""}
HANDOFF_TOKEN=${HANDOFF_TOKEN:-""}
CLAUDE_PROJECT_DIR=${CLAUDE_PROJECT_DIR:-"/mnt/h/Active/taskmaster-agent-claude-code"}

log "TRUE TEST-DRIVEN HANDOFF VALIDATION - Event: $EVENT, Agent: $SUBAGENT_NAME"

# Validate handoff token format and structure
validate_handoff_token() {
    local token="$1"
    
    if [[ -z "$token" ]]; then
        log "HANDOFF ERROR: No handoff token provided"
        echo "❌ HANDOFF VALIDATION FAILED: Missing handoff token"
        return 1
    fi
    
    # Check token format (should contain agent name, timestamp, and task info)
    if ! echo "$token" | grep -q -E "^[A-Z_]+_[0-9]{8}_[0-9]{6}$"; then
        log "HANDOFF WARNING: Handoff token format may be non-standard: $token"
        # Don't fail on format, just warn
    fi
    
    log "Handoff token validated: $token"
    return 0
}

# Validate agent output contains required elements
validate_agent_output() {
    local output="$1"
    local agent="$2"
    
    if [[ -z "$output" ]]; then
        log "HANDOFF ERROR: No agent output provided for validation"
        echo "❌ CONTRACT VALIDATION FAILED: Empty agent output"
        return 1
    fi
    
    # Check for implementation evidence (files created/modified)
    local has_implementation=false
    if echo "$output" | grep -qi -E "(created|modified|updated|wrote|edited|implemented)"; then
        has_implementation=true
    fi
    
    # Check for test evidence if implementation occurred
    if [[ "$has_implementation" == "true" ]]; then
        if ! echo "$output" | grep -qi -E "(test|spec|coverage|validation|verify)"; then
            log "CONTRACT WARNING: Implementation detected without test mention"
            echo "⚠️  CONTRACT WARNING: Implementation completed without test validation"
            echo "📋 RECOMMENDATION: Include test validation for implemented changes"
        fi
    fi
    
    # Check for quality indicators
    local quality_score=0
    
    # Check for documentation
    if echo "$output" | grep -qi -E "(document|comment|readme|doc)"; then
        ((quality_score++))
    fi
    
    # Check for error handling
    if echo "$output" | grep -qi -E "(error|exception|handle|catch|validate)"; then
        ((quality_score++))
    fi
    
    # Check for testing
    if echo "$output" | grep -qi -E "(test|spec|coverage|assert)"; then
        ((quality_score++))
    fi
    
    log "Quality score for $agent: $quality_score/3"
    
    if [[ $quality_score -lt 1 ]]; then
        echo "⚠️  QUALITY WARNING: Low quality handoff detected (score: $quality_score/3)"
        echo "📋 IMPROVEMENT NEEDED: Consider adding tests, documentation, or error handling"
    fi
    
    return 0
}

# Validate state contract requirements
validate_state_contract() {
    local output="$1"
    
    # Check for critical state information
    local state_elements=()
    
    # Task completion status
    if echo "$output" | grep -qi -E "(complet|finish|done|success)"; then
        state_elements+=("completion_status")
    fi
    
    # File changes
    if echo "$output" | grep -qi -E "(file|path|created|modified)"; then
        state_elements+=("file_changes")
    fi
    
    # Next steps or routing
    if echo "$output" | grep -qi -E "(next|route|handoff|continue)"; then
        state_elements+=("next_steps")
    fi
    
    log "State elements found: ${state_elements[*]}"
    
    if [[ ${#state_elements[@]} -eq 0 ]]; then
        log "CONTRACT ERROR: No state elements found in handoff"
        echo "❌ STATE CONTRACT FAILED: Missing required state elements"
        echo "📋 REQUIRED: Include completion status, file changes, or next steps"
        return 1
    fi
    
    return 0
}

# Check for test framework integration
validate_test_integration() {
    local output="$1"
    
    # Check if tests were run or mentioned
    if echo "$output" | grep -qi -E "(jest|test.*pass|test.*fail|npm.*test|yarn.*test)"; then
        log "Test framework integration detected"
        echo "✅ TEST INTEGRATION: Test framework usage confirmed"
        return 0
    fi
    
    # Check for test files mentioned
    if echo "$output" | grep -qi -E "(\.test\.|\.spec\.|__tests__|test/)"; then
        log "Test files mentioned in handoff"
        echo "✅ TEST FILES: Test file references found"
        return 0
    fi
    
    log "WARNING: No test framework integration detected"
    echo "⚠️  TEST INTEGRATION WARNING: No test framework usage detected"
    return 0
}

# Execute real test contract validation using TestContractValidator
execute_tdd_validation() {
    local agent_output="$1"
    local agent_name="$2"
    
    log "Executing TRUE TDD validation for agent: $agent_name"
    
    # Path to TestContractValidator
    local validator_path="$CLAUDE_PROJECT_DIR/claude-code-collective/lib/TestContractValidator.js"
    
    if [[ ! -f "$validator_path" ]]; then
        log "ERROR: TestContractValidator not found at $validator_path"
        echo "❌ TDD VALIDATION ERROR: TestContractValidator not found"
        return 1
    fi
    
    # Create temporary file for agent output
    local temp_output=$(mktemp)
    echo "$agent_output" > "$temp_output"
    
    # Execute contract validation using Node.js
    local validation_result
    validation_result=$(cd "$CLAUDE_PROJECT_DIR" && node -e "
        const TestContractValidator = require('./claude-code-collective/lib/TestContractValidator');
        const fs = require('fs');
        
        async function validateHandoff() {
            const validator = new TestContractValidator();
            const agentOutput = fs.readFileSync('$temp_output', 'utf8');
            
            // Extract handoff data from environment
            const handoffData = {
                fromAgent: '$agent_name',
                toAgent: 'next-agent',
                data: agentOutput,
                timestamp: new Date().toISOString()
            };
            
            try {
                const result = await validator.validateHandoff(
                    '$agent_name',
                    'next-agent', 
                    agentOutput,
                    handoffData
                );
                
                console.log(JSON.stringify(result, null, 2));
            } catch (error) {
                console.error(JSON.stringify({
                    success: false,
                    error: error.message
                }, null, 2));
            }
        }
        
        validateHandoff();
    " 2>&1)
    
    # Clean up temp file
    rm -f "$temp_output"
    
    # Parse validation result
    if echo "$validation_result" | grep -q '\"success\": true'; then
        log "TDD validation PASSED for agent: $agent_name"
        echo "✅ TDD VALIDATION PASSED: Test contracts validated successfully"
        echo "$validation_result" | jq -r '.preconditions.results[]? | "  ✅ \(.name): \(.passed)"' 2>/dev/null || true
        return 0
    else
        log "TDD validation FAILED for agent: $agent_name"
        echo "❌ TDD VALIDATION FAILED: Test contracts failed"
        echo "$validation_result" | jq -r '.error // "Contract validation failed"' 2>/dev/null || echo "$validation_result"
        return 1
    fi
}

# Main validation logic
main() {
    log "Starting TRUE test-driven handoff validation"
    log "Agent: $SUBAGENT_NAME, Event: $EVENT"
    
    # Only validate on SubagentStop events
    if [[ "$EVENT" != "SubagentStop" ]]; then
        log "Skipping validation - not a SubagentStop event"
        return 0
    fi
    
    # Check if agent output exists
    if [[ -z "$AGENT_OUTPUT" ]]; then
        log "No agent output to validate"
        return 0
    fi
    
    # Execute TRUE TDD validation using TestContractValidator
    if ! execute_tdd_validation "$AGENT_OUTPUT" "$SUBAGENT_NAME"; then
        log "TDD HANDOFF VALIDATION FAILED for agent: $SUBAGENT_NAME"
        echo ""
        echo "🚨 TRUE TDD HANDOFF VALIDATION FAILED"
        echo "📋 Agent: $SUBAGENT_NAME"
        echo "🔄 REQUIRED ACTION: Fix test contracts and retry handoff"
        echo "📖 See logs at: $LOG_FILE"
        echo ""
        exit 1
    fi
    
    log "TRUE TDD handoff validation successful for agent: $SUBAGENT_NAME"
    echo "🎯 TRUE TDD HANDOFF VALIDATED: Test contracts executed and passed"
    
    return 0
}

# Execute main function
main "$@"