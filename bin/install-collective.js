#!/usr/bin/env node

const { program } = require('commander');
const chalk = require('chalk');
const { version } = require('../package.json');
const { CollectiveInstaller } = require('../lib/installer');
const { CollectiveConfigurator } = require('../lib/configurator');
const { CollectiveValidator } = require('../lib/validator');

// ASCII art banner
const banner = `
╔═══════════════════════════════════════════════════════╗
║   Claude Code Sub-Agent Collective                    ║
║   Hub-and-Spoke Coordination Framework                ║
║   Version ${version}                                         ║
╚═══════════════════════════════════════════════════════╝
`;

console.log(chalk.cyan(banner));

// Configure CLI
program
  .name('claude-code-collective')
  .description('NPX installer for claude-code-sub-agent-collective system')
  .version(version);

// Init command - main installation
program
  .command('init')
  .description('Initialize collective in current directory')
  .option('-f, --force', 'Overwrite existing installation')
  .option('-m, --minimal', 'Minimal installation (core agents only)')
  .option('-i, --interactive', 'Interactive configuration mode')
  .option('--skip-validation', 'Skip installation validation')
  .option('--hooks-only', 'Install hooks and behavioral system only')
  .option('--testing-only', 'Install testing framework only')
  .action(async (options) => {
    try {
      let installConfig = options;
      
      // Interactive configuration if requested or no specific options provided
      if (options.interactive || (!options.minimal && !options.hooksOnly && !options.testingOnly)) {
        const configurator = new CollectiveConfigurator();
        const interactiveConfig = await configurator.promptInstallationOptions();
        
        // Show summary and confirm
        if (!await configurator.confirmInstallation()) {
          console.log(chalk.yellow('Installation cancelled'));
          process.exit(0);
        }
        
        installConfig = { ...options, ...configurator.generateInstallationOptions(interactiveConfig) };
      }
      
      console.log(chalk.cyan('\n🚀 Starting installation...\n'));
      
      const installer = new CollectiveInstaller(installConfig);
      const result = await installer.install();
      
      if (result.success) {
        console.log(chalk.green('\n🎉 Claude Code Sub-Agent Collective installed successfully!'));
        
        // Show post-installation information
        console.log(chalk.bold('\n📁 Installation Structure:'));
        console.log(`${chalk.cyan('Behavioral System:')} CLAUDE.md`);
        console.log(`${chalk.cyan('Configuration:')} .claude/settings.json`);
        console.log(`${chalk.cyan('Agents:')} .claude/agents/`);
        console.log(`${chalk.cyan('Hooks:')} .claude/hooks/`);
        console.log(`${chalk.cyan('Tests:')} .claude-collective/tests/`);
        
        console.log(chalk.bold('\n🔄 Next Steps:'));
        console.log('1. Restart Claude Code to activate hooks and agents');
        console.log('2. Review CLAUDE.md for behavioral directives');
        console.log('3. Test installation: npx claude-code-collective validate');
        console.log('4. Try a simple request to test agent routing');
        
        console.log(chalk.blue('\n💡 Quick Test: Ask Claude to route a request through @routing-agent'));
      }
    } catch (error) {
      console.error(chalk.red('\n❌ Installation failed:'), error.message);
      
      // Detailed error information
      console.log(chalk.bold('\n🔍 Error Details:'));
      console.log(chalk.gray(error.stack));
      
      console.log(chalk.bold('\n🛠️ Troubleshooting:'));
      console.log('1. Check Node.js version: node --version (>=16.0.0 required)');
      console.log('2. Verify write permissions in current directory');
      console.log('3. Try with --force flag to overwrite existing files');
      console.log('4. Check available disk space');
      console.log('5. Run with --interactive for guided setup');
      
      console.log(chalk.bold('\n📞 Getting Help:'));
      console.log('• Check status: npx claude-code-collective status');
      console.log('• Validate setup: npx claude-code-collective validate');
      console.log('• View logs in /tmp/collective-install.log');
      
      process.exit(1);
    }
  });

// Status command - check installation
program
  .command('status')
  .description('Check collective installation status')
  .action(async () => {
    try {
      const installer = new CollectiveInstaller();
      const status = await installer.getInstallationStatus();
      
      console.log(chalk.bold('\n📊 Collective Installation Status:\n'));
      console.log(`Version: ${status.version || 'Not installed'}`);
      console.log(`Installed: ${status.installed ? '✅' : '❌'}`);
      console.log(`Behavioral System: ${status.behavioral ? '✅' : '❌'}`);
      console.log(`Testing Framework: ${status.testing ? '✅' : '❌'}`);
      console.log(`Hooks Active: ${status.hooks ? '✅' : '❌'}`);
      console.log(`Agents Available: ${status.agents.length}`);
      
      if (status.agents.length > 0) {
        console.log(chalk.gray('  - ' + status.agents.join('\n  - ')));
      }
      
      if (status.issues.length > 0) {
        console.log(chalk.yellow('\n⚠️ Issues detected:'));
        status.issues.forEach(issue => console.log(`  - ${issue}`));
        console.log(chalk.blue('\n💡 Run "npx claude-code-collective init" to fix issues'));
      } else if (status.installed) {
        console.log(chalk.green('\n✅ Installation is healthy!'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Status check failed:'), error.message);
      process.exit(1);
    }
  });

// Validate command - comprehensive validation
program
  .command('validate')
  .description('Validate collective installation integrity')
  .action(async () => {
    try {
      const installer = new CollectiveInstaller();
      
      console.log(chalk.bold('\n🧪 Validating Installation:\n'));
      
      const results = await installer.validateInstallation();
      
      console.log('\nValidation Results:');
      results.forEach(test => {
        const icon = test.passed ? '✅' : '❌';
        console.log(`${icon} ${test.name}`);
      });
      
      const passed = results.filter(t => t.passed).length;
      const total = results.length;
      
      if (passed === total) {
        console.log(chalk.green(`\n✅ All validation checks passed (${passed}/${total})`));
        console.log(chalk.blue('\n🚀 Collective is ready for use!'));
      } else {
        console.log(chalk.red(`\n❌ Validation failed (${passed}/${total})`));
        console.log(chalk.yellow('\n🔧 Run "npx claude-code-collective init --force" to repair'));
        process.exit(1);
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Validation failed:'), error.message);
      process.exit(1);
    }
  });

// Update command placeholder
program
  .command('update')
  .description('Update collective to latest version (coming soon)')
  .option('-c, --check', 'Check for updates only')
  .option('-f, --force', 'Force update even if current')
  .action((options) => {
    console.log(chalk.yellow('⚠️ Update functionality coming in next version'));
    console.log('\nFor now, you can:');
    console.log('• Update manually: npx claude-code-collective init --force');
    console.log('• Check current version: npx claude-code-collective --version');
    console.log('• Validate installation: npx claude-code-collective validate');
  });

// Repair command
program
  .command('repair')
  .description('Repair corrupted installation')
  .option('-f, --force', 'Force repair without prompts')
  .action(async (options) => {
    try {
      console.log(chalk.yellow('🔧 Repairing collective installation...\n'));
      
      // Run validation first
      const validator = new CollectiveValidator();
      const results = await validator.validateInstallation();
      
      const failedTests = results.tests.filter(t => !t.passed);
      
      if (failedTests.length === 0) {
        console.log(chalk.green('✅ No issues found - installation is healthy!'));
        return;
      }
      
      console.log(chalk.red(`❌ Found ${failedTests.length} issues:`));
      failedTests.forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
      });
      
      if (!options.force) {
        const { proceed } = await require('inquirer').prompt([{
          type: 'confirm',
          name: 'proceed',
          message: 'Attempt to repair these issues?',
          default: true
        }]);
        
        if (!proceed) {
          console.log(chalk.yellow('Repair cancelled'));
          return;
        }
      }
      
      // Perform repair by reinstalling with force
      const installer = new CollectiveInstaller({ force: true, repair: true });
      const result = await installer.install();
      
      if (result.success) {
        console.log(chalk.green('\n✅ Repair completed successfully!'));
        console.log(chalk.blue('💡 Restart Claude Code to ensure changes take effect'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Repair failed:'), error.message);
      console.log('\nTry manual reinstallation: npx claude-code-collective init --force');
      process.exit(1);
    }
  });

// Clean command
program
  .command('clean')
  .description('Remove collective installation')
  .option('-f, --force', 'Skip confirmation prompt')
  .action(async (options) => {
    try {
      if (!options.force) {
        const { confirm } = await require('inquirer').prompt([{
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to remove the collective installation?',
          default: false
        }]);
        
        if (!confirm) {
          console.log(chalk.yellow('Removal cancelled'));
          return;
        }
      }
      
      const fs = require('fs-extra');
      const path = require('path');
      
      const filesToRemove = [
        'CLAUDE.md',
        '.claude',
        '.claude-collective'
      ];
      
      let removedCount = 0;
      
      for (const file of filesToRemove) {
        const filePath = path.join(process.cwd(), file);
        if (await fs.pathExists(filePath)) {
          await fs.remove(filePath);
          removedCount++;
          console.log(chalk.gray(`Removed: ${file}`));
        }
      }
      
      if (removedCount > 0) {
        console.log(chalk.green(`\n✅ Collective installation removed (${removedCount} items)`));
      } else {
        console.log(chalk.blue('ℹ️ No collective installation found'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Removal failed:'), error.message);
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
  console.log(chalk.yellow('\n💡 Quick start: npx claude-code-collective init'));
}