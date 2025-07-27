#!/bin/bash
# Test blocking enforcement by simulating agent that claims work but makes no changes

echo "=== TESTING HOOK BLOCKING ENFORCEMENT ==="

# Stage current changes to clean git state
git add greet.js 2>/dev/null || true

echo "Current git status (should be clean):"
git status --porcelain

# Create fake hook input for implementation-agent claiming work but making no changes
cat > /tmp/test-hook-input.json << 'EOF'
{
  "session_id": "test-session",
  "transcript_path": "/tmp/test-transcript",
  "cwd": "/mnt/h/Active/taskmaster-agent-claude-code",
  "hook_event_name": "PostToolUse",
  "tool_name": "Task", 
  "tool_input": {
    "description": "Test blocking scenario",
    "prompt": "Implement a complete e-commerce platform with user authentication, product catalog, shopping cart, payment processing, and admin dashboard.",
    "subagent_type": "implementation-agent"
  }
}
EOF

# Run pre-hook to capture context
echo "Running pre-hook..."
cat /tmp/test-hook-input.json | bash .claude/hooks/pre-task.sh

echo "Testing post-hook with no changes made (should BLOCK with exit 2)..."

# Test post-hook with no changes made between pre and post
cat /tmp/test-hook-input.json | bash .claude/hooks/post-task.sh

echo "Hook exit code: $?"
echo "=== TEST COMPLETE ==="