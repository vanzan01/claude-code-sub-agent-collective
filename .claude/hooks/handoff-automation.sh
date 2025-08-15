#!/bin/bash
# handoff-automation.sh
# Automatic Agent Handoff Execution System
# Detects "ROUTE TO:" instructions and automatically executes handoffs to next agents

# Set up logging
LOG_FILE="/tmp/handoff-automation.log"
timestamp() { date '+%Y-%m-%d %H:%M:%S'; }

log() {
    echo "[$(timestamp)] $1" >> "$LOG_FILE"
}

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
export CLAUDE_PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PROJECT_ROOT}"

# Read JSON input from stdin (like routing-executor.sh does)
INPUT=$(cat)

log "HANDOFF AUTOMATION SYSTEM - Raw input received"
log "INPUT_PREVIEW: $(echo "$INPUT" | head -c 200)..."

# Extract data from JSON input - try multiple possible field names
EVENT=$(echo "$INPUT" | jq -r '.event // .hook_event_name // .type // ""' 2>/dev/null)
SUBAGENT_NAME=$(echo "$INPUT" | jq -r '.subagent_name // .agent_name // .agent // .subagent // ""' 2>/dev/null) 
AGENT_OUTPUT=$(echo "$INPUT" | jq -r '.agent_output // ""' 2>/dev/null)

# If jq extraction fails, try alternative extraction methods
if [[ -z "$AGENT_OUTPUT" ]]; then
    # Try tool_response.content[0].text pattern like routing-executor
    AGENT_OUTPUT=$(echo "$INPUT" | jq -r '.tool_response.content[0].text // ""' 2>/dev/null)
fi

# If still empty, try to extract any text content from the JSON
if [[ -z "$AGENT_OUTPUT" ]]; then
    AGENT_OUTPUT=$(echo "$INPUT" | jq -r '.content // .text // .output // .response // ""' 2>/dev/null)
fi

# If still empty, try to extract from recent agent output or transcript
if [[ -z "$AGENT_OUTPUT" ]]; then
    # Extract transcript path and try to get the last agent output
    TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // ""' 2>/dev/null)
    if [[ -n "$TRANSCRIPT_PATH" && -f "$TRANSCRIPT_PATH" ]]; then
        # Get the last agent response with ROUTE TO or HANDOFF TO
        AGENT_OUTPUT=$(tail -50 "$TRANSCRIPT_PATH" 2>/dev/null | jq -r 'select(.type == "assistant") | .message.content[]? | select(type == "string") | select(. | test("ROUTE TO|HANDOFF TO"; "i"))' 2>/dev/null | tail -1)
        if [[ -z "$AGENT_OUTPUT" ]]; then
            # Fallback: simple text search in transcript
            AGENT_OUTPUT=$(tail -50 "$TRANSCRIPT_PATH" 2>/dev/null | grep -i "ROUTE TO\|HANDOFF TO" | tail -1)
        fi
        log "EXTRACTED_FROM_TRANSCRIPT: $AGENT_OUTPUT"
    fi
fi

log "HANDOFF AUTOMATION ANALYSIS - Event: $EVENT, Agent: $SUBAGENT_NAME"
log "RAW_INPUT_SAMPLE: $(echo "$INPUT" | head -c 500)"
log "AGENT_OUTPUT_PREVIEW: $(echo "$AGENT_OUTPUT" | head -c 100)..."

# Only process SubagentStop events
if [[ "$EVENT" != "SubagentStop" ]]; then
    log "Skipping automation - not a SubagentStop event (Event: '$EVENT')"
    exit 0
fi

# Check if agent output exists
if [[ -z "$AGENT_OUTPUT" ]]; then
    log "No agent output to process"
    log "RAW_INPUT_DEBUG: $INPUT"
    exit 0
fi

# Function to extract routing target from agent output
extract_routing_target() {
    local output="$1"
    
    log "ROUTING_EXTRACTION: Starting extraction"
    log "OUTPUT_SAMPLE: $(echo "$output" | head -c 300)"
    
    # Look for "ROUTE TO: @agent-name" pattern (handles markdown formatting)
    local route_pattern=$(echo "$output" | grep -i -E "(\*\*)?ROUTE TO(\*\*)?:|(\*\*)?HANDOFF TO(\*\*)?:" | head -1)
    
    log "ROUTE_PATTERN_FOUND: '$route_pattern'"
    
    if [[ -n "$route_pattern" ]]; then
        # Extract agent name from @agent-name pattern (handle full output, not just pattern line)
        local target_agent=$(echo "$output" | grep -o '@[a-zA-Z][a-zA-Z0-9-]*-agent' | head -1 | sed 's/@//')
        
        log "AGENT_EXTRACTED: '$target_agent'"
        
        if [[ -n "$target_agent" ]]; then
            log "SUCCESS: Found agent $target_agent"
            echo "$target_agent"
            return 0
        fi
        
        # Extract agent name from @agent-name pattern (without -agent suffix)  
        target_agent=$(echo "$route_pattern" | grep -o '@[a-zA-Z][a-zA-Z0-9-]*-[a-zA-Z]*' | head -1 | sed 's/@//')
        
        if [[ -n "$target_agent" ]]; then
            echo "$target_agent"
            return 0
        fi
        
        # Fallback: extract any @word pattern after ROUTE TO:
        target_agent=$(echo "$route_pattern" | sed 's/.*ROUTE TO: *@//i' | sed 's/[^a-zA-Z0-9-].*//')
        
        if [[ -n "$target_agent" ]]; then
            echo "$target_agent"
            return 0
        fi
    fi
    
    return 1
}

# Function to extract Task ID from agent output
extract_task_id() {
    local output="$1"
    
    log "TASK_ID_EXTRACTION: Starting extraction"
    
    # Pattern 1: "Task ID: 12" in assignment block
    local id_line
    id_line=$(echo "$output" | grep -i -E "^\s*[-*]?\s*Task ID:\s*[0-9]+(\.[0-9]+)*" | head -1)
    if [[ -n "$id_line" ]]; then
        local task_id=$(echo "$id_line" | grep -oE "[0-9]+(\.[0-9]+)*" | head -1)
        if [[ -n "$task_id" ]]; then
            log "TASK_ID_FOUND: $task_id from assignment block"
            echo "$task_id"
            return 0
        fi
    fi
    
    # Pattern 2: "implement Task ID 12" in directive
    local directive_id
    directive_id=$(echo "$output" | grep -i "implement Task ID" | grep -oE "[0-9]+(\.[0-9]+)*" | head -1)
    if [[ -n "$directive_id" ]]; then
        log "TASK_ID_FOUND: $directive_id from directive"
        echo "$directive_id"
        return 0
    fi
    
    log "TASK_ID_NOT_FOUND: No Task ID detected"
    return 1
}

# Function to extract handoff context
extract_handoff_context() {
    local output="$1"
    local source_agent="$2"
    
    # Extract research context if available
    local research_context=""
    if echo "$output" | grep -qi "research.*context\|research.*findings\|research.*cache"; then
        research_context=$(echo "$output" | grep -A5 -B5 -i "research.*context\|research.*findings\|research.*cache" | head -20)
    fi
    
    # Extract task context
    local task_context=""
    if echo "$output" | grep -qi "task.*generated\|tasks.*created\|implementation.*ready"; then
        task_context=$(echo "$output" | grep -A5 -B5 -i "task.*generated\|tasks.*created\|implementation.*ready" | head -20)
    fi
    
    # Extract completion summary
    local completion_summary=""
    if echo "$output" | grep -qi "COMPLETE\|DELIVERED\|FINISHED"; then
        completion_summary=$(echo "$output" | grep -A3 -B3 -i "COMPLETE\|DELIVERED\|FINISHED" | head -10)
    fi
    
    # Build comprehensive context
    local context="HANDOFF CONTEXT FROM: $source_agent\n\n"
    
    if [[ -n "$completion_summary" ]]; then
        context+="COMPLETION STATUS:\n$completion_summary\n\n"
    fi
    
    if [[ -n "$research_context" ]]; then
        context+="RESEARCH CONTEXT:\n$research_context\n\n"
    fi
    
    if [[ -n "$task_context" ]]; then
        context+="TASK CONTEXT:\n$task_context\n\n"
    fi
    
    # Add TaskMaster integration info if present
    if echo "$output" | grep -qi "taskmaster\|task.*coordination"; then
        context+="TASKMASTER STATUS: Integration active - use TaskMaster tools for coordination\n\n"
    fi
    
    echo -e "$context"
}

# Function to generate handoff prompt
generate_handoff_prompt() {
    local target_agent="$1"
    local source_agent="$2"
    local context="$3"
    local original_user_request="$4"
    local task_id="$5"
    
    # Different prompts for implementation vs other agents
    if [[ "$target_agent" == *"-implementation-agent" && -n "$task_id" ]]; then
        cat << EOF
🚨 AUTOMATIC HANDOFF DETECTED 🚨

The $source_agent has assigned Task ID $task_id for implementation.

🎯 REQUIRED IMMEDIATE ACTION:
Use the Task tool now with these exact parameters:

Task(
    subagent_type="$target_agent",
    description="Implement Task ID $task_id",
    prompt="TASK ID: $task_id
PROJECT ROOT: /mnt/h/Active/taskmaster-agent-claude-code

MANDATORY FIRST ACTION:
Execute: mcp__task-master__get_task --id=$task_id --projectRoot=/mnt/h/Active/taskmaster-agent-claude-code

Then implement according to the task's acceptance criteria using TDD methodology.
When complete, execute: mcp__task-master__set_task_status --id=$task_id --status=done --projectRoot=/mnt/h/Active/taskmaster-agent-claude-code

$context"
)

🚀 DO NOT IMPLEMENT DIRECTLY - USE THE TASK TOOL NOW
EOF
    else
        # Original prompt for non-implementation agents
        cat << EOF
🚨 AUTOMATIC HANDOFF DETECTED 🚨

The $source_agent has completed its work and requested handoff to: @$target_agent

$context

🎯 REQUIRED IMMEDIATE ACTION:
Use the Task tool now with these exact parameters:

Task(
    subagent_type="$target_agent",
    description="Continue from $source_agent handoff",
    prompt="$original_user_request

HANDOFF CONTEXT: The $source_agent has completed its phase and is handing off to you. Continue the work with the above context and research findings. Apply your specialized capabilities to complete the next phase of the request."
)

🚀 DO NOT IMPLEMENT DIRECTLY - USE THE TASK TOOL NOW
EOF
    fi
}

# Function to detect if this is a completion without handoff
is_completion_without_handoff() {
    local output="$1"
    
    # Check for completion patterns
    if echo "$output" | grep -qi -E "COMPLETE.*NO.*HANDOFF|FINAL.*COMPLETE|WORKFLOW.*COMPLETE|PROJECT.*COMPLETE"; then
        return 0
    fi
    
    # Check for explicit completion statements without routing
    if echo "$output" | grep -qi "COMPLETE" && ! echo "$output" | grep -qi "ROUTE TO:"; then
        return 0
    fi
    
    return 1
}

# Set project directory
CLAUDE_PROJECT_DIR="/mnt/h/Active/taskmaster-agent-claude-code"

# Main automation logic
main() {
    log "Starting handoff automation analysis"
    
    # Check for completion without handoff first
    if is_completion_without_handoff "$AGENT_OUTPUT"; then
        log "Agent completed without handoff request - no automation needed"
        echo "✅ WORKFLOW COMPLETE: Agent finished task successfully"
        echo "📋 Status: No further handoff required"
        exit 0
    fi
    
    # Extract routing target
    local target_agent
    if ! target_agent=$(extract_routing_target "$AGENT_OUTPUT"); then
        log "No routing target found in agent output"
        echo "ℹ️  NO HANDOFF DETECTED: Agent completed without routing instruction"
        exit 0
    fi
    
    log "Handoff target detected: $target_agent"
    
    # Extract Task ID - MANDATORY for implementation agents
    local task_id=""
    if [[ "$target_agent" == *"-implementation-agent" ]]; then
        task_id=$(extract_task_id "$AGENT_OUTPUT" || true)
        
        if [[ -z "$task_id" ]]; then
            log "No Task ID found for implementation agent - aborting"
            echo "⚠️  HANDOFF BLOCKED: NO TASK ID FOR IMPLEMENTATION AGENT"
            echo ""
            echo "Implementation agents REQUIRE a Task ID to fetch from TaskMaster."
            echo "The orchestrator must provide 'Task ID: X' in the assignment."
            echo ""
            echo "Handoff aborted to ensure deterministic task execution."
            exit 0
        fi
        
        log "Task ID extracted for implementation: $task_id"
    fi
    
    # Extract handoff context
    local handoff_context
    handoff_context=$(extract_handoff_context "$AGENT_OUTPUT" "$SUBAGENT_NAME")
    
    # Try to infer original user request (this is best effort)
    local original_request="Continue the work from the previous agent with the provided context"
    
    # Check if this was a PRD-based request
    if [[ "$SUBAGENT_NAME" == "prd-research-agent" ]] && echo "$AGENT_OUTPUT" | grep -qi "PRD"; then
        original_request="Execute the tasks generated from the PRD analysis with research-backed implementation"
    fi
    
    # Generate and output handoff prompt
    local handoff_prompt
    handoff_prompt=$(generate_handoff_prompt "$target_agent" "$SUBAGENT_NAME" "$handoff_context" "$original_request" "$task_id")
    
    log "Generated handoff prompt for $target_agent"
    
    # Output the handoff instruction to Claude Code Hub
    echo ""
    echo "$handoff_prompt"
    echo ""
    
    # Record success metrics
    echo "HANDOFF_AUTOMATION_SUCCESS: $SUBAGENT_NAME -> $target_agent" >> "$LOG_FILE"
    echo "HANDOFF_TIMESTAMP: $(timestamp)" >> "$LOG_FILE"
    
    log "Handoff automation completed successfully"
    
    exit 0
}

# Execute main function
main "$@"