const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const ora = require('ora');
const chalk = require('chalk');
const { FileMapping } = require('./file-mapping');

class CollectiveInstaller {
  constructor(options = {}) {
    this.options = options;
    this.projectDir = process.cwd();
    this.collectiveDir = path.join(this.projectDir, '.claude');
    this.templateDir = path.join(__dirname, '..', 'templates');
    this.config = {
      projectRoot: this.projectDir,
      installDate: new Date().toISOString(),
      version: require('../package.json').version,
      userName: process.env.USER || process.env.USERNAME || 'developer',
      projectName: path.basename(this.projectDir)
    };
  }

  async install() {
    console.log(chalk.cyan('🚀 Installing claude-code-sub-agent-collective...\n'));

    try {
      // Check for existing installation
      await this.checkExistingInstallation();
      
      // Create directory structure
      await this.createDirectories();
      
      // Install templates
      await this.installTemplates();
      
      // Configure settings
      await this.configureSettings();
      
      // Setup hooks
      await this.setupHooks();
      
      // Install agents
      await this.installAgents();
      
      // Validate installation
      await this.validateInstallation();
      
      console.log(chalk.green('\n✅ Installation complete!'));
      console.log(chalk.yellow('\nNext steps:'));
      console.log('1. Review CLAUDE.md for behavioral directives');
      console.log('2. Test agent routing with a simple request');
      console.log('3. Check installation: npx claude-code-collective validate');
      
      return { success: true, path: this.collectiveDir };
      
    } catch (error) {
      console.error(chalk.red('❌ Installation failed:'), error.message);
      throw error;
    }
  }

  async checkExistingInstallation() {
    if (await fs.pathExists(this.collectiveDir) && !this.options.force) {
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: 'Claude collective directory already exists. Overwrite?',
        default: false
      }]);
      
      if (!overwrite) {
        console.log(chalk.yellow('Installation cancelled'));
        process.exit(0);
      }
    }
  }

  async createDirectories() {
    const spinner = ora('Creating directory structure...').start();
    
    const dirs = [
      '.claude',
      '.claude/agents',
      '.claude/hooks',
      '.claude/commands',
      '.claude-collective',
      '.claude-collective/tests',
      '.claude-collective/tests/handoffs',
      '.claude-collective/tests/directives',
      '.claude-collective/tests/contracts',
      '.claude-collective/metrics'
    ];
    
    for (const dir of dirs) {
      await fs.ensureDir(path.join(this.projectDir, dir));
    }
    
    spinner.succeed('Directory structure created');
  }

  async installTemplates() {
    const spinner = ora('Installing template files...').start();
    
    try {
      // Create file mapping system
      const fileMapping = new FileMapping(this.projectDir, this.options);
      const installationType = this.options.minimal ? 'minimal' : 'full';
      const mappings = fileMapping.getFilteredMapping(installationType);
      
      spinner.text = `Installing ${mappings.length} template files...`;
      
      // Install each mapped file
      for (const mapping of mappings) {
        await this.installMappedFile(mapping);
        spinner.text = `Installing: ${mapping.description}`;
      }
      
      spinner.succeed(`Template files installed (${mappings.length} files)`);
    } catch (error) {
      spinner.fail('Template installation failed');
      throw error;
    }
  }

  async installMappedFile(mapping) {
    const sourcePath = path.join(this.templateDir, mapping.source);
    
    // Check if source template exists
    if (!await fs.pathExists(sourcePath)) {
      console.warn(chalk.yellow(`Warning: Template not found: ${mapping.source}`));
      return;
    }
    
    // Check if target should be overwritten
    if (await fs.pathExists(mapping.target) && !mapping.overwrite) {
      console.log(chalk.blue(`Skipping existing file: ${path.basename(mapping.target)}`));
      return;
    }
    
    // Read and process template
    let content = await fs.readFile(sourcePath, 'utf8');
    content = this.processTemplate(content, this.config);
    
    // Ensure target directory exists
    await fs.ensureDir(path.dirname(mapping.target));
    
    // Write processed template
    await fs.writeFile(mapping.target, content);
    
    // Set executable permissions for hooks
    if (mapping.executable) {
      await fs.chmod(mapping.target, '755');
    }
  }

  async installTemplate(templateName, targetPath, variables = {}) {
    const templatePath = path.join(this.templateDir, templateName);
    const fullTargetPath = path.join(this.projectDir, targetPath);
    
    if (await fs.pathExists(templatePath)) {
      let content = await fs.readFile(templatePath, 'utf8');
      
      // Process template variables
      const allVariables = { ...this.config, ...variables };
      content = this.processTemplate(content, allVariables);
      
      await fs.ensureDir(path.dirname(fullTargetPath));
      await fs.writeFile(fullTargetPath, content);
    }
  }

  processTemplate(content, variables) {
    let processed = content;
    
    // Replace template variables
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, variables[key]);
    });
    
    // Replace common patterns
    processed = processed.replace(/{{PROJECT_ROOT}}/g, this.projectDir);
    processed = processed.replace(/{{INSTALL_DATE}}/g, this.config.installDate);
    processed = processed.replace(/{{VERSION}}/g, this.config.version);
    processed = processed.replace(/{{USER_NAME}}/g, this.config.userName);
    processed = processed.replace(/{{PROJECT_NAME}}/g, this.config.projectName);
    
    return processed;
  }

  async installTestTemplates() {
    const testTemplates = [
      { template: 'tests/handoff-test.template.js', target: '.claude-collective/tests/handoffs/handoff.test.js' },
      { template: 'tests/directive-test.template.js', target: '.claude-collective/tests/directives/directive.test.js' },
      { template: 'tests/contract-test.template.js', target: '.claude-collective/tests/contracts/contract.test.js' }
    ];
    
    for (const { template, target } of testTemplates) {
      await this.installTemplate(template, target);
    }
  }

  async configureSettings() {
    const spinner = ora('Configuring settings...').start();
    
    const settings = {
      deniedTools: [
        'mcp__task-master__initialize_project'
      ],
      hooks: {
        SessionStart: [
          {
            matcher: 'startup',
            hooks: [
              {
                type: 'command',
                command: '$CLAUDE_PROJECT_DIR/.claude/hooks/load-behavioral-system.sh'
              }
            ]
          },
          {
            matcher: 'resume',
            hooks: [
              {
                type: 'command',
                command: '$CLAUDE_PROJECT_DIR/.claude/hooks/load-behavioral-system.sh'
              }
            ]
          },
          {
            matcher: 'clear',
            hooks: [
              {
                type: 'command',
                command: '$CLAUDE_PROJECT_DIR/.claude/hooks/load-behavioral-system.sh'
              }
            ]
          }
        ],
        PreToolUse: [
          {
            matcher: 'Write|Edit|MultiEdit',
            hooks: [
              {
                type: 'command',
                command: '$CLAUDE_PROJECT_DIR/.claude/hooks/directive-enforcer.sh'
              },
              {
                type: 'command',
                command: '$CLAUDE_PROJECT_DIR/.claude/hooks/collective-metrics.sh'
              }
            ]
          },
          {
            matcher: '.*',
            hooks: [
              {
                type: 'command',
                command: '$CLAUDE_PROJECT_DIR/.claude/hooks/collective-metrics.sh'
              }
            ]
          }
        ],
        PostToolUse: [
          {
            matcher: 'Task',
            hooks: [
              {
                type: 'command',
                command: '$CLAUDE_PROJECT_DIR/.claude/hooks/test-driven-handoff.sh'
              },
              {
                type: 'command',
                command: '$CLAUDE_PROJECT_DIR/.claude/hooks/collective-metrics.sh'
              }
            ]
          },
          {
            matcher: 'Write|Edit|MultiEdit',
            hooks: [
              {
                type: 'command',
                command: '$CLAUDE_PROJECT_DIR/.claude/hooks/collective-metrics.sh'
              }
            ]
          }
        ],
        SubagentStop: [
          {
            matcher: 'mock-.*',
            hooks: [
              {
                type: 'command',
                command: '$CLAUDE_PROJECT_DIR/.claude/hooks/mock-deliverable-generator.sh'
              },
              {
                type: 'command',
                command: '$CLAUDE_PROJECT_DIR/.claude/hooks/test-driven-handoff.sh'
              },
              {
                type: 'command',
                command: '$CLAUDE_PROJECT_DIR/.claude/hooks/collective-metrics.sh'
              }
            ]
          },
          {
            matcher: '.*',
            hooks: [
              {
                type: 'command',
                command: '$CLAUDE_PROJECT_DIR/.claude/hooks/test-driven-handoff.sh'
              },
              {
                type: 'command',
                command: '$CLAUDE_PROJECT_DIR/.claude/hooks/collective-metrics.sh'
              }
            ]
          }
        ]
      }
    };
    
    await fs.writeJson(
      path.join(this.collectiveDir, 'settings.json'),
      settings,
      { spaces: 2 }
    );
    
    spinner.succeed('Settings configured');
  }

  async setupHooks() {
    const spinner = ora('Installing hook scripts...').start();
    
    const hooks = [
      'directive-enforcer.sh',
      'collective-metrics.sh',
      'test-driven-handoff.sh',
      'routing-executor.sh',
      'load-behavioral-system.sh'
    ];
    
    for (const hook of hooks) {
      const sourcePath = path.join(this.templateDir, 'hooks', hook);
      const targetPath = path.join(this.collectiveDir, 'hooks', hook);
      
      if (await fs.pathExists(sourcePath)) {
        let content = await fs.readFile(sourcePath, 'utf8');
        content = this.processTemplate(content, this.config);
        
        await fs.writeFile(targetPath, content);
        await fs.chmod(targetPath, '755'); // Make executable
      }
    }
    
    spinner.succeed('Hook scripts installed');
  }

  async installAgents() {
    const spinner = ora('Installing agent definitions...').start();
    
    const agents = [
      'routing-agent.md',
      'enhanced-project-manager-agent.md',
      'research-agent.md',
      'quality-agent.md',
      'devops-agent.md'
    ];
    
    if (this.options.minimal) {
      // Only install core agents for minimal installation
      agents.splice(1); // Keep only routing-agent
    }
    
    for (const agent of agents) {
      await this.installTemplate(`agents/${agent}`, `.claude/agents/${agent}`);
    }
    
    spinner.succeed('Agent definitions installed');
  }

  async validateInstallation() {
    const spinner = ora('Validating installation...').start();
    
    const checks = [
      { name: 'CLAUDE.md exists', path: 'CLAUDE.md' },
      { name: 'Settings configured', path: '.claude/settings.json' },
      { name: 'Hooks directory', path: '.claude/hooks' },
      { name: 'Agents directory', path: '.claude/agents' },
      { name: 'Tests directory', path: '.claude-collective/tests' }
    ];
    
    let allPassed = true;
    const results = [];
    
    for (const check of checks) {
      const exists = await fs.pathExists(path.join(this.projectDir, check.path));
      results.push({ name: check.name, passed: exists });
      
      if (!exists) {
        allPassed = false;
      }
    }
    
    if (allPassed) {
      spinner.succeed('Installation validation passed');
    } else {
      spinner.fail('Installation validation failed');
      console.log('\nValidation results:');
      results.forEach(result => {
        const icon = result.passed ? '✅' : '❌';
        console.log(`${icon} ${result.name}`);
      });
      throw new Error('Installation validation failed');
    }
    
    return results;
  }

  async getInstallationStatus() {
    const status = {
      version: this.config.version,
      installed: false,
      behavioral: false,
      testing: false,
      hooks: false,
      agents: [],
      issues: []
    };
    
    // Check if installed
    status.installed = await fs.pathExists(this.collectiveDir);
    
    if (status.installed) {
      // Check components
      status.behavioral = await fs.pathExists(path.join(this.projectDir, 'CLAUDE.md'));
      status.testing = await fs.pathExists(path.join(this.projectDir, '.claude-collective/tests'));
      status.hooks = await fs.pathExists(path.join(this.collectiveDir, 'hooks'));
      
      // Check agents
      const agentsDir = path.join(this.collectiveDir, 'agents');
      if (await fs.pathExists(agentsDir)) {
        const agentFiles = await fs.readdir(agentsDir);
        status.agents = agentFiles.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
      }
      
      // Check for issues
      if (!status.behavioral) status.issues.push('CLAUDE.md missing');
      if (!status.testing) status.issues.push('Testing framework not installed');
      if (!status.hooks) status.issues.push('Hooks not installed');
      if (status.agents.length === 0) status.issues.push('No agents installed');
    }
    
    return status;
  }
}

module.exports = { CollectiveInstaller };