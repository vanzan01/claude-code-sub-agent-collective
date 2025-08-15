#!/usr/bin/env node

/**
 * Claude Code Sub-Agent Collective
 * Main entry point for the collective framework
 */

const fs = require('fs-extra');
const path = require('path');
const { CollectiveInstaller } = require('./installer');
const { CollectiveValidator } = require('./validator');

class ClaudeCodeCollective {
  constructor() {
    this.version = require('../package.json').version;
    this.templatesPath = path.join(__dirname, '../templates');
  }

  async install(targetPath = '.') {
    console.log(`Claude Code Sub-Agent Collective v${this.version}`);
    console.log('Installing collective framework...');
    
    try {
      const installer = new CollectiveInstaller({ targetPath });
      await installer.install();
      console.log('✅ Installation complete!');
    } catch (error) {
      console.error('❌ Installation failed:', error.message);
      process.exit(1);
    }
  }

  async validate(projectPath = '.') {
    console.log('Validating collective installation...');
    
    try {
      const validator = new CollectiveValidator(projectPath);
      const result = await validator.validateInstallation();
      
      // Process validation results
      const failures = result.tests.filter(test => !test.passed);
      const successes = result.tests.filter(test => test.passed);
      
      if (failures.length === 0) {
        console.log('✅ Collective validation passed!');
        console.log(`All ${successes.length} checks passed successfully.`);
        return { valid: true, tests: result.tests };
      } else {
        console.log('❌ Validation failed:');
        failures.forEach(failure => {
          console.log(`  - ${failure.name}: ${failure.error || 'Failed'}`);
        });
        console.log(`\n${failures.length} of ${result.tests.length} checks failed.`);
        return { valid: false, tests: result.tests, failures };
      }
    } catch (error) {
      console.error('❌ Validation error:', error.message);
      process.exit(1);
    }
  }

  getInfo() {
    return {
      name: 'claude-code-collective',
      version: this.version,
      description: 'Sub-agent collective framework for Claude Code with TDD validation, hub-spoke coordination, and automated handoffs',
      features: [
        'TDD Validation Framework',
        'Hub-Spoke Agent Coordination', 
        'Automated Agent Handoffs',
        'Contract-Based Quality Gates',
        'Research Metrics Collection',
        'Dynamic Agent Spawning'
      ]
    };
  }
}

module.exports = { ClaudeCodeCollective };

// CLI usage
if (require.main === module) {
  const collective = new ClaudeCodeCollective();
  const command = process.argv[2];
  const target = process.argv[3] || '.';

  switch (command) {
    case 'install':
      collective.install(target);
      break;
    case 'validate':
      collective.validate(target);
      break;
    case 'info':
      console.log(JSON.stringify(collective.getInfo(), null, 2));
      break;
    default:
      console.log('Usage: claude-code-collective <install|validate|info> [target-path]');
      console.log('  install   - Install collective framework');
      console.log('  validate  - Validate installation');
      console.log('  info      - Show framework information');
  }
}