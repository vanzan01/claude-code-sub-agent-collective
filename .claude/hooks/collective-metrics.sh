#!/bin/bash
# collective-metrics.sh
# Phase 3 - Hook Integration System
# Collects performance metrics and coordination statistics for research validation

# Set up metrics storage
PROJECT_DIR=${CLAUDE_PROJECT_DIR:-"/mnt/h/Active/taskmaster-agent-claude-code"}
METRICS_DIR="$PROJECT_DIR/.claude-collective/metrics"
METRICS_FILE="$METRICS_DIR/metrics-$(date +%Y%m%d).json"
LOG_FILE="$METRICS_DIR/collective-metrics.log"

mkdir -p "$METRICS_DIR"

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }
epoch_ms() { date +%s%3N; }

log() {
    echo "[$(timestamp)] $1" >> "$LOG_FILE"
}

# Initialize environment variables
EVENT=${EVENT:-""}
TOOL_NAME=${TOOL_NAME:-""}
SUBAGENT_NAME=${SUBAGENT_NAME:-""}
USER_PROMPT=${USER_PROMPT:-""}
EXECUTION_TIME_MS=${EXECUTION_TIME_MS:-0}
CLAUDE_PROJECT_DIR=${CLAUDE_PROJECT_DIR:-"/mnt/h/Active/taskmaster-agent-claude-code"}

log "METRICS COLLECTION TRIGGERED - Event: $EVENT, Tool: $TOOL_NAME, Agent: $SUBAGENT_NAME"

# Initialize metrics file if it doesn't exist
initialize_metrics_file() {
    if [[ ! -f "$METRICS_FILE" ]]; then
        cat > "$METRICS_FILE" << 'EOF'
{
  "date": "",
  "research_metrics": {
    "jit_hypothesis": {
      "context_load_times": [],
      "memory_usage": [],
      "agent_spawn_times": []
    },
    "hub_spoke_hypothesis": {
      "routing_accuracy": [],
      "coordination_overhead": [],
      "peer_communication_violations": 0
    },
    "tdd_hypothesis": {
      "handoff_success_rate": [],
      "integration_defects": [],
      "test_coverage": []
    }
  },
  "performance_metrics": {
    "tool_executions": [],
    "agent_handoffs": [],
    "directive_violations": [],
    "quality_gates": []
  },
  "system_health": {
    "uptime": 0,
    "error_rate": 0,
    "response_times": []
  }
}
EOF
        # Set the date
        jq --arg date "$(date -I)" '.date = $date' "$METRICS_FILE" > "$METRICS_FILE.tmp" && mv "$METRICS_FILE.tmp" "$METRICS_FILE"
        log "Initialized metrics file: $METRICS_FILE"
    fi
}

# Collect JIT (Just-in-Time) Context Loading metrics
collect_jit_metrics() {
    local start_time="$1"
    local context_size="$2"
    
    if [[ "$EVENT" == "PreToolUse" ]]; then
        # Record context load time
        local load_time=$(($(epoch_ms) - start_time))
        
        jq --argjson load_time "$load_time" \
           --argjson context_size "${context_size:-0}" \
           '.research_metrics.jit_hypothesis.context_load_times += [{
             "timestamp": now,
             "load_time_ms": $load_time,
             "context_size": $context_size,
             "tool": "'$TOOL_NAME'"
           }]' "$METRICS_FILE" > "$METRICS_FILE.tmp" && mv "$METRICS_FILE.tmp" "$METRICS_FILE"
        
        log "JIT Metrics: Context load time: ${load_time}ms, Size: $context_size"
    fi
}

# Collect Hub-Spoke Coordination metrics
collect_hub_spoke_metrics() {
    local routing_decision="$1"
    local coordination_start="$2"
    
    if [[ "$EVENT" == "SubagentStop" ]]; then
        # Calculate coordination overhead
        local coordination_time=$(($(epoch_ms) - coordination_start))
        
        # Determine routing accuracy (simplified heuristic)
        local accuracy=1
        if echo "$USER_PROMPT" | grep -qi "error\|fail\|retry"; then
            accuracy=0
        fi
        
        jq --argjson accuracy "$accuracy" \
           --argjson coord_time "$coordination_time" \
           '.research_metrics.hub_spoke_hypothesis.routing_accuracy += [$accuracy] |
            .research_metrics.hub_spoke_hypothesis.coordination_overhead += [{
              "timestamp": now,
              "coordination_time_ms": $coord_time,
              "agent": "'$SUBAGENT_NAME'"
            }]' "$METRICS_FILE" > "$METRICS_FILE.tmp" && mv "$METRICS_FILE.tmp" "$METRICS_FILE"
        
        log "Hub-Spoke Metrics: Accuracy: $accuracy, Coordination time: ${coordination_time}ms"
    fi
    
    # Check for peer-to-peer communication violations
    if echo "$USER_PROMPT" | grep -qi -E "@[a-z-]*agent.*@[a-z-]*agent"; then
        jq '.research_metrics.hub_spoke_hypothesis.peer_communication_violations += 1' \
           "$METRICS_FILE" > "$METRICS_FILE.tmp" && mv "$METRICS_FILE.tmp" "$METRICS_FILE"
        log "Hub-Spoke Violation: Peer-to-peer communication detected"
    fi
}

# Collect Test-Driven Development metrics
collect_tdd_metrics() {
    local handoff_quality="$1"
    local test_coverage="$2"
    
    if [[ "$EVENT" == "SubagentStop" ]]; then
        # Assess handoff success (simplified scoring)
        local handoff_success=1
        if echo "$USER_PROMPT" | grep -qi -E "error\|fail\|incomplete\|retry"; then
            handoff_success=0
        fi
        
        # Check for test mentions
        local has_tests=0
        if echo "$USER_PROMPT" | grep -qi -E "test\|spec\|coverage\|validate"; then
            has_tests=1
        fi
        
        jq --argjson success "$handoff_success" \
           --argjson has_tests "$has_tests" \
           --argjson coverage "${test_coverage:-0}" \
           '.research_metrics.tdd_hypothesis.handoff_success_rate += [$success] |
            .research_metrics.tdd_hypothesis.test_coverage += [{
              "timestamp": now,
              "coverage": $coverage,
              "has_tests": $has_tests,
              "agent": "'$SUBAGENT_NAME'"
            }]' "$METRICS_FILE" > "$METRICS_FILE.tmp" && mv "$METRICS_FILE.tmp" "$METRICS_FILE"
        
        log "TDD Metrics: Handoff success: $handoff_success, Has tests: $has_tests, Coverage: $test_coverage"
    fi
}

# Collect performance metrics
collect_performance_metrics() {
    local execution_start=$(epoch_ms)
    
    # Record tool execution
    if [[ -n "$TOOL_NAME" ]]; then
        jq --arg tool "$TOOL_NAME" \
           --argjson exec_time "${EXECUTION_TIME_MS:-0}" \
           '.performance_metrics.tool_executions += [{
             "timestamp": now,
             "tool": $tool,
             "execution_time_ms": $exec_time,
             "event": "'$EVENT'"
           }]' "$METRICS_FILE" > "$METRICS_FILE.tmp" && mv "$METRICS_FILE.tmp" "$METRICS_FILE"
        
        log "Performance: Tool $TOOL_NAME executed in ${EXECUTION_TIME_MS}ms"
    fi
    
    # Record agent handoffs
    if [[ "$EVENT" == "SubagentStop" && -n "$SUBAGENT_NAME" ]]; then
        jq --arg agent "$SUBAGENT_NAME" \
           '.performance_metrics.agent_handoffs += [{
             "timestamp": now,
             "agent": $agent,
             "event": "'$EVENT'"
           }]' "$METRICS_FILE" > "$METRICS_FILE.tmp" && mv "$METRICS_FILE.tmp" "$METRICS_FILE"
        
        log "Performance: Agent handoff recorded for $SUBAGENT_NAME"
    fi
}

# Collect system health metrics
collect_system_health() {
    # Update response times
    if [[ "$EXECUTION_TIME_MS" -gt 0 ]]; then
        jq --argjson response_time "$EXECUTION_TIME_MS" \
           '.system_health.response_times += [$response_time]' \
           "$METRICS_FILE" > "$METRICS_FILE.tmp" && mv "$METRICS_FILE.tmp" "$METRICS_FILE"
    fi
    
    # Calculate error rate (simplified)
    local is_error=0
    if echo "$USER_PROMPT" | grep -qi -E "error\|fail\|exception"; then
        is_error=1
    fi
    
    if [[ "$is_error" == "1" ]]; then
        jq '.system_health.error_rate += 1' \
           "$METRICS_FILE" > "$METRICS_FILE.tmp" && mv "$METRICS_FILE.tmp" "$METRICS_FILE"
        log "System Health: Error detected and recorded"
    fi
}

# Generate metrics summary
generate_summary() {
    if [[ ! -f "$METRICS_FILE" ]]; then
        return 0
    fi
    
    local summary_file="$METRICS_DIR/summary-$(date +%Y%m%d).txt"
    
    cat > "$summary_file" << EOF
# Collective Metrics Summary - $(date)

## Research Hypothesis Validation

### JIT Hypothesis
- Context load times collected: $(jq '.research_metrics.jit_hypothesis.context_load_times | length' "$METRICS_FILE")
- Average load time: $(jq '[.research_metrics.jit_hypothesis.context_load_times[].load_time_ms] | add / length' "$METRICS_FILE" 2>/dev/null || echo "N/A")ms

### Hub-Spoke Hypothesis  
- Routing accuracy: $(jq '[.research_metrics.hub_spoke_hypothesis.routing_accuracy] | add / length * 100' "$METRICS_FILE" 2>/dev/null || echo "N/A")%
- Peer communication violations: $(jq '.research_metrics.hub_spoke_hypothesis.peer_communication_violations' "$METRICS_FILE")

### TDD Hypothesis
- Handoff success rate: $(jq '[.research_metrics.tdd_hypothesis.handoff_success_rate] | add / length * 100' "$METRICS_FILE" 2>/dev/null || echo "N/A")%
- Test coverage events: $(jq '.research_metrics.tdd_hypothesis.test_coverage | length' "$METRICS_FILE")

## Performance Metrics
- Tool executions: $(jq '.performance_metrics.tool_executions | length' "$METRICS_FILE")
- Agent handoffs: $(jq '.performance_metrics.agent_handoffs | length' "$METRICS_FILE")
- Average response time: $(jq '[.system_health.response_times] | add / length' "$METRICS_FILE" 2>/dev/null || echo "N/A")ms

EOF
    
    log "Generated metrics summary: $summary_file"
}

# Main collection logic
main() {
    local start_time=$(epoch_ms)
    
    log "Starting metrics collection for event: $EVENT"
    
    # Initialize metrics file
    initialize_metrics_file
    
    # Collect metrics based on event type
    case "$EVENT" in
        "PreToolUse")
            collect_jit_metrics "$start_time" "$(echo "$USER_PROMPT" | wc -c)"
            collect_performance_metrics
            ;;
        "PostToolUse")
            collect_performance_metrics
            collect_system_health
            ;;
        "SubagentStop")
            collect_hub_spoke_metrics "routing" "$start_time"
            collect_tdd_metrics "quality" "0"
            collect_performance_metrics
            ;;
        *)
            collect_performance_metrics
            ;;
    esac
    
    # Generate summary periodically (every 10th execution)
    local execution_count=$(jq '.performance_metrics.tool_executions | length' "$METRICS_FILE" 2>/dev/null || echo "0")
    if [[ $((execution_count % 10)) -eq 0 && $execution_count -gt 0 ]]; then
        generate_summary
    fi
    
    log "Metrics collection completed for event: $EVENT"
    return 0
}

# Execute main function
main "$@"