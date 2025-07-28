# Claude Code Rules

## Hook and Agent System Rules

**CRITICAL**: Any changes to hooks (.claude/hooks/) or agent configurations require a user restart.

**When to ask for restart:**
- Modifying .claude/hooks/pre-task.sh
- Modifying .claude/hooks/post-task.sh  
- Modifying .claude/settings.json hook configuration
- Changes to agent validation logic
- Updates to enforcement rules

**Procedure:**
1. Commit changes first
2. Ask user to restart Claude Code
3. DO NOT continue testing until restart confirmed
4. Never assume hooks work without restart

**Why this matters:**
Hooks are loaded at startup. Changes don't take effect until restart. Testing without restart gives false results and wastes time.