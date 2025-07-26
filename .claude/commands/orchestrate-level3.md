# Level 3 Orchestration: Multi-Component Development

Complex workflow for multiple components with integration concerns.

## Workflow Pattern
```
User Request → PM Agent → Research Agent → Implementation Agent → Quality Gate → Integration Gate → Done
```

## When to Use
- Multi-component features
- System integrations
- Cross-cutting functionality
- Features affecting multiple areas

## Implementation Process
1. **Planning Phase**: Call project-manager-agent for task breakdown
2. **Research Phase**: Call research-agent for architecture analysis
3. **Implementation Phase**: Call implementation-agent with full context
4. **Quality Validation**: Call quality-gate for comprehensive checks
5. **Integration Validation**: Call integration-gate for compatibility
6. **Error Recovery**: Loop back to appropriate phase based on gate failures

## Gate Decision Matrix
- Quality Gate FAIL → Back to Implementation
- Integration Gate CONFLICTS → Back to Research for architecture review
- Both gates PASS → Task complete

## Example Usage
```
/orchestrate-level3 "Build user management system with roles and permissions"
```

## Context Management
- PM breakdown → Research context
- Research findings → Implementation context  
- Implementation → Quality validation context
- Quality results → Integration validation context
- Gate failures → Targeted fix context