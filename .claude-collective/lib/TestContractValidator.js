/**
 * TestContractValidator.js
 * 
 * Core system for executing test contracts during agent handoffs.
 * Implements TRUE Test-Driven Development for agent coordination.
 * 
 * Based on Test-Contracts-Reference.md specification
 */

const fs = require('fs-extra');
const path = require('path');

class TestContractValidator {
  constructor(options = {}) {
    this.options = {
      timeout: 30000, // 30 second timeout for contract validation
      logFile: '/tmp/contract-validation.log',
      maxRetries: 3,
      ...options
    };
    
    this.validationHistory = [];
    this.contractCache = new Map();
  }

  /**
   * Parse test contract from agent output
   * Expects contract in format:
   * ```
   * TEST_CONTRACT: {
   *   preconditions: [...],
   *   postconditions: [...],
   *   rollback: function...
   * }
   * ```
   */
  parseContract(agentOutput) {
    try {
      // Look for TEST_CONTRACT block - find balanced braces
      const contractStart = agentOutput.indexOf('TEST_CONTRACT:');
      if (contractStart === -1) {
        return null;
      }

      // Find the opening brace after TEST_CONTRACT:
      const openBraceIndex = agentOutput.indexOf('{', contractStart);
      if (openBraceIndex === -1) {
        return null;
      }

      // Find matching closing brace
      let braceCount = 0;
      let currentIndex = openBraceIndex;
      
      while (currentIndex < agentOutput.length) {
        const char = agentOutput[currentIndex];
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
        
        if (braceCount === 0) {
          // Found matching closing brace
          const contractJson = agentOutput.substring(openBraceIndex, currentIndex + 1);
          const contract = this.safeEval(contractJson);
          
          // Validate contract structure
          if (!this.isValidContract(contract)) {
            throw new Error('Invalid contract structure');
          }

          return contract;
        }
        currentIndex++;
      }
      
      throw new Error('No matching closing brace found for TEST_CONTRACT');
    } catch (error) {
      this.log(`Contract parsing failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Validate that contract has required structure
   */
  isValidContract(contract) {
    if (!contract || typeof contract !== 'object') return false;
    
    // Must have either preconditions or postconditions
    return (Array.isArray(contract.preconditions) || 
            Array.isArray(contract.postconditions));
  }

  /**
   * Execute preconditions - validate previous agent's work
   */
  async executePreconditions(contract, handoffData) {
    if (!contract.preconditions) return { passed: true, results: [] };

    const results = [];
    let allPassed = true;

    for (const condition of contract.preconditions) {
      try {
        const result = await this.executeCondition(condition, handoffData);
        results.push(result);
        
        if (!result.passed && condition.critical) {
          allPassed = false;
          break; // Stop on critical failure
        }
      } catch (error) {
        const result = {
          name: condition.name || 'Unknown condition',
          passed: false,
          error: error.message,
          critical: condition.critical || false
        };
        results.push(result);
        
        if (condition.critical) {
          allPassed = false;
          break;
        }
      }
    }

    return { passed: allPassed, results };
  }

  /**
   * Execute postconditions - validate current agent's work
   */
  async executePostconditions(contract, result, handoffData) {
    if (!contract.postconditions) return { passed: true, results: [] };

    const results = [];
    let allPassed = true;

    for (const condition of contract.postconditions) {
      try {
        const conditionResult = await this.executeCondition(condition, result, handoffData);
        results.push(conditionResult);
        
        if (!conditionResult.passed && condition.critical) {
          allPassed = false;
          break;
        }
      } catch (error) {
        const conditionResult = {
          name: condition.name || 'Unknown condition',
          passed: false,
          error: error.message,
          critical: condition.critical || false
        };
        results.push(conditionResult);
        
        if (condition.critical) {
          allPassed = false;
          break;
        }
      }
    }

    return { passed: allPassed, results };
  }

  /**
   * Execute individual condition test
   */
  async executeCondition(condition, ...args) {
    const startTime = Date.now();
    
    try {
      // Execute the test function
      let testResult;
      if (typeof condition.test === 'function') {
        testResult = await Promise.resolve(condition.test(...args));
      } else if (typeof condition.test === 'string') {
        // String-based test (eval with safety)
        testResult = this.safeEval(condition.test, { data: args[0] });
      } else {
        throw new Error('Invalid test function');
      }

      const duration = Date.now() - startTime;
      
      return {
        name: condition.name || 'Unnamed condition',
        passed: Boolean(testResult),
        duration,
        critical: condition.critical || false,
        errorMessage: condition.errorMessage || 'Condition failed'
      };
      
    } catch (error) {
      return {
        name: condition.name || 'Unnamed condition',
        passed: false,
        duration: Date.now() - startTime,
        error: error.message,
        critical: condition.critical || false,
        errorMessage: condition.errorMessage || error.message
      };
    }
  }

  /**
   * Execute rollback if handoff fails
   */
  async executeRollback(contract, handoffData, error) {
    if (!contract.rollback) {
      // Default rollback - just log
      this.log(`No rollback defined for failed handoff: ${error.message}`);
      return { rolled_back: false, reason: 'No rollback function' };
    }

    try {
      const rollbackResult = await Promise.resolve(contract.rollback(handoffData, error));
      this.log(`Rollback executed: ${JSON.stringify(rollbackResult)}`);
      return rollbackResult;
    } catch (rollbackError) {
      this.log(`Rollback failed: ${rollbackError.message}`);
      return { rolled_back: false, error: rollbackError.message };
    }
  }

  /**
   * Complete handoff validation workflow
   */
  async validateHandoff(fromAgent, toAgent, agentOutput, handoffData) {
    const validationId = this.generateValidationId();
    const startTime = Date.now();
    
    this.log(`Starting handoff validation: ${fromAgent} → ${toAgent} (${validationId})`);

    try {
      // 1. Parse contract from agent output
      const contract = this.parseContract(agentOutput);
      if (!contract) {
        return {
          validationId,
          success: false,
          error: 'No valid contract found in agent output',
          duration: Date.now() - startTime
        };
      }

      // 2. Execute preconditions (validate previous agent's work)
      const preconditionResults = await this.executePreconditions(contract, handoffData);
      if (!preconditionResults.passed) {
        // Preconditions failed - trigger rollback
        const rollbackResult = await this.executeRollback(contract, handoffData, 
          new Error('Precondition validation failed'));
        
        return {
          validationId,
          success: false,
          phase: 'preconditions',
          preconditions: preconditionResults,
          rollback: rollbackResult,
          duration: Date.now() - startTime
        };
      }

      // 3. If we get here, handoff can proceed
      // Postconditions will be validated after the receiving agent completes work
      return {
        validationId,
        success: true,
        contract,
        preconditions: preconditionResults,
        duration: Date.now() - startTime
      };

    } catch (error) {
      this.log(`Handoff validation error: ${error.message}`);
      
      return {
        validationId,
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    } finally {
      // Record validation in history
      this.validationHistory.push({
        validationId,
        fromAgent,
        toAgent,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      });
    }
  }

  /**
   * Validate agent's completed work against postconditions
   */
  async validateCompletion(validationId, agentResult, contract) {
    this.log(`Validating completion for ${validationId}`);

    try {
      const postconditionResults = await this.executePostconditions(
        contract, 
        agentResult, 
        {} // handoff data context
      );

      if (!postconditionResults.passed) {
        // Postconditions failed - trigger rollback
        const rollbackResult = await this.executeRollback(contract, {}, 
          new Error('Postcondition validation failed'));
        
        return {
          validationId,
          success: false,
          phase: 'postconditions',
          postconditions: postconditionResults,
          rollback: rollbackResult
        };
      }

      return {
        validationId,
        success: true,
        postconditions: postconditionResults
      };

    } catch (error) {
      return {
        validationId,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Safe evaluation of contract code with limited scope
   */
  safeEval(code, context = {}) {
    // Create limited evaluation context
    const safeContext = {
      Date,
      JSON,
      console,
      require: (module) => {
        // Allow necessary modules for contract validation
        const allowedModules = ['fs', 'fs-extra', 'path'];
        
        // Allow local file requires (absolute paths for project files)
        if (module.startsWith('/mnt/h/Active/taskmaster-agent-claude-code/')) {
          return require(module);
        }
        
        if (allowedModules.includes(module)) {
          return require(module);
        }
        throw new Error(`Module ${module} not allowed`);
      },
      ...context
    };

    // Use Function constructor for safer eval
    const func = new Function(...Object.keys(safeContext), `return ${code}`);
    return func(...Object.values(safeContext));
  }

  /**
   * Generate unique validation ID
   */
  generateValidationId() {
    return `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log validation events
   */
  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] TestContractValidator: ${message}\n`;
    
    // Write to log file
    fs.appendFileSync(this.options.logFile, logEntry);
    
    // Also log to console if in debug mode
    if (process.env.DEBUG === 'true') {
      console.log(logEntry.trim());
    }
  }

  /**
   * Get validation statistics
   */
  getValidationStats() {
    const total = this.validationHistory.length;
    const avgDuration = total > 0 ? 
      this.validationHistory.reduce((sum, v) => sum + v.duration, 0) / total : 0;

    return {
      totalValidations: total,
      averageDuration: Math.round(avgDuration),
      recentValidations: this.validationHistory.slice(-10)
    };
  }
}

module.exports = TestContractValidator;