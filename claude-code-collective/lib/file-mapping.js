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
    const agents = this.options.minimal ? 
      ['routing-agent.md'] : 
      [
        'routing-agent.md',
        'behavioral-transformation-agent.md',
        'testing-implementation-agent.md', 
        'hook-integration-agent.md',
        'enhanced-project-manager-agent.md',
        'component-implementation-agent.md',
        'feature-implementation-agent.md',
        'infrastructure-implementation-agent.md',
        'research-agent.md',
        'van-maintenance-agent.md'
      ];

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
        file: 'test-driven-handoff.sh',
        required: true, 
        description: 'Validates handoff contracts during agent transitions'
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