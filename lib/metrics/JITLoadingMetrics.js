const MetricsCollector = require('./MetricsCollector');

/**
 * JITLoadingMetrics - Hypothesis 1 Validation
 * 
 * Tests the hypothesis that Just-in-Time context loading is more efficient 
 * than preloading all context upfront.
 * 
 * Key Metrics:
 * - Context load time reduction >30%
 * - Memory usage reduction >25% 
 * - Context relevance score improvement
 * - Cache hit rates and efficiency
 */
class JITLoadingMetrics extends MetricsCollector {
  constructor(options = {}) {
    super(options);
    
    this.hypothesis = 'h1_jitLoading';
    this.contextLoads = [];
    this.memorySnapshots = [];
    this.cacheMetrics = [];
    this.relevanceScores = [];
    
    // Initialize specific config for JIT metrics
    this.jitConfig = {
      contextSizeThreshold: 5000, // tokens
      loadTimeThreshold: 1000, // ms
      memoryThreshold: 100, // MB
      relevanceThreshold: 0.8,
      ...options.jitConfig
    };
  }

  /**
   * Record context loading event
   */
  async recordContextLoad(data) {
    const loadEvent = {
      contextId: data.contextId || this.generateId(),
      agentId: data.agentId,
      loadType: data.loadType || 'jit', // 'jit' or 'preload'
      startTime: data.startTime,
      endTime: data.endTime || Date.now(),
      contextSize: data.contextSize || 0, // in tokens
      memoryUsage: data.memoryUsage || process.memoryUsage(),
      success: data.success !== false,
      cacheHit: data.cacheHit || false,
      relevanceScore: data.relevanceScore || 0,
      metadata: data.metadata || {}
    };

    loadEvent.loadTime = loadEvent.endTime - loadEvent.startTime;
    loadEvent.efficiency = this.calculateLoadingEfficiency(loadEvent);

    this.contextLoads.push(loadEvent);

    // Store metric
    await this.store('context_load', loadEvent, {
      hypothesis: this.hypothesis,
      experiment: data.experiment || 'default'
    });

    // Update real-time calculations
    this.updateMemorySnapshot(loadEvent);
    this.updateCacheMetrics(loadEvent);
    this.updateRelevanceTracking(loadEvent);

    return loadEvent.contextId;
  }

  /**
   * Record context unload/cleanup event
   */
  async recordContextUnload(data) {
    const unloadEvent = {
      contextId: data.contextId,
      agentId: data.agentId,
      unloadTime: Date.now(),
      memoryFreed: data.memoryFreed || 0,
      retentionDuration: data.retentionDuration || 0,
      usageCount: data.usageCount || 0,
      finalRelevanceScore: data.finalRelevanceScore || 0
    };

    await this.store('context_unload', unloadEvent, {
      hypothesis: this.hypothesis
    });

    // Update context lifecycle tracking
    this.updateContextLifecycle(unloadEvent);

    return unloadEvent.contextId;
  }

  /**
   * Record cache performance metrics
   */
  async recordCachePerformance(data) {
    const cacheEvent = {
      operation: data.operation, // 'hit', 'miss', 'evict'
      contextId: data.contextId,
      cacheKey: data.cacheKey,
      timestamp: Date.now(),
      accessTime: data.accessTime || 0,
      cacheSize: data.cacheSize || 0,
      hitRate: data.hitRate || 0
    };

    this.cacheMetrics.push(cacheEvent);

    await this.store('cache_performance', cacheEvent, {
      hypothesis: this.hypothesis
    });
  }

  /**
   * Record context relevance assessment
   */
  async recordContextRelevance(data) {
    const relevanceEvent = {
      contextId: data.contextId,
      agentId: data.agentId,
      taskType: data.taskType,
      relevanceScore: data.relevanceScore,
      actualUsage: data.actualUsage, // 'high', 'medium', 'low', 'unused'
      predictionAccuracy: data.predictionAccuracy || 0,
      timestamp: Date.now()
    };

    this.relevanceScores.push(relevanceEvent);

    await this.store('context_relevance', relevanceEvent, {
      hypothesis: this.hypothesis
    });
  }

  /**
   * Calculate loading efficiency metric
   */
  calculateLoadingEfficiency(loadEvent) {
    // Efficiency = Context Size / Load Time (tokens per ms)
    if (loadEvent.loadTime === 0) return 0;
    return loadEvent.contextSize / loadEvent.loadTime;
  }

  /**
   * Update memory usage snapshots
   */
  updateMemorySnapshot(loadEvent) {
    const snapshot = {
      timestamp: Date.now(),
      heapUsed: loadEvent.memoryUsage.heapUsed,
      heapTotal: loadEvent.memoryUsage.heapTotal,
      external: loadEvent.memoryUsage.external,
      contextId: loadEvent.contextId
    };

    this.memorySnapshots.push(snapshot);

    // Keep only last 100 snapshots for performance
    if (this.memorySnapshots.length > 100) {
      this.memorySnapshots = this.memorySnapshots.slice(-100);
    }
  }

  /**
   * Update cache performance metrics
   */
  updateCacheMetrics(loadEvent) {
    if (loadEvent.cacheHit) {
      this.recordCachePerformance({
        operation: 'hit',
        contextId: loadEvent.contextId,
        accessTime: loadEvent.loadTime
      });
    } else {
      this.recordCachePerformance({
        operation: 'miss',
        contextId: loadEvent.contextId,
        accessTime: loadEvent.loadTime
      });
    }
  }

  /**
   * Update relevance tracking
   */
  updateRelevanceTracking(loadEvent) {
    if (loadEvent.relevanceScore > 0) {
      this.recordContextRelevance({
        contextId: loadEvent.contextId,
        agentId: loadEvent.agentId,
        relevanceScore: loadEvent.relevanceScore,
        actualUsage: this.categorizeUsage(loadEvent.relevanceScore)
      });
    }
  }

  /**
   * Update context lifecycle information
   */
  updateContextLifecycle(unloadEvent) {
    const loadEvent = this.contextLoads.find(load => load.contextId === unloadEvent.contextId);
    if (loadEvent) {
      loadEvent.lifecycle = {
        retentionDuration: unloadEvent.retentionDuration,
        usageCount: unloadEvent.usageCount,
        memoryFreed: unloadEvent.memoryFreed,
        finalRelevanceScore: unloadEvent.finalRelevanceScore
      };
    }
  }

  /**
   * Categorize usage based on relevance score
   */
  categorizeUsage(relevanceScore) {
    if (relevanceScore >= 0.8) return 'high';
    if (relevanceScore >= 0.6) return 'medium';
    if (relevanceScore >= 0.3) return 'low';
    return 'unused';
  }

  /**
   * Perform JIT-specific aggregation
   */
  performAggregation(metrics) {
    const baseAggregation = super.performAggregation(metrics);
    
    const contextLoadMetrics = metrics.filter(m => m.eventType === 'context_load');
    const jitLoads = contextLoadMetrics.filter(m => m.data.loadType === 'jit');
    const preloadMetrics = contextLoadMetrics.filter(m => m.data.loadType === 'preload');

    return {
      ...baseAggregation,
      contextLoading: {
        totalLoads: contextLoadMetrics.length,
        jitLoads: jitLoads.length,
        preloads: preloadMetrics.length,
        averageLoadTime: this.calculateAverageLoadTime(contextLoadMetrics),
        averageContextSize: this.calculateAverageContextSize(contextLoadMetrics),
        averageMemoryUsage: this.calculateAverageMemoryUsage(contextLoadMetrics),
        cacheHitRate: this.calculateCacheHitRate(contextLoadMetrics),
        averageRelevance: this.calculateAverageRelevance(contextLoadMetrics)
      },
      comparison: {
        jitVsPreload: this.compareJITvsPreload(jitLoads, preloadMetrics)
      },
      efficiency: {
        loadingEfficiency: this.calculateOverallEfficiency(contextLoadMetrics),
        memoryEfficiency: this.calculateMemoryEfficiency(),
        cacheEfficiency: this.calculateCacheEfficiency()
      }
    };
  }

  /**
   * Calculate average load time
   */
  calculateAverageLoadTime(metrics) {
    if (metrics.length === 0) return 0;
    const totalTime = metrics.reduce((sum, m) => sum + m.data.loadTime, 0);
    return totalTime / metrics.length;
  }

  /**
   * Calculate average context size
   */
  calculateAverageContextSize(metrics) {
    if (metrics.length === 0) return 0;
    const totalSize = metrics.reduce((sum, m) => sum + (m.data.contextSize || 0), 0);
    return totalSize / metrics.length;
  }

  /**
   * Calculate average memory usage
   */
  calculateAverageMemoryUsage(metrics) {
    if (metrics.length === 0) return 0;
    const totalMemory = metrics.reduce((sum, m) => {
      return sum + (m.data.memoryUsage?.heapUsed || 0);
    }, 0);
    return totalMemory / metrics.length;
  }

  /**
   * Calculate cache hit rate
   */
  calculateCacheHitRate(metrics) {
    if (metrics.length === 0) return 0;
    const cacheHits = metrics.filter(m => m.data.cacheHit).length;
    return cacheHits / metrics.length;
  }

  /**
   * Calculate average relevance score
   */
  calculateAverageRelevance(metrics) {
    const relevantMetrics = metrics.filter(m => m.data.relevanceScore > 0);
    if (relevantMetrics.length === 0) return 0;
    
    const totalRelevance = relevantMetrics.reduce((sum, m) => sum + m.data.relevanceScore, 0);
    return totalRelevance / relevantMetrics.length;
  }

  /**
   * Compare JIT loading vs Preloading performance
   */
  compareJITvsPreload(jitMetrics, preloadMetrics) {
    return {
      loadTime: {
        jit: this.calculateAverageLoadTime(jitMetrics),
        preload: this.calculateAverageLoadTime(preloadMetrics),
        improvement: this.calculateImprovement(
          this.calculateAverageLoadTime(preloadMetrics),
          this.calculateAverageLoadTime(jitMetrics)
        )
      },
      contextSize: {
        jit: this.calculateAverageContextSize(jitMetrics),
        preload: this.calculateAverageContextSize(preloadMetrics),
        reduction: this.calculateReduction(
          this.calculateAverageContextSize(preloadMetrics),
          this.calculateAverageContextSize(jitMetrics)
        )
      },
      memoryUsage: {
        jit: this.calculateAverageMemoryUsage(jitMetrics),
        preload: this.calculateAverageMemoryUsage(preloadMetrics),
        reduction: this.calculateReduction(
          this.calculateAverageMemoryUsage(preloadMetrics),
          this.calculateAverageMemoryUsage(jitMetrics)
        )
      }
    };
  }

  /**
   * Calculate improvement percentage
   */
  calculateImprovement(baseline, current) {
    if (baseline === 0) return 0;
    return (baseline - current) / baseline;
  }

  /**
   * Calculate reduction percentage
   */
  calculateReduction(baseline, current) {
    if (baseline === 0) return 0;
    return (baseline - current) / baseline;
  }

  /**
   * Calculate overall loading efficiency
   */
  calculateOverallEfficiency(metrics) {
    if (metrics.length === 0) return 0;
    const totalEfficiency = metrics.reduce((sum, m) => sum + (m.data.efficiency || 0), 0);
    return totalEfficiency / metrics.length;
  }

  /**
   * Calculate memory efficiency
   */
  calculateMemoryEfficiency() {
    if (this.memorySnapshots.length === 0) return 0;
    
    const baseline = this.baseline?.measurements?.context?.memoryUsage || 150; // MB
    const current = this.memorySnapshots[this.memorySnapshots.length - 1];
    const currentMB = (current.heapUsed / 1024 / 1024);
    
    return this.calculateReduction(baseline, currentMB);
  }

  /**
   * Calculate cache efficiency
   */
  calculateCacheEfficiency() {
    if (this.cacheMetrics.length === 0) return 0;
    
    const hits = this.cacheMetrics.filter(m => m.operation === 'hit').length;
    const total = this.cacheMetrics.length;
    
    return hits / total;
  }

  /**
   * Perform JIT-specific analysis
   */
  performAnalysis(metrics) {
    const baseAnalysis = super.performAnalysis(metrics);
    
    const contextMetrics = metrics.filter(m => m.eventType === 'context_load');
    const jitMetrics = contextMetrics.filter(m => m.data.loadType === 'jit');
    
    return {
      ...baseAnalysis,
      hypothesisValidation: {
        contextSizeReduction: this.calculateContextSizeReduction(contextMetrics),
        loadTimeImprovement: this.calculateLoadTimeImprovement(contextMetrics),
        memoryEfficiencyGain: this.calculateMemoryEfficiency(),
        relevanceImprovement: this.calculateRelevanceImprovement(contextMetrics),
        cacheEffectiveness: this.calculateCacheEfficiency()
      },
      trends: {
        loadTimesTrend: this.calculateTrend(contextMetrics, 'loadTime'),
        contextSizeTrend: this.calculateTrend(contextMetrics, 'contextSize'),
        memoryUsageTrend: this.calculateMemoryTrend(),
        relevanceTrend: this.calculateTrend(contextMetrics, 'relevanceScore')
      },
      predictions: {
        projectedImprovement: this.projectImprovement(contextMetrics),
        timeToTargetReduction: this.estimateTimeToTarget(contextMetrics),
        confidenceTrajectory: this.projectConfidenceTrajectory(contextMetrics)
      }
    };
  }

  /**
   * Calculate context size reduction compared to baseline
   */
  calculateContextSizeReduction(metrics) {
    if (metrics.length === 0) return 0;
    
    const baseline = this.baseline?.measurements?.context?.averageSize || 10000;
    const current = this.calculateAverageContextSize(metrics);
    
    return this.calculateReduction(baseline, current);
  }

  /**
   * Calculate load time improvement compared to baseline
   */
  calculateLoadTimeImprovement(metrics) {
    if (metrics.length === 0) return 0;
    
    const baseline = this.baseline?.measurements?.context?.loadTime || 500;
    const current = this.calculateAverageLoadTime(metrics);
    
    return this.calculateImprovement(baseline, current);
  }

  /**
   * Calculate relevance improvement compared to baseline
   */
  calculateRelevanceImprovement(metrics) {
    if (metrics.length === 0) return 0;
    
    const baseline = this.baseline?.measurements?.context?.relevanceScore || 0.7;
    const current = this.calculateAverageRelevance(metrics);
    
    return this.calculateImprovement(baseline, current);
  }

  /**
   * Calculate trend for a specific metric
   */
  calculateTrend(metrics, property) {
    if (metrics.length < 2) return 'insufficient_data';
    
    const values = metrics.map(m => m.data[property]).filter(v => v != null);
    if (values.length < 2) return 'insufficient_data';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    if (secondAvg < firstAvg * 0.95) return 'improving';
    if (secondAvg > firstAvg * 1.05) return 'degrading';
    return 'stable';
  }

  /**
   * Calculate memory usage trend
   */
  calculateMemoryTrend() {
    if (this.memorySnapshots.length < 2) return 'insufficient_data';
    
    const values = this.memorySnapshots.map(s => s.heapUsed);
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    if (secondAvg < firstAvg * 0.95) return 'improving';
    if (secondAvg > firstAvg * 1.05) return 'degrading';
    return 'stable';
  }

  /**
   * Project future improvement based on current trends
   */
  projectImprovement(metrics) {
    const reductionRate = this.calculateContextSizeReduction(metrics);
    const trend = this.calculateTrend(metrics, 'contextSize');
    
    if (trend === 'improving') {
      return Math.min(reductionRate * 1.2, 0.5); // Cap at 50% improvement
    } else if (trend === 'degrading') {
      return Math.max(reductionRate * 0.8, 0);
    }
    
    return reductionRate;
  }

  /**
   * Estimate time to reach target reduction
   */
  estimateTimeToTarget(metrics) {
    const currentReduction = this.calculateContextSizeReduction(metrics);
    const targetReduction = this.config.hypotheses.h1_jitLoading.targetReduction;
    
    if (currentReduction >= targetReduction) return 0;
    
    const trend = this.calculateTrend(metrics, 'contextSize');
    const improvementRate = trend === 'improving' ? 0.05 : 0.02; // 5% or 2% per hour
    
    const remainingReduction = targetReduction - currentReduction;
    return Math.ceil(remainingReduction / improvementRate); // Hours
  }

  /**
   * Project confidence trajectory
   */
  projectConfidenceTrajectory(metrics) {
    const currentConfidence = this.calculateConfidence(metrics.length);
    const targetSampleSize = 1000;
    const currentSampleSize = metrics.length;
    
    if (currentSampleSize >= targetSampleSize) return currentConfidence;
    
    const samplesNeeded = targetSampleSize - currentSampleSize;
    const estimatedHours = samplesNeeded / 10; // Assume 10 samples per hour
    
    return {
      current: currentConfidence,
      target: 0.95,
      estimatedHoursToTarget: estimatedHours
    };
  }

  /**
   * Validate H1: JIT Context Loading hypothesis
   */
  validateHypotheses(metrics) {
    const contextMetrics = metrics.filter(m => m.eventType === 'context_load');
    const analysis = this.performAnalysis(metrics);
    
    const h1Validation = {
      hypothesis: 'JIT Context Loading is more efficient than preloading',
      validated: false,
      confidence: this.calculateConfidence(contextMetrics.length),
      evidence: [],
      metrics: {
        contextSizeReduction: analysis.hypothesisValidation?.contextSizeReduction || 0,
        loadTimeImprovement: analysis.hypothesisValidation?.loadTimeImprovement || 0,
        memoryEfficiencyGain: analysis.hypothesisValidation?.memoryEfficiencyGain || 0,
        relevanceImprovement: analysis.hypothesisValidation?.relevanceImprovement || 0
      },
      criteria: {
        targetReduction: this.config.hypotheses.h1_jitLoading.targetReduction,
        confidenceThreshold: this.config.hypotheses.h1_jitLoading.confidenceThreshold
      }
    };

    // Check validation criteria
    const meetsReduction = h1Validation.metrics.contextSizeReduction >= h1Validation.criteria.targetReduction;
    const meetsConfidence = h1Validation.confidence >= h1Validation.criteria.confidenceThreshold;
    
    h1Validation.validated = meetsReduction && meetsConfidence;

    // Collect evidence
    if (meetsReduction) {
      h1Validation.evidence.push(`Context size reduced by ${(h1Validation.metrics.contextSizeReduction * 100).toFixed(1)}% (target: ${(h1Validation.criteria.targetReduction * 100).toFixed(1)}%)`);
    }
    if (h1Validation.metrics.loadTimeImprovement > 0) {
      h1Validation.evidence.push(`Load time improved by ${(h1Validation.metrics.loadTimeImprovement * 100).toFixed(1)}%`);
    }
    if (h1Validation.metrics.memoryEfficiencyGain > 0) {
      h1Validation.evidence.push(`Memory usage reduced by ${(h1Validation.metrics.memoryEfficiencyGain * 100).toFixed(1)}%`);
    }
    if (h1Validation.metrics.relevanceImprovement > 0) {
      h1Validation.evidence.push(`Context relevance improved by ${(h1Validation.metrics.relevanceImprovement * 100).toFixed(1)}%`);
    }

    return {
      h1_jitLoading: h1Validation,
      h2_hubSpoke: { validated: false, confidence: 0, evidence: [] },
      h3_tddHandoffs: { validated: false, confidence: 0, evidence: [] }
    };
  }
}

module.exports = JITLoadingMetrics;