# Level 1 Orchestration: Simple Tasks

Simple workflow for single file edits, typos, and small fixes.

## Workflow Pattern
```
User Request → Implementation Agent → Done
```

## When to Use
- Single file edits
- Typo fixes  
- Small code changes
- Comment additions
- Variable renames

## Implementation
1. Assess request as Level 1 (simple)
2. Call implementation-agent directly with clear context
3. Validate result and confirm completion

## Example Usage
```
/orchestrate-level1 "Fix the typo in login.js line 15"
```

This bypasses all gates for maximum efficiency on trivial tasks.