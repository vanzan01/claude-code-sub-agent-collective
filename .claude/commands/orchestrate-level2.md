# Level 2 Orchestration: Feature Development

Standard workflow for single features requiring research and implementation.

## Workflow Pattern
```
User Request → Research Agent → Implementation Agent → Quality Gate → Done
```

## When to Use
- New feature development
- Component creation
- API endpoint addition
- UI feature implementation

## Implementation Process
1. **Research Phase**: Call research-agent for technical analysis
2. **Implementation Phase**: Call implementation-agent with research context
3. **Quality Validation**: Call quality-gate for security/performance check
4. **Error Recovery**: If quality gate fails, loop back to implementation with fixes

## Example Usage
```
/orchestrate-level2 "Add user authentication feature"
```

## Context Flow
- Research findings → Implementation context
- Implementation results → Quality validation context
- Quality failures → Implementation fix context