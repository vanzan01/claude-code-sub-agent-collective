const path = require('path');

/**
 * File mapping configuration for collective component installation
 * Defines where each template component should be installed in target projects
 */
class FileMapping {
  constructor(projectRoot, options = {}) {
    this.projectRoot = projectRoot;
    this.options = options;
    
    // Base installation paths
    this.paths = {
      claude: path.join(projectRoot, '.claude'),
      collective: path.join(projectRoot, '.claude-collective'),
      root: projectRoot
    };
  }

  /**
   * Get comprehensive file mapping for installation
   * @returns {Array} Array of mapping objects with source and target paths
   */
  getFileMapping() {
    return [
      // Core behavioral system
      ...this.getBehavioralMapping(),
      
      // Collective behavioral system
      ...this.getCollectiveMapping(),
      
      // Agent definitions  
      ...this.getAgentMapping(),
      
      // Agent library files
      ...this.getAgentLibMapping(),
      
      // Hook scripts
      ...this.getHookMapping(),
      
      // Command templates
      ...this.getCommandMapping(),
      
      // Testing framework
      ...this.getTestMapping(),
      
      // Configuration files
      ...this.getConfigMapping(),
      
      // Documentation
      ...this.getDocumentationMapping()
    ];
  }

  getBehavioralMapping() {
    return [
      {
        source: 'CLAUDE.md',
        target: path.join(this.paths.root, 'CLAUDE.md'),
        type: 'behavioral',
        required: true,
        overwrite: this.options.force || false,
        description: 'Main behavioral directive file'
      }
    ];
  }

  getCollectiveMapping() {
    const collectiveFiles = [
      {
        file: 'CLAUDE.md',
        required: true,
        description: 'Collective behavioral rules and prime directives'
      },
      {
        file: 'DECISION.md',
        required: true, 
        description: 'Global decision engine for auto-delegation'
      },
      {
        file: 'agents.md',
        required: true,
        description: 'Available specialized agent catalog'
      },
      {
        file: 'hooks.md',
        required: true,
        description: 'Hook system integration requirements'
      },
      {
        file: 'quality.md',
        required: true,
        description: 'Quality gates and TDD reporting standards'
      },
      {
        file: 'research.md',
        required: true,
        description: 'Research hypotheses and validation metrics'
      }
    ];

    return collectiveFiles.map(file => ({
      source: path.join('.claude-collective', file.file),
      target: path.join(this.paths.collective, file.file),
      type: 'collective',
      required: file.required,
      overwrite: true,
      description: file.description
    }));
  }

  getAgentMapping() {
    const allAgents = [
      'behavioral-transformation-agent.md',
      'command-system-agent.md',
      'completion-gate.md',
      'component-implementation-agent.md',
      'devops-agent.md',
      'dynamic-agent-creator.md',
      'enhanced-project-manager-agent.md',
      'enhanced-quality-gate.md',
      'feature-implementation-agent.md',
      'functional-testing-agent.md',
      'hook-integration-agent.md',
      'infrastructure-implementation-agent.md',
      'metrics-collection-agent.md',
      'npx-package-agent.md',
      'polish-implementation-agent.md',
      'prd-agent.md',
      'prd-mvp.md',
      'prd-research-agent.md',
      'quality-agent.md',
      'readiness-gate.md',
      'research-agent.md',
      'routing-agent.md',
      'task-checker.md',
      'task-executor.md',
      'task-orchestrator.md',
      'tdd-validation-agent.md',
      'testing-implementation-agent.md',
      'van-maintenance-agent.md',
      'workflow-agent.md'
    ];

    const agents = this.options.minimal ? 
      ['routing-agent.md'] : 
      allAgents;

    return agents.map(agent => ({
      source: path.join('agents', agent),
      target: path.join(this.paths.claude, 'agents', agent),
      type: 'agent',
      required: agent === 'routing-agent.md',
      overwrite: true,
      description: `Agent definition: ${agent.replace('.md', '')}`
    }));
  }

  getAgentLibMapping() {
    const libFiles = [
      'research-analyzer.js'
    ];

    return libFiles.map(libFile => ({
      source: path.join('agents', 'lib', libFile),
      target: path.join(this.paths.claude, 'agents', 'lib', libFile),
      type: 'agent-lib',
      required: false,
      overwrite: true,
      description: `Agent library file: ${libFile}`
    }));
  }

  getHookMapping() {
    const hooks = [
      {
        file: 'directive-enforcer.sh',
        required: true,
        description: 'Enforces behavioral directives before tool execution'
      },
      {
        file: 'collective-metrics.sh', 
        required: true,
        description: 'Collects performance and research metrics'
      },
      {
        file: 'routing-executor.sh',
        required: true,
        description: 'Executes routing decisions and agent handoffs'
      },
      {
        file: 'load-behavioral-system.sh',
        required: true,
        description: 'Loads collective behavioral system during SessionStart events'
      }
    ];

    return hooks.map(hook => ({
      source: path.join('hooks', hook.file),
      target: path.join(this.paths.claude, 'hooks', hook.file),
      type: 'hook',
      required: hook.required,
      executable: true,
      overwrite: true,
      description: hook.description
    }));
  }

  getCommandMapping() {
    const commands = [
      // Core collective commands
      'autocompact.md',
      'continue-handoff.md',
      'mock.md',
      'reset-handoff.md',
      'van.md'
    ];

    const mappings = [];

    // Map core commands
    for (const command of commands) {
      mappings.push({
        source: path.join('commands', command),
        target: path.join(this.paths.claude, 'commands', command),
        type: 'command',
        required: false,
        overwrite: true,
        description: `Command template: ${command.replace('.md', '')}`
      });
    }

    // Map TaskMaster command structure
    const tmCommands = [
      'help.md',
      'learn.md', 
      'tm-main.md',
      'add-dependency/add-dependency.md',
      'add-subtask/add-subtask.md',
      'add-subtask/convert-task-to-subtask.md',
      'add-task/add-task.md',
      'analyze-complexity/analyze-complexity.md',
      'clear-subtasks/clear-all-subtasks.md',
      'clear-subtasks/clear-subtasks.md',
      'complexity-report/complexity-report.md',
      'expand/expand-all-tasks.md',
      'expand/expand-task.md',
      'fix-dependencies/fix-dependencies.md',
      'generate/generate-tasks.md',
      'init/init-project-quick.md',
      'init/init-project.md',
      'list/list-tasks-by-status.md',
      'list/list-tasks-with-subtasks.md',
      'list/list-tasks.md',
      'models/setup-models.md',
      'models/view-models.md',
      'next/next-task.md',
      'parse-prd/parse-prd-with-research.md',
      'parse-prd/parse-prd.md',
      'remove-dependency/remove-dependency.md',
      'remove-subtask/remove-subtask.md',
      'remove-task/remove-task.md',
      'set-status/to-cancelled.md',
      'set-status/to-deferred.md',
      'set-status/to-done.md',
      'set-status/to-in-progress.md',
      'set-status/to-pending.md',
      'set-status/to-review.md',
      'setup/install-taskmaster.md',
      'setup/quick-install-taskmaster.md',
      'show/show-task.md',
      'status/project-status.md',
      'sync-readme/sync-readme.md',
      'update/update-single-task.md',
      'update/update-task.md',
      'update/update-tasks-from-id.md',
      'utils/analyze-project.md',
      'validate-dependencies/validate-dependencies.md',
      'workflows/auto-implement-tasks.md',
      'workflows/command-pipeline.md',
      'workflows/smart-workflow.md'
    ];

    // Map TaskMaster commands
    for (const tmCommand of tmCommands) {
      mappings.push({
        source: path.join('commands', 'tm', tmCommand),
        target: path.join(this.paths.claude, 'commands', 'tm', tmCommand),
        type: 'command',
        required: false,
        overwrite: true,
        description: `TaskMaster command: ${tmCommand.replace('.md', '')}`
      });
    }

    return mappings;
  }

  getTestMapping() {
    return [
      // Test package configuration
      {
        source: path.join('.claude-collective', 'package.json'),
        target: path.join(this.paths.collective, 'package.json'),
        type: 'config',
        required: true,
        overwrite: true,
        description: 'Test framework package configuration'
      },
      
      // Jest configuration
      {
        source: path.join('.claude-collective', 'jest.config.js'),
        target: path.join(this.paths.collective, 'jest.config.js'),
        type: 'config',
        required: true,
        overwrite: true,
        description: 'Jest testing framework configuration'
      },
      
      // Metrics reporting script
      {
        source: path.join('.claude-collective', 'metrics-report.js'),
        target: path.join(this.paths.collective, 'metrics-report.js'),
        type: 'config',
        required: true,
        overwrite: true,
        description: 'Metrics collection and reporting system'
      },
      
      // Test suite files
      {
        source: path.join('.claude-collective', 'tests', 'agents', 'tdd-validation.test.js'),
        target: path.join(this.paths.collective, 'tests', 'agents', 'tdd-validation.test.js'),
        type: 'test',
        required: true,
        overwrite: true,
        description: 'TDD validation agent tests'
      },
      
      {
        source: path.join('.claude-collective', 'tests', 'contracts', 'contract-validation.test.js'),
        target: path.join(this.paths.collective, 'tests', 'contracts', 'contract-validation.test.js'),
        type: 'test',
        required: true,
        overwrite: true,
        description: 'Contract validation tests'
      },
      
      {
        source: path.join('.claude-collective', 'tests', 'contracts', 'advanced-contract.test.js'),
        target: path.join(this.paths.collective, 'tests', 'contracts', 'advanced-contract.test.js'),
        type: 'test',
        required: true,
        overwrite: true,
        description: 'Advanced contract validation tests'
      },
      
      {
        source: path.join('.claude-collective', 'tests', 'handoffs', 'agent-handoff.test.js'),
        target: path.join(this.paths.collective, 'tests', 'handoffs', 'agent-handoff.test.js'),
        type: 'test',
        required: true,
        overwrite: true,
        description: 'Agent handoff validation tests'
      },
      
      {
        source: path.join('.claude-collective', 'tests', 'setup.js'),
        target: path.join(this.paths.collective, 'tests', 'setup.js'),
        type: 'test',
        required: true,
        overwrite: true,
        description: 'Test suite setup and utilities'
      },
      
      // Create initial metrics directory
      {
        source: path.join('.claude-collective', 'metrics', 'metrics-20250812.json'),
        target: path.join(this.paths.collective, 'metrics', 'baseline.json'),
        type: 'config',
        required: true,
        overwrite: true,
        description: 'Baseline metrics configuration'
      }
    ];
  }

  getConfigMapping() {
    return [
      // Claude settings
      {
        source: 'settings.json.template',
        target: path.join(this.paths.claude, 'settings.json'),
        type: 'config',
        required: true,
        overwrite: this.options.force || false,
        description: 'Claude Code hook configuration'
      },
      
      // Vitest configuration for TDD validation (root level)
      {
        source: 'vitest.config.js',
        target: path.join(this.paths.root, 'vitest.config.js'),
        type: 'config',
        required: true,
        overwrite: true,
        description: 'Vitest configuration for TDD hooks validation'
      },
      
      // Vitest configuration in .claude-collective (where dependencies are)
      {
        source: path.join('.claude-collective', 'vitest.config.js'),
        target: path.join(this.paths.collective, 'vitest.config.js'),
        type: 'config',
        required: true,
        overwrite: true,
        description: 'Vitest configuration in collective directory with dependencies'
      }
    ];
  }

  getDocumentationMapping() {
    return [
      {
        source: path.join('docs', 'README.md'),
        target: path.join(this.paths.claude, 'docs', 'README.md'),
        type: 'docs',
        required: false,
        overwrite: true,
        description: 'Collective system documentation'
      },
      
      {
        source: path.join('docs', 'TROUBLESHOOTING.md'),
        target: path.join(this.paths.claude, 'docs', 'TROUBLESHOOTING.md'),
        type: 'docs',
        required: false,
        overwrite: true,
        description: 'Troubleshooting guide'
      }
    ];
  }

  /**
   * Get filtered mapping based on installation type
   * @param {string} installationType - 'full', 'minimal', 'testing-only'
   * @returns {Array} Filtered mapping array
   */
  getFilteredMapping(installationType = 'full') {
    const allMappings = this.getFileMapping();
    
    switch (installationType) {
      case 'minimal':
        return allMappings.filter(mapping => 
          mapping.required || 
          (mapping.type === 'agent' && mapping.source.includes('routing-agent'))
        );
        
      case 'testing-only':
        return allMappings.filter(mapping => 
          mapping.type === 'test' || 
          mapping.type === 'config' ||
          mapping.type === 'collective' ||
          (mapping.type === 'behavioral' && mapping.required)
        );
        
      case 'hooks-only':
        return allMappings.filter(mapping =>
          mapping.type === 'hook' ||
          mapping.type === 'config' ||
          mapping.type === 'collective' ||
          (mapping.type === 'behavioral' && mapping.required)
        );
        
      case 'full':
      default:
        return allMappings;
    }
  }

  /**
   * Get directory structure that needs to be created
   * @returns {Array} Array of directory paths
   */
  getDirectoryStructure() {
    const mapping = this.getFileMapping();
    const dirs = new Set();
    
    // Extract unique directories from target paths
    mapping.forEach(item => {
      const dir = path.dirname(item.target);
      dirs.add(dir);
      
      // Add parent directories recursively
      let parentDir = path.dirname(dir);
      while (parentDir !== this.projectRoot && parentDir !== '/') {
        dirs.add(parentDir);
        parentDir = path.dirname(parentDir);
      }
    });
    
    return Array.from(dirs).sort();
  }

  /**
   * Validate file mapping for conflicts and requirements
   * @returns {Object} Validation results
   */
  validateMapping() {
    const mapping = this.getFileMapping();
    const issues = [];
    const warnings = [];
    
    // Check for target path conflicts
    const targetPaths = new Set();
    mapping.forEach(item => {
      if (targetPaths.has(item.target)) {
        issues.push(`Duplicate target path: ${item.target}`);
      }
      targetPaths.add(item.target);
    });
    
    // Check required files
    const requiredFiles = mapping.filter(item => item.required);
    if (requiredFiles.length === 0) {
      issues.push('No required files defined');
    }
    
    // Check for potential overwrites without force flag
    if (!this.options.force) {
      const overwriteFiles = mapping.filter(item => item.overwrite);
      overwriteFiles.forEach(item => {
        warnings.push(`Will overwrite: ${item.target}`);
      });
    }
    
    return {
      valid: issues.length === 0,
      issues,
      warnings,
      totalFiles: mapping.length,
      requiredFiles: requiredFiles.length
    };
  }

  /**
   * Get mapping summary for display
   * @returns {Object} Summary object
   */
  getSummary() {
    const mapping = this.getFileMapping();
    const byType = {};
    
    mapping.forEach(item => {
      if (!byType[item.type]) {
        byType[item.type] = [];
      }
      byType[item.type].push(item);
    });
    
    return {
      totalFiles: mapping.length,
      byType,
      directories: this.getDirectoryStructure().length,
      requiredFiles: mapping.filter(item => item.required).length,
      optionalFiles: mapping.filter(item => !item.required).length
    };
  }
}

module.exports = { FileMapping };