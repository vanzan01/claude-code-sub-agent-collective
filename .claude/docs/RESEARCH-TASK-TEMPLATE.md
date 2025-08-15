# Research-Backed Task Template

## Overview
Template for TaskMaster tasks that include research references, enabling implementation agents to access Context7 research findings and apply current best practices.

## Task Template Format

### TaskMaster Task with Research References
```json
{
  "id": "3.2",
  "title": "Set up Vite + React + TypeScript build system", 
  "description": "Configure modern build system with hot reload and WSL2 compatibility",
  "research_context": {
    "required_research": ["vite", "react-18", "typescript"],
    "research_files": [
      ".taskmaster/docs/research/2025-08-09_vite-v5-react-typescript-config.md",
      ".taskmaster/docs/research/2025-08-09_react-18-vite-integration.md"
    ],
    "key_findings": [
      "Vite v5 requires @vitejs/plugin-react for React support",
      "WSL2 needs server.watch.usePolling: true for hot reload",
      "TypeScript strict mode recommended with moduleResolution: 'bundler'"
    ]
  },
  "implementation_guidance": {
    "tdd_approach": "Write build validation tests first, then configure build system",
    "test_criteria": [
      "npm run dev starts development server successfully",
      "Hot reload works in WSL2 environment", 
      "TypeScript compilation passes with strict mode",
      "Build output optimized for production"
    ]
  }
}
```

### Research File Reference Format
```markdown
📚 **Research References:**
- **Vite Config**: `.taskmaster/docs/research/2025-08-09_vite-v5-react-typescript-config.md`
- **React Integration**: `.taskmaster/docs/research/2025-08-09_react-18-vite-integration.md`

🎯 **Key Research Findings:**
- Vite v5 uses `@vitejs/plugin-react` (not react-refresh)
- WSL2 requires `server.watch.usePolling: true`
- TypeScript strict mode with `moduleResolution: 'bundler'`

🧪 **TDD Test Criteria:**
- [ ] Development server starts without errors
- [ ] Hot reload functional in WSL2
- [ ] TypeScript strict compilation passes
- [ ] Production build optimized and functional
```

## Agent Integration Patterns

### For PRD Research Agent
```javascript
// When generating tasks, include research context
const taskWithResearch = {
  ...baseTask,
  research_context: {
    required_research: extractedTechnologies,
    research_files: relevantCacheFiles,
    key_findings: criticalResearchPoints
  },
  implementation_guidance: {
    tdd_approach: "Write tests for X, then implement Y",
    test_criteria: specificTestRequirements
  }
};
```

### For Implementation Agents
```javascript
// Before implementing, check for research context
const task = mcp__task-master__get_task(taskId);

if (task.research_context?.research_files) {
  // Load research findings
  for (const researchFile of task.research_context.research_files) {
    const research = Read(researchFile);
    // Apply research to implementation approach
  }
}

// Follow TDD approach from task guidance
if (task.implementation_guidance?.tdd_approach) {
  // 1. Write tests first based on test_criteria
  // 2. Implement minimal code to pass tests
  // 3. Refactor with research-backed patterns
}
```

## TDD Integration with Research

### Research-Informed TDD Cycle
1. **RED Phase**: Write failing tests based on research best practices
2. **GREEN Phase**: Implement minimal code using research-backed patterns  
3. **REFACTOR Phase**: Apply research optimizations and clean code principles

### Test-First Implementation
```javascript
// Example: Vite configuration TDD approach
describe('Vite Build System', () => {
  test('development server starts successfully', () => {
    // Test based on research: Vite v5 + React plugin
    expect(devServer.start()).resolves.toBeTruthy();
  });
  
  test('WSL2 hot reload works', () => {
    // Test based on research: usePolling required
    expect(config.server.watch.usePolling).toBe(true);
  });
});

// Then implement Vite config to make tests pass
```

## Simple Reference Format for Agents

### Quick Research Check
```bash
# Check for cached research
research_files=$(grep -l "vite\|react" .taskmaster/docs/research/*.md 2>/dev/null || echo "")

if [ -n "$research_files" ]; then
  echo "📚 Using cached research: $research_files"
else
  echo "🔍 Research needed for current technologies"
fi
```

### Research-Backed Implementation Steps
1. **Check Task**: Get research context from TaskMaster task
2. **Load Research**: Read referenced research files  
3. **Plan Tests**: Create test criteria based on research findings
4. **TDD Cycle**: Red → Green → Refactor with research patterns
5. **Validate**: Ensure implementation meets research best practices

## Benefits

### Implementation Quality
- **Current Patterns**: Use latest library syntax and best practices
- **Informed Decisions**: Base implementation on comprehensive research
- **Test Coverage**: Research-informed test criteria ensure thorough validation

### Development Efficiency  
- **No Research Redundancy**: Agents reference shared research findings
- **Clear Guidance**: Tasks include specific implementation direction
- **TDD Focus**: Test-first approach with research-backed criteria

### Consistency
- **Shared Knowledge**: All agents use same research findings
- **Version Alignment**: Consistent library versions across implementations
- **Pattern Consistency**: Research-backed patterns applied uniformly