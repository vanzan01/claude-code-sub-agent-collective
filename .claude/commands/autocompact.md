---
description: "Save context to file for automated compact workflow"
---
# AutoCompact - Save Context to File
## Step 1: Analyze Current State
Extract and document:
- Current project/phase/task status
- Todo list state (use TodoRead if available)
- Recent implementations and changes
- Open files and active work
- Key technical decisions
- Next planned steps
## Step 2: Write Context File
Create/update `.claude/context.md` with the full context in a structured format:
```markdown
# Context Summary
## Current Status
- **Project**: [project name]
- **Phase**: [current phase]
- **Task**: [active task]
## Completed Work
[List what's been done]
## Active Todos
[Current todo items with status]
## Technical Context
- **Open Files**: [files being edited]
- **Recent Changes**: [what was changed]
- **Key Decisions**: [important choices made]
## Next Steps
[What needs to be done next]
```
## Step 3: Provide Simple Compact Command
Output:
```
/compact Review context and continue work @.claude/context.md
```
This way:
1. Context is automatically saved to a file
2. User runs one simple command that references the file
3. Context is preserved across compacts
$ARGUMENTS