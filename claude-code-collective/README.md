# Claude Code Sub-Agent Collective

[![npm version](https://badge.fury.io/js/claude-code-collective.svg)](https://badge.fury.io/js/claude-code-collective)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Experimental NPX installer for TDD-focused AI agents**

This installs a collection of AI agents designed for Test-Driven Development and rapid prototyping. It's experimental, opinionated, and I built it to speed up my own MVP development work.

## What this installs

```bash
npx claude-code-collective init
```

You get 30+ specialized agents that enforce TDD methodology and try to be smarter about using real documentation instead of guessing.

## Why this exists

I got tired of:
- AI giving me code without tests
- Having to manually look up library documentation
- Inconsistent development approaches across projects
- Breaking down complex features manually

So I built agents that:
1. Write tests first, always (RED → GREEN → REFACTOR)
2. Use Context7 to pull real documentation
3. Route work to specialists based on what needs doing
4. Break down complex requests intelligently

## What you get after installation

### Core Implementation Agents (TDD-enforced)
- **@component-implementation-agent** - UI components with tests and modern patterns
- **@feature-implementation-agent** - Business logic with comprehensive testing
- **@infrastructure-implementation-agent** - Build systems with testing setup
- **@testing-implementation-agent** - Test suites that actually test things
- **@polish-implementation-agent** - Performance optimization with preserved tests

### Quality & Validation
- **@quality-agent** - Code review and standards checking
- **@devops-agent** - Deployment and CI/CD setup
- **@functional-testing-agent** - Browser testing with Playwright
- **@enhanced-quality-gate** - Comprehensive validation gates
- **@completion-gate** - Task validation and completion checks

### Research & Intelligence (Experimental)
- **@research-agent** - Context7-powered documentation lookup
- **@prd-research-agent** - Intelligent requirement breakdown
- **@task-orchestrator** - Smart task parallelization

### System & Coordination
- **`/van` command** - Entry point that routes to @task-orchestrator
- **@task-orchestrator** - Central routing hub that picks the right specialist
- **@behavioral-transformation-agent** - System behavioral setup
- **@hook-integration-agent** - TDD enforcement automation
- **@van-maintenance-agent** - System maintenance and updates

**Plus 20+ other specialized agents** for specific development tasks.

## Installation options

### Quick install (recommended for trying it out)
```bash
npx claude-code-collective init
```

### Other options if you want to be selective
```bash
# Just core agents for lightweight projects
npx claude-code-collective init --minimal

# Focus on testing framework only
npx claude-code-collective init --testing-only

# Just the behavioral system and hooks
npx claude-code-collective init --hooks-only

# Interactive setup with choices
npx claude-code-collective init --interactive
```

## What actually gets installed

```
your-project/
├── CLAUDE.md                    # Behavioral rules for agents
├── .claude/
│   ├── settings.json           # Hook configuration
│   ├── agents/                 # Agent definitions (30+ files)
│   │   ├── prd-research-agent.md
│   │   ├── task-orchestrator.md
│   │   ├── lib/
│   │   │   └── research-analyzer.js  # Complexity analysis engine
│   │   └── ... (lots more agents)
│   └── hooks/                  # TDD enforcement scripts
│       ├── test-driven-handoff.sh
│       └── collective-metrics.sh
└── .claude-collective/
    ├── tests/                  # Test framework templates
    ├── metrics/                # Usage tracking (for development)
    └── package.json           # Testing setup (Vitest)
```

## How it works

1. **`/van` command** routes to **@task-orchestrator** (the routing hub) which analyzes requests and delegates to specialists
2. **Research phase** - agents use Context7 for real documentation  
3. **Tests written first** - before any implementation
4. **Implementation** - minimal code to make tests pass
5. **Refactoring** - clean up while keeping tests green
6. **Delivery** - you see what tests were added and results

### The TDD contract every agent follows

```
## DELIVERY COMPLETE
✅ Tests written first (RED phase)
✅ Implementation passes tests (GREEN phase)
✅ Code refactored for quality (REFACTOR phase)
📊 Test Results: X/X passing
```

## Management commands

```bash
# Check what's installed and working
npx claude-code-collective status

# Validate installation integrity
npx claude-code-collective validate

# Fix broken installations
npx claude-code-collective repair

# Remove everything
npx claude-code-collective clean

# Get help
npx claude-code-collective --help
```

## Current state (honest assessment)

### What works well
- TDD enforcement prevents a lot of bugs
- Context7 integration is much better than agents guessing
- Routing usually picks the right agent for the job
- Breaking down complex tasks is genuinely helpful

### What's experimental/rough
- Some agents are still being refined
- Research phase can be slow sometimes
- Hook system requires restart (Claude Code limitation)
- Documentation is scattered across files

### Known limitations
- Requires Node.js >= 16
- Need to restart Claude Code after installation
- Opinionated about TDD (if you don't like tests, skip this)
- Some agents might be too thorough/slow for simple tasks

## Testing your installation

After installing:

```bash
# 1. Validate everything installed correctly
npx claude-code-collective validate

# 2. Check status
npx claude-code-collective status

# 3. Restart Claude Code (required for hooks)

# 4. Try it out
# In Claude Code: "Build a simple todo app with React"
# Expected: routes to research → breaks down task → writes tests → implements
```

## Troubleshooting

### Installation fails
- Check Node.js version: `node --version` (need >= 16)
- Clear npm cache: `npm cache clean --force`
- Try force install: `npx claude-code-collective init --force`

### Agents don't work
- Restart Claude Code (hooks need to load)
- Check `.claude/settings.json` exists
- Run `npx claude-code-collective validate`

### Tests don't run
- Make sure your project has a test runner (Jest, Vitest, etc.)
- Check if tests are actually being written to files
- Look at the TDD completion reports from agents

### Research is slow
- Context7 might be having connectivity issues
- Agent might be being thorough (this varies)
- Check `.claude-collective/metrics/` for timing data

## Requirements

- **Node.js**: >= 16.0.0
- **NPM**: >= 8.0.0
- **Claude Code**: With MCP support and hook system
- **Restart**: Required after installation (hooks limitation)

## What this is and isn't

### What it is
- Experimental development aid for rapid prototyping
- Collection of TDD-focused AI agents
- Personal project that I use for my own MVPs
- Opinionated about test-first development

### What it isn't
- Production-ready enterprise software
- Guaranteed to work perfectly
- Following any official standards
- A replacement for thinking or understanding code

## Why TDD?

Because in my experience:
- Writing tests first forces better design thinking
- Tests catch bugs when they're cheap to fix
- Refactoring is safe with good test coverage
- Code with tests is easier to change later

The agents enforce this because I believe it leads to better outcomes. If you disagree with TDD philosophy, this tool probably isn't for you.

## Research features (experimental)

To make agents smarter about modern development:

- **Context7 integration** - real, current library documentation
- **ResearchDrivenAnalyzer** - intelligent complexity assessment
- **Smart task breakdown** - only creates subtasks when actually needed
- **Best practice application** - research-informed patterns

This stuff is experimental and sometimes overthinks things, but generally helpful.

## Solutions to common agent problems

AI agents can be unreliable. Here's what I built to deal with that:

**Agents ignoring TDD rules**: Hook system enforces test-first development before any code gets written.

**Agents bypassing directives**: CLAUDE.md behavioral operating system with prime directives that override default behavior.

**Agents stopping mid-task**: Test-driven handoff validation ensures work gets completed or explicitly handed off.

**Agents making up APIs**: Context7 integration forces agents to use real, current documentation.

**Agents taking wrong approach**: Central routing through **@task-orchestrator** hub prevents agents from self-selecting incorrectly.

**Agents breaking coordination**: Hub-and-spoke architecture eliminates peer-to-peer communication chaos.

**Agents skipping quality steps**: Quality gates that block completion until standards are met.

**Agents losing context**: Handoff contracts preserve required information across agent transitions.

**Agents providing inconsistent output**: Standardized TDD completion reporting from every implementation agent.

**Agents working on wrong priorities**: ResearchDrivenAnalyzer scores complexity to focus effort appropriately.

Most of these are enforced automatically through hooks and behavioral constraints, not just hoping agents follow instructions.

## Support

This is a personal project, but:
- **Issues welcome** if you find bugs or have suggestions
- **PRs welcome** for small fixes or better agent prompts  
- **Don't expect rapid responses** - this is a side project

**Get help**: Run `npx claude-code-collective validate` for diagnostics

## License

MIT License - Use it, break it, fix it, whatever works for you.

---

## Changelog

### Recent Updates

**v1.3.9** - 🔧 **SessionStart Hook Fix**: Fixed verbose output issue where SessionStart hook displayed context content to users instead of loading silently. Hook now uses Claude Code's JSON API format with suppressOutput: true for clean startup experience while preserving full behavioral system loading.

**v1.3.8** - 🧹 **Tool Configuration Cleanup**: Fixed prd-research-agent tool configuration contradictions. Removed restricted tools from tool list and eliminated ineffective restricted_tools field. Agent now has clean access only to tools it actually uses. Documentation updated to match implementation.

**v1.3.7** - 🔧 **NPX Installer Fix**: Fixed agent library file installation. ResearchDrivenAnalyzer and other agent lib files now properly copy during NPX installation. Updated file-mapping.js to include agent lib directory mapping for complete template distribution.

**v1.3.6** - 🐛 **Critical Orchestrator Bug Fix**: Fixed premature TDD validation that was blocking implementation workflows. Hook now correctly distinguishes between deployment messages ("Deploying agent") and completion messages ("Phase completed"), preventing false validation triggers before work is actually done.

### Version History

**v1.3.5** - 🧠 **Autonomous PRD Research Agent**: Major upgrade transforms prd-research-agent from delegation-heavy to fully autonomous. New ResearchDrivenAnalyzer class provides intelligent complexity scoring using Context7 patterns. Agent now makes research-informed decisions instead of blind delegation.

**v1.3.4** - 🐛 **TDD Hook Dependency Fix**: Fixed false positive test failures when node_modules missing in .claude-collective/. Hook now automatically installs dependencies before running tests, preventing "Cannot find module" errors from blocking agent handoffs.

**v1.3.3** - ⚡ **TaskMaster Speed Optimization**: Eliminated slow Perplexity API calls from TaskMaster complexity analysis and task expansion. Agents now use fast Context7 research + pass results as context instead of triggering internal research calls.

**v1.3.2** - 🐛 **TDD Hook Fix**: Fixed build validation hook to check for package.json existence before running npm build. Prevents handoff failures in test environments without package.json.

**v1.3.1** - 🐛 **Critical Bug Fix**: Fixed false positive test failures in TDD validation system. Vitest output parsing now correctly recognizes `✓` success indicators and "Tests X passed (X)" format.

**v1.3.0** - First stable release with research optimization, TDD enforcement, and Context7 integration.

---

**Experimental** | **TDD-Focused** | **Personal Project** | **Use At Your Own Risk**