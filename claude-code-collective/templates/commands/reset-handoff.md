# Reset Agent Handoff Workflow

Reset the agent handoff system by cleaning up state files and logs.

## What This Does

Clears all handoff-related state files so you can start a fresh agent workflow:

- Removes `.claude/handoff/NEXT_ACTION.json` (pending delegation context)
- Clears handoff logs in `/tmp/test-driven-handoff.log` 
- Resets any stuck delegation state
- Prepares for clean workflow restart

## Usage

```bash
# Remove handoff context files
rm -f .claude/handoff/NEXT_ACTION.json

# Clear handoff logs  
> /tmp/test-driven-handoff.log

# Optional: Clear any other temp handoff files
rm -f .claude/handoff/*.json
```

## When to Use

- **Stuck Handoffs**: When delegation gets stuck or loops
- **Fresh Start**: Before beginning new agent workflow  
- **Testing**: Between test runs to ensure clean state
- **Debugging**: When investigating handoff issues

## Files Cleaned

- `.claude/handoff/NEXT_ACTION.json` - Current delegation context
- `/tmp/test-driven-handoff.log` - Hook execution logs
- `.claude/handoff/*.json` - Any other handoff state files

## Safe Operation

This only removes temporary state files, never:
- TaskMaster data (`.taskmaster/tasks/`)
- Agent definitions (`.claude/agents/`)
- Hook scripts (`.claude/hooks/`)
- Project files or code

## Verification

After reset, verify clean state:
```bash
ls .claude/handoff/     # Should be empty or not exist
tail /tmp/test-driven-handoff.log  # Should be empty
```

Quick one-liner for complete reset:
```bash
rm -f .claude/handoff/*.json && > /tmp/test-driven-handoff.log && echo "Handoff workflow reset complete"
```