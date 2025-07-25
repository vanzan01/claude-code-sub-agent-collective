# 📋 Simple Task Delegation Example

## Basic Sub-Agent Usage Pattern

This example demonstrates the correct way to use sub-agents with the Task tool.

### User Request
```
"I need help building a simple todo application"
```

### Correct Agent Delegation

#### Step 1: Orchestrator Coordination
```javascript
// Main Claude Code responds by delegating to orchestrator
Task(subagent_type="orchestrator-agent", 
     prompt="Plan and coordinate a simple todo application project")
```

#### Step 2: Research Analysis  
```javascript
// Orchestrator delegates technical research
Task(subagent_type="research-agent", 
     prompt="Analyze technical stack for todo app: HTML5, CSS, vanilla JavaScript vs frameworks")
```

#### Step 3: Implementation
```javascript
// Orchestrator delegates development work
Task(subagent_type="implementation-agent", 
     prompt="Implement todo app using research recommendations: semantic HTML, CSS custom properties, vanilla JS")
```

#### Step 4: Quality Review
```javascript
// Implementation delegates to quality review
Task(subagent_type="quality-agent", 
     prompt="Review todo app implementation for accessibility, security, and code quality")
```

#### Step 5: Deployment
```javascript
// Quality agent delegates to DevOps if ready
Task(subagent_type="devops-agent", 
     prompt="Prepare todo app for deployment with build optimization")
```

## Key Points

1. **Task Tool Required**: All sub-agent invocations use `Task(subagent_type="agent-name", prompt="specific request")`
2. **Context Isolation**: Each agent gets clean context with specific prompt
3. **Agent Names**: Use simple names like `orchestrator-agent`, `research-agent`, etc.
4. **Sequential Flow**: Agents delegate to next appropriate agent in workflow
5. **Specific Prompts**: Each delegation includes specific, actionable instructions

## Agent Capabilities

- **orchestrator-agent**: Project planning, TaskMaster coordination, agent delegation
- **research-agent**: Technical analysis, Context7 documentation, architecture decisions  
- **implementation-agent**: Code development, testing, feature implementation
- **quality-agent**: Code review, accessibility validation, security assessment
- **devops-agent**: Build optimization, deployment preparation, infrastructure

## File Structure

Agents are stored in:
- **Source**: `ai-docs/agents/*.md` (version controlled documentation)
- **Active**: `.claude/agents/*.md` (working agents that Claude Code loads)

Copy from source to active:
```bash
cp ai-docs/agents/*.md .claude/agents/
```