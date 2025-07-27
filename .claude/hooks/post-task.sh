#!/bin/bash
# Post-Task Hook: Verify actual work and enforce deliverables

# Read JSON input from stdin
INPUT=$(cat)

# Extract tool parameters using jq
SUBAGENT_TYPE=$(echo "$INPUT" | jq -r '.tool_input.subagent_type // ""')

# Calculate files created/modified
BEFORE_COUNT=$(cat /tmp/pre-task-count.txt)
AFTER_COUNT=$(find . -type f \( -name "*.js" -o -name "*.tsx" -o -name "*.ts" -o -name "*.json" -o -name "*.md" -o -name "*.sh" -o -name "*.yml" -o -name "*.yaml" -o -name "*.example" -o -name "Dockerfile" \) | wc -l)
FILES_CREATED=$((AFTER_COUNT - BEFORE_COUNT))

echo "POST-TASK: $(date)" >> /tmp/task-monitor.log
echo "  files_created: $FILES_CREATED" >> /tmp/task-monitor.log

# Agent-specific enforcement logic
case "$SUBAGENT_TYPE" in
  "implementation-agent")
    if [[ $FILES_CREATED -eq 0 ]]; then
      echo "ERROR: implementation-agent claimed implementation but created no files" >&2
      echo "ENFORCEMENT: Blocking fictional response - no deliverables found" >&2
      echo "REQUIRED: Use Write, Edit, or MultiEdit tools to create actual files" >&2
      exit 1  # This blocks the Task tool response
    fi
    echo "  enforcement_result: PASSED - $FILES_CREATED files created" >> /tmp/task-monitor.log
    ;;
  
  "research-agent")
    # Check for research tool usage patterns in logs
    if ! grep -q "Context7\|WebSearch\|WebFetch" /tmp/task-monitor.log; then
      echo "WARNING: research-agent may not have used research tools" >&2
      echo "  enforcement_result: WARNING - no research tool usage detected" >> /tmp/task-monitor.log
    else
      echo "  enforcement_result: PASSED - research tools used" >> /tmp/task-monitor.log
    fi
    ;;
    
  "quality-agent")
    # Check for actual code analysis tool usage
    if ! grep -q "Read\|Grep\|Bash" /tmp/task-monitor.log; then
      echo "WARNING: quality-agent may not have analyzed actual files" >&2
      echo "  enforcement_result: WARNING - no file analysis tools detected" >> /tmp/task-monitor.log
    else
      echo "  enforcement_result: PASSED - analysis tools used" >> /tmp/task-monitor.log
    fi
    ;;
    
  "functional-testing-agent")
    # Check for browser automation tool usage
    if ! grep -q "playwright" /tmp/task-monitor.log; then
      echo "WARNING: functional-testing-agent may not have used browser automation" >&2
      echo "  enforcement_result: WARNING - no Playwright usage detected" >> /tmp/task-monitor.log
    else
      echo "  enforcement_result: PASSED - browser automation tools used" >> /tmp/task-monitor.log
    fi
    ;;
    
  "devops-agent")
    if [[ $FILES_CREATED -eq 0 ]]; then
      echo "  enforcement_result: BLOCKED - devops-agent created no files" >> /tmp/task-monitor.log
      echo "ERROR: devops-agent claimed deployment setup but created no files" >&2
      echo "---" >> /tmp/task-monitor.log
      exit 1
    else
      echo "  enforcement_result: ALLOWED - $FILES_CREATED files created" >> /tmp/task-monitor.log
    fi
    ;;
    
  *)
    echo "  enforcement_result: SKIPPED - no enforcement rules for $SUBAGENT_TYPE" >> /tmp/task-monitor.log
    ;;
esac

echo "  final_file_count: $AFTER_COUNT" >> /tmp/task-monitor.log
echo "---" >> /tmp/task-monitor.log