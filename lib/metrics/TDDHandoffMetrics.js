const MetricsCollector = require('./MetricsCollector');

/**
 * TDDHandoffMetrics - Hypothesis 3 Validation
 * 
 * Tests the hypothesis that Test-Driven Development handoffs improve quality
 * and reduce errors compared to traditional handoff methods.
 * 
 * Key Metrics:
 * - Handoff success rate >80%
 * - Test coverage >95% for agent transitions
 * - 50% reduction in handoff failures
 * - Improved error detection and contract validation
 */
class TDDHandoffMetrics extends MetricsCollector {
  constructor(options = {}) {
    super(options);
    
    this.hypothesis = 'h3_tddHandoffs';
    this.handoffEvents = [];
    this.testResults = [];
    this.contractValidations = [];
    this.qualityMetrics = [];
    
    // TDD-specific configuration
    this.tddConfig = {
      targetSuccessRate: 0.8, // 80%
      targetTestCoverage: 0.95, // 95%
      targetErrorReduction: 0.5, // 50%
      maxHandoffTime: 30000, // 30 seconds
      ...options.tddConfig
    };
    
    // Contract and handoff tracking
    this.contractDefinitions = new Map();
    this.handoffChains = new Map();
    this.qualityGates = new Map();
  }

  /**
   * Record handoff initiation
   */
  async recordHandoffStart(data) {
    const handoffEvent = {
      handoffId: data.handoffId || this.generateId(),
      fromAgent: data.fromAgent,
      toAgent: data.toAgent,
      taskType: data.taskType,
      startTime: data.startTime || Date.now(),
      hasContract: data.hasContract !== false,
      contractId: data.contractId,
      context: data.context || {},
      expectedOutcome: data.expectedOutcome,
      priority: data.priority || 'normal',
      metadata: data.metadata || {}
    };

    this.handoffEvents.push(handoffEvent);

    // Initialize handoff chain tracking
    this.updateHandoffChain(handoffEvent);

    await this.store('handoff_start', handoffEvent, {
      hypothesis: this.hypothesis,
      experiment: data.experiment || 'default'
    });

    return handoffEvent.handoffId;
  }

  /**
   * Record handoff completion
   */
  async recordHandoffCompletion(data) {
    const completionEvent = {
      handoffId: data.handoffId,
      endTime: data.endTime || Date.now(),
      success: data.success !== false,
      outcome: data.outcome,
      errors: data.errors || [],
      testResults: data.testResults || {},
      validationResults: data.validationResults || {},
      qualityScore: data.qualityScore || 0,
      retryCount: data.retryCount || 0
    };

    // Find matching handoff start event
    const handoffStart = this.handoffEvents.find(h => h.handoffId === data.handoffId);
    if (handoffStart) {
      completionEvent.duration = completionEvent.endTime - handoffStart.startTime;
      completionEvent.fromAgent = handoffStart.fromAgent;
      completionEvent.toAgent = handoffStart.toAgent;
      completionEvent.taskType = handoffStart.taskType;
      completionEvent.hasContract = handoffStart.hasContract;
      
      // Update original event
      Object.assign(handoffStart, completionEvent);
    }

    await this.store('handoff_completion', completionEvent, {
      hypothesis: this.hypothesis
    });

    // Update quality metrics
    this.updateQualityMetrics(completionEvent);

    // Update handoff chain
    this.updateHandoffChainCompletion(completionEvent);

    return completionEvent.handoffId;
  }

  /**
   * Record test execution during handoff
   */
  async recordTestExecution(data) {
    const testEvent = {
      testId: data.testId || this.generateId(),
      handoffId: data.handoffId,
      testType: data.testType, // 'unit', 'integration', 'contract', 'acceptance'
      testSuite: data.testSuite,
      startTime: data.startTime || Date.now(),
      endTime: data.endTime || Date.now(),
      passed: data.passed || 0,
      failed: data.failed || 0,
      skipped: data.skipped || 0,
      coverage: data.coverage || 0,
      assertions: data.assertions || 0,
      errors: data.errors || [],
      warnings: data.warnings || []
    };

    testEvent.duration = testEvent.endTime - testEvent.startTime;
    testEvent.total = testEvent.passed + testEvent.failed + testEvent.skipped;
    testEvent.successRate = testEvent.total > 0 ? testEvent.passed / testEvent.total : 0;

    this.testResults.push(testEvent);

    await this.store('test_execution', testEvent, {
      hypothesis: this.hypothesis
    });

    return testEvent.testId;
  }

  /**
   * Record contract validation
   */
  async recordContractValidation(data) {
    const validationEvent = {
      validationId: data.validationId || this.generateId(),
      handoffId: data.handoffId,
      contractId: data.contractId,
      contractType: data.contractType, // 'interface', 'behavior', 'data', 'performance'
      validationType: data.validationType, // 'pre_condition', 'post_condition', 'invariant'
      startTime: data.startTime || Date.now(),
      endTime: data.endTime || Date.now(),
      valid: data.valid !== false,
      violations: data.violations || [],
      checks: data.checks || [],
      severity: data.severity || 'medium',
      autoFixed: data.autoFixed || false
    };

    validationEvent.duration = validationEvent.endTime - validationEvent.startTime;
    validationEvent.checkCount = validationEvent.checks.length;
    validationEvent.violationCount = validationEvent.violations.length;

    this.contractValidations.push(validationEvent);

    await this.store('contract_validation', validationEvent, {
      hypothesis: this.hypothesis
    });

    // Update contract definitions tracking
    this.updateContractDefinitions(validationEvent);

    return validationEvent.validationId;
  }

  /**
   * Record quality gate results
   */
  async recordQualityGate(data) {
    const qualityEvent = {
      gateId: data.gateId || this.generateId(),
      handoffId: data.handoffId,
      gateType: data.gateType, // 'pre_handoff', 'post_handoff', 'continuous'
      gateName: data.gateName,
      timestamp: Date.now(),
      passed: data.passed !== false,
      score: data.score || 0,
      criteria: data.criteria || [],
      results: data.results || {},
      blockers: data.blockers || [],
      warnings: data.warnings || []
    };

    await this.store('quality_gate', qualityEvent, {
      hypothesis: this.hypothesis
    });

    // Update quality gates tracking
    this.qualityGates.set(qualityEvent.gateId, qualityEvent);

    return qualityEvent.gateId;
  }

  /**
   * Record error or defect detected during handoff
   */
  async recordHandoffError(data) {
    const errorEvent = {
      errorId: data.errorId || this.generateId(),
      handoffId: data.handoffId,
      errorType: data.errorType, // 'contract_violation', 'test_failure', 'validation_error', 'timeout'
      severity: data.severity || 'medium', // 'low', 'medium', 'high', 'critical'
      timestamp: Date.now(),
      description: data.description,
      stackTrace: data.stackTrace,
      context: data.context || {},
      resolution: data.resolution,
      resolutionTime: data.resolutionTime || 0,
      preventedByContract: data.preventedByContract || false,
      autoResolved: data.autoResolved || false
    };

    await this.store('handoff_error', errorEvent, {
      hypothesis: this.hypothesis,
      alert: errorEvent.severity === 'high' || errorEvent.severity === 'critical'
    });

    // Emit alert for critical errors
    if (errorEvent.severity === 'critical') {
      this.emit('critical_error', errorEvent);
    }

    return errorEvent.errorId;
  }

  /**
   * Update handoff chain tracking
   */
  updateHandoffChain(handoffEvent) {
    const chainKey = `${handoffEvent.fromAgent}->${handoffEvent.toAgent}`;
    
    if (!this.handoffChains.has(chainKey)) {
      this.handoffChains.set(chainKey, {
        fromAgent: handoffEvent.fromAgent,
        toAgent: handoffEvent.toAgent,
        handoffs: [],
        successCount: 0,
        totalCount: 0,
        averageDuration: 0,
        contractUsageRate: 0
      });
    }
    
    const chain = this.handoffChains.get(chainKey);
    chain.handoffs.push(handoffEvent);
    chain.totalCount++;
  }

  /**
   * Update handoff chain completion
   */
  updateHandoffChainCompletion(completionEvent) {
    const chainKey = `${completionEvent.fromAgent}->${completionEvent.toAgent}`;
    const chain = this.handoffChains.get(chainKey);
    
    if (chain) {
      if (completionEvent.success) {
        chain.successCount++;
      }
      
      // Recalculate metrics
      const completedHandoffs = chain.handoffs.filter(h => h.endTime);
      if (completedHandoffs.length > 0) {
        const totalDuration = completedHandoffs.reduce((sum, h) => sum + (h.duration || 0), 0);
        chain.averageDuration = totalDuration / completedHandoffs.length;
        
        const contractHandoffs = completedHandoffs.filter(h => h.hasContract);
        chain.contractUsageRate = contractHandoffs.length / completedHandoffs.length;
      }
    }
  }

  /**
   * Update contract definitions tracking
   */
  updateContractDefinitions(validationEvent) {
    if (!validationEvent.contractId) return;
    
    if (!this.contractDefinitions.has(validationEvent.contractId)) {
      this.contractDefinitions.set(validationEvent.contractId, {
        contractId: validationEvent.contractId,
        contractType: validationEvent.contractType,
        validations: [],
        successRate: 0,
        violationPatterns: new Map()
      });
    }
    
    const contract = this.contractDefinitions.get(validationEvent.contractId);
    contract.validations.push(validationEvent);
    
    // Update success rate
    const validValidations = contract.validations.filter(v => v.valid);
    contract.successRate = validValidations.length / contract.validations.length;
    
    // Track violation patterns
    validationEvent.violations.forEach(violation => {
      const pattern = violation.type || 'unknown';
      const currentCount = contract.violationPatterns.get(pattern) || 0;
      contract.violationPatterns.set(pattern, currentCount + 1);
    });
  }

  /**
   * Update quality metrics
   */
  updateQualityMetrics(completionEvent) {
    const qualityMetric = {
      timestamp: Date.now(),
      handoffId: completionEvent.handoffId,
      success: completionEvent.success,
      duration: completionEvent.duration,
      qualityScore: completionEvent.qualityScore,
      testCoverage: completionEvent.testResults?.coverage || 0,
      errorCount: completionEvent.errors ? completionEvent.errors.length : 0,
      retryCount: completionEvent.retryCount || 0,
      hasContract: completionEvent.hasContract
    };

    this.qualityMetrics.push(qualityMetric);

    // Keep only recent metrics for performance
    if (this.qualityMetrics.length > 1000) {
      this.qualityMetrics = this.qualityMetrics.slice(-1000);
    }
  }

  /**
   * Perform TDD-specific aggregation
   */
  performAggregation(metrics) {
    const baseAggregation = super.performAggregation(metrics);
    
    const handoffMetrics = metrics.filter(m => m.eventType === 'handoff_start');
    const completionMetrics = metrics.filter(m => m.eventType === 'handoff_completion');
    const testMetrics = metrics.filter(m => m.eventType === 'test_execution');
    const validationMetrics = metrics.filter(m => m.eventType === 'contract_validation');
    const errorMetrics = metrics.filter(m => m.eventType === 'handoff_error');

    return {
      ...baseAggregation,
      handoffs: {
        totalHandoffs: handoffMetrics.length,
        completedHandoffs: completionMetrics.length,
        successfulHandoffs: completionMetrics.filter(m => m.data.success).length,
        contractBasedHandoffs: handoffMetrics.filter(m => m.data.hasContract).length,
        averageHandoffTime: this.calculateAverageHandoffTime(completionMetrics),
        handoffSuccessRate: this.calculateHandoffSuccessRate(completionMetrics),
        contractUsageRate: this.calculateContractUsageRate(handoffMetrics)
      },
      testing: {
        totalTests: testMetrics.length,
        testSuites: this.countUnique(testMetrics, 'testSuite'),
        totalAssertions: testMetrics.reduce((sum, m) => sum + (m.data.assertions || 0), 0),
        averageTestCoverage: this.calculateAverageTestCoverage(testMetrics),
        testSuccessRate: this.calculateTestSuccessRate(testMetrics),
        averageTestDuration: this.calculateAverageTestDuration(testMetrics)
      },
      contracts: {
        totalValidations: validationMetrics.length,
        contractTypes: this.countEventTypes(validationMetrics, 'contractType'),
        validationSuccessRate: this.calculateValidationSuccessRate(validationMetrics),
        averageValidationTime: this.calculateAverageValidationTime(validationMetrics),
        violationPatterns: this.analyzeViolationPatterns(validationMetrics)
      },
      quality: {
        totalErrors: errorMetrics.length,
        errorsByType: this.countEventTypes(errorMetrics, 'errorType'),
        errorsBySeverity: this.countEventTypes(errorMetrics, 'severity'),
        averageQualityScore: this.calculateAverageQualityScore(),
        errorPreventionRate: this.calculateErrorPreventionRate(errorMetrics),
        autoResolutionRate: this.calculateAutoResolutionRate(errorMetrics)
      },
      chains: {
        handoffChains: this.analyzeHandoffChains(),
        mostReliableChains: this.getMostReliableChains(),
        problematicChains: this.getProblematicChains()
      }
    };
  }

  /**
   * Calculate average handoff time
   */
  calculateAverageHandoffTime(completionMetrics) {
    const metricsWithDuration = completionMetrics.filter(m => m.data.duration > 0);
    if (metricsWithDuration.length === 0) return 0;
    
    const totalDuration = metricsWithDuration.reduce((sum, m) => sum + m.data.duration, 0);
    return totalDuration / metricsWithDuration.length;
  }

  /**
   * Calculate handoff success rate
   */
  calculateHandoffSuccessRate(completionMetrics) {
    if (completionMetrics.length === 0) return 0;
    
    const successfulHandoffs = completionMetrics.filter(m => m.data.success);
    return successfulHandoffs.length / completionMetrics.length;
  }

  /**
   * Calculate contract usage rate
   */
  calculateContractUsageRate(handoffMetrics) {
    if (handoffMetrics.length === 0) return 0;
    
    const contractHandoffs = handoffMetrics.filter(m => m.data.hasContract);
    return contractHandoffs.length / handoffMetrics.length;
  }

  /**
   * Calculate average test coverage
   */
  calculateAverageTestCoverage(testMetrics) {
    const metricsWithCoverage = testMetrics.filter(m => m.data.coverage > 0);
    if (metricsWithCoverage.length === 0) return 0;
    
    const totalCoverage = metricsWithCoverage.reduce((sum, m) => sum + m.data.coverage, 0);
    return totalCoverage / metricsWithCoverage.length;
  }

  /**
   * Calculate test success rate
   */
  calculateTestSuccessRate(testMetrics) {
    if (testMetrics.length === 0) return 0;
    
    const totalTests = testMetrics.reduce((sum, m) => sum + (m.data.total || 0), 0);
    const passedTests = testMetrics.reduce((sum, m) => sum + (m.data.passed || 0), 0);
    
    return totalTests > 0 ? passedTests / totalTests : 0;
  }

  /**
   * Calculate average test duration
   */
  calculateAverageTestDuration(testMetrics) {
    if (testMetrics.length === 0) return 0;
    
    const totalDuration = testMetrics.reduce((sum, m) => sum + (m.data.duration || 0), 0);
    return totalDuration / testMetrics.length;
  }

  /**
   * Calculate validation success rate
   */
  calculateValidationSuccessRate(validationMetrics) {
    if (validationMetrics.length === 0) return 0;
    
    const validValidations = validationMetrics.filter(m => m.data.valid);
    return validValidations.length / validationMetrics.length;
  }

  /**
   * Calculate average validation time
   */
  calculateAverageValidationTime(validationMetrics) {
    if (validationMetrics.length === 0) return 0;
    
    const totalDuration = validationMetrics.reduce((sum, m) => sum + (m.data.duration || 0), 0);
    return totalDuration / validationMetrics.length;
  }

  /**
   * Count unique values for a property
   */
  countUnique(metrics, property) {
    const unique = new Set(metrics.map(m => m.data[property]).filter(Boolean));
    return unique.size;
  }

  /**
   * Count event types for a specific property
   */
  countEventTypes(metrics, property) {
    const counts = {};
    metrics.forEach(m => {
      const value = m.data[property];
      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
    });
    return counts;
  }

  /**
   * Analyze violation patterns
   */
  analyzeViolationPatterns(validationMetrics) {
    const patterns = new Map();
    
    validationMetrics.forEach(m => {
      if (m.data.violations) {
        m.data.violations.forEach(violation => {
          const pattern = violation.type || 'unknown';
          patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
        });
      }
    });
    
    return Object.fromEntries(
      Array.from(patterns.entries()).sort((a, b) => b[1] - a[1])
    );
  }

  /**
   * Calculate average quality score
   */
  calculateAverageQualityScore() {
    const metricsWithScore = this.qualityMetrics.filter(m => m.qualityScore > 0);
    if (metricsWithScore.length === 0) return 0;
    
    const totalScore = metricsWithScore.reduce((sum, m) => sum + m.qualityScore, 0);
    return totalScore / metricsWithScore.length;
  }

  /**
   * Calculate error prevention rate
   */
  calculateErrorPreventionRate(errorMetrics) {
    if (errorMetrics.length === 0) return 1; // No errors means 100% prevention
    
    const preventedErrors = errorMetrics.filter(m => m.data.preventedByContract);
    return preventedErrors.length / errorMetrics.length;
  }

  /**
   * Calculate auto-resolution rate
   */
  calculateAutoResolutionRate(errorMetrics) {
    if (errorMetrics.length === 0) return 0;
    
    const autoResolvedErrors = errorMetrics.filter(m => m.data.autoResolved);
    return autoResolvedErrors.length / errorMetrics.length;
  }

  /**
   * Analyze handoff chains
   */
  analyzeHandoffChains() {
    const chains = Array.from(this.handoffChains.values()).map(chain => ({
      from: chain.fromAgent,
      to: chain.toAgent,
      totalHandoffs: chain.totalCount,
      successRate: chain.totalCount > 0 ? chain.successCount / chain.totalCount : 0,
      averageDuration: chain.averageDuration,
      contractUsage: chain.contractUsageRate
    }));
    
    return chains.sort((a, b) => b.totalHandoffs - a.totalHandoffs);
  }

  /**
   * Get most reliable handoff chains
   */
  getMostReliableChains() {
    return Array.from(this.handoffChains.values())
      .filter(chain => chain.totalCount >= 5) // Minimum sample size
      .map(chain => ({
        from: chain.fromAgent,
        to: chain.toAgent,
        successRate: chain.successCount / chain.totalCount,
        totalHandoffs: chain.totalCount
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5);
  }

  /**
   * Get problematic handoff chains
   */
  getProblematicChains() {
    return Array.from(this.handoffChains.values())
      .filter(chain => chain.totalCount >= 3) // Minimum sample size
      .map(chain => ({
        from: chain.fromAgent,
        to: chain.toAgent,
        successRate: chain.successCount / chain.totalCount,
        totalHandoffs: chain.totalCount,
        averageDuration: chain.averageDuration
      }))
      .filter(chain => chain.successRate < 0.7) // Less than 70% success
      .sort((a, b) => a.successRate - b.successRate)
      .slice(0, 5);
  }

  /**
   * Perform TDD-specific analysis
   */
  performAnalysis(metrics) {
    const baseAnalysis = super.performAnalysis(metrics);
    
    const handoffMetrics = metrics.filter(m => m.eventType === 'handoff_start');
    const completionMetrics = metrics.filter(m => m.eventType === 'handoff_completion');
    const testMetrics = metrics.filter(m => m.eventType === 'test_execution');
    const validationMetrics = metrics.filter(m => m.eventType === 'contract_validation');
    const errorMetrics = metrics.filter(m => m.eventType === 'handoff_error');
    
    return {
      ...baseAnalysis,
      hypothesisValidation: {
        handoffSuccessRate: this.calculateHandoffSuccessRate(completionMetrics),
        testCoverage: this.calculateAverageTestCoverage(testMetrics),
        contractUsageRate: this.calculateContractUsageRate(handoffMetrics),
        errorReduction: this.calculateErrorReduction(errorMetrics),
        qualityImprovement: this.calculateQualityImprovement()
      },
      trends: {
        successRateTrend: this.calculateSuccessRateTrend(completionMetrics),
        testCoverageTrend: this.calculateTestCoverageTrend(testMetrics),
        errorRateTrend: this.calculateErrorRateTrend(errorMetrics),
        qualityTrend: this.calculateQualityTrend()
      },
      predictions: {
        projectedSuccessRate: this.projectSuccessRate(completionMetrics),
        timeToTargetSuccess: this.estimateTimeToTargetSuccess(completionMetrics),
        qualityTrajectory: this.projectQualityTrajectory(),
        contractAdoptionProjection: this.projectContractAdoption(handoffMetrics)
      }
    };
  }

  /**
   * Calculate error reduction compared to baseline
   */
  calculateErrorReduction(errorMetrics) {
    const baseline = this.baseline?.measurements?.handoffs?.retryRate || 1.0;
    const currentErrorRate = errorMetrics.length / Math.max(this.handoffEvents.length, 1);
    
    return Math.max(0, (baseline - currentErrorRate) / baseline);
  }

  /**
   * Calculate quality improvement
   */
  calculateQualityImprovement() {
    const baseline = 0.5; // Assume 50% baseline quality score
    const current = this.calculateAverageQualityScore();
    
    if (current === 0) return 0;
    return (current - baseline) / baseline;
  }

  /**
   * Calculate success rate trend
   */
  calculateSuccessRateTrend(completionMetrics) {
    if (completionMetrics.length < 10) return 'insufficient_data';
    
    const recentMetrics = completionMetrics.slice(-Math.floor(completionMetrics.length / 2));
    const olderMetrics = completionMetrics.slice(0, Math.floor(completionMetrics.length / 2));
    
    const recentSuccessRate = this.calculateHandoffSuccessRate(recentMetrics);
    const olderSuccessRate = this.calculateHandoffSuccessRate(olderMetrics);
    
    if (recentSuccessRate > olderSuccessRate * 1.05) return 'improving';
    if (recentSuccessRate < olderSuccessRate * 0.95) return 'degrading';
    return 'stable';
  }

  /**
   * Calculate test coverage trend
   */
  calculateTestCoverageTrend(testMetrics) {
    return this.calculateTrend(testMetrics, 'coverage');
  }

  /**
   * Calculate error rate trend
   */
  calculateErrorRateTrend(errorMetrics) {
    if (errorMetrics.length < 5) return 'insufficient_data';
    
    // Analyze error frequency over time windows
    const timeWindow = 60 * 60 * 1000; // 1 hour
    const now = Date.now();
    
    const recentErrors = errorMetrics.filter(m => 
      now - m.timestamp < timeWindow
    ).length;
    
    const previousErrors = errorMetrics.filter(m => 
      now - m.timestamp >= timeWindow && now - m.timestamp < timeWindow * 2
    ).length;
    
    if (recentErrors < previousErrors * 0.8) return 'improving';
    if (recentErrors > previousErrors * 1.2) return 'degrading';
    return 'stable';
  }

  /**
   * Calculate quality trend
   */
  calculateQualityTrend() {
    if (this.qualityMetrics.length < 10) return 'insufficient_data';
    
    const recentMetrics = this.qualityMetrics.slice(-Math.floor(this.qualityMetrics.length / 2));
    const olderMetrics = this.qualityMetrics.slice(0, Math.floor(this.qualityMetrics.length / 2));
    
    const recentAvg = recentMetrics.reduce((sum, m) => sum + m.qualityScore, 0) / recentMetrics.length;
    const olderAvg = olderMetrics.reduce((sum, m) => sum + m.qualityScore, 0) / olderMetrics.length;
    
    if (recentAvg > olderAvg * 1.05) return 'improving';
    if (recentAvg < olderAvg * 0.95) return 'degrading';
    return 'stable';
  }

  /**
   * Calculate trend for a specific metric (inherited from parent but specialized)
   */
  calculateTrend(metrics, property) {
    if (metrics.length < 10) return 'insufficient_data';
    
    const values = metrics.map(m => m.data[property]).filter(v => v != null && v > 0);
    if (values.length < 10) return 'insufficient_data';
    
    const firstThird = values.slice(0, Math.floor(values.length / 3));
    const lastThird = values.slice(-Math.floor(values.length / 3));
    
    const firstAvg = firstThird.reduce((a, b) => a + b, 0) / firstThird.length;
    const lastAvg = lastThird.reduce((a, b) => a + b, 0) / lastThird.length;
    
    if (lastAvg > firstAvg * 1.05) return 'improving';
    if (lastAvg < firstAvg * 0.95) return 'degrading';
    return 'stable';
  }

  /**
   * Project success rate based on trends
   */
  projectSuccessRate(completionMetrics) {
    const currentSuccessRate = this.calculateHandoffSuccessRate(completionMetrics);
    const trend = this.calculateSuccessRateTrend(completionMetrics);
    
    if (trend === 'improving') {
      return Math.min(currentSuccessRate * 1.1, 1.0);
    } else if (trend === 'degrading') {
      return Math.max(currentSuccessRate * 0.9, 0.0);
    }
    
    return currentSuccessRate;
  }

  /**
   * Estimate time to reach target success rate
   */
  estimateTimeToTargetSuccess(completionMetrics) {
    const currentSuccessRate = this.calculateHandoffSuccessRate(completionMetrics);
    const targetSuccessRate = this.tddConfig.targetSuccessRate;
    
    if (currentSuccessRate >= targetSuccessRate) return 0;
    
    const trend = this.calculateSuccessRateTrend(completionMetrics);
    const improvementRate = trend === 'improving' ? 0.05 : 0.01; // 5% or 1% per hour
    
    const remainingImprovement = targetSuccessRate - currentSuccessRate;
    return Math.ceil(remainingImprovement / improvementRate); // Hours
  }

  /**
   * Project quality trajectory
   */
  projectQualityTrajectory() {
    const currentQuality = this.calculateAverageQualityScore();
    const trend = this.calculateQualityTrend();
    
    const projections = [];
    let quality = currentQuality;
    
    for (let hours = 1; hours <= 24; hours++) {
      if (trend === 'improving') {
        quality = Math.min(quality * 1.02, 1.0); // 2% improvement per hour
      } else if (trend === 'degrading') {
        quality = Math.max(quality * 0.98, 0.0); // 2% degradation per hour
      }
      
      projections.push({ hour: hours, quality });
    }
    
    return projections;
  }

  /**
   * Project contract adoption
   */
  projectContractAdoption(handoffMetrics) {
    const currentUsageRate = this.calculateContractUsageRate(handoffMetrics);
    
    // Assume gradual adoption if beneficial
    const adoptionRate = 0.05; // 5% increase per week
    const projections = [];
    let usage = currentUsageRate;
    
    for (let week = 1; week <= 12; week++) {
      usage = Math.min(usage + adoptionRate, 1.0);
      projections.push({ week, usage });
    }
    
    return projections;
  }

  /**
   * Validate H3: Test-Driven Development Handoffs hypothesis
   */
  validateHypotheses(metrics) {
    const handoffMetrics = metrics.filter(m => m.eventType === 'handoff_start');
    const completionMetrics = metrics.filter(m => m.eventType === 'handoff_completion');
    const testMetrics = metrics.filter(m => m.eventType === 'test_execution');
    const analysis = this.performAnalysis(metrics);
    
    const h3Validation = {
      hypothesis: 'Test-Driven Development handoffs improve quality and reduce errors',
      validated: false,
      confidence: this.calculateConfidence(completionMetrics.length),
      evidence: [],
      metrics: {
        handoffSuccessRate: analysis.hypothesisValidation?.handoffSuccessRate || 0,
        testCoverage: analysis.hypothesisValidation?.testCoverage || 0,
        contractUsageRate: analysis.hypothesisValidation?.contractUsageRate || 0,
        errorReduction: analysis.hypothesisValidation?.errorReduction || 0,
        qualityImprovement: analysis.hypothesisValidation?.qualityImprovement || 0
      },
      criteria: {
        targetSuccessRate: this.tddConfig.targetSuccessRate,
        targetTestCoverage: this.tddConfig.targetTestCoverage,
        targetErrorReduction: this.tddConfig.targetErrorReduction,
        confidenceThreshold: this.config.hypotheses.h3_tddHandoffs.confidenceThreshold
      }
    };

    // Check validation criteria
    const meetsSuccessRate = h3Validation.metrics.handoffSuccessRate >= h3Validation.criteria.targetSuccessRate;
    const meetsTestCoverage = h3Validation.metrics.testCoverage >= h3Validation.criteria.targetTestCoverage;
    const meetsErrorReduction = h3Validation.metrics.errorReduction >= h3Validation.criteria.targetErrorReduction;
    const meetsConfidence = h3Validation.confidence >= h3Validation.criteria.confidenceThreshold;
    
    h3Validation.validated = meetsSuccessRate && meetsTestCoverage && meetsConfidence;

    // Collect evidence
    if (meetsSuccessRate) {
      h3Validation.evidence.push(`Handoff success rate achieved ${(h3Validation.metrics.handoffSuccessRate * 100).toFixed(1)}% (target: ${(h3Validation.criteria.targetSuccessRate * 100).toFixed(1)}%)`);
    }
    if (meetsTestCoverage) {
      h3Validation.evidence.push(`Test coverage achieved ${(h3Validation.metrics.testCoverage * 100).toFixed(1)}% (target: ${(h3Validation.criteria.targetTestCoverage * 100).toFixed(1)}%)`);
    }
    if (meetsErrorReduction) {
      h3Validation.evidence.push(`Error reduction achieved ${(h3Validation.metrics.errorReduction * 100).toFixed(1)}% (target: ${(h3Validation.criteria.targetErrorReduction * 100).toFixed(1)}%)`);
    }
    if (h3Validation.metrics.qualityImprovement > 0) {
      h3Validation.evidence.push(`Quality score improved by ${(h3Validation.metrics.qualityImprovement * 100).toFixed(1)}%`);
    }
    if (h3Validation.metrics.contractUsageRate > 0.8) {
      h3Validation.evidence.push(`High contract adoption rate: ${(h3Validation.metrics.contractUsageRate * 100).toFixed(1)}%`);
    }

    return {
      h1_jitLoading: { validated: false, confidence: 0, evidence: [] },
      h2_hubSpoke: { validated: false, confidence: 0, evidence: [] },
      h3_tddHandoffs: h3Validation
    };
  }
}

module.exports = TDDHandoffMetrics;