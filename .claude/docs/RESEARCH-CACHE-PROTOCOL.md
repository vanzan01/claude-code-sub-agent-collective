# Dual Research System Protocol

## Overview
This protocol optimizes research quality by combining **Context7** (official documentation) with **TaskMaster Research** (Claude's web research capabilities) while implementing intelligent caching to prevent redundant calls. All research is cached in TaskMaster's `.taskmaster/docs/research/` directory.

## Dual Research Strategy

### Research Tool Responsibilities
| Tool | Purpose | Strengths | When to Use |
|------|---------|-----------|-------------|
| **Context7** | Official library documentation | • Authoritative API docs<br>• Current version info<br>• Official examples<br>• Configuration patterns | • Getting API references<br>• Understanding official patterns<br>• Version-specific features |
| **TaskMaster Research** | Industry best practices via Claude web | • Current trends<br>• Real-world patterns<br>• Community insights<br>• Comparative analysis | • Best practice research<br>• Implementation strategies<br>• Technology comparisons<br>• Architectural decisions |

### Combined Research Workflow
1. **Context7 First**: Get official documentation and API references
2. **TaskMaster Research**: Gather industry best practices and real-world insights  
3. **Synthesis**: Combine both sources into comprehensive research documents
4. **Cache**: Store combined findings for reuse

## Cache Structure
```
.taskmaster/docs/research/
├── 2025-01-13_react-state-management-patterns.md     # Combined Context7 + TaskMaster
├── 2025-01-13_tailwind-v4-implementation-guide.md   # Combined research
├── 2025-01-13_vite-react-typescript-setup.md        # Dual source research
└── ...
```

## Cache Freshness Rules
- **Fresh**: < 7 days old → REUSE without new research calls
- **Stale**: 7+ days old → Refresh both Context7 and TaskMaster research  
- **Missing**: No cache file → Execute full dual research workflow

## Agent Responsibilities

### 1. Workflow Agent
**BEFORE** creating workflow JSON:
```javascript
// Check for library keywords in request
const libraries = detectLibraries(userRequest);

// For each library, check cache status
for (library of libraries) {
  Grep(pattern: library, path: ".taskmaster/docs/research/", output_mode: "files_with_matches");
  // Determine cache_status: "cached_fresh" | "cached_stale" | "needs_research"
}

// Add cache status to workflow JSON
{
  "research_requirements": {
    "cache_status": {
      "tailwind": "cached_fresh",
      "react": "needs_research" 
    },
    "cache_files": [".taskmaster/docs/research/2025-07-31_tailwind-v4.md"]
  }
}
```

### 2. Research Agent  
**Dual Research Execution**:
```javascript
// Check cache first
const cacheFiles = Grep(pattern: libraryName, path: ".taskmaster/docs/research/");

if (cacheFiles.length > 0) {
  const cacheContent = Read(cacheFiles[0]);
  const fileDate = extractDateFromFilename(cacheFiles[0]);
  
  if (isFileFresh(fileDate, 7)) {
    // Use cached research, skip both research calls
    return cacheContent;
  }
}

// Execute dual research for fresh/missing cache
// Step 1: Context7 for official documentation
const context7Id = mcp__context7__resolve-library-id(libraryName);
const officialDocs = mcp__context7__get-library-docs(context7Id, topic="implementation");

// Step 2: TaskMaster for best practices and trends  
const industryResearch = mcp__task-master__research(
  query: `${libraryName} best practices, implementation patterns, and current industry trends`,
  projectRoot: projectPath,
  saveToFile: true
);

// Step 3: Create combined research document
const combinedResearch = synthesizeResearch(officialDocs, industryResearch);
```

### 3. Implementation Agent
**BEFORE** coding:
```javascript
// Get task with research requirements
const task = mcp__task-master__get_task(id);

// Check for cache file references
if (task.research_requirements?.cache_files) {
  const researchFindings = Read(task.research_requirements.cache_files[0]);
  // Apply cached research to implementation
} else {
  // Block implementation - request research first
  throw new Error("No research findings available for library-related task");
}
```

## Dual Research Document Format
Standard format for combined research cache files:
```markdown
---
title: React State Management Research
library: react
query: "React state management patterns for large applications"
date: 2025-01-13
timestamp: 2025-01-13T15:42:30.123Z
sources: ["context7", "taskmaster-web"]
research_tools: ["mcp__context7__get-library-docs", "mcp__task-master__research"]
---

# React State Management Research

## Official Documentation (Context7)
> Source: React official documentation and API references

### Current API Patterns
- useState for local component state
- useReducer for complex state logic
- useContext for prop drilling solutions
- Built-in state management patterns

### Official Recommendations
- Start with useState and useReducer
- Context for deeply nested props only
- External libraries for complex global state

## Industry Best Practices (TaskMaster/Claude Web)
> Source: Current industry trends and community insights

### Current Community Trends (2025)
- Zustand gaining popularity for simplicity
- Redux Toolkit still dominant for enterprise
- React Query/TanStack Query for server state
- Jotai for atomic state management

### Real-World Implementation Patterns
- State co-location principle
- Separate server state from client state
- Custom hooks for state logic encapsulation
- Performance optimization strategies

## Synthesized Recommendations

### For Large Applications
1. **State Architecture**: Separate server state (React Query) from client state
2. **Local State**: useState/useReducer for component-level state
3. **Global State**: Redux Toolkit for complex business logic, Zustand for simple global state
4. **Performance**: Use React.memo, useMemo, useCallback strategically

### Implementation Strategy
```typescript
// Recommended state architecture
// 1. Server state with React Query
const { data, isLoading } = useQuery(['users'], fetchUsers);

// 2. Global client state with Zustand
const useAppStore = create((set) => ({
  theme: 'light',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' }))
}));

// 3. Local component state with useState
const [localData, setLocalData] = useState(null);
```

### Migration Path
- Phase 1: Implement React Query for server state
- Phase 2: Consolidate client state with chosen solution
- Phase 3: Optimize performance with React optimization hooks

## Context7 Source Details
- Library ID: /facebook/react
- Documentation Version: 18.2.0
- API Coverage: Hooks, Context, Performance

## TaskMaster Research Context
- Project Type: Large-scale application
- Query Focus: State management patterns
- Research Scope: Architecture and best practices
```

## Cache Validation Rules

### Freshness Check
```javascript
const isFileFresh = (filename, maxDays = 7) => {
  const fileDate = filename.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  if (!fileDate) return false;
  
  const daysDiff = (Date.now() - new Date(fileDate)) / (1000 * 60 * 60 * 24);
  return daysDiff < maxDays;
};
```

### Library Detection
```javascript
const libraryKeywords = [
  'tailwind', 'bootstrap', 'chakra', 'material-ui',
  'react', 'vue', 'angular', 'svelte', 'next', 'vite',
  'shadcn', 'headless-ui', 'mantine',
  'jest', 'vitest', 'cypress', 'playwright'
];

const detectLibraries = (text) => {
  return libraryKeywords.filter(lib => 
    text.toLowerCase().includes(lib.toLowerCase())
  );
};
```

## Error Recovery

### Cache Miss Scenario
```javascript
// If implementation agent finds no research cache
mcp__task-master__update_task(id, 
  prompt: "BLOCKED: No research cache found for library task. Requesting research agent.");
mcp__task-master__set_task_status(id, "blocked");
// Return control to workflow agent to add research step
```

### Stale Cache Scenario  
```javascript
// If cache is stale (>7 days), refresh required
mcp__task-master__update_task(id,
  prompt: "Research cache stale. Refreshing Context7 documentation for " + libraryName);
// Proceed with Context7 research and cache update
```

## Benefits

### Performance
- **Eliminates redundant Context7 calls** - save API requests and time
- **Faster agent coordination** - cached research immediately available
- **Reduced context switching** - agents reference same research files

### Consistency  
- **Single source of truth** - all agents use same research findings
- **Version accuracy** - prevents mixing library versions across agents
- **Traceability** - clear research provenance in task updates

### Cost Efficiency
- **Reduced API usage** - Context7 calls only when necessary
- **Shared research** - one Context7 call serves multiple agents/tasks
- **Intelligent caching** - fresh research reused, stale research refreshed

## Implementation Timeline
- **Phase 1**: ✅ Cache-first protocols added to all agents
- **Phase 2**: ✅ Research sharing via TaskMaster integration  
- **Phase 3**: ✅ Validation and reuse mechanisms documented
- **Phase 4**: 🔄 Testing and refinement of cache system