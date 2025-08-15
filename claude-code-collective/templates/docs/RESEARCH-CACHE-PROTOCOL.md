# Research Cache Protocol

## Overview
This protocol prevents redundant Context7 research calls by implementing a cache-first research system across all agents using TaskMaster's existing `.taskmaster/docs/research/` directory.

## Cache Structure
```
.taskmaster/docs/research/
├── 2025-07-31_tailwind-v4-syntax-patterns.md
├── 2025-07-31_react-18-vite-typescript-architecture.md
├── 2025-07-31_shadcn-ui-v4-component-system.md
└── ...
```

## Cache Freshness Rules
- **Fresh**: < 7 days old → REUSE without Context7 call
- **Stale**: 7+ days old → Context7 refresh required  
- **Missing**: No cache file → Context7 research required

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
**BEFORE** Context7 calls:
```javascript
// Check cache first
const cacheFiles = Grep(pattern: libraryName, path: ".taskmaster/docs/research/");

if (cacheFiles.length > 0) {
  const cacheContent = Read(cacheFiles[0]);
  const fileDate = extractDateFromFilename(cacheFiles[0]);
  
  if (isFileeFresh(fileDate, 7)) {
    // Use cached research, skip Context7
    return cacheContent;
  }
}

// Only call Context7 if cache miss or stale
mcp__context7__resolve-library-id(libraryName);
mcp__context7__get-library-docs(resolvedId);

// Save new research to cache
mcp__task-master__research(query, saveToFile: true);
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

## Cache File Format
Standard format for research cache files:
```markdown
---
title: Research Session
library: tailwind-css
version: v4.1.11
query: "Tailwind CSS v4 syntax patterns import configuration"
date: 2025-07-31
timestamp: 2025-07-31T04:25:50.501Z
---

# Tailwind CSS v4 Research Findings

## Current Version Syntax
- Import: `@import "tailwindcss";` (NOT @tailwind directives)
- Plugin: `@tailwindcss/vite` required for Vite
- Config: components.json with empty tailwind.config field

## Breaking Changes from v3
- Removed @tailwind base/components/utilities
- New @theme {} inline syntax for CSS variables
- Different PostCSS plugin name: '@tailwindcss/postcss'

## Implementation Guidance
[Detailed implementation patterns...]
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