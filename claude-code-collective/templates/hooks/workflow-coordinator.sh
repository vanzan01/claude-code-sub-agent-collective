#!/bin/bash
# Workflow Execution Engine: Proper WBS/Project Management Logic

# Configuration
MAX_PARALLEL=3

# Read JSON input from stdin  
INPUT=$(cat)

# DEBUG: Log raw input to understand structure
echo "=== WORKFLOW ENGINE: $(date) ===" >> /tmp/workflow-log.log
echo "RAW_INPUT: $INPUT" >> /tmp/workflow-log.log

# Check if this is session metadata (contains transcript_path)
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // ""')

if [[ -n "$TRANSCRIPT_PATH" && "$TRANSCRIPT_PATH" != "null" ]]; then
    echo "SESSION METADATA: Processing transcript at $TRANSCRIPT_PATH" >> /tmp/workflow-log.log
    
    # Extract the last workflow-agent response from transcript
    if [[ -f "$TRANSCRIPT_PATH" ]]; then
        echo "PARSING: Analyzing transcript with $(wc -l < "$TRANSCRIPT_PATH") lines" >> /tmp/workflow-log.log
        
        # Method 1: Look for code blocks containing JSON with workflow keywords (most reliable)
        echo "METHOD1: Searching for JSON code blocks" >> /tmp/workflow-log.log
        
        # Process each JSONL record individually to find workflow JSON
        while IFS= read -r JSONL_LINE; do
            if [[ -z "$JSONL_LINE" ]]; then continue; fi
            
            # Extract the message content from this JSONL record
            FULL_CONTENT=$(echo "$JSONL_LINE" | jq -r 'select(.type == "assistant" and .message.role == "assistant") | .message.content[0].text // ""' 2>/dev/null)
            if [[ -z "$FULL_CONTENT" || "$FULL_CONTENT" == "null" ]]; then continue; fi
            
            # Only process messages that actually contain code blocks
            if ! echo "$FULL_CONTENT" | grep -q '```json'; then continue; fi
            
            # Extract full JSON content between ```json and ``` markers
            TEMP_CONTENT=$(echo "$FULL_CONTENT" | sed -n '/```json/,/```/p' | sed '1d;$d')
            
            # Check if this JSON contains workflow keywords and is valid
            if [[ -n "$TEMP_CONTENT" ]] && echo "$TEMP_CONTENT" | grep -qE '("steps"|"routing"|"task")' && echo "$TEMP_CONTENT" | jq . >/dev/null 2>&1; then
                LAST_WORKFLOW_RESPONSE="$TEMP_CONTENT"
                echo "METHOD1: Found valid JSON in code block (${#TEMP_CONTENT} chars)" >> /tmp/workflow-log.log
                break
            fi
        done < <(tail -n 20 "$TRANSCRIPT_PATH")
        
        # Method 2: Look for direct JSON structures with workflow keywords
        if [[ -z "$LAST_WORKFLOW_RESPONSE" || "$LAST_WORKFLOW_RESPONSE" == "null" ]]; then
            echo "METHOD2: Searching for direct JSON workflow structures" >> /tmp/workflow-log.log
            
            while IFS= read -r JSONL_LINE; do
                if [[ -z "$JSONL_LINE" ]]; then continue; fi
                
                FULL_CONTENT=$(echo "$JSONL_LINE" | jq -r 'select(.type == "assistant" and .message.role == "assistant") | .message.content[0].text // ""' 2>/dev/null)
                if [[ -z "$FULL_CONTENT" || "$FULL_CONTENT" == "null" ]]; then continue; fi
                
                # Look for lines that are pure JSON (start with { and end with })
                while IFS= read -r LINE; do
                    if [[ "$LINE" =~ ^[[:space:]]*\{.*\}[[:space:]]*$ ]] && echo "$LINE" | grep -qE '("steps"|"routing"|"task")'; then
                        # Validate it's actually JSON
                        if echo "$LINE" | jq . >/dev/null 2>&1; then
                            LAST_WORKFLOW_RESPONSE="$LINE"
                            echo "METHOD2: Found direct JSON workflow structure" >> /tmp/workflow-log.log
                            break 2
                        fi
                    fi
                done <<< "$FULL_CONTENT"
            done < <(tail -n 20 "$TRANSCRIPT_PATH")
        fi
        
        # Method 3: Look for any valid JSON with routing fields
        if [[ -z "$LAST_WORKFLOW_RESPONSE" || "$LAST_WORKFLOW_RESPONSE" == "null" ]]; then
            echo "METHOD3: Searching for routing JSON" >> /tmp/workflow-log.log
            
            while IFS= read -r JSONL_LINE; do
                if [[ -z "$JSONL_LINE" ]]; then continue; fi
                
                FULL_CONTENT=$(echo "$JSONL_LINE" | jq -r 'select(.type == "assistant" and .message.role == "assistant") | .message.content[0].text // ""' 2>/dev/null)
                if [[ -z "$FULL_CONTENT" || "$FULL_CONTENT" == "null" ]]; then continue; fi
                
                # Extract any JSON objects that contain "routing" field
                TEMP_JSON_LIST=$(echo "$FULL_CONTENT" | grep -oE '\{[^{}]*"routing"[^{}]*\}')
                while IFS= read -r TEMP_JSON; do
                    if [[ -n "$TEMP_JSON" ]] && echo "$TEMP_JSON" | jq . >/dev/null 2>&1; then
                        # Verify it has required routing fields
                        if echo "$TEMP_JSON" | jq -e '.routing' >/dev/null 2>&1; then
                            LAST_WORKFLOW_RESPONSE="$TEMP_JSON"
                            echo "METHOD3: Found routing JSON object" >> /tmp/workflow-log.log
                            break 2
                        fi
                    fi
                done <<< "$TEMP_JSON_LIST"
            done < <(tail -n 20 "$TRANSCRIPT_PATH")
        fi
        
        if [[ -n "$LAST_WORKFLOW_RESPONSE" && "$LAST_WORKFLOW_RESPONSE" != "null" ]]; then
            # Final validation: ensure this is actually valid JSON and not natural language text
            if echo "$LAST_WORKFLOW_RESPONSE" | jq . >/dev/null 2>&1; then
                TOOL_RESULT="$LAST_WORKFLOW_RESPONSE"
                SUBAGENT_TYPE="workflow-agent"
                echo "EXTRACTED FROM TRANSCRIPT: Found workflow response ($(echo "$TOOL_RESULT" | wc -c) chars)" >> /tmp/workflow-log.log
                echo "TRANSCRIPT_PREVIEW: $(echo "$TOOL_RESULT" | head -c 100)..." >> /tmp/workflow-log.log
            else
                echo "WARNING: Found potential workflow content but it's not valid JSON" >> /tmp/workflow-log.log
                echo "INVALID_CONTENT: $(echo "$LAST_WORKFLOW_RESPONSE" | head -c 200)..." >> /tmp/workflow-log.log
                echo "DEBUG: Recent assistant messages:" >> /tmp/workflow-log.log
                tail -n 20 "$TRANSCRIPT_PATH" | jq -r 'select(.type == "assistant") | .message.content[0].text // "NO_TEXT"' | head -c 500 >> /tmp/workflow-log.log
                exit 0
            fi
        else
            echo "WARNING: No workflow-agent response found in transcript" >> /tmp/workflow-log.log
            echo "DEBUG: Recent assistant messages:" >> /tmp/workflow-log.log
            tail -n 20 "$TRANSCRIPT_PATH" | jq -r 'select(.type == "assistant") | .message.content[0].text // "NO_TEXT"' | head -c 500 >> /tmp/workflow-log.log
            exit 0
        fi
    else
        echo "ERROR: Transcript file not found: $TRANSCRIPT_PATH" >> /tmp/workflow-log.log
        exit 1
    fi
else
    # Legacy format: Extract tool parameters directly
    SUBAGENT_TYPE=$(echo "$INPUT" | jq -r '.tool_input.subagent_type // ""')
    TOOL_RESULT=$(echo "$INPUT" | jq -r '.tool_response.content[0].text // ""')
fi

echo "AGENT: $SUBAGENT_TYPE" >> /tmp/workflow-log.log
echo "TOOL_RESULT_PREVIEW: $(echo "$TOOL_RESULT" | head -c 200)..." >> /tmp/workflow-log.log

# Function: Get tasks that are available for execution
get_available_tasks() {
    jq -r '. as $root |
        .steps[] | 
        select(.status == "pending") |
        select(
            if (.depends_on | length) == 0 then true
            else (.depends_on | map(. as $dep | 
                ($root.steps[] | select(.id == $dep) | .status == "completed")
            ) | all)
            end
        ) |
        .id
    ' workflow.json 2>/dev/null
}

# Function: Get current in-progress count
get_in_progress_count() {
    jq '.steps | map(select(.status == "in-progress")) | length' workflow.json 2>/dev/null || echo "0"
}

# Function: Update task status  
update_task_status() {
    local task_id="$1"
    local new_status="$2" 
    local result="$3"
    
    if [[ ! -f workflow.json ]]; then return; fi
    
    TEMP_FILE=$(mktemp)
    jq --arg id "$task_id" --arg status "$new_status" --arg result "$result" \
       '.steps |= map(if .id == ($id | tonumber) then .status = $status | .result = $result else . end)' \
       workflow.json > "$TEMP_FILE" && mv "$TEMP_FILE" workflow.json
    
    echo "  UPDATED: Task $task_id -> $new_status" >> /tmp/workflow-log.log
}

# Function: Update execution queue with WBS logic
update_execution_queue() {
    if [[ ! -f workflow.json ]]; then return; fi
    
    # Get current state
    local available_tasks=$(get_available_tasks)
    local in_progress_count=$(get_in_progress_count)
    local can_start=$((MAX_PARALLEL - in_progress_count))
    
    # Create recommendations array (limit to available slots)
    local recommendations=""
    if [[ $can_start -gt 0 && -n "$available_tasks" ]]; then
        recommendations=$(echo "$available_tasks" | head -n "$can_start" | tr '\n' ',' | sed 's/,$//')
    fi
    
    echo "  QUEUE STATE: available=[$available_tasks], in_progress=$in_progress_count, can_start=$can_start" >> /tmp/workflow-log.log
    echo "  RECOMMENDATIONS: [$recommendations]" >> /tmp/workflow-log.log
    
    # Update workflow.json with execution state
    TEMP_FILE=$(mktemp)
    jq --argjson max_parallel "$MAX_PARALLEL" \
       --argjson can_start "$can_start" \
       --arg recommendations "$recommendations" \
       '. + {
           "execution_state": {
               "max_parallel": $max_parallel,
               "in_progress_count": (.steps | map(select(.status == "in-progress")) | length),
               "available_tasks": [.steps[] | select(.status == "pending") | select(if (.depends_on | length) == 0 then true else (.depends_on | map(. as $dep | (.. | select(type == "object" and has("id") and .id == $dep) | .status == "completed")) | all) end) | .id],
               "can_start_more": $can_start,
               "next_recommended": ($recommendations | if length > 0 then split(",") | map(tonumber) else [] end)
           }
       }' workflow.json > "$TEMP_FILE" && mv "$TEMP_FILE" workflow.json
}

# Handle workflow-agent responses - implement Three-Tier Architecture
if [[ "$SUBAGENT_TYPE" == "workflow-agent" ]]; then
    echo "  ACTION: Processing workflow-agent Three-Tier routing" >> /tmp/workflow-log.log
    
    # Check for direct routing response
    if echo "$TOOL_RESULT" | jq -e '.routing == "direct"' >/dev/null 2>&1; then
        AGENT=$(echo "$TOOL_RESULT" | jq -r '.agent')
        REASON=$(echo "$TOOL_RESULT" | jq -r '.reason')
        echo ""
        echo "✅ DIRECT ROUTING DETECTED"
        echo "📋 TARGET AGENT: Execute $AGENT ($REASON)"
        echo "🎯 STATUS: Direct routing completed"
        echo ""
        echo "  DIRECT ROUTING: $AGENT - $REASON" >> /tmp/workflow-log.log
        exit 0
    fi
    
    # Check for PM analysis routing
    if echo "$TOOL_RESULT" | jq -e '.routing == "pm_analysis"' >/dev/null 2>&1; then
        REASON=$(echo "$TOOL_RESULT" | jq -r '.reason')
        echo ""
        echo "✅ COMPLEX ROUTING DETECTED"
        echo "📋 TARGET AGENT: Execute project-manager-agent ($REASON)"
        echo "🎯 STATUS: Complex routing analysis completed"
        echo ""
        echo "  PM ROUTING: project-manager-agent - $REASON" >> /tmp/workflow-log.log
        exit 0
    fi
    
    # Otherwise treat as standard workflow JSON
    echo "  ACTION: Creating standard workflow from workflow-agent" >> /tmp/workflow-log.log
    
    # Extract JSON from response (handle both pure JSON and JSON in markdown)
    WORKFLOW_JSON=$(echo "$TOOL_RESULT" | sed -n '/```json/,/```/p' | sed '1d;$d')
    
    # Fallback: if no markdown code blocks, try extracting JSON directly
    if [[ -z "$WORKFLOW_JSON" ]]; then
        WORKFLOW_JSON="$TOOL_RESULT"
    fi
    
    # Validate it's actually JSON
    JSON_VALIDATION_ERROR=$(echo "$WORKFLOW_JSON" | jq . 2>&1)
    if [[ $? -ne 0 ]]; then
        echo "ERROR: workflow-agent provided malformed JSON" >&2
        echo "JSON_ERROR: $JSON_VALIDATION_ERROR" >&2
        echo "PROVIDED_CONTENT: $(echo "$WORKFLOW_JSON" | head -c 300)..." >&2
        echo "REQUIRED: Use valid JSON format with 'steps' array or routing response with 'routing' field" >&2
        echo "RETRY: Fix JSON syntax and ensure proper field structure" >&2
        echo "  MALFORMED_JSON_ERROR: $JSON_VALIDATION_ERROR" >> /tmp/workflow-log.log
        echo "  FAILED_CONTENT: $WORKFLOW_JSON" >> /tmp/workflow-log.log
        exit 2
    fi
    
    
    # Validate required fields
    MISSING=""
    echo "$WORKFLOW_JSON" | jq -e '.task' >/dev/null 2>&1 || MISSING+="task "
    echo "$WORKFLOW_JSON" | jq -e '.steps' >/dev/null 2>&1 || MISSING+="steps "
    
    if [[ -n "$MISSING" ]]; then
        echo "ERROR: Missing required fields: $MISSING" >&2
        echo "REQUIRED_STRUCTURE: {\"task\": \"description\", \"steps\": [...]} or {\"routing\": \"direct\", \"agent\": \"name\", \"reason\": \"...\"}" >&2
        echo "PROVIDED_JSON: $(echo "$WORKFLOW_JSON" | jq -c . 2>/dev/null || echo "INVALID_JSON")" >&2
        echo "RETRY: Include all required fields in valid JSON format" >&2
        echo "  MISSING_FIELDS_ERROR: $MISSING" >> /tmp/workflow-log.log
        exit 2
    fi
    
    # Validate step structure
    STEP_COUNT=$(echo "$WORKFLOW_JSON" | jq '.steps | length')
    for ((i=0; i<$STEP_COUNT; i++)); do
        STEP=$(echo "$WORKFLOW_JSON" | jq ".steps[$i]")
        STEP_MISSING=""
        echo "$STEP" | jq 'has("id")' | grep -q true || STEP_MISSING+="id "
        echo "$STEP" | jq 'has("agent")' | grep -q true || STEP_MISSING+="agent "
        echo "$STEP" | jq 'has("task")' | grep -q true || STEP_MISSING+="task "
        echo "$STEP" | jq 'has("status")' | grep -q true || STEP_MISSING+="status "
        echo "$STEP" | jq 'has("depends_on")' | grep -q true || STEP_MISSING+="depends_on "
        
        if [[ -n "$STEP_MISSING" ]]; then
            echo "ERROR: Step $((i+1)) missing fields: $STEP_MISSING" >&2
            echo "STEP_STRUCTURE: {\"id\": number, \"agent\": \"name\", \"task\": \"description\", \"status\": \"pending\", \"depends_on\": [...]}" >&2
            echo "PROVIDED_STEP: $(echo "$STEP" | jq -c . 2>/dev/null || echo "INVALID_STEP")" >&2
            echo "RETRY: Ensure all steps have required fields with correct types" >&2
            echo "  STEP_VALIDATION_ERROR: Step $((i+1)) missing $STEP_MISSING" >> /tmp/workflow-log.log
            exit 2
        fi
    done
    
    # Create workflow.json
    echo "$WORKFLOW_JSON" > workflow.json
    echo "  SUCCESS: workflow.json created and validated" >> /tmp/workflow-log.log
    
    # Display success message
    echo ""
    echo "✅ WORKFLOW CREATION DETECTED"
    echo "📋 WORKFLOW FILE: workflow.json created and validated"
    echo "🎯 STATUS: Execution queue initialized"
    echo ""
    
    # Initialize execution queue with proper WBS logic
    update_execution_queue
    
    # Log next recommended tasks
    RECOMMENDED=$(jq -r '.execution_state.next_recommended[]? // empty' workflow.json 2>/dev/null)
    for task_id in $RECOMMENDED; do
        TASK_DESC=$(jq -r --arg id "$task_id" '.steps[] | select(.id == ($id | tonumber)) | .task' workflow.json)
        TASK_AGENT=$(jq -r --arg id "$task_id" '.steps[] | select(.id == ($id | tonumber)) | .agent' workflow.json)
        echo "  RECOMMEND: Execute Task $task_id with $TASK_AGENT: $TASK_DESC" >> /tmp/workflow-log.log
    done

# Handle task completion - update status and refresh queue
elif [[ -f "workflow.json" ]]; then
    echo "  ACTION: Processing task completion" >> /tmp/workflow-log.log
    
    # Find and update the completed task
    CURRENT_TASK=$(jq -r --arg agent "$SUBAGENT_TYPE" '.steps[] | select(.agent == $agent and .status == "pending") | .id' workflow.json | head -1)
    
    if [[ -n "$CURRENT_TASK" ]]; then
        # Update task as completed
        update_task_status "$CURRENT_TASK" "completed" "$TOOL_RESULT"
        
        # Refresh execution queue with new state
        update_execution_queue
        
        # Check if workflow is complete
        PENDING_COUNT=$(jq '.steps | map(select(.status == "pending")) | length' workflow.json)
        if [[ $PENDING_COUNT -eq 0 ]]; then
            TEMP_FILE=$(mktemp)
            jq '.status = "completed"' workflow.json > "$TEMP_FILE" && mv "$TEMP_FILE" workflow.json
            echo "  WORKFLOW COMPLETE: All tasks finished" >> /tmp/workflow-log.log
        else
            # Log next recommendations
            RECOMMENDED=$(jq -r '.execution_state.next_recommended[]? // empty' workflow.json 2>/dev/null)
            for task_id in $RECOMMENDED; do
                TASK_DESC=$(jq -r --arg id "$task_id" '.steps[] | select(.id == ($id | tonumber)) | .task' workflow.json)
                TASK_AGENT=$(jq -r --arg id "$task_id" '.steps[] | select(.id == ($id | tonumber)) | .agent' workflow.json)
                echo "  RECOMMEND: Execute Task $task_id with $TASK_AGENT: $TASK_DESC" >> /tmp/workflow-log.log
            done
        fi
    else
        echo "  WARNING: No pending task found for agent $SUBAGENT_TYPE" >> /tmp/workflow-log.log
    fi
fi

echo "===" >> /tmp/workflow-log.log