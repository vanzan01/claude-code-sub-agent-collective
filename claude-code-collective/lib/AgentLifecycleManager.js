/**
 * Claude Code Sub-Agent Collective - Agent Lifecycle Manager
 * 
 * Phase 7: Dynamic Agent Creation
 * 
 * This module provides automated lifecycle management including agent cleanup,
 * resource deallocation, and garbage collection for inactive agents.
 * 
 * @author Claude Code Sub-Agent Collective
 * @version 1.0.0
 */

const EventEmitter = require('events');
const fs = require('fs-extra');
const path = require('path');

class AgentLifecycleManager extends EventEmitter {
  constructor(spawner, registry, options = {}) {
    super();
    
    this.spawner = spawner;
    this.registry = registry;
    
    // Configuration
    this.config = {
      // Auto-cleanup policies
      autoCleanupEnabled: options.autoCleanupEnabled !== false,
      idleTimeout: options.idleTimeout || 3600000, // 1 hour
      maxAge: options.maxAge || 86400000, // 24 hours
      minPerformanceThreshold: options.minPerformanceThreshold || 0.7,
      
      // Resource limits
      maxMemoryUsage: options.maxMemoryUsage || 100 * 1024 * 1024, // 100MB
      maxCpuUsage: options.maxCpuUsage || 80, // 80%
      maxDiskUsage: options.maxDiskUsage || 50 * 1024 * 1024, // 50MB
      
      // Health monitoring
      healthCheckInterval: options.healthCheckInterval || 300000, // 5 minutes
      maxFailures: options.maxFailures || 3,
      
      // Scaling policies
      autoScalingEnabled: options.autoScalingEnabled || false,
      maxActiveAgents: options.maxActiveAgents || 20,
      scaleUpThreshold: options.scaleUpThreshold || 0.8,
      scaleDownThreshold: options.scaleDownThreshold || 0.3,
      
      // Cleanup schedules
      cleanupInterval: options.cleanupInterval || 1800000, // 30 minutes
      deepCleanupInterval: options.deepCleanupInterval || 43200000, // 12 hours
      
      ...options.config
    };
    
    // Internal state
    this.policies = new Map();
    this.schedules = new Map();
    this.monitors = new Map();
    this.cleanupHistory = [];
    this.statistics = {
      totalCleanups: 0,
      agentsRecycled: 0,
      resourcesReclaimed: 0,
      healthChecksPerformed: 0,
      scalingEvents: 0
    };
    
    this.initialized = false;
    this.timers = new Map();
    
    // Initialize default policies
    this.initializeDefaultPolicies();
  }

  /**
   * Initialize default lifecycle policies
   */
  initializeDefaultPolicies() {
    // Idle timeout policy
    this.policies.set('idle-timeout', {
      enabled: true,
      name: 'Idle Timeout Cleanup',
      description: 'Remove agents that have been inactive for too long',
      condition: (agent) => {
        const lastSeen = new Date(agent.activity.lastSeen);
        const idleTime = Date.now() - lastSeen.getTime();
        return idleTime > this.config.idleTimeout;
      },
      action: 'cleanup',
      priority: 3
    });

    // Max age policy
    this.policies.set('max-age', {
      enabled: true,
      name: 'Maximum Age Cleanup',
      description: 'Remove agents that have exceeded maximum lifespan',
      condition: (agent) => {
        const created = new Date(agent.metadata.registeredAt);
        const age = Date.now() - created.getTime();
        return age > this.config.maxAge;
      },
      action: 'cleanup',
      priority: 2
    });

    // Performance threshold policy
    this.policies.set('performance-threshold', {
      enabled: true,
      name: 'Low Performance Cleanup',
      description: 'Remove agents with consistently poor performance',
      condition: (agent) => {
        return (
          agent.performance.successRate < this.config.minPerformanceThreshold &&
          agent.activity.invocations > 10 // Minimum sample size
        );
      },
      action: 'cleanup',
      priority: 1
    });

    // Resource usage policy
    this.policies.set('resource-usage', {
      enabled: true,
      name: 'High Resource Usage',
      description: 'Flag or cleanup agents consuming excessive resources',
      condition: (agent) => {
        return (
          agent.resources.memoryUsage > this.config.maxMemoryUsage ||
          agent.resources.cpuUsage > this.config.maxCpuUsage ||
          agent.resources.diskUsage > this.config.maxDiskUsage
        );
      },
      action: 'warn', // First warn, then cleanup on repeated violations
      priority: 1
    });

    // Health failure policy
    this.policies.set('health-failures', {
      enabled: true,
      name: 'Health Check Failures',
      description: 'Remove agents that repeatedly fail health checks',
      condition: (agent) => {
        return agent.health.failureCount >= this.config.maxFailures;
      },
      action: 'cleanup',
      priority: 1
    });
  }

  /**
   * Initialize the lifecycle manager
   */
  async initialize() {
    if (this.initialized) {
      return { success: true, message: 'Already initialized' };
    }

    // Set up event listeners
    this.registry.on('agent-registered', (agent) => this.onAgentRegistered(agent));
    this.registry.on('agent-unregistered', (data) => this.onAgentUnregistered(data));
    this.registry.on('agent-activity-updated', (data) => this.onAgentActivity(data));
    this.registry.on('agent-health-checked', (result) => this.onHealthCheck(result));

    // Start scheduled tasks
    await this.startScheduledTasks();

    this.initialized = true;

    this.emit('lifecycle-manager-initialized', {
      policies: this.policies.size,
      config: this.config
    });

    return {
      success: true,
      message: 'AgentLifecycleManager initialized successfully',
      policies: Array.from(this.policies.keys())
    };
  }

  /**
   * Start scheduled tasks
   */
  async startScheduledTasks() {
    // Cleanup timer
    if (this.config.autoCleanupEnabled && this.config.cleanupInterval > 0) {
      this.timers.set('cleanup', setInterval(async () => {
        await this.runCleanup();
      }, this.config.cleanupInterval).unref());
    }

    // Deep cleanup timer
    if (this.config.deepCleanupInterval > 0) {
      this.timers.set('deep-cleanup', setInterval(async () => {
        await this.runDeepCleanup();
      }, this.config.deepCleanupInterval).unref());
    }

    // Health monitoring timer
    if (this.config.healthCheckInterval > 0) {
      this.timers.set('health-check', setInterval(async () => {
        await this.runHealthMonitoring();
      }, this.config.healthCheckInterval).unref());
    }

    // Scaling evaluation timer
    if (this.config.autoScalingEnabled) {
      this.timers.set('scaling', setInterval(async () => {
        await this.evaluateScaling();
      }, 60000).unref()); // Every minute
    }
  }

  /**
   * Run cleanup cycle
   */
  async runCleanup() {
    const startTime = Date.now();
    
    try {
      const agents = this.registry.query({ status: 'active' });
      const cleanupActions = [];
      
      // Evaluate each agent against policies
      for (const agent of agents) {
        const violations = await this.evaluatePolicies(agent);
        
        if (violations.length > 0) {
          cleanupActions.push({
            agent,
            violations,
            action: this.determineAction(violations)
          });
        }
      }

      // Execute cleanup actions
      const results = await this.executeCleanupActions(cleanupActions);
      
      // Update statistics
      this.statistics.totalCleanups++;
      
      // Log cleanup results
      this.logCleanup({
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        agentsEvaluated: agents.length,
        actionsExecuted: cleanupActions.length,
        results
      });

      this.emit('cleanup-completed', {
        agentsEvaluated: agents.length,
        actionsExecuted: cleanupActions.length,
        duration: Date.now() - startTime
      });

      return results;

    } catch (error) {
      this.emit('cleanup-failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Run deep cleanup cycle
   */
  async runDeepCleanup() {
    const startTime = Date.now();
    
    try {
      // Clean up orphaned files
      await this.cleanupOrphanedFiles();
      
      // Clean up old registry backups
      await this.cleanupOldBackups();
      
      // Clean up test artifacts
      await this.cleanupTestArtifacts();
      
      // Defragment registry
      await this.defragmentRegistry();
      
      this.emit('deep-cleanup-completed', {
        duration: Date.now() - startTime
      });

    } catch (error) {
      this.emit('deep-cleanup-failed', { error: error.message });
    }
  }

  /**
   * Run health monitoring
   */
  async runHealthMonitoring() {
    try {
      const agents = this.registry.query({ status: 'active' });
      const healthResults = [];
      
      for (const agent of agents) {
        try {
          const healthResult = await this.registry.checkHealth(agent.id);
          healthResults.push(healthResult);
          
          // Update monitor data
          this.monitors.set(agent.id, {
            ...this.monitors.get(agent.id),
            lastHealthCheck: healthResult.timestamp,
            healthStatus: healthResult.status,
            issues: healthResult.issues
          });
          
        } catch (error) {
          console.warn(`Health check failed for agent ${agent.id}:`, error.message);
        }
      }
      
      this.statistics.healthChecksPerformed += healthResults.length;
      
      this.emit('health-monitoring-completed', {
        agentsChecked: healthResults.length,
        healthyAgents: healthResults.filter(r => r.status === 'healthy').length,
        unhealthyAgents: healthResults.filter(r => r.status === 'unhealthy').length
      });

    } catch (error) {
      this.emit('health-monitoring-failed', { error: error.message });
    }
  }

  /**
   * Evaluate scaling needs
   */
  async evaluateScaling() {
    if (!this.config.autoScalingEnabled) {
      return;
    }

    try {
      const agents = this.registry.query({ status: 'active' });
      const activeCount = agents.length;
      
      // Calculate system load metrics
      const loadMetrics = this.calculateLoadMetrics(agents);
      
      // Determine scaling action
      let scalingAction = null;
      
      if (loadMetrics.avgLoad > this.config.scaleUpThreshold && 
          activeCount < this.config.maxActiveAgents) {
        scalingAction = 'scale-up';
      } else if (loadMetrics.avgLoad < this.config.scaleDownThreshold && 
                 activeCount > 1) {
        scalingAction = 'scale-down';
      }
      
      if (scalingAction) {
        await this.executeScalingAction(scalingAction, loadMetrics);
      }

    } catch (error) {
      this.emit('scaling-evaluation-failed', { error: error.message });
    }
  }

  /**
   * Evaluate policies for an agent
   * @param {object} agent - Agent to evaluate
   * @returns {array} Policy violations
   */
  async evaluatePolicies(agent) {
    const violations = [];
    
    for (const [policyId, policy] of this.policies) {
      if (!policy.enabled) continue;
      
      try {
        if (await policy.condition(agent)) {
          violations.push({
            policyId,
            policy,
            agent: agent.id,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.warn(`Policy evaluation failed for ${policyId}:`, error.message);
      }
    }
    
    return violations;
  }

  /**
   * Determine action from violations
   * @param {array} violations - Policy violations
   * @returns {string} Action to take
   */
  determineAction(violations) {
    if (violations.length === 0) return 'none';
    
    // Sort by priority and determine action
    const sorted = violations.sort((a, b) => a.policy.priority - b.policy.priority);
    
    // Check for cleanup actions
    if (sorted.some(v => v.policy.action === 'cleanup')) {
      return 'cleanup';
    }
    
    // Check for warn actions
    if (sorted.some(v => v.policy.action === 'warn')) {
      return 'warn';
    }
    
    return 'monitor';
  }

  /**
   * Execute cleanup actions
   * @param {array} actions - Cleanup actions to execute
   * @returns {array} Execution results
   */
  async executeCleanupActions(actions) {
    const results = [];
    
    for (const actionItem of actions) {
      const { agent, violations, action } = actionItem;
      
      try {
        let result;
        
        switch (action) {
          case 'cleanup':
            result = await this.cleanupAgent(agent.id, violations);
            break;
          case 'warn':
            result = await this.warnAgent(agent.id, violations);
            break;
          case 'monitor':
            result = await this.monitorAgent(agent.id, violations);
            break;
          default:
            result = { success: false, message: 'Unknown action' };
        }
        
        results.push({
          agentId: agent.id,
          action,
          violations: violations.length,
          ...result
        });
        
      } catch (error) {
        results.push({
          agentId: agent.id,
          action,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Cleanup agent
   * @param {string} agentId - Agent ID
   * @param {array} violations - Policy violations
   * @returns {object} Cleanup result
   */
  async cleanupAgent(agentId, violations) {
    const reasons = violations.map(v => v.policy.name);
    
    // Attempt graceful shutdown first
    await this.gracefulShutdown(agentId);
    
    // Unregister agent
    await this.registry.unregister(agentId, {
      reason: `Policy violations: ${reasons.join(', ')}`,
      cleanup: true
    });
    
    this.statistics.agentsRecycled++;
    
    this.emit('agent-cleaned-up', {
      agentId,
      violations,
      reasons
    });
    
    return {
      success: true,
      message: `Agent cleaned up due to: ${reasons.join(', ')}`
    };
  }

  /**
   * Warn agent (log warning for now)
   * @param {string} agentId - Agent ID
   * @param {array} violations - Policy violations
   * @returns {object} Warning result
   */
  async warnAgent(agentId, violations) {
    const reasons = violations.map(v => v.policy.name);
    
    // Update monitor data
    const monitor = this.monitors.get(agentId) || {};
    monitor.warnings = (monitor.warnings || []).concat({
      timestamp: new Date().toISOString(),
      violations: reasons
    });
    this.monitors.set(agentId, monitor);
    
    this.emit('agent-warned', {
      agentId,
      violations,
      reasons
    });
    
    return {
      success: true,
      message: `Agent warned for: ${reasons.join(', ')}`
    };
  }

  /**
   * Monitor agent (increase monitoring frequency)
   * @param {string} agentId - Agent ID
   * @param {array} violations - Policy violations
   * @returns {object} Monitoring result
   */
  async monitorAgent(agentId, violations) {
    const monitor = this.monitors.get(agentId) || {};
    monitor.enhancedMonitoring = true;
    monitor.monitoringSince = new Date().toISOString();
    monitor.violations = violations;
    this.monitors.set(agentId, monitor);
    
    return {
      success: true,
      message: 'Agent under enhanced monitoring'
    };
  }

  /**
   * Graceful shutdown of agent
   * @param {string} agentId - Agent ID
   */
  async gracefulShutdown(agentId) {
    // Give agent time to complete current tasks
    // This is a placeholder - in real implementation would send shutdown signal
    await new Promise(resolve => setTimeout(resolve, 1000).unref());
  }

  /**
   * Calculate system load metrics
   * @param {array} agents - Active agents
   * @returns {object} Load metrics
   */
  calculateLoadMetrics(agents) {
    if (agents.length === 0) {
      return { avgLoad: 0, totalInvocations: 0, avgResponseTime: 0 };
    }
    
    const totalInvocations = agents.reduce((sum, agent) => 
      sum + agent.activity.invocations, 0
    );
    
    const totalResponseTime = agents.reduce((sum, agent) => 
      sum + agent.performance.avgResponseTime, 0
    );
    
    return {
      avgLoad: totalInvocations / agents.length,
      totalInvocations,
      avgResponseTime: totalResponseTime / agents.length
    };
  }

  /**
   * Execute scaling action
   * @param {string} action - Scaling action (scale-up or scale-down)
   * @param {object} loadMetrics - Current load metrics
   */
  async executeScalingAction(action, loadMetrics) {
    try {
      if (action === 'scale-up') {
        // Spawn additional general-purpose agent
        await this.spawner.spawn({
          name: 'auto-scaled-agent',
          agentType: 'auto-scaled',
          purpose: 'Load balancing and overflow handling',
          type: 'general'
        });
        
        this.emit('scaled-up', { loadMetrics });
        
      } else if (action === 'scale-down') {
        // Find least active agent to remove
        const agents = this.registry.query({ 
          status: 'active',
          sortBy: 'activity.lastSeen',
          sortOrder: 'asc',
          limit: 1
        });
        
        if (agents.length > 0 && agents[0].name.includes('auto-scaled')) {
          await this.cleanupAgent(agents[0].id, [{
            policy: { name: 'Auto-scaling down' }
          }]);
          
          this.emit('scaled-down', { loadMetrics });
        }
      }
      
      this.statistics.scalingEvents++;
      
    } catch (error) {
      this.emit('scaling-failed', { action, error: error.message });
    }
  }

  /**
   * Clean up orphaned files
   */
  async cleanupOrphanedFiles() {
    const agentsDir = path.join(process.cwd(), '.claude', 'agents');
    const registeredAgents = this.registry.query({}).map(a => `${a.id}.md`);
    
    if (await fs.pathExists(agentsDir)) {
      const files = await fs.readdir(agentsDir);
      const agentFiles = files.filter(f => f.endsWith('.md'));
      
      for (const file of agentFiles) {
        if (!registeredAgents.includes(file)) {
          await fs.remove(path.join(agentsDir, file));
          this.statistics.resourcesReclaimed++;
        }
      }
    }
  }

  /**
   * Clean up old backups
   */
  async cleanupOldBackups() {
    // This would be implemented based on registry backup cleanup
    // For now, just emit event
    this.emit('old-backups-cleaned');
  }

  /**
   * Clean up test artifacts
   */
  async cleanupTestArtifacts() {
    const testsDir = path.join(process.cwd(), '.claude-collective', 'tests', 'agents');
    const registeredAgents = this.registry.query({}).map(a => a.id);
    
    if (await fs.pathExists(testsDir)) {
      const testDirs = await fs.readdir(testsDir);
      
      for (const testDir of testDirs) {
        if (!registeredAgents.includes(testDir)) {
          await fs.remove(path.join(testsDir, testDir));
          this.statistics.resourcesReclaimed++;
        }
      }
    }
  }

  /**
   * Defragment registry
   */
  async defragmentRegistry() {
    // Trigger registry cleanup and optimization
    await this.registry.saveRegistry();
    this.emit('registry-defragmented');
  }

  /**
   * Log cleanup activity
   * @param {object} cleanupData - Cleanup data
   */
  logCleanup(cleanupData) {
    this.cleanupHistory.push(cleanupData);
    
    // Keep history limited
    if (this.cleanupHistory.length > 100) {
      this.cleanupHistory = this.cleanupHistory.slice(-50);
    }
  }

  /**
   * Event handlers
   */
  onAgentRegistered(agent) {
    this.monitors.set(agent.id, {
      registeredAt: new Date().toISOString(),
      warnings: [],
      enhancedMonitoring: false
    });
  }

  onAgentUnregistered(data) {
    this.monitors.delete(data.agentId);
  }

  onAgentActivity(data) {
    const monitor = this.monitors.get(data.agentId);
    if (monitor) {
      monitor.lastActivity = new Date().toISOString();
      this.monitors.set(data.agentId, monitor);
    }
  }

  onHealthCheck(result) {
    const monitor = this.monitors.get(result.agentId);
    if (monitor) {
      monitor.lastHealthCheck = result.timestamp;
      monitor.healthStatus = result.status;
      this.monitors.set(result.agentId, monitor);
    }
  }

  /**
   * Get lifecycle statistics
   * @returns {object} Lifecycle statistics
   */
  getStatistics() {
    return {
      ...this.statistics,
      policies: this.policies.size,
      monitoredAgents: this.monitors.size,
      activeTimers: this.timers.size,
      recentCleanups: this.cleanupHistory.slice(-10),
      config: {
        autoCleanupEnabled: this.config.autoCleanupEnabled,
        autoScalingEnabled: this.config.autoScalingEnabled,
        idleTimeout: this.config.idleTimeout,
        maxAge: this.config.maxAge,
        minPerformanceThreshold: this.config.minPerformanceThreshold
      }
    };
  }

  /**
   * Update policy configuration
   * @param {string} policyId - Policy ID
   * @param {object} updates - Policy updates
   * @returns {object} Update result
   */
  updatePolicy(policyId, updates) {
    const policy = this.policies.get(policyId);
    if (!policy) {
      throw new Error(`Policy '${policyId}' not found`);
    }
    
    Object.assign(policy, updates);
    this.policies.set(policyId, policy);
    
    this.emit('policy-updated', { policyId, updates });
    
    return {
      success: true,
      policyId,
      message: `Policy '${policyId}' updated successfully`
    };
  }

  /**
   * Add custom policy
   * @param {string} policyId - Policy ID
   * @param {object} policyConfig - Policy configuration
   * @returns {object} Addition result
   */
  addPolicy(policyId, policyConfig) {
    if (this.policies.has(policyId)) {
      throw new Error(`Policy '${policyId}' already exists`);
    }
    
    // Validate policy config
    if (!policyConfig.condition || typeof policyConfig.condition !== 'function') {
      throw new Error('Policy must have a condition function');
    }
    
    if (!policyConfig.action) {
      throw new Error('Policy must specify an action');
    }
    
    this.policies.set(policyId, {
      enabled: true,
      priority: 5,
      ...policyConfig
    });
    
    this.emit('policy-added', { policyId });
    
    return {
      success: true,
      policyId,
      message: `Policy '${policyId}' added successfully`
    };
  }

  /**
   * Shutdown lifecycle manager
   */
  async shutdown() {
    // Clear all timers
    for (const [name, timer] of this.timers) {
      clearInterval(timer);
    }
    this.timers.clear();
    
    this.emit('lifecycle-manager-shutdown');
    
    return {
      success: true,
      message: 'Lifecycle manager shutdown completed'
    };
  }
}

module.exports = AgentLifecycleManager;