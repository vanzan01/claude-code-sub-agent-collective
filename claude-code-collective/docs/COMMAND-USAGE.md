# Claude Code Collective - Command System Usage Guide

## Overview

The Claude Code Collective command system provides both natural language and structured command interfaces for controlling the multi-agent orchestration system. This guide covers all available commands, usage patterns, and best practices.

## Quick Start

### Basic Commands
```bash
# Check system status
/collective status

# List available agents
/agent list

# Validate quality gates
/gate status

# Get help
/collective help
```

### Natural Language Commands
```bash
# These work just as well as structured commands
show me the system status
list all available agents
validate the quality gates
help me understand the routing system
```

## Command Namespaces

### 🎯 `/collective` - System Coordination

The collective namespace handles system-wide operations and coordination.

#### `/collective status [--verbose]`
Shows overall system health and status.

**Examples:**
```bash
/collective status
/collective status --verbose
```

**Natural Language:**
- "show system status"
- "how is the collective doing"
- "check system health"

#### `/collective route <request>`
Routes requests to the appropriate agent using intelligent selection.

**Examples:**
```bash
/collective route create a button component
/collective route implement user authentication
/collective route fix failing tests --skip-test
```

**Natural Language:**
- "route create a login form to the right agent"
- "send this task to the appropriate agent: build a todo app"

#### `/collective agents [--detailed]`
Lists all available agents in the collective.

**Examples:**
```bash
/collective agents
/collective agents --detailed
```

#### `/collective metrics [--detailed]`
Displays collective performance metrics and hypothesis validation.

**Examples:**
```bash
/collective metrics
/collective metrics --detailed
```

#### `/collective validate [phase] [--strict]`
Validates collective system integrity.

**Examples:**
```bash
/collective validate
/collective validate system --strict
/collective validate agents
```

#### `/collective help [topic]`
Shows help information for collective commands.

**Examples:**
```bash
/collective help
/collective help route
/collective help metrics
```

### 🤖 `/agent` - Agent Management

The agent namespace handles individual agent operations and management.

#### `/agent list [--detailed]`
Lists all available agents with their current status.

**Examples:**
```bash
/agent list
/agent list --detailed
```

**Natural Language:**
- "show me all agents"
- "list available agents"
- "what agents do we have"

#### `/agent spawn <type> [specialization] [--template] [--skip-contract]`
Creates a new specialized agent instance.

**Available Types:**
- `component` - UI component development
- `feature` - Business logic implementation
- `testing` - Test creation and validation
- `research` - Technical research and documentation
- `infrastructure` - Build systems and tooling
- `behavioral-transformation` - CLAUDE.md behavioral system

**Examples:**
```bash
/agent spawn testing integration
/agent spawn component --template=custom
/agent spawn feature authentication --skip-contract
```

**Natural Language:**
- "spawn a testing agent for integration work"
- "create a component agent"
- "I need a new research agent"

#### `/agent status <id> [--verbose]`
Shows detailed status for a specific agent.

**Examples:**
```bash
/agent status routing-agent
/agent status testing-implementation-agent --verbose
```

#### `/agent route <request>`
Tests routing logic without actually executing the request.

**Examples:**
```bash
/agent route create a button component
/agent route fix authentication bug
```

#### `/agent health [id] [--verbose]`
Checks agent health and performance metrics.

**Examples:**
```bash
/agent health
/agent health routing-agent --verbose
```

#### `/agent handoff <from> <to> [--skip-test]`
Executes manual agent handoff between two agents.

**Examples:**
```bash
/agent handoff component-agent testing-agent
/agent handoff routing-agent feature-agent --skip-test
```

#### `/agent help [topic]`
Shows help for agent commands.

**Examples:**
```bash
/agent help
/agent help spawn
/agent help handoff
```

### 🚪 `/gate` - Quality Gate Enforcement

The gate namespace handles quality gate validation and compliance.

#### `/gate status [--verbose]`
Shows quality gate status and compliance levels.

**Examples:**
```bash
/gate status
/gate status --verbose
```

**Natural Language:**
- "check quality gates"
- "show gate status"
- "are all gates passing"

#### `/gate validate [phase] [--strict]`
Validates quality gate requirements for specific phases.

**Available Phases:**
- `planning` - Planning phase validation
- `infrastructure` - Infrastructure setup validation
- `implementation` - Implementation quality validation
- `testing` - Test coverage and quality validation
- `polish` - Code quality and documentation validation
- `completion` - Final delivery validation

**Examples:**
```bash
/gate validate
/gate validate implementation --strict
/gate validate testing
```

#### `/gate bypass <gate> <reason> [--emergency]`
Emergency quality gate bypass (use with extreme caution).

**Examples:**
```bash
/gate bypass testing-gate "Critical hotfix deployment"
/gate bypass completion-gate "Security emergency patch" --emergency
```

#### `/gate history [limit]`
Shows quality gate validation history.

**Examples:**
```bash
/gate history
/gate history 20
```

#### `/gate help [topic]`
Shows help for gate commands.

**Examples:**
```bash
/gate help
/gate help bypass
/gate help validate
```

## Command Aliases

For convenience, the following aliases are available:

```bash
/c → /collective
/a → /agent
/g → /gate
/status → /collective status
/route → /collective route
/spawn → /agent spawn
```

## Natural Language Support

The command system understands natural language instructions and converts them to appropriate commands:

### Status Queries
- "show status" → `/collective status`
- "how are things" → `/collective status`
- "system health check" → `/collective status --verbose`

### Agent Operations
- "list agents" → `/agent list`
- "show available agents" → `/agent list --detailed`
- "spawn testing agent" → `/agent spawn testing`
- "create component agent" → `/agent spawn component`

### Gate Operations
- "check gates" → `/gate status`
- "validate gates" → `/gate validate`
- "gate compliance" → `/gate status --verbose`

### Routing Operations
- "route this task" → `/collective route`
- "send to agent" → `/collective route`
- "delegate work" → `/collective route`

## Advanced Features

### Command History
Access your recent command history:
```bash
/collective history
/collective history 20
```

### System Metrics
Monitor system performance:
```bash
/collective metrics --detailed
/agent metrics routing-agent
```

### Batch Operations
Execute multiple commands (via command system API):
```javascript
const commands = [
  '/collective status',
  '/agent list',
  '/gate validate'
];
await commandSystem.executeBatch(commands);
```

### Export Data
Export command history and metrics:
```javascript
// JSON export
const jsonData = await commandSystem.exportData('json');

// Markdown report
const report = await commandSystem.exportData('markdown');
```

## Performance and Optimization

### Response Time Expectations
- Simple commands: < 50ms
- Complex routing: < 200ms
- System validation: < 500ms

### Autocomplete
- Tab completion available for all commands
- Intelligent suggestions based on context
- Fuzzy matching for typo correction

### Caching
- Command suggestions are cached
- Recent commands cached for quick access
- System state cached for contextual help

## Best Practices

### 1. Regular Status Checks
Monitor system health regularly:
```bash
/collective status --verbose
```

### 2. Proper Agent Management
- List agents before spawning new ones
- Check agent health periodically
- Use appropriate specializations

### 3. Quality Gate Compliance
- Validate gates before major operations
- Use strict mode for production deployments
- Document all bypasses with clear reasons

### 4. Efficient Routing
- Use descriptive task descriptions
- Let the system choose the best agent
- Monitor routing success rates

### 5. Help Usage
- Use `/help` for general guidance
- Use specific help for detailed information
- Try natural language when unsure

## Troubleshooting

### Common Issues

**Command Not Recognized**
```bash
# Check spelling and try suggestions
/collective status
# Or use natural language
show system status
```

**Agent Not Found**
```bash
# List available agents first
/agent list
# Then reference by correct ID
/agent status routing-agent
```

**Gate Validation Failures**
```bash
# Check detailed status
/gate status --verbose
# Review specific phase requirements
/gate validate implementation --strict
```

**Slow Response Times**
```bash
# Check system metrics
/collective metrics
# Run maintenance
/collective maintain --repair
```

### Error Recovery
The system provides helpful error messages and suggestions:
- Typo correction suggestions
- Available command alternatives
- Context-sensitive help
- Usage examples for failed commands

## Integration Examples

### Workflow Automation
```bash
# Check system readiness
/collective status

# Validate environment
/gate validate planning

# Route development task
/collective route "implement user dashboard"

# Monitor progress
/agent status component-implementation-agent

# Validate completion
/gate validate implementation
```

### Debugging Session
```bash
# Check overall health
/collective status --verbose

# List problematic agents
/agent health --verbose

# Review recent failures
/collective history 10

# Run system maintenance
/collective maintain --repair
```

### Quality Assurance
```bash
# Validate all gates
/gate status --verbose

# Run system tests
/collective test --coverage

# Generate compliance report
/gate report --format=markdown

# Export metrics
/collective metrics --detailed
```

## API Integration

For programmatic access, use the CommandSystem class:

```javascript
const CommandSystem = require('./lib/command-system');

const commandSystem = new CommandSystem({
  enableMetrics: true,
  enableAutocomplete: true,
  performanceThreshold: 100
});

// Execute commands
const result = await commandSystem.executeCommand('/collective status');

// Get suggestions
const suggestions = commandSystem.getSuggestions('/agent sp');

// Access history
const history = commandSystem.getCommandHistory(10);

// Get help
const help = commandSystem.getHelp('collective route');
```

## Conclusion

The Claude Code Collective command system provides a powerful, intuitive interface for managing the multi-agent orchestration system. Whether you prefer structured commands or natural language, the system adapts to your working style while maintaining the precision needed for complex operations.

For additional help:
- Type `/help` for general assistance
- Use `--help` with any command for specific guidance
- Explore natural language alternatives when commands feel complex
- Leverage autocomplete for discovery and efficiency

The system learns from your usage patterns to provide increasingly relevant suggestions and faster command execution over time.