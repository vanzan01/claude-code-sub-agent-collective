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
    
    // Try multiple template directory paths to handle different installation contexts
    const possibleTemplatePaths = [
      path.join(__dirname, '..', 'templates'),  // Normal development
      path.join(__dirname, '..', '..', 'templates'),  // When installed as npm package
      path.join(require.resolve('../package.json'), '..', 'templates')  // Reliable package-relative path
    ];
    
    this.templateDir = possibleTemplatePaths.find(templatePath => {
      try {
        return fs.existsSync(templatePath);
      } catch {
        return false;
      }
    }) || possibleTemplatePaths[0];
    
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
      
      // Express mode with smart merging for conflicts
      if (this.options.express) {
        return await this.performExpressInstallation();
      }
      
      // Standard installation flow
      return await this.performStandardInstallation();
      
    } catch (error) {
      console.error(chalk.red('❌ Installation failed:'), error.message);
      throw error;
    }
  }

  async performStandardInstallation() {
    // Create directory structure
    await this.createDirectories();
    
    // Setup pre-configured TaskMaster
    await this.setupTaskMaster();
    
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
  }

  async performExpressInstallation() {
    const { MergeStrategies } = require('./merge-strategies');
    const mergeStrategies = new MergeStrategies(this.projectDir, this.options);
    
    // Analyze existing setup for conflicts
    const spinner = ora('Analyzing existing setup for express installation...').start();
    const analysis = await mergeStrategies.analyzeExistingSetup();
    
    if (analysis.hasConflicts) {
      spinner.text = 'Conflicts detected - applying smart merge strategies...';
      
      // Create backups if requested
      if (this.options.backup !== 'none' && analysis.backupRequired) {
        const backupPaths = analysis.existingFiles.map(f => f.path);
        await mergeStrategies.createBackups(backupPaths);
        console.log(chalk.blue('📦 Created backups of existing files'));
      }
    } else {
      spinner.text = 'Clean installation detected - proceeding with standard flow...';
    }
    
    spinner.stop();
    
    // Proceed with standard installation flow
    await this.createDirectories();
    await this.setupTaskMaster();
    await this.installTemplates();
    
    // Smart merge settings if conflicts exist
    if (analysis.hasConflicts) {
      await this.smartMergeSettings(mergeStrategies);
    } else {
      await this.configureSettings();
    }
    
    await this.setupHooks();
    await this.installAgents();
    await this.validateInstallation();
    
    console.log(chalk.green('\n✅ Express installation completed successfully!'));
    
    if (analysis.hasConflicts) {
      console.log(chalk.blue('🔄 Smart merge applied to preserve your existing configurations'));
    }
    
    return { success: true, path: this.collectiveDir, expressMode: true, conflicts: analysis.hasConflicts };
  }

  async smartMergeSettings(mergeStrategies) {
    const spinner = ora('Applying smart merge to settings.json...').start();
    
    try {
      const settingsPath = path.join(this.collectiveDir, 'settings.json');
      
      // Get our template settings
      const fileMapping = new FileMapping(this.projectDir, this.options);
      const configMappings = fileMapping.getConfigMapping();
      const settingsMapping = configMappings.find(m => m.target.endsWith('settings.json'));
      
      if (settingsMapping) {
        const templatePath = path.join(this.templateDir, settingsMapping.source);
        let ourSettings = await fs.readFile(templatePath, 'utf8');
        ourSettings = this.processTemplate(ourSettings, this.config);
        const parsedSettings = JSON.parse(ourSettings);
        
        // Perform smart merge
        const mergedSettings = await mergeStrategies.smartMergeSettings(settingsPath, parsedSettings);
        
        // Write merged result
        await fs.ensureDir(path.dirname(settingsPath));
        await fs.writeFile(settingsPath, JSON.stringify(mergedSettings, null, 2));
        
        spinner.succeed('Settings merged successfully');
      } else {
        // Fallback to standard configuration
        await this.configureSettings();
        spinner.succeed('Settings configured');
      }
    } catch (error) {
      spinner.fail('Settings merge failed');
      throw error;
    }
  }

  async checkExistingInstallation() {
    if (await fs.pathExists(this.collectiveDir) && !this.options.force) {
      // Express mode: use smart defaults instead of prompting
      if (this.options.express) {
        console.log(chalk.gray('📁 Existing installation detected - using smart merge mode'));
        this.options.mode = this.options.mode || 'smart-merge';
        return;
      }
      
      // Interactive mode: prompt user
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
      '.claude-collective/metrics',
      '.taskmaster',
      '.taskmaster/tasks',
      '.taskmaster/docs',
      '.taskmaster/reports',
      '.taskmaster/templates'
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
      console.warn(chalk.gray(`  Looked in: ${sourcePath}`));
      console.warn(chalk.gray(`  Template dir: ${this.templateDir}`));
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
    
    // Use FileMapping system for settings instead of hardcoded object
    const fileMapping = new FileMapping(this.projectDir, this.options);
    const configMappings = fileMapping.getConfigMapping();
    
    for (const mapping of configMappings) {
      await this.installMappedFile(mapping);
    }
    
    spinner.succeed('Settings configured');
  }

  async setupHooks() {
    const spinner = ora('Installing hook scripts...').start();
    
    // Use FileMapping system for hooks instead of hardcoded array
    const fileMapping = new FileMapping(this.projectDir, this.options);
    const hookMappings = fileMapping.getHookMapping();
    
    for (const mapping of hookMappings) {
      await this.installMappedFile(mapping);
    }
    
    spinner.succeed('Hook scripts installed');
  }

  async installAgents() {
    const spinner = ora('Installing agent definitions...').start();
    
    // Use FileMapping system for agents instead of hardcoded array
    const fileMapping = new FileMapping(this.projectDir, this.options);
    const agentMappings = fileMapping.getAgentMapping();
    
    for (const mapping of agentMappings) {
      await this.installMappedFile(mapping);
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
        status.agents = agentFiles
          .filter(f => f.endsWith('.json') || f.endsWith('.md'))
          .map(f => f.replace(/\.(json|md)$/, ''));
      }
      
      // Check for issues
      if (!status.behavioral) status.issues.push('CLAUDE.md missing');
      if (!status.testing) status.issues.push('Testing framework not installed');
      if (!status.hooks) status.issues.push('Hooks not installed');
      if (status.agents.length === 0) status.issues.push('No agents installed');
    }
    
    return status;
  }

  async setupTaskMaster() {
    const spinner = ora('Setting up pre-configured TaskMaster...').start();
    
    try {
      // Copy pre-configured .taskmaster structure from templates
      const taskmasterTemplate = path.join(this.templateDir, '.taskmaster');
      const taskmasterTarget = path.join(this.projectDir, '.taskmaster');
      
      if (await fs.pathExists(taskmasterTemplate)) {
        await fs.copy(taskmasterTemplate, taskmasterTarget);
        spinner.succeed('TaskMaster pre-configured (no initialization required)');
      } else {
        // Fallback: create minimal structure manually
        await this.createMinimalTaskMaster();
        spinner.succeed('TaskMaster minimal structure created');
      }
    } catch (error) {
      spinner.fail('TaskMaster setup failed');
      throw error;
    }
  }

  async createMinimalTaskMaster() {
    const taskmasterDir = path.join(this.projectDir, '.taskmaster');
    
    // Create config.json
    const config = {
      main: "claude-3-5-sonnet-20241022",
      research: "claude-3-5-sonnet-20241022",
      fallback: "claude-3-5-sonnet-20241022"
    };
    await fs.writeFile(path.join(taskmasterDir, 'config.json'), JSON.stringify(config, null, 2));
    
    // Create state.json
    const state = {
      currentTag: "master",
      availableTags: ["master"],
      projectRoot: this.projectDir
    };
    await fs.writeFile(path.join(taskmasterDir, 'state.json'), JSON.stringify(state, null, 2));
    
    // Create empty tasks.json
    const tasks = {
      master: {
        tasks: [],
        metadata: {
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString()
        }
      }
    };
    await fs.writeFile(path.join(taskmasterDir, 'tasks', 'tasks.json'), JSON.stringify(tasks, null, 2));
  }
}

module.exports = { CollectiveInstaller };