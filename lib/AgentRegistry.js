/**
 * Claude Code Sub-Agent Collective - Agent Registry
 * 
 * Phase 7: Dynamic Agent Creation
 * 
 * This module provides persistent registry for tracking all dynamically created agents
 * including lifecycle tracking, status monitoring, and agent metadata storage.
 * 
 * @author Claude Code Sub-Agent Collective
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const EventEmitter = require('events');

class AgentRegistry extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.registryDir = options.registryDir || path.join(process.cwd(), '.claude', 'state');
    this.registryFile = path.join(this.registryDir, 'agent-registry.json');
    this.backupDir = path.join(this.registryDir, 'backups');
    
    // Configuration
    this.config = {
      persistenceEnabled: options.persistenceEnabled !== false,
      backupInterval: options.backupInterval || 3600000, // 1 hour
      maxBackups: options.maxBackups || 10,
      autoCleanup: options.autoCleanup !== false,
      healthCheckInterval: options.healthCheckInterval || 300000, // 5 minutes
      ...options.config
    };
    
    // Internal state
    this.agents = new Map();
    this.activityLog = [];
    this.statistics = {
      totalRegistrations: 0,
      totalUnregistrations: 0,
      activeAgents: 0,
      healthChecks: 0,
      lastBackup: null
    };
    
    this.initialized = false;
    this.backupTimer = null;
    this.healthCheckTimer = null;
  }

  /**
   * Initialize the registry
   */
  async initialize() {
    if (this.initialized) {
      return { success: true, message: 'Already initialized' };
    }

    // Create required directories
    await fs.ensureDir(this.registryDir);
    await fs.ensureDir(this.backupDir);

    // Load existing registry
    if (this.config.persistenceEnabled) {
      await this.loadRegistry();
    }

    // Start background tasks
    if (this.config.persistenceEnabled && this.config.backupInterval > 0) {
      this.startBackupTimer();
    }

    if (this.config.healthCheckInterval > 0) {
      this.startHealthCheckTimer();
    }

    this.initialized = true;

    this.emit('registry-initialized', {
      agentsLoaded: this.agents.size,
      persistenceEnabled: this.config.persistenceEnabled
    });

    return {
      success: true,
      message: 'AgentRegistry initialized successfully',
      agentsLoaded: this.agents.size,
      registryFile: this.registryFile
    };
  }

  /**
   * Register a new agent
   * @param {object} agentInfo - Agent information
   * @returns {object} Registration result
   */
  async register(agentInfo) {
    if (!this.initialized) {
      await this.initialize();
    }

    // Validate agent info
    this.validateAgentInfo(agentInfo);

    // Check for existing registration
    if (this.agents.has(agentInfo.id)) {
      throw new Error(`Agent '${agentInfo.id}' is already registered`);
    }

    // Create registration entry
    const registration = {
      id: agentInfo.id,
      name: agentInfo.name,
      template: agentInfo.template,
      path: agentInfo.path,
      testPath: agentInfo.testPath,
      
      // Metadata
      metadata: {
        ...agentInfo.metadata,
        registeredAt: new Date().toISOString(),
        version: agentInfo.metadata?.version || '1.0.0'
      },
      
      // Status tracking
      status: 'active',
      statusHistory: [{
        status: 'active',
        timestamp: new Date().toISOString(),
        reason: 'initial registration'
      }],
      
      // Activity tracking
      activity: {
        lastSeen: new Date().toISOString(),
        invocations: 0,
        totalProcessingTime: 0,
        errorCount: 0,
        successCount: 0
      },
      
      // Performance metrics
      performance: {
        avgResponseTime: 0,
        successRate: 1.0,
        throughput: 0,
        reliability: 1.0
      },
      
      // Resource usage
      resources: {
        memoryUsage: 0,
        cpuUsage: 0,
        diskUsage: 0,
        networkUsage: 0
      },
      
      // Health status
      health: {
        status: 'healthy',
        lastCheck: new Date().toISOString(),
        checkCount: 0,
        failureCount: 0,
        issues: []
      }
    };

    // Store in registry
    this.agents.set(agentInfo.id, registration);
    
    // Update statistics
    this.statistics.totalRegistrations++;
    this.statistics.activeAgents++;
    
    // Log activity
    this.logActivity('registration', {
      agentId: agentInfo.id,
      agentName: agentInfo.name,
      template: agentInfo.template
    });

    // Persist registry
    if (this.config.persistenceEnabled) {
      await this.saveRegistry();
    }

    // Emit event
    this.emit('agent-registered', registration);

    return {
      success: true,
      agentId: agentInfo.id,
      message: `Agent '${agentInfo.name}' registered successfully`,
      registration
    };
  }

  /**
   * Unregister an agent
   * @param {string} agentId - Agent ID
   * @param {object} options - Unregistration options
   * @returns {object} Unregistration result
   */
  async unregister(agentId, options = {}) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent '${agentId}' not found in registry`);
    }

    const reason = options.reason || 'manual unregistration';
    const cleanup = options.cleanup !== false;

    // Update status
    agent.status = 'unregistered';
    agent.statusHistory.push({
      status: 'unregistered',
      timestamp: new Date().toISOString(),
      reason
    });

    // Cleanup agent files if requested
    if (cleanup) {
      await this.cleanupAgentFiles(agent);
    }

    // Remove from active registry
    this.agents.delete(agentId);

    // Update statistics
    this.statistics.totalUnregistrations++;
    this.statistics.activeAgents = Math.max(0, this.statistics.activeAgents - 1);

    // Log activity
    this.logActivity('unregistration', {
      agentId,
      agentName: agent.name,
      reason,
      cleanup
    });

    // Persist registry
    if (this.config.persistenceEnabled) {
      await this.saveRegistry();
    }

    // Emit event
    this.emit('agent-unregistered', { agentId, reason, cleanup });

    return {
      success: true,
      agentId,
      message: `Agent '${agentId}' unregistered successfully`,
      reason,
      cleanup
    };
  }

  /**
   * Query agents by criteria
   * @param {object} criteria - Query criteria
   * @returns {array} Matching agents
   */
  query(criteria = {}) {
    let results = Array.from(this.agents.values());

    // Apply filters
    if (criteria.id) {
      results = results.filter(agent => agent.id === criteria.id);
    }

    if (criteria.name) {
      const namePattern = new RegExp(criteria.name, 'i');
      results = results.filter(agent => namePattern.test(agent.name));
    }

    if (criteria.template) {
      results = results.filter(agent => agent.template === criteria.template);
    }

    if (criteria.status) {
      results = results.filter(agent => agent.status === criteria.status);
    }

    if (criteria.capabilities) {
      const requiredCaps = Array.isArray(criteria.capabilities) ? criteria.capabilities : [criteria.capabilities];
      results = results.filter(agent => 
        requiredCaps.every(cap => 
          agent.metadata.capabilities && agent.metadata.capabilities.includes(cap)
        )
      );
    }

    if (criteria.tools) {
      const requiredTools = Array.isArray(criteria.tools) ? criteria.tools : [criteria.tools];
      results = results.filter(agent =>
        requiredTools.every(tool =>
          agent.metadata.tools && agent.metadata.tools.includes(tool)
        )
      );
    }

    if (criteria.createdAfter) {
      const cutoff = new Date(criteria.createdAfter);
      results = results.filter(agent => 
        new Date(agent.metadata.registeredAt) > cutoff
      );
    }

    if (criteria.createdBefore) {
      const cutoff = new Date(criteria.createdBefore);
      results = results.filter(agent => 
        new Date(agent.metadata.registeredAt) < cutoff
      );
    }

    if (criteria.healthStatus) {
      results = results.filter(agent => agent.health.status === criteria.healthStatus);
    }

    if (criteria.minSuccessRate !== undefined) {
      results = results.filter(agent => agent.performance.successRate >= criteria.minSuccessRate);
    }

    if (criteria.maxResponseTime !== undefined) {
      results = results.filter(agent => agent.performance.avgResponseTime <= criteria.maxResponseTime);
    }

    // Sort results
    if (criteria.sortBy) {
      results.sort((a, b) => {
        const aValue = this.getNestedValue(a, criteria.sortBy);
        const bValue = this.getNestedValue(b, criteria.sortBy);
        
        if (criteria.sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        }
        return aValue > bValue ? 1 : -1;
      });
    }

    // Limit results
    if (criteria.limit) {
      results = results.slice(0, criteria.limit);
    }

    return results;
  }

  /**
   * Get agent by ID
   * @param {string} agentId - Agent ID
   * @returns {object} Agent information
   */
  getAgent(agentId) {
    return this.agents.get(agentId);
  }

  /**
   * Update agent status
   * @param {string} agentId - Agent ID
   * @param {string} status - New status
   * @param {object} options - Update options
   * @returns {object} Update result
   */
  async updateStatus(agentId, status, options = {}) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent '${agentId}' not found in registry`);
    }

    const previousStatus = agent.status;
    const reason = options.reason || 'status update';

    // Update status
    agent.status = status;
    agent.statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      reason,
      previousStatus
    });

    // Update last seen
    agent.activity.lastSeen = new Date().toISOString();

    // Log activity
    this.logActivity('status-update', {
      agentId,
      previousStatus,
      newStatus: status,
      reason
    });

    // Persist registry
    if (this.config.persistenceEnabled) {
      await this.saveRegistry();
    }

    // Emit event
    this.emit('agent-status-changed', { agentId, previousStatus, newStatus: status, reason });

    return {
      success: true,
      agentId,
      previousStatus,
      newStatus: status,
      reason
    };
  }

  /**
   * Update agent activity
   * @param {string} agentId - Agent ID
   * @param {object} activityData - Activity data
   * @returns {object} Update result
   */
  async updateActivity(agentId, activityData = {}) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent '${agentId}' not found in registry`);
    }

    // Update activity tracking
    agent.activity.lastSeen = new Date().toISOString();
    
    if (activityData.processingTime !== undefined) {
      agent.activity.invocations++;
      agent.activity.totalProcessingTime += activityData.processingTime;
      
      // Update performance metrics
      agent.performance.avgResponseTime = 
        agent.activity.totalProcessingTime / agent.activity.invocations;
    }

    if (activityData.success !== undefined) {
      if (activityData.success) {
        agent.activity.successCount++;
      } else {
        agent.activity.errorCount++;
      }
      
      // Update success rate
      const totalRequests = agent.activity.successCount + agent.activity.errorCount;
      agent.performance.successRate = agent.activity.successCount / totalRequests;
    }

    // Update resource usage
    if (activityData.resources) {
      Object.assign(agent.resources, activityData.resources);
    }

    // Log activity
    this.logActivity('activity-update', {
      agentId,
      activityData
    });

    // Persist registry
    if (this.config.persistenceEnabled) {
      await this.saveRegistry();
    }

    // Emit event
    this.emit('agent-activity-updated', { agentId, activityData });

    return {
      success: true,
      agentId,
      activity: agent.activity,
      performance: agent.performance
    };
  }

  /**
   * Run health check on agent
   * @param {string} agentId - Agent ID
   * @returns {object} Health check result
   */
  async checkHealth(agentId) {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new Error(`Agent '${agentId}' not found in registry`);
    }

    const healthCheck = {
      agentId,
      timestamp: new Date().toISOString(),
      status: 'healthy',
      issues: []
    };

    try {
      // Check if agent file exists
      if (agent.path && !await fs.pathExists(agent.path)) {
        healthCheck.issues.push('Agent file not found');
        healthCheck.status = 'unhealthy';
      }

      // Check if agent file content is valid
      if (agent.path && await fs.pathExists(agent.path)) {
        try {
          const content = await fs.readFile(agent.path, 'utf8');
          
          // Check for corrupted content
          if (content.includes('corrupted content') || content.trim().length < 10) {
            healthCheck.issues.push('Agent file content is corrupted');
            healthCheck.status = 'unhealthy';
          }
          
          // Basic validation for agent markdown structure
          if (!content.includes('---') && !content.includes('# ') && !content.includes('## ')) {
            healthCheck.issues.push('Agent file does not contain valid markdown structure');
            healthCheck.status = 'unhealthy';
          }
        } catch (fileError) {
          healthCheck.issues.push(`Cannot read agent file: ${fileError.message}`);
          healthCheck.status = 'unhealthy';
        }
      }

      // Check if agent is responsive (simplified check)
      const lastSeen = new Date(agent.activity.lastSeen);
      const timeSinceLastSeen = Date.now() - lastSeen.getTime();
      
      if (timeSinceLastSeen > 3600000) { // 1 hour
        healthCheck.issues.push('Agent inactive for over 1 hour');
        healthCheck.status = 'warning';
      }

      // Check performance metrics
      if (agent.performance.successRate < 0.8) {
        healthCheck.issues.push(`Low success rate: ${(agent.performance.successRate * 100).toFixed(1)}%`);
        healthCheck.status = 'warning';
      }

      if (agent.performance.avgResponseTime > 30000) { // 30 seconds
        healthCheck.issues.push(`High response time: ${(agent.performance.avgResponseTime / 1000).toFixed(1)}s`);
        healthCheck.status = 'warning';
      }

      // Check resource usage
      if (agent.resources.memoryUsage > 100 * 1024 * 1024) { // 100MB
        healthCheck.issues.push('High memory usage');
        healthCheck.status = 'warning';
      }

    } catch (error) {
      healthCheck.status = 'error';
      healthCheck.issues.push(`Health check failed: ${error.message}`);
    }

    // Update agent health
    agent.health = {
      status: healthCheck.status,
      lastCheck: healthCheck.timestamp,
      checkCount: agent.health.checkCount + 1,
      failureCount: healthCheck.status === 'error' ? agent.health.failureCount + 1 : agent.health.failureCount,
      issues: healthCheck.issues
    };

    // Update statistics
    this.statistics.healthChecks++;

    // Log activity
    this.logActivity('health-check', {
      agentId,
      status: healthCheck.status,
      issueCount: healthCheck.issues.length
    });

    // Emit event
    this.emit('agent-health-checked', healthCheck);

    return healthCheck;
  }

  /**
   * Get registry statistics
   * @returns {object} Registry statistics
   */
  getStatistics() {
    const agents = Array.from(this.agents.values());
    
    // Status distribution
    const statusCounts = {};
    agents.forEach(agent => {
      statusCounts[agent.status] = (statusCounts[agent.status] || 0) + 1;
    });

    // Template usage
    const templateCounts = {};
    agents.forEach(agent => {
      templateCounts[agent.template] = (templateCounts[agent.template] || 0) + 1;
    });

    // Health status distribution
    const healthCounts = {};
    agents.forEach(agent => {
      healthCounts[agent.health.status] = (healthCounts[agent.health.status] || 0) + 1;
    });

    // Performance aggregates
    const avgResponseTime = agents.length > 0 
      ? agents.reduce((sum, agent) => sum + agent.performance.avgResponseTime, 0) / agents.length
      : 0;

    const avgSuccessRate = agents.length > 0
      ? agents.reduce((sum, agent) => sum + agent.performance.successRate, 0) / agents.length
      : 0;

    return {
      ...this.statistics,
      currentStats: {
        totalAgents: agents.length,
        statusDistribution: statusCounts,
        templateUsage: templateCounts,
        healthDistribution: healthCounts,
        avgResponseTime: Math.round(avgResponseTime),
        avgSuccessRate: Number(avgSuccessRate.toFixed(3)),
        recentActivity: this.activityLog.slice(-10)
      }
    };
  }

  /**
   * Export registry data
   * @returns {object} Registry export
   */
  exportRegistry() {
    return {
      version: '1.0.0',
      exported: new Date().toISOString(),
      config: this.config,
      statistics: this.getStatistics(),
      agents: Array.from(this.agents.entries()).map(([id, agent]) => ({
        id,
        ...agent
      })),
      activityLog: this.activityLog.slice(-100) // Last 100 activities
    };
  }

  /**
   * Import registry data
   * @param {object} data - Registry data to import
   * @returns {object} Import result
   */
  async importRegistry(data) {
    if (!data || !data.agents) {
      throw new Error('Invalid registry data');
    }

    // Clear current registry
    this.agents.clear();
    this.activityLog = [];

    // Import agents
    let importedCount = 0;
    for (const agentData of data.agents) {
      try {
        this.agents.set(agentData.id, agentData);
        importedCount++;
      } catch (error) {
        console.warn(`Failed to import agent ${agentData.id}:`, error.message);
      }
    }

    // Import activity log if present
    if (data.activityLog) {
      this.activityLog = data.activityLog;
    }

    // Update statistics
    this.statistics.activeAgents = this.agents.size;

    // Persist registry
    if (this.config.persistenceEnabled) {
      await this.saveRegistry();
    }

    this.emit('registry-imported', { importedCount });

    return {
      success: true,
      importedCount,
      message: `Imported ${importedCount} agents successfully`
    };
  }

  /**
   * Validate agent information
   * @param {object} agentInfo - Agent information to validate
   */
  validateAgentInfo(agentInfo) {
    const required = ['id', 'name', 'template', 'path'];
    for (const field of required) {
      if (!agentInfo[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (typeof agentInfo.id !== 'string' || agentInfo.id.length === 0) {
      throw new Error('Agent ID must be a non-empty string');
    }

    if (typeof agentInfo.name !== 'string' || agentInfo.name.length === 0) {
      throw new Error('Agent name must be a non-empty string');
    }

    if (!agentInfo.metadata) {
      throw new Error('Agent metadata is required');
    }
  }

  /**
   * Log activity
   * @param {string} type - Activity type
   * @param {object} data - Activity data
   */
  logActivity(type, data) {
    this.activityLog.push({
      type,
      timestamp: new Date().toISOString(),
      data
    });

    // Keep activity log limited
    if (this.activityLog.length > 1000) {
      this.activityLog = this.activityLog.slice(-500);
    }
  }

  /**
   * Get nested object value by path
   * @param {object} obj - Object to traverse
   * @param {string} path - Dot-separated path
   * @returns {any} Value at path
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((o, k) => o && o[k], obj);
  }

  /**
   * Cleanup agent files
   * @param {object} agent - Agent to cleanup
   */
  async cleanupAgentFiles(agent) {
    try {
      if (agent.path && await fs.pathExists(agent.path)) {
        await fs.remove(agent.path);
      }
      
      if (agent.testPath && await fs.pathExists(agent.testPath)) {
        await fs.remove(path.dirname(agent.testPath));
      }
    } catch (error) {
      console.warn(`Failed to cleanup files for agent ${agent.id}:`, error.message);
    }
  }

  /**
   * Migrate old agent data format to current format
   * @param {object} agentData - Agent data to migrate
   * @returns {object} Migrated agent data
   */
  migrateAgentData(agentData) {
    const currentTime = new Date().toISOString();
    
    // Ensure all required fields exist with defaults
    return {
      ...agentData,
      activity: agentData.activity || {
        lastSeen: currentTime,
        invocations: 0,
        totalProcessingTime: 0,
        errorCount: 0,
        successCount: 0
      },
      performance: agentData.performance || {
        avgResponseTime: 0,
        successRate: 1.0,
        throughput: 0,
        reliability: 1.0
      },
      health: agentData.health || {
        status: 'healthy',
        lastCheck: currentTime,
        checkCount: 0,
        failureCount: 0,
        issues: []
      },
      resources: agentData.resources || {
        memoryUsage: 0,
        cpuUsage: 0,
        diskUsage: 0,
        networkUsage: 0
      },
      statusHistory: agentData.statusHistory || [{
        status: agentData.status || 'active',
        timestamp: currentTime,
        reason: 'migrated from old format'
      }]
    };
  }

  /**
   * Load registry from disk
   */
  async loadRegistry() {
    if (!await fs.pathExists(this.registryFile)) {
      return;
    }

    try {
      const data = await fs.readJson(this.registryFile);
      
      if (data.agents) {
        for (const agentData of data.agents) {
          // Migrate old format by adding missing fields
          const migratedAgent = this.migrateAgentData(agentData);
          this.agents.set(migratedAgent.id, migratedAgent);
        }
      }

      if (data.statistics) {
        Object.assign(this.statistics, data.statistics);
      }

      if (data.activityLog) {
        this.activityLog = data.activityLog;
      }

      this.statistics.activeAgents = this.agents.size;

    } catch (error) {
      console.error('Failed to load registry:', error.message);
      // Create backup of corrupted file
      const backupFile = path.join(this.backupDir, `corrupted-${Date.now()}.json`);
      await fs.copy(this.registryFile, backupFile);
    }
  }

  /**
   * Save registry to disk
   */
  async saveRegistry() {
    try {
      const data = this.exportRegistry();
      await fs.writeJson(this.registryFile, data, { spaces: 2 });
    } catch (error) {
      console.error('Failed to save registry:', error.message);
      throw error;
    }
  }

  /**
   * Start backup timer
   */
  startBackupTimer() {
    this.backupTimer = setInterval(async () => {
      await this.createBackup();
    }, this.config.backupInterval).unref();
  }

  /**
   * Start health check timer
   */
  startHealthCheckTimer() {
    this.healthCheckTimer = setInterval(async () => {
      await this.runHealthChecks();
    }, this.config.healthCheckInterval).unref();
  }

  /**
   * Create registry backup
   */
  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupDir, `registry-backup-${timestamp}.json`);
      
      const data = this.exportRegistry();
      await fs.writeJson(backupFile, data, { spaces: 2 });
      
      this.statistics.lastBackup = new Date().toISOString();
      
      // Cleanup old backups
      await this.cleanupOldBackups();
      
      this.emit('backup-created', { backupFile });
      
    } catch (error) {
      console.error('Failed to create backup:', error.message);
      this.emit('backup-failed', { error: error.message });
    }
  }

  /**
   * Run health checks on all agents
   */
  async runHealthChecks() {
    const agents = Array.from(this.agents.keys());
    const results = [];
    
    for (const agentId of agents) {
      try {
        const result = await this.checkHealth(agentId);
        results.push(result);
      } catch (error) {
        console.warn(`Health check failed for agent ${agentId}:`, error.message);
      }
    }
    
    this.emit('health-checks-completed', { results });
    
    return results;
  }

  /**
   * Cleanup old backup files
   */
  async cleanupOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('registry-backup-'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          stat: fs.statSync(path.join(this.backupDir, file))
        }))
        .sort((a, b) => b.stat.mtime.getTime() - a.stat.mtime.getTime());

      // Remove excess backups
      if (backupFiles.length > this.config.maxBackups) {
        const filesToDelete = backupFiles.slice(this.config.maxBackups);
        
        for (const file of filesToDelete) {
          await fs.remove(file.path);
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup old backups:', error.message);
    }
  }

  /**
   * Cleanup inactive agents based on last activity
   * @param {number} daysSinceLastActivity - Days since last activity (0 = cleanup immediately)
   * @returns {Promise<{removed: number, agents: string[]}>}
   */
  async cleanupInactive(daysSinceLastActivity = 30) {
    const cutoffTime = Date.now() - (daysSinceLastActivity * 24 * 60 * 60 * 1000);
    const removedAgents = [];
    let removedCount = 0;

    for (const [agentId, agent] of this.agents.entries()) {
      // Check if agent is inactive based on last activity or status
      const lastActivity = agent.lastActivity || agent.registeredAt || 0;
      const isInactive = lastActivity < cutoffTime || agent.status === 'archived' || agent.status === 'inactive';
      
      if (isInactive) {
        this.agents.delete(agentId);
        removedAgents.push(agentId);
        removedCount++;
        this.emit('agent-removed', { agentId, reason: 'cleanup-inactive' });
      }
    }

    // Save updated registry
    if (removedCount > 0 && this.config.persistenceEnabled) {
      await this.saveRegistry();
    }

    return {
      removed: removedCount,
      agents: removedAgents
    };
  }

  /**
   * Shutdown registry
   */
  async shutdown() {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }

    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    // Final save
    if (this.config.persistenceEnabled) {
      await this.saveRegistry();
    }

    this.emit('registry-shutdown');

    return { success: true, message: 'Registry shutdown completed' };
  }
}

module.exports = AgentRegistry;