# Continue Agent Handoff Workflow

Resume an interrupted agent handoff workflow by checking for pending delegation context.

## What This Does

Checks for pending handoff context and resumes the workflow where it left off:

- Reads `.claude/handoff/NEXT_ACTION.json` for pending delegations
- Displays current handoff status and target agent
- Provides commands to continue the workflow
- Shows recent handoff logs for context

## Usage

Simply run this command and it will check current state and provide next steps.

## Check Current Status

```bash
# Check if there's a pending handoff
if [ -f .claude/handoff/NEXT_ACTION.json ]; then
  echo "📋 PENDING HANDOFF FOUND:"
  cat .claude/handoff/NEXT_ACTION.json | jq '.'
  echo ""
  echo "🎯 NEXT ACTION:"
  echo "Use the $(cat .claude/handoff/NEXT_ACTION.json | jq -r '.target_agent') subagent to continue the workflow."
else
  echo "✅ No pending handoffs - workflow is clear"
fi
```

## Resume Workflow

```bash
# Get target agent from context file
TARGET_AGENT=$(cat .claude/handoff/NEXT_ACTION.json | jq -r '.target_agent' 2>/dev/null)
CONTEXT=$(cat .claude/handoff/NEXT_ACTION.json | jq -r '.context' 2>/dev/null)

if [ -n "$TARGET_AGENT" ] && [ "$TARGET_AGENT" != "null" ]; then
  echo "🚀 RESUMING WORKFLOW:"
  echo "Target Agent: $TARGET_AGENT"
  echo "Context: $CONTEXT"
  echo ""
  echo "📝 COMMAND TO CONTINUE:"
  echo "Use the $TARGET_AGENT subagent to continue from the previous handoff context."
else
  echo "❌ No valid handoff context found"
fi
```

## When to Use

- **After Interruption**: When workflow was stopped mid-execution
- **Session Restart**: After closing and reopening Claude Code
- **Network Issues**: After connection problems during handoffs
- **Manual Break**: When you manually stopped to check something
- **Debugging**: To see current workflow state

## What You'll See

### If Handoff Pending:
```json
{
  "timestamp": "2025-08-11T14:55:18+08:00",
  "action": "delegate",
  "target_agent": "task-orchestrator",
  "context": "Agent handoff detected from prd-research-agent",
  "source_agent": "prd-research-agent",
  "validation_status": "TDD_PASSED"
}
```

### Resume Command:
```
Use the task-orchestrator subagent to continue from the previous handoff context.
```

## Recent Logs

```bash
# Check recent handoff activity
tail -10 /tmp/test-driven-handoff.log | grep "Handoff detected\|auto-delegation"
```

## Quick Continue

One-liner to check and continue:
```bash
if [ -f .claude/handoff/NEXT_ACTION.json ]; then 
  TARGET=$(cat .claude/handoff/NEXT_ACTION.json | jq -r '.target_agent')
  echo "Use the $TARGET subagent to continue the workflow."
else 
  echo "No pending handoffs"
fi
```

This command helps you seamlessly resume interrupted agent workflows!