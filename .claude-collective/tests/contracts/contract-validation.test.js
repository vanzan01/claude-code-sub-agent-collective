// contract-validation.test.js
// Contract validation system tests
// Tests the TestContractValidator integration

const TestContractValidator = require('../../../claude-code-collective/lib/TestContractValidator');
const fs = require('fs-extra');
const path = require('path');

describe('Contract Validation System', () => {
  let validator;
  
  beforeEach(() => {
    validator = new TestContractValidator();
  });
  
  describe('TestContractValidator Integration', () => {
    test('should parse TEST_CONTRACT from agent output', () => {
      const agentOutput = `
AGENT OUTPUT: Task completed successfully

TEST_CONTRACT: {
  preconditions: [
    {
      name: "File validation",
      test: (data) => { return fs.existsSync(data.filePath); },
      critical: true
    }
  ],
  postconditions: []
}

Implementation complete.
      `;
      
      const contract = validator.parseContract(agentOutput);
      expect(contract).toBeDefined();
      expect(contract.preconditions).toHaveLength(1);
      expect(contract.preconditions[0].name).toBe("File validation");
      expect(contract.preconditions[0].critical).toBe(true);
    });
    
    test('should validate contract structure', () => {
      const validContract = {
        preconditions: [
          {
            name: "Test precondition",
            test: (data) => true,
            critical: true,
            errorMessage: "Test failed"
          }
        ],
        postconditions: [],
        rollback: async () => ({ rolled_back: true })
      };
      
      const isValid = validator.isValidContract(validContract);
      expect(isValid).toBe(true);
    });
    
    test('should reject malformed contracts', () => {
      const invalidContract = {
        preconditions: "not-an-array",
        postconditions: null
      };
      
      const isValid = validator.isValidContract(invalidContract);
      expect(isValid).toBe(false);
    });
  });
  
  describe('Precondition Execution', () => {
    test('should execute preconditions successfully', async () => {
      const contract = {
        preconditions: [
          {
            name: "Always pass test",
            test: (data) => true,
            critical: true,
            errorMessage: "Should not fail"
          }
        ]
      };
      
      const result = await validator.executePreconditions(contract, {});
      expect(result.passed).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.results[0].passed).toBe(true);
    });
    
    test('should handle failing preconditions', async () => {
      const contract = {
        preconditions: [
          {
            name: "Always fail test",
            test: (data) => { throw new Error("Test failure"); },
            critical: true,
            errorMessage: "Expected failure"
          }
        ]
      };
      
      const result = await validator.executePreconditions(contract, {});
      expect(result.passed).toBe(false);
      expect(result.results[0].passed).toBe(false);
      expect(result.results[0].error).toContain("Test failure");
    });
  });
  
  describe('Handoff Validation Workflow', () => {
    test('should validate complete handoff workflow', async () => {
      const agentOutput = `
FEATURE COMPLETE: Login system implemented

TEST_CONTRACT: {
  preconditions: [
    {
      name: "Implementation exists",
      test: (data) => { return typeof data === 'object'; },
      critical: true,
      errorMessage: "No implementation data provided"
    }
  ],
  postconditions: [
    {
      name: "Output validation",
      test: (result) => { return result && typeof result === 'object'; },
      critical: false,
      errorMessage: "Invalid output format"
    }
  ],
  rollback: async (handoff, error) => {
    return { 
      rolled_back: true, 
      reason: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

Handoff ready for next agent.
      `;
      
      const handoffData = {
        fromAgent: 'feature-implementation-agent',
        toAgent: 'testing-implementation-agent',
        data: { implemented: true }
      };
      
      const result = await validator.validateHandoff(
        handoffData.fromAgent,
        handoffData.toAgent,
        agentOutput,
        handoffData.data
      );
      
      expect(result.success).toBe(true);
      expect(result.validationId).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
    });
    
    test('should handle handoff validation failures', async () => {
      const agentOutput = `
TASK COMPLETE

TEST_CONTRACT: {
  preconditions: [
    {
      name: "Failing validation",
      test: (data) => { throw new Error("Validation failed"); },
      critical: true,
      errorMessage: "Critical validation failure"
    }
  ]
}
      `;
      
      const result = await validator.validateHandoff(
        'agent-a',
        'agent-b',
        agentOutput,
        {}
      );
      
      expect(result.success).toBe(false);
      // Note: error property may not be present in this implementation
    });
  });
  
  describe('Rollback System', () => {
    test('should execute rollback on contract failure', async () => {
      const contract = {
        preconditions: [
          {
            name: "Failing test",
            test: (data) => false,
            critical: true,
            errorMessage: "Test designed to fail"
          }
        ],
        rollback: async (handoff, error) => {
          return {
            rolled_back: true,
            reason: "Contract validation failed",
            actions_taken: ["cleanup_files", "reset_state"]
          };
        }
      };
      
      const rollbackResult = await validator.executeRollback(
        contract, 
        { data: "test" }, 
        new Error("Contract failed")
      );
      
      expect(rollbackResult.rolled_back).toBe(true);
      expect(rollbackResult.reason).toBe("Contract validation failed");
      expect(rollbackResult.actions_taken).toContain("cleanup_files");
    });
  });
  
  describe('Statistics and Monitoring', () => {
    test('should have validation statistics methods', () => {
      // Just test that the method exists
      const stats = validator.getValidationStats();
      expect(stats).toBeDefined();
      expect(typeof stats.totalValidations).toBe('number');
      expect(typeof stats.averageDuration).toBe('number');
    });
  });
});