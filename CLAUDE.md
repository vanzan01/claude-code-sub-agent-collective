# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Claude Code Sub-Agent Collective** - an NPX-distributed framework that installs specialized AI agents, hooks, and behavioral systems for TDD-focused development workflows. The system enforces test-driven development through automated handoff validation and provides intelligent task routing through a hub-and-spoke architecture.

## CRITICAL REPOSITORY INFORMATION

**Git Remote URL:** https://github.com/vanzan01/claude-code-sub-agent-collective.git
**NEVER CHANGE THIS URL** - Always use this exact repository URL for all git operations.

## Architecture

### Core System
- **Hub-and-spoke architecture** with `@routing-agent` as central coordinator
- **Behavioral Operating System** defined in `CLAUDE.md` with prime directives
- **Test-Driven Handoffs** with contract validation between agents
- **Just-in-time context loading** to minimize memory usage

### Key Components
- **NPX Package**: `claude-code-collective` - Installable via `npx claude-code-collective init`
- **Agent System**: 30+ specialized agents in `templates/agents/`
- **Hook System**: TDD enforcement hooks in `templates/hooks/`
- **Command System**: Natural language + structured commands in `lib/command-*.js`
- **Metrics Framework**: Research hypotheses tracking in `lib/metrics/`
- **Template System**: Installation templates in `templates/`

## Essential Commands

### Development
```bash
# Run tests (primary test suite)
npm test                    # Vitest tests
npm run test:jest          # Jest tests (comprehensive)
npm run test:coverage      # Coverage reports

# Run specific test suites  
npm run test:contracts     # Contract validation tests
npm run test:handoffs      # Agent handoff tests
npm run test:agents        # Agent system tests

# Package management
npm run install-collective # Install to current directory
npm run validate          # Validate installation
npm run metrics:report    # View metrics data
```

### Local Testing Workflow

For testing changes before publishing (see ai-docs/Simple-Local-Testing-Workflow.md):

```bash
# Automated testing script
./scripts/test-local.sh    # Creates ../npm-tests/ccc-testing-vN, installs package, verifies version

# Manual testing (after running test-local.sh)
npx claude-code-collective init
npx claude-code-collective status
npx claude-code-collective validate

# Cleanup when done
./scripts/cleanup-tests.sh # Removes test directories and tarballs
```

#### Testing Scripts Available
- `scripts/test-local.sh` - Automated package testing in dedicated `../npm-tests/` directory
- `scripts/cleanup-tests.sh` - Clean up test artifacts and directories (removes npm-tests when empty)

#### NPM Testing Directory Naming Standards

**MANDATORY NAMING CONVENTION**: All npm testing directories MUST follow the established pattern:

- **Manual testing**: `ccc-manual-v[N]` (e.g., `ccc-manual-v1`, `ccc-manual-v2`)
- **Automated testing**: `ccc-automated-v[N]` (e.g., `ccc-automated-v1`, `ccc-automated-v2`) 
- **Feature-specific testing**: `ccc-[feature]-v[N]` (e.g., `ccc-backup-test-v1`, `ccc-hooks-test-v1`)

**DO NOT** use arbitrary names like `test-backup-validation` or any other format. Always use the `ccc-*` prefix followed by descriptive name and version number.

### NPX Package Testing
```bash
# Test the NPX package locally (quick testing)
npx . init                 # Test installation from current directory
npx . status              # Test status command
npx . validate            # Test validation
```

## Key Development Files

### Core Implementation
- `lib/index.js` - Main entry point and ClaudeCodeCollective class
- `lib/installer.js` - NPX installation logic
- `lib/command-system.js` - Natural language command processing
- `lib/AgentRegistry.js` - Agent management and lifecycle
- `bin/claude-code-collective.js` - CLI interface

### Testing Infrastructure
- `jest.config.js` - Jest configuration for comprehensive testing
- `vitest.config.js` - Vitest configuration for fast iteration
- `tests/setup.js` - Test environment setup
- `tests/contracts/` - Contract validation tests
- `tests/handoffs/` - Agent handoff tests

### Templates and Distribution
- `templates/` - All installation templates (agents, hooks, configs)
- `templates/CLAUDE.md` - Behavioral system template
- `templates/settings.json` - Claude Code configuration template
- `lib/file-mapping.js` - Template to destination mapping

## Development Workflow

### Branch-Based Testing Workflow

**Standard process for testing changes before merging:**

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # Make changes...
   git add . && git commit -m "feat: your changes"
   ```

2. **Test Locally** 
   ```bash
   ./scripts/test-local.sh
   # This creates ccc-testing-vN directory and tests your changes
   # Script shows version number to confirm you're testing your branch
   ```

3. **Manual Testing** (you'll be in test directory)
   ```bash
   # Non-interactive testing (for validation/CI)
   npx claude-code-collective init --yes --force
   npx claude-code-collective status  
   npx claude-code-collective validate
   
   # Interactive testing (for development)
   npx claude-code-collective init
   # Test all functionality you changed
   ```

4. **Fix Issues** (if any)
   ```bash
   cd ../taskmaster-agent-claude-code
   # Make fixes...
   git add . && git commit -m "fix: issue description"
   # Repeat from step 2
   ```

5. **Clean Up & Merge**
   ```bash
   ./scripts/cleanup-tests.sh  # Remove test artifacts
   git push -u origin feature/your-feature-name
   # Create PR, merge when approved
   ```

**Key Benefits:**
- Tests exact user installation experience
- Catches template/file mapping issues
- Verifies version changes work correctly
- No need to push to test (works locally)

### Adding New Agents
1. Create agent definition in `templates/agents/agent-name.md`
2. Update `lib/file-mapping.js` to include in installation
3. Add contract tests in `tests/agents/`
4. Test via `npm run test:agents`

### Modifying Hooks
1. Edit hook scripts in `templates/hooks/`
2. Update `templates/settings.json` if needed
3. Test hook behavior with `npm run test:handoffs`
4. Validate with `npm run test:contracts`

### Testing Installation
1. Make changes to templates or core logic
2. Test locally: `npx . init --force`
3. Validate: `npx . validate`
4. Run full test suite: `npm test`

## Code Architecture Patterns

### Agent System
- **Agent Registry**: Centralized agent tracking and lifecycle management
- **Template System**: Handlebars-based template rendering for dynamic agent creation
- **Spawning System**: Dynamic agent instantiation with proper context loading

### Hook System  
- **Test-Driven Handoffs**: Automated validation of agent transitions
- **Behavioral Enforcement**: Hooks enforce TDD and routing requirements
- **Metrics Collection**: Automated data gathering for research hypotheses

### Command System
- **Natural Language Processing**: Converts user intent to structured commands
- **Namespace Routing**: `/collective`, `/agent`, `/gate`, `/van` command spaces
- **Auto-completion**: Context-aware command suggestions

## Testing Strategy

### Test Suites
1. **Unit Tests** (`tests/*.test.js`) - Core functionality
2. **Contract Tests** (`tests/contracts/`) - Agent handoff validation
3. **Integration Tests** (`tests/handoffs/`) - End-to-end workflows
4. **Installation Tests** - NPX package validation

### Test Execution
- **Vitest**: Fast iteration during development (`npm test`)
- **Jest**: Comprehensive validation (`npm run test:jest`)
- **Coverage**: Track test coverage (`npm run test:coverage`)

### Quality Gates
- All tests must pass before releases
- Contract validation ensures agent compatibility
- Installation tests verify NPX package integrity

## Important Notes

### Development Environment
- **Node.js**: >= 16.0.0 required
- **Dependencies**: Use `npm install` not `yarn`
- **Testing**: Both Vitest and Jest configured for different use cases

### Release Process
1. Update version in `package.json`
2. Run full test suite: `npm run test:jest`
3. Test NPX installation: `npx . init --force`
4. Update `CHANGELOG.md` with changes
5. Commit and tag release

### File Management
- Never manually edit generated files in `.claude/` or `.claude-collective/`
- Template changes must be tested through full installation cycle
- Agent definitions follow strict markdown format requirements

### TDD Requirements
- All new functionality must have tests first
- Agent handoffs must include contract validation
- Behavioral changes require integration test updates

### Standards Compliance

**CRITICAL**: Do not modify established standards without explicit permission. This includes:

- **Naming conventions** (testing directories, file patterns, etc.)
- **Code formatting standards** 
- **Testing procedures and workflows**
- **Documentation structure**
- **Git workflow patterns**
- **Release processes**

When in doubt, follow existing patterns exactly. Ask for clarification before deviating from any established standard.

This codebase implements a sophisticated agent collective system with strong TDD enforcement and intelligent routing capabilities.