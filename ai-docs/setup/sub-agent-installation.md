# 🛠️ Sub-Agent Installation & Configuration Guide

## 🚀 Complete Setup for Automatic Autonomous Development

This guide walks you through setting up the revolutionary sub-agent autonomous development system that transforms natural language descriptions into production applications.

## 📋 Prerequisites ✅ (Already Setup in This Repo)

### Components Status
- **Claude Code CLI**: ✅ Already installed and operational
- **TaskMaster MCP**: ✅ v0.20.0+ with Claude Code integration active
- **Context7 MCP**: ✅ Library documentation access available
- **Zero-Cost Models**: ✅ claude-code/sonnet and claude-code/opus configured

### Skip Verification (Infrastructure Ready)
All infrastructure components are already operational in this repository. The implementation focuses on deploying the intelligent sub-agent layer.

## 🤖 Step 1: Understanding Claude Code Sub-Agent Framework

### How Claude Code Sub-Agents Work
Claude Code automatically detects and loads sub-agent definitions from **project-level** directories:
- **Project-level**: `.claude/agents/` (highest priority, project-specific)
- **User-level**: `~/.claude/agents/` (lower priority, global across projects)

**Key Framework Concepts:**
- **Automatic Detection**: Claude Code scans `.claude/agents/` on startup
- **YAML Frontmatter**: Each agent has name, description, and tools specification
- **Trigger Matching**: Agents activate based on description pattern matching
- **Tool Isolation**: Each agent only accesses specified tools
- **Project Scope**: Agents in `.claude/agents/` only work within this project

### 1.1 Setup Project-Level Agent Directory
```bash
# Project agents take precedence over user-level agents
ls -la .claude/

# Create project-specific agents directory
mkdir -p .claude/agents/
```

### 1.2 Deploy Agent Definitions to Active Directory
**Source vs Active Agents:**
- **Source**: `ai-docs/agents/*.md` (design documentation, version controlled)
- **Active**: `.claude/agents/*.md` (working agents that Claude Code loads)

```bash
# Deploy source agent definitions to active Claude Code directory
cp ai-docs/agents/*.md .claude/agents/

# Verify active agents deployed
ls -la .claude/agents/
```

**Why Two Locations:**
- `ai-docs/agents/` = Design documentation, preserved in git
- `.claude/agents/` = Working copies that Claude Code actually loads and executes
- This separation allows version control of agent designs while keeping working directory clean

**Expected Output:**
```
orchestrator-agent.md
research-agent.md
implementation-agent.md
quality-agent.md
devops-agent.md
```

### 1.3 Validate Agent Framework Integration
**How Claude Code Detects Agents:**
1. **Startup Scan**: Claude Code automatically scans `.claude/agents/` directory
2. **YAML Processing**: Parses frontmatter for name, description, tools
3. **Pattern Matching**: Matches user input against agent descriptions
4. **Automatic Activation**: Triggers appropriate agent based on context

```bash
# Verify agents are in correct location
ls .claude/agents/

# Check agent file structure
head -10 .claude/agents/orchestrator-agent.md
```

**Agent Activation Process:**
- **Natural Language**: "I need help planning a project" → Orchestrator Agent
- **Explicit Request**: "Use the research agent to analyze..." → Research Agent
- **Context Matching**: Claude Code automatically selects best agent for task

## ⚙️ Step 2: Configure TaskMaster MCP Integration

### 2.1 Verify TaskMaster Configuration
```bash
# Check current TaskMaster setup
# TaskMaster MCP is already integrated through Claude Code
# No separate tm commands needed - MCP tools available directly
```

### 2.2 Configure Claude Code Models (If Not Already Done)
```bash
# Models are already configured through Claude Code
# All TaskMaster operations use Claude Code models automatically
# No separate model configuration needed
```

**Expected Output:**
```
TaskMaster MCP integrated through Claude Code
All mcp__task-master__* tools available to agents
Zero-cost operation through local models
```

### 2.3 Test TaskMaster MCP Access
Test TaskMaster MCP tools are working by using them directly in Claude Code sessions. All agents have access to the appropriate TaskMaster tools as defined in their YAML frontmatter.

## 🧠 Step 3: Validate Agent Coordination

### 3.1 Simple Coordination Test
Start a new Claude Code session and test automatic agent triggering:

```
Test Input: "I need help planning a simple web application project"
Expected Result: Orchestrator Agent should automatically activate
```

### 3.2 Multi-Agent Test
```
Test Input: "Build a responsive todo application with local storage and accessibility features"
Expected Result: 
1. Orchestrator Agent: Project planning
2. Research Agent: Technology analysis
3. Implementation Agent: Code development
4. Quality Agent: Accessibility validation
```

### 3.3 TaskMaster Integration Test
```
Test Input: "Create a weather dashboard project using TaskMaster for project management"
Expected Result: Orchestrator should initialize TaskMaster project and coordinate other agents
```

## 🔧 Step 4: Advanced Configuration

### 4.1 Customize Agent Triggers
Edit agent files in `.claude/agents/` to customize trigger patterns:

```yaml
# Example: More specific orchestrator triggers
description: Coordinates development projects, PRD analysis, technical planning, and team coordination for software development tasks
```

### 4.2 Configure Tool Access Permissions
Modify tool lists in agent YAML frontmatter:

```yaml
# Example: Restrict Research Agent tools
tools: mcp__context7__*, mcp__task-master__research, mcp__task-master__analyze_project_complexity, WebSearch, WebFetch, Read
```

### 4.3 Add Custom Domain Expertise
Extend agent system prompts with your specific requirements:

```markdown
## Custom Domain Integration
You also have expertise in:
- [Your specific industry knowledge]
- [Custom frameworks you use]
- [Specific quality standards]
```

## 📊 Step 5: Performance Validation

### 5.1 Test Complete Autonomous Workflow
```
Full Test: "Create a responsive e-commerce product catalog with:
- Product grid with filtering
- Search functionality
- Shopping cart integration
- Mobile-first responsive design
- Accessibility compliance
- TypeScript and testing"
```

**Expected Automatic Coordination:**
1. **Orchestrator**: Project analysis, TaskMaster initialization
2. **Research**: Framework evaluation, architecture decisions
3. **Implementation**: Feature development, testing integration
4. **Quality**: Code review, accessibility validation, testing
5. **DevOps**: Build optimization, deployment preparation

### 5.2 Verify Zero-Cost Operation
All operations run through Claude Code locally with zero API costs. TaskMaster MCP operates through Claude Code models, ensuring complete cost-free autonomous development.

### 5.3 Performance Benchmarks
Track key metrics:
- **Agent Response Time**: < 5 seconds for coordination
- **Context Switching**: Seamless handoffs between agents
- **Tool Integration**: Successful TaskMaster MCP operations
- **Output Quality**: Production-ready code and documentation

## 🐛 Troubleshooting Common Issues

### Agent Not Triggering
**Problem**: Agents don't automatically activate
**Solutions**:
```bash
# Verify agent installation
ls .claude/agents/

# Check agent syntax
head -10 .claude/agents/orchestrator-agent.md

# Test trigger phrases with Task tool
Task(subagent_type="orchestrator-agent", prompt="I need help with project planning")
```

### TaskMaster Integration Errors
**Problem**: Agents can't access TaskMaster MCP
**Solutions**:
```bash
# TaskMaster MCP tools are available if Claude Code has proper MCP configuration
# Check that mcp__task-master__* tools are available in agent tool lists
# All TaskMaster operations work through Claude Code MCP integration
```

### Context Switching Issues
**Problem**: Agents lose context or get confused
**Solutions**:
- Use more specific trigger language
- Check for YAML syntax errors in agent definitions
- Verify tool permissions are correctly configured

### Performance Issues
**Problem**: Slow agent coordination or response times
**Solutions**:
```bash
# Clear Claude Code cache
claude cache clear

# Optimize agent definitions (remove unnecessary tools)
# Check system resources
top | grep claude
```

## 🆕 Fresh Start: New System Benefits

### Clean Installation Advantages
This new version approach provides:
1. **Simplified Setup**: Single installation path with no legacy considerations
2. **Optimal Performance**: Purpose-built for sub-agent coordination
3. **Zero Migration Complexity**: No manual system compatibility layers
4. **Future-Ready Architecture**: Built for scalability and evolution

### Immediate Full Functionality
Start using automatic coordination immediately:
```bash
# Natural language project requests work instantly
"Build a dashboard application with real-time data"
"Create a responsive e-commerce site with accessibility"
"Develop a task management app with offline capabilities"
```

## 📈 Success Indicators

### Installation Success
- ✅ All 5 agents registered in Claude Code
- ✅ TaskMaster MCP integration working
- ✅ Zero-cost model configuration active
- ✅ Basic coordination test passes

### Operational Success
- ✅ Automatic agent triggering based on natural language
- ✅ Seamless context sharing between agents
- ✅ TaskMaster MCP operations executing correctly
- ✅ Production-quality code output

### Advanced Success
- ✅ Parallel agent processing
- ✅ Proactive problem identification and resolution
- ✅ Continuous quality validation
- ✅ Complete autonomous development workflows

## 🚀 Next Steps

After successful installation:

1. **Read Workflow Documentation**: [automatic-coordination.md](../workflows/automatic-coordination.md)
2. **Explore TaskMaster Patterns**: [TaskMaster integration guides](../taskmaster-integration/)
3. **Try Real Examples**: [autonomous development examples](../examples/)
4. **Customize for Your Needs**: Advanced agent configuration

---

**Congratulations! You now have the world's first truly automatic autonomous development system running at zero cost with Claude Code integration.** 🎉

*Ready to build production applications from simple descriptions? Start with a natural language project request and watch your AI team coordinate automatically.*