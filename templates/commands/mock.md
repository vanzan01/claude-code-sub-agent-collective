# /mock - Mock Agent Testing Command

---
allowed-tools: Task(*)
description: 🧪 Test agent handoff coordination using ONLY mock agents - complete isolation from real agents
---

## Purpose
Test complete agent handoff chains using ONLY mock agents. This command routes exclusively to mock agents to validate coordination patterns without touching any real implementation agents.

## Mock Agent Routing

### Mock Chain Flow
```
/mock → mock-prd-research-agent → mock-project-manager-agent → mock-implementation-agent → mock-testing-agent → mock-quality-gate-agent → mock-completion-agent
```

### Available Mock Agents ONLY
- `mock-prd-research-agent` - Mock PRD analysis
- `mock-project-manager-agent` - Mock project coordination  
- `mock-implementation-agent` - Mock development simulation
- `mock-testing-agent` - Mock testing simulation
- `mock-quality-gate-agent` - Mock quality validation
- `mock-completion-agent` - Mock delivery simulation

## Execution

For ANY mock testing request, route to `mock-prd-research-agent`:

```
Task(subagent_type="mock-prd-research-agent", 
     description="Mock chain testing", 
     prompt="Start complete mock agent handoff chain simulation using mock PRD at .taskmaster/docs/mock-prd.txt - test all handoff patterns through mock-project-manager-agent → mock-implementation-agent → mock-testing-agent → mock-quality-gate-agent → mock-completion-agent")
```

## Usage Examples
- `/mock "test handoff chain"`
- `/mock "validate agent coordination"`  
- `/mock "test complete workflow"`

## Critical Rules
- NEVER route to real agents (prd-research-agent, component-implementation-agent, etc.)
- ALWAYS start with mock-prd-research-agent
- ONLY test coordination patterns, no real implementation
- Use mock PRD at .taskmaster/docs/mock-prd.txt