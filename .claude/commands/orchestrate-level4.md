# Level 4 Orchestration: Full Project Development

Complete project workflow with PRD parsing, phases, and comprehensive validation.

## Workflow Pattern
```
User Request + PRD → PM Agent (Parse PRD) → Phase 1 Tasks → Readiness Gate → Phase 2 Tasks → Readiness Gate → Final Delivery
```

## When to Use
- Complete applications
- Major system overhauls
- Multi-phase projects
- Projects with formal requirements (PRD)

## Phase-Based Implementation
1. **PRD Analysis**: PM agent parses requirements into tasks
2. **Phase Execution**: For each phase:
   - Call task-assignment-gate before each task
   - Execute Level 2/3 workflows for individual tasks
   - Call readiness-gate before phase advancement
3. **Phase Transitions**: Only advance when readiness-gate returns READY
4. **Final Validation**: Complete project validation

## Gate Orchestration Per Task
```
Task Assignment Gate → Research → Implementation → Quality Gate → Integration Gate → Task Complete
```

## Phase Completion Criteria
- All phase tasks completed
- All quality gates passed
- Integration validated
- Documentation complete
- Readiness gate approves advancement

## Example Usage
```
/orchestrate-level4 "Build e-commerce platform" [with PRD file]
```

## Error Recovery Patterns
- Task Assignment Gate NO-GO → Fix dependencies first
- Quality Gate FAIL → Rework implementation
- Integration Gate CONFLICTS → Architecture review
- Readiness Gate NOT-READY → Complete blocking items

This ensures systematic delivery with proper validation at every level.