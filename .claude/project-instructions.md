# TaskMaster Claude Code Integration - Project Instructions

## Claude Code Integration Architecture

This project now uses TaskMaster's native Claude Code integration for autonomous AI development. All models are configured to use the local Claude Code CLI with no API costs.

### Model Configuration
- **Main Model:** claude-code/sonnet (SWE: 0.727, Cost: $0)
- **Research Model:** claude-code/opus (SWE: 0.725, Cost: $0) 
- **Fallback Model:** claude-code/sonnet (SWE: 0.727, Cost: $0)

### Multi-Agent Architecture

#### 🎭 Orchestrator Agent
- **Model:** claude-code/sonnet
- **Role:** Strategic project coordination and quality gates
- **Responsibilities:** Initialize projects, coordinate agents, validate outputs

#### 🔬 Research Agent  
- **Model:** claude-code/opus
- **Role:** Deep architectural analysis and technical research
- **Responsibilities:** Framework evaluation, architecture patterns, accessibility research

#### ⚡ Implementation Agent
- **Model:** claude-code/sonnet
- **Role:** Production code development and testing
- **Responsibilities:** Feature implementation, testing, quality validation

### Branch Management Warning

**CRITICAL:** TaskMaster locks to the branch where it was first initialized. Always:
1. Switch to your desired working branch BEFORE initializing TaskMaster
2. Delete `.taskmaster/state.json` if you need to change branches
3. Reinitialize TaskMaster on the correct branch

### Usage Patterns

#### Single Command Autonomous Development
```bash
# Create PRD, then run:
/tm-orchestrator-simple
# Result: Complete production application
```

#### Individual Agent Commands
- `/tm-research-agent` - Deep technical analysis
- `/tm-implementation-agent` - Production development
- `/tm-project-structure-enforcer` - Quality governance

### Benefits of Claude Code Integration
- **Zero API costs** - Uses local Claude instance
- **Enhanced performance** - Direct CLI access vs API calls
- **Better integration** - Native Claude Code environment
- **Simplified setup** - No API key management
- **Advanced session management** - Automatic context handling

### Quality Standards
- WCAG 2.1 AA accessibility compliance
- TypeScript with strict mode
- Comprehensive testing coverage
- Mobile-first responsive design
- Professional project structure

### Revolutionary Capabilities
- Single-command autonomous development
- Research-driven architecture decisions
- Multi-agent coordination with quality gates
- Production-ready applications with zero human intervention