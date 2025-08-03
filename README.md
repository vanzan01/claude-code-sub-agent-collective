# Hub-and-Spoke Agent Coordination Research

## A Message from the Creator

> Hi everyone! Since the launch of [Cursor Memory Bank](https://github.com/vanzan01/cursor-memory-bank) (2,400+ stars), I haven't stopped innovating and exploring new possibilities. When Claude Code was released, I immediately moved to it and have been working on fresh ideas and solutions as you can see throughout my repositories. 
>
> **This isn't just another agent repository.** This is the culmination of months of research building on my cursor memory bank project, where I discovered that **agents don't hold context well, lose context often, and forget the things you say**. 
>
> To solve this, I've developed a **graph-based JIT loading system** that allows agents to build context on the fly, **confirm that agents have read the context**, and catch missing information that happens often but goes unnoticed. **Hooks handle deterministic things** ensuring that agents are more accurate.
>
> Now, with Claude Code's agent mode, I'm making another attempt at what I originally tried with Cursor Memory Bank—but with hooks and agents, I can get much closer to creating an autonomous development team. With TaskMaster being operated by my project manager agent, it forms a truly complete team capable of delivering ready-made complex prototypes.
>
> I hope you enjoy this journey with me. I will continue leading with my original thoughts and ideas—come be part of the adventure!

---

## Research: Solving Multi-Agent Coordination

### Core Problems Identified

After hundreds of hours of research following my Cursor Memory Bank project, I identified critical problems that plague ALL multi-agent systems:

**Agent Context Degradation**
- Agents don't hold context well across interactions
- They lose context frequently and miss critical instructions  
- Information gets forgotten or corrupted during handoffs

**Coordination Reliability Issues**
- Agent-to-agent communication creates context drift
- Peer coordination becomes unreliable and non-deterministic
- Missing information happens often but goes unnoticed

**Execution Determinism Problems**
- Agents skip quality steps when not properly enforced
- Inconsistent behavior across different execution runs
- No reliable way to validate agent comprehension

### Research Solutions

**📊 Graph-Based JIT Context Loading**
- **Problem**: Global context becomes overwhelming and agents lose focus
- **Solution**: Decision graphs provide context exactly when/where needed
- **Innovation**: JIT context loading prevents information overload while ensuring relevance

**🔗 Hub-and-Spoke Coordination Pattern**
- **Problem**: Agent-to-agent communication creates unreliable context drift
- **Solution**: Central delegator (routing-agent) maintains conversation context
- **Innovation**: No peer-to-peer agent communication - only hub communication

**✅ Deterministic Validation Systems**
- **Problem**: No reliable way to confirm agents processed instructions correctly
- **Solution**: HANDOFF_TOKEN system validates agent comprehension
- **Innovation**: Progressive retry with escalation ensures reliable coordination

**🛡️ Mandatory Quality Gate Architecture**
- **Problem**: Agents skip quality steps when not enforced
- **Solution**: 6-gate system with NO bypass allowed + retry tracking
- **Innovation**: Quality becomes structural requirement, not optional step

**🧩 Domain Isolation Research**
- **Problem**: Multi-capability agents get confused between responsibilities
- **Solution**: Ultra-narrow agent focus with strict boundary enforcement
- **Innovation**: Agent types that CANNOT do certain actions by design

**📚 Real-Time Knowledge Integration**
- **Problem**: Agents operate on stale training data
- **Solution**: Mandatory Context7 research at every development phase
- **Innovation**: Research compliance tracking throughout development lifecycle

---

## Usage

Research framework for reliable multi-agent coordination.

**Usage:** `@routing-agent your request`

**Core Innovation:** Solves fundamental agent coordination problems through hub-and-spoke pattern, HANDOFF_TOKEN validation, and mandatory quality gates.

## Quick Start

1. Copy `.claude/` directory to your project
2. Install MCP dependencies: task-master, context7, playwright
3. Use: `@routing-agent your request`

## Architecture

**Central Hub (routing-agent):** Graph-based semantic analysis, JIT context loading
**Quality Gates:** 6 mandatory gates with no bypass (Planning → Infrastructure → Implementation → Testing → Polish → Completion)
**Specialized Agents:** Ultra-narrow domain focus (component, feature, infrastructure, testing, polish)
**Validation:** HANDOFF_TOKEN system with progressive retry

### Hub-and-Spoke Coordination Architecture

```mermaid
graph TB
    subgraph "Research Framework"
        subgraph "Central Hub"
            RA[🎯 Routing Agent<br/>Semantic Analysis]
        end
        
        subgraph "Coordination"  
            EPM[🏗️ Project Manager<br/>6 Quality Gates]
        end
        
        subgraph "Research"
            PRD[📋 PRD Research<br/>Context7]
            RESEARCH[🔬 Research Agent<br/>Analysis]
        end
        
        subgraph "Implementation"
            COMP[🎨 Components<br/>UI & Styling]
            FEAT[💾 Features<br/>Business Logic]
            INFRA[🏗️ Infrastructure<br/>Build & Deploy]
            TEST[🧪 Testing<br/>Validation]
            POLISH[✨ Polish<br/>Performance]
        end
        
        subgraph "Quality Gates"
            EQG[🛡️ Quality Gate]
            CG[✅ Complete Gate]
            RG[🎯 Ready Gate]
        end
        
        subgraph "System"
            HOOKS[⚙️ Hooks<br/>Validation]
            TM[📊 TaskMaster<br/>State]
        end
    end
    
    %% Hub connections
    RA -.-> EPM
    RA -.-> PRD
    RA -.-> RESEARCH
    RA -.-> COMP
    RA -.-> FEAT
    RA -.-> INFRA
    RA -.-> TEST
    RA -.-> POLISH
    
    %% Return to hub
    EPM -.-> RA
    PRD -.-> RA
    RESEARCH -.-> RA
    COMP -.-> RA
    FEAT -.-> RA
    INFRA -.-> RA
    TEST -.-> RA
    POLISH -.-> RA
    
    %% Quality flow
    EPM --> EQG --> CG --> RG
    
    %% System coordination
    HOOKS -.-> RA
    TM -.-> EPM
    
    classDef hub fill:#ffd700,stroke:#ff8c00,stroke-width:4px,color:#1a1a1a
    classDef coordination fill:#e3f2fd,stroke:#1976d2,stroke-width:3px,color:#1a1a1a
    classDef research fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px,color:#1a1a1a
    classDef implementation fill:#e8f5e8,stroke:#2d5a27,stroke-width:3px,color:#1a1a1a
    classDef quality fill:#fce4ec,stroke:#a91e63,stroke-width:3px,color:#1a1a1a
    classDef system fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#1a1a1a
    
    class RA hub
    class EPM coordination
    class PRD,RESEARCH research
    class COMP,FEAT,INFRA,TEST,POLISH implementation
    class EQG,CG,RG quality
    class HOOKS,TM system
```

### Graph-Based Semantic Routing Flow

```mermaid
graph TB
    subgraph "Input System"
        USER[👤 User Request] --> RA[🎯 Routing Agent<br/>Semantic Analysis]
    end
    
    subgraph "State Analysis"
        RA --> STATE{📁 Project State}
        STATE --> EXISTING[🏠 Existing Project<br/>Enhancement Mode]
        STATE --> INCOMPLETE[🔧 Incomplete Project<br/>Completion Mode] 
        STATE --> NEW[✨ New Project<br/>Creation Mode]
    end
    
    subgraph "Existing Project Routing"
        EXISTING --> SEMANTIC[🧠 Semantic Analysis<br/>Request Classification]
        SEMANTIC --> COMP_E[🎨 Component Agent<br/>UI & Styling]
        SEMANTIC --> FEAT_E[💾 Feature Agent<br/>Business Logic]
        SEMANTIC --> INFRA_E[🏗️ Infrastructure Agent<br/>Build & Deploy]
        SEMANTIC --> TEST_E[🧪 Testing Agent<br/>Validation]
        SEMANTIC --> RESEARCH_E[🔬 Research Agent<br/>Analysis]
    end
    
    subgraph "Incomplete Project Routing"
        INCOMPLETE --> MISSING[🔍 Gap Analysis<br/>Missing Components]
        MISSING --> INFRA_M[🏗️ Infrastructure<br/>Foundation]
        MISSING --> FEAT_M[💾 Features<br/>Core Logic]
        MISSING --> COMP_M[🎨 Components<br/>UI Layer]
        MISSING --> TEST_M[🧪 Testing<br/>Quality Layer]
        MISSING --> POLISH_M[✨ Polish<br/>Final Touch]
    end
    
    subgraph "New Project Routing"
        NEW --> CLASSIFY[📝 Project Classification<br/>Type Analysis]
        CLASSIFY --> PRD_R[📋 PRD Research<br/>Requirements]
        CLASSIFY --> SIMPLE_R[🎯 Simple Route<br/>Direct Implementation]
        CLASSIFY --> WORKFLOW_R[🔄 Workflow Route<br/>Multi-Agent]
        CLASSIFY --> APP_R[🎨 App Route<br/>Component Focus]
    end
    
    subgraph "Complex Project Management"
        COMPLEX[👑 Project Manager<br/>Orchestration]
        SEMANTIC --> COMPLEX
        CLASSIFY --> COMPLEX
    end
    
    subgraph "Quality Gates"
        G1[📋 Planning] --> G2[🏗️ Infrastructure] 
        G2 --> G3[💻 Implementation] 
        G3 --> G4[🧪 Testing] 
        G4 --> G5[✨ Polish] 
        G5 --> G6[🎯 Complete]
    end
    
    subgraph "Validation System"
        HOOKS[⚙️ Hook Validation<br/>HANDOFF_TOKEN]
        RETURN[🔄 Return Hub<br/>Next Decision]
    end
    
    %% Complex routing to gates
    COMPLEX --> G1
    
    %% Return flows to hub
    COMP_E -.-> RETURN
    FEAT_E -.-> RETURN
    INFRA_E -.-> RETURN
    TEST_E -.-> RETURN
    RESEARCH_E -.-> RETURN
    
    INFRA_M -.-> RETURN
    FEAT_M -.-> RETURN
    COMP_M -.-> RETURN
    TEST_M -.-> RETURN
    POLISH_M -.-> RETURN
    
    PRD_R -.-> RETURN
    SIMPLE_R -.-> RETURN
    WORKFLOW_R -.-> RETURN
    APP_R -.-> RETURN
    
    G6 -.-> RETURN
    RETURN -.-> RA
    
    %% Validation flow
    RA -.-> HOOKS
    HOOKS -.-> RETURN
    
    %% Styling
    classDef input fill:#e1f5fe,stroke:#0277bd,stroke-width:3px,color:#1a1a1a
    classDef hub fill:#ffd700,stroke:#ff8c00,stroke-width:4px,color:#1a1a1a
    classDef analysis fill:#e3f2fd,stroke:#1976d2,stroke-width:3px,color:#1a1a1a
    classDef agent fill:#e8f5e8,stroke:#2d5a27,stroke-width:2px,color:#1a1a1a
    classDef manager fill:#f3e5f5,stroke:#7b1fa2,stroke-width:3px,color:#1a1a1a
    classDef gate fill:#fce4ec,stroke:#a91e63,stroke-width:2px,color:#1a1a1a
    classDef system fill:#fff3e0,stroke:#f57c00,stroke-width:2px,color:#1a1a1a
    
    class USER input
    class RA hub
    class STATE,EXISTING,INCOMPLETE,NEW,SEMANTIC,MISSING,CLASSIFY analysis
    class COMP_E,FEAT_E,INFRA_E,TEST_E,RESEARCH_E agent
    class INFRA_M,FEAT_M,COMP_M,TEST_M,POLISH_M agent
    class PRD_R,SIMPLE_R,WORKFLOW_R,APP_R agent
    class COMPLEX manager
    class G1,G2,G3,G4,G5,G6 gate
    class HOOKS,RETURN system
```

## Research Results

- **Improved** context retention through hub-and-spoke vs peer communication
- **Improved** instruction following with HANDOFF_TOKEN validation
- **Improved** quality compliance through mandatory gates vs optional checks
- **Improved** knowledge integration with Context7 vs stale training data

## Dependencies

```bash
claude mcp add task-master -s user -- npx -y --package=task-master-ai task-master-ai
claude mcp add context7 -s user -- npx -y context7-server
claude mcp add playwright -s user -- npx -y playwright-mcp-server
```

## Key Files

- `.claude/agents/routing-agent.md` - Central hub with graph-based routing
- `.claude/agents/enhanced-project-manager-agent.md` - 6-gate quality process
- `.claude/agents/van-maintenance-agent.md` - Agent ecosystem maintenance
- `.claude/hooks/routing-executor.sh` - HANDOFF_TOKEN validation

**Built on**: [cursor-memory-bank](https://github.com/vanzan01/cursor-memory-bank) (2,400+ stars) research into agent coordination problems.