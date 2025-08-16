const fs = require('fs-extra');
const path = require('path');
const merge = require('deepmerge');
const chalk = require('chalk');
const crypto = require('crypto');

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
   * Compare two files to determine if they're identical using SHA-256 hashes
   * @param {string} file1Path Path to first file
   * @param {string} file2Path Path to second file
   * @returns {boolean} True if files are identical, false otherwise
   */
  async areFilesIdentical(file1Path, file2Path) {
    try {
      // Quick check: if either file doesn't exist, they're not identical
      if (!await fs.pathExists(file1Path) || !await fs.pathExists(file2Path)) {
        return false;
      }

      // Quick check: compare file sizes first
      const stat1 = await fs.stat(file1Path);
      const stat2 = await fs.stat(file2Path);
      
      if (stat1.size !== stat2.size) {
        return false;
      }

      // For small files (< 100KB), compare content directly
      if (stat1.size < 100 * 1024) {
        const content1 = await fs.readFile(file1Path, 'utf8');
        const content2 = await fs.readFile(file2Path, 'utf8');
        return content1 === content2;
      }

      // For larger files, use SHA-256 hash comparison
      const hash1 = await this.calculateFileHash(file1Path);
      const hash2 = await this.calculateFileHash(file2Path);
      
      // Use crypto.timingSafeEqual for secure comparison
      return crypto.timingSafeEqual(Buffer.from(hash1, 'hex'), Buffer.from(hash2, 'hex'));
    } catch (error) {
      // If there's any error comparing files, assume they're different
      console.warn(chalk.gray(`Warning: Could not compare files ${file1Path} and ${file2Path}: ${error.message}`));
      return false;
    }
  }

  /**
   * Calculate SHA-256 hash of a file
   * @param {string} filePath Path to file
   * @returns {string} Hex-encoded SHA-256 hash
   */
  async calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', data => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  /**
   * Analyze existing setup and detect potential conflicts
   * @param {string} templateDir Path to template directory (optional)
   * @returns {Object} Analysis results with conflicts, existing files, and recommendations
   */
  async analyzeExistingSetup(templateDir = null) {
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
      // If templateDir is provided, check if files are identical first
      let isIdentical = false;
      if (templateDir) {
        const templateSettingsPath = path.join(templateDir, 'settings.json');
        isIdentical = await this.areFilesIdentical(settingsPath, templateSettingsPath);
      }

      if (!isIdentical) {
        // File exists and is different - backup and overwrite
        analysis.existingFiles.push({
          path: settingsPath,
          type: 'settings',
          name: 'settings.json'
        });
        analysis.hasConflicts = true;
        analysis.conflicts.push({
          type: 'settings',
          file: settingsPath,
          message: 'settings.json will be backed up and overwritten'
        });
        analysis.backupRequired = true;
      }
      // If files are identical, silently skip
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

      const existingOurHooks = hookFiles.filter(file => ourHooks.includes(file));
      
      // Check which hooks are actually different from our templates
      const conflictingHooks = [];
      if (templateDir && existingOurHooks.length > 0) {
        const templateHooksDir = path.join(templateDir, 'hooks');
        
        for (const hookFile of existingOurHooks) {
          const existingHookPath = path.join(hooksDir, hookFile);
          const templateHookPath = path.join(templateHooksDir, hookFile);
          
          // Only include if files are different
          const isIdentical = await this.areFilesIdentical(existingHookPath, templateHookPath);
          if (!isIdentical) {
            conflictingHooks.push(hookFile);
          }
        }
      } else {
        // If no templateDir provided, assume all existing hooks are conflicts
        conflictingHooks.push(...existingOurHooks);
      }

      if (conflictingHooks.length > 0) {
        analysis.hasConflicts = true;
        analysis.conflicts.push({
          type: 'hooks',
          conflictingFiles: conflictingHooks,
          totalExisting: hookFiles.length,
          message: `${conflictingHooks.length} hook files will be backed up and overwritten`
        });
        analysis.backupRequired = true;
        
        // Add conflicting hook files to existingFiles for backup
        for (const hookFile of conflictingHooks) {
          const hookPath = path.join(hooksDir, hookFile);
          analysis.existingFiles.push({
            path: hookPath,
            type: 'hook',
            name: hookFile
          });
        }
      }
    }

    // Generate recommendations
    if (analysis.hasConflicts) {
      analysis.recommendations.push('Create backups before overwriting');
      analysis.recommendations.push('Existing files will be backed up and replaced');
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
    await fs.writeFile(scriptPath, restoreScript);
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