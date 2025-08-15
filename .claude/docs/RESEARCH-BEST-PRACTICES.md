# Research Best Practices Guide

## Overview
This guide provides comprehensive instructions for when and how to use the dual research system (Context7 + TaskMaster research) effectively. Based on real-world validation and testing, these practices ensure optimal research quality while avoiding redundant API calls.

## Decision Matrix: When to Use Which Research Tools

### Use BOTH Context7 + TaskMaster Research
**Scenario**: Library/framework implementation or architectural decisions
**Triggers**:
- User mentions specific libraries (React, Vue, Vite, Next.js, etc.)
- Questions about "best practices" for known technologies
- Implementation guidance requests
- Technology comparison queries

**Example Queries**:
- "How should I configure Vite for optimal performance?"
- "What are the best React state management patterns?"
- "Compare Next.js vs Remix for my project"

**Workflow**:
1. Context7 first → Get official documentation and API references
2. TaskMaster second → Get industry best practices and trends
3. Synthesize → Combine into comprehensive recommendations

**Benefits**: Complete coverage combining authoritative sources with real-world insights

---

### Use Context7 ONLY
**Scenario**: Quick API reference or version-specific features
**Triggers**:
- Need specific API documentation
- Version compatibility questions
- Official configuration examples
- TypeScript definitions

**Example Queries**:
- "Show me the React useEffect hook API"
- "What are the available Vite configuration options?"
- "How do I use Next.js Image component?"

**Workflow**:
1. `mcp__context7__resolve-library-id` → Find library
2. `mcp__context7__get-library-docs` → Get official docs
3. Present → Direct API reference and examples

**Benefits**: Fast, authoritative answers for specific API questions

---

### Use TaskMaster Research ONLY
**Scenario**: Industry trends, non-library topics, or general best practices
**Triggers**:
- General architectural patterns
- Industry trend analysis
- Non-specific technology discussions
- Business/process optimization

**Example Queries**:
- "What are modern authentication patterns for web apps?"
- "How should I structure a microservices architecture?"
- "What are current CI/CD best practices?"

**Workflow**:
1. `mcp__task-master__research` → Get industry insights
2. Cache → Save to research directory
3. Present → Current trends and recommendations

**Benefits**: Current industry insights without library-specific constraints

---

### Use NEITHER (Direct Answer)
**Scenario**: Simple conceptual questions or well-established patterns
**Triggers**:
- Basic programming concepts
- Simple how-to questions
- Questions answerable from training data
- Mathematical or algorithmic topics

**Example Queries**:
- "What is the difference between let and const?"
- "How do I center a div with CSS?"
- "Explain the concept of closures in JavaScript"

**Workflow**: Direct answer using training knowledge

**Benefits**: Immediate response without API overhead

## Research Quality Standards

### ✅ High-Quality Research Characteristics

**Comprehensive Coverage**:
- Official documentation patterns (Context7)
- Current industry trends (TaskMaster)
- Synthesized recommendations combining both sources
- Clear source attribution

**Actionable Content**:
- Specific code examples
- Step-by-step implementation guides
- Configuration snippets
- Migration strategies

**Current & Relevant**:
- 2024-2025 best practices
- Version-specific information
- Performance considerations
- Security recommendations

### ❌ Avoid These Research Patterns

**Incomplete Coverage**:
- Using only one research tool when both are needed
- Skipping synthesis of findings
- Missing source attribution

**Outdated Information**:
- Relying solely on training data for rapidly evolving technologies
- Using stale cache (>7 days) without refresh
- Ignoring version-specific changes

**Poor Organization**:
- Mixing official docs with industry practices without clear separation
- Lack of clear recommendations
- Missing implementation examples

## Cache Management Best Practices

### Freshness Rules
- **Fresh Cache**: < 7 days → Use existing research, no new API calls
- **Stale Cache**: 7+ days → Refresh both Context7 and TaskMaster research
- **No Cache**: Missing file → Execute full dual research workflow

### Cache File Naming
```
.taskmaster/docs/research/
├── YYYY-MM-DD_library-name-topic.md           # Combined research
├── YYYY-MM-DD_react-state-management.md       # Example combined
├── YYYY-MM-DD_vite-configuration-guide.md     # Example combined
└── YYYY-MM-DD_authentication-patterns.md      # TaskMaster only
```

### Cache Validation
```javascript
// Check cache freshness
const isFileFresh = (filename) => {
  const fileDate = filename.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  const daysDiff = (Date.now() - new Date(fileDate)) / (1000 * 60 * 60 * 24);
  return daysDiff < 7;
};
```

## Workflow Examples

### Example 1: Full Dual Research (React State Management)

**User Query**: "What are the best React state management approaches for large applications?"

**Research Agent Workflow**:
```javascript
// 1. Check cache first
const cacheFiles = Grep("react.*state.*management", ".taskmaster/docs/research/");

// 2. If no fresh cache, execute dual research
// Context7: Get official React documentation
const reactDocs = mcp__context7__get-library-docs("/facebook/react", "state-management");

// TaskMaster: Get industry best practices
const industryResearch = mcp__task-master__research(
  "React state management best practices 2025, Zustand vs Redux",
  projectRoot,
  { saveToFile: true }
);

// 3. Synthesize and cache combined findings
const combinedResearch = synthesizeResearch(reactDocs, industryResearch);
```

**Output Quality**:
- Official React patterns (useState, useReducer, Context)
- Industry trends (Zustand popularity, Redux Toolkit evolution)
- Synthesized recommendations based on application size and complexity
- Clear implementation examples from both sources

### Example 2: Context7 Only (API Reference)

**User Query**: "Show me the Vite server configuration options"

**Research Agent Workflow**:
```javascript
// Direct Context7 call for API reference
const viteConfig = mcp__context7__get-library-docs("/vitejs/vite", "server-configuration");
```

**Output Quality**:
- Complete server configuration API
- Official examples and patterns
- Type definitions and defaults
- Version-specific features

### Example 3: TaskMaster Only (Industry Trends)

**User Query**: "What are modern deployment strategies for frontend applications?"

**Research Agent Workflow**:
```javascript
// TaskMaster research for general industry practices
const deploymentResearch = mcp__task-master__research(
  "Modern frontend deployment strategies 2025, JAMstack, edge computing, CI/CD",
  projectRoot,
  { saveToFile: true }
);
```

**Output Quality**:
- Current industry deployment patterns
- Tool recommendations and comparisons
- Performance and security considerations
- Cost optimization strategies

## Integration with Project Workflows

### For Implementation Agents
```javascript
// Check for research cache before implementation
const taskDetails = mcp__task-master__get_task(taskId);
if (taskDetails.description.includes(libraryKeywords)) {
  const researchCache = findFreshResearch(libraryKeywords);
  if (!researchCache) {
    // Block implementation, request research first
    throw new Error("Research required before implementation");
  }
}
```

### For Research Agent Handoffs
```javascript
// When other agents need research
if (requestContainsLibraries(userRequest)) {
  // Determine research strategy based on request type
  const strategy = determineResearchStrategy(userRequest);
  return executeResearchStrategy(strategy);
}
```

### For Task Master Integration
- Use research findings to inform task generation
- Include research cache references in task details
- Update tasks with research context for implementation agents

## Performance Optimization

### API Call Reduction
- Always check cache before making research calls
- Use library detection to determine research strategy
- Batch research requests when possible

### Context Management
- Include research cache files in agent context when relevant
- Reference specific research sections in task updates
- Share research findings across related tasks

### Cost Efficiency
- Prioritize fresh cache usage to minimize API costs
- Use Context7 for specific API references (faster, cheaper)
- Use TaskMaster for comprehensive analysis (when justified)

## Monitoring and Metrics

### Success Indicators
- Reduced redundant research calls
- Improved task implementation speed
- Higher quality agent outputs
- Consistent research patterns across agents

### Quality Metrics
- Research document completeness (both sources represented)
- Implementation success rate after research
- User satisfaction with research quality
- Cache hit rate vs. fresh research requests

## Troubleshooting Common Issues

### Problem: Stale or Missing Research
**Solution**: Implement cache validation in all research workflows
```javascript
// Check cache age before using
if (!isFileFresh(cacheFile) || !cacheFileExists(cacheFile)) {
  executeFullResearch();
}
```

### Problem: Incomplete Research Coverage
**Solution**: Use decision matrix to ensure appropriate research strategy
- Library-specific questions → Use both Context7 + TaskMaster
- API references → Use Context7 only
- Industry trends → Use TaskMaster only

### Problem: Poor Research Synthesis
**Solution**: Follow standardized research document format
- Clear section separation (Official Documentation vs Industry Best Practices)
- Synthesized recommendations section
- Proper source attribution
- Actionable implementation guidance

This guide ensures consistent, high-quality research practices across all agents in the collective system.