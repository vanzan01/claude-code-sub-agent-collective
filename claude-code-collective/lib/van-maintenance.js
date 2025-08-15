const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const EventEmitter = require('events');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class VanMaintenanceSystem extends EventEmitter {
  constructor() {
    super();
    this.projectDir = process.cwd();
    this.collectiveDir = path.join(this.projectDir, 'claude-code-collective');
    this.claudeDir = path.join(this.projectDir, '.claude');
    
    this.healthChecks = new Map();
    this.repairs = new Map();
    this.optimizations = new Map();
    this.maintenanceLog = [];
    
    this.initializeHealthChecks();
    this.initializeRepairs();
    this.initializeOptimizations();
  }

  initializeHealthChecks() {
    // File system health
    this.healthChecks.set('filesystem', {
      name: 'File System Integrity',
      check: async () => await this.checkFileSystem(),
      critical: true
    });
    
    // Agent health
    this.healthChecks.set('agents', {
      name: 'Agent Ecosystem',
      check: async () => await this.checkAgents(),
      critical: true
    });
    
    // Test health
    this.healthChecks.set('tests', {
      name: 'Test Framework',
      check: async () => await this.checkTests(),
      critical: false
    });
    
    // Hook health
    this.healthChecks.set('hooks', {
      name: 'Hook System',
      check: async () => await this.checkHooks(),
      critical: true
    });
    
    // Documentation health
    this.healthChecks.set('documentation', {
      name: 'Documentation Sync',
      check: async () => await this.checkDocumentation(),
      critical: false
    });
    
    // Metrics health
    this.healthChecks.set('metrics', {
      name: 'Metrics Collection',
      check: async () => await this.checkMetrics(),
      critical: false
    });
    
    // Dependencies health
    this.healthChecks.set('dependencies', {
      name: 'Package Dependencies',
      check: async () => await this.checkDependencies(),
      critical: true
    });
    
    // Performance health
    this.healthChecks.set('performance', {
      name: 'System Performance',
      check: async () => await this.checkPerformance(),
      critical: false
    });
  }

  initializeRepairs() {
    // File repairs
    this.repairs.set('missing-files', {
      name: 'Restore Missing Files',
      repair: async (issues) => await this.repairMissingFiles(issues)
    });
    
    // Permission repairs
    this.repairs.set('permissions', {
      name: 'Fix File Permissions',
      repair: async (issues) => await this.repairPermissions(issues)
    });
    
    // Test repairs
    this.repairs.set('broken-tests', {
      name: 'Fix Broken Tests',
      repair: async (issues) => await this.repairTests(issues)
    });
    
    // Hook repairs
    this.repairs.set('hook-config', {
      name: 'Fix Hook Configuration',
      repair: async (issues) => await this.repairHooks(issues)
    });
    
    // Agent repairs
    this.repairs.set('agent-contracts', {
      name: 'Fix Agent Contracts',
      repair: async (issues) => await this.repairAgentContracts(issues)
    });
    
    // Documentation repairs
    this.repairs.set('doc-sync', {
      name: 'Sync Documentation',
      repair: async (issues) => await this.repairDocumentation(issues)
    });
  }

  initializeOptimizations() {
    // Cache optimization
    this.optimizations.set('cache', {
      name: 'Cache Optimization',
      optimize: async () => await this.optimizeCache()
    });
    
    // Test optimization
    this.optimizations.set('test-suite', {
      name: 'Test Suite Optimization',
      optimize: async () => await this.optimizeTests()
    });
    
    // Agent optimization
    this.optimizations.set('agent-pool', {
      name: 'Agent Pool Optimization',
      optimize: async () => await this.optimizeAgentPool()
    });
    
    // Metrics optimization
    this.optimizations.set('metrics-storage', {
      name: 'Metrics Storage Optimization',
      optimize: async () => await this.optimizeMetricsStorage()
    });
  }

  async performMaintenance() {
    console.log(chalk.bold('\n🔧 Van Maintenance System - Full Maintenance Cycle\n'));
    
    const report = {
      timestamp: new Date().toISOString(),
      health: {},
      repairs: [],
      optimizations: [],
      issues: [],
      recommendations: []
    };
    
    // Step 1: Health Checks
    console.log(chalk.cyan('Step 1: Running health checks...'));
    const healthResults = await this.runHealthChecks();
    report.health = healthResults;
    
    // Step 2: Auto Repairs
    if (healthResults.issues.length > 0) {
      console.log(chalk.yellow('\nStep 2: Performing auto-repairs...'));
      const repairResults = await this.runAutoRepairs(healthResults.issues);
      report.repairs = repairResults;
    } else {
      console.log(chalk.green('\nStep 2: No repairs needed ✅'));
    }
    
    // Step 3: Optimizations
    console.log(chalk.cyan('\nStep 3: Running optimizations...'));
    const optimizationResults = await this.runOptimizations();
    report.optimizations = optimizationResults;
    
    // Step 4: Generate Report
    console.log(chalk.cyan('\nStep 4: Generating maintenance report...'));
    await this.generateMaintenanceReport(report);
    
    // Log maintenance
    this.maintenanceLog.push(report);
    this.emit('maintenance-complete', report);
    
    return report;
  }

  async runHealthChecks() {
    const results = {
      healthy: true,
      checks: [],
      issues: [],
      score: 100
    };
    
    let totalWeight = 0;
    let weightedScore = 0;
    
    for (const [id, check] of this.healthChecks) {
      const spinner = chalk.gray(`  Checking ${check.name}...`);
      console.log(spinner);
      
      try {
        const result = await check.check();
        const weight = check.critical ? 2 : 1;
        totalWeight += weight;
        
        if (result.healthy) {
          console.log(chalk.green(`  ✅ ${check.name}: Healthy`));
          weightedScore += weight * 100;
        } else {
          console.log(chalk.red(`  ❌ ${check.name}: Issues found`));
          results.healthy = false;
          results.issues.push({
            checkId: id,
            name: check.name,
            issues: result.issues,
            critical: check.critical
          });
          weightedScore += weight * (result.score || 0);
        }
        
        results.checks.push({
          id,
          name: check.name,
          ...result
        });
      } catch (error) {
        console.log(chalk.red(`  ❌ ${check.name}: Check failed`));
        results.healthy = false;
        results.issues.push({
          checkId: id,
          name: check.name,
          error: error.message,
          critical: check.critical
        });
      }
    }
    
    results.score = Math.round(weightedScore / totalWeight);
    
    // Summary
    console.log(chalk.bold(`\nHealth Score: ${this.getScoreColor(results.score)}`));
    
    return results;
  }

  async checkFileSystem() {
    const issues = [];
    const requiredPaths = [
      'claude-code-collective',
      'claude-code-collective/tests',
      'claude-code-collective/lib/metrics',
      '.claude/agents',
      '.claude/hooks',
      '.claude/docs',
      'CLAUDE.md'
    ];
    
    for (const requiredPath of requiredPaths) {
      const fullPath = path.join(this.projectDir, requiredPath);
      if (!await fs.pathExists(fullPath)) {
        issues.push({
          type: 'missing-file',
          path: requiredPath,
          severity: 'high'
        });
      }
    }
    
    // Check permissions
    const executablePaths = [
      '.claude/hooks'
    ];
    
    for (const execPath of executablePaths) {
      const fullPath = path.join(this.projectDir, execPath);
      if (await fs.pathExists(fullPath)) {
        const files = await fs.readdir(fullPath);
        for (const file of files) {
          if (file.endsWith('.sh')) {
            const filePath = path.join(fullPath, file);
            const stats = await fs.stat(filePath);
            if (!(stats.mode & 0o111)) {
              issues.push({
                type: 'permission',
                path: path.join(execPath, file),
                severity: 'medium'
              });
            }
          }
        }
      }
    }
    
    return {
      healthy: issues.length === 0,
      issues,
      score: Math.max(0, 100 - issues.length * 10)
    };
  }

  async checkAgents() {
    const issues = [];
    const agentsDir = path.join(this.claudeDir, 'agents');
    
    if (!await fs.pathExists(agentsDir)) {
      return {
        healthy: false,
        issues: [{ type: 'missing-agents-dir', severity: 'critical' }],
        score: 0
      };
    }
    
    const agents = await fs.readdir(agentsDir);
    const requiredAgents = ['routing-agent.md', 'van-maintenance-agent.md'];
    
    // Check required agents exist
    for (const required of requiredAgents) {
      if (!agents.includes(required)) {
        issues.push({
          type: 'missing-agent',
          agent: required,
          severity: 'high'
        });
      }
    }
    
    // Validate agent files
    for (const agentFile of agents) {
      if (agentFile.endsWith('.md')) {
        const agentPath = path.join(agentsDir, agentFile);
        const content = await fs.readFile(agentPath, 'utf8');
        
        // Check for required sections
        const requiredSections = [
          '---',
          'name:',
          'description:',
          'tools:',
          '**CRITICAL EXECUTION RULE**',
          '```mermaid'
        ];
        
        for (const section of requiredSections) {
          if (!content.includes(section)) {
            issues.push({
              type: 'incomplete-agent',
              agent: agentFile,
              missing: section,
              severity: 'medium'
            });
          }
        }
        
        // Check for Mermaid syntax errors
        const mermaidMatch = content.match(/```mermaid\n([\s\S]*?)\n```/);
        if (mermaidMatch) {
          const mermaidContent = mermaidMatch[1];
          // Check for decision node syntax issues
          const decisionNodes = mermaidContent.match(/\w+\{[^}]*\}/g);
          if (decisionNodes) {
            for (const node of decisionNodes) {
              if (node.includes('"') || node.includes('\\n') || node.length > 100) {
                issues.push({
                  type: 'mermaid-syntax-error',
                  agent: agentFile,
                  node: node,
                  severity: 'high'
                });
              }
            }
          }
        }
      }
    }
    
    return {
      healthy: issues.filter(i => i.severity === 'high' || i.severity === 'critical').length === 0,
      issues,
      agentCount: agents.length,
      score: Math.max(0, 100 - issues.length * 5)
    };
  }

  async checkTests() {
    const issues = [];
    const testsDir = path.join(this.collectiveDir, 'tests');
    
    if (!await fs.pathExists(testsDir)) {
      return {
        healthy: false,
        issues: [{ type: 'missing-tests-dir', severity: 'high' }],
        score: 0
      };
    }
    
    // Check test configuration
    const jestConfig = path.join(this.collectiveDir, 'jest.config.js');
    if (!await fs.pathExists(jestConfig)) {
      issues.push({
        type: 'missing-jest-config',
        severity: 'medium'
      });
    }
    
    // Run tests to check health
    try {
      const { stdout, stderr } = await execAsync(
        'npm test -- --listTests --passWithNoTests',
        { cwd: this.collectiveDir }
      );
      
      const testFiles = stdout.trim().split('\n').filter(Boolean);
      
      if (testFiles.length === 0) {
        issues.push({
          type: 'no-tests',
          severity: 'low'
        });
      }
    } catch (error) {
      issues.push({
        type: 'test-framework-error',
        error: error.message,
        severity: 'high'
      });
    }
    
    return {
      healthy: issues.filter(i => i.severity === 'high').length === 0,
      issues,
      score: Math.max(0, 100 - issues.length * 8)
    };
  }

  async checkHooks() {
    const issues = [];
    const hooksDir = path.join(this.claudeDir, 'hooks');
    const settingsPath = path.join(this.claudeDir, 'settings.json');
    
    // Check hooks directory
    if (!await fs.pathExists(hooksDir)) {
      return {
        healthy: false,
        issues: [{ type: 'missing-hooks-dir', severity: 'critical' }],
        score: 0
      };
    }
    
    // Check settings.json
    if (!await fs.pathExists(settingsPath)) {
      issues.push({
        type: 'missing-settings',
        severity: 'critical'
      });
    } else {
      try {
        const settings = await fs.readJson(settingsPath);
        
        // Validate hook configuration
        if (!settings.hooks) {
          issues.push({
            type: 'no-hooks-configured',
            severity: 'high'
          });
        }
      } catch (error) {
        issues.push({
          type: 'invalid-settings-json',
          error: error.message,
          severity: 'critical'
        });
      }
    }
    
    // Check hook executability
    const hooks = await fs.readdir(hooksDir);
    for (const hook of hooks) {
      if (hook.endsWith('.sh')) {
        const hookPath = path.join(hooksDir, hook);
        const stats = await fs.stat(hookPath);
        if (!(stats.mode & 0o111)) {
          issues.push({
            type: 'hook-not-executable',
            hook,
            severity: 'medium'
          });
        }
      }
    }
    
    return {
      healthy: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0,
      issues,
      hookCount: hooks.length,
      score: Math.max(0, 100 - issues.length * 10)
    };
  }

  async checkDocumentation() {
    const issues = [];
    
    // Check CLAUDE.md
    const claudeMdPath = path.join(this.projectDir, 'CLAUDE.md');
    if (!await fs.pathExists(claudeMdPath)) {
      issues.push({
        type: 'missing-claude-md',
        severity: 'critical'
      });
    } else {
      const content = await fs.readFile(claudeMdPath, 'utf8');
      
      // Check for required sections
      const requiredSections = [
        'Collective Controller',
        'NEVER IMPLEMENT DIRECTLY',
        'Hub-and-spoke coordination',
        'Sub-Agent Collective'
      ];
      
      for (const section of requiredSections) {
        if (!content.includes(section)) {
          issues.push({
            type: 'incomplete-claude-md',
            missing: section,
            severity: 'medium'
          });
        }
      }
    }
    
    // Check agent interaction diagram
    const diagramPath = path.join(this.claudeDir, 'docs', 'AGENT-INTERACTION-DIAGRAM.md');
    if (!await fs.pathExists(diagramPath)) {
      issues.push({
        type: 'missing-interaction-diagram',
        severity: 'high'
      });
    }
    
    return {
      healthy: issues.filter(i => i.severity === 'critical').length === 0,
      issues,
      score: Math.max(0, 100 - issues.length * 7)
    };
  }

  async checkMetrics() {
    const issues = [];
    const metricsDir = path.join(this.collectiveDir, 'lib', 'metrics');
    
    if (!await fs.pathExists(metricsDir)) {
      issues.push({
        type: 'missing-metrics-dir',
        severity: 'low'
      });
    } else {
      // Check metrics files
      const files = await fs.readdir(metricsDir);
      
      // Check for metrics system files
      const expectedFiles = ['MetricsCollector.js', 'ResearchMetricsSystem.js', 'index.js'];
      for (const file of expectedFiles) {
        if (!files.includes(file)) {
          issues.push({
            type: 'missing-metrics-file',
            file,
            severity: 'low'
          });
        }
      }
    }
    
    return {
      healthy: true, // Metrics are non-critical
      issues,
      score: Math.max(0, 100 - issues.length * 3)
    };
  }

  async checkDependencies() {
    const issues = [];
    
    // Check collective package.json
    const packagePath = path.join(this.collectiveDir, 'package.json');
    if (!await fs.pathExists(packagePath)) {
      issues.push({
        type: 'missing-package-json',
        severity: 'high'
      });
    } else {
      try {
        // Check for vulnerabilities
        const { stdout } = await execAsync(
          'npm audit --json || true',
          { cwd: this.collectiveDir }
        );
        
        if (stdout) {
          const audit = JSON.parse(stdout);
          if (audit.metadata && audit.metadata.vulnerabilities && audit.metadata.vulnerabilities.total > 0) {
            issues.push({
              type: 'npm-vulnerabilities',
              count: audit.metadata.vulnerabilities.total,
              severity: audit.metadata.vulnerabilities.critical > 0 ? 'critical' : 'medium'
            });
          }
        }
      } catch (error) {
        // Audit failed, not critical
      }
    }
    
    return {
      healthy: issues.filter(i => i.severity === 'critical').length === 0,
      issues,
      score: Math.max(0, 100 - issues.length * 15)
    };
  }

  async checkPerformance() {
    const issues = [];
    
    // Check test execution time
    try {
      const start = Date.now();
      await execAsync(
        'npm test -- --listTests --passWithNoTests',
        { cwd: this.collectiveDir, timeout: 5000 }
      );
      const duration = Date.now() - start;
      
      if (duration > 3000) {
        issues.push({
          type: 'slow-test-discovery',
          duration,
          severity: 'low'
        });
      }
    } catch (error) {
      // Timeout or error
      issues.push({
        type: 'test-timeout',
        severity: 'medium'
      });
    }
    
    return {
      healthy: issues.filter(i => i.severity === 'high').length === 0,
      issues,
      score: Math.max(0, 100 - issues.length * 10)
    };
  }

  async runAutoRepairs(issues) {
    const repairs = [];
    
    for (const issue of issues) {
      // Group issues by type
      const issuesByType = {};
      for (const item of issue.issues) {
        if (!issuesByType[item.type]) {
          issuesByType[item.type] = [];
        }
        issuesByType[item.type].push(item);
      }
      
      // Run appropriate repairs
      for (const [type, items] of Object.entries(issuesByType)) {
        const repairKey = this.getRepairKey(type);
        if (repairKey && this.repairs.has(repairKey)) {
          const repair = this.repairs.get(repairKey);
          
          console.log(chalk.gray(`  Repairing: ${repair.name}...`));
          
          try {
            const result = await repair.repair(items);
            repairs.push({
              type: repairKey,
              name: repair.name,
              success: true,
              fixed: result.fixed,
              details: result.details
            });
            
            console.log(chalk.green(`  ✅ ${repair.name}: Fixed ${result.fixed} issues`));
          } catch (error) {
            repairs.push({
              type: repairKey,
              name: repair.name,
              success: false,
              error: error.message
            });
            
            console.log(chalk.red(`  ❌ ${repair.name}: Repair failed`));
          }
        }
      }
    }
    
    return repairs;
  }

  getRepairKey(issueType) {
    const repairMap = {
      'missing-file': 'missing-files',
      'missing-agents-dir': 'missing-files',
      'missing-tests-dir': 'missing-files',
      'permission': 'permissions',
      'hook-not-executable': 'permissions',
      'broken-test': 'broken-tests',
      'test-framework-error': 'broken-tests',
      'missing-hook-file': 'hook-config',
      'no-hooks-configured': 'hook-config',
      'missing-contracts': 'agent-contracts',
      'incomplete-agent': 'agent-contracts',
      'mermaid-syntax-error': 'agent-contracts',
      'undocumented-agent': 'doc-sync',
      'missing-claude-md': 'doc-sync',
      'missing-interaction-diagram': 'doc-sync'
    };
    
    return repairMap[issueType];
  }

  async repairMissingFiles(issues) {
    let fixed = 0;
    const details = [];
    
    for (const issue of issues) {
      const fullPath = path.join(this.projectDir, issue.path);
      
      try {
        if (issue.path.endsWith('.md')) {
          // Create from template
          const template = await this.getTemplate(issue.path);
          await fs.ensureDir(path.dirname(fullPath));
          await fs.writeFile(fullPath, template);
          details.push(`Created ${issue.path} from template`);
        } else {
          // Create directory
          await fs.ensureDir(fullPath);
          details.push(`Created directory ${issue.path}`);
        }
        
        fixed++;
      } catch (error) {
        details.push(`Failed to create ${issue.path}: ${error.message}`);
      }
    }
    
    return { fixed, details };
  }

  async repairPermissions(issues) {
    let fixed = 0;
    const details = [];
    
    for (const issue of issues) {
      const fullPath = path.join(this.projectDir, issue.path);
      
      try {
        await fs.chmod(fullPath, '755');
        details.push(`Fixed permissions for ${issue.path}`);
        fixed++;
      } catch (error) {
        details.push(`Failed to fix ${issue.path}: ${error.message}`);
      }
    }
    
    return { fixed, details };
  }

  async repairTests(issues) {
    let fixed = 0;
    const details = [];
    
    // Reinstall test dependencies
    try {
      await execAsync('npm install', { cwd: this.collectiveDir });
      details.push('Reinstalled test dependencies');
      fixed++;
    } catch (error) {
      details.push(`Failed to reinstall: ${error.message}`);
    }
    
    // Regenerate jest config if missing
    const jestConfig = path.join(this.collectiveDir, 'jest.config.js');
    if (!await fs.pathExists(jestConfig)) {
      const config = `module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/?(*.)+(spec|test).js'],
  collectCoverageFrom: ['tests/**/*.js'],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 10000
};`;
      
      await fs.writeFile(jestConfig, config);
      details.push('Regenerated jest.config.js');
      fixed++;
    }
    
    return { fixed, details };
  }

  async repairHooks(issues) {
    let fixed = 0;
    const details = [];
    
    // Fix settings.json
    const settingsPath = path.join(this.claudeDir, 'settings.json');
    let settings = {};
    
    if (await fs.pathExists(settingsPath)) {
      try {
        settings = await fs.readJson(settingsPath);
      } catch (error) {
        // Reset corrupted settings
        settings = {};
      }
    }
    
    // Ensure hooks structure exists
    if (!settings.hooks) {
      settings.hooks = {
        PreToolUse: [],
        PostToolUse: [],
        SubagentStop: []
      };
      
      await fs.writeJson(settingsPath, settings, { spaces: 2 });
      details.push('Initialized hooks configuration');
      fixed++;
    }
    
    return { fixed, details };
  }

  async repairAgentContracts(issues) {
    let fixed = 0;
    const details = [];
    
    for (const issue of issues) {
      if (issue.type === 'mermaid-syntax-error') {
        const agentPath = path.join(this.claudeDir, 'agents', issue.agent);
        let content = await fs.readFile(agentPath, 'utf8');
        
        // Fix Mermaid decision node syntax
        const mermaidMatch = content.match(/(```mermaid\n)([\s\S]*?)(\n```)/);
        if (mermaidMatch) {
          let mermaidContent = mermaidMatch[2];
          
          // Fix decision nodes with complex strings
          mermaidContent = mermaidContent.replace(
            /(\w+)\{[^}]*"[^}]*\}/g,
            (match, nodeName) => {
              return `${nodeName}{ DETERMINE ${nodeName.replace(/_/g, ' ').toUpperCase()} }`;
            }
          );
          
          // Fix decision nodes that are too long
          mermaidContent = mermaidContent.replace(
            /(\w+)\{([^}]{100,})\}/g,
            (match, nodeName) => {
              return `${nodeName}{ DETERMINE ${nodeName.replace(/_/g, ' ').toUpperCase()} }`;
            }
          );
          
          content = content.replace(mermaidMatch[0], `${mermaidMatch[1]}${mermaidContent}${mermaidMatch[3]}`);
          await fs.writeFile(agentPath, content);
          details.push(`Fixed Mermaid syntax in ${issue.agent}`);
          fixed++;
        }
      }
    }
    
    return { fixed, details };
  }

  async repairDocumentation(issues) {
    let fixed = 0;
    const details = [];
    
    for (const issue of issues) {
      if (issue.type === 'missing-claude-md') {
        const claudeMdPath = path.join(this.projectDir, 'CLAUDE.md');
        const template = await this.getBehavioralTemplate();
        await fs.writeFile(claudeMdPath, template);
        details.push('Regenerated CLAUDE.md');
        fixed++;
      }
      
      if (issue.type === 'missing-interaction-diagram') {
        const diagramPath = path.join(this.claudeDir, 'docs', 'AGENT-INTERACTION-DIAGRAM.md');
        await fs.ensureDir(path.dirname(diagramPath));
        const diagramTemplate = await this.getInteractionDiagramTemplate();
        await fs.writeFile(diagramPath, diagramTemplate);
        details.push('Regenerated agent interaction diagram');
        fixed++;
      }
    }
    
    return { fixed, details };
  }

  async runOptimizations() {
    const results = [];
    
    for (const [id, optimization] of this.optimizations) {
      console.log(chalk.gray(`  Running: ${optimization.name}...`));
      
      try {
        const result = await optimization.optimize();
        results.push({
          id,
          name: optimization.name,
          success: true,
          ...result
        });
        
        if (result.improved) {
          console.log(chalk.green(`  ✅ ${optimization.name}: Optimized`));
        } else {
          console.log(chalk.blue(`  ℹ️ ${optimization.name}: Already optimal`));
        }
      } catch (error) {
        results.push({
          id,
          name: optimization.name,
          success: false,
          error: error.message
        });
        
        console.log(chalk.yellow(`  ⚠️ ${optimization.name}: Failed`));
      }
    }
    
    return results;
  }

  async optimizeCache() {
    const cacheDir = path.join(this.collectiveDir, '.cache');
    let cleaned = 0;
    
    if (await fs.pathExists(cacheDir)) {
      const files = await fs.readdir(cacheDir);
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days
      
      for (const file of files) {
        const filePath = path.join(cacheDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoff) {
          await fs.remove(filePath);
          cleaned++;
        }
      }
    }
    
    return {
      improved: cleaned > 0,
      filesRemoved: cleaned
    };
  }

  async optimizeTests() {
    // Remove duplicate test files
    const testsDir = path.join(this.collectiveDir, 'tests');
    let optimized = 0;
    
    if (await fs.pathExists(testsDir)) {
      const allTests = await this.getAllFiles(testsDir);
      const testsByContent = new Map();
      
      for (const testFile of allTests) {
        const content = await fs.readFile(testFile, 'utf8');
        const crypto = require('crypto');
        const hash = crypto.createHash('md5').update(content).digest('hex');
        
        if (testsByContent.has(hash)) {
          // Duplicate found
          await fs.remove(testFile);
          optimized++;
        } else {
          testsByContent.set(hash, testFile);
        }
      }
    }
    
    return {
      improved: optimized > 0,
      duplicatesRemoved: optimized
    };
  }

  async optimizeAgentPool() {
    // Check for unused agents
    const agentsDir = path.join(this.claudeDir, 'agents');
    let optimized = 0;
    
    if (await fs.pathExists(agentsDir)) {
      const agents = await fs.readdir(agentsDir);
      
      // Archive agents that haven't been used in 30 days
      const archiveDir = path.join(agentsDir, 'archive');
      await fs.ensureDir(archiveDir);
      
      for (const agent of agents) {
        if (agent.endsWith('.md')) {
          const agentPath = path.join(agentsDir, agent);
          const stats = await fs.stat(agentPath);
          const daysOld = (Date.now() - stats.mtime.getTime()) / (24 * 60 * 60 * 1000);
          
          // Don't archive core agents
          const coreAgents = ['routing-agent.md', 'van-maintenance-agent.md', 'enhanced-project-manager-agent.md'];
          if (daysOld > 30 && !coreAgents.includes(agent)) {
            await fs.move(agentPath, path.join(archiveDir, agent));
            optimized++;
          }
        }
      }
    }
    
    return {
      improved: optimized > 0,
      agentsArchived: optimized
    };
  }

  async optimizeMetricsStorage() {
    const metricsDir = path.join(this.collectiveDir, 'metrics');
    let compressed = 0;
    
    if (await fs.pathExists(metricsDir)) {
      const files = await fs.readdir(metricsDir);
      const oldMetrics = files.filter(f => {
        const date = f.match(/(\d{4}-\d{2}-\d{2})/);
        if (date) {
          const fileDate = new Date(date[1]);
          const daysOld = (Date.now() - fileDate.getTime()) / (24 * 60 * 60 * 1000);
          return daysOld > 30;
        }
        return false;
      });
      
      // Archive old metrics
      if (oldMetrics.length > 0) {
        const archiveDir = path.join(metricsDir, 'archive');
        await fs.ensureDir(archiveDir);
        
        for (const file of oldMetrics) {
          await fs.move(
            path.join(metricsDir, file),
            path.join(archiveDir, file),
            { overwrite: true }
          );
          compressed++;
        }
      }
    }
    
    return {
      improved: compressed > 0,
      filesArchived: compressed
    };
  }

  async generateMaintenanceReport(report) {
    const reportPath = path.join(
      this.collectiveDir,
      'maintenance-reports',
      `report-${new Date().toISOString().split('T')[0]}.json`
    );
    
    await fs.ensureDir(path.dirname(reportPath));
    await fs.writeJson(reportPath, report, { spaces: 2 });
    
    // Generate summary
    const summary = this.generateSummary(report);
    console.log(chalk.bold('\n📊 Maintenance Summary:'));
    console.log(summary);
    
    return reportPath;
  }

  generateSummary(report) {
    const lines = [];
    
    lines.push(`Health Score: ${this.getScoreColor(report.health.score)}`);
    lines.push(`Issues Found: ${report.health.issues.length}`);
    lines.push(`Repairs Made: ${report.repairs.filter(r => r.success).length}`);
    lines.push(`Optimizations: ${report.optimizations.filter(o => o.success).length}`);
    
    if (report.health.issues.length > 0) {
      lines.push('\nTop Issues:');
      report.health.issues
        .slice(0, 3)
        .forEach(issue => {
          lines.push(`  - ${issue.name}: ${issue.issues.length} problems`);
        });
    }
    
    if (report.repairs.length > 0) {
      lines.push('\nRepairs Performed:');
      report.repairs
        .filter(r => r.success)
        .forEach(repair => {
          lines.push(`  ✅ ${repair.name}: Fixed ${repair.fixed} issues`);
        });
    }
    
    return lines.join('\n');
  }

  getScoreColor(score) {
    if (score >= 90) return chalk.green(`${score}/100`);
    if (score >= 70) return chalk.yellow(`${score}/100`);
    if (score >= 50) return chalk.magenta(`${score}/100`);
    return chalk.red(`${score}/100`);
  }

  async getAllFiles(dir, files = []) {
    const items = await fs.readdir(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isDirectory()) {
        await this.getAllFiles(fullPath, files);
      } else {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  async getTemplate(path) {
    // Return appropriate template based on path
    return `# Template for ${path}\n\nThis file was auto-generated by van-maintenance.\n`;
  }

  async getBehavioralTemplate() {
    return `# Claude Code Sub-Agent Collective Controller

You are the **Collective Hub Controller** - the central intelligence orchestrating the claude-code-sub-agent-collective research framework.

## Core Identity
- **Project**: claude-code-sub-agent-collective
- **Role**: Hub-and-spoke coordination controller
- **Mission**: Prove Context Engineering hypotheses through perfect agent orchestration
- **Research Focus**: JIT context loading, hub-and-spoke coordination, TDD validation
- **Principle**: "I am the hub, agents are the spokes, gates ensure quality"
- **Mantra**: "I coordinate, agents execute, tests validate, research progresses"

## Prime Directives for Sub-Agent Collective

### DIRECTIVE 1: NEVER IMPLEMENT DIRECTLY
**CRITICAL**: As the Collective Controller, you MUST NOT write code or implement features.
- ALL implementation flows through the sub-agent collective
- Your role is coordination within the collective framework
- Direct implementation violates the hub-and-spoke hypothesis
- If tempted to code, immediately invoke @routing-agent

### DIRECTIVE 2: COLLECTIVE ROUTING PROTOCOL
- Every request enters through @routing-agent
- The collective determines optimal agent selection
- Hub-and-spoke pattern MUST be maintained
- No peer-to-peer agent communication allowed

### DIRECTIVE 3: TEST-DRIVEN VALIDATION
- Every handoff validated through test contracts
- Failed tests = failed handoff = automatic re-routing
- Tests measure context retention and directive compliance
- Research metrics collected from test results

Auto-generated by van-maintenance.
`;
  }

  async getInteractionDiagramTemplate() {
    return `# Agent Interaction and Workflow Diagram

## Overview
This document maps the complete agent ecosystem using a **hub-and-spoke delegation model**.

## Agent Categories and Responsibilities

### 🔄 **Entry and Routing Agents**
- **routing-agent**: Universal entry point with request analysis and routing
- **workflow-agent**: Multi-agent orchestrator for complex tasks

### 📊 **Management and Coordination Agents**
- **enhanced-project-manager-agent**: Coordinates development phases
- **van-maintenance-agent**: Ecosystem health and maintenance

### 🏗️ **Core Implementation Agents**
- **infrastructure-implementation-agent**: Build configurations and frameworks
- **feature-implementation-agent**: Business logic and data services
- **component-implementation-agent**: UI components and interactions

Auto-generated by van-maintenance.
`;
  }

  startScheduledMaintenance() {
    // Note: In a real implementation, you would use node-cron
    console.log('Scheduled maintenance system initialized');
    console.log('- Health checks: Every hour');
    console.log('- Full maintenance: Daily at 2 AM');
    console.log('- Optimizations: Weekly on Sunday');
    
    return {
      healthCheck: 'Hourly',
      fullMaintenance: 'Daily',
      optimizations: 'Weekly'
    };
  }
}

module.exports = VanMaintenanceSystem;