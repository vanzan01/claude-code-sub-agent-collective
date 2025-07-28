#!/bin/bash
# Workflow Coordinator Hook: Manages workflow.json execution and validation

# Read JSON input from stdin  
INPUT=$(cat)

# Extract tool parameters
SUBAGENT_TYPE=$(echo "$INPUT" | jq -r '.tool_input.subagent_type // ""')
TOOL_RESULT=$(echo "$INPUT" | jq -r '.tool_result // ""')

echo "WORKFLOW COORDINATOR: $(date)" >> /tmp/workflow-log.log
echo "  AGENT: $SUBAGENT_TYPE" >> /tmp/workflow-log.log

# Handle workflow-agent responses - create workflow.json
if [[ "$SUBAGENT_TYPE" == "workflow-agent" ]]; then
    echo "  ACTION: Creating workflow.json from workflow-agent response" >> /tmp/workflow-log.log
    
    # Extract JSON from workflow-agent response (handle mixed content)
    WORKFLOW_JSON=$(echo "$TOOL_RESULT" | sed -n '/^{/,/^}$/p' | head -1)
    
    # Fallback: try to extract JSON block from mixed content
    if [[ -z "$WORKFLOW_JSON" ]]; then
        WORKFLOW_JSON=$(echo "$TOOL_RESULT" | sed -n '/```json/,/```/p' | sed '1d;$d')
    fi
    
    # Another fallback: extract any JSON-like structure
    if [[ -z "$WORKFLOW_JSON" ]]; then
        WORKFLOW_JSON=$(echo "$TOOL_RESULT" | grep -Pzo '(?s)\{.*\}' | tr -d '\0' | head -1)
    fi
    
    if [[ -z "$WORKFLOW_JSON" ]]; then
        echo "  ERROR: No JSON found in workflow-agent response" >> /tmp/workflow-log.log
        echo "ERROR: workflow-agent must provide JSON workflow structure" >&2
        echo "REQUIRED: Response must contain valid JSON workflow format" >&2
        exit 2
    fi
    
    # Validate JSON syntax
    if ! echo "$WORKFLOW_JSON" | jq . >/dev/null 2>&1; then
        echo "  ERROR: Invalid JSON syntax from workflow-agent" >> /tmp/workflow-log.log
        echo "ERROR: workflow-agent provided malformed JSON" >&2
        echo "REQUIRED: Use valid JSON format with proper syntax" >&2
        exit 2
    fi
    
    # Validate required fields
    MISSING_FIELDS=""
    echo "$WORKFLOW_JSON" | jq -e '.task' >/dev/null 2>&1 || MISSING_FIELDS+="task "
    echo "$WORKFLOW_JSON" | jq -e '.workflow_type' >/dev/null 2>&1 || MISSING_FIELDS+="workflow_type "
    echo "$WORKFLOW_JSON" | jq -e '.status' >/dev/null 2>&1 || MISSING_FIELDS+="status "
    echo "$WORKFLOW_JSON" | jq -e '.current_step' >/dev/null 2>&1 || MISSING_FIELDS+="current_step "
    echo "$WORKFLOW_JSON" | jq -e '.steps' >/dev/null 2>&1 || MISSING_FIELDS+="steps "
    
    if [[ -n "$MISSING_FIELDS" ]]; then
        echo "  ERROR: Missing required fields: $MISSING_FIELDS" >> /tmp/workflow-log.log
        echo "ERROR: workflow-agent missing required fields: $MISSING_FIELDS" >&2
        echo "REQUIRED: Include all mandatory fields: task, workflow_type, status, current_step, steps" >&2
        exit 2
    fi
    
    # Validate step structure
    STEP_COUNT=$(echo "$WORKFLOW_JSON" | jq '.steps | length')
    for ((i=0; i<$STEP_COUNT; i++)); do
        STEP=$(echo "$WORKFLOW_JSON" | jq ".steps[$i]")
        STEP_MISSING=""
        echo "$STEP" | jq -e '.id' >/dev/null 2>&1 || STEP_MISSING+="id "
        echo "$STEP" | jq -e '.agent' >/dev/null 2>&1 || STEP_MISSING+="agent "
        echo "$STEP" | jq -e '.task' >/dev/null 2>&1 || STEP_MISSING+="task "
        echo "$STEP" | jq -e '.status' >/dev/null 2>&1 || STEP_MISSING+="status "
        echo "$STEP" | jq -e '.depends_on' >/dev/null 2>&1 || STEP_MISSING+="depends_on "
        echo "$STEP" | jq -e '.can_run_parallel' >/dev/null 2>&1 || STEP_MISSING+="can_run_parallel "
        
        if [[ -n "$STEP_MISSING" ]]; then
            echo "  ERROR: Step $((i+1)) missing fields: $STEP_MISSING" >> /tmp/workflow-log.log
            echo "ERROR: Step $((i+1)) missing required fields: $STEP_MISSING" >&2
            echo "REQUIRED: Each step must have: id, agent, task, status, depends_on, can_run_parallel, result, files_modified" >&2
            exit 2
        fi
    done
    
    # All validations passed
    echo "$WORKFLOW_JSON" > workflow.json
    echo "  SUCCESS: workflow.json created and validated" >> /tmp/workflow-log.log
    
    # Auto-execute first pending step
    NEXT_STEP=$(echo "$WORKFLOW_JSON" | jq -r '.steps[] | select(.status == "pending") | .id' | head -1)
    NEXT_AGENT=$(echo "$WORKFLOW_JSON" | jq -r --arg id "$NEXT_STEP" '.steps[] | select(.id == ($id | tonumber)) | .agent')
    NEXT_TASK=$(echo "$WORKFLOW_JSON" | jq -r --arg id "$NEXT_STEP" '.steps[] | select(.id == ($id | tonumber)) | .task')
    
    if [[ -n "$NEXT_AGENT" && -n "$NEXT_TASK" ]]; then
        echo "  AUTO-EXECUTE: $NEXT_AGENT - $NEXT_TASK" >> /tmp/workflow-log.log
        echo "$NEXT_TASK" | claude task --subagent-type "$NEXT_AGENT" --prompt-from-stdin &
    fi
    
# Handle other agent completions - update workflow.json
elif [[ -f "workflow.json" ]]; then
    echo "  ACTION: Updating workflow.json with agent completion" >> /tmp/workflow-log.log
    
    # Find current step for this agent
    CURRENT_STEP=$(jq -r --arg agent "$SUBAGENT_TYPE" '.steps[] | select(.agent == $agent and .status == "pending") | .id' workflow.json | head -1)
    
    if [[ -n "$CURRENT_STEP" ]]; then
        # Update step status and result
        TEMP_FILE=$(mktemp)
        jq --arg id "$CURRENT_STEP" --arg result "$TOOL_RESULT" --arg status "completed" \
           '.steps |= map(if .id == ($id | tonumber) then .status = $status | .result = $result else . end)' \
           workflow.json > "$TEMP_FILE"
        mv "$TEMP_FILE" workflow.json
        
        echo "  SUCCESS: Updated step $CURRENT_STEP as completed" >> /tmp/workflow-log.log
        
        # Check for next executable steps
        NEXT_STEPS=$(jq -r '.steps[] | select(.status == "pending") | select(.depends_on == [] or (.depends_on[] as $dep | ((.steps[] | select(.id == $dep) | .status) == "completed"))) | .id' workflow.json)
        
        for STEP_ID in $NEXT_STEPS; do
            STEP_AGENT=$(jq -r --arg id "$STEP_ID" '.steps[] | select(.id == ($id | tonumber)) | .agent' workflow.json)
            STEP_TASK=$(jq -r --arg id "$STEP_ID" '.steps[] | select(.id == ($id | tonumber)) | .task' workflow.json)
            
            if [[ -n "$STEP_AGENT" && -n "$STEP_TASK" ]]; then
                echo "  AUTO-EXECUTE: $STEP_AGENT - $STEP_TASK" >> /tmp/workflow-log.log
                echo "$STEP_TASK" | claude task --subagent-type "$STEP_AGENT" --prompt-from-stdin &
            fi
        done
        
        # Update workflow status if all steps completed
        PENDING_COUNT=$(jq '.steps[] | select(.status == "pending") | .id' workflow.json | wc -l)
        if [[ $PENDING_COUNT -eq 0 ]]; then
            TEMP_FILE=$(mktemp)
            jq '.status = "completed"' workflow.json > "$TEMP_FILE"
            mv "$TEMP_FILE" workflow.json
            echo "  WORKFLOW COMPLETE: All steps finished" >> /tmp/workflow-log.log
        fi
    else
        echo "  WARNING: No pending step found for agent $SUBAGENT_TYPE" >> /tmp/workflow-log.log
    fi
fi

echo "---" >> /tmp/workflow-log.log