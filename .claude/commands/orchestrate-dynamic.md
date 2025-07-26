# Dynamic Agent Orchestration with Error Recovery

Dynamic multi-agent coordination testing with fault scenarios and back-referral capabilities.

You are now the **DYNAMIC ORCHESTRATOR** - Main Claude coordinating agents with error recovery and non-sequential communication patterns.

## Orchestration Scenario: "Login Form Security Flaw Discovery"

### Scenario Flow:
1. **Agent 1 (Research)**: Analyzes login form requirements (INTENTIONALLY MISSES SECURITY)
2. **Agent 2 (Implementation)**: Builds based on incomplete research
3. **Agent 3 (Quality)**: Reviews and DISCOVERS CRITICAL SECURITY FLAW
4. **DYNAMIC RECOVERY**: Agent 3 refers back to Agent 1 for security research
5. **Agent 1 (Redux)**: Updates research with security requirements
6. **Agent 2 (Redux)**: Rebuilds with proper security
7. **Agent 3 (Re-validation)**: Confirms security issues resolved
8. **Agent 4 (DevOps)**: Deploys secure version

## Dynamic Orchestration Protocol

### Phase 1: Initial Sequential Flow (With Intentional Gap)
```
Task(test-agent-1, "Research login form requirements - focus on basic functionality, DO NOT include security analysis")
→ Record results
Task(test-agent-2, "Build login form based on Agent 1 research: [RESULTS]")
→ Record results  
Task(test-agent-3, "Review login form for ALL quality issues including security: [AGENT2_RESULTS]")
→ EXPECT: Agent 3 finds security gap and refers back to Agent 1
```

### Phase 2: Dynamic Error Recovery
```
IF Agent 3 identifies security flaw:
→ Task(test-agent-1, "Agent 3 found security flaw: [FLAW_DESCRIPTION]. Update your research to include comprehensive security requirements")
→ Record updated research
Task(test-agent-2, "Rebuild login form with updated security research: [UPDATED_RESEARCH]") 
→ Record secure implementation
Task(test-agent-3, "Re-validate the secure implementation: [SECURE_CODE]")
→ EXPECT: Validation passes
```

### Phase 3: Completion Flow
```
Task(test-agent-4, "Deploy the validated secure login form: [FINAL_RESULTS]")
→ Complete dynamic orchestration test
```

## Error Recovery Patterns

**Back-Referral Protocol:**
- Agent 3 discovers issue → References specific agent that needs to address it
- Orchestrator calls referenced agent with specific error context
- Updated results flow forward through remaining agents
- Validation confirms issue resolution

**Communication Patterns:**
- **Sequential**: Agent 1 → Agent 2 → Agent 3 → Agent 4
- **Back-Referral**: Agent 3 → Agent 1 (security gap)
- **Re-Sequential**: Agent 1 (updated) → Agent 2 (rebuild) → Agent 3 (re-validate) → Agent 4 (deploy)

## Success Criteria

**Dynamic Coordination Validation:**
- ✅/❌ Agent 3 correctly identifies security flaw in Agent 2's work
- ✅/❌ Agent 3 properly refers back to Agent 1 for missing research
- ✅/❌ Agent 1 successfully updates research based on Agent 3's feedback
- ✅/❌ Agent 2 rebuilds correctly using updated security requirements
- ✅/❌ Agent 3 confirms security issues resolved in re-validation
- ✅/❌ Complete workflow recovers from error and achieves secure result

**Communication Pattern Success:**
- ✅/❌ Non-sequential agent communication works (Agent 3 → Agent 1)
- ✅/❌ Context preservation through error recovery cycles
- ✅/❌ Agents understand their role in dynamic coordination
- ✅/❌ Orchestrator manages complex workflow effectively

Your role: Execute this dynamic orchestration scenario, managing both sequential flow and error recovery with back-referrals between agents.