#!/bin/bash
# collective-metrics.sh
# Claude Code Sub-Agent Collective - Metrics Collection Hook
# Collects performance and research metrics from agent interactions

# Set up logging
METRICS_DIR="{{PROJECT_ROOT}}/.claude-collective/metrics"
METRICS_FILE="$METRICS_DIR/$(date +%Y-%m-%d)-metrics.json"
LOG_FILE="/tmp/collective-metrics.log"

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }
log() {
    echo "[$(timestamp)] $1" >> "$LOG_FILE"
}

# Initialize environment variables
USER_PROMPT=${USER_PROMPT:-""}
TOOL_NAME=${TOOL_NAME:-""}
AGENT_NAME=${AGENT_NAME:-"hub-controller"}
CLAUDE_PROJECT_DIR=${CLAUDE_PROJECT_DIR:-"{{PROJECT_ROOT}}"}

# Ensure metrics directory exists
mkdir -p "$METRICS_DIR"

# Collect basic metrics
collect_basic_metrics() {
    local metric_entry=$(cat <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "agent": "$AGENT_NAME",
  "tool": "$TOOL_NAME",
  "prompt_length": ${#USER_PROMPT},
  "session_id": "${CLAUDE_SESSION_ID:-unknown}"
}
EOF
)
    
    # Append to metrics file
    if [[ -f "$METRICS_FILE" ]]; then
        # File exists, append to array
        local temp_file=$(mktemp)
        jq ". += [$metric_entry]" "$METRICS_FILE" > "$temp_file" 2>/dev/null || echo "[$metric_entry]" > "$temp_file"
        mv "$temp_file" "$METRICS_FILE"
    else
        # Create new file
        echo "[$metric_entry]" > "$METRICS_FILE"
    fi
    
    log "Metrics collected for $AGENT_NAME using $TOOL_NAME"
}

# Collect research-specific metrics
collect_research_metrics() {
    # JIT Context Loading metrics
    if [[ "$TOOL_NAME" == "Task" ]]; then
        local context_size=$(echo "$USER_PROMPT" | wc -c)
        local token_estimate=$((context_size / 4)) # Rough token estimation
        
        echo "{\"jit_metrics\": {\"context_size\": $context_size, \"token_estimate\": $token_estimate}}" >> "$METRICS_DIR/jit-metrics.json"
    fi
    
    # Hub-Spoke coordination metrics
    if echo "$USER_PROMPT" | grep -qi "@.*-agent"; then
        local routing_event=$(cat <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "type": "routing",
  "from_agent": "$AGENT_NAME",
  "routing_detected": true,
  "pattern_compliance": true
}
EOF
)
        echo "$routing_event" >> "$METRICS_DIR/routing-metrics.json"
    fi
    
    # Test-driven handoff metrics
    if echo "$USER_PROMPT" | grep -qi -E "(handoff|test.*contract|validate)"; then
        local handoff_event=$(cat <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "type": "handoff",
  "agent": "$AGENT_NAME",
  "has_test_validation": $(echo "$USER_PROMPT" | grep -qi -E "(test|validate|contract)" && echo "true" || echo "false")
}
EOF
)
        echo "$handoff_event" >> "$METRICS_DIR/handoff-metrics.json"
    fi
}

# Performance metrics
collect_performance_metrics() {
    local start_time=${CLAUDE_TOOL_START_TIME:-$(date +%s%3N)}
    local current_time=$(date +%s%3N)
    local duration=$((current_time - start_time))
    
    local perf_metrics=$(cat <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "tool": "$TOOL_NAME",
  "duration_ms": $duration,
  "agent": "$AGENT_NAME"
}
EOF
)
    
    echo "$perf_metrics" >> "$METRICS_DIR/performance-metrics.json"
}

# Error tracking
track_errors() {
    if [[ $? -ne 0 ]]; then
        local error_event=$(cat <<EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
  "agent": "$AGENT_NAME",
  "tool": "$TOOL_NAME",
  "error": true,
  "context_length": ${#USER_PROMPT}
}
EOF
)
        echo "$error_event" >> "$METRICS_DIR/error-metrics.json"
        log "Error tracked for $AGENT_NAME using $TOOL_NAME"
    fi
}

# Main metrics collection
main() {
    log "Collecting metrics for agent: $AGENT_NAME, tool: $TOOL_NAME"
    
    # Collect different types of metrics
    collect_basic_metrics
    collect_research_metrics
    collect_performance_metrics
    track_errors
    
    # Cleanup old metrics files (keep last 7 days)
    find "$METRICS_DIR" -name "*.json" -mtime +7 -delete 2>/dev/null || true
    
    log "Metrics collection completed"
    return 0
}

# Execute main function
main "$@"