#!/bin/bash
# delegation-enforcer-test-validate.sh
# Validates if automatic delegation enforcement worked correctly
# RUN AFTER: Restarting Claude Code and sending a message

CLAUDE_PROJECT_DIR=${CLAUDE_PROJECT_DIR:-"/mnt/h/Active/taskmaster-agent-claude-code"}
HANDOFF_FILE="$CLAUDE_PROJECT_DIR/.claude/handoff/NEXT_ACTION.json"
TEST_LOG="$CLAUDE_PROJECT_DIR/.claude/tests/delegation-test.log"
STATUS_FILE="$CLAUDE_PROJECT_DIR/.claude/tests/delegation-test-status.txt"
ENFORCER_LOG="/tmp/delegation-enforcer.log"

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }
log() { echo "[$(timestamp)] $1" | tee -a "$TEST_LOG"; }

log "🔍 DELEGATION ENFORCER TEST VALIDATION - Starting"

# Check if test was started
if [[ ! -f "$STATUS_FILE" ]]; then
    log "❌ TEST FAILURE: No test status file found"
    log "❌ Run delegation-enforcer-test-setup.sh first"
    exit 1
fi

TEST_START=$(cat "$STATUS_FILE" 2>/dev/null)
log "📅 Test started: $TEST_START"

# Test 1: Check if handoff file was deleted (successful enforcement)
if [[ -f "$HANDOFF_FILE" ]]; then
    log "❌ TEST FAILURE: Handoff file still exists - delegation NOT enforced"
    log "❌ File: $HANDOFF_FILE"
    DELEGATION_SUCCESS=false
else
    log "✅ TEST PASS: Handoff file deleted - delegation was enforced"
    DELEGATION_SUCCESS=true
fi

# Test 2: Check enforcer logs
if [[ -f "$ENFORCER_LOG" ]]; then
    log "📋 Enforcer log found - checking for delegation activity"
    if grep -q "FORCING DELEGATION" "$ENFORCER_LOG"; then
        log "✅ TEST PASS: Enforcer log shows forced delegation"
        ENFORCER_WORKED=true
    else
        log "❌ TEST FAILURE: No forced delegation in enforcer log"
        ENFORCER_WORKED=false
    fi
    
    # Show recent enforcer logs
    log "📜 Recent enforcer activity:"
    tail -5 "$ENFORCER_LOG" | while read line; do
        log "  $line"
    done
else
    log "❌ TEST FAILURE: No enforcer log found at $ENFORCER_LOG"
    ENFORCER_WORKED=false
fi

# Test 3: Check Claude Code session behavior
log "🤖 Manual verification required:"
log "   - Did Claude automatically delegate to test-handoff-agent?"
log "   - Was there NO manual intervention required?"
log "   - Did delegation happen BEFORE any normal Claude response?"

# Generate test results
TIMESTAMP=$(date -Iseconds)
if [[ "$DELEGATION_SUCCESS" == "true" && "$ENFORCER_WORKED" == "true" ]]; then
    RESULT="PASS"
    log "🎉 OVERALL TEST RESULT: PASS"
    log "🎯 Automatic delegation enforcement is working correctly"
else
    RESULT="FAIL"
    log "💥 OVERALL TEST RESULT: FAIL"
    log "🚨 Automatic delegation enforcement needs debugging"
fi

# Save results
cat > "$CLAUDE_PROJECT_DIR/.claude/tests/delegation-test-results.json" <<EOF
{
  "test_name": "delegation_enforcer_validation",
  "timestamp": "$TIMESTAMP",
  "result": "$RESULT",
  "tests": {
    "handoff_file_deleted": $([[ "$DELEGATION_SUCCESS" == "true" ]] && echo "true" || echo "false"),
    "enforcer_log_activity": $([[ "$ENFORCER_WORKED" == "true" ]] && echo "true" || echo "false")
  },
  "files_checked": {
    "handoff_file": "$HANDOFF_FILE",
    "enforcer_log": "$ENFORCER_LOG",
    "test_log": "$TEST_LOG"
  }
}
EOF

log "📊 Test results saved to delegation-test-results.json"
echo "🔬 VALIDATION COMPLETE - Check test log for details: $TEST_LOG"