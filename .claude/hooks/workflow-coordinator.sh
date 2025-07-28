#!/bin/bash
# Workflow Execution Engine: Proper WBS/Project Management Logic

# Configuration
MAX_PARALLEL=3

# Read JSON input from stdin  
INPUT=$(cat)

# Extract tool parameters
SUBAGENT_TYPE=$(echo "$INPUT" | jq -r '.tool_input.subagent_type // ""')
TOOL_RESULT=$(echo "$INPUT" | jq -r '.tool_response.content[0].text // ""')

echo "=== WORKFLOW ENGINE: $(date) ===" >> /tmp/workflow-log.log
echo "AGENT: $SUBAGENT_TYPE" >> /tmp/workflow-log.log

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

# Handle workflow-agent responses - create and validate workflow.json
if [[ "$SUBAGENT_TYPE" == "workflow-agent" ]]; then
    echo "  ACTION: Creating workflow from workflow-agent" >> /tmp/workflow-log.log
    
    # Extract JSON from response
    WORKFLOW_JSON=$(echo "$TOOL_RESULT" | sed -n '/```json/,/```/p' | sed '1d;$d')
    
    # Fallback extraction methods
    if [[ -z "$WORKFLOW_JSON" ]]; then
        WORKFLOW_JSON=$(echo "$TOOL_RESULT" | grep -Pzo '(?s)\{.*\}' | tr -d '\0')
    fi
    
    if [[ -z "$WORKFLOW_JSON" ]]; then
        echo "ERROR: No JSON found in workflow-agent response" >&2
        echo "REQUIRED: Response must contain valid JSON workflow" >&2
        exit 2
    fi
    
    # Validate JSON syntax
    if ! echo "$WORKFLOW_JSON" | jq . >/dev/null 2>&1; then
        echo "ERROR: workflow-agent provided malformed JSON" >&2
        echo "REQUIRED: Use valid JSON format" >&2
        exit 2
    fi
    
    # Validate required fields
    MISSING=""
    echo "$WORKFLOW_JSON" | jq -e '.task' >/dev/null 2>&1 || MISSING+="task "
    echo "$WORKFLOW_JSON" | jq -e '.steps' >/dev/null 2>&1 || MISSING+="steps "
    
    if [[ -n "$MISSING" ]]; then
        echo "ERROR: Missing required fields: $MISSING" >&2
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
            exit 2
        fi
    done
    
    # Create workflow.json
    echo "$WORKFLOW_JSON" > workflow.json
    echo "  SUCCESS: workflow.json created and validated" >> /tmp/workflow-log.log
    
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