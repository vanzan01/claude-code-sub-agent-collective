/**
 * Claude Code Sub-Agent Collective - Research Metrics System
 * 
 * Phase 6: Research Metrics Collection
 * 
 * This module provides comprehensive metrics collection and analysis for validating
 * the three core research hypotheses of the collective system:
 * 
 * H1: JIT Context Loading - On-demand loading is more efficient than preloading
 * H2: Hub-and-Spoke Coordination - Centralized routing outperforms distributed communication
 * H3: Test-Driven Development - Contract-based handoffs improve quality and reduce errors
 * 
 * Usage:
 * ```javascript
 * const { ResearchMetricsSystem } = require('./lib/metrics');
 * 
 * const metrics = new ResearchMetricsSystem({
 *   storageDir: '.claude-collective/metrics',
 *   enableRealTime: true,
 *   autoExperiments: true
 * });
 * 
 * await metrics.initialize();
 * 
 * // Record metrics
 * await metrics.recordContextLoad({
 *   contextSize: 5000,
 *   loadTime: 250,
 *   loadType: 'jit'
 * });
 * 
 * await metrics.recordRoutingRequest({
 *   fromAgent: '@user-agent',
 *   toAgent: '@implementation-agent',
 *   throughHub: true
 * });
 * 
 * await metrics.recordHandoffStart({
 *   fromAgent: '@testing-agent',
 *   toAgent: '@implementation-agent',
 *   hasContract: true
 * });
 * 
 * // Generate research report
 * const report = await metrics.generateResearchReport();
 * ```
 */

// Core metrics collectors
const MetricsCollector = require('./MetricsCollector');
const JITLoadingMetrics = require('./JITLoadingMetrics');
const HubSpokeMetrics = require('./HubSpokeMetrics');
const TDDHandoffMetrics = require('./TDDHandoffMetrics');

// Experiment framework
const ExperimentFramework = require('./ExperimentFramework');

// Main system orchestrator
const ResearchMetricsSystem = require('./ResearchMetricsSystem');

// Validation criteria constants
const VALIDATION_CRITERIA = {
  H1_JIT_LOADING: {
    CONTEXT_REDUCTION_TARGET: 0.30, // 30% reduction in context size
    LOAD_TIME_IMPROVEMENT_TARGET: 0.25, // 25% improvement in load time
    MEMORY_EFFICIENCY_TARGET: 0.25, // 25% memory usage reduction
    CONFIDENCE_THRESHOLD: 0.95 // 95% statistical confidence
  },
  H2_HUB_SPOKE: {
    ROUTING_COMPLIANCE_TARGET: 0.90, // 90% hub-mediated routing
    COORDINATION_OVERHEAD_MAX: 0.10, // Max 10% coordination overhead
    ERROR_REDUCTION_TARGET: 0.40, // 40% fewer routing errors
    CONFIDENCE_THRESHOLD: 0.95 // 95% statistical confidence
  },
  H3_TDD_HANDOFFS: {
    SUCCESS_RATE_TARGET: 0.80, // 80% handoff success rate
    TEST_COVERAGE_TARGET: 0.95, // 95% test coverage for handoffs
    ERROR_REDUCTION_TARGET: 0.50, // 50% reduction in handoff failures
    CONFIDENCE_THRESHOLD: 0.95 // 95% statistical confidence
  }
};

// Research hypotheses definitions
const RESEARCH_HYPOTHESES = {
  H1: {
    name: 'JIT Context Loading',
    description: 'Just-in-time context loading is more efficient than preloading all context upfront',
    metrics: ['contextSize', 'loadTime', 'memoryUsage', 'relevanceScore'],
    successCriteria: [
      '30% reduction in average context size',
      '25% improvement in load times',
      '25% reduction in memory usage'
    ]
  },
  H2: {
    name: 'Hub-and-Spoke Coordination',
    description: 'Centralized hub-and-spoke coordination outperforms distributed peer-to-peer communication',
    metrics: ['routingCompliance', 'coordinationOverhead', 'errorRate', 'responseTime'],
    successCriteria: [
      '90% routing compliance through hub',
      'Coordination overhead <10% of total time',
      '40% reduction in routing errors'
    ]
  },
  H3: {
    name: 'Test-Driven Development Handoffs',
    description: 'Contract-based handoffs improve quality and reduce errors compared to traditional methods',
    metrics: ['successRate', 'testCoverage', 'errorCount', 'validationTime'],
    successCriteria: [
      '80% handoff success rate',
      '95% test coverage for agent transitions',
      '50% reduction in handoff failures'
    ]
  }
};

// Utility functions
const utils = {
  /**
   * Create a new research metrics system with default configuration
   */
  createMetricsSystem(options = {}) {
    return new ResearchMetricsSystem({
      storageDir: options.storageDir || '.claude-collective/metrics',
      enableRealTime: options.enableRealTime !== false,
      reportingInterval: options.reportingInterval || 60 * 60 * 1000, // 1 hour
      validationInterval: options.validationInterval || 10 * 60 * 1000, // 10 minutes
      autoExperiments: options.autoExperiments !== false,
      ...options
    });
  },

  /**
   * Create individual metric collectors
   */
  createCollectors(options = {}) {
    return {
      jitLoading: new JITLoadingMetrics(options.jitLoading),
      hubSpoke: new HubSpokeMetrics(options.hubSpoke),
      tddHandoffs: new TDDHandoffMetrics(options.tddHandoffs)
    };
  },

  /**
   * Create experiment framework
   */
  createExperimentFramework(collectors, options = {}) {
    return new ExperimentFramework(collectors, options);
  },

  /**
   * Validate hypothesis against criteria
   */
  validateHypothesis(hypothesis, metrics, criteria) {
    switch (hypothesis) {
      case 'h1_jitLoading':
        return this.validateJITHypothesis(metrics, criteria);
      case 'h2_hubSpoke':
        return this.validateHubSpokeHypothesis(metrics, criteria);
      case 'h3_tddHandoffs':
        return this.validateTDDHypothesis(metrics, criteria);
      default:
        throw new Error(`Unknown hypothesis: ${hypothesis}`);
    }
  },

  /**
   * Validate JIT loading hypothesis
   */
  validateJITHypothesis(metrics, criteria = VALIDATION_CRITERIA.H1_JIT_LOADING) {
    const contextReduction = metrics.contextSizeReduction || 0;
    const loadTimeImprovement = metrics.loadTimeImprovement || 0;
    const memoryEfficiency = metrics.memoryEfficiencyGain || 0;
    const confidence = metrics.confidence || 0;

    return {
      validated: 
        contextReduction >= criteria.CONTEXT_REDUCTION_TARGET &&
        confidence >= criteria.CONFIDENCE_THRESHOLD,
      criteria: {
        contextReduction: {
          actual: contextReduction,
          target: criteria.CONTEXT_REDUCTION_TARGET,
          met: contextReduction >= criteria.CONTEXT_REDUCTION_TARGET
        },
        loadTimeImprovement: {
          actual: loadTimeImprovement,
          target: criteria.LOAD_TIME_IMPROVEMENT_TARGET,
          met: loadTimeImprovement >= criteria.LOAD_TIME_IMPROVEMENT_TARGET
        },
        memoryEfficiency: {
          actual: memoryEfficiency,
          target: criteria.MEMORY_EFFICIENCY_TARGET,
          met: memoryEfficiency >= criteria.MEMORY_EFFICIENCY_TARGET
        },
        confidence: {
          actual: confidence,
          target: criteria.CONFIDENCE_THRESHOLD,
          met: confidence >= criteria.CONFIDENCE_THRESHOLD
        }
      },
      confidence,
      evidence: this.generateJITEvidence(metrics, criteria)
    };
  },

  /**
   * Generate evidence for JIT hypothesis
   */
  generateJITEvidence(metrics, criteria) {
    const evidence = [];
    
    if (metrics.contextSizeReduction >= criteria.CONTEXT_REDUCTION_TARGET) {
      evidence.push(`Context size reduced by ${(metrics.contextSizeReduction * 100).toFixed(1)}%`);
    }
    
    if (metrics.loadTimeImprovement > 0) {
      evidence.push(`Load time improved by ${(metrics.loadTimeImprovement * 100).toFixed(1)}%`);
    }
    
    if (metrics.memoryEfficiencyGain > 0) {
      evidence.push(`Memory usage reduced by ${(metrics.memoryEfficiencyGain * 100).toFixed(1)}%`);
    }
    
    return evidence;
  }
};

// Export all components
module.exports = {
  // Core classes
  MetricsCollector,
  JITLoadingMetrics,
  HubSpokeMetrics,
  TDDHandoffMetrics,
  ExperimentFramework,
  ResearchMetricsSystem,
  
  // Constants
  VALIDATION_CRITERIA,
  RESEARCH_HYPOTHESES,
  
  // Utilities
  utils,
  
  // Convenience exports
  createMetricsSystem: utils.createMetricsSystem,
  createCollectors: utils.createCollectors,
  createExperimentFramework: utils.createExperimentFramework
};

// Default export
module.exports.default = ResearchMetricsSystem;