const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');

/**
 * ExperimentFramework - A/B Testing System for Research Validation
 * 
 * Provides controlled experimental environment for validating hypotheses:
 * - H1: JIT Context Loading vs Preloading
 * - H2: Hub-and-Spoke vs Distributed Communication
 * - H3: Test-Driven vs Traditional Handoffs
 * 
 * Features:
 * - Randomized controlled trials
 * - Statistical significance testing
 * - Multi-variant experiments
 * - Confidence interval calculation
 * - Experiment lifecycle management
 */
class ExperimentFramework extends EventEmitter {
  constructor(metricsCollectors, options = {}) {
    super();
    
    this.metricsCollectors = metricsCollectors || {};
    this.experiments = new Map();
    this.assignments = new Map(); // subjectId -> experimentId -> variantId
    this.results = new Map(); // experimentId -> variantId -> results
    this.staticResults = new Map(); // For pre-computed statistical results
    
    this.options = {
      storageDir: options.storageDir || path.join(process.cwd(), '.claude-collective', 'experiments'),
      defaultSignificanceLevel: options.significanceLevel || 0.05,
      minSampleSize: options.minSampleSize || 30,
      maxExperimentDuration: options.maxExperimentDuration || 7 * 24 * 60 * 60 * 1000, // 7 days
      autoAnalyzeInterval: options.autoAnalyzeInterval || 60 * 60 * 1000, // 1 hour
      ...options
    };
    
    // Statistical analysis configuration
    this.statisticalConfig = {
      confidenceLevels: [0.90, 0.95, 0.99],
      effectSizeThresholds: {
        small: 0.2,
        medium: 0.5,
        large: 0.8
      },
      powerAnalysisTarget: 0.8, // 80% statistical power
      multipleTestingCorrection: 'bonferroni' // or 'fdr'
    };
    
    this.initialized = false;
  }

  /**
   * Initialize the experiment framework
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Create storage directory
      await fs.ensureDir(this.options.storageDir);
      await fs.ensureDir(path.join(this.options.storageDir, 'experiments'));
      await fs.ensureDir(path.join(this.options.storageDir, 'results'));
      await fs.ensureDir(path.join(this.options.storageDir, 'reports'));
      
      // Load existing experiments
      await this.loadExistingExperiments();
      
      // Start auto-analysis timer
      this.startAutoAnalysis();
      
      this.initialized = true;
      this.emit('initialized');
      
    } catch (error) {
      this.emit('error', { type: 'initialization', error: error.message });
      throw error;
    }
  }

  /**
   * Create a new experiment
   */
  async createExperiment(config) {
    if (!this.initialized) await this.initialize();
    
    const experiment = {
      id: config.id || this.generateExperimentId(),
      name: config.name,
      hypothesis: config.hypothesis,
      description: config.description || '',
      variants: this.validateVariants(config.variants),
      metrics: config.metrics || [],
      allocation: config.allocation || this.calculateEqualAllocation(config.variants),
      criteria: {
        successMetric: config.successMetric,
        minimumEffect: config.minimumEffect || 0.1,
        significanceLevel: config.significanceLevel || this.options.defaultSignificanceLevel,
        powerTarget: config.powerTarget || 0.8,
        minSampleSize: config.minSampleSize || this.options.minSampleSize
      },
      status: 'created',
      createdAt: Date.now(),
      startedAt: null,
      endedAt: null,
      assignments: new Map(),
      metadata: config.metadata || {}
    };

    // Validate experiment configuration
    this.validateExperiment(experiment);
    
    // Store experiment
    this.experiments.set(experiment.id, experiment);
    await this.saveExperiment(experiment);
    
    this.emit('experiment_created', experiment);
    
    return experiment;
  }

  /**
   * Start an experiment
   */
  async startExperiment(experimentId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }
    
    if (experiment.status !== 'created') {
      throw new Error(`Experiment ${experimentId} is not in created state`);
    }
    
    experiment.status = 'running';
    experiment.startedAt = Date.now();
    
    // Initialize results tracking
    experiment.variants.forEach(variant => {
      const resultsKey = `${experimentId}:${variant.id}`;
      this.results.set(resultsKey, {
        experimentId,
        variantId: variant.id,
        conversions: [],
        assignments: 0,
        metrics: new Map()
      });
    });
    
    await this.saveExperiment(experiment);
    this.emit('experiment_started', experiment);
    
    return experiment;
  }

  /**
   * Assign a subject to an experiment variant
   */
  assignVariant(experimentId, subjectId, context = {}) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }
    
    // Check if already assigned
    const subjectAssignments = this.assignments.get(subjectId) || {};
    if (subjectAssignments[experimentId]) {
      return experiment.variants.find(v => v.id === subjectAssignments[experimentId]);
    }
    
    // Assign based on allocation strategy
    const variant = this.selectVariant(experiment, subjectId, context);
    
    // Record assignment
    if (!this.assignments.has(subjectId)) {
      this.assignments.set(subjectId, {});
    }
    this.assignments.get(subjectId)[experimentId] = variant.id;
    experiment.assignments.set(subjectId, {
      variantId: variant.id,
      assignedAt: Date.now(),
      context
    });
    
    // Update results
    const resultsKey = `${experimentId}:${variant.id}`;
    const results = this.results.get(resultsKey);
    if (results) {
      results.assignments++;
    }
    
    this.emit('variant_assigned', {
      experimentId,
      subjectId,
      variantId: variant.id,
      context
    });
    
    return variant;
  }

  /**
   * Record a conversion event
   */
  recordConversion(experimentId, subjectId, metric, value, metadata = {}) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return false;
    
    const assignment = experiment.assignments.get(subjectId);
    if (!assignment) return false;
    
    const conversion = {
      experimentId,
      subjectId,
      variantId: assignment.variantId,
      metric,
      value,
      timestamp: Date.now(),
      metadata
    };
    
    // Store conversion
    const resultsKey = `${experimentId}:${assignment.variantId}`;
    const results = this.results.get(resultsKey);
    if (results) {
      results.conversions.push(conversion);
      
      if (!results.metrics.has(metric)) {
        results.metrics.set(metric, []);
      }
      results.metrics.get(metric).push(value);
    }
    
    this.emit('conversion_recorded', conversion);
    
    // Auto-analyze if conditions are met
    this.scheduleAnalysis(experimentId);
    
    return true;
  }

  /**
   * Analyze experiment results
   */
  async analyzeExperiment(experimentId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }
    
    const analysis = {
      experimentId: experiment.id,
      name: experiment.name,
      hypothesis: experiment.hypothesis,
      status: experiment.status,
      duration: experiment.startedAt ? Date.now() - experiment.startedAt : 0,
      variants: [],
      statistical: {},
      recommendations: [],
      timestamp: Date.now()
    };
    
    // Analyze each variant
    for (const variant of experiment.variants) {
      const variantAnalysis = await this.analyzeVariant(experiment, variant);
      analysis.variants.push(variantAnalysis);
    }
    
    // Perform statistical analysis
    analysis.statistical = this.performStatisticalAnalysis(experiment, analysis.variants);
    
    // Generate recommendations
    analysis.recommendations = this.generateRecommendations(experiment, analysis);
    
    // Save analysis
    await this.saveAnalysis(analysis);
    
    this.emit('experiment_analyzed', analysis);
    
    return analysis;
  }

  /**
   * Stop an experiment
   */
  async stopExperiment(experimentId, reason = 'manual') {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }
    
    experiment.status = 'stopped';
    experiment.endedAt = Date.now();
    experiment.stopReason = reason;
    
    // Final analysis
    const finalAnalysis = await this.analyzeExperiment(experimentId);
    experiment.finalAnalysis = finalAnalysis;
    
    await this.saveExperiment(experiment);
    this.emit('experiment_stopped', { experiment, reason, analysis: finalAnalysis });
    
    return finalAnalysis;
  }

  /**
   * Validate variants configuration
   */
  validateVariants(variants) {
    if (!Array.isArray(variants) || variants.length < 2) {
      throw new Error('Experiment must have at least 2 variants');
    }
    
    const variantIds = new Set();
    variants.forEach(variant => {
      if (!variant.id || !variant.name) {
        throw new Error('Each variant must have id and name');
      }
      if (variantIds.has(variant.id)) {
        throw new Error(`Duplicate variant ID: ${variant.id}`);
      }
      variantIds.add(variant.id);
    });
    
    return variants;
  }

  /**
   * Calculate equal allocation for variants
   */
  calculateEqualAllocation(variants) {
    const allocation = {};
    const split = 1 / variants.length;
    
    variants.forEach(variant => {
      allocation[variant.id] = split;
    });
    
    return allocation;
  }

  /**
   * Validate experiment configuration
   */
  validateExperiment(experiment) {
    // Check allocation sums to 1
    const totalAllocation = Object.values(experiment.allocation).reduce((sum, val) => sum + val, 0);
    if (Math.abs(totalAllocation - 1.0) > 0.001) {
      throw new Error('Variant allocations must sum to 1.0');
    }
    
    // Validate metrics
    if (!experiment.metrics || experiment.metrics.length === 0) {
      throw new Error('Experiment must specify at least one metric to track');
    }
    
    // Validate success criteria
    if (!experiment.criteria.successMetric) {
      throw new Error('Experiment must specify a success metric');
    }
  }

  /**
   * Select variant for assignment
   */
  selectVariant(experiment, subjectId, context) {
    // Use deterministic hash for consistent assignment
    const hash = this.hashSubject(subjectId, experiment.id);
    const random = hash / 0xffffffff; // Normalize to 0-1
    
    let cumulative = 0;
    for (const variant of experiment.variants) {
      cumulative += experiment.allocation[variant.id];
      if (random < cumulative) {
        return variant;
      }
    }
    
    // Fallback to last variant
    return experiment.variants[experiment.variants.length - 1];
  }

  /**
   * Hash subject ID for deterministic assignment
   */
  hashSubject(subjectId, experimentId) {
    const str = `${subjectId}:${experimentId}`;
    let hash = 0;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash);
  }

  /**
   * Analyze individual variant
   */
  async analyzeVariant(experiment, variant) {
    const resultsKey = `${experiment.id}:${variant.id}`;
    const results = this.results.get(resultsKey) || {
      conversions: [],
      assignments: 0,
      metrics: new Map()
    };
    
    const analysis = {
      id: variant.id,
      name: variant.name,
      assignments: results.assignments,
      conversions: results.conversions.length,
      conversionRate: results.assignments > 0 ? results.conversions.length / results.assignments : 0,
      metrics: {}
    };
    
    // Analyze each metric
    for (const metric of experiment.metrics) {
      const values = results.metrics.get(metric) || [];
      analysis.metrics[metric] = this.analyzeMetricValues(values);
    }
    
    return analysis;
  }

  /**
   * Analyze metric values
   */
  analyzeMetricValues(values) {
    if (values.length === 0) {
      return {
        count: 0,
        mean: 0,
        median: 0,
        stddev: 0,
        min: 0,
        max: 0
      };
    }
    
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return {
      count: values.length,
      mean,
      median: this.calculateMedian(sorted),
      stddev: Math.sqrt(variance),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p25: this.calculatePercentile(sorted, 0.25),
      p75: this.calculatePercentile(sorted, 0.75)
    };
  }

  /**
   * Calculate median value
   */
  calculateMedian(sortedValues) {
    const mid = Math.floor(sortedValues.length / 2);
    return sortedValues.length % 2 === 0
      ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
      : sortedValues[mid];
  }

  /**
   * Calculate percentile
   */
  calculatePercentile(sortedValues, percentile) {
    const index = percentile * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;
    
    if (lower === upper) return sortedValues[lower];
    
    return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
  }

  /**
   * Perform statistical analysis
   */
  performStatisticalAnalysis(experiment, variants) {
    if (variants.length < 2) return {};
    
    const control = variants[0]; // First variant is control
    const treatments = variants.slice(1);
    
    const analysis = {
      sampleSizes: variants.map(v => v.assignments),
      totalSampleSize: variants.reduce((sum, v) => sum + v.assignments, 0),
      comparisons: [],
      overallSignificance: null,
      recommendedWinner: null
    };
    
    // Compare each treatment to control
    treatments.forEach(treatment => {
      const comparison = this.compareVariants(experiment, control, treatment);
      analysis.comparisons.push(comparison);
    });
    
    // Apply multiple testing correction
    analysis.correctedComparisons = this.applyMultipleTestingCorrection(analysis.comparisons);
    
    // Determine overall significance
    analysis.overallSignificance = this.determineOverallSignificance(analysis.correctedComparisons);
    
    // Recommend winner
    analysis.recommendedWinner = this.recommendWinner(experiment, variants, analysis);
    
    return analysis;
  }

  /**
   * Compare two variants statistically
   */
  compareVariants(experiment, control, treatment) {
    const metric = experiment.criteria.successMetric;
    
    // Get conversion rates
    const controlRate = control.conversionRate;
    const treatmentRate = treatment.conversionRate;
    
    // Calculate effect size
    const absoluteEffect = treatmentRate - controlRate;
    const relativeEffect = controlRate > 0 ? absoluteEffect / controlRate : 0;
    
    // Perform significance test (simplified)
    const significance = this.performSignificanceTest(
      control.conversions, control.assignments,
      treatment.conversions, treatment.assignments
    );
    
    return {
      control: { id: control.id, rate: controlRate, sample: control.assignments },
      treatment: { id: treatment.id, rate: treatmentRate, sample: treatment.assignments },
      effect: {
        absolute: absoluteEffect,
        relative: relativeEffect,
        size: this.categorizeEffectSize(Math.abs(relativeEffect))
      },
      significance: significance,
      recommendation: this.generateVariantRecommendation(significance, relativeEffect)
    };
  }

  /**
   * Perform significance test (simplified z-test for proportions)
   */
  performSignificanceTest(controlSuccesses, controlTrials, treatmentSuccesses, treatmentTrials) {
    if (controlTrials === 0 || treatmentTrials === 0) {
      return { pValue: 1, significant: false, confidence: 0 };
    }
    
    const p1 = controlSuccesses / controlTrials;
    const p2 = treatmentSuccesses / treatmentTrials;
    const pooled = (controlSuccesses + treatmentSuccesses) / (controlTrials + treatmentTrials);
    
    const se = Math.sqrt(pooled * (1 - pooled) * (1 / controlTrials + 1 / treatmentTrials));
    const z = se > 0 ? (p2 - p1) / se : 0;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z))); // Two-tailed test
    
    return {
      pValue,
      zScore: z,
      significant: pValue < this.options.defaultSignificanceLevel,
      confidence: 1 - pValue
    };
  }

  /**
   * Normal CDF approximation
   */
  normalCDF(z) {
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }

  /**
   * Error function approximation
   */
  erf(x) {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;
    
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);
    
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    
    return sign * y;
  }

  /**
   * Categorize effect size
   */
  categorizeEffectSize(effectSize) {
    const thresholds = this.statisticalConfig.effectSizeThresholds;
    
    if (effectSize >= thresholds.large) return 'large';
    if (effectSize >= thresholds.medium) return 'medium';
    if (effectSize >= thresholds.small) return 'small';
    return 'negligible';
  }

  /**
   * Generate variant recommendation
   */
  generateVariantRecommendation(significance, relativeEffect) {
    if (!significance.significant) {
      return 'inconclusive';
    }
    
    if (relativeEffect > 0.05) return 'treatment_wins';
    if (relativeEffect < -0.05) return 'control_wins';
    return 'no_practical_difference';
  }

  /**
   * Apply multiple testing correction
   */
  applyMultipleTestingCorrection(comparisons) {
    const method = this.statisticalConfig.multipleTestingCorrection;
    
    if (method === 'bonferroni') {
      return comparisons.map(comp => ({
        ...comp,
        correctedPValue: Math.min(comp.significance.pValue * comparisons.length, 1),
        significantAfterCorrection: comp.significance.pValue * comparisons.length < this.options.defaultSignificanceLevel
      }));
    }
    
    // Default: no correction
    return comparisons.map(comp => ({
      ...comp,
      correctedPValue: comp.significance.pValue,
      significantAfterCorrection: comp.significance.significant
    }));
  }

  /**
   * Determine overall significance
   */
  determineOverallSignificance(correctedComparisons) {
    const significantComparisons = correctedComparisons.filter(c => c.significantAfterCorrection);
    
    return {
      anySignificant: significantComparisons.length > 0,
      significantCount: significantComparisons.length,
      totalComparisons: correctedComparisons.length,
      overallPValue: Math.min(...correctedComparisons.map(c => c.correctedPValue))
    };
  }

  /**
   * Recommend winner
   */
  recommendWinner(experiment, variants, analysis) {
    const significantComparisons = analysis.correctedComparisons.filter(c => c.significantAfterCorrection);
    
    if (significantComparisons.length === 0) {
      return { 
        winner: null, 
        confidence: 'low', 
        reason: 'No statistically significant differences found' 
      };
    }
    
    // Find best performing variant
    const bestComparison = significantComparisons.reduce((best, comp) => {
      return comp.effect.relative > best.effect.relative ? comp : best;
    });
    
    const winnerVariant = variants.find(v => v.id === bestComparison.treatment.id);
    
    return {
      winner: winnerVariant,
      confidence: bestComparison.effect.size === 'large' ? 'high' : 
                  bestComparison.effect.size === 'medium' ? 'medium' : 'low',
      reason: `${winnerVariant.name} shows ${(bestComparison.effect.relative * 100).toFixed(1)}% improvement with ${bestComparison.effect.size} effect size`,
      effectSize: bestComparison.effect.size,
      improvement: bestComparison.effect.relative
    };
  }

  /**
   * Generate recommendations
   */
  generateRecommendations(experiment, analysis) {
    const recommendations = [];
    
    // Sample size recommendations
    const totalSample = analysis.statistical.totalSampleSize;
    if (totalSample < experiment.criteria.minSampleSize) {
      recommendations.push({
        type: 'sample_size',
        priority: 'high',
        message: `Increase sample size to ${experiment.criteria.minSampleSize} for reliable results`,
        action: 'continue_experiment'
      });
    }
    
    // Winner recommendation
    if (analysis.statistical.recommendedWinner?.winner) {
      const winner = analysis.statistical.recommendedWinner;
      recommendations.push({
        type: 'winner',
        priority: winner.confidence === 'high' ? 'high' : 'medium',
        message: `Implement ${winner.winner.name}: ${winner.reason}`,
        action: 'implement_winner'
      });
    }
    
    // Power analysis
    const power = this.calculateStatisticalPower(analysis);
    if (power < this.statisticalConfig.powerAnalysisTarget) {
      recommendations.push({
        type: 'statistical_power',
        priority: 'medium',
        message: `Current statistical power is ${(power * 100).toFixed(1)}%, consider extending experiment`,
        action: 'extend_experiment'
      });
    }
    
    return recommendations;
  }

  /**
   * Calculate statistical power (simplified)
   */
  calculateStatisticalPower(analysis) {
    // Simplified power calculation
    const totalSample = analysis.statistical.totalSampleSize;
    const effect = analysis.statistical.comparisons[0]?.effect.absolute || 0;
    
    // This is a very simplified calculation
    // In practice, you'd use proper power analysis formulas
    if (totalSample < 30) return 0.3;
    if (totalSample < 100) return 0.5;
    if (totalSample < 500) return 0.7;
    return 0.8 + Math.min(Math.abs(effect) * 2, 0.15);
  }

  /**
   * Schedule analysis if conditions are met
   */
  scheduleAnalysis(experimentId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') return;
    
    // Check if we should auto-analyze
    const lastAnalysis = experiment.lastAutoAnalysis || 0;
    const now = Date.now();
    
    if (now - lastAnalysis > this.options.autoAnalyzeInterval) {
      experiment.lastAutoAnalysis = now;
      
      // Schedule async analysis
      setImmediate(async () => {
        try {
          await this.analyzeExperiment(experimentId);
        } catch (error) {
          this.emit('error', { type: 'auto_analysis', experimentId, error: error.message });
        }
      });
    }
  }

  /**
   * Start auto-analysis timer
   */
  startAutoAnalysis() {
    setInterval(() => {
      for (const experiment of this.experiments.values()) {
        if (experiment.status === 'running') {
          this.scheduleAnalysis(experiment.id);
        }
      }
    }, this.options.autoAnalyzeInterval).unref();
  }

  /**
   * Generate experiment ID
   */
  generateExperimentId() {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save experiment to disk
   */
  async saveExperiment(experiment) {
    const filePath = path.join(this.options.storageDir, 'experiments', `${experiment.id}.json`);
    
    // Convert Maps to objects for serialization
    const serializable = {
      ...experiment,
      assignments: Object.fromEntries(experiment.assignments)
    };
    
    await fs.writeJson(filePath, serializable, { spaces: 2 });
  }

  /**
   * Save analysis to disk
   */
  async saveAnalysis(analysis) {
    const filePath = path.join(this.options.storageDir, 'results', `${analysis.experimentId}_${analysis.timestamp}.json`);
    await fs.writeJson(filePath, analysis, { spaces: 2 });
  }

  /**
   * Load existing experiments
   */
  async loadExistingExperiments() {
    const experimentsDir = path.join(this.options.storageDir, 'experiments');
    
    if (!(await fs.pathExists(experimentsDir))) return;
    
    const files = await fs.readdir(experimentsDir);
    
    for (const file of files.filter(f => f.endsWith('.json'))) {
      try {
        const filePath = path.join(experimentsDir, file);
        const data = await fs.readJson(filePath);
        
        // Convert assignments back to Map
        data.assignments = new Map(Object.entries(data.assignments || {}));
        
        this.experiments.set(data.id, data);
      } catch (error) {
        console.warn(`Failed to load experiment from ${file}:`, error.message);
      }
    }
  }

  /**
   * Get experiment status
   */
  getExperimentStatus(experimentId) {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;
    
    const variants = experiment.variants.map(variant => {
      const resultsKey = `${experimentId}:${variant.id}`;
      const results = this.results.get(resultsKey) || { assignments: 0, conversions: [] };
      
      return {
        id: variant.id,
        name: variant.name,
        assignments: results.assignments,
        conversions: results.conversions.length
      };
    });
    
    return {
      id: experiment.id,
      name: experiment.name,
      status: experiment.status,
      variants,
      totalAssignments: variants.reduce((sum, v) => sum + v.assignments, 0),
      duration: experiment.startedAt ? Date.now() - experiment.startedAt : 0
    };
  }

  /**
   * List all experiments
   */
  listExperiments() {
    return Array.from(this.experiments.values()).map(exp => ({
      id: exp.id,
      name: exp.name,
      hypothesis: exp.hypothesis,
      status: exp.status,
      createdAt: exp.createdAt,
      startedAt: exp.startedAt,
      variantCount: exp.variants.length
    }));
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    // Stop all running experiments
    const runningExperiments = Array.from(this.experiments.values())
      .filter(exp => exp.status === 'running');
    
    for (const experiment of runningExperiments) {
      await this.stopExperiment(experiment.id, 'cleanup');
    }
    
    this.emit('cleanup_complete');
  }
}

module.exports = ExperimentFramework;