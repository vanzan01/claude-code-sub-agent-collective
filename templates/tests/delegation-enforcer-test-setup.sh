#!/bin/bash
# delegation-enforcer-test-setup.sh
# Creates a handoff scenario for testing automatic delegation enforcement
# USE: Run this, then start fresh Claude Code session and send ANY message
# EXPECT: Automatic delegation should occur without manual intervention

CLAUDE_PROJECT_DIR=${CLAUDE_PROJECT_DIR:-"/mnt/h/Active/taskmaster-agent-claude-code"}
HANDOFF_DIR="$CLAUDE_PROJECT_DIR/.claude/handoff"
TEST_LOG="$CLAUDE_PROJECT_DIR/.claude/tests/delegation-test.log"

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }
log() { echo "[$(timestamp)] $1" | tee -a "$TEST_LOG"; }

log "🧪 DELEGATION ENFORCER TEST SETUP - Starting"

# Create handoff directory if it doesn't exist
mkdir -p "$HANDOFF_DIR"
mkdir -p "$CLAUDE_PROJECT_DIR/.claude/tests"

# Create test delegation file
cat > "$HANDOFF_DIR/NEXT_ACTION.json" <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "action": "delegate",
  "target_agent": "test-handoff-agent",
  "context": "Test delegation scenario for validation",
  "source_agent": "delegation-test-setup",
  "validation_status": "TEST_SETUP",
  "trigger_message": "Use the test-handoff-agent to validate automatic delegation enforcement works correctly."
}
EOF

log "✅ Created delegation file: $HANDOFF_DIR/NEXT_ACTION.json"
log "🎯 Target agent: test-handoff-agent"

# Create test marker file
echo "TEST_STARTED:$(date -Iseconds)" > "$CLAUDE_PROJECT_DIR/.claude/tests/delegation-test-status.txt"

log "🔬 TEST INSTRUCTIONS:"
log "1. Run: /clear (to clear context)"  
log "2. Send ANY message to Claude Code"
log "3. EXPECT: Automatic delegation to test-handoff-agent"
log "4. Run: .claude/tests/delegation-enforcer-test-validate.sh"

log "🧪 DELEGATION ENFORCER TEST SETUP - Complete"
log "📄 Test log: $TEST_LOG"

echo "🚀 TEST READY - Clear context and send any message to trigger delegation"