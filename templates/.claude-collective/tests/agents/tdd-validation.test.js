// tdd-validation.test.js
// Test-Driven Development validation agent integration tests

const fs = require('fs-extra');
const path = require('path');

describe('TDD Validation Agent', () => {
  
  describe('Agent Integration', () => {
    test('should have tdd-validation-agent specification file', () => {
      const agentPath = path.join(__dirname, '../../../.claude/agents/tdd-validation-agent.md');
      expect(fs.existsSync(agentPath)).toBe(true);
    });

    test('should validate TDD methodology compliance', () => {
      const tddValidation = {
        phases: {
          red: { tests: 'failing', implemented: false },
          green: { tests: 'passing', implemented: true },  
          refactor: { tests: 'passing', optimized: true }
        }
      };
      
      const result = validateTDDCompliance(tddValidation);
      expect(result.valid).toBe(true);
      expect(result.phasesComplete).toBe(3);
    });

    test('should reject incomplete TDD cycles', () => {
      const incompleteTDD = {
        phases: {
          red: { tests: 'failing', implemented: false },
          green: { tests: 'failing', implemented: true } // Missing refactor
        }
      };
      
      const result = validateTDDCompliance(incompleteTDD);
      expect(result.valid).toBe(false);
      expect(result.missingPhases).toContain('refactor');
    });
  });

  describe('Quality Gate Validation', () => {
    test('should enforce test coverage requirements', () => {
      const testResults = {
        coverage: 95,
        passingTests: 45,
        totalTests: 47,
        failingTests: 2
      };
      
      const result = validateQualityGate(testResults);
      expect(result.coveragePassed).toBe(true);
      expect(result.testsPassed).toBe(false); // Has failing tests
    });

    test('should validate build success requirements', () => {
      const buildResults = {
        buildSuccess: true,
        typecheckPass: true,
        lintingPass: false, // Some linting issues
        testsPassing: true
      };
      
      const result = validateBuildGate(buildResults);
      expect(result.canProgress).toBe(true); // Linting is non-blocking
      expect(result.warnings).toContain('linting');
    });
  });

  describe('Agent Handoff Integration', () => {
    test('should validate handoff with TDD evidence', () => {
      const handoffWithTDD = {
        from: 'component-implementation-agent',
        to: 'tdd-validation-agent',
        evidence: {
          redPhase: { testsWritten: true, testsPath: 'src/test/' },
          greenPhase: { testsPass: true, implementationComplete: true },
          refactorPhase: { optimized: true, qualityImproved: true }
        }
      };
      
      const result = validateTDDHandoff(handoffWithTDD);
      expect(result.tddCompliant).toBe(true);
      expect(result.evidenceComplete).toBe(true);
    });

    test('should block handoff without proper TDD evidence', () => {
      const handoffWithoutTDD = {
        from: 'component-implementation-agent', 
        to: 'task-orchestrator',
        evidence: {
          redPhase: { testsWritten: false }, // Missing tests
          greenPhase: { testsPass: false }   // Tests not passing
        }
      };
      
      const result = validateTDDHandoff(handoffWithoutTDD);
      expect(result.tddCompliant).toBe(false);
      expect(result.blockingIssues).toContain('missing_tests');
    });
  });

  describe('Task Validation Workflow', () => {
    test('should validate task completion with proper TDD cycle', () => {
      const taskValidation = {
        taskId: 'task-1',
        implementation: 'complete',
        tddCycle: {
          red: { timestamp: '2025-08-12T10:00:00Z', status: 'complete' },
          green: { timestamp: '2025-08-12T10:30:00Z', status: 'complete' },
          refactor: { timestamp: '2025-08-12T11:00:00Z', status: 'complete' }
        },
        testResults: { passed: 25, failed: 0, coverage: 98 }
      };
      
      const result = validateTaskCompletion(taskValidation);
      expect(result.ready).toBe(true);
      expect(result.tddCompliance).toBe(100);
    });

    test('should handle task validation failures with remediation', () => {
      const failedTaskValidation = {
        taskId: 'task-2', 
        implementation: 'partial',
        tddCycle: {
          red: { timestamp: '2025-08-12T10:00:00Z', status: 'complete' },
          green: { timestamp: '2025-08-12T10:30:00Z', status: 'failed' }
        },
        testResults: { passed: 15, failed: 10, coverage: 65 }
      };
      
      const result = validateTaskCompletion(failedTaskValidation);
      expect(result.ready).toBe(false);
      expect(result.remediationRequired).toBe(true);
      expect(result.issues).toContain('test_failures');
      expect(result.issues).toContain('low_coverage');
    });
  });
});

// Mock validation functions for testing
function validateTDDCompliance(tddData) {
  const requiredPhases = ['red', 'green', 'refactor'];
  const presentPhases = Object.keys(tddData.phases);
  const missingPhases = requiredPhases.filter(phase => !presentPhases.includes(phase));
  
  return {
    valid: missingPhases.length === 0,
    phasesComplete: presentPhases.length,
    missingPhases
  };
}

function validateQualityGate(testResults) {
  return {
    coveragePassed: testResults.coverage >= 90,
    testsPassed: testResults.failingTests === 0
  };
}

function validateBuildGate(buildResults) {
  const canProgress = buildResults.buildSuccess && buildResults.typecheckPass && buildResults.testsPassing;
  const warnings = [];
  
  if (!buildResults.lintingPass) warnings.push('linting');
  
  return { canProgress, warnings };
}

function validateTDDHandoff(handoff) {
  const evidence = handoff.evidence;
  const tddCompliant = evidence.redPhase?.testsWritten && evidence.greenPhase?.testsPass;
  const evidenceComplete = !!(evidence.redPhase && evidence.greenPhase && evidence.refactorPhase);
  const blockingIssues = [];
  
  if (!evidence.redPhase?.testsWritten) blockingIssues.push('missing_tests');
  if (!evidence.greenPhase?.testsPass) blockingIssues.push('failing_tests');
  
  return { tddCompliant, evidenceComplete, blockingIssues };
}

function validateTaskCompletion(taskValidation) {
  const tddPhases = Object.keys(taskValidation.tddCycle);
  const completedPhases = tddPhases.filter(phase => 
    taskValidation.tddCycle[phase].status === 'complete'
  );
  
  const tddCompliance = (completedPhases.length / 3) * 100;
  const testsPassing = taskValidation.testResults.failed === 0;
  const coverageGood = taskValidation.testResults.coverage >= 90;
  
  const issues = [];
  if (!testsPassing) issues.push('test_failures');
  if (!coverageGood) issues.push('low_coverage');
  
  return {
    ready: testsPassing && coverageGood && tddCompliance === 100,
    tddCompliance,
    remediationRequired: issues.length > 0,
    issues
  };
}