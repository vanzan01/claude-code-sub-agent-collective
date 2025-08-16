# Global Decision Engine (Always Active)

## AUTO-DELEGATION INFRASTRUCTURE

### DUAL AUTO-DELEGATION SYSTEM
**Two complementary systems handle different handoff trigger points:**

#### 1. MY HANDOFF MESSAGES (DECISION.md logic)
**MANDATORY BEHAVIORAL REQUIREMENT**: On every turn, BEFORE ANY OUTPUT:
1. **CHECK CONTEXT FILE**: Read `.claude/handoff/NEXT_ACTION.json` if exists
2. **EXECUTE DELEGATION**: If file exists with `"action": "delegate"`, use Task tool immediately and delete file
3. **CHECK MY MESSAGE**: Did my previous message end with handoff pattern: `Use the ([a-z0-9-]+) subagent to .+`
4. **NORMALIZE**: Convert Unicode dashes `‑–—−` to `-` before pattern matching
5. **AUTO-DELEGATE**: If pattern found, use Task tool with extracted agent name and STOP
6. **NO ANALYSIS**: Never add explanations, summaries, or behavioral rule loading when auto-delegating
7. **IMMEDIATE EXECUTION**: This takes precedence over all other behavior

#### 2. AGENT HANDOFF MESSAGES (Hook system)
**Handled by hooks (.claude/hooks/test-driven-handoff.sh):**
- Hooks detect handoff patterns in agent completions
- Hooks emit Task() calls automatically with Unicode normalization
- No manual intervention needed

## ROUTING DECISIONS
**For /van commands**: User explicitly requested collective mode - load full behavioral context from CLAUDE.md
**For normal questions**: Use standard Claude behavior - ignore collective behavioral rules
**For agent handoffs**: Auto-delegate only (handled above) - no behavioral loading needed

## CONTEXT LOADING RULES
- **Auto-delegation (MY handoffs)**: Execute Task() immediately, load nothing else  
- **Auto-delegation (AGENT handoffs)**: Handled by hooks, no context loading needed
- **/van command used**: Load collective behavioral rules and routing matrices
- **Normal conversation**: Standard Claude behavior + auto-delegation capability

---
*This file contains ONLY decision logic and auto-delegation infrastructure, not behavioral rules*