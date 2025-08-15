const inquirer = require('inquirer');
const chalk = require('chalk');

class CollectiveConfigurator {
  constructor() {
    this.config = {};
  }

  async promptInstallationOptions() {
    console.log(chalk.bold('\n🔧 Claude Code Sub-Agent Collective Configuration\n'));
    
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'installationType',
        message: 'What type of installation would you like?',
        choices: [
          {
            name: 'Full Installation - Complete collective system with all agents and testing',
            value: 'full'
          },
          {
            name: 'Minimal Installation - Core agents only for basic coordination',
            value: 'minimal'
          },
          {
            name: 'Testing Focus - Behavioral system + comprehensive testing framework',
            value: 'testing-only'
          },
          {
            name: 'Hooks Only - Just the hook system for directive enforcement',
            value: 'hooks-only'
          }
        ],
        default: 'full'
      }
    ]);

    if (answers.installationType === 'full') {
      const fullOptions = await this.promptFullInstallationOptions();
      Object.assign(answers, fullOptions);
    }

    return this.processAnswers(answers);
  }

  async promptFullInstallationOptions() {
    return await inquirer.prompt([
      {
        type: 'confirm',
        name: 'includeAdvancedAgents',
        message: 'Include advanced agents (maintenance, research, infrastructure)?',
        default: true
      },
      {
        type: 'confirm',
        name: 'setupTesting',
        message: 'Set up comprehensive testing framework?',
        default: true
      },
      {
        type: 'list',
        name: 'hookStrictness',
        message: 'Directive enforcement level:',
        choices: [
          { name: 'Strict - Block violations (recommended)', value: 'strict' },
          { name: 'Warn - Show warnings but allow', value: 'warn' },
          { name: 'Monitor - Log only, no blocking', value: 'monitor' }
        ],
        default: 'strict'
      }
    ]);
  }

  async promptUpdateOptions() {
    console.log(chalk.bold('\n📦 Update Configuration\n'));
    
    return await inquirer.prompt([
      {
        type: 'confirm',
        name: 'backupBeforeUpdate',
        message: 'Create backup before updating?',
        default: true
      },
      {
        type: 'confirm',
        name: 'preserveCustomizations',
        message: 'Preserve custom agent configurations?',
        default: true
      },
      {
        type: 'confirm',
        name: 'updateDependencies',
        message: 'Update testing framework dependencies?',
        default: true
      }
    ]);
  }

  async promptProjectDetails() {
    return await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: require('path').basename(process.cwd())
      },
      {
        type: 'input',
        name: 'projectDescription',
        message: 'Project description (optional):',
        default: ''
      },
      {
        type: 'list',
        name: 'projectType',
        message: 'Project type:',
        choices: [
          'web-application',
          'api-service', 
          'library',
          'cli-tool',
          'research-project',
          'other'
        ],
        default: 'web-application'
      }
    ]);
  }

  processAnswers(answers) {
    const config = {
      // Installation options
      minimal: answers.installationType === 'minimal',
      testingOnly: answers.installationType === 'testing-only',
      hooksOnly: answers.installationType === 'hooks-only',
      
      // Feature flags
      advancedAgents: answers.includeAdvancedAgents || false,
      testing: answers.setupTesting !== false,
      
      // Hook configuration
      hookStrictness: answers.hookStrictness || 'strict',
      
      // Update options
      backup: answers.backupBeforeUpdate !== false,
      preserveCustom: answers.preserveCustomizations !== false,
      updateDeps: answers.updateDependencies !== false,
      
      // Project details
      projectName: answers.projectName || 'untitled-project',
      projectDescription: answers.projectDescription || '',
      projectType: answers.projectType || 'web-application'
    };

    this.config = config;
    return config;
  }

  getInstallationSummary() {
    const { config } = this;
    
    console.log(chalk.bold('\n📋 Installation Summary:\n'));
    
    // Installation type
    let type = 'Full Installation';
    if (config.minimal) type = 'Minimal Installation';
    else if (config.testingOnly) type = 'Testing-Focused Installation';
    else if (config.hooksOnly) type = 'Hooks-Only Installation';
    
    console.log(`${chalk.cyan('Type:')} ${type}`);
    console.log(`${chalk.cyan('Project:')} ${config.projectName}`);
    
    // Features
    const features = [];
    if (config.advancedAgents) features.push('Advanced Agents');
    if (config.testing) features.push('Testing Framework');
    
    if (features.length > 0) {
      console.log(`${chalk.cyan('Features:')} ${features.join(', ')}`);
    }
    
    console.log(`${chalk.cyan('Hook Enforcement:')} ${config.hookStrictness}`);
    
    return config;
  }

  async confirmInstallation() {
    this.getInstallationSummary();
    
    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Proceed with installation?',
        default: true
      }
    ]);
    
    return proceed;
  }

  generateInstallationOptions(config) {
    return {
      force: config.force || false,
      minimal: config.minimal || false,
      skipValidation: config.skipValidation || false,
      
      // Custom configurations
      hookStrictness: config.hookStrictness || 'strict',
      projectType: config.projectType || 'web-application',
      
      // Installation metadata
      installationType: this.getInstallationType(config),
      configuredAt: new Date().toISOString(),
      configuredBy: process.env.USER || process.env.USERNAME || 'anonymous'
    };
  }

  getInstallationType(config) {
    if (config.minimal) return 'minimal';
    if (config.testingOnly) return 'testing-only';
    if (config.hooksOnly) return 'hooks-only';
    return 'full';
  }

  async promptForMissingConfig(existingConfig = {}) {
    const questions = [];
    
    if (!existingConfig.projectName) {
      questions.push({
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: require('path').basename(process.cwd())
      });
    }
    
    if (!existingConfig.hookStrictness) {
      questions.push({
        type: 'list',
        name: 'hookStrictness',
        message: 'Hook enforcement level:',
        choices: ['strict', 'warn', 'monitor'],
        default: 'strict'
      });
    }
    
    if (questions.length > 0) {
      const answers = await inquirer.prompt(questions);
      return { ...existingConfig, ...answers };
    }
    
    return existingConfig;
  }
}

module.exports = { CollectiveConfigurator };