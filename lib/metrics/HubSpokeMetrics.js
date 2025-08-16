const MetricsCollector = require('./MetricsCollector');

/**
 * HubSpokeMetrics - Hypothesis 2 Validation
 * 
 * Tests the hypothesis that Hub-and-Spoke coordination is more efficient
 * than distributed peer-to-peer agent communication.
 * 
 * Key Metrics:
 * - Routing compliance rate >90%
 * - Coordination overhead <10% of total execution time
 * - Zero peer-to-peer communication violations
 * - Improved error detection and recovery
 */
class HubSpokeMetrics extends MetricsCollector {
  constructor(options = {}) {
    super(options);
    
    this.hypothesis = 'h2_hubSpoke';
    this.routingRequests = [];
    this.coordinationEvents = [];
    this.violations = [];
    this.performanceMetrics = [];
    
    // Hub-and-Spoke specific configuration
    this.hubSpokeConfig = {
      routingComplianceTarget: 0.9, // 90%
      maxCoordinationOverhead: 0.1, // 10%
      maxViolationsPerHour: 2,
      routingTimeoutThreshold: 5000, // 5 seconds
      ...options.hubSpokeConfig
    };
    
    // Routing patterns tracking
    this.routingPatterns = new Map();
    this.agentCommunicationGraph = new Map();
  }

  /**
   * Record routing request through hub
   */
  async recordRoutingRequest(data) {
    const routingEvent = {
      requestId: data.requestId || this.generateId(),
      fromAgent: data.fromAgent,
      toAgent: data.toAgent,
      requestType: data.requestType,
      startTime: data.startTime || Date.now(),
      routingPath: data.routingPath || [], // Array of agents in routing path
      throughHub: data.throughHub !== false, // Default to true
      priority: data.priority || 'normal',
      metadata: data.metadata || {}
    };

    this.routingRequests.push(routingEvent);

    // Track routing patterns
    this.updateRoutingPatterns(routingEvent);

    // Track communication graph
    this.updateCommunicationGraph(routingEvent);

    await this.store('routing_request', routingEvent, {
      hypothesis: this.hypothesis,
      experiment: data.experiment || 'default'
    });

    return routingEvent.requestId;
  }

  /**
   * Record routing completion
   */
  async recordRoutingCompletion(data) {
    const completionEvent = {
      requestId: data.requestId,
      endTime: data.endTime || Date.now(),
      success: data.success !== false,
      responseTime: data.responseTime,
      errors: data.errors || [],
      hops: data.hops || 1,
      coordinationOverhead: data.coordinationOverhead || 0,
      agentResponseTime: data.agentResponseTime || 0
    };

    // Find matching request
    const requestEvent = this.routingRequests.find(r => r.requestId === data.requestId);
    if (requestEvent) {
      completionEvent.totalTime = completionEvent.endTime - requestEvent.startTime;
      completionEvent.routingTime = completionEvent.totalTime - completionEvent.agentResponseTime;
      completionEvent.overheadRatio = completionEvent.coordinationOverhead / completionEvent.totalTime;
      
      // Update request with completion data
      Object.assign(requestEvent, completionEvent);
    }

    await this.store('routing_completion', completionEvent, {
      hypothesis: this.hypothesis
    });

    // Update performance tracking
    this.updatePerformanceMetrics(completionEvent);

    return completionEvent.requestId;
  }

  /**
   * Record coordination event (hub activity)
   */
  async recordCoordinationEvent(data) {
    const coordinationEvent = {
      eventId: data.eventId || this.generateId(),
      eventType: data.eventType, // 'agent_spawn', 'load_balance', 'route_decision', 'error_recovery'
      hubAgentId: data.hubAgentId || '@routing-agent',
      timestamp: Date.now(),
      activeAgents: data.activeAgents || [],
      queuedRequests: data.queuedRequests || 0,
      processingTime: data.processingTime || 0,
      decisionFactors: data.decisionFactors || {},
      outcome: data.outcome || 'success',
      metadata: data.metadata || {}
    };

    this.coordinationEvents.push(coordinationEvent);

    await this.store('coordination_event', coordinationEvent, {
      hypothesis: this.hypothesis
    });

    return coordinationEvent.eventId;
  }

  /**
   * Record compliance violation (peer-to-peer communication)
   */
  async recordViolation(data) {
    const violationEvent = {
      violationId: data.violationId || this.generateId(),
      violationType: data.violationType, // 'peer_to_peer', 'bypass_hub', 'direct_implementation'
      sourceAgent: data.sourceAgent,
      targetAgent: data.targetAgent,
      timestamp: Date.now(),
      severity: data.severity || 'medium', // 'low', 'medium', 'high', 'critical'
      detectionMethod: data.detectionMethod || 'automated',
      context: data.context || {},
      correctionAction: data.correctionAction || null,
      wasAutoResolved: data.wasAutoResolved || false
    };

    this.violations.push(violationEvent);

    await this.store('compliance_violation', violationEvent, {
      hypothesis: this.hypothesis,
      alert: violationEvent.severity === 'high' || violationEvent.severity === 'critical'
    });

    // Emit alert for high-severity violations
    if (violationEvent.severity === 'high' || violationEvent.severity === 'critical') {
      this.emit('violation_alert', violationEvent);
    }

    return violationEvent.violationId;
  }

  /**
   * Record load balancing metrics
   */
  async recordLoadBalancing(data) {
    const loadEvent = {
      timestamp: Date.now(),
      totalAgents: data.totalAgents || 0,
      activeAgents: data.activeAgents || 0,
      queuedRequests: data.queuedRequests || 0,
      averageResponseTime: data.averageResponseTime || 0,
      agentUtilization: data.agentUtilization || {},
      loadDistribution: data.loadDistribution || {},
      rebalancingActions: data.rebalancingActions || 0
    };

    await this.store('load_balancing', loadEvent, {
      hypothesis: this.hypothesis
    });
  }

  /**
   * Update routing patterns tracking
   */
  updateRoutingPatterns(routingEvent) {
    const pattern = `${routingEvent.fromAgent}->${routingEvent.toAgent}`;
    const currentCount = this.routingPatterns.get(pattern) || 0;
    this.routingPatterns.set(pattern, currentCount + 1);
  }

  /**
   * Update communication graph
   */
  updateCommunicationGraph(routingEvent) {
    // Track direct vs hub-mediated communications
    if (routingEvent.throughHub) {
      // Hub-mediated communication
      const hubPattern = `${routingEvent.fromAgent}->hub->${routingEvent.toAgent}`;
      this.recordGraphEdge(hubPattern, 'hub_mediated');
    } else {
      // Direct communication (violation)
      const directPattern = `${routingEvent.fromAgent}->${routingEvent.toAgent}`;
      this.recordGraphEdge(directPattern, 'direct');
      
      // Record as violation
      this.recordViolation({
        violationType: 'peer_to_peer',
        sourceAgent: routingEvent.fromAgent,
        targetAgent: routingEvent.toAgent,
        severity: 'medium',
        context: { requestId: routingEvent.requestId }
      });
    }
  }

  /**
   * Record edge in communication graph
   */
  recordGraphEdge(pattern, type) {
    if (!this.agentCommunicationGraph.has(pattern)) {
      this.agentCommunicationGraph.set(pattern, { count: 0, type, timestamps: [] });
    }
    
    const edge = this.agentCommunicationGraph.get(pattern);
    edge.count++;
    edge.timestamps.push(Date.now());
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics(completionEvent) {
    if (completionEvent.success) {
      this.performanceMetrics.push({
        timestamp: Date.now(),
        responseTime: completionEvent.totalTime,
        coordinationOverhead: completionEvent.coordinationOverhead,
        overheadRatio: completionEvent.overheadRatio,
        hops: completionEvent.hops
      });

      // Keep only recent metrics for performance
      if (this.performanceMetrics.length > 1000) {
        this.performanceMetrics = this.performanceMetrics.slice(-1000);
      }
    }
  }

  /**
   * Perform Hub-and-Spoke specific aggregation
   */
  performAggregation(metrics) {
    const baseAggregation = super.performAggregation(metrics);
    
    const routingMetrics = metrics.filter(m => m.eventType === 'routing_request');
    const completionMetrics = metrics.filter(m => m.eventType === 'routing_completion');
    const violationMetrics = metrics.filter(m => m.eventType === 'compliance_violation');
    const coordinationMetrics = metrics.filter(m => m.eventType === 'coordination_event');

    return {
      ...baseAggregation,
      routing: {
        totalRequests: routingMetrics.length,
        completedRequests: completionMetrics.length,
        successfulRequests: completionMetrics.filter(m => m.data.success).length,
        hubMediatedRequests: routingMetrics.filter(m => m.data.throughHub).length,
        directCommunications: routingMetrics.filter(m => !m.data.throughHub).length,
        averageResponseTime: this.calculateAverageResponseTime(completionMetrics),
        routingCompliance: this.calculateRoutingCompliance(routingMetrics),
        coordinationOverhead: this.calculateAverageCoordinationOverhead(completionMetrics)
      },
      violations: {
        totalViolations: violationMetrics.length,
        violationsByType: this.countViolationsByType(violationMetrics),
        violationsBySeverity: this.countViolationsBySeverity(violationMetrics),
        violationRate: this.calculateViolationRate(violationMetrics, routingMetrics),
        autoResolutionRate: this.calculateAutoResolutionRate(violationMetrics)
      },
      coordination: {
        totalCoordinationEvents: coordinationMetrics.length,
        coordinationEventsByType: this.countCoordinationEventsByType(coordinationMetrics),
        averageProcessingTime: this.calculateAverageProcessingTime(coordinationMetrics),
        hubUtilization: this.calculateHubUtilization(coordinationMetrics)
      },
      patterns: {
        topRoutingPatterns: this.getTopRoutingPatterns(),
        communicationGraph: this.analyzeCommunicationGraph(),
        loadDistribution: this.analyzeLoadDistribution()
      }
    };
  }

  /**
   * Calculate routing compliance rate
   */
  calculateRoutingCompliance(routingMetrics) {
    if (routingMetrics.length === 0) return 0;
    
    const hubMediatedCount = routingMetrics.filter(m => m.data.throughHub).length;
    return hubMediatedCount / routingMetrics.length;
  }

  /**
   * Calculate average response time
   */
  calculateAverageResponseTime(completionMetrics) {
    if (!completionMetrics || completionMetrics.length === 0) return 0;
    
    const successfulMetrics = completionMetrics.filter(m => 
      m && m.data && m.data.success && m.data.totalTime
    );
    if (successfulMetrics.length === 0) return 0;
    
    const totalTime = successfulMetrics.reduce((sum, m) => sum + m.data.totalTime, 0);
    return totalTime / successfulMetrics.length;
  }

  /**
   * Calculate average coordination overhead
   */
  calculateAverageCoordinationOverhead(completionMetrics) {
    if (!completionMetrics || completionMetrics.length === 0) return 0;
    
    const metricsWithOverhead = completionMetrics.filter(m => 
      m && m.data && m.data.overheadRatio != null
    );
    if (metricsWithOverhead.length === 0) return 0;
    
    const totalOverhead = metricsWithOverhead.reduce((sum, m) => sum + m.data.overheadRatio, 0);
    return totalOverhead / metricsWithOverhead.length;
  }

  /**
   * Count violations by type
   */
  countViolationsByType(violationMetrics) {
    const counts = {};
    violationMetrics.forEach(m => {
      const type = m.data.violationType;
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }

  /**
   * Count violations by severity
   */
  countViolationsBySeverity(violationMetrics) {
    const counts = {};
    violationMetrics.forEach(m => {
      const severity = m.data.severity;
      counts[severity] = (counts[severity] || 0) + 1;
    });
    return counts;
  }

  /**
   * Calculate violation rate (violations per total requests)
   */
  calculateViolationRate(violationMetrics, routingMetrics) {
    if (routingMetrics.length === 0) return 0;
    return violationMetrics.length / routingMetrics.length;
  }

  /**
   * Calculate auto-resolution rate for violations
   */
  calculateAutoResolutionRate(violationMetrics) {
    if (violationMetrics.length === 0) return 0;
    
    const autoResolvedCount = violationMetrics.filter(m => m.data.wasAutoResolved).length;
    return autoResolvedCount / violationMetrics.length;
  }

  /**
   * Count coordination events by type
   */
  countCoordinationEventsByType(coordinationMetrics) {
    const counts = {};
    coordinationMetrics.forEach(m => {
      const type = m.data.eventType;
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }

  /**
   * Calculate average processing time for coordination events
   */
  calculateAverageProcessingTime(coordinationMetrics) {
    const metricsWithTime = coordinationMetrics.filter(m => m.data.processingTime > 0);
    if (metricsWithTime.length === 0) return 0;
    
    const totalTime = metricsWithTime.reduce((sum, m) => sum + m.data.processingTime, 0);
    return totalTime / metricsWithTime.length;
  }

  /**
   * Calculate hub utilization
   */
  calculateHubUtilization(coordinationMetrics) {
    // Simplified calculation based on coordination events frequency
    const timeSpan = coordinationMetrics.length > 1 ? 
      coordinationMetrics[coordinationMetrics.length - 1].timestamp - coordinationMetrics[0].timestamp : 0;
    
    if (timeSpan === 0) return 0;
    
    const eventsPerMinute = (coordinationMetrics.length / timeSpan) * 60000;
    return Math.min(eventsPerMinute / 60, 1); // Cap at 100% utilization
  }

  /**
   * Get top routing patterns
   */
  getTopRoutingPatterns() {
    const patterns = Array.from(this.routingPatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pattern, count]) => ({ pattern, count }));
    
    return patterns;
  }

  /**
   * Analyze communication graph
   */
  analyzeCommunicationGraph() {
    const hubMediatedEdges = Array.from(this.agentCommunicationGraph.entries())
      .filter(([_, data]) => data.type === 'hub_mediated')
      .length;
    
    const directEdges = Array.from(this.agentCommunicationGraph.entries())
      .filter(([_, data]) => data.type === 'direct')
      .length;
    
    const totalEdges = hubMediatedEdges + directEdges;
    
    return {
      totalEdges,
      hubMediatedEdges,
      directEdges,
      hubMediatedRatio: totalEdges > 0 ? hubMediatedEdges / totalEdges : 0,
      graphDensity: this.calculateGraphDensity(),
      centralityMetrics: this.calculateCentralityMetrics()
    };
  }

  /**
   * Calculate graph density
   */
  calculateGraphDensity() {
    const uniqueAgents = new Set();
    
    this.agentCommunicationGraph.forEach((_, pattern) => {
      const [source, target] = pattern.split('->');
      uniqueAgents.add(source);
      uniqueAgents.add(target);
    });
    
    const numAgents = uniqueAgents.size;
    const maxPossibleEdges = numAgents * (numAgents - 1);
    
    if (maxPossibleEdges === 0) return 0;
    
    return this.agentCommunicationGraph.size / maxPossibleEdges;
  }

  /**
   * Calculate centrality metrics
   */
  calculateCentralityMetrics() {
    const agentConnections = new Map();
    
    // Count connections per agent
    this.agentCommunicationGraph.forEach((data, pattern) => {
      const [source, target] = pattern.split('->');
      
      agentConnections.set(source, (agentConnections.get(source) || 0) + 1);
      agentConnections.set(target, (agentConnections.get(target) || 0) + 1);
    });
    
    // Find hub agent (should have highest centrality)
    const sortedAgents = Array.from(agentConnections.entries())
      .sort((a, b) => b[1] - a[1]);
    
    return {
      mostCentralAgent: sortedAgents[0] ? sortedAgents[0][0] : null,
      centralityScore: sortedAgents[0] ? sortedAgents[0][1] : 0,
      agentCentralities: Object.fromEntries(agentConnections)
    };
  }

  /**
   * Analyze load distribution
   */
  analyzeLoadDistribution() {
    // Analyze request distribution across agents
    const agentLoads = new Map();
    
    this.routingRequests.forEach(request => {
      const agent = request.toAgent;
      agentLoads.set(agent, (agentLoads.get(agent) || 0) + 1);
    });
    
    const loads = Array.from(agentLoads.values());
    if (loads.length === 0) return { balance: 0, deviation: 0 };
    
    const average = loads.reduce((a, b) => a + b, 0) / loads.length;
    const variance = loads.reduce((sum, load) => sum + Math.pow(load - average, 2), 0) / loads.length;
    const standardDeviation = Math.sqrt(variance);
    
    return {
      balance: average > 0 ? 1 - (standardDeviation / average) : 0, // Higher is better
      deviation: standardDeviation,
      agentLoads: Object.fromEntries(agentLoads)
    };
  }

  /**
   * Perform Hub-and-Spoke specific analysis
   */
  performAnalysis(metrics) {
    const baseAnalysis = super.performAnalysis(metrics);
    
    const routingMetrics = metrics.filter(m => m.eventType === 'routing_request');
    const violationMetrics = metrics.filter(m => m.eventType === 'compliance_violation');
    const completionMetrics = metrics.filter(m => m.eventType === 'routing_completion');
    
    return {
      ...baseAnalysis,
      hypothesisValidation: {
        routingCompliance: this.calculateRoutingCompliance(routingMetrics),
        coordinationOverhead: this.calculateAverageCoordinationOverhead(completionMetrics),
        violationRate: this.calculateViolationRate(violationMetrics, routingMetrics),
        performanceImprovement: this.calculatePerformanceImprovement(completionMetrics),
        errorReduction: this.calculateErrorReduction(completionMetrics)
      },
      trends: {
        complianceTrend: this.calculateComplianceTrend(routingMetrics),
        violationTrend: this.calculateViolationTrend(violationMetrics),
        performanceTrend: this.calculatePerformanceTrend(completionMetrics),
        overheadTrend: this.calculateOverheadTrend(completionMetrics)
      },
      predictions: {
        projectedCompliance: this.projectCompliance(routingMetrics),
        violationProjection: this.projectViolations(violationMetrics),
        timeToTargetCompliance: this.estimateTimeToTargetCompliance(routingMetrics),
        scalabilityProjection: this.projectScalability()
      }
    };
  }

  /**
   * Calculate performance improvement compared to baseline
   */
  calculatePerformanceImprovement(completionMetrics) {
    if (completionMetrics.length === 0) return 0;
    
    const baseline = this.baseline?.measurements?.coordination?.coordinationOverhead || 1.0;
    const current = this.calculateAverageCoordinationOverhead(completionMetrics);
    
    return (baseline - current) / baseline;
  }

  /**
   * Calculate error reduction
   */
  calculateErrorReduction(completionMetrics) {
    if (completionMetrics.length === 0) return 0;
    
    const successRate = completionMetrics.filter(m => m.data.success).length / completionMetrics.length;
    const baseline = this.baseline?.measurements?.coordination?.routingCompliance || 0;
    
    return successRate - baseline;
  }

  /**
   * Calculate compliance trend
   */
  calculateComplianceTrend(metrics) {
    if (metrics.length < 10) return 'insufficient_data';
    
    const recentMetrics = metrics.slice(-Math.floor(metrics.length / 2));
    const olderMetrics = metrics.slice(0, Math.floor(metrics.length / 2));
    
    const recentCompliance = this.calculateRoutingCompliance(recentMetrics);
    const olderCompliance = this.calculateRoutingCompliance(olderMetrics);
    
    if (recentCompliance > olderCompliance * 1.05) return 'improving';
    if (recentCompliance < olderCompliance * 0.95) return 'degrading';
    return 'stable';
  }

  /**
   * Calculate violation trend
   */
  calculateViolationTrend(violationMetrics) {
    if (violationMetrics.length < 5) return 'insufficient_data';
    
    // Analyze violation frequency over time
    const timeWindow = 60 * 60 * 1000; // 1 hour
    const now = Date.now();
    
    const recentViolations = violationMetrics.filter(m => 
      now - m.timestamp < timeWindow
    ).length;
    
    const previousViolations = violationMetrics.filter(m => 
      now - m.timestamp >= timeWindow && now - m.timestamp < timeWindow * 2
    ).length;
    
    if (recentViolations < previousViolations * 0.8) return 'improving';
    if (recentViolations > previousViolations * 1.2) return 'degrading';
    return 'stable';
  }

  /**
   * Calculate performance trend
   */
  calculatePerformanceTrend(completionMetrics) {
    return this.calculateTrend(completionMetrics, 'totalTime');
  }

  /**
   * Calculate overhead trend
   */
  calculateOverheadTrend(completionMetrics) {
    return this.calculateTrend(completionMetrics, 'overheadRatio');
  }

  /**
   * Calculate trend for a specific metric (inherited from parent but specialized)
   */
  calculateTrend(metrics, property) {
    if (metrics.length < 10) return 'insufficient_data';
    
    const values = metrics.map(m => m.data[property]).filter(v => v != null);
    if (values.length < 10) return 'insufficient_data';
    
    const firstThird = values.slice(0, Math.floor(values.length / 3));
    const lastThird = values.slice(-Math.floor(values.length / 3));
    
    const firstAvg = firstThird.reduce((a, b) => a + b, 0) / firstThird.length;
    const lastAvg = lastThird.reduce((a, b) => a + b, 0) / lastThird.length;
    
    if (property === 'overheadRatio' || property === 'totalTime') {
      // For overhead and response time, lower is better
      if (lastAvg < firstAvg * 0.9) return 'improving';
      if (lastAvg > firstAvg * 1.1) return 'degrading';
    } else {
      // For other metrics, higher is better
      if (lastAvg > firstAvg * 1.1) return 'improving';
      if (lastAvg < firstAvg * 0.9) return 'degrading';
    }
    
    return 'stable';
  }

  /**
   * Project future compliance based on trends
   */
  projectCompliance(routingMetrics) {
    const currentCompliance = this.calculateRoutingCompliance(routingMetrics);
    const trend = this.calculateComplianceTrend(routingMetrics);
    
    if (trend === 'improving') {
      return Math.min(currentCompliance * 1.1, 1.0);
    } else if (trend === 'degrading') {
      return Math.max(currentCompliance * 0.9, 0.0);
    }
    
    return currentCompliance;
  }

  /**
   * Project future violations
   */
  projectViolations(violationMetrics) {
    const trend = this.calculateViolationTrend(violationMetrics);
    const currentRate = violationMetrics.length;
    
    if (trend === 'improving') {
      return Math.max(currentRate * 0.8, 0);
    } else if (trend === 'degrading') {
      return currentRate * 1.2;
    }
    
    return currentRate;
  }

  /**
   * Estimate time to reach target compliance
   */
  estimateTimeToTargetCompliance(routingMetrics) {
    const currentCompliance = this.calculateRoutingCompliance(routingMetrics);
    const targetCompliance = this.hubSpokeConfig.routingComplianceTarget;
    
    if (currentCompliance >= targetCompliance) return 0;
    
    const trend = this.calculateComplianceTrend(routingMetrics);
    const improvementRate = trend === 'improving' ? 0.02 : 0.005; // 2% or 0.5% per hour
    
    const remainingImprovement = targetCompliance - currentCompliance;
    return Math.ceil(remainingImprovement / improvementRate); // Hours
  }

  /**
   * Project system scalability
   */
  projectScalability() {
    const currentAgents = Array.from(new Set(
      this.routingRequests.map(r => r.toAgent)
    )).length;
    
    const averageResponseTime = this.calculateAverageResponseTime(
      this.routingRequests.filter(r => r.totalTime)
    );
    
    const coordinationOverhead = this.calculateAverageCoordinationOverhead(
      this.routingRequests.filter(r => r.overheadRatio != null)
    );
    
    return {
      currentAgentCount: currentAgents,
      projectedMaxAgents: Math.floor(100 / (coordinationOverhead * 100)), // Rough estimate
      scalabilityScore: coordinationOverhead < 0.1 ? 'excellent' : 
                       coordinationOverhead < 0.2 ? 'good' : 
                       coordinationOverhead < 0.3 ? 'fair' : 'poor',
      bottleneckRisk: coordinationOverhead > 0.2 ? 'high' : 'low'
    };
  }

  /**
   * Validate H2: Hub-and-Spoke Coordination hypothesis
   */
  validateHypotheses(metrics) {
    const routingMetrics = metrics.filter(m => m.eventType === 'routing_request');
    const violationMetrics = metrics.filter(m => m.eventType === 'compliance_violation');
    const completionMetrics = metrics.filter(m => m.eventType === 'routing_completion');
    const analysis = this.performAnalysis(metrics);
    
    const h2Validation = {
      hypothesis: 'Hub-and-Spoke coordination outperforms distributed communication',
      validated: false,
      confidence: this.calculateConfidence(routingMetrics.length),
      evidence: [],
      metrics: {
        routingCompliance: analysis.hypothesisValidation?.routingCompliance || 0,
        coordinationOverhead: analysis.hypothesisValidation?.coordinationOverhead || 1,
        violationRate: analysis.hypothesisValidation?.violationRate || 1,
        performanceImprovement: analysis.hypothesisValidation?.performanceImprovement || 0,
        errorReduction: analysis.hypothesisValidation?.errorReduction || 0
      },
      criteria: {
        targetCompliance: this.hubSpokeConfig.routingComplianceTarget,
        maxOverhead: this.hubSpokeConfig.maxCoordinationOverhead,
        confidenceThreshold: this.config.hypotheses.h2_hubSpoke.confidenceThreshold
      }
    };

    // Check validation criteria
    const meetsCompliance = h2Validation.metrics.routingCompliance >= h2Validation.criteria.targetCompliance;
    const meetsOverhead = h2Validation.metrics.coordinationOverhead <= h2Validation.criteria.maxOverhead;
    const meetsConfidence = h2Validation.confidence >= h2Validation.criteria.confidenceThreshold;
    
    h2Validation.validated = meetsCompliance && meetsOverhead && meetsConfidence;

    // Collect evidence
    if (meetsCompliance) {
      h2Validation.evidence.push(`Routing compliance achieved ${(h2Validation.metrics.routingCompliance * 100).toFixed(1)}% (target: ${(h2Validation.criteria.targetCompliance * 100).toFixed(1)}%)`);
    }
    if (meetsOverhead) {
      h2Validation.evidence.push(`Coordination overhead maintained at ${(h2Validation.metrics.coordinationOverhead * 100).toFixed(1)}% (target: <${(h2Validation.criteria.maxOverhead * 100).toFixed(1)}%)`);
    }
    if (h2Validation.metrics.performanceImprovement > 0) {
      h2Validation.evidence.push(`Performance improved by ${(h2Validation.metrics.performanceImprovement * 100).toFixed(1)}% over baseline`);
    }
    if (h2Validation.metrics.errorReduction > 0) {
      h2Validation.evidence.push(`Error rate reduced by ${(h2Validation.metrics.errorReduction * 100).toFixed(1)}%`);
    }
    if (violationMetrics.length === 0) {
      h2Validation.evidence.push('Zero peer-to-peer communication violations detected');
    }

    return {
      h1_jitLoading: { validated: false, confidence: 0, evidence: [] },
      h2_hubSpoke: h2Validation,
      h3_tddHandoffs: { validated: false, confidence: 0, evidence: [] }
    };
  }
}

module.exports = HubSpokeMetrics;