/**
 * Claude Code Sub-Agent Collective - Agent Spawn Command
 * 
 * Phase 7: Dynamic Agent Creation
 * 
 * This module provides command interface for agent spawning including quick spawn
 * for common templates and interactive mode for custom configuration.
 * 
 * @author Claude Code Sub-Agent Collective
 * @version 1.0.0
 */

const chalk = require('chalk');
const AgentSpawner = require('./AgentSpawner');
const AgentRegistry = require('./AgentRegistry');
const AgentLifecycleManager = require('./AgentLifecycleManager');
const { prompt } = require('enquirer');

class AgentSpawnCommand {
  constructor(options = {}) {
    this.spawner = new AgentSpawner(options.spawner);
    this.registry = new AgentRegistry(options.registry);
    this.lifecycle = new AgentLifecycleManager(this.spawner, this.registry, options.lifecycle);
    
    this.initialized = false;
  }

  /**
   * Initialize the spawn command system
   */
  async initialize() {
    if (this.initialized) {
      return { success: true, message: 'Already initialized' };
    }

    await this.spawner.initialize();
    await this.registry.initialize();
    await this.lifecycle.initialize();

    this.initialized = true;

    return {
      success: true,
      message: 'AgentSpawnCommand system initialized successfully'
    };
  }

  /**
   * Execute spawn command
   * @param {string} args - Command arguments
   * @param {object} context - Command context
   * @returns {object} Command result
   */
  async execute(args = '', context = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Parse command arguments
      const parsedArgs = this.parseArguments(args);
      
      // Determine execution mode
      switch (parsedArgs.mode) {
        case 'interactive':
          return await this.interactiveSpawn(parsedArgs, context);
        case 'template':
          return await this.templateSpawn(parsedArgs, context);
        case 'quick':
          return await this.quickSpawn(parsedArgs, context);
        case 'clone':
          return await this.cloneAgent(parsedArgs, context);
        case 'list-templates':
          return await this.listTemplates(context);
        case 'list-agents':
          return await this.listAgents(parsedArgs, context);
        case 'info':
          return await this.getAgentInfo(parsedArgs, context);
        case 'cleanup':
          return await this.cleanupAgents(parsedArgs, context);
        case 'status':
          return await this.getStatus(context);
        case 'help':
        default:
          return this.getHelp(parsedArgs.subcommand);
      }

    } catch (error) {
      return {
        success: false,
        error: error.message,
        type: 'agent-spawn-error',
        help: this.getErrorHelp(error.message)
      };
    }
  }

  /**
   * Parse command arguments
   * @param {string} args - Raw arguments
   * @returns {object} Parsed arguments
   */
  parseArguments(args) {
    const tokens = args.trim().split(/\s+/).filter(token => token.length > 0);
    
    if (tokens.length === 0) {
      return { mode: 'help' };
    }

    const [command, ...params] = tokens;
    const result = { mode: command, params };

    // Parse flags and options
    const flags = {};
    const options = {};
    const positional = [];

    for (let i = 0; i < params.length; i++) {
      const param = params[i];
      
      if (param.startsWith('--')) {
        const [key, value] = param.substring(2).split('=');
        if (value) {
          options[key] = value;
        } else if (i + 1 < params.length && !params[i + 1].startsWith('-')) {
          options[key] = params[++i];
        } else {
          flags[key] = true;
        }
      } else if (param.startsWith('-')) {
        const flag = param.substring(1);
        flags[flag] = true;
      } else {
        positional.push(param);
      }
    }

    result.flags = flags;
    result.options = options;
    result.positional = positional;

    // Command-specific parsing
    switch (command) {
      case 'quick':
        result.template = positional[0] || 'base';
        result.purpose = positional.slice(1).join(' ') || 'General purpose processing';
        break;
      
      case 'template':
        result.templateId = options.template || positional[0];
        break;
      
      case 'clone':
        result.sourceId = positional[0];
        result.newName = options.name || positional[1];
        break;
      
      case 'info':
        result.agentId = positional[0];
        break;
      
      case 'cleanup':
        result.agentIds = positional;
        break;
      
      case 'list-agents':
        result.filters = this.parseFilters(options);
        break;
    }

    return result;
  }

  /**
   * Parse filter options
   * @param {object} options - Options object
   * @returns {object} Filter criteria
   */
  parseFilters(options) {
    const filters = {};
    
    if (options.status) filters.status = options.status;
    if (options.template) filters.template = options.template;
    if (options.capability) filters.capabilities = options.capability.split(',');
    if (options.tool) filters.tools = options.tool.split(',');
    if (options.health) filters.healthStatus = options.health;
    if (options.limit) filters.limit = parseInt(options.limit, 10);
    if (options.sort) filters.sortBy = options.sort;
    if (options.order) filters.sortOrder = options.order;

    return filters;
  }

  /**
   * Interactive spawn mode
   * @param {object} args - Parsed arguments
   * @param {object} context - Command context
   * @returns {object} Spawn result
   */
  async interactiveSpawn(args, context) {
    // Interactive agent spawning initiated
    
    try {
      // Get available templates
      const templates = this.spawner.templateSystem.listTemplates();
      const templateChoices = templates.map(t => ({
        name: `${t.name} - ${t.description}`,
        value: t.id
      }));

      // Interactive prompts
      const responses = await prompt([
        {
          type: 'input',
          name: 'agentName',
          message: 'Agent name:',
          validate: (value) => value.length > 0 || 'Agent name is required'
        },
        {
          type: 'select',
          name: 'template',
          message: 'Select template:',
          choices: templateChoices
        },
        {
          type: 'input',
          name: 'purpose',
          message: 'Primary purpose:',
          validate: (value) => value.length > 0 || 'Purpose is required'
        },
        {
          type: 'multiselect',
          name: 'tools',
          message: 'Required tools:',
          choices: [
            'Read', 'Write', 'Edit', 'MultiEdit',
            'Bash', 'Grep', 'Glob', 'LS',
            'WebFetch', 'WebSearch', 'Task'
          ],
          initial: ['Read', 'Write', 'Edit']
        },
        {
          type: 'input',
          name: 'specialization',
          message: 'Specialization (optional):',
          required: false
        },
        {
          type: 'list',
          name: 'responsibilities',
          message: 'Key responsibilities (comma-separated):'
        },
        {
          type: 'confirm',
          name: 'createTests',
          message: 'Generate test contracts?',
          initial: true
        },
        {
          type: 'confirm',
          name: 'enableLifecycle',
          message: 'Enable lifecycle management?',
          initial: true
        }
      ]);

      // Build spawn configuration
      const spawnConfig = {
        name: responses.agentName,
        agentName: responses.agentName,
        template: responses.template,
        purpose: responses.purpose,
        tools: responses.tools,
        specialization: responses.specialization,
        responsibilities: responses.responsibilities,
        testContracts: responses.createTests ? [] : null, // Will be auto-generated
        enableLifecycle: responses.enableLifecycle
      };

      // Spawn the agent
      // Creating agent with provided configuration
      const result = await this.spawner.spawn(spawnConfig);

      // Register with registry
      await this.registry.register({
        id: result.agent.id,
        name: result.agent.name,
        template: result.agent.template,
        path: result.agent.path,
        testPath: result.agent.testPath,
        metadata: result.agent.metadata
      });

      // Success output
      // Agent created successfully with ID: ${result.agent.id}

      // Offer to test the agent
      if (responses.createTests) {
        const { runTests } = await prompt({
          type: 'confirm',
          name: 'runTests',
          message: 'Run agent tests now?',
          initial: true
        });

        if (runTests) {
          // This would run the generated tests
          // Running tests for newly created agent
        }
      }

      return {
        success: true,
        type: 'interactive-spawn',
        agent: result.agent,
        message: `Agent '${result.agent.name}' created successfully`,
        invocation: `@${result.agent.id}`
      };

    } catch (error) {
      if (error.name === 'prompt') {
        return {
          success: false,
          type: 'user-cancelled',
          message: 'Agent creation cancelled by user'
        };
      }
      throw error;
    }
  }

  /**
   * Template-based spawn mode
   * @param {object} args - Parsed arguments
   * @param {object} context - Command context
   * @returns {object} Spawn result
   */
  async templateSpawn(args, context) {
    if (!args.templateId) {
      throw new Error('Template ID is required. Use --template=<id> or specify as first argument.');
    }

    // Spawning agent from template: ${args.templateId}

    // Build configuration from template and options
    const spawnConfig = {
      name: args.options.name || `${args.templateId}-${Date.now()}`,
      template: args.templateId,
      purpose: args.options.purpose || `Specialized ${args.templateId} operations`,
      specialization: args.options.specialization,
      tools: args.options.tools ? args.options.tools.split(',') : undefined,
      responsibilities: args.options.responsibilities ? args.options.responsibilities.split(',') : undefined
    };

    // Add any additional options
    Object.keys(args.options).forEach(key => {
      if (!['name', 'purpose', 'specialization', 'tools', 'responsibilities'].includes(key)) {
        spawnConfig[key] = args.options[key];
      }
    });

    const result = await this.spawner.spawn(spawnConfig);

    // Register with registry
    await this.registry.register({
      id: result.agent.id,
      name: result.agent.name,
      template: result.agent.template,
      path: result.agent.path,
      testPath: result.agent.testPath,
      metadata: result.agent.metadata
    });

    // Template agent spawned successfully with ID: ${result.agent.id}

    return {
      success: true,
      type: 'template-spawn',
      templateId: args.templateId,
      agent: result.agent,
      message: `Agent created from template '${args.templateId}'`,
      invocation: `@${result.agent.id}`
    };
  }

  /**
   * Quick spawn mode
   * @param {object} args - Parsed arguments
   * @param {object} context - Command context
   * @returns {object} Spawn result
   */
  async quickSpawn(args, context) {
    // Quick agent spawn initiated

    const spawnConfig = {
      name: args.options.name || `quick-agent-${Date.now()}`,
      template: args.template,
      purpose: args.purpose,
      type: args.template === 'base' ? 'general' : args.template
    };

    // Creating ${spawnConfig.template} agent for specified purpose

    const result = await this.spawner.spawn(spawnConfig);

    // Register with registry
    await this.registry.register({
      id: result.agent.id,
      name: result.agent.name,
      template: result.agent.template,
      path: result.agent.path,
      testPath: result.agent.testPath,
      metadata: result.agent.metadata
    });

    // Quick spawn successful with ID: ${result.agent.id}

    return {
      success: true,
      type: 'quick-spawn',
      agent: result.agent,
      message: `Quick agent '${result.agent.name}' created`,
      invocation: `@${result.agent.id}`
    };
  }

  /**
   * Clone agent mode
   * @param {object} args - Parsed arguments
   * @param {object} context - Command context
   * @returns {object} Clone result
   */
  async cloneAgent(args, context) {
    if (!args.sourceId) {
      throw new Error('Source agent ID is required for cloning');
    }

    // Cloning agent: ${args.sourceId}

    // Get source agent
    const sourceAgent = this.registry.getAgent(args.sourceId);
    if (!sourceAgent) {
      throw new Error(`Source agent '${args.sourceId}' not found in registry`);
    }

    // Create clone configuration
    const cloneConfig = {
      name: args.newName || `${sourceAgent.name}-clone-${Date.now()}`,
      template: sourceAgent.template,
      purpose: `Cloned from ${sourceAgent.name}`,
      // Copy configuration from source
      tools: sourceAgent.metadata.tools,
      capabilities: sourceAgent.metadata.capabilities
    };

    const result = await this.spawner.spawn(cloneConfig);

    // Register with registry
    await this.registry.register({
      id: result.agent.id,
      name: result.agent.name,
      template: result.agent.template,
      path: result.agent.path,
      testPath: result.agent.testPath,
      metadata: result.agent.metadata
    });

    // Agent cloned successfully with ID: ${result.agent.id}

    return {
      success: true,
      type: 'clone-agent',
      sourceId: args.sourceId,
      agent: result.agent,
      message: `Agent cloned from '${args.sourceId}'`,
      invocation: `@${result.agent.id}`
    };
  }

  /**
   * List available templates
   * @param {object} context - Command context
   * @returns {object} Templates list
   */
  async listTemplates(context) {
    const templates = this.spawner.templateSystem.listTemplates();

    // Available agent templates listed

    return {
      success: true,
      type: 'list-templates',
      templates,
      message: `Found ${templates.length} available templates`
    };
  }

  /**
   * List agents
   * @param {object} args - Parsed arguments
   * @param {object} context - Command context
   * @returns {object} Agents list
   */
  async listAgents(args, context) {
    const agents = this.registry.query(args.filters);

    

    if (agents.length === 0) {
      
      return {
        success: true,
        type: 'list-agents',
        agents: [],
        message: 'No agents found'
      };
    }

    agents.forEach(agent => {
      const statusColor = agent.status === 'active' ? 'green' : 'yellow';
      const healthColor = agent.health.status === 'healthy' ? 'green' : 'red';

      
      
      
      
      
      
      
      
    });

    return {
      success: true,
      type: 'list-agents',
      agents,
      message: `Found ${agents.length} registered agents`
    };
  }

  /**
   * Get agent information
   * @param {object} args - Parsed arguments
   * @param {object} context - Command context
   * @returns {object} Agent info
   */
  async getAgentInfo(args, context) {
    if (!args.agentId) {
      throw new Error('Agent ID is required');
    }

    const agent = this.registry.getAgent(args.agentId);
    if (!agent) {
      throw new Error(`Agent '${args.agentId}' not found`);
    }

    

    // Basic info
    
    
    
    
    
    

    // Metadata
    // Agent metadata section
    
    
    
    
    

    // Performance
    
    
    
    
    
    

    // Health
    const healthColor = agent.health.status === 'healthy' ? 'green' : 'red';
    
    
    
    
    
    if (agent.health.issues.length > 0) {
      
    }

    return {
      success: true,
      type: 'agent-info',
      agent,
      message: `Information for agent '${agent.name}'`
    };
  }

  /**
   * Cleanup agents
   * @param {object} args - Parsed arguments
   * @param {object} context - Command context
   * @returns {object} Cleanup result
   */
  async cleanupAgents(args, context) {
    

    if (args.agentIds.length > 0) {
      // Clean specific agents
      const results = [];
      for (const agentId of args.agentIds) {
        try {
          await this.registry.unregister(agentId, { 
            reason: 'Manual cleanup',
            cleanup: true 
          });
          results.push({ agentId, success: true });
          
        } catch (error) {
          results.push({ agentId, success: false, error: error.message });
          
        }
      }

      return {
        success: true,
        type: 'cleanup-specific',
        results,
        message: `Attempted cleanup of ${args.agentIds.length} agents`
      };

    } else {
      // Run automatic cleanup
      const results = await this.lifecycle.runCleanup();
      
      
      
      const cleaned = results.filter(r => r.success);
      

      return {
        success: true,
        type: 'cleanup-automatic',
        results,
        message: `Automatic cleanup completed, ${cleaned.length} agents cleaned`
      };
    }
  }

  /**
   * Get system status
   * @param {object} context - Command context
   * @returns {object} Status result
   */
  async getStatus(context) {
    const registryStats = this.registry.getStatistics();
    const lifecycleStats = this.lifecycle.getStatistics();
    const spawnerStats = this.spawner.getStatistics();

    

    // Registry stats
    
    
    
    
    

    // Spawner stats
    
    
    
    
    
    

    // Lifecycle stats
    
    
    
    
    

    return {
      success: true,
      type: 'system-status',
      stats: {
        registry: registryStats,
        spawner: spawnerStats,
        lifecycle: lifecycleStats
      },
      message: 'Agent system status retrieved'
    };
  }

  /**
   * Get help information
   * @param {string} subcommand - Subcommand to get help for
   * @returns {object} Help result
   */
  getHelp(subcommand = null) {
    

    if (!subcommand) {
      // General help
      
      

      
      
      
      
      
      
      
      
      
      

      
      
      
      
      
      
      

    } else {
      // Specific command help
      this.getSpecificHelp(subcommand);
    }

    return {
      success: true,
      type: 'help',
      subcommand,
      message: 'Agent spawn help displayed'
    };
  }

  /**
   * Get specific command help
   * @param {string} subcommand - Specific subcommand
   */
  getSpecificHelp(subcommand) {
    const helpContent = {
      interactive: {
        description: 'Interactive agent configuration with guided prompts',
        usage: '/agent spawn interactive',
        options: 'None - all configuration done through prompts'
      },
      quick: {
        description: 'Quick spawn with minimal configuration',
        usage: '/agent spawn quick [template] "purpose description"',
        options: '--name=<name> - Override agent name'
      },
      template: {
        description: 'Spawn from specific template with options',
        usage: '/agent spawn template <template-id> [options]',
        options: '--name=<name>, --purpose=<purpose>, --specialization=<spec>'
      },
      clone: {
        description: 'Clone an existing agent',
        usage: '/agent spawn clone <source-agent-id> [options]',
        options: '--name=<new-name> - Name for the clone'
      }
    };

    const help = helpContent[subcommand];
    if (help) {
      
      
      
      
      
      
    } else {
      
    }
  }

  /**
   * Get error help
   * @param {string} error - Error message
   * @returns {string} Help message
   */
  getErrorHelp(error) {
    const errorHelp = {
      'Template.*not found': 'Use "list-templates" to see available templates',
      'Agent.*not found': 'Use "list-agents" to see registered agents',
      'required': 'Check the command syntax with "help"',
      'Invalid.*argument': 'Verify your command arguments and options'
    };

    for (const [pattern, help] of Object.entries(errorHelp)) {
      if (new RegExp(pattern, 'i').test(error)) {
        return help;
      }
    }

    return 'Use "/agent spawn help" for usage information';
  }
}

module.exports = AgentSpawnCommand;