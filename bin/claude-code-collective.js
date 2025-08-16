#!/usr/bin/env node

/**
 * Claude Code Sub-Agent Collective CLI
 * Professional command-line interface with interactive and express modes
 */

const { Command } = require('commander');
const chalk = require('chalk');
const path = require('path');
const { ClaudeCodeCollective } = require('../lib/index');
const { InteractiveInstaller } = require('../lib/interactive-installer');
const { CollectiveInstaller } = require('../lib/installer');

const program = new Command();
const packageInfo = require('../package.json');

program
  .name('claude-code-collective')
  .description('Sub-agent collective framework for Claude Code with TDD validation and hub-spoke coordination')
  .version(packageInfo.version);

// Install command with interactive and express modes
program
  .command('install')
  .alias('init')
  .description('Install the collective framework')
  .option('-y, --yes', 'Express mode: skip prompts and use smart defaults')
  .option('-f, --force', 'Force overwrite existing files without prompting')
  .option('--minimal', 'Install minimal version with core components only')
  .option('--interactive', 'Force interactive mode (default when no --yes)')
  .option('--mode <mode>', 'Installation mode: smart-merge, force, or skip-conflicts', 'smart-merge')
  .option('--backup <strategy>', 'Backup strategy: full, simple, or none', 'full')
  .argument('[path]', 'Installation directory', '.')
  .action(async (path, options) => {
    try {
      // Express mode (--yes flag)
      if (options.yes) {
        console.log(chalk.cyan('🚀 Claude Code Collective Express Installation\n'));
        console.log(chalk.gray('Using smart defaults for rapid deployment...\n'));
        
        const installer = new CollectiveInstaller({
          force: options.force,
          minimal: options.minimal,
          mode: options.mode,
          express: true,
          targetPath: path
        });
        
        await installer.install();
        
        console.log(chalk.green('\n✅ Express installation completed!'));
        console.log(chalk.yellow('\n💡 Next steps:'));
        console.log('1. Review .claude/settings.json for hooks configuration');
        console.log('2. Test collective functionality with a simple request');
        console.log('3. Run: npx claude-code-collective validate');
        
      } else {
        // Interactive mode (default)
        const interactiveInstaller = new InteractiveInstaller({
          force: options.force,
          minimal: options.minimal,
          targetPath: path
        });
        
        await interactiveInstaller.install();
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Installation failed:'), error.message);
      if (program.opts().verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Show collective installation status')
  .argument('[projectPath]', 'Project directory to check', '.')
  .action(async (projectPath) => {
    try {
      const installer = new CollectiveInstaller({ targetPath: projectPath });
      const status = await installer.getInstallationStatus();
      
      console.log(chalk.cyan('📊 Claude Code Collective Status\n'));
      console.log(`📁 Project: ${path.basename(path.resolve(projectPath))}`);
      console.log(`📦 Version: ${status.version || 'Not installed'}`);
      console.log(`🚀 Installed: ${status.installed ? '✅ Yes' : '❌ No'}`);
      console.log(`🧠 Behavioral System: ${status.behavioral ? '✅ Active' : '❌ Missing'}`);
      console.log(`🧪 Testing Framework: ${status.testing ? '✅ Ready' : '❌ Missing'}`);
      console.log(`🪝 Hooks: ${status.hooks ? '✅ Configured' : '❌ Missing'}`);
      console.log(`🤖 Agents: ${status.agents?.length || 0} installed`);
      
      if (status.installed) {
        console.log(chalk.green('\n✅ Collective is operational'));
      } else {
        console.log(chalk.yellow('\n⚠️  Run "npx claude-code-collective init" to install'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Status check failed:'), error.message);
      process.exit(1);
    }
  });

// Validate command
program
  .command('validate')
  .description('Validate collective installation')
  .option('--detailed', 'Show detailed validation results')
  .argument('[path]', 'Project directory to validate', '.')
  .action(async (pathArg, options) => {
    try {
      const collective = new ClaudeCodeCollective();
      const validationResult = await collective.validate(pathArg);
      
      if (options.detailed) {
        const installer = new CollectiveInstaller({ targetPath: pathArg });
        const status = await installer.getInstallationStatus();
        
        console.log(chalk.cyan('\n📋 Detailed Status:'));
        console.log(`Version: ${status.version}`);
        console.log(`Installed: ${status.installed ? '✅' : '❌'}`);
        console.log(`Behavioral System: ${status.behavioral ? '✅' : '❌'}`);
        console.log(`Testing Framework: ${status.testing ? '✅' : '❌'}`);
        console.log(`Hooks: ${status.hooks ? '✅' : '❌'}`);
        console.log(`Agents: ${status.agents.length} installed`);
        
        if (status.issues.length > 0) {
          console.log(chalk.yellow('\n⚠️  Issues:'));
          status.issues.forEach(issue => console.log(`  • ${issue}`));
        }
        
        // Show detailed test results
        if (validationResult && validationResult.tests) {
          console.log(chalk.cyan('\n🧪 Test Results:'));
          validationResult.tests.forEach(test => {
            const icon = test.passed ? '✅' : '❌';
            console.log(`${icon} ${test.name}`);
            if (!test.passed && test.error) {
              console.log(chalk.gray(`    ${test.error}`));
            }
          });
        }
      }
      
      // Exit with failure if validation failed
      if (validationResult && !validationResult.valid) {
        process.exit(1);
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Validation failed:'), error.message);
      process.exit(1);
    }
  });

// Info command
program
  .command('info')
  .description('Show framework information and features')
  .option('--json', 'Output as JSON')
  .action((options) => {
    const collective = new ClaudeCodeCollective();
    const info = collective.getInfo();
    
    if (options.json) {
      console.log(JSON.stringify(info, null, 2));
    } else {
      console.log(chalk.cyan(`\n${info.name} v${info.version}`));
      console.log(chalk.gray(info.description));
      console.log(chalk.yellow('\n🎯 Features:'));
      info.features.forEach(feature => {
        console.log(chalk.gray(`  • ${feature}`));
      });
      console.log('');
    }
  });

// Version command (separate from --version flag)
program
  .command('version')
  .description('Show version information')
  .action(() => {
    console.log(packageInfo.version);
  });

// Global options
program
  .option('-v, --verbose', 'Enable verbose output')
  .option('--no-color', 'Disable colored output');

// Handle unknown commands
program
  .configureOutput({
    writeErr: (str) => process.stderr.write(chalk.red(str))
  });

// Custom help
program.addHelpText('after', `
${chalk.yellow('Examples:')}
  ${chalk.gray('# Interactive installation (recommended for new users)')}
  claude-code-collective install

  ${chalk.gray('# Express installation (for automation/CI)')}
  claude-code-collective install --yes

  ${chalk.gray('# Force overwrite with full backups')}
  claude-code-collective install --force --backup full

  ${chalk.gray('# Minimal installation for lightweight setups')}
  claude-code-collective install --minimal --yes

  ${chalk.gray('# Validate installation with detailed output')}
  claude-code-collective validate --detailed

${chalk.yellow('Installation Modes:')}
  ${chalk.gray('Interactive:')} Full menu-driven experience with conflict resolution
  ${chalk.gray('Express:')}     Automated installation using smart defaults (--yes)
  ${chalk.gray('Minimal:')}     Core components only (--minimal)

${chalk.yellow('Merge Strategies:')}
  ${chalk.gray('smart-merge:')}    Intelligently merge with existing configs (default)
  ${chalk.gray('force:')}          Overwrite all existing files (with backup)
  ${chalk.gray('skip-conflicts:')} Skip conflicting files, install only new ones
`);

// Parse command line arguments
program.parse();