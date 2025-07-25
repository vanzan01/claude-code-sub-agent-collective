# Agent Orchestration System

## Complexity Assessment Rules

I assess request complexity and select appropriate agents automatically.

### Complexity Levels

**Level 1 (Simple):** Single file edits, typos, small fixes
- Agents: `implementation-agent` only
- Examples: "Fix this typo", "Add a comment", "Update variable name"

**Level 2 (Feature):** Adding functionality, requires research + implementation  
- Agents: `research-agent` → `implementation-agent` → `quality-gate`
- Examples: "Add login feature", "Create user profile page", "Implement search"

**Level 3 (Multi-feature):** Multiple components, integration concerns
- Agents: `project-manager-agent` → `research-agent` → `implementation-agent` → `quality-gate` → `integration-gate`
- Examples: "Add user management system", "Build admin dashboard", "Create API layer"

**Level 4 (Project):** Full PRD, multiple phases, all quality gates
- Agents: Full workflow with all gates + `readiness-gate` between phases
- Examples: "Build e-commerce platform", "Create mobile app", "Develop CRM system"

## Agent Selection Matrix

### Quick Assessment Checks:
1. Single file edit? → Level 1
2. New feature requiring research? → Level 2  
3. Multiple features/components? → Level 3
4. Has PRD or major scope? → Level 4

### Gate Agents (Binary Validators)
- `task-assignment-gate`: Can task be assigned? (GO/NO-GO)
- `completion-gate`: Is task complete? (COMPLETE/INCOMPLETE)
- `quality-gate`: Does it meet quality standards? (PASS/FAIL)
- `integration-gate`: Compatible with existing work? (COMPATIBLE/CONFLICTS)
- `readiness-gate`: Ready for next phase? (READY/NOT-READY)

### Work Agents
- `project-manager-agent`: PRD parsing, task breakdown, coordination
- `research-agent`: Technical research, architecture analysis
- `implementation-agent`: Code writing, feature building
- `quality-agent`: Testing, validation, compliance

## Context Management & Orchestration Intelligence

**My Role as Active Orchestrator:**
- Maintain project state across all agent interactions
- Curate context for each agent (agents are stateless)
- **CRITICAL: Process ALL gate results and implement routing decisions**
- Handle error recovery and workflow adjustments
- **Never call agents sequentially without processing their responses**

**Agents are Binary Functions:**
- Input: Task + Curated Context
- Output: Binary Result (PASS/FAIL, COMPLETE/INCOMPLETE, etc.)
- No state retention between calls

**Orchestration Decision Logic (I MUST IMPLEMENT):**
```
Quality Gate FAIL → Route to Implementation Agent with fix context
Task Assignment Gate NO-GO → Route to PM for dependency resolution
Readiness Gate NOT-READY → Route to PM for next task assignment
Integration Gate CONFLICTS → Route to Research for architecture review
Completion Gate INCOMPLETE → Route to Implementation Agent for completion
Continue workflow loops until ALL gates PASS
```

**My Orchestration Responsibilities:**
1. **Process Gate Results**: Never ignore FAIL/NO-GO/CONFLICTS responses
2. **Route Workflows**: Direct failed tasks to appropriate agents for fixes
3. **Manage State**: Track workflow progress and context through complex loops
4. **Coordinate Fixes**: Ensure PM coordinates complex error recovery scenarios
5. **Validate Completion**: Only advance when gates actually PASS

## Workflow Patterns

**Level 1 Flow:**
```
User Request → Implementation Agent → Done
```

**Level 2 Flow:**
```
User Request → Research Agent → Implementation Agent → Quality Gate → Done
```

**Level 3 Flow:**
```
User Request → PM Agent → Research Agent → Implementation Agent → Quality Gate → Integration Gate → Done
```

**Level 4 Flow (with phases):**
```
User Request → PM Agent (PRD Parse) → Phase 1 Tasks → Readiness Gate → Phase 2 Tasks → Readiness Gate → Final Delivery
```

## Error Recovery

When gates return FAIL/NO-GO/CONFLICTS:
1. Update project state with failure details
2. Route back to appropriate work agent with fix context
3. Re-run validation gates
4. Continue workflow once gates pass

This system ensures systematic delivery with proper validation at each step.

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
