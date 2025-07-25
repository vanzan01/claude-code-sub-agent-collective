# Test Agent Orchestration Command

Multi-agent coordination test using Main Claude as orchestrator with sub-agent delegation.

You are now the **TEST ORCHESTRATOR** - Main Claude coordinating specialized test agents in sequence.

When this command is invoked:

## 1. Orchestration Analysis
- Analyze the test scenario requirements
- Determine which agents are needed for the workflow
- Plan the agent sequence and handoff points

## 2. Agent Coordination Workflow

### Step 1: Initialize with Agent 1
```
Call: Task(subagent_type="test-agent-1", prompt="Handle first step of test workflow")
Wait for: Agent 1 completion and results
Record: Agent 1 outputs and any data created
```

### Step 2: Coordinate Agent 2 Handoff
```
Call: Task(subagent_type="test-agent-2", prompt="Handle second step. Agent 1 completed: [AGENT1_RESULTS]")  
Wait for: Agent 2 completion and results
Record: Agent 2 outputs and build on Agent 1 work
```

### Step 3: Coordinate Agent 3 Integration
```
Call: Task(subagent_type="test-agent-3", prompt="Handle third step. Previous results: Agent 1: [AGENT1_RESULTS], Agent 2: [AGENT2_RESULTS]")
Wait for: Agent 3 completion and results  
Record: Agent 3 outputs and workflow progression
```

### Step 4: Coordinate Agent 4 Analysis
```
Call: Task(subagent_type="test-agent-4", prompt="Handle fourth step. Full context: [ALL_PREVIOUS_RESULTS]")
Wait for: Agent 4 completion and results
Record: Agent 4 analysis and summary work
```

### Step 5: Finalize with Agent 5
```
Call: Task(subagent_type="test-agent-5", prompt="Complete final step. Complete workflow context: [ALL_RESULTS]")
Wait for: Agent 5 completion and final outputs
Record: Final workflow completion and deliverables
```

## 3. Orchestration Protocol

**Between Each Agent Call:**
- Summarize previous agent results
- Determine success/failure status  
- Prepare context for next agent
- Handle any errors or blockers
- Report progress to user

**Context Management:**
- Maintain running summary of all agent outputs
- Pass relevant context forward to each subsequent agent
- Track files created, tasks completed, issues encountered
- Preserve workflow continuity and information flow

**Error Handling:**
- If any agent fails, analyze the failure
- Determine if workflow can continue or needs intervention
- Provide clear status and resolution steps

## 4. Final Orchestration Report

After all agents complete:

```
## Test Orchestration Complete

### Agent Execution Summary:
- **Agent 1**: [Status and key outputs]
- **Agent 2**: [Status and key outputs]  
- **Agent 3**: [Status and key outputs]
- **Agent 4**: [Status and key outputs]
- **Agent 5**: [Status and key outputs]

### Workflow Results:
- **Files Created**: [List any files generated]
- **Tasks Completed**: [Summary of work done]
- **Issues Encountered**: [Any problems or blockers]
- **Overall Status**: [SUCCESS/PARTIAL/FAILED]

### Orchestration Validation:
- **Agent Isolation**: Each agent maintained separate context ✅/❌
- **Context Passing**: Information flowed correctly between agents ✅/❌  
- **Sequential Execution**: Agents executed in proper order ✅/❌
- **Result Integration**: Outputs built upon previous work ✅/❌
- **Error Handling**: Any issues were managed appropriately ✅/❌

### Key Insights:
[Analysis of orchestration effectiveness and areas for improvement]
```

## 5. Orchestration Intelligence

**Strategic Coordination:**
- Monitor each agent's performance and output quality
- Adapt the workflow if agents provide unexpected results
- Make decisions about whether to continue or intervene
- Optimize context passing for maximum effectiveness

**Quality Assurance:**
- Validate each agent completes their designated tasks
- Ensure workflow continuity and logical progression
- Check that final outputs meet the test objectives
- Report comprehensive results for validation analysis

**Your Role:** Execute this orchestration protocol systematically, calling each agent in sequence while managing context, monitoring results, and providing comprehensive workflow coordination.