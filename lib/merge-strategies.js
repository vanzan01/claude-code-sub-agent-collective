const fs = require('fs-extra');
const path = require('path');
const merge = require('deepmerge');
const chalk = require('chalk');

/**
 * Intelligent configuration merging strategies for the collective installer
 * Handles smart merging of settings.json, conflict detection, and backup management
 */
class MergeStrategies {
  constructor(projectDir, options = {}) {
    this.projectDir = projectDir;
    this.options = options;
    this.backupDir = path.join(projectDir, '.claude-backups', Date.now().toString());
  }

  /**
   * Analyze existing setup and detect potential conflicts
   * @returns {Object} Analysis results with conflicts, existing files, and recommendations
   */
  async analyzeExistingSetup() {
    const analysis = {
      hasConflicts: false,
      conflicts: [],
      existingFiles: [],
      recommendations: [],
      backupRequired: false
    };

    // Check for existing settings.json
    const settingsPath = path.join(this.projectDir, '.claude', 'settings.json');
    if (await fs.pathExists(settingsPath)) {
      analysis.existingFiles.push({
        path: settingsPath,
        type: 'settings',
        name: 'settings.json'
      });

      const existingSettings = await this.analyzeSettingsConflicts(settingsPath);
      if (existingSettings.hasConflicts) {
        analysis.hasConflicts = true;
        analysis.conflicts.push(existingSettings);
        analysis.backupRequired = true;
      }
    }

    // Check for existing hooks
    const hooksDir = path.join(this.projectDir, '.claude', 'hooks');
    if (await fs.pathExists(hooksDir)) {
      const hookFiles = await fs.readdir(hooksDir);
      const ourHooks = [
        'directive-enforcer.sh',
        'collective-metrics.sh',
        'test-driven-handoff.sh',
        'routing-executor.sh',
        'load-behavioral-system.sh'
      ];

      const conflictingHooks = hookFiles.filter(file => ourHooks.includes(file));
      if (conflictingHooks.length > 0) {
        analysis.hasConflicts = true;
        analysis.conflicts.push({
          type: 'hooks',
          conflictingFiles: conflictingHooks,
          totalExisting: hookFiles.length,
          message: `${conflictingHooks.length} hook files would be overwritten`
        });
        analysis.backupRequired = true;
      }
    }

    // Generate recommendations
    if (analysis.hasConflicts) {
      analysis.recommendations.push('Create backups before merging');
      analysis.recommendations.push('Use smart merge to preserve existing configurations');
    } else {
      analysis.recommendations.push('Clean installation - no conflicts detected');
    }

    return analysis;
  }

  /**
   * Analyze settings.json for hook conflicts and structure differences
   * @param {string} settingsPath Path to existing settings.json
   * @returns {Object} Conflict analysis for settings
   */
  async analyzeSettingsConflicts(settingsPath) {
    const conflict = {
      type: 'settings',
      file: settingsPath,
      hasConflicts: false,
      conflicts: [],
      message: ''
    };

    try {
      const existing = await fs.readJson(settingsPath);
      const ourSettings = this.getOurSettingsTemplate();

      // Check for hook event conflicts
      if (existing.hooks && ourSettings.hooks) {
        for (const [eventType, ourHooks] of Object.entries(ourSettings.hooks)) {
          if (existing.hooks[eventType]) {
            // Check for matcher conflicts
            const existingMatchers = new Set(
              existing.hooks[eventType].map(h => h.matcher)
            );
            const ourMatchers = new Set(
              ourHooks.map(h => h.matcher)
            );

            const matcherOverlap = [...existingMatchers].filter(m => ourMatchers.has(m));
            if (matcherOverlap.length > 0) {
              conflict.hasConflicts = true;
              conflict.conflicts.push({
                eventType,
                overlappingMatchers: matcherOverlap,
                message: `${eventType} event has overlapping matchers: ${matcherOverlap.join(', ')}`
              });
            }
          }
        }
      }

      // Check for deniedTools conflicts
      if (existing.deniedTools && ourSettings.deniedTools) {
        const overlap = existing.deniedTools.filter(tool => 
          ourSettings.deniedTools.includes(tool)
        );
        if (overlap.length > 0) {
          conflict.conflicts.push({
            type: 'deniedTools',
            overlap,
            message: `${overlap.length} denied tools already configured`
          });
        }
      }

      if (conflict.conflicts.length > 0) {
        conflict.message = `Found ${conflict.conflicts.length} configuration conflicts`;
      }

    } catch (error) {
      conflict.hasConflicts = true;
      conflict.message = `Failed to parse existing settings.json: ${error.message}`;
    }

    return conflict;
  }

  /**
   * Smart merge settings.json preserving user configs while adding ours
   * @param {string} existingPath Path to existing settings.json
   * @param {Object} newSettings Our settings to merge in
   * @returns {Object} Merged settings
   */
  async smartMergeSettings(existingPath, newSettings) {
    if (!await fs.pathExists(existingPath)) {
      return newSettings;
    }

    const existing = await fs.readJson(existingPath);
    
    // Custom merge strategy for arrays (avoid duplicates)
    const arrayMerge = (existingArray, newArray) => {
      const combined = [...(existingArray || []), ...(newArray || [])];
      // Deduplicate based on JSON string representation
      return Array.from(new Set(combined.map(JSON.stringify)))
        .map(JSON.parse);
    };

    // Custom merge strategy for hooks (more complex logic)
    const hooksMerge = (existingHooks, newHooks) => {
      const merged = { ...existingHooks };
      
      for (const [eventType, newEventHooks] of Object.entries(newHooks || {})) {
        if (!merged[eventType]) {
          // New event type - add all our hooks
          merged[eventType] = newEventHooks;
        } else {
          // Existing event type - smart merge by matcher
          const existingMatchers = new Set(
            merged[eventType].map(h => h.matcher)
          );
          
          // Add our hooks that don't conflict with existing matchers
          newEventHooks.forEach(newHook => {
            if (!existingMatchers.has(newHook.matcher)) {
              merged[eventType].push(newHook);
            } else {
              // For conflicting matchers, merge the hooks arrays
              const existingHook = merged[eventType].find(h => h.matcher === newHook.matcher);
              if (existingHook && existingHook.hooks && newHook.hooks) {
                existingHook.hooks = arrayMerge(existingHook.hooks, newHook.hooks);
              }
            }
          });
        }
      }
      
      return merged;
    };

    // Perform smart merge
    const mergedSettings = merge(existing, newSettings, {
      arrayMerge,
      customMerge: (key) => {
        if (key === 'hooks') {
          return hooksMerge;
        }
        if (key === 'deniedTools') {
          return arrayMerge;
        }
      }
    });

    return mergedSettings;
  }

  /**
   * Create timestamped backups of existing files
   * @param {Array} filePaths Array of file paths to backup
   * @returns {string} Path to backup directory
   */
  async createBackups(filePaths) {
    await fs.ensureDir(this.backupDir);
    
    for (const filePath of filePaths) {
      if (await fs.pathExists(filePath)) {
        const relativePath = path.relative(this.projectDir, filePath);
        const backupPath = path.join(this.backupDir, relativePath);
        
        await fs.ensureDir(path.dirname(backupPath));
        await fs.copy(filePath, backupPath);
        
        console.log(chalk.blue(`📦 Backed up: ${relativePath}`));
      }
    }

    // Create restore script
    await this.createRestoreScript();
    
    console.log(chalk.green(`✅ Backups created in: ${this.backupDir}`));
    return this.backupDir;
  }

  /**
   * Create a restore script for easy rollback
   */
  async createRestoreScript() {
    const restoreScript = `#!/bin/bash
# Restore claude-code-collective backup from ${new Date().toISOString()}

echo "🔄 Restoring claude-code-collective backup..."

# Copy backed up files back to project
cp -r "${this.backupDir}/"* "${this.projectDir}/"

echo "✅ Restored successfully!"
echo "💡 You may need to restart Claude Code to reload configurations."
echo ""
echo "Backup location: ${this.backupDir}"
`;

    const scriptPath = path.join(this.backupDir, 'restore.sh');
    await fs.writeFile(restoreScript, scriptPath);
    await fs.chmod(scriptPath, '755');
    
    console.log(chalk.yellow(`💾 Restore script: ${scriptPath}`));
  }

  /**
   * Generate preview of what the merge would look like
   * @param {Object} analysis Result from analyzeExistingSetup
   * @returns {string} Human-readable preview
   */
  generateMergePreview(analysis) {
    let preview = '';
    
    if (!analysis.hasConflicts) {
      preview += chalk.green('✅ Clean installation - no conflicts detected\n');
      preview += '• All collective files will be installed fresh\n';
      return preview;
    }

    preview += chalk.yellow('⚠️  Configuration merge preview:\n\n');
    
    for (const conflict of analysis.conflicts) {
      if (conflict.type === 'settings') {
        preview += '📄 settings.json changes:\n';
        preview += '┌─────────────────────────────────────────┐\n';
        
        for (const subConflict of conflict.conflicts) {
          if (subConflict.eventType) {
            preview += `│ + "${subConflict.eventType}": [additional hooks]   │\n`;
          }
        }
        
        preview += '│ + "SessionStart": [3 new hooks]        │\n';
        preview += '│   "PreToolUse": [merged with existing] │\n';
        preview += '└─────────────────────────────────────────┘\n\n';
      }
      
      if (conflict.type === 'hooks') {
        preview += '🔧 Hook files:\n';
        preview += `• ${conflict.conflictingFiles.length} existing hooks will be backed up\n`;
        preview += `• Our versions will be installed\n\n`;
      }
    }
    
    return preview;
  }

  /**
   * Get our settings template for comparison
   * @returns {Object} Our settings template
   */
  getOurSettingsTemplate() {
    return {
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
  }
}

module.exports = { MergeStrategies };