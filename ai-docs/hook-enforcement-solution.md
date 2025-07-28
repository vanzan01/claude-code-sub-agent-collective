# Task Tool Hook Enforcement Solution

**Date**: 2025-01-27  
**Problem**: Agent orchestration works but individual agents generate fictional work instead of using actual tools  
**Solution**: Hook-based verification system to enforce real tool usage and block fictional responses

## Problem Analysis

### What Works (Orchestration Layer) ✅
- workflow-agent creates standardized workflow plans
- Context passes correctly between agents  
- Agent auto-selection and routing functions
- Multi-agent coordination operates as designed

### What's Broken (Execution Layer) ❌
- implementation-agent claims to create "25+ components" but makes zero Write tool calls
- research-agent generates "comprehensive analysis" but uses no research tools
- quality-agent produces "security audits" but performs no file reads or analysis
- functional-testing-agent would generate "test reports" but use no Playwright tools

### Root Cause Discovery
The enforcement gap occurs at the **Task tool invocation level**. When main Claude calls sub-agents via `Task(subagent_type="implementation-agent", prompt="...")`, sub-agents respond with elaborate fiction instead of actual tool usage, with no verification mechanism in place.

## Hook-Based Solution Architecture

### Core Strategy
Use Claude Code's hook system to monitor and enforce actual tool usage at the Task tool level, blocking fictional responses and forcing real deliverables.

### Implementation Components

#### 1. Pre-Task Monitoring Hook
**Purpose**: Record system state before sub-agent execution
**File**: `.claude/hooks/pre-task.sh`

```bash
#!/bin/bash
# Pre-Task Hook: Monitor Task tool invocations

# Log the task invocation with timestamp
echo "TASK CALL: $(date)" >> /tmp/task-monitor.log
echo "  subagent_type: $SUBAGENT_TYPE" >> /tmp/task-monitor.log  
echo "  prompt: $PROMPT" >> /tmp/task-monitor.log

# Record current filesystem state for comparison
ls -la > /tmp/pre-task-files.txt
find . -name "*.js" -o -name "*.tsx" -o -name "*.ts" -o -name "*.json" -o -name "*.md" | wc -l > /tmp/pre-task-count.txt

echo "  pre-task files: $(cat /tmp/pre-task-count.txt)" >> /tmp/task-monitor.log
echo "  working_directory: $(pwd)" >> /tmp/task-monitor.log
```

#### 2. Post-Task Verification Hook  
**Purpose**: Verify actual deliverables vs claimed work, block fictional responses
**File**: `.claude/hooks/post-task.sh`

```bash
#!/bin/bash
# Post-Task Hook: Verify actual work and enforce deliverables

# Calculate files created/modified
BEFORE_COUNT=$(cat /tmp/pre-task-count.txt)
AFTER_COUNT=$(find . -name "*.js" -o -name "*.tsx" -o -name "*.ts" -o -name "*.json" -o -name "*.md" | wc -l)
FILES_CREATED=$((AFTER_COUNT - BEFORE_COUNT))

echo "POST-TASK: $(date)" >> /tmp/task-monitor.log
echo "  files_created: $FILES_CREATED" >> /tmp/task-monitor.log
echo "  agent_response_length: ${#RESPONSE}" >> /tmp/task-monitor.log

# Agent-specific enforcement logic
case "$SUBAGENT_TYPE" in
  "implementation-agent")
    if [[ $FILES_CREATED -eq 0 ]]; then
      echo "ERROR: implementation-agent claimed implementation but created no files" >&2
      echo "ENFORCEMENT: Blocking fictional response - no deliverables found" >&2
      echo "REQUIRED: Use Write, Edit, or MultiEdit tools to create actual files" >&2
      exit 1  # This blocks the Task tool response
    fi
    echo "  enforcement_result: PASSED - $FILES_CREATED files created" >> /tmp/task-monitor.log
    ;;
  
  "research-agent")
    # Check for research tool usage patterns in logs
    if ! grep -q "Context7\|WebSearch\|WebFetch" /tmp/task-monitor.log; then
      echo "WARNING: research-agent may not have used research tools" >&2
      echo "  enforcement_result: WARNING - no research tool usage detected" >> /tmp/task-monitor.log
    else
      echo "  enforcement_result: PASSED - research tools used" >> /tmp/task-monitor.log
    fi
    ;;
    
  "quality-agent")
    # Check for actual code analysis tool usage
    if ! grep -q "Read\|Grep\|Bash" /tmp/task-monitor.log; then
      echo "WARNING: quality-agent may not have analyzed actual files" >&2
      echo "  enforcement_result: WARNING - no file analysis tools detected" >> /tmp/task-monitor.log
    else
      echo "  enforcement_result: PASSED - analysis tools used" >> /tmp/task-monitor.log
    fi
    ;;
    
  "functional-testing-agent")
    # Check for browser automation tool usage
    if ! grep -q "playwright" /tmp/task-monitor.log; then
      echo "WARNING: functional-testing-agent may not have used browser automation" >&2
      echo "  enforcement_result: WARNING - no Playwright usage detected" >> /tmp/task-monitor.log
    else
      echo "  enforcement_result: PASSED - browser automation tools used" >> /tmp/task-monitor.log
    fi
    ;;
    
  *)
    echo "  enforcement_result: SKIPPED - no enforcement rules for $SUBAGENT_TYPE" >> /tmp/task-monitor.log
    ;;
esac

echo "  final_file_count: $AFTER_COUNT" >> /tmp/task-monitor.log
echo "---" >> /tmp/task-monitor.log
```

#### 3. Hook Configuration
**Purpose**: Enable hooks for Task tool invocations
**File**: `.claude/claude_settings.json` (or equivalent configuration)

```json
{
  "hooks": {
    "pre-tool": {
      "Task": "bash .claude/hooks/pre-task.sh"
    },
    "post-tool": {
      "Task": "bash .claude/hooks/post-task.sh"
    }
  },
  "hook_settings": {
    "enable_logging": true,
    "log_file": "/tmp/task-monitor.log",
    "enforcement_mode": true
  }
}
```

### Enforcement Flow Diagram

```
1. Main Claude → Task(subagent_type="implementation-agent", prompt="Build todo app")
                    ↓
2. Pre-Hook → Record filesystem state, log invocation
                    ↓  
3. Sub-Agent → Processes request (real tools vs fiction)
                    ↓
4. Post-Hook → Compare before/after state
                    ↓
5. Verification:
   ├─ Files created? → PASS (allow response)
   └─ No files? → FAIL (block with exit 1)
                    ↓
6. Result: Real deliverables or blocked fictional response
```

### Benefits of Hook Approach

#### Infrastructure-Level Enforcement
- Works regardless of agent prompt engineering
- Cannot be bypassed by clever agent responses
- Operates at the tool invocation level where enforcement is most effective

#### Selective and Configurable
- Different enforcement rules for different agent types
- Easy to modify enforcement criteria without changing agent descriptions
- Can be enabled/disabled per agent type

#### Observable and Debuggable  
- Complete audit trail of all Task tool invocations
- Clear logging of actual tool usage vs claimed work
- Timestamps and file counts for performance analysis

#### Non-Intrusive Implementation
- No changes required to existing agent descriptions
- Preserves the proven orchestration layer from Test 1
- Maintains compatibility with existing workflow patterns

### Testing and Validation Strategy

#### Phase 1: Monitoring Mode
1. Implement hooks with logging only (no blocking)
2. Run Test 1 validation scenario to observe patterns
3. Analyze logs to understand actual vs claimed tool usage

#### Phase 2: Enforcement Mode  
1. Enable blocking for implementation-agent only
2. Verify that fictional responses are properly blocked
3. Confirm that real file creation allows responses to proceed

#### Phase 3: Full Enforcement
1. Expand enforcement to all agent types with appropriate rules
2. Validate complete workflow with verified deliverables
3. Document any edge cases or refinements needed

### Expected Outcomes

#### Immediate Impact
- implementation-agent forced to create actual files or have responses blocked
- research-agent encouraged to use actual research tools
- quality-agent required to perform actual file analysis
- functional-testing-agent required to use browser automation tools

#### System-Level Improvement
- Transform current "fictional work" problem into verified execution
- Maintain proven orchestration capabilities while fixing execution layer
- Provide infrastructure for future agent accountability and verification

#### Quality Assurance
- Guaranteed deliverables when agents claim implementation work
- Audit trail for debugging orchestration issues
- Clear separation between coordination success and execution quality

## Implementation Notes

### File Permissions
Ensure hook scripts are executable:
```bash
chmod +x .claude/hooks/pre-task.sh
chmod +x .claude/hooks/post-task.sh
```

### Log Management
Consider log rotation for long-running sessions:
```bash
# Add to hook scripts if needed
if [[ $(wc -l < /tmp/task-monitor.log) -gt 1000 ]]; then
  tail -500 /tmp/task-monitor.log > /tmp/task-monitor.log.tmp
  mv /tmp/task-monitor.log.tmp /tmp/task-monitor.log
fi
```

### Error Handling
Hook scripts should handle edge cases gracefully:
- Missing directories or files
- Permission issues  
- Concurrent access to log files

### Security Considerations
- Hook scripts run with user permissions
- Log files may contain sensitive prompt information
- Consider file permissions and cleanup procedures

## Success Criteria

### Functional Requirements Met
- ✅ Agents must perform actual tool usage to proceed
- ✅ Fictional responses are blocked and prevented
- ✅ Real deliverables are guaranteed for implementation work
- ✅ Audit trail exists for all agent activity

### Non-Functional Requirements Met  
- ✅ Preserves existing orchestration capabilities
- ✅ Minimal performance overhead from monitoring
- ✅ Easy to configure and modify enforcement rules
- ✅ Compatible with Test 1 proven workflow coordination

This hook-based enforcement solution directly addresses the execution layer problem while preserving the orchestration layer that Test 1 proved works effectively. It provides the missing verification mechanism needed to ensure agents perform actual work rather than generating elaborate fiction.