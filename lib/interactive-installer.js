const inquirer = require('inquirer');
const ora = require('ora');
const chalk = require('chalk');
const { MergeStrategies } = require('./merge-strategies');
const { CollectiveInstaller } = require('./installer');

/**
 * Interactive installer with professional menu system
 * Provides guided installation experience like create-react-app, eslint --init
 */
class InteractiveInstaller {
  constructor(options = {}) {
    this.options = options;
    this.projectDir = process.cwd();
    this.mergeStrategies = new MergeStrategies(this.projectDir, options);
    this.baseInstaller = new CollectiveInstaller(options);
  }

  /**
   * Main interactive installation flow
   */
  async install() {
    console.log(chalk.cyan('🚀 Claude Code Collective Interactive Installation\n'));

    try {
      // 1. Analyze existing setup
      const spinner = ora('Analyzing existing setup...').start();
      const analysis = await this.mergeStrategies.analyzeExistingSetup();
      spinner.stop();

      this.displayAnalysis(analysis);

      // 2. Main installation menu
      const { installMode } = await inquirer.prompt([{
        type: 'list',
        name: 'installMode',
        message: 'How would you like to install the collective system?',
        choices: [
          { 
            name: '🔄 Smart merge (recommended)', 
            value: 'smart-merge',
            short: 'Smart merge'
          },
          { 
            name: '💥 Force overwrite (destructive)', 
            value: 'force',
            short: 'Force overwrite' 
          },
          { 
            name: '⏭️  Skip conflicting files', 
            value: 'skip-conflicts',
            short: 'Skip conflicts'
          },
          { 
            name: '🔍 Show detailed analysis', 
            value: 'analyze',
            short: 'Show analysis'
          },
          { 
            name: '❌ Cancel installation', 
            value: 'cancel',
            short: 'Cancel'
          }
        ]
      }]);

      if (installMode === 'cancel') {
        console.log(chalk.yellow('Installation cancelled by user'));
        return { success: false, cancelled: true };
      }

      if (installMode === 'analyze') {
        await this.showDetailedAnalysis(analysis);
        return this.install(); // Restart menu
      }

      // 3. Handle based on choice
      switch (installMode) {
        case 'smart-merge':
          return await this.smartMergeFlow(analysis);
        case 'force':
          return await this.forceOverwriteFlow(analysis);
        case 'skip-conflicts':
          return await this.skipConflictsFlow(analysis);
        default:
          throw new Error(`Unknown install mode: ${installMode}`);
      }

    } catch (error) {
      console.error(chalk.red('❌ Interactive installation failed:'), error.message);
      throw error;
    }
  }

  /**
   * Display initial analysis results
   */
  displayAnalysis(analysis) {
    if (!analysis.hasConflicts) {
      console.log(chalk.green('✓ Clean project detected - no conflicts found'));
      console.log(chalk.gray('  All collective files will be installed fresh\n'));
    } else {
      console.log(chalk.yellow('⚠️  Existing configuration detected:'));
      console.log(chalk.gray(`  • ${analysis.existingFiles.length} existing files`));
      console.log(chalk.gray(`  • ${analysis.conflicts.length} potential conflicts`));
      if (analysis.backupRequired) {
        console.log(chalk.gray('  • Backups recommended before proceeding'));
      }
      console.log('');
    }
  }

  /**
   * Smart merge installation flow
   */
  async smartMergeFlow(analysis) {
    console.log(chalk.cyan('\n📋 Smart Merge Configuration\n'));

    // Handle conflicts and get strategy for each
    const conflictStrategies = {};
    for (const conflict of analysis.conflicts) {
      const strategy = await this.getConflictStrategy(conflict);
      conflictStrategies[conflict.type] = strategy;
    }

    // Backup options
    const { backupStrategy } = await inquirer.prompt([{
      type: 'list',
      name: 'backupStrategy',
      message: '💾 Backup strategy before making changes?',
      choices: [
        { 
          name: '✅ Create timestamped backups + restore script (recommended)', 
          value: 'full',
          short: 'Full backups'
        },
        { 
          name: '📦 Simple timestamped backups only', 
          value: 'simple',
          short: 'Simple backups'
        },
        { 
          name: '🎲 No backups (I feel lucky)', 
          value: 'none',
          short: 'No backups'
        }
      ]
    }]);

    // Preview changes
    const preview = this.mergeStrategies.generateMergePreview(analysis);
    console.log(chalk.yellow('\n🔍 Preview of changes:\n'));
    console.log(preview);

    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: 'Apply these changes?',
      default: true
    }]);

    if (!confirm) {
      console.log(chalk.yellow('Installation cancelled by user'));
      return { success: false, cancelled: true };
    }

    // Execute installation with chosen strategies
    return await this.executeSmartMerge(analysis, conflictStrategies, backupStrategy);
  }

  /**
   * Get conflict resolution strategy for a specific conflict
   */
  async getConflictStrategy(conflict) {
    const choices = [
      { 
        name: '🔄 Merge intelligently (preserve existing + add ours)', 
        value: 'merge',
        short: 'Intelligent merge'
      },
      { 
        name: '📝 Replace with ours (backup existing first)', 
        value: 'replace',
        short: 'Replace'
      },
      { 
        name: '⏭️  Keep existing (skip our version)', 
        value: 'skip',
        short: 'Keep existing'
      },
      { 
        name: '🔍 Show detailed diff first', 
        value: 'diff',
        short: 'Show diff'
      }
    ];

    const { strategy } = await inquirer.prompt([{
      type: 'list',
      name: 'strategy',
      message: `How to handle ${conflict.type === 'settings' ? 'settings.json' : 'hook files'}?`,
      choices
    }]);

    if (strategy === 'diff') {
      await this.showDetailedDiff(conflict);
      return this.getConflictStrategy(conflict); // Ask again after showing diff
    }

    return strategy;
  }

  /**
   * Force overwrite installation flow
   */
  async forceOverwriteFlow(analysis) {
    console.log(chalk.red('\n💥 Force Overwrite Mode\n'));
    console.log(chalk.yellow('⚠️  This will replace ALL existing collective files!'));
    
    if (analysis.hasConflicts) {
      console.log(chalk.gray(`• ${analysis.conflicts.length} conflicts will be overwritten`));
      console.log(chalk.gray(`• ${analysis.existingFiles.length} existing files affected`));
    }

    const { confirmForce } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmForce',
      message: 'Are you sure you want to force overwrite?',
      default: false
    }]);

    if (!confirmForce) {
      console.log(chalk.yellow('Force overwrite cancelled'));
      return this.install(); // Back to main menu
    }

    // Backup before force overwrite
    const { createBackup } = await inquirer.prompt([{
      type: 'confirm',
      name: 'createBackup',
      message: 'Create backup before overwriting?',
      default: true
    }]);

    return await this.executeForceOverwrite(analysis, createBackup);
  }

  /**
   * Skip conflicts installation flow
   */
  async skipConflictsFlow(analysis) {
    console.log(chalk.blue('\n⏭️  Skip Conflicts Mode\n'));
    
    if (analysis.hasConflicts) {
      console.log(chalk.gray('Files that will be skipped:'));
      for (const conflict of analysis.conflicts) {
        if (conflict.type === 'settings') {
          console.log(chalk.gray('  • settings.json (keeping your version)'));
        }
        if (conflict.type === 'hooks') {
          console.log(chalk.gray(`  • ${conflict.conflictingFiles.length} hook files`));
        }
      }
    } else {
      console.log(chalk.green('No conflicts to skip - proceeding with clean installation'));
    }

    const { confirmSkip } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmSkip',
      message: 'Proceed with skipping conflicting files?',
      default: true
    }]);

    if (!confirmSkip) {
      return this.install(); // Back to main menu
    }

    return await this.executeSkipConflicts(analysis);
  }

  /**
   * Execute smart merge installation
   */
  async executeSmartMerge(analysis, conflictStrategies, backupStrategy) {
    const spinner = ora('Executing smart merge installation...').start();
    
    try {
      // Create backups if requested
      if (backupStrategy !== 'none' && analysis.backupRequired) {
        const backupPaths = analysis.existingFiles.map(f => f.path);
        await this.mergeStrategies.createBackups(backupPaths);
      }

      // Update installer options based on conflict strategies
      const mergedOptions = {
        ...this.options,
        conflictStrategies,
        mergeMode: true
      };

      // Use the base installer with smart merge settings
      const installer = new CollectiveInstaller(mergedOptions);
      const result = await installer.install();

      spinner.succeed('Smart merge installation completed successfully!');
      
      console.log(chalk.green('\n✅ Installation complete with smart merging!'));
      if (backupStrategy !== 'none') {
        console.log(chalk.blue('📦 Your original files have been backed up'));
      }
      console.log(chalk.yellow('\n💡 Next steps:'));
      console.log('1. Review merged settings in .claude/settings.json');
      console.log('2. Test collective functionality with a simple request');
      console.log('3. Restart Claude Code to load new configurations');

      return { ...result, mergeMode: true };

    } catch (error) {
      spinner.fail('Smart merge installation failed');
      throw error;
    }
  }

  /**
   * Execute force overwrite installation
   */
  async executeForceOverwrite(analysis, createBackup) {
    const spinner = ora('Executing force overwrite installation...').start();
    
    try {
      // Create backups if requested
      if (createBackup && analysis.backupRequired) {
        const backupPaths = analysis.existingFiles.map(f => f.path);
        await this.mergeStrategies.createBackups(backupPaths);
      }

      // Force overwrite mode
      const forceOptions = {
        ...this.options,
        force: true,
        overwrite: true
      };

      const installer = new CollectiveInstaller(forceOptions);
      const result = await installer.install();

      spinner.succeed('Force overwrite installation completed!');
      
      console.log(chalk.green('\n✅ Installation complete with force overwrite!'));
      if (createBackup) {
        console.log(chalk.blue('📦 Previous files have been backed up'));
      }

      return { ...result, forceMode: true };

    } catch (error) {
      spinner.fail('Force overwrite installation failed');
      throw error;
    }
  }

  /**
   * Execute skip conflicts installation
   */
  async executeSkipConflicts(analysis) {
    const spinner = ora('Installing non-conflicting files...').start();
    
    try {
      // Skip conflicts mode
      const skipOptions = {
        ...this.options,
        skipConflicts: true,
        overwrite: false
      };

      const installer = new CollectiveInstaller(skipOptions);
      const result = await installer.install();

      spinner.succeed('Installation completed (conflicts skipped)');
      
      console.log(chalk.green('\n✅ Installation complete with conflicts skipped!'));
      console.log(chalk.yellow('⚠️  Some collective features may not work due to skipped files'));
      console.log(chalk.blue('💡 Run again with smart merge to get full functionality'));

      return { ...result, skipMode: true };

    } catch (error) {
      spinner.fail('Skip conflicts installation failed');
      throw error;
    }
  }

  /**
   * Show detailed analysis of existing setup
   */
  async showDetailedAnalysis(analysis) {
    console.log(chalk.cyan('\n🔍 Detailed Configuration Analysis\n'));
    
    if (analysis.existingFiles.length > 0) {
      console.log(chalk.white('📄 Existing Files:'));
      for (const file of analysis.existingFiles) {
        console.log(chalk.gray(`  • ${file.name} (${file.type})`));
      }
      console.log('');
    }

    if (analysis.conflicts.length > 0) {
      console.log(chalk.yellow('⚠️  Detected Conflicts:'));
      for (const conflict of analysis.conflicts) {
        console.log(chalk.gray(`  • ${conflict.type}: ${conflict.message || 'Configuration overlap'}`));
        if (conflict.conflicts) {
          for (const subConflict of conflict.conflicts) {
            console.log(chalk.gray(`    - ${subConflict.message}`));
          }
        }
      }
      console.log('');
    }

    console.log(chalk.green('📋 Recommendations:'));
    for (const rec of analysis.recommendations) {
      console.log(chalk.gray(`  • ${rec}`));
    }
    console.log('');

    await inquirer.prompt([{
      type: 'input',
      name: 'continue',
      message: 'Press Enter to continue...'
    }]);
  }

  /**
   * Show detailed diff for a specific conflict
   */
  async showDetailedDiff(conflict) {
    console.log(chalk.cyan(`\n🔍 Detailed Diff: ${conflict.type}\n`));
    
    if (conflict.type === 'settings') {
      console.log(chalk.gray('Your existing settings.json structure:'));
      console.log(chalk.gray('├── hooks'));
      console.log(chalk.gray('│   ├── PreToolUse (existing)'));
      console.log(chalk.gray('│   └── PostToolUse (existing)'));
      console.log(chalk.gray('└── deniedTools (existing)'));
      console.log('');
      
      console.log(chalk.green('Our additions would include:'));
      console.log(chalk.green('├── hooks'));
      console.log(chalk.green('│   ├── SessionStart (NEW)'));
      console.log(chalk.green('│   ├── PreToolUse (merge with existing)'));
      console.log(chalk.green('│   ├── PostToolUse (merge with existing)'));
      console.log(chalk.green('│   └── SubagentStop (NEW)'));
      console.log(chalk.green('└── deniedTools (merge with existing)'));
    }
    
    if (conflict.type === 'hooks' && conflict.conflictingFiles) {
      console.log(chalk.gray('Conflicting hook files:'));
      for (const file of conflict.conflictingFiles) {
        console.log(chalk.gray(`  • ${file} - would be replaced with our version`));
      }
    }

    console.log('');
    await inquirer.prompt([{
      type: 'input',
      name: 'continue',
      message: 'Press Enter to continue...'
    }]);
  }
}

module.exports = { InteractiveInstaller };