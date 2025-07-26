# Autonomous AI Development Team

## What it does

Turn a natural language request into a production-ready application with 19 specialized AI agents coordinated through Claude's CLAUDE.md orchestration system.

### Request Examples by Complexity Level

**Level 1 (Simple edits):**
```
"Fix the typo in line 23 of app.js"
"Add a comment explaining the calculateTotal function"
"Update the button text from 'Submit' to 'Save'"
```

**Level 2 (Feature development):**
```  
"Add user login functionality with JWT authentication"
"Create a search feature for the product catalog"
"Implement dark mode toggle for the application"
```

**Level 3 (Multi-component systems):**
```
"Build a user management system with roles and permissions"
"Create an admin dashboard with analytics and user controls"
"Add a complete API layer with authentication and data validation"
```

**Level 4 (Full projects with PRD):**
```
"Build an e-commerce platform based on this PRD: [PRD file/content]"
"Create a task management application following these requirements: [detailed specs]"
"Develop a social media platform with these features: [comprehensive feature list]"
```

Result: Complete application with browser-tested functionality, zero JavaScript errors, accessibility compliance.

## Architecture

### Agent Organization

```mermaid
graph TB
    subgraph "Autonomous AI Development Team (19 Specialized Agents)"
        subgraph "Core Work Agents"
            PM[Project Manager Agent<br/>Task Coordination<br/>Workflow Management]
            Research[Research Agent<br/>Technical Analysis<br/>Architecture Decisions]
            Implementation[Implementation Agent<br/>Production Code<br/>Feature Development]
            Quality[Quality Agent<br/>Code Review<br/>Testing & Compliance]
            DevOps[DevOps Agent<br/>Deployment<br/>Infrastructure]
            FuncTest[Functional Testing Agent<br/>Real Browser Validation<br/>Playwright Automation]
        end
        
        subgraph "Quality Gate Agents"
            TaskGate[Task Assignment Gate<br/>Dependency Validation]
            QualityGate[Quality Gate<br/>Code Standards]
            CompletionGate[Completion Gate<br/>Requirements Check]
            IntegrationGate[Integration Gate<br/>Compatibility Check]
            ReadinessGate[Readiness Gate<br/>Phase Transition]
        end
        
        subgraph "Test & Workflow Agents"
            WorkflowAgent[Workflow Agent<br/>Complex Orchestration<br/>Level 3-4 Projects]
            TestAgents[Test Agents 1-5<br/>Validation & Integration<br/>Agent Communication]
        end
    end
    
    classDef agent fill:#e8f5e8,stroke:#2d5a27,stroke-width:2px,color:#1a1a1a
    classDef gate fill:#fce4ec,stroke:#a91e63,stroke-width:2px,color:#1a1a1a
    classDef test fill:#fff9c4,stroke:#b5651d,stroke-width:2px,color:#1a1a1a
    
    class PM,Research,Implementation,Quality,DevOps,FuncTest agent
    class TaskGate,QualityGate,CompletionGate,IntegrationGate,ReadinessGate gate
    class WorkflowAgent,TestAgents test
```

### Complexity-Based Orchestration Flow

```mermaid
graph TD
    User[User Request] --> Orchestrator{Claude Orchestrator<br/>Complexity Assessment}
    
    %% Level 1 Flow (Simple Tasks)
    Orchestrator -->|Level 1<br/>Simple Edit| L1_Impl[Implementation Agent<br/>Direct execution]
    L1_Impl --> L1_Done[✅ COMPLETE]
    
    %% Level 2 Flow (Feature Development)
    Orchestrator -->|Level 2<br/>Feature Request| L2_Research[Research Agent<br/>Architecture analysis]
    L2_Research --> L2_Impl[Implementation Agent<br/>Feature development]
    L2_Impl --> L2_FuncTest[Functional Testing Agent<br/>Browser validation]
    L2_FuncTest --> L2_Quality{Quality Gate}
    L2_Quality -->|PASS| L2_Done[✅ COMPLETE]
    L2_Quality -->|FAIL| L2_Fix[Implementation Agent<br/>Bug fixes]
    L2_Fix --> L2_FuncTest
    
    %% Level 3 Flow (Multi-component)
    Orchestrator -->|Level 3<br/>Multi-component| L3_PM[PM Agent<br/>Task breakdown]
    L3_PM --> L3_Research[Research Agent<br/>System architecture]
    L3_Research --> L3_Impl[Implementation Agent<br/>Component development]
    L3_Impl --> L3_FuncTest[Functional Testing Agent<br/>Integration testing]
    L3_FuncTest --> L3_Quality{Quality Gate}
    L3_Quality -->|FAIL| L3_PM_Fix[PM Agent<br/>Coordinate fixes]
    L3_PM_Fix --> L3_Impl_Fix[Implementation Agent<br/>Component fixes]
    L3_Impl_Fix --> L3_FuncTest
    L3_Quality -->|PASS| L3_Integration{Integration Gate}
    L3_Integration -->|COMPATIBLE| L3_Done[✅ COMPLETE]
    L3_Integration -->|CONFLICTS| L3_Research_Fix[Research Agent<br/>Architecture review]
    L3_Research_Fix --> L3_Impl
    
    %% Level 4 Flow (Full Project)
    Orchestrator -->|Level 4<br/>Complete Project| L4_PM[PM Agent<br/>PRD parsing & phases]
    L4_PM --> L4_Research[Research Agent<br/>Technical architecture]
    L4_Research --> L4_Impl1[Implementation Agent<br/>Phase 1 development]
    L4_Impl1 --> L4_FuncTest1[Functional Testing Agent<br/>Phase 1 validation]
    L4_FuncTest1 --> L4_Readiness{Readiness Gate<br/>Phase transition}
    L4_Readiness -->|NOT-READY| L4_PM_Coord[PM Agent<br/>Phase coordination]
    L4_PM_Coord --> L4_Impl1
    L4_Readiness -->|READY| L4_Impl2[Implementation Agent<br/>Phase 2 development]
    L4_Impl2 --> L4_FuncTest2[Functional Testing Agent<br/>Final validation]
    L4_FuncTest2 --> L4_Quality{Quality Gate}
    L4_Quality -->|PASS| L4_Done[✅ COMPLETE<br/>Production Ready]
    L4_Quality -->|FAIL| L4_PM_Final[PM Agent<br/>Final coordination]
    L4_PM_Final --> L4_Impl2
    
    %% Styling
    classDef userNode fill:#e1f5fe
    classDef orchestratorNode fill:#fff3e0
    classDef agentNode fill:#e8f5e8
    classDef gateNode fill:#fce4ec
    classDef pmNode fill:#f3e5f5
    classDef doneNode fill:#e0f2f1
    classDef testNode fill:#fff9c4
    
    class User userNode
    class Orchestrator orchestratorNode
    class L2_Research,L2_Impl,L3_Research,L3_Impl,L3_Impl_Fix,L3_Research_Fix,L4_Research,L4_Impl1,L4_Impl2,L1_Impl,L2_Fix agentNode
    class L2_Quality,L3_Quality,L3_Integration,L4_Quality,L4_Readiness gateNode
    class L3_PM,L3_PM_Fix,L4_PM,L4_PM_Coord,L4_PM_Final pmNode
    class L1_Done,L2_Done,L3_Done,L4_Done doneNode
    class L2_FuncTest,L3_FuncTest,L4_FuncTest1,L4_FuncTest2 testNode
```

## How it works

**Multi-agent coordination**: Main Claude uses CLAUDE.md orchestration instructions to assess complexity (Level 1-4) and route tasks to specialized agents via the Task tool.

**Browser validation**: Functional testing agent uses Playwright MCP to test actual functionality in real browsers, catching bugs that static analysis misses.

**Quality gates**: Binary validation at each step (PASS/FAIL). Failed gates route back for fixes until validation passes.

**Error recovery**: Quality Gate FAIL → Implementation Agent fixes → Re-validation PASS

## Dependencies Required

### Core MCP Servers

**Task Master MCP** (Required for PM agent coordination):
```bash
claude mcp add task-master -s user -- npx -y --package=task-master-ai task-master-ai
```

**Context7 MCP** (Required for research agent library documentation):
```bash
claude mcp add context7 -s user -- npx -y context7-server
```

**Playwright MCP** (Required for functional testing agent browser automation):
```bash
claude mcp add playwright -s user -- npx -y playwright-mcp-server
```

### Agent Tool Distribution

- **PM Agent**: Full Task Master MCP access + file operations
- **Research Agent**: Context7 MCP, web search, limited Task Master read-only  
- **Implementation Agent**: File operations (Read, Write, Edit, MultiEdit, Bash, Glob, Grep) + Task Master read-only
- **Functional Testing Agent**: Playwright MCP, Bash, limited Task Master read-only
- **Quality/Gate Agents**: Read-only access for validation

## Quick Start

### 1. Install MCP Dependencies
```bash
# Task Master (project coordination)
claude mcp add task-master -s user -- npx -y --package=task-master-ai task-master-ai

# Context7 (library documentation)  
claude mcp add context7 -s user -- npx -y context7-server

# Playwright (browser testing)
claude mcp add playwright -s user -- npx -y playwright-mcp-server
```

### 2. Initialize Project  
```bash
# Create project directory
mkdir your-project && cd your-project

# Initialize TaskMaster
npx task-master-ai init

# Configure for Claude Code (free)
npx task-master-ai models --setMain claude-code/sonnet --setResearch claude-code/sonnet
```

### 3. Make Natural Language Request
Simply talk to Claude:
```
"Build a responsive todo app with dark mode, date functionality, and accessibility compliance"
```

**What happens automatically:**
1. Claude assesses complexity using CLAUDE.md instructions
2. Routes to PM agent for task breakdown using Task Master MCP
3. PM agent coordinates research phase via Task tool
4. Research agent analyzes architecture using Context7 MCP  
5. Implementation agent builds application with guidance
6. Functional testing agent validates in browser using Playwright MCP
7. Quality gates ensure production readiness

## Tested Capabilities

**Validated project types:**
- Frontend applications (React, Vue, Angular, Vanilla JS)
- API integrations with security best practices  
- Responsive design with accessibility compliance

**Quality standards delivered:**
- TypeScript with strict mode
- Zero JavaScript errors (browser-tested)
- WCAG accessibility compliance
- Professional code organization
- Comprehensive testing

**Real test case**: Todo system initially failed (broken dark mode, add functionality). Functional testing agent identified specific JavaScript date formatting bugs using Playwright automation. Implementation agent fixed issues. Final validation passed with working functionality.

**Zero cost**: Uses Claude Code integration, eliminating API expenses.


## Technical Notes

**Orchestration**: Main Claude uses CLAUDE.md instructions (not slash commands) to coordinate agents via Task tool.

**State management**: Task Master MCP maintains project state, task breakdown, and progress tracking.

**Agent communication**: Agents are stateless - main Claude maintains context and routes work.

**Browser testing**: Playwright MCP enables real browser validation, not just code review.

**Documentation**: Context7 MCP provides up-to-date library documentation during research phase.

## Contributing

Areas needing improvement:
1. Task Master MCP reliability fixes
2. Better error recovery mechanisms  
3. Backend/mobile project support
4. Scalability testing for larger projects
5. Clean up outdated .claude/commands/ files

## Results

Delivers production-ready applications from natural language requests. The breakthrough is functional browser validation - guaranteeing applications actually work, not just passing code review.

Built on [cursor-memory-bank](https://github.com/vanzan01/cursor-memory-bank) foundation (2,400+ stars).