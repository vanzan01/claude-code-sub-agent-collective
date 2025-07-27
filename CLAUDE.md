# Auto-Selection Agent System

## Agent Selection Process

Claude Code automatically analyzes requests and selects appropriate agents based on:

1. **Keyword Analysis**: Domain-specific terms trigger relevant specialists
2. **Context Assessment**: Task type determines agent capabilities needed  
3. **Scope Evaluation**: Simple vs complex determines single vs multi-agent workflows
4. **Intent Recognition**: User goals automatically match to specialist expertise

## Available Agents

### Core Work Agents (6)
- **project-manager-agent**: Project planning, requirements analysis, task coordination
- **research-agent**: Technical research, architecture analysis, technology evaluation
- **implementation-agent**: Code writing, feature building, hands-on development
- **quality-agent**: Testing, validation, compliance checking
- **devops-agent**: Deployment, CI/CD, infrastructure, build systems
- **functional-testing-agent**: Real browser testing using Playwright

### Quality Gate Agents (5)
- **task-assignment-gate**: Validates if tasks can be assigned based on dependencies
- **completion-gate**: Validates if tasks truly meet acceptance criteria
- **quality-gate**: Performs security, performance, and code quality validation
- **integration-gate**: Validates compatibility with existing completed tasks
- **readiness-gate**: Determines if project phases can advance

### Test & Workflow Agents (8)
- **test-agent-1** through **test-agent-5**: Validation and testing specialists
- **workflow-agent**: Provides workflow intelligence for complex orchestration
- **test-validation-agent**: Claude Code sub-agent functionality validation

## Automatic Agent Selection Examples

### Simple Development Tasks
```
"Fix this typo in the header" → implementation-agent
"Add a comment to explain this function" → implementation-agent
"Create a login form" → implementation-agent
```

### Research and Analysis Tasks
```
"Should I use React or Vue for this project?" → research-agent
"What are the best practices for JWT security?" → research-agent
"How should I architect a real-time notification system?" → research-agent
```

### Complex Project Development
```
"Build a todo app with authentication and persistence" → project-manager-agent
"Create an e-commerce platform" → project-manager-agent
"Develop a user management system" → project-manager-agent
```

### Quality and Testing
```
"Test this component in a real browser" → functional-testing-agent
"Check if my code meets security standards" → quality-gate
"Validate this feature works correctly" → quality-agent
```

## Fallback Mechanisms

### Explicit Agent Requests
Users can directly request specific agents:
```
"Use the research-agent to analyze database options"
"Have the functional-testing-agent test the login flow"
"Get the quality-gate to review security practices"
```

### Multi-Agent Coordination
Complex tasks automatically trigger coordination patterns:
- **Complex features**: project-manager-agent coordinates specialists
- **Failed validations**: Auto-route to appropriate fix agents
- **Integration issues**: research-agent provides architectural guidance

### Quality Validation Loops
Failed quality gates automatically route back for fixes:
```
Quality Gate FAIL → implementation-agent (with fix context)
Integration Gate CONFLICTS → research-agent (architecture review)
Completion Gate INCOMPLETE → implementation-agent (completion work)
```

## Tool Integration

### Task Master MCP
- Project initialization and management
- Task breakdown and dependency tracking
- Progress monitoring and coordination
- Quality gate management

### Context7 Integration
- Live documentation access for research-agent
- Up-to-date library and framework information
- Best practices and implementation patterns

### Playwright Integration
- Real browser testing for functional validation
- User interaction simulation and testing
- Cross-browser compatibility verification

## Agent Activation Keywords

Each agent includes embedded activation criteria and examples. Claude Code automatically analyzes requests for:

- **Implementation keywords**: implement, build, create, code, write, develop, fix, debug
- **Research keywords**: research, analyze, compare, evaluate, recommend, best practices
- **Project keywords**: build app, create application, full project, coordinate, manage
- **Quality keywords**: test, validate, check, review, security, performance

## Quality Standards

All agents maintain:
- **Security-first approach**: Input validation, secure patterns, vulnerability prevention
- **Accessibility compliance**: WCAG 2.1 AA standards across all implementations
- **Performance optimization**: Efficient code, bundle optimization, user experience focus
- **Production readiness**: Enterprise-grade quality with comprehensive testing

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md