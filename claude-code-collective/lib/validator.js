const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class CollectiveValidator {
  constructor(projectDir = process.cwd()) {
    this.projectDir = projectDir;
    this.collectiveDir = path.join(projectDir, '.claude');
    this.testsDir = path.join(projectDir, '.claude-collective');
  }

  async validateInstallation() {
    const results = [];
    
    // File existence checks
    const fileChecks = [
      { name: 'CLAUDE.md exists', path: 'CLAUDE.md' },
      { name: 'Settings configuration', path: '.claude/settings.json' },
      { name: 'Hooks directory', path: '.claude/hooks' },
      { name: 'Agents directory', path: '.claude/agents' },
      { name: 'Tests directory', path: '.claude-collective/tests' },
      { name: 'Test package.json', path: '.claude-collective/package.json' },
      { name: 'Jest configuration', path: '.claude-collective/jest.config.js' }
    ];
    
    for (const check of fileChecks) {
      const fullPath = path.join(this.projectDir, check.path);
      const exists = await fs.pathExists(fullPath);
      results.push({
        name: check.name,
        passed: exists,
        error: exists ? null : `Missing: ${check.path}`
      });
    }
    
    // Hook executability checks
    const hookChecks = await this.validateHooks();
    results.push(...hookChecks);
    
    // Settings JSON validation
    const settingsCheck = await this.validateSettings();
    results.push(settingsCheck);
    
    // Agent definitions validation
    const agentChecks = await this.validateAgents();
    results.push(...agentChecks);
    
    // Test framework validation
    const testCheck = await this.validateTestFramework();
    results.push(testCheck);
    
    return { tests: results };
  }

  async validateHooks() {
    const results = [];
    const hooksDir = path.join(this.collectiveDir, 'hooks');
    
    if (!await fs.pathExists(hooksDir)) {
      results.push({
        name: 'Hooks directory validation',
        passed: false,
        error: 'Hooks directory does not exist'
      });
      return results;
    }
    
    const expectedHooks = [
      'directive-enforcer.sh',
      'collective-metrics.sh',
      'test-driven-handoff.sh',
      'routing-executor.sh'
    ];
    
    for (const hook of expectedHooks) {
      const hookPath = path.join(hooksDir, hook);
      const exists = await fs.pathExists(hookPath);
      
      if (exists) {
        try {
          const stats = await fs.stat(hookPath);
          const isExecutable = !!(stats.mode & parseInt('111', 8));
          
          results.push({
            name: `Hook ${hook} executable`,
            passed: isExecutable,
            error: isExecutable ? null : `Hook ${hook} is not executable`
          });
        } catch (error) {
          results.push({
            name: `Hook ${hook} validation`,
            passed: false,
            error: `Error checking ${hook}: ${error.message}`
          });
        }
      } else {
        results.push({
          name: `Hook ${hook} exists`,
          passed: false,
          error: `Missing hook: ${hook}`
        });
      }
    }
    
    return results;
  }

  async validateSettings() {
    const settingsPath = path.join(this.collectiveDir, 'settings.json');
    
    try {
      if (!await fs.pathExists(settingsPath)) {
        return {
          name: 'Settings JSON validation',
          passed: false,
          error: 'settings.json does not exist'
        };
      }
      
      const settings = await fs.readJson(settingsPath);
      
      // Check required structure
      const hasHooks = settings.hooks && typeof settings.hooks === 'object';
      const hasPreToolUse = hasHooks && Array.isArray(settings.hooks.PreToolUse);
      const hasPostToolUse = hasHooks && Array.isArray(settings.hooks.PostToolUse);
      const hasSubagentStop = hasHooks && Array.isArray(settings.hooks.SubagentStop);
      
      if (!hasHooks || !hasPreToolUse || !hasPostToolUse || !hasSubagentStop) {
        return {
          name: 'Settings JSON structure',
          passed: false,
          error: 'settings.json missing required hook configuration'
        };
      }
      
      return {
        name: 'Settings JSON validation',
        passed: true,
        error: null
      };
      
    } catch (error) {
      return {
        name: 'Settings JSON validation',
        passed: false,
        error: `Invalid JSON: ${error.message}`
      };
    }
  }

  async validateAgents() {
    const results = [];
    const agentsDir = path.join(this.collectiveDir, 'agents');
    
    if (!await fs.pathExists(agentsDir)) {
      results.push({
        name: 'Agents directory validation',
        passed: false,
        error: 'Agents directory does not exist'
      });
      return results;
    }
    
    try {
      const agentFiles = await fs.readdir(agentsDir);
      const agentDefinitionFiles = agentFiles.filter(f => f.endsWith('.json') || f.endsWith('.md'));
      
      if (agentDefinitionFiles.length === 0) {
        results.push({
          name: 'Agent definitions exist',
          passed: false,
          error: 'No agent definition files found'
        });
        return results;
      }
      
      // Validate each agent file
      for (const file of agentDefinitionFiles) {
        try {
          const agentPath = path.join(agentsDir, file);
          
          if (file.endsWith('.json')) {
            const agent = await fs.readJson(agentPath);
            
            // Check required fields
            const hasName = agent.name && typeof agent.name === 'string';
            const hasDescription = agent.description && typeof agent.description === 'string';
            
            results.push({
              name: `Agent ${file} validation`,
              passed: hasName && hasDescription,
              error: (!hasName || !hasDescription) ? `Agent ${file} missing required fields` : null
            });
          } else if (file.endsWith('.md')) {
            // For markdown agents, just check that the file exists and has content
            const content = await fs.readFile(agentPath, 'utf8');
            const hasContent = content.trim().length > 0;
            
            results.push({
              name: `Agent ${file} validation`,
              passed: hasContent,
              error: !hasContent ? `Agent ${file} is empty` : null
            });
          }
          
        } catch (error) {
          results.push({
            name: `Agent ${file} validation`,
            passed: false,
            error: `Agent validation error: ${error.message}`
          });
        }
      }
      
      results.push({
        name: 'Agent definitions exist',
        passed: true,
        error: null
      });
      
    } catch (error) {
      results.push({
        name: 'Agents directory validation',
        passed: false,
        error: `Error reading agents directory: ${error.message}`
      });
    }
    
    return results;
  }

  async validateTestFramework() {
    const packageJsonPath = path.join(this.testsDir, 'package.json');
    
    try {
      if (!await fs.pathExists(packageJsonPath)) {
        return {
          name: 'Test framework validation',
          passed: false,
          error: 'Test package.json does not exist'
        };
      }
      
      const packageJson = await fs.readJson(packageJsonPath);
      
      // Check for Jest dependency
      const hasJest = (packageJson.devDependencies && packageJson.devDependencies.jest) ||
                     (packageJson.dependencies && packageJson.dependencies.jest);
      
      if (!hasJest) {
        return {
          name: 'Test framework validation',
          passed: false,
          error: 'Jest dependency not found in test package.json'
        };
      }
      
      // Check for test scripts
      const hasTestScript = packageJson.scripts && packageJson.scripts.test;
      
      if (!hasTestScript) {
        return {
          name: 'Test framework validation',
          passed: false,
          error: 'Test script not configured'
        };
      }
      
      // Try to run test validation (dry run)
      try {
        await execAsync('npm test -- --passWithNoTests', { 
          cwd: this.testsDir,
          timeout: 10000 
        });
        
        return {
          name: 'Test framework validation',
          passed: true,
          error: null
        };
      } catch (testError) {
        return {
          name: 'Test framework validation',
          passed: false,
          error: `Test execution failed: ${testError.message}`
        };
      }
      
    } catch (error) {
      return {
        name: 'Test framework validation',
        passed: false,
        error: `Test framework validation error: ${error.message}`
      };
    }
  }

  async validateSyntax() {
    const results = [];
    
    // Validate hook script syntax
    const hooksDir = path.join(this.collectiveDir, 'hooks');
    if (await fs.pathExists(hooksDir)) {
      const hookFiles = await fs.readdir(hooksDir);
      
      for (const hookFile of hookFiles) {
        if (hookFile.endsWith('.sh')) {
          try {
            await execAsync(`bash -n "${path.join(hooksDir, hookFile)}"`);
            results.push({
              name: `Hook syntax ${hookFile}`,
              passed: true,
              error: null
            });
          } catch (error) {
            results.push({
              name: `Hook syntax ${hookFile}`,
              passed: false,
              error: `Syntax error: ${error.message}`
            });
          }
        }
      }
    }
    
    return results;
  }
}

module.exports = { CollectiveValidator };

// CLI usage when run directly
if (require.main === module) {
  const validator = new CollectiveValidator();
  
  validator.validateInstallation()
    .then(results => {
      console.log('Validation Results:');
      results.tests.forEach(test => {
        const icon = test.passed ? '✅' : '❌';
        console.log(`${icon} ${test.name}`);
        if (!test.passed && test.error) {
          console.log(`   Error: ${test.error}`);
        }
      });
      
      const passed = results.tests.filter(t => t.passed).length;
      const total = results.tests.length;
      
      if (passed === total) {
        console.log(`\n✅ All tests passed (${passed}/${total})`);
        process.exit(0);
      } else {
        console.log(`\n❌ Some tests failed (${passed}/${total})`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('Validation failed:', error.message);
      process.exit(1);
    });
}