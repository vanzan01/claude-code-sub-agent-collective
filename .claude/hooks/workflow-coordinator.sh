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
    
    # Extract JSON from workflow-agent response
    WORKFLOW_JSON=$(echo "$TOOL_RESULT" | grep -A 1000 '{' | grep -B 1000 '}' | head -1)
    
    if [[ -n "$WORKFLOW_JSON" ]]; then
        # Validate JSON structure
        if echo "$WORKFLOW_JSON" | jq . >/dev/null 2>&1; then
            echo "$WORKFLOW_JSON" > workflow.json
            echo "  SUCCESS: workflow.json created" >> /tmp/workflow-log.log
            
            # Auto-execute first pending step
            NEXT_STEP=$(echo "$WORKFLOW_JSON" | jq -r '.steps[] | select(.status == "pending") | .id' | head -1)
            NEXT_AGENT=$(echo "$WORKFLOW_JSON" | jq -r --arg id "$NEXT_STEP" '.steps[] | select(.id == ($id | tonumber)) | .agent')
            NEXT_TASK=$(echo "$WORKFLOW_JSON" | jq -r --arg id "$NEXT_STEP" '.steps[] | select(.id == ($id | tonumber)) | .task')
            
            if [[ -n "$NEXT_AGENT" && -n "$NEXT_TASK" ]]; then
                echo "  AUTO-EXECUTE: $NEXT_AGENT - $NEXT_TASK" >> /tmp/workflow-log.log
                echo "$NEXT_TASK" | claude task --subagent-type "$NEXT_AGENT" --prompt-from-stdin &
            fi
        else
            echo "  ERROR: Invalid JSON from workflow-agent" >> /tmp/workflow-log.log
        fi
    else
        echo "  ERROR: No JSON found in workflow-agent response" >> /tmp/workflow-log.log
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