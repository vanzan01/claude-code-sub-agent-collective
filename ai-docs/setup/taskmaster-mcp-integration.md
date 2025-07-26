# 🔧 TaskMaster MCP Integration Patterns

## 🎯 Agent-Specific TaskMaster Integration

This guide details how each specialized sub-agent leverages TaskMaster MCP tools for autonomous development coordination, showing the specific patterns and workflows each agent uses.

## 🧠 Integration Philosophy

### Context-Aware Tool Usage
Each agent has specialized access to TaskMaster MCP tools based on their role:
- **Project Management Tools**: For coordination and status tracking
- **Task Management Tools**: For workflow progression and handoffs
- **Research Tools**: For knowledge gathering and documentation
- **Quality Tools**: For validation and compliance checking

### Coordination Patterns
- **Tag-Based Context Switching**: Agents operate in isolated contexts using tags
- **Status-Driven Handoffs**: Task status changes trigger automatic agent activation
- **Dependency Management**: Complex task dependencies handled automatically
- **Progress Tracking**: Real-time updates throughout development lifecycle

---

## 🎭 Orchestrator Agent MCP Patterns

### Core MCP Tools Used
```yaml
Primary Tools:
  Project Setup: mcp__task-master__initialize_project
  Project Analysis: mcp__task-master__parse_prd, mcp__task-master__analyze_project_complexity
  Task Management: mcp__task-master__add_task, mcp__task-master__expand_all
  Coordination: mcp__task-master__add_tag, mcp__task-master__use_tag
  Status Tracking: mcp__task-master__get_tasks, mcp__task-master__set_task_status
```

### Project Initialization Pattern
```yaml
Workflow: "User provides natural language requirements"
Pattern:
  1. Project Setup:
     - mcp__task-master__initialize_project(projectRoot, rules: ["claude"])
     - Automatic Git initialization and rule application
  
  2. Requirements Analysis:
     - mcp__task-master__parse_prd(input: userRequirements, research: true)
     - AI determines optimal task count based on complexity
  
  3. Complexity Assessment:
     - mcp__task-master__analyze_project_complexity(threshold: 5, research: true)
     - Generates expansion recommendations for complex tasks
  
  4. Phase Coordination:
     - mcp__task-master__add_tag(name: "research-phase")
     - mcp__task-master__add_tag(name: "implementation-phase")
     - mcp__task-master__add_tag(name: "quality-phase")
     - mcp__task-master__add_tag(name: "devops-phase")
```

### Strategic Coordination Pattern
```yaml
Workflow: "Coordinate multi-agent development workflow"
Pattern:
  1. Dependency Planning:
     - mcp__task-master__add_dependency(id: taskId, dependsOn: prerequisiteId)
     - mcp__task-master__validate_dependencies() for circular reference checking
  
  2. Task Expansion:
     - mcp__task-master__expand_all(research: true, force: false)
     - Generates subtasks based on complexity analysis
  
  3. Progress Monitoring:
     - mcp__task-master__get_tasks(status: "pending,in-progress")
     - mcp__task-master__next_task() to identify ready tasks
  
  4. Agent Handoff Preparation:
     - mcp__task-master__update_task(id, prompt: "Research requirements identified")
     - mcp__task-master__use_tag(name: "research-phase") to trigger Research Agent
```

### Quality Gate Management Pattern
```yaml
Workflow: "Ensure quality standards throughout development"
Pattern:
  1. Quality Standards Definition:
     - mcp__task-master__add_task(prompt: "Define accessibility compliance requirements")
     - mcp__task-master__add_task(prompt: "Establish performance benchmarks")
     - mcp__task-master__add_task(prompt: "Set security validation criteria")
  
  2. Progress Validation:
     - mcp__task-master__get_tasks(withSubtasks: true) for comprehensive status
     - mcp__task-master__complexity_report() for expansion recommendations
  
  3. Milestone Coordination:
     - mcp__task-master__set_task_status(id: milestoneId, status: "review")
     - Triggers automatic Quality Agent activation
```

## 🔬 Research Agent MCP Patterns

### Core MCP Tools Used
```yaml
Primary Tools:
  Research: mcp__task-master__research
  Context Management: mcp__task-master__use_tag, mcp__task-master__get_task
  Knowledge Transfer: mcp__task-master__update_task, mcp__task-master__expand_task
  Documentation: mcp__task-master__generate
```

### Technical Analysis Pattern
```yaml
Workflow: "Conduct comprehensive technical research"
Pattern:
  1. Context Activation:
     - mcp__task-master__use_tag(name: "research-phase")
     - Isolates research context from other agent activities
  
  2. Research Execution:
     - mcp__task-master__research(
         query: "framework evaluation and architecture patterns",
         includeProjectTree: true,
         detailLevel: "high",
         saveToFile: true
       )
  
  3. Knowledge Synthesis:
     - mcp__task-master__update_task(
         id: researchTaskId,
         prompt: "Architecture decisions and implementation guidance",
         research: true
       )
  
  4. Implementation Preparation:
     - mcp__task-master__expand_task(
         id: implementationTaskId,
         research: true,
         prompt: "Detailed implementation tasks based on research findings"
       )
```

### Architecture Decision Recording Pattern
```yaml
Workflow: "Document architectural decisions with rationale"
Pattern:
  1. Decision Documentation:
     - mcp__task-master__update_task(
         id: architectureTaskId,
         prompt: "ADR: Framework Selection - React vs Vue vs Vanilla JS",
         append: true
       )
  
  2. Implementation Guidance Creation:
     - mcp__task-master__add_subtask(
         id: parentTaskId,
         title: "Component Architecture Implementation",
         description: "Based on research findings, implement modular component system"
       )
  
  3. Quality Requirements Definition:
     - mcp__task-master__add_task(
         prompt: "Define testing strategy based on framework selection",
         dependencies: architectureTaskId
       )
  
  4. Knowledge Transfer Preparation:
     - mcp__task-master__generate() // Creates comprehensive documentation
     - mcp__task-master__add_tag(name: "implementation-ready")
```

### Multi-Domain Research Pattern
```yaml
Workflow: "Research multiple technical domains simultaneously"
Pattern:
  1. Parallel Research Streams:
     - mcp__task-master__research(query: "frontend framework evaluation", saveToFile: true)
     - mcp__task-master__research(query: "API integration best practices", saveToFile: true)
     - mcp__task-master__research(query: "accessibility compliance patterns", saveToFile: true)
  
  2. Cross-Domain Analysis:
     - mcp__task-master__research(
         query: "integration patterns between selected technologies",
         customContext: "Previous research findings on frameworks and APIs"
       )
  
  3. Comprehensive Documentation:
     - mcp__task-master__update_task(
         id: researchSummaryId,
         prompt: "Complete technical architecture with integration patterns"
       )
```

## ⚡ Implementation Agent MCP Patterns

### Core MCP Tools Used
```yaml
Primary Tools:
  Context Management: mcp__task-master__use_tag, mcp__task-master__get_task
  Progress Tracking: mcp__task-master__set_task_status, mcp__task-master__update_subtask
  Quality Integration: mcp__task-master__add_subtask for testing tasks
  Documentation: mcp__task-master__generate
```

### Development Workflow Pattern
```yaml
Workflow: "Implement production-quality code with continuous progress tracking"
Pattern:
  1. Context Activation:
     - mcp__task-master__use_tag(name: "implementation-phase")
     - mcp__task-master__get_task(id: implementationTaskId) for requirements
  
  2. Task-by-Task Implementation:
     - mcp__task-master__set_task_status(id: currentTaskId, status: "in-progress")
     - [Implement feature based on research guidance]
     - mcp__task-master__update_subtask(
         id: "taskId.subtaskId",
         prompt: "Feature implementation complete with tests"
       )
     - mcp__task-master__set_task_status(id: currentTaskId, status: "review")
  
  3. Continuous Quality Integration:
     - mcp__task-master__add_subtask(
         id: featureTaskId,
         title: "Unit Tests for Feature X",
         status: "pending"
       )
     - mcp__task-master__add_subtask(
         id: featureTaskId,
         title: "Accessibility Validation for Feature X",
         status: "pending"
       )
```

### Feature Development Pattern
```yaml
Workflow: "Implement individual features with comprehensive validation"
Pattern:
  1. Feature Planning:
     - mcp__task-master__get_task(id: featureId, status: "pending")
     - Extract implementation guidance from research context
  
  2. Implementation Progression:
     - mcp__task-master__set_task_status(id: featureId, status: "in-progress")
     - [Create semantic HTML structure]
     - mcp__task-master__update_subtask(id: "featureId.1", prompt: "HTML structure complete")
     - [Implement styling with accessibility]
     - mcp__task-master__update_subtask(id: "featureId.2", prompt: "CSS with a11y complete")
     - [Add JavaScript functionality]
     - mcp__task-master__update_subtask(id: "featureId.3", prompt: "JS functionality complete")
  
  3. Integration Preparation:
     - mcp__task-master__set_task_status(id: featureId, status: "review")
     - Signals Quality Agent for validation
  
  4. Documentation Generation:
     - mcp__task-master__generate() // Creates feature documentation
```

### Testing Integration Pattern
```yaml
Workflow: "Integrate comprehensive testing throughout development"
Pattern:
  1. Test Suite Creation:
     - mcp__task-master__add_subtask(
         id: componentTaskId,
         title: "Unit Tests",
         description: "Jest tests for component logic and edge cases"
       )
     - mcp__task-master__add_subtask(
         id: componentTaskId,
         title: "Accessibility Tests",
         description: "Axe-core integration tests for WCAG compliance"
       )
  
  2. Test Implementation Tracking:
     - mcp__task-master__update_subtask(
         id: "componentId.testId",
         prompt: "Test coverage: 95% statements, 90% branches, all edge cases covered"
       )
  
  3. Quality Gate Preparation:
     - mcp__task-master__set_task_status(id: testTaskId, status: "done")
     - Contributes to overall feature quality assessment
```

## 🔍 Quality Agent MCP Patterns

### Core MCP Tools Used
```yaml
Primary Tools:
  Review Management: mcp__task-master__get_tasks, mcp__task-master__use_tag
  Validation Tracking: mcp__task-master__update_task, mcp__task-master__set_task_status
  Quality Documentation: mcp__task-master__add_task, mcp__task-master__generate
```

### Continuous Quality Review Pattern
```yaml
Workflow: "Monitor and validate quality throughout development"
Pattern:
  1. Review Item Detection:
     - mcp__task-master__use_tag(name: "quality-phase")
     - mcp__task-master__get_tasks(status: "review", withSubtasks: true)
  
  2. Multi-Dimensional Assessment:
     - [Perform code quality analysis]
     - mcp__task-master__update_task(
         id: reviewTaskId,
         prompt: "Code Quality: 95/100 - Maintainable, well-documented, properly tested"
       )
     - [Conduct accessibility validation]
     - mcp__task-master__update_task(
         id: reviewTaskId,
         prompt: "Accessibility: WCAG 2.1 AA Compliant - Screen reader compatible, keyboard navigable",
         append: true
       )
     - [Execute security audit]
     - mcp__task-master__update_task(
         id: reviewTaskId,
         prompt: "Security: No vulnerabilities - Input validation, XSS protection implemented",
         append: true
       )
  
  3. Quality Gate Decision:
     - mcp__task-master__set_task_status(id: reviewTaskId, status: "done") // If passed
     - OR mcp__task-master__set_task_status(id: reviewTaskId, status: "in-progress") // If issues found
```

### Comprehensive Validation Pattern
```yaml
Workflow: "Execute thorough quality validation across all dimensions"
Pattern:
  1. Validation Task Creation:
     - mcp__task-master__add_task(
         prompt: "Accessibility Compliance Validation - WCAG 2.1 AA",
         priority: "high"
       )
     - mcp__task-master__add_task(
         prompt: "Performance Optimization Validation - Core Web Vitals",
         priority: "high"
       )
     - mcp__task-master__add_task(
         prompt: "Security Vulnerability Assessment",
         priority: "high"
       )
  
  2. Quality Metrics Tracking:
     - mcp__task-master__update_task(
         id: validationTaskId,
         prompt: "Performance Results: FCP 1.2s, LCP 1.8s, FID 45ms, CLS 0.05 - All within targets"
       )
  
  3. Production Readiness Certification:
     - mcp__task-master__set_task_status(id: qualityTaskId, status: "done")
     - mcp__task-master__add_tag(name: "production-ready")
     - Signals DevOps Agent for deployment
```

### Quality Gate Management Pattern
```yaml
Workflow: "Manage progressive quality gates throughout development"
Pattern:
  1. Gate Status Monitoring:
     - mcp__task-master__get_tasks(status: "review") // Items awaiting quality review
     - mcp__task-master__complexity_report() // Identify high-complexity items needing extra attention
  
  2. Gate Progression:
     - [Code Quality Gate]
     - mcp__task-master__update_task(id: gateTaskId, prompt: "✅ Code Quality Gate PASSED")
     - [Security Gate]
     - mcp__task-master__update_task(id: gateTaskId, prompt: "✅ Security Gate PASSED", append: true)
     - [Accessibility Gate]
     - mcp__task-master__update_task(id: gateTaskId, prompt: "✅ Accessibility Gate PASSED", append: true)
  
  3. Final Certification:
     - mcp__task-master__generate() // Create comprehensive quality report
     - mcp__task-master__use_tag(name: "devops-ready") // Transfer to DevOps phase
```

## 🚀 DevOps Agent MCP Patterns

### Core MCP Tools Used
```yaml
Primary Tools:
  Deployment Management: mcp__task-master__get_tasks, mcp__task-master__use_tag
  Infrastructure Tracking: mcp__task-master__add_task, mcp__task-master__update_task
  Production Monitoring: mcp__task-master__set_task_status, mcp__task-master__generate
```

### Infrastructure Deployment Pattern
```yaml
Workflow: "Deploy quality-certified applications to production"
Pattern:
  1. Production-Ready Detection:
     - mcp__task-master__use_tag(name: "devops-phase")
     - mcp__task-master__get_tasks(status: "done") // Get quality-approved components
  
  2. Infrastructure Preparation:
     - mcp__task-master__add_task(
         prompt: "Set up production infrastructure with auto-scaling and monitoring",
         priority: "high"
       )
     - mcp__task-master__add_task(
         prompt: "Configure CI/CD pipeline with comprehensive testing integration",
         priority: "high"
       )
  
  3. Deployment Execution:
     - [Execute infrastructure deployment]
     - mcp__task-master__update_task(
         id: deploymentTaskId,
         prompt: "Infrastructure Status: ✅ Auto-scaling groups, load balancers, databases configured"
       )
     - [Configure monitoring and alerting]
     - mcp__task-master__update_task(
         id: deploymentTaskId,
         prompt: "Monitoring: ✅ Prometheus, Grafana, alerting configured",
         append: true
       )
```

### Production Monitoring Pattern
```yaml
Workflow: "Monitor and maintain production applications"
Pattern:
  1. Health Monitoring:
     - [Perform production health checks]
     - mcp__task-master__update_task(
         id: monitoringTaskId,
         prompt: "Production Health: Response time 245ms, Error rate 0.02%, Uptime 99.97%"
       )
  
  2. Performance Tracking:
     - mcp__task-master__update_task(
         id: performanceTaskId,
         prompt: "Performance Metrics: Core Web Vitals all 'Good', Auto-scaling active",
         append: true
       )
  
  3. Operational Documentation:
     - mcp__task-master__generate() // Create deployment and operational documentation
```

### CI/CD Pipeline Management Pattern
```yaml
Workflow: "Manage continuous integration and deployment"
Pattern:
  1. Pipeline Configuration:
     - mcp__task-master__add_task(
         prompt: "Configure blue-green deployment strategy with rollback capabilities"
       )
     - mcp__task-master__add_task(
         prompt: "Set up automated testing pipeline integration"
       )
  
  2. Deployment Validation:
     - [Execute deployment pipeline]
     - mcp__task-master__set_task_status(id: pipelineTaskId, status: "done")
     - mcp__task-master__update_task(
         id: pipelineTaskId,
         prompt: "CI/CD Pipeline: ✅ Multi-stage builds, automated testing, blue-green deployment active"
       )
  
  3. Production Certification:
     - mcp__task-master__set_task_status(id: deploymentTaskId, status: "done")
     - Project marked as successfully deployed
```

---

## 🔄 Cross-Agent Coordination Patterns

### Tag-Based Context Isolation
```yaml
Pattern: "Maintain clean agent contexts while enabling coordination"
Implementation:
  1. Phase-Specific Tags:
     - "research-phase" → Research Agent exclusive context
     - "implementation-phase" → Implementation Agent exclusive context
     - "quality-phase" → Quality Agent exclusive context
     - "devops-phase" → DevOps Agent exclusive context
  
  2. Status-Driven Handoffs:
     - Task status "pending" → Available for agent pickup
     - Task status "in-progress" → Agent actively working
     - Task status "review" → Ready for Quality Agent
     - Task status "done" → Ready for next phase/DevOps
  
  3. Context Switching:
     - mcp__task-master__use_tag(name: phaseTag) // Switch to phase context
     - Agent sees only relevant tasks and context
     - No cross-contamination between agent contexts
```

### Dependency-Driven Coordination
```yaml
Pattern: "Automatic agent activation based on task dependencies"
Implementation:
  1. Dependency Setup:
     - mcp__task-master__add_dependency(id: implementationTask, dependsOn: researchTask)
     - mcp__task-master__validate_dependencies() // Ensure no circular references
  
  2. Automatic Progression:
     - Research Agent: mcp__task-master__set_task_status(id: researchTask, status: "done")
     - Implementation Agent: mcp__task-master__next_task() // Automatically finds ready tasks
  
  3. Quality Gates:
     - Implementation Agent: mcp__task-master__set_task_status(id: featureTask, status: "review")
     - Quality Agent: mcp__task-master__get_tasks(status: "review") // Automatic activation
```

### Progress Synchronization Pattern
```yaml
Pattern: "Maintain project-wide visibility and coordination"
Implementation:
  1. Central Progress Tracking:
     - All agents use mcp__task-master__update_task() for progress updates
     - Orchestrator uses mcp__task-master__get_tasks(withSubtasks: true) for overview
  
  2. Milestone Coordination:
     - Key milestones tracked across all agents
     - mcp__task-master__complexity_report() for expansion needs
     - mcp__task-master__next_task() for optimal task sequencing
  
  3. Documentation Continuity:
     - mcp__task-master__generate() creates comprehensive documentation
     - Knowledge preserved across agent handoffs
     - Context available for future agent activations
```

---

## 🎯 Integration Best Practices

### Context Management
- **Clean Contexts**: Each agent maintains isolated, specialized context
- **Focused Tool Usage**: Agents use only tools relevant to their role
- **Knowledge Transfer**: Essential information passed via TaskMaster updates
- **Context Validation**: Regular verification of context isolation

### Progress Tracking
- **Real-Time Updates**: Continuous progress tracking throughout development
- **Status-Driven Workflows**: Task status changes trigger agent coordination
- **Dependency Management**: Complex dependencies handled automatically
- **Quality Gates**: Progressive validation ensures high standards

### Coordination Efficiency
- **Automatic Handoffs**: Seamless transfer between agents
- **Parallel Processing**: Multiple agents work simultaneously when possible
- **Intelligent Sequencing**: Optimal task ordering based on dependencies
- **Error Recovery**: Automatic detection and recovery from coordination failures

### Documentation Integration
- **Comprehensive Records**: All decisions and progress documented
- **Knowledge Continuity**: Information preserved across agent switches
- **Audit Trail**: Complete development history maintained
- **Production Documentation**: Deployment and operational guides generated

**This TaskMaster MCP integration system enables true autonomous development coordination, where intelligent agents work together seamlessly through sophisticated tool usage patterns and context management.** 🚀

*Next: Review [validation testing procedures](validation-testing.md) for system verification.*