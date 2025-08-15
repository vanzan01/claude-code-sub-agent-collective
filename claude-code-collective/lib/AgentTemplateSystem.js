/**
 * Claude Code Sub-Agent Collective - Agent Template System
 * 
 * Phase 7: Dynamic Agent Creation
 * 
 * This module provides template-based agent creation with inheritance,
 * parameter injection, and capability composition.
 * 
 * @author Claude Code Sub-Agent Collective
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const Handlebars = require('handlebars');

class AgentTemplateSystem {
  constructor(options = {}) {
    this.templatesDir = options.templatesDir || path.join(process.cwd(), '.claude', 'templates');
    this.templates = new Map();
    this.capabilities = new Map();
    this.schemas = new Map();
    
    // Initialize default templates
    this.initializeDefaultTemplates();
    
    // Set up Handlebars helpers
    this.setupHandlebarsHelpers();
  }

  /**
   * Initialize default agent templates
   */
  initializeDefaultTemplates() {
    // Base agent template
    this.templates.set('base', {
      id: 'base',
      name: 'Base Agent',
      description: 'Foundation template for all specialized agents',
      version: '1.0.0',
      tools: ['Read', 'Write', 'Edit'],
      capabilities: ['basic-processing'],
      requiredParameters: ['agentName', 'purpose'],
      optionalParameters: ['specialization', 'responsibilities', 'metrics'],
      template: this.getBaseTemplate(),
      schema: this.getBaseSchema()
    });

    // Specialized templates
    this.templates.set('research-agent', {
      id: 'research-agent',
      name: 'Research Agent',
      description: 'Specialized for research, documentation, and analysis tasks',
      parent: 'base',
      version: '1.0.0',
      tools: ['Read', 'Write', 'Edit', 'Grep', 'WebSearch'],
      capabilities: ['research', 'analysis', 'documentation'],
      requiredParameters: ['researchDomain'],
      optionalParameters: ['sources', 'methodology'],
      specialization: {
        domains: ['technical', 'academic', 'market'],
        methods: ['literature-review', 'data-analysis', 'synthesis'],
        outputs: ['reports', 'documentation', 'recommendations']
      }
    });

    this.templates.set('implementation-agent', {
      id: 'implementation-agent', 
      name: 'Implementation Agent',
      description: 'Specialized for code implementation and development tasks',
      parent: 'base',
      version: '1.0.0',
      tools: ['Read', 'Write', 'Edit', 'MultiEdit', 'Bash', 'Grep'],
      capabilities: ['coding', 'testing', 'debugging'],
      requiredParameters: ['language', 'framework'],
      optionalParameters: ['testFramework', 'architecture'],
      specialization: {
        languages: ['javascript', 'python', 'typescript'],
        frameworks: ['react', 'node', 'express'],
        patterns: ['mvc', 'clean-architecture', 'microservices']
      }
    });

    this.templates.set('testing-agent', {
      id: 'testing-agent',
      name: 'Testing Agent',
      description: 'Specialized for test creation, validation, and quality assurance',
      parent: 'base',
      version: '1.0.0',
      tools: ['Read', 'Write', 'Edit', 'Bash'],
      capabilities: ['testing', 'validation', 'quality-assurance'],
      requiredParameters: ['testType'],
      optionalParameters: ['coverage', 'framework'],
      specialization: {
        types: ['unit', 'integration', 'e2e'],
        frameworks: ['jest', 'mocha', 'playwright'],
        strategies: ['tdd', 'bdd', 'contract-testing']
      }
    });
  }

  /**
   * Set up Handlebars template helpers
   */
  setupHandlebarsHelpers() {
    Handlebars.registerHelper('dateNow', () => {
      return new Date().toISOString();
    });

    Handlebars.registerHelper('json', (obj) => {
      return JSON.stringify(obj, null, 2);
    });

    Handlebars.registerHelper('capitalizeFirst', (str) => {
      return str.charAt(0).toUpperCase() + str.slice(1);
    });

    Handlebars.registerHelper('joinArray', (arr, separator = ', ') => {
      return Array.isArray(arr) ? arr.join(separator) : '';
    });
  }

  /**
   * Get base agent template content
   */
  getBaseTemplate() {
    return `# {{agentName}} Agent

## 🤖 Agent Profile
**ID**: {{agentId}}
**Type**: {{agentType}}
**Specialization**: {{specialization}}
**Created**: {{dateNow}}
**Purpose**: {{purpose}}
**Version**: 1.0.0

## 🎯 Core Responsibilities
{{#each responsibilities}}
- {{this}}
{{/each}}

## 🛠 Available Tools
{{#each tools}}
- {{this}}
{{/each}}

## 📋 Capabilities
{{#each capabilities}}
- {{capitalizeFirst this}}
{{/each}}

## 📊 Success Metrics
{{#each metrics}}
- **{{this.name}}**: {{this.target}}
{{/each}}

## 🔄 Handoff Protocol

### Prime Directive
{{primeDirective}}

### Incoming Handoffs
Accepts handoffs from:
{{#each incomingHandoffs}}
- **{{this.from}}**: {{this.condition}}
{{/each}}

### Outgoing Handoffs  
Routes to:
{{#each outgoingHandoffs}}
- **{{this.to}}**: {{this.condition}}
{{/each}}

## 🧪 Test Contracts
{{#each testContracts}}
### {{this.name}}
\`\`\`javascript
{{this.code}}
\`\`\`
{{/each}}

## 💡 Behavioral Directives

### Operating Principles
{{#each principles}}
{{@index}}. {{this}}
{{/each}}

## 🔧 Specialization Configuration
\`\`\`json
{{json specializationConfig}}
\`\`\`

## 📝 Implementation Notes
{{implementationNotes}}

---
*Generated by AgentTemplateSystem v1.0.0*
*Template: {{templateId}}*
*Parameters: {{json templateParameters}}*`;
  }

  /**
   * Get base template JSON schema
   */
  getBaseSchema() {
    return {
      type: 'object',
      required: ['agentName', 'purpose'],
      properties: {
        agentName: { type: 'string', minLength: 1 },
        agentType: { type: 'string', default: 'specialized' },
        specialization: { type: 'string', default: 'general' },
        purpose: { type: 'string', minLength: 1 },
        responsibilities: {
          type: 'array',
          items: { type: 'string' },
          default: []
        },
        tools: {
          type: 'array', 
          items: { type: 'string' },
          default: ['Read', 'Write', 'Edit']
        },
        capabilities: {
          type: 'array',
          items: { type: 'string' },
          default: ['basic-processing']
        },
        metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              target: { type: 'string' }
            }
          },
          default: []
        }
      }
    };
  }

  /**
   * Create agent from template
   * @param {string} templateId - Template identifier
   * @param {object} parameters - Template parameters
   * @returns {object} Generated agent configuration
   */
  async createAgent(templateId, parameters = {}) {
    const template = this.getResolvedTemplate(templateId);
    if (!template) {
      throw new Error(`Template '${templateId}' not found`);
    }

    // Validate parameters
    this.validateParameters(template, parameters);

    // Generate unique agent ID
    const agentId = this.generateAgentId(parameters.agentName, templateId);

    // Merge template defaults with parameters
    const templateData = this.mergeTemplateData(template, parameters, agentId);

    // Compile template
    const compiled = Handlebars.compile(template.template);
    const content = compiled(templateData);

    return {
      id: agentId,
      name: parameters.agentName || agentId,
      template: templateId,
      content: content,
      metadata: {
        templateId,
        templateVersion: template.version,
        created: new Date().toISOString(),
        parameters: parameters,
        tools: templateData.tools,
        capabilities: templateData.capabilities
      }
    };
  }

  /**
   * Get resolved template with inheritance
   * @param {string} templateId - Template identifier
   * @returns {object} Resolved template
   */
  getResolvedTemplate(templateId) {
    const template = this.templates.get(templateId);
    if (!template) {
      return null;
    }

    // Handle inheritance
    if (template.parent) {
      const parentTemplate = this.getResolvedTemplate(template.parent);
      if (!parentTemplate) {
        throw new Error(`Parent template '${template.parent}' not found for '${templateId}'`);
      }
      
      return this.mergeTemplates(parentTemplate, template);
    }

    return template;
  }

  /**
   * Merge parent and child templates
   * @param {object} parent - Parent template
   * @param {object} child - Child template
   * @returns {object} Merged template
   */
  mergeTemplates(parent, child) {
    return {
      ...parent,
      ...child,
      tools: [...new Set([...(parent.tools || []), ...(child.tools || [])])],
      capabilities: [...new Set([...(parent.capabilities || []), ...(child.capabilities || [])])],
      requiredParameters: [...new Set([
        ...(parent.requiredParameters || []),
        ...(child.requiredParameters || [])
      ])],
      optionalParameters: [...new Set([
        ...(parent.optionalParameters || []),
        ...(child.optionalParameters || [])
      ])],
      specialization: {
        ...(parent.specialization || {}),
        ...(child.specialization || {})
      }
    };
  }

  /**
   * Validate parameters against template schema
   * @param {object} template - Template definition
   * @param {object} parameters - Parameters to validate
   */
  validateParameters(template, parameters) {
    // Check required parameters
    const required = template.requiredParameters || [];
    for (const param of required) {
      if (!(param in parameters)) {
        throw new Error(`Required parameter '${param}' missing for template '${template.id}'`);
      }
    }

    // Basic type checking
    if (parameters.responsibilities && !Array.isArray(parameters.responsibilities)) {
      throw new Error('responsibilities must be an array');
    }

    if (parameters.tools && !Array.isArray(parameters.tools)) {
      throw new Error('tools must be an array');
    }

    if (parameters.metrics && !Array.isArray(parameters.metrics)) {
      throw new Error('metrics must be an array');
    }
  }

  /**
   * Merge template data with parameters
   * @param {object} template - Template definition
   * @param {object} parameters - User parameters
   * @param {string} agentId - Generated agent ID
   * @returns {object} Merged template data
   */
  mergeTemplateData(template, parameters, agentId) {
    return {
      agentId,
      agentName: parameters.agentName || agentId,
      agentType: parameters.agentType || 'dynamic',
      templateId: template.id,
      templateParameters: parameters,
      specialization: parameters.specialization || template.specialization?.domains?.[0] || 'general',
      purpose: parameters.purpose,
      
      // Arrays with defaults
      responsibilities: parameters.responsibilities || [
        'Process assigned tasks efficiently',
        'Validate inputs and outputs',
        'Report completion status to hub'
      ],
      tools: parameters.tools || template.tools || ['Read', 'Write', 'Edit'],
      capabilities: parameters.capabilities || template.capabilities || ['basic-processing'],
      metrics: parameters.metrics || [
        { name: 'Task Completion Rate', target: '95%' },
        { name: 'Response Time', target: '<5 seconds' },
        { name: 'Error Rate', target: '<5%' }
      ],
      
      // Handoff configuration
      incomingHandoffs: parameters.incomingHandoffs || [
        { from: '@routing-agent', condition: 'Task assignment and context' }
      ],
      outgoingHandoffs: parameters.outgoingHandoffs || [
        { to: '@routing-agent', condition: 'Task completion or escalation needed' }
      ],
      
      // Test contracts
      testContracts: parameters.testContracts || this.generateDefaultTestContracts(parameters),
      
      // Directives
      primeDirective: parameters.primeDirective || 
        'Execute assigned tasks with excellence while maintaining hub coordination protocols',
      principles: parameters.principles || [
        'Follow hub-and-spoke coordination patterns',
        'Validate all inputs and outputs thoroughly',
        'Maintain clear communication with routing hub',
        'Report status and completion accurately',
        'Handle errors gracefully with proper escalation'
      ],
      
      // Specialization config
      specializationConfig: parameters.specializationConfig || template.specialization || {},
      
      // Implementation notes
      implementationNotes: parameters.implementationNotes || 
        'Generated dynamically from template system. Customize behavior through parameters.'
    };
  }

  /**
   * Generate default test contracts
   * @param {object} parameters - Agent parameters
   * @returns {array} Test contracts
   */
  generateDefaultTestContracts(parameters) {
    return [
      {
        name: 'Input Validation',
        code: `test('validates required inputs', () => {
  const input = { task: '${parameters.purpose || 'process request'}' };
  expect(input.task).toBeDefined();
  expect(typeof input.task).toBe('string');
  expect(input.task.length).toBeGreaterThan(0);
});`
      },
      {
        name: 'Output Contract',
        code: `test('produces expected output structure', () => {
  const output = agent.process(validInput);
  expect(output).toHaveProperty('success');
  expect(output).toHaveProperty('result');
  expect(output).toHaveProperty('metadata');
  expect(typeof output.success).toBe('boolean');
});`
      },
      {
        name: 'Error Handling',
        code: `test('handles errors gracefully', () => {
  expect(() => agent.process(invalidInput)).not.toThrow();
  const result = agent.process(invalidInput);
  expect(result.success).toBe(false);
  expect(result).toHaveProperty('error');
});`
      }
    ];
  }

  /**
   * Generate unique agent ID
   * @param {string} name - Agent name
   * @param {string} templateId - Template ID
   * @returns {string} Unique agent ID
   */
  generateAgentId(name, templateId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    const safeName = (name || 'agent')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .substring(0, 15);
    const safeTemplate = templateId.replace(/[^a-z0-9]/g, '-');
    
    return `${safeName}-${safeTemplate}-${timestamp}-${random}`;
  }

  /**
   * Register custom template
   * @param {string} templateId - Template identifier
   * @param {object} templateConfig - Template configuration
   * @returns {object} Registration result
   */
  async registerTemplate(templateId, templateConfig) {
    // Validate template
    this.validateTemplateConfig(templateConfig);
    
    // Store in memory
    this.templates.set(templateId, {
      id: templateId,
      ...templateConfig,
      version: templateConfig.version || '1.0.0',
      created: new Date().toISOString()
    });
    
    // Persist to disk
    await this.saveTemplateToDisk(templateId, templateConfig);
    
    return {
      success: true,
      templateId,
      message: `Template '${templateId}' registered successfully`
    };
  }

  /**
   * Validate template configuration
   * @param {object} config - Template configuration
   */
  validateTemplateConfig(config) {
    const required = ['name', 'description', 'template'];
    for (const field of required) {
      if (!config[field]) {
        throw new Error(`Template missing required field: ${field}`);
      }
    }

    if (config.parent && !this.templates.has(config.parent)) {
      throw new Error(`Parent template '${config.parent}' not found`);
    }

    if (config.tools && !Array.isArray(config.tools)) {
      throw new Error('Template tools must be an array');
    }

    if (config.capabilities && !Array.isArray(config.capabilities)) {
      throw new Error('Template capabilities must be an array');
    }
  }

  /**
   * Save template to disk
   * @param {string} templateId - Template identifier
   * @param {object} templateConfig - Template configuration
   */
  async saveTemplateToDisk(templateId, templateConfig) {
    const customTemplatesDir = path.join(this.templatesDir, 'custom');
    await fs.ensureDir(customTemplatesDir);
    
    const filePath = path.join(customTemplatesDir, `${templateId}.json`);
    await fs.writeJson(filePath, templateConfig, { spaces: 2 });
  }

  /**
   * Load custom templates from disk
   */
  async loadCustomTemplates() {
    const customTemplatesDir = path.join(this.templatesDir, 'custom');
    
    if (!await fs.pathExists(customTemplatesDir)) {
      return;
    }

    const files = await fs.readdir(customTemplatesDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(customTemplatesDir, file);
        const config = await fs.readJson(filePath);
        const templateId = path.basename(file, '.json');
        
        this.templates.set(templateId, {
          id: templateId,
          ...config
        });
      } catch (error) {
        console.warn(`Failed to load template ${file}:`, error.message);
      }
    }
  }

  /**
   * List all available templates
   * @returns {array} Template list
   */
  listTemplates() {
    return Array.from(this.templates.entries()).map(([id, template]) => ({
      id,
      name: template.name,
      description: template.description,
      parent: template.parent,
      version: template.version,
      tools: template.tools?.length || 0,
      capabilities: template.capabilities?.length || 0,
      requiredParameters: template.requiredParameters?.length || 0
    }));
  }

  /**
   * Get template details
   * @param {string} templateId - Template identifier
   * @returns {object} Template details
   */
  getTemplate(templateId) {
    return this.templates.get(templateId);
  }

  /**
   * Delete template
   * @param {string} templateId - Template identifier
   * @returns {object} Deletion result
   */
  async deleteTemplate(templateId) {
    if (!this.templates.has(templateId)) {
      throw new Error(`Template '${templateId}' not found`);
    }

    // Don't allow deletion of built-in templates
    const builtInTemplates = ['base', 'research-agent', 'implementation-agent', 'testing-agent'];
    if (builtInTemplates.includes(templateId)) {
      throw new Error(`Cannot delete built-in template '${templateId}'`);
    }

    // Remove from memory
    this.templates.delete(templateId);

    // Remove from disk
    const customTemplatesDir = path.join(this.templatesDir, 'custom');
    const filePath = path.join(customTemplatesDir, `${templateId}.json`);
    
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
    }

    return {
      success: true,
      templateId,
      message: `Template '${templateId}' deleted successfully`
    };
  }

  /**
   * Initialize template system
   */
  async initialize() {
    // Create templates directory
    await fs.ensureDir(this.templatesDir);
    await fs.ensureDir(path.join(this.templatesDir, 'custom'));

    // Load custom templates
    await this.loadCustomTemplates();

    return {
      success: true,
      templatesLoaded: this.templates.size,
      templatesDir: this.templatesDir
    };
  }
}

module.exports = AgentTemplateSystem;