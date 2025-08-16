const fs = require('fs-extra');
const path = require('path');
const EventEmitter = require('events');

/**
 * MetricsCollector - Base class for research metrics collection
 * 
 * Provides foundational functionality for collecting, storing, and analyzing
 * metrics to validate the three core research hypotheses:
 * - H1: JIT Context Loading efficiency
 * - H2: Hub-and-Spoke coordination effectiveness  
 * - H3: Test-Driven Development handoff quality
 */
class MetricsCollector extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      storageDir: options.storageDir || path.join(process.cwd(), '.claude-collective', 'metrics'),
      enableRealTime: options.enableRealTime !== false,
      aggregationInterval: options.aggregationInterval || 60000, // 1 minute
      retentionPeriod: options.retentionPeriod || 30 * 24 * 60 * 60 * 1000, // 30 days
      ...options
    };
    
    this.sessionId = Date.now().toString();
    this.sessionStartTime = Date.now();
    this.dataBuffer = [];
    this.aggregationTimer = null;
    this.isInitialized = false;
    
    // Storage paths
    this.paths = {
      snapshots: path.join(this.options.storageDir, 'snapshots'),
      aggregations: path.join(this.options.storageDir, 'aggregations'),
      reports: path.join(this.options.storageDir, 'reports'),
      sessions: path.join(this.options.storageDir, 'sessions'),
      baseline: path.join(this.options.storageDir, 'baseline.json'),
      config: path.join(this.options.storageDir, 'config.json')
    };
  }

  /**
   * Initialize the metrics collection system
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Create storage directories
      await this.createStorageDirectories();
      
      // Load or create configuration
      await this.loadConfiguration();
      
      // Load or establish baseline metrics
      await this.loadBaseline();
      
      // Start aggregation timer
      this.startAggregationTimer();
      
      // Set up cleanup on exit
      this.setupCleanupHandlers();
      
      this.isInitialized = true;
      this.emit('initialized', { sessionId: this.sessionId });
      
    } catch (error) {
      this.emit('error', { type: 'initialization', error: error.message });
      throw error;
    }
  }

  /**
   * Create necessary storage directories
   */
  async createStorageDirectories() {
    for (const dirPath of Object.values(this.paths).filter(p => !p.endsWith('.json'))) {
      await fs.ensureDir(dirPath);
    }
  }

  /**
   * Load or create configuration
   */
  async loadConfiguration() {
    if (await fs.pathExists(this.paths.config)) {
      const config = await fs.readJson(this.paths.config);
      this.config = { ...this.getDefaultConfig(), ...config };
    } else {
      this.config = this.getDefaultConfig();
      await this.saveConfiguration();
    }
  }

  /**
   * Get default configuration for metrics collection
   */
  getDefaultConfig() {
    return {
      hypotheses: {
        h1_jitLoading: {
          name: 'JIT Context Loading',
          description: 'On-demand context loading is more efficient than preloading',
          targetReduction: 0.3, // 30% reduction in context size
          confidenceThreshold: 0.95
        },
        h2_hubSpoke: {
          name: 'Hub-and-Spoke Coordination', 
          description: 'Centralized routing outperforms distributed communication',
          targetCompliance: 0.9, // 90% routing compliance
          confidenceThreshold: 0.95
        },
        h3_tddHandoffs: {
          name: 'Test-Driven Development Handoffs',
          description: 'Contract-based handoffs improve quality and reduce errors',
          targetSuccessRate: 0.8, // 80% handoff success rate
          confidenceThreshold: 0.95
        }
      },
      collection: {
        bufferSize: 100,
        flushInterval: 30000, // 30 seconds
        enableValidation: true,
        enableCompression: true
      },
      analysis: {
        minSampleSize: 30,
        confidenceLevel: 0.95,
        significanceLevel: 0.05
      }
    };
  }

  /**
   * Save current configuration to disk
   */
  async saveConfiguration() {
    await fs.writeJson(this.paths.config, this.config, { spaces: 2 });
  }

  /**
   * Load or create baseline metrics for comparison
   */
  async loadBaseline() {
    if (await fs.pathExists(this.paths.baseline)) {
      this.baseline = await fs.readJson(this.paths.baseline);
    } else {
      this.baseline = await this.createBaseline();
      await fs.writeJson(this.paths.baseline, this.baseline, { spaces: 2 });
    }
  }

  /**
   * Create baseline metrics (pre-collective system measurements)
   */
  async createBaseline() {
    return {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      version: '1.0.0',
      measurements: {
        context: {
          averageSize: 10000, // tokens
          loadTime: 500, // ms
          memoryUsage: 150, // MB
          retentionRate: 0.6,
          relevanceScore: 0.7
        },
        coordination: {
          directImplementation: 1.0, // 100% before hub-spoke
          routingCompliance: 0.0,
          peerToPeerCommunication: 1.0,
          coordinationOverhead: 0.0,
          routingErrors: 0.0
        },
        handoffs: {
          successRate: 0.0, // No formal handoffs before TDD
          validationTime: 0,
          retryRate: 0.0,
          contractCoverage: 0.0,
          errorDetectionRate: 0.0
        }
      }
    };
  }

  /**
   * Store a metric data point
   */
  async store(eventType, data, metadata = {}) {
    const metric = {
      id: this.generateId(),
      sessionId: this.sessionId,
      timestamp: Date.now(),
      eventType,
      data: this.sanitizeData(data),
      metadata: {
        ...metadata,
        version: '1.0.0',
        collector: this.constructor.name
      }
    };

    // Validate data
    if (this.config?.collection?.enableValidation && !this.validateMetric(metric)) {
      this.emit('validation_error', { metric, reason: 'Invalid metric format' });
      return false;
    }

    // Add to buffer
    this.dataBuffer.push(metric);

    // Flush if buffer is full
    if (this.dataBuffer.length >= this.config.collection.bufferSize) {
      await this.flushBuffer();
    }

    // Emit for real-time processing
    if (this.options.enableRealTime) {
      this.emit('metric_collected', metric);
    }

    return true;
  }

  /**
   * Retrieve metrics with filtering
   */
  async retrieve(filters = {}) {
    const results = [];
    
    // Search through snapshot files
    const snapshotFiles = await fs.readdir(this.paths.snapshots);
    
    for (const file of snapshotFiles.filter(f => f.endsWith('.json'))) {
      try {
        const filePath = path.join(this.paths.snapshots, file);
        const snapshot = await fs.readJson(filePath);
        
        if (this.matchesFilters(snapshot, filters)) {
          results.push(snapshot);
        }
      } catch (error) {
        console.warn(`Failed to read snapshot file ${file}:`, error.message);
        // Continue processing other files
        continue;
      }
    }

    return results.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Aggregate metrics over a time period
   */
  async aggregate(timeRange = {}) {
    const metrics = await this.retrieve(timeRange);
    
    if (metrics.length === 0) {
      return this.getEmptyAggregation();
    }

    const aggregation = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      timeRange,
      sampleSize: metrics.length,
      aggregated: this.performAggregation(metrics),
      analysis: this.performAnalysis(metrics),
      validation: this.validateHypotheses(metrics)
    };

    // Store aggregation
    const aggregationFile = path.join(
      this.paths.aggregations,
      `aggregation-${Date.now()}.json`
    );
    await fs.writeJson(aggregationFile, aggregation, { spaces: 2 });

    return aggregation;
  }

  /**
   * Export metrics in various formats
   */
  async export(format = 'json', filters = {}) {
    const metrics = await this.retrieve(filters);
    
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(metrics, null, 2);
      
      case 'csv':
        return this.convertToCSV(metrics);
      
      case 'markdown':
        return this.convertToMarkdown(metrics);
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate unique identifier for metrics
   */
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitize data to remove sensitive information
   */
  sanitizeData(data) {
    if (typeof data !== 'object' || data === null) return data;
    
    const sanitized = { ...data };
    
    // Remove potential PII
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth'];
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Validate metric data structure
   */
  validateMetric(metric) {
    const required = ['id', 'sessionId', 'timestamp', 'eventType', 'data'];
    return required.every(field => metric.hasOwnProperty(field));
  }

  /**
   * Check if metric matches filters
   */
  matchesFilters(metric, filters) {
    if (filters.startTime && metric.timestamp < filters.startTime) return false;
    if (filters.endTime && metric.timestamp > filters.endTime) return false;
    if (filters.eventType && metric.eventType !== filters.eventType) return false;
    if (filters.sessionId && metric.sessionId !== filters.sessionId) return false;
    
    return true;
  }

  /**
   * Flush buffered metrics to disk
   */
  async flushBuffer() {
    if (this.dataBuffer.length === 0) return;
    
    const snapshot = {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      metrics: [...this.dataBuffer]
    };

    const snapshotFile = path.join(
      this.paths.snapshots,
      `snapshot-${snapshot.timestamp}.json`
    );

    try {
      await fs.writeJson(snapshotFile, snapshot, { spaces: this.config.collection.enableCompression ? 0 : 2 });
    } catch (error) {
      console.warn(`Failed to write snapshot to ${snapshotFile}:`, error.message);
      // Continue without throwing to avoid breaking the collection process
    }
    
    this.dataBuffer = [];
    this.emit('buffer_flushed', { count: snapshot.metrics.length });
  }

  /**
   * Start automatic aggregation timer
   */
  startAggregationTimer() {
    if (this.aggregationTimer) return;
    
    this.aggregationTimer = setInterval(async () => {
      try {
        await this.flushBuffer();
        await this.cleanupOldData();
      } catch (error) {
        this.emit('error', { type: 'aggregation_timer', error: error.message });
      }
    }, this.options.aggregationInterval).unref();
  }

  /**
   * Stop aggregation timer
   */
  stopAggregationTimer() {
    if (this.aggregationTimer) {
      clearInterval(this.aggregationTimer);
      this.aggregationTimer = null;
    }
  }

  /**
   * Clean up old data based on retention period
   */
  async cleanupOldData() {
    const cutoffTime = Date.now() - this.options.retentionPeriod;
    
    const dirs = [this.paths.snapshots, this.paths.aggregations];
    
    for (const dir of dirs) {
      const files = await fs.readdir(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          await fs.remove(filePath);
          this.emit('data_cleaned', { file: filePath });
        }
      }
    }
  }

  /**
   * Set up cleanup handlers for graceful shutdown
   */
  setupCleanupHandlers() {
    const cleanup = async () => {
      await this.shutdown();
    };

    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
    process.on('exit', cleanup);
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    this.stopAggregationTimer();
    await this.flushBuffer();
    
    // Save final session summary
    const sessionSummary = {
      sessionId: this.sessionId,
      startTime: this.sessionStartTime,
      endTime: Date.now(),
      duration: Date.now() - this.sessionStartTime,
      metricsCollected: await this.getMetricsCount(),
      finalState: await this.getCurrentState()
    };

    const sessionFile = path.join(this.paths.sessions, `${this.sessionId}.json`);
    await fs.writeJson(sessionFile, sessionSummary, { spaces: 2 });
    
    this.emit('shutdown', sessionSummary);
  }

  /**
   * Get current metrics count
   */
  async getMetricsCount() {
    try {
      const files = await fs.readdir(this.paths.snapshots);
      let count = 0;
      
      for (const file of files.filter(f => f.endsWith('.json'))) {
        const snapshot = await fs.readJson(path.join(this.paths.snapshots, file));
        count += snapshot.metrics ? snapshot.metrics.length : 0;
      }
      
      return count + this.dataBuffer.length;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get current system state
   */
  async getCurrentState() {
    return {
      bufferSize: this.dataBuffer.length,
      isInitialized: this.isInitialized,
      sessionId: this.sessionId,
      uptime: Date.now() - this.sessionStartTime
    };
  }

  /**
   * Perform basic aggregation on metrics
   */
  performAggregation(metrics) {
    // This is a basic implementation - subclasses should override
    return {
      totalMetrics: metrics.length,
      timeSpan: metrics.length > 0 ? 
        metrics[metrics.length - 1].timestamp - metrics[0].timestamp : 0,
      eventTypes: this.countEventTypes(metrics)
    };
  }

  /**
   * Count event types in metrics
   */
  countEventTypes(metrics) {
    const counts = {};
    metrics.forEach(metric => {
      counts[metric.eventType] = (counts[metric.eventType] || 0) + 1;
    });
    return counts;
  }

  /**
   * Perform statistical analysis
   */
  performAnalysis(metrics) {
    // Basic analysis - subclasses should override for hypothesis-specific analysis
    return {
      sampleSize: metrics.length,
      timespan: metrics.length > 0 ? 
        metrics[metrics.length - 1].timestamp - metrics[0].timestamp : 0,
      confidence: this.calculateConfidence(metrics.length)
    };
  }

  /**
   * Calculate statistical confidence based on sample size
   */
  calculateConfidence(sampleSize) {
    if (sampleSize < this.config.analysis.minSampleSize) return 0.5;
    if (sampleSize < 100) return 0.7;
    if (sampleSize < 500) return 0.85;
    if (sampleSize < 1000) return 0.9;
    return 0.95;
  }

  /**
   * Validate research hypotheses
   */
  validateHypotheses(metrics) {
    // Default implementation - subclasses should override
    return {
      h1_jitLoading: { validated: false, confidence: 0, evidence: [] },
      h2_hubSpoke: { validated: false, confidence: 0, evidence: [] },
      h3_tddHandoffs: { validated: false, confidence: 0, evidence: [] }
    };
  }

  /**
   * Get empty aggregation structure
   */
  getEmptyAggregation() {
    return {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      sampleSize: 0,
      aggregated: { totalMetrics: 0, timeSpan: 0, eventTypes: {} },
      analysis: { sampleSize: 0, timespan: 0, confidence: 0 },
      validation: {
        h1_jitLoading: { validated: false, confidence: 0, evidence: [] },
        h2_hubSpoke: { validated: false, confidence: 0, evidence: [] },
        h3_tddHandoffs: { validated: false, confidence: 0, evidence: [] }
      }
    };
  }

  /**
   * Convert metrics to CSV format
   */
  convertToCSV(metrics) {
    if (metrics.length === 0) return '';
    
    const headers = ['timestamp', 'sessionId', 'eventType', 'data'];
    const rows = metrics.map(metric => [
      new Date(metric.timestamp).toISOString(),
      metric.sessionId,
      metric.eventType,
      JSON.stringify(metric.data)
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  /**
   * Convert metrics to Markdown format
   */
  convertToMarkdown(metrics) {
    let md = `# Metrics Export\n\n`;
    md += `**Generated:** ${new Date().toISOString()}\n`;
    md += `**Session:** ${this.sessionId}\n`;
    md += `**Total Metrics:** ${metrics.length}\n\n`;

    if (metrics.length > 0) {
      md += `## Metrics Summary\n\n`;
      const eventTypes = this.countEventTypes(metrics);
      
      for (const [eventType, count] of Object.entries(eventTypes)) {
        md += `- **${eventType}:** ${count} events\n`;
      }
    }

    return md;
  }
}

module.exports = MetricsCollector;