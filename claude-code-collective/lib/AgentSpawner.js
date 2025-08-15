/**
 * Claude Code Sub-Agent Collective - Agent Spawner
 * 
 * Phase 7: Dynamic Agent Creation
 * 
 * This module handles dynamic instantiation of agents from templates,
 * including parameter injection, configuration management, and spawn validation.
 * 
 * @author Claude Code Sub-Agent Collective
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const AgentTemplateSystem = require('./AgentTemplateSystem');
const { MetricsCollector } = require('./metrics');

class AgentSpawner {
  constructor(options = {}) {
    this.templateSystem = new AgentTemplateSystem(options.templateSystem);
    this.metrics = new MetricsCollector(options.metrics);
    this.agentsDir = options.agentsDir || path.join(process.cwd(), '.claude', 'agents');
    this.testsDir = options.testsDir || path.join(process.cwd(), '.claude-collective', 'tests', 'agents');
    this.archiveDir = options.archiveDir || path.join(process.cwd(), '.claude-collective', 'archive', 'agents');
    
    // Configuration
    this.config = {
      maxConcurrentSpawns: options.maxConcurrentSpawns || 10,
      spawnTimeout: options.spawnTimeout || 30000, // 30 seconds
      validateOnSpawn: options.validateOnSpawn !== false,
      createTestContracts: options.createTestContracts !== false,
      enableMetrics: options.enableMetrics !== false,
      ...options.config
    };
    
    // Internal state
    this.activeSpawns = new Map();
    this.spawnHistory = [];
    this.initialized = false;
  }

  /**
   * Initialize the spawner
   */
  async initialize() {
    if (this.initialized) {
      return { success: true, message: 'Already initialized' };
    }

    // Initialize template system
    await this.templateSystem.initialize();
    
    // Initialize metrics collector
    await this.metrics.initialize();

    // Create required directories
    await fs.ensureDir(this.agentsDir);
    await fs.ensureDir(this.testsDir);
    await fs.ensureDir(this.archiveDir);

    this.initialized = true;

    return {
      success: true,
      message: 'AgentSpawner initialized successfully',
      agentsDir: this.agentsDir,
      testsDir: this.testsDir
    };
  }

  /**
   * Spawn a new agent from template
   * @param {object} config - Spawn configuration
   * @returns {object} Spawn result
   */
  async spawn(config) {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const spawnId = this.generateSpawnId();

    try {
      // Validate spawn request
      this.validateSpawnConfig(config);

      // Check concurrency limits
      if (this.activeSpawns.size >= this.config.maxConcurrentSpawns) {
        throw new Error(`Maximum concurrent spawns (${this.config.maxConcurrentSpawns}) exceeded`);
      }

      // Add to active spawns
      this.activeSpawns.set(spawnId, {
        config,
        startTime,
        status: 'initializing'
      });

      // Determine best template
      const templateId = await this.selectTemplate(config);
      
      // Prepare spawn parameters
      const spawnParameters = this.prepareSpawnParameters(config, templateId);
      
      // Validate parameters
      if (this.config.validateOnSpawn) {
        await this.validateSpawnParameters(templateId, spawnParameters);
      }

      // Update status
      this.activeSpawns.get(spawnId).status = 'creating';

      // Create agent from template
      const agent = await this.templateSystem.createAgent(templateId, spawnParameters);
      
      // Generate agent file path
      const agentPath = await this.writeAgentFile(agent);
      
      // Create test contracts if enabled
      let testPath = null;
      if (this.config.createTestContracts) {
        testPath = await this.createTestContracts(agent, config);
      }

      // Update status
      this.activeSpawns.get(spawnId).status = 'finalizing';

      // Record metrics
      if (this.config.enableMetrics) {
        await this.metrics.store('agent_spawn_success', {
          agentId: agent.id,
          templateId,
          spawnTime: Date.now() - startTime,
          purpose: config.purpose
        });
      }

      // Create spawn result
      const result = {
        success: true,
        spawnId,
        agent: {
          id: agent.id,
          name: agent.name,
          template: templateId,
          path: agentPath,
          testPath,
          metadata: agent.metadata
        },
        duration: Date.now() - startTime,
        invocation: `@${agent.id}`,
        message: `Agent '${agent.name}' spawned successfully from template '${templateId}'`
      };

      // Add to spawn history
      this.spawnHistory.push({
        spawnId,
        agentId: agent.id,
        templateId,
        timestamp: new Date().toISOString(),
        duration: result.duration,
        success: true
      });

      // Remove from active spawns
      this.activeSpawns.delete(spawnId);

      return result;

    } catch (error) {
      // Record failure metrics
      if (this.config.enableMetrics) {
        await this.metrics.store('agent_spawn_failure', {
          spawnId,
          error: error.message,
          duration: Date.now() - startTime,
          config
        });
      }

      // Update spawn history
      this.spawnHistory.push({
        spawnId,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        success: false,
        error: error.message
      });

      // Remove from active spawns
      this.activeSpawns.delete(spawnId);

      throw error;
    }
  }

  /**
   * Validate spawn configuration
   * @param {object} config - Spawn configuration
   */
  validateSpawnConfig(config) {
    if (!config) {
      throw new Error('Spawn configuration is required');
    }

    if (!config.name && !config.agentName) {
      throw new Error('Agent name is required (name or agentName)');
    }

    if (!config.purpose && !config.description) {
      throw new Error('Agent purpose or description is required');
    }

    // Validate arrays if provided
    if (config.tools && !Array.isArray(config.tools)) {
      throw new Error('tools must be an array');
    }

    if (config.capabilities && !Array.isArray(config.capabilities)) {
      throw new Error('capabilities must be an array');
    }

    if (config.responsibilities && !Array.isArray(config.responsibilities)) {
      throw new Error('responsibilities must be an array');
    }

    // Validate template if explicitly specified
    if (config.template && !this.templateSystem.getTemplate(config.template)) {
      throw new Error(`Specified template '${config.template}' not found`);
    }
  }

  /**
   * Select best template for configuration
   * @param {object} config - Spawn configuration
   * @returns {string} Template ID
   */
  async selectTemplate(config) {
    // Use explicit template if specified
    if (config.template) {
      return config.template;
    }

    // Intelligent template selection
    const templates = this.templateSystem.listTemplates();
    const scores = new Map();

    for (const template of templates) {
      let score = 0;

      // Check name/type matching
      const configType = config.type || config.agentType || '';
      if (template.id.includes(configType.toLowerCase())) {
        score += 20;
      }

      // Check purpose/description matching
      const purpose = (config.purpose || config.description || '').toLowerCase();
      const templateDesc = template.description.toLowerCase();
      
      if (purpose.includes('research') && template.id.includes('research')) {
        score += 15;
      }
      if (purpose.includes('implement') && template.id.includes('implementation')) {
        score += 15;
      }
      if (purpose.includes('test') && template.id.includes('testing')) {
        score += 15;
      }

      // Check tool requirements
      if (config.tools) {
        const templateDetails = this.templateSystem.getTemplate(template.id);
        const toolMatches = config.tools.filter(tool => 
          templateDetails.tools && templateDetails.tools.includes(tool)
        ).length;
        score += toolMatches * 5;
      }

      // Check capability requirements
      if (config.capabilities) {
        const templateDetails = this.templateSystem.getTemplate(template.id);
        const capabilityMatches = config.capabilities.filter(cap =>
          templateDetails.capabilities && templateDetails.capabilities.includes(cap)
        ).length;
        score += capabilityMatches * 3;
      }

      scores.set(template.id, score);
    }

    // Sort by score and return best match
    const sortedTemplates = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1]);

    // Return best match if score > 0, otherwise use base template
    return sortedTemplates[0] && sortedTemplates[0][1] > 0 
      ? sortedTemplates[0][0] 
      : 'base';
  }

  /**
   * Prepare spawn parameters
   * @param {object} config - Spawn configuration
   * @param {string} templateId - Selected template ID
   * @returns {object} Prepared parameters
   */
  prepareSpawnParameters(config, templateId) {
    return {
      agentName: config.name || config.agentName,
      agentType: config.type || config.agentType || 'dynamic',
      purpose: config.purpose || config.description,
      specialization: config.specialization || this.inferSpecialization(config, templateId),
      
      // Arrays
      responsibilities: config.responsibilities || this.generateDefaultResponsibilities(config),
      tools: config.tools || this.inferRequiredTools(config, templateId),
      capabilities: config.capabilities || this.inferCapabilities(config, templateId),
      metrics: config.metrics || this.generateDefaultMetrics(config),
      
      // Handoff configuration
      incomingHandoffs: config.incomingHandoffs || [
        { from: '@routing-agent', condition: 'Task assignment and context transfer' }
      ],
      outgoingHandoffs: config.outgoingHandoffs || [
        { to: '@routing-agent', condition: 'Task completion or escalation required' }
      ],
      
      // Test contracts
      testContracts: config.testContracts || [],
      
      // Directives
      primeDirective: config.primeDirective || 
        'Execute assigned tasks with excellence while maintaining collective coordination',
      principles: config.principles || [
        'Follow hub-and-spoke coordination patterns',
        'Validate all inputs and outputs',
        'Maintain clear communication with routing hub',
        'Handle errors gracefully with proper escalation'
      ],
      
      // Additional configuration
      specializationConfig: config.specializationConfig || {},
      implementationNotes: config.notes || config.implementationNotes || ''
    };
  }

  /**
   * Infer specialization from configuration
   * @param {object} config - Configuration
   * @param {string} templateId - Template ID
   * @returns {string} Specialization
   */
  inferSpecialization(config, templateId) {
    const purpose = (config.purpose || '').toLowerCase();
    
    if (purpose.includes('research') || purpose.includes('analyze')) {
      return 'research and analysis';
    }
    if (purpose.includes('implement') || purpose.includes('code') || purpose.includes('develop')) {
      return 'implementation and development';
    }
    if (purpose.includes('test') || purpose.includes('validate') || purpose.includes('quality')) {
      return 'testing and validation';
    }
    if (purpose.includes('document') || purpose.includes('write')) {
      return 'documentation and communication';
    }
    
    return templateId.replace(/-agent$/, '').replace(/-/g, ' ');
  }

  /**
   * Generate default responsibilities
   * @param {object} config - Configuration
   * @returns {array} Responsibilities
   */
  generateDefaultResponsibilities(config) {
    const base = [
      'Execute assigned tasks efficiently and accurately',
      'Maintain quality standards throughout task execution',
      'Communicate progress and status to coordination hub'
    ];

    const purpose = (config.purpose || '').toLowerCase();
    
    if (purpose.includes('research')) {
      base.push('Conduct thorough research and analysis');
      base.push('Synthesize findings into actionable insights');
    }
    
    if (purpose.includes('implement') || purpose.includes('code')) {
      base.push('Write clean, maintainable, and well-tested code');
      base.push('Follow established coding standards and practices');
    }
    
    if (purpose.includes('test')) {
      base.push('Design and execute comprehensive test strategies');
      base.push('Ensure quality gate compliance before handoffs');
    }

    return base;
  }

  /**
   * Infer required tools
   * @param {object} config - Configuration
   * @param {string} templateId - Template ID
   * @returns {array} Required tools
   */
  inferRequiredTools(config, templateId) {
    const template = this.templateSystem.getTemplate(templateId);
    const baseTools = template?.tools || ['Read', 'Write', 'Edit'];
    
    const purpose = (config.purpose || '').toLowerCase();
    const additionalTools = [];
    
    if (purpose.includes('search') || purpose.includes('research')) {
      additionalTools.push('Grep', 'WebSearch');
    }
    
    if (purpose.includes('execute') || purpose.includes('run') || purpose.includes('command')) {
      additionalTools.push('Bash');
    }
    
    if (purpose.includes('file') || purpose.includes('directory')) {
      additionalTools.push('LS', 'Glob');
    }
    
    return [...new Set([...baseTools, ...additionalTools])];
  }

  /**
   * Infer capabilities
   * @param {object} config - Configuration
   * @param {string} templateId - Template ID
   * @returns {array} Capabilities
   */
  inferCapabilities(config, templateId) {
    const template = this.templateSystem.getTemplate(templateId);
    const baseCapabilities = template?.capabilities || ['basic-processing'];
    
    const purpose = (config.purpose || '').toLowerCase();
    const additionalCapabilities = [];
    
    if (purpose.includes('research') || purpose.includes('analyze')) {
      additionalCapabilities.push('research', 'analysis');
    }
    
    if (purpose.includes('implement') || purpose.includes('code') || purpose.includes('develop')) {
      additionalCapabilities.push('coding', 'implementation');
    }
    
    if (purpose.includes('test') || purpose.includes('validate')) {
      additionalCapabilities.push('testing', 'validation');
    }
    
    if (purpose.includes('document') || purpose.includes('write')) {
      additionalCapabilities.push('documentation', 'communication');
    }
    
    return [...new Set([...baseCapabilities, ...additionalCapabilities])];
  }

  /**
   * Generate default metrics
   * @param {object} config - Configuration
   * @returns {array} Metrics
   */
  generateDefaultMetrics(config) {
    const baseMetrics = [
      { name: 'Task Completion Rate', target: '95%' },
      { name: 'Response Time', target: '<10 seconds' },
      { name: 'Error Rate', target: '<5%' },
      { name: 'Quality Score', target: '>4.0/5.0' }
    ];

    const purpose = (config.purpose || '').toLowerCase();
    
    if (purpose.includes('research')) {
      baseMetrics.push({ name: 'Research Accuracy', target: '>90%' });
      baseMetrics.push({ name: 'Source Reliability', target: '>85%' });
    }
    
    if (purpose.includes('implement') || purpose.includes('code')) {
      baseMetrics.push({ name: 'Code Coverage', target: '>80%' });
      baseMetrics.push({ name: 'Technical Debt', target: '<10%' });
    }
    
    if (purpose.includes('test')) {
      baseMetrics.push({ name: 'Test Coverage', target: '>90%' });
      baseMetrics.push({ name: 'Defect Detection Rate', target: '>95%' });
    }

    return baseMetrics;
  }

  /**
   * Validate spawn parameters
   * @param {string} templateId - Template ID
   * @param {object} parameters - Parameters to validate
   */
  async validateSpawnParameters(templateId, parameters) {
    const template = this.templateSystem.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template '${templateId}' not found during validation`);
    }

    // Validate required parameters
    const required = template.requiredParameters || [];
    for (const param of required) {
      if (!(param in parameters) || parameters[param] == null || parameters[param] === '') {
        throw new Error(`Required parameter '${param}' is missing or empty`);
      }
    }

    // Validate tools exist
    if (parameters.tools) {
      const validTools = [
        'Read', 'Write', 'Edit', 'MultiEdit', 'Bash', 'Grep', 'Glob', 'LS',
        'WebFetch', 'WebSearch', 'Task', 'TodoWrite'
      ];
      
      const invalidTools = parameters.tools.filter(tool => !validTools.includes(tool));
      if (invalidTools.length > 0) {
        throw new Error(`Invalid tools specified: ${invalidTools.join(', ')}`);
      }
    }

    // Validate agent name doesn't conflict
    if (parameters.agentName) {
      const existingAgentPath = path.join(this.agentsDir, `${parameters.agentName}.md`);
      if (await fs.pathExists(existingAgentPath)) {
        throw new Error(`Agent with name '${parameters.agentName}' already exists`);
      }
    }
  }

  /**
   * Write agent file to disk
   * @param {object} agent - Agent configuration
   * @returns {string} Agent file path
   */
  async writeAgentFile(agent) {
    const fileName = `${agent.id}.md`;
    const agentPath = path.join(this.agentsDir, fileName);
    
    // Ensure directory exists
    await fs.ensureDir(this.agentsDir);
    
    // Write agent file
    await fs.writeFile(agentPath, agent.content, 'utf8');
    
    return agentPath;
  }

  /**
   * Create test contracts for agent
   * @param {object} agent - Agent configuration
   * @param {object} config - Original spawn configuration
   * @returns {string} Test file path
   */
  async createTestContracts(agent, config) {
    const testDir = path.join(this.testsDir, agent.id);
    await fs.ensureDir(testDir);

    const testContent = this.generateTestContent(agent, config);
    const testPath = path.join(testDir, `${agent.id}.test.js`);
    
    await fs.writeFile(testPath, testContent, 'utf8');
    
    return testPath;
  }

  /**
   * Generate test contract content
   * @param {object} agent - Agent configuration
   * @param {object} config - Original spawn configuration
   * @returns {string} Test content
   */
  generateTestContent(agent, config) {
    return `/**
 * Test contracts for ${agent.name}
 * Agent ID: ${agent.id}
 * Template: ${agent.template}
 * Generated: ${new Date().toISOString()}
 */

const { validateAgent, loadAgent } = require('../../helpers/agent-validator');

describe('${agent.name} Agent Tests', () => {
  let agent;

  beforeAll(async () => {
    agent = await loadAgent('${agent.id}');
  });

  describe('Agent Initialization', () => {
    test('agent loads successfully', () => {
      expect(agent).toBeDefined();
      expect(agent.id).toBe('${agent.id}');
      expect(agent.name).toBe('${agent.name}');
    });

    test('agent has required metadata', () => {
      expect(agent.metadata).toBeDefined();
      expect(agent.metadata.templateId).toBe('${agent.template}');
      expect(agent.metadata.created).toBeDefined();
    });
  });

  describe('Tool Availability', () => {
    test('agent has required tools', () => {
      const requiredTools = ${JSON.stringify(agent.metadata.tools || [])};
      requiredTools.forEach(tool => {
        expect(agent.tools).toContain(tool);
      });
    });

    test('agent has expected capabilities', () => {
      const expectedCapabilities = ${JSON.stringify(agent.metadata.capabilities || [])};
      expectedCapabilities.forEach(capability => {
        expect(agent.capabilities).toContain(capability);
      });
    });
  });

  describe('Handoff Contracts', () => {
    test('accepts handoff from routing agent', async () => {
      const handoffData = {
        from: '@routing-agent',
        to: '${agent.id}',
        task: {
          type: '${config.type || 'general'}',
          purpose: '${config.purpose || 'test task'}',
          context: {}
        },
        metadata: {
          timestamp: new Date().toISOString(),
          priority: 'normal'
        }
      };

      const result = await agent.receiveHandoff(handoffData);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.acknowledged).toBe(true);
    });

    test('validates handoff data structure', async () => {
      const invalidHandoff = {
        from: '@routing-agent',
        // Missing required fields
      };

      await expect(agent.receiveHandoff(invalidHandoff)).rejects.toThrow();
    });
  });

  describe('Task Processing', () => {
    test('processes valid task requests', async () => {
      const task = {
        type: '${config.type || 'general'}',
        purpose: '${config.purpose || 'test processing'}',
        parameters: {},
        context: {}
      };

      const result = await agent.processTask(task);
      expect(result).toBeDefined();
      expect(result.success).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    test('handles invalid input gracefully', async () => {
      const invalidTask = null;

      const result = await agent.processTask(invalidTask);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(typeof result.error).toBe('string');
    });
  });

  describe('Error Handling', () => {
    test('reports errors correctly', async () => {
      const errorTask = {
        type: 'invalid',
        purpose: 'trigger error',
        forceError: true
      };

      const result = await agent.processTask(errorTask);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.metadata.errorHandled).toBe(true);
    });
  });

  describe('Performance Metrics', () => {
    test('tracks response times', async () => {
      const startTime = Date.now();
      
      const task = {
        type: 'performance-test',
        purpose: 'measure response time'
      };

      const result = await agent.processTask(task);
      const duration = Date.now() - startTime;

      expect(result.metadata.processingTime).toBeDefined();
      expect(duration).toBeLessThan(10000); // Less than 10 seconds
    });
  });

  ${config.testContracts ? config.testContracts.map(contract => `
  describe('${contract.name}', () => {
    ${contract.code}
  });`).join('\n') : ''}
});`;
  }

  /**
   * Generate unique spawn ID
   * @returns {string} Spawn ID
   */
  generateSpawnId() {
    return `spawn-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  }

  /**
   * Get spawn statistics
   * @returns {object} Spawn statistics
   */
  getStatistics() {
    const totalSpawns = this.spawnHistory.length;
    const successfulSpawns = this.spawnHistory.filter(s => s.success).length;
    const failedSpawns = totalSpawns - successfulSpawns;
    
    const avgDuration = this.spawnHistory.length > 0 
      ? this.spawnHistory.reduce((sum, s) => sum + s.duration, 0) / this.spawnHistory.length
      : 0;

    const templateUsage = {};
    this.spawnHistory.forEach(spawn => {
      if (spawn.templateId) {
        templateUsage[spawn.templateId] = (templateUsage[spawn.templateId] || 0) + 1;
      }
    });

    return {
      totalSpawns,
      successfulSpawns,
      failedSpawns,
      successRate: totalSpawns > 0 ? (successfulSpawns / totalSpawns) : 0,
      avgSpawnDuration: Math.round(avgDuration),
      activeSpawns: this.activeSpawns.size,
      templateUsage,
      recentSpawns: this.spawnHistory.slice(-10).map(s => ({
        spawnId: s.spawnId,
        agentId: s.agentId,
        templateId: s.templateId,
        timestamp: s.timestamp,
        success: s.success,
        duration: s.duration
      }))
    };
  }

  /**
   * List active spawns
   * @returns {array} Active spawn list
   */
  listActiveSpawns() {
    return Array.from(this.activeSpawns.entries()).map(([spawnId, spawn]) => ({
      spawnId,
      config: spawn.config,
      status: spawn.status,
      duration: Date.now() - spawn.startTime,
      startTime: new Date(spawn.startTime).toISOString()
    }));
  }

  /**
   * Cancel active spawn
   * @param {string} spawnId - Spawn ID to cancel
   * @returns {object} Cancellation result
   */
  async cancelSpawn(spawnId) {
    const spawn = this.activeSpawns.get(spawnId);
    if (!spawn) {
      throw new Error(`Active spawn '${spawnId}' not found`);
    }

    // Remove from active spawns
    this.activeSpawns.delete(spawnId);

    // Record cancellation
    this.spawnHistory.push({
      spawnId,
      timestamp: new Date().toISOString(),
      duration: Date.now() - spawn.startTime,
      success: false,
      cancelled: true
    });

    return {
      success: true,
      spawnId,
      message: `Spawn '${spawnId}' cancelled successfully`
    };
  }
}

module.exports = AgentSpawner;