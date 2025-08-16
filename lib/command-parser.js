const EventEmitter = require('events');
const chalk = require('chalk');
const AgentSpawnCommand = require('./AgentSpawnCommand');

class CollectiveCommandParser extends EventEmitter {
  constructor() {
    super();
    this.commands = new Map();
    this.aliases = new Map();
    this.history = [];
    this.maxHistory = 100;
    
    // Initialize agent spawn command system
    this.agentSpawnCommand = new AgentSpawnCommand();
    
    this.initializeCommands();
  }

  initializeCommands() {
    // Collective commands
    this.registerCommand('collective', 'route', this.collectiveRoute);
    this.registerCommand('collective', 'status', this.collectiveStatus);
    this.registerCommand('collective', 'agents', this.collectiveAgents);
    this.registerCommand('collective', 'metrics', this.collectiveMetrics);
    this.registerCommand('collective', 'validate', this.collectiveValidate);
    this.registerCommand('collective', 'help', this.collectiveHelp);
    this.registerCommand('collective', 'test', this.collectiveTest);
    this.registerCommand('collective', 'research', this.collectiveResearch);
    this.registerCommand('collective', 'coordinate', this.collectiveCoordinate);
    this.registerCommand('collective', 'maintain', this.collectiveMaintain);
    this.registerCommand('collective', 'history', this.collectiveHistory);
    
    // Van maintenance commands
    this.registerCommand('van', 'check', this.vanHealthCheck);
    this.registerCommand('van', 'repair', this.vanAutoRepair);
    this.registerCommand('van', 'optimize', this.vanOptimize);
    this.registerCommand('van', 'full', this.vanFullMaintenance);
    this.registerCommand('van', 'report', this.vanGenerateReport);
    this.registerCommand('van', 'schedule', this.vanSchedule);
    this.registerCommand('van', 'help', this.vanHelp);
    
    // Agent commands
    this.registerCommand('agent', 'spawn', this.agentSpawn);
    this.registerCommand('agent', 'list', this.agentList);
    this.registerCommand('agent', 'status', this.agentStatus);
    this.registerCommand('agent', 'route', this.agentRoute);
    this.registerCommand('agent', 'help', this.agentHelp);
    this.registerCommand('agent', 'health', this.agentHealth);
    this.registerCommand('agent', 'handoff', this.agentHandoff);
    this.registerCommand('agent', 'metrics', this.agentMetrics);
    this.registerCommand('agent', 'info', this.agentInfo);
    this.registerCommand('agent', 'test', this.agentTest);
    this.registerCommand('agent', 'kill', this.agentKill);
    
    // Gate commands
    this.registerCommand('gate', 'status', this.gateStatus);
    this.registerCommand('gate', 'validate', this.gateValidate);
    this.registerCommand('gate', 'bypass', this.gateBypass);
    this.registerCommand('gate', 'history', this.gateHistory);
    this.registerCommand('gate', 'help', this.gateHelp);
    this.registerCommand('gate', 'enforce', this.gateEnforce);
    this.registerCommand('gate', 'report', this.gateReport);
    
    // Aliases for convenience
    this.registerAlias('/c', '/collective');
    this.registerAlias('/a', '/agent');
    this.registerAlias('/g', '/gate');
    this.registerAlias('/v', '/van');
    this.registerAlias('/route', '/collective route');
    this.registerAlias('/spawn', '/agent spawn');
    this.registerAlias('/status', '/collective status');
    this.registerAlias('/maintenance', '/van full');
  }

  registerCommand(namespace, command, handler) {
    const key = `${namespace}:${command}`;
    this.commands.set(key, handler.bind(this));
  }

  registerAlias(alias, command) {
    this.aliases.set(alias, command);
  }

  // Natural language parsing removed - LLM agent handles natural language
  parseNaturalLanguage(input) {
    // No natural language processing - commands must be explicit
    return null;
  }

  // Parameter extraction removed - explicit commands only
  extractParametersFromNaturalLanguage(input, baseCommand) {
    return null;
  }

  async parse(input) {
    // Add to history
    this.addToHistory(input);
    
    // Try natural language parsing first
    let processedInput = this.parseNaturalLanguage(input);
    const isNaturalLanguage = processedInput !== null;
    if (!processedInput) {
      processedInput = input;
    }
    
    // Expand aliases
    processedInput = this.expandAliases(processedInput);
    
    // Parse command structure
    const parsed = this.parseCommandStructure(processedInput);
    
    if (!parsed) {
      return {
        success: false,
        error: 'Invalid command format. Commands must start with / (e.g., /collective status)',
        suggestion: this.getSuggestion(input),
        naturalLanguageAttempt: isNaturalLanguage
      };
    }
    
    const { namespace, command, args, flags } = parsed;
    
    // Find handler
    const handler = this.commands.get(`${namespace}:${command}`);
    
    if (!handler) {
      return {
        success: false,
        error: `Unknown command: /${namespace} ${command}`,
        availableCommands: this.getAvailableCommands(namespace),
        suggestion: this.getSuggestion(`/${namespace} ${command}`)
      };
    }
    
    try {
      // Execute command
      const result = await handler(args, flags);
      
      // Emit event for metrics
      this.emit('command:executed', {
        namespace,
        command,
        args,
        flags,
        success: true,
        timestamp: Date.now(),
        originalInput: input,
        processedInput
      });
      
      return {
        success: true,
        result,
        namespace,
        command,
        originalInput: input,
        processedInput,
        naturalLanguageAttempt: processedInput !== input && !input.startsWith('/')
      };
    } catch (error) {
      this.emit('command:error', {
        namespace,
        command,
        error: error.message,
        timestamp: Date.now(),
        originalInput: input
      });
      
      return {
        success: false,
        error: error.message,
        namespace,
        command,
        originalInput: input
      };
    }
  }

  parseCommandStructure(input) {
    // Pattern: /namespace command [args] [--flags]
    const pattern = /^\/(\w+)\s+(\w+)(?:\s+(.*))?$/;
    const match = input.match(pattern);
    
    if (!match) {
      return null;
    }
    
    const [, namespace, command, rest = ''] = match;
    
    // Parse args and flags
    const { args, flags } = this.parseArgsAndFlags(rest);
    
    return {
      namespace,
      command,
      args,
      flags
    };
  }

  parseArgsAndFlags(input) {
    const args = [];
    const flags = {};
    
    // Simple parsing - can be enhanced
    const tokens = input.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
    
    for (const token of tokens) {
      if (token.startsWith('--')) {
        const [key, value = true] = token.slice(2).split('=');
        flags[key] = value === true ? true : value.replace(/^["']|["']$/g, '');
      } else {
        args.push(token.replace(/^["']|["']$/g, ''));
      }
    }
    
    return { args, flags };
  }

  expandAliases(input) {
    for (const [alias, expansion] of this.aliases) {
      if (input.startsWith(alias + ' ') || input === alias) {
        return input.replace(alias, expansion);
      }
    }
    return input;
  }

  addToHistory(command) {
    this.history.unshift({
      command,
      timestamp: Date.now()
    });
    
    if (this.history.length > this.maxHistory) {
      this.history.pop();
    }
  }

  getHistory(limit = 10) {
    return this.history.slice(0, limit);
  }

  getSuggestion(input) {
    // Find closest matching command
    const allCommands = Array.from(this.commands.keys()).map(k => {
      const [ns, cmd] = k.split(':');
      return `/${ns} ${cmd}`;
    });
    
    // Simple Levenshtein distance for suggestions
    const distances = allCommands.map(cmd => ({
      command: cmd,
      distance: this.levenshteinDistance(input, cmd)
    }));
    
    distances.sort((a, b) => a.distance - b.distance);
    
    if (distances[0].distance < 5) {
      return `Did you mean: ${distances[0].command}?`;
    }
    
    return 'Type /collective help for available commands';
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  getAvailableCommands(namespace) {
    const commands = [];
    for (const key of this.commands.keys()) {
      if (key.startsWith(`${namespace}:`)) {
        commands.push(key.replace(`${namespace}:`, ''));
      }
    }
    return commands;
  }

  // Command Handlers - Collective
  async collectiveRoute(args, flags) {
    const request = args.join(' ');
    
    return {
      success: true,
      action: 'route',
      target: '@routing-agent',
      request,
      testRequired: !flags.skipTest,
      metrics: flags.metrics || false,
      output: `🎯 Routing to @routing-agent: "${request}"`
    };
  }

  async collectiveStatus(args, flags) {
    const status = await this.getCollectiveStatus();
    
    return {
      success: true,
      action: 'status',
      behavioral: status.behavioral,
      testing: status.testing,
      hooks: status.hooks,
      agents: status.agents,
      metrics: status.metrics,
      issues: status.issues,
      output: this.formatStatus(status, flags.verbose)
    };
  }

  async collectiveAgents(args, flags) {
    const agents = await this.getAvailableAgents();
    
    return {
      success: true,
      action: 'agents',
      agents,
      count: agents.length,
      output: this.formatAgentList(agents, flags.detailed || flags.verbose)
    };
  }

  async collectiveMetrics(args, flags) {
    const metrics = await this.getCollectiveMetrics();
    
    return {
      success: true,
      action: 'metrics',
      handoffs: metrics.handoffs,
      context: metrics.context,
      coordination: metrics.coordination,
      hypotheses: metrics.hypotheses,
      output: this.formatMetrics(metrics, flags.detailed)
    };
  }

  async collectiveValidate(args, flags) {
    const phase = args[0] || 'current';
    
    return {
      success: true,
      action: 'validate',
      phase,
      results: await this.validateCollective(phase),
      strict: flags.strict || false,
      output: `🔍 Validating collective system (${phase})`
    };
  }

  async collectiveHelp(args, flags) {
    const topic = args[0];
    
    return {
      success: true,
      action: 'help',
      topic,
      output: this.getCollectiveHelp(topic)
    };
  }

  async collectiveTest(args, flags) {
    const testType = args[0] || 'all';
    
    return {
      success: true,
      action: 'test',
      type: testType,
      coverage: flags.coverage || false,
      watch: flags.watch || false,
      output: `🧪 Running ${testType} tests...`
    };
  }

  async collectiveResearch(args, flags) {
    const hypothesis = args[0];
    
    if (!hypothesis) {
      return {
        action: 'research',
        error: 'Hypothesis ID required',
        available: ['h1_jitLoading', 'h2_hubSpoke', 'h3_tddHandoff']
      };
    }
    
    return {
      action: 'research',
      hypothesis,
      validate: true,
      metrics: await this.getHypothesisMetrics(hypothesis),
      output: `🔬 Validating hypothesis: ${hypothesis}`
    };
  }

  async collectiveCoordinate(args, flags) {
    const task = args.join(' ');
    
    return {
      action: 'coordinate',
      task,
      multiAgent: true,
      plan: await this.generateCoordinationPlan(task),
      output: `🎭 Coordinating multi-agent task: "${task}"`
    };
  }

  async collectiveMaintain(args, flags) {
    return {
      action: 'maintain',
      target: '@van-maintenance-agent',
      checkHealth: true,
      repair: flags.repair || false,
      output: '🔧 Invoking van-maintenance-agent for ecosystem health check'
    };
  }

  async collectiveHistory(args, flags) {
    const limit = parseInt(args[0]) || 10;
    const history = this.getHistory(limit);
    
    return {
      action: 'history',
      commands: history,
      output: this.formatHistory(history)
    };
  }

  // Command Handlers - Agent
  async agentSpawn(args, flags) {
    // Special handling for "testing integration" pattern
    if (args.length === 2 && args[0] === 'testing') {
      return {
        success: true,
        action: 'spawn',
        type: 'testing',
        specialization: args[1],
        agent: `testing-${args[1]}-agent`,
        output: `✅ Spawning testing agent with ${args[1]} specialization`
      };
    }
    
    // Delegate to the comprehensive AgentSpawnCommand system
    const argsString = args.join(' ');
    const flagsString = Object.entries(flags)
      .map(([key, value]) => value === true ? `--${key}` : `--${key}=${value}`)
      .join(' ');
    
    const fullArgs = `${argsString} ${flagsString}`.trim();
    
    try {
      const result = await this.agentSpawnCommand.execute(fullArgs);
      
      return {
        action: 'spawn',
        success: result.success,
        type: result.type,
        agent: result.agent,
        message: result.message,
        invocation: result.invocation,
        error: result.error,
        output: result.success 
          ? `✅ ${result.message}${result.invocation ? `\n🎯 Invoke with: ${result.invocation}` : ''}`
          : `❌ ${result.error}\n💡 ${result.help || 'Use "/agent spawn help" for usage information'}`
      };
    } catch (error) {
      return {
        action: 'spawn',
        success: false,
        error: error.message,
        output: `❌ Agent spawn failed: ${error.message}\n💡 Use "/agent spawn help" for usage information`
      };
    }
  }

  async agentList(args, flags) {
    const agents = await this.getAvailableAgents();
    
    return {
      action: 'list',
      agents,
      count: agents.length,
      output: this.formatAgentList(agents, flags.detailed)
    };
  }

  async agentStatus(args, flags) {
    const agentId = args[0];
    const status = await this.getAgentStatus(agentId);
    
    return {
      action: 'status',
      agentId,
      status,
      output: this.formatAgentStatus(status, flags.verbose)
    };
  }

  async agentRoute(args, flags) {
    const request = args.join(' ');
    
    return {
      action: 'route',
      request,
      testMode: true,
      output: `🧪 Testing routing logic for: "${request}"`
    };
  }

  async agentHelp(args, flags) {
    const topic = args[0];
    
    return {
      action: 'help',
      topic,
      output: this.getAgentHelp(topic)
    };
  }

  async agentHealth(args, flags) {
    const agentId = args[0];
    const health = await this.checkAgentHealth(agentId);
    
    return {
      action: 'health',
      agentId,
      health,
      output: this.formatHealth(health, flags.verbose)
    };
  }

  async agentHandoff(args, flags) {
    const [from, to] = args;
    
    if (!from || !to) {
      return {
        action: 'handoff',
        error: 'Both source and target agents required',
        usage: '/agent handoff <from> <to>'
      };
    }
    
    return {
      action: 'handoff',
      from,
      to,
      manual: true,
      testValidation: !flags.skipTest,
      output: `🔄 Manual handoff from ${from} to ${to}`
    };
  }

  async agentMetrics(args, flags) {
    const agentId = args[0];
    const metrics = await this.getAgentMetrics(agentId);
    
    return {
      action: 'metrics',
      agentId,
      metrics,
      output: this.formatAgentMetrics(metrics, flags.detailed)
    };
  }

  async agentInfo(args, flags) {
    const agentId = args[0];
    
    if (!agentId) {
      return {
        action: 'info',
        error: 'Agent ID required'
      };
    }
    
    const info = await this.getAgentInfo(agentId);
    
    return {
      action: 'info',
      agentId,
      info,
      output: this.formatAgentInfo(info)
    };
  }

  async agentTest(args, flags) {
    const agentId = args[0];
    
    return {
      action: 'test',
      agentId,
      testContract: true,
      output: `🧪 Testing agent contract: ${agentId}`
    };
  }

  async agentKill(args, flags) {
    const agentId = args[0];
    
    if (!agentId) {
      return {
        action: 'kill',
        error: 'Agent ID required'
      };
    }
    
    return {
      action: 'kill',
      agentId,
      force: flags.force || false,
      output: `⚠️ Terminating agent: ${agentId}`
    };
  }

  // Command Handlers - Gate
  async gateStatus(args, flags) {
    const status = await this.getGateStatus();
    
    return {
      action: 'status',
      gates: status.gates,
      compliance: status.compliance,
      violations: status.violations,
      output: this.formatGateStatus(status, flags.verbose)
    };
  }

  async gateValidate(args, flags) {
    const phase = args[0] || 'current';
    
    return {
      action: 'validate',
      phase,
      results: await this.validateGate(phase),
      strict: flags.strict || false,
      output: `🔍 Validating ${phase} gate requirements`
    };
  }

  async gateBypass(args, flags) {
    const gate = args[0];
    let reason = args.slice(1).join(' ');
    
    // Handle quoted strings by removing surrounding quotes
    if (reason.startsWith('"') && reason.endsWith('"')) {
      reason = reason.slice(1, -1);
    }
    
    if (!gate || !reason) {
      return {
        success: false,
        action: 'bypass',
        error: 'Gate name and reason required',
        usage: '/gate bypass <gate> <reason>'
      };
    }

    return {
      success: true,
      action: 'bypass',
      gate,
      reason,
      emergency: flags.emergency || false,
      output: `⚠️ EMERGENCY: Bypassing ${gate} gate - Reason: ${reason}`
    };
  }

  async gateHistory(args, flags) {
    const limit = parseInt(args[0]) || 10;
    const history = await this.getGateHistory(limit);
    
    return {
      action: 'history',
      history,
      output: this.formatGateHistory(history)
    };
  }

  async gateHelp(args, flags) {
    const topic = args[0];
    
    return {
      action: 'help',
      topic,
      output: this.getGateHelp(topic)
    };
  }

  async gateEnforce(args, flags) {
    const phase = args[0];
    
    if (!phase) {
      return {
        action: 'enforce',
        error: 'Phase required',
        available: ['planning', 'infrastructure', 'implementation', 'testing', 'polish', 'completion']
      };
    }
    
    return {
      action: 'enforce',
      phase,
      strict: flags.strict || false,
      output: `🚪 Enforcing ${phase} gate validation`
    };
  }

  async gateReport(args, flags) {
    const report = await this.generateGateReport();
    
    return {
      action: 'report',
      report,
      export: flags.export || false,
      format: flags.format || 'json',
      output: this.formatGateReport(report)
    };
  }

  // Helper methods
  async getCollectiveStatus() {
    // Implementation would check actual status
    return {
      behavioral: true,
      testing: true,
      hooks: true,
      agents: ['routing-agent', 'behavioral-transformation-agent', 'testing-implementation-agent'],
      metrics: true,
      issues: []
    };
  }

  async getAvailableAgents() {
    // Mock implementation - would read from actual agent registry
    return [
      { id: 'routing-agent', type: 'coordination', status: 'active' },
      { id: 'behavioral-transformation-agent', type: 'behavioral', status: 'active' },
      { id: 'testing-implementation-agent', type: 'testing', status: 'active' },
      { id: 'component-implementation-agent', type: 'component', status: 'available' },
      { id: 'feature-implementation-agent', type: 'feature', status: 'available' }
    ];
  }

  async getAgentStatus(agentId) {
    // Mock implementation
    return {
      id: agentId,
      status: 'active',
      uptime: '2h 45m',
      tasksCompleted: 12,
      successRate: 0.92
    };
  }

  async checkAgentHealth(agentId) {
    // Mock implementation
    return {
      status: 'healthy',
      uptime: '2h 45m',
      memory: 128,
      lastActivity: '2 minutes ago',
      handoffs: 15,
      errors: 1
    };
  }

  async getAgentMetrics(agentId) {
    // Mock implementation
    return {
      tasksCompleted: 12,
      successRate: 0.92,
      avgResponseTime: 1250,
      handoffs: { sent: 8, received: 7, testPassRate: 0.93 }
    };
  }

  async getAgentInfo(agentId) {
    // Mock implementation
    return {
      id: agentId,
      type: 'testing',
      specialization: 'integration',
      created: '2025-01-08T10:30:00Z',
      status: 'active',
      tools: ['jest', 'file-operations', 'bash-execution']
    };
  }

  async validateCollective(phase) {
    // Mock implementation
    return {
      phase,
      passed: true,
      checks: [
        { name: 'Behavioral System', status: 'pass' },
        { name: 'Agent Registry', status: 'pass' },
        { name: 'Hook Integration', status: 'pass' }
      ]
    };
  }

  async getHypothesisMetrics(hypothesis) {
    // Mock implementation
    return {
      validated: 42,
      failed: 8,
      successRate: 0.84,
      confidence: 0.95
    };
  }

  async generateCoordinationPlan(task) {
    // Mock implementation
    return {
      agents: ['component-agent', 'testing-agent'],
      sequence: 'parallel',
      estimatedTime: '5 minutes'
    };
  }

  async getCollectiveMetrics() {
    // Mock implementation
    return {
      handoffs: { total: 100, successful: 85, failed: 15 },
      context: { averageSize: 2500, reduction: 0.35 },
      coordination: { compliance: 0.92, violations: 3 },
      hypotheses: { h1: 0.85, h2: 0.90, h3: 0.82 }
    };
  }

  async getGateStatus() {
    // Mock implementation
    return {
      gates: [
        { name: 'Behavioral Gate', passed: true },
        { name: 'Testing Gate', passed: true },
        { name: 'Hook Gate', passed: true }
      ],
      compliance: 1.0,
      violations: 0
    };
  }

  async validateGate(phase) {
    // Mock implementation
    return {
      phase,
      passed: true,
      checks: [
        { name: 'Code Quality', status: 'pass' },
        { name: 'Test Coverage', status: 'pass' },
        { name: 'Documentation', status: 'pass' }
      ]
    };
  }

  async getGateHistory(limit) {
    // Mock implementation
    return Array.from({ length: limit }, (_, i) => ({
      phase: `phase-${i + 1}`,
      passed: Math.random() > 0.2,
      timestamp: new Date(Date.now() - i * 3600000).toISOString()
    }));
  }

  async generateGateReport() {
    // Mock implementation
    return {
      timestamp: new Date().toISOString(),
      overallCompliance: 0.92,
      phases: [
        { name: 'Planning', status: 'pass', issues: [] },
        { name: 'Implementation', status: 'pass', issues: [] },
        { name: 'Testing', status: 'warning', issues: ['Coverage below 90%'] }
      ]
    };
  }

  // Help methods
  getCollectiveHelp(topic) {
    const helpTopics = {
      route: '/collective route <request> - Route request to appropriate agent',
      status: '/collective status [--verbose] - Show system status',
      agents: '/collective agents [--detailed] - List all agents',
      metrics: '/collective metrics [--detailed] - Show system metrics',
      validate: '/collective validate [phase] [--strict] - Validate system',
      help: '/collective help [topic] - Show help information'
    };

    if (topic && helpTopics[topic]) {
      return `📖 ${helpTopics[topic]}`;
    }

    return `📖 Collective Commands Help:

Available commands:
${Object.values(helpTopics).map(cmd => `  ${cmd}`).join('\n')}

Examples:
  /collective status --verbose
  /collective route create a button component
  /collective agents --detailed
  /collective metrics
  
Aliases:
  /c → /collective
  /status → /collective status
  /route → /collective route`;
  }

  getAgentHelp(topic) {
    const helpTopics = {
      spawn: '/agent spawn <type> [specialization] - Create new agent',
      list: '/agent list [--detailed] - List available agents',
      status: '/agent status <id> [--verbose] - Show agent status',
      route: '/agent route <request> - Test routing logic',
      help: '/agent help [topic] - Show help information'
    };

    if (topic && helpTopics[topic]) {
      return `📖 ${helpTopics[topic]}`;
    }

    return `📖 Agent Commands Help:

Available commands:
${Object.values(helpTopics).map(cmd => `  ${cmd}`).join('\n')}

Available agent types:
  - component: UI component development
  - feature: Business logic implementation  
  - testing: Test creation and validation
  - research: Technical research and documentation
  - infrastructure: Build systems and tooling

Examples:
  /agent spawn testing integration
  /agent list --detailed
  /agent status routing-agent
  
Aliases:
  /a → /agent
  /spawn → /agent spawn`;
  }

  getGateHelp(topic) {
    const helpTopics = {
      status: '/gate status [--verbose] - Show gate status',
      validate: '/gate validate [phase] [--strict] - Validate gate requirements',
      bypass: '/gate bypass <gate> <reason> - Emergency gate bypass',
      history: '/gate history [limit] - Show gate validation history',
      help: '/gate help [topic] - Show help information'
    };

    if (topic && helpTopics[topic]) {
      return `📖 ${helpTopics[topic]}`;
    }

    return `📖 Gate Commands Help:

Available commands:
${Object.values(helpTopics).map(cmd => `  ${cmd}`).join('\n')}

Available phases:
  - planning: Planning phase validation
  - infrastructure: Infrastructure setup validation
  - implementation: Implementation quality validation
  - testing: Test coverage and quality validation
  - polish: Code quality and documentation validation
  - completion: Final delivery validation

Examples:
  /gate status --verbose
  /gate validate implementation --strict
  /gate bypass testing "Emergency deployment"
  
Aliases:
  /g → /gate`;
  }

  // Formatting methods
  formatStatus(status, verbose) {
    let output = '📊 Collective Status:\n';
    output += `Behavioral: ${status.behavioral ? '✅' : '❌'}\n`;
    output += `Testing: ${status.testing ? '✅' : '❌'}\n`;
    output += `Hooks: ${status.hooks ? '✅' : '❌'}\n`;
    output += `Agents: ${status.agents.length} active\n`;
    
    if (verbose) {
      output += `\nActive Agents:\n`;
      status.agents.forEach(agent => {
        output += `  - ${agent}\n`;
      });
    }
    
    if (status.issues.length > 0) {
      output += `\n⚠️ Issues:\n`;
      status.issues.forEach(issue => {
        output += `  - ${issue}\n`;
      });
    }
    
    return output;
  }

  formatAgentList(agents, detailed) {
    let output = `🤖 Available Agents (${agents.length}):\n`;
    agents.forEach(agent => {
      output += `  - ${agent.id}`;
      if (detailed) {
        output += ` (${agent.type}, ${agent.status})`;
      }
      output += '\n';
    });
    return output;
  }

  formatAgentStatus(status, verbose) {
    let output = `🤖 Agent Status: ${status.id}\n`;
    output += `Status: ${status.status}\n`;
    output += `Tasks Completed: ${status.tasksCompleted}\n`;
    output += `Success Rate: ${(status.successRate * 100).toFixed(1)}%\n`;
    
    if (verbose) {
      output += `Uptime: ${status.uptime}\n`;
    }
    
    return output;
  }

  formatMetrics(metrics, detailed) {
    let output = '📈 Collective Metrics:\n';
    output += `Handoff Success: ${(metrics.handoffs.successful / metrics.handoffs.total * 100).toFixed(1)}%\n`;
    output += `Context Reduction: ${(metrics.context.reduction * 100).toFixed(1)}%\n`;
    output += `Routing Compliance: ${(metrics.coordination.compliance * 100).toFixed(1)}%\n`;
    
    if (detailed) {
      output += `\nHypothesis Validation:\n`;
      output += `  H1 (JIT Loading): ${(metrics.hypotheses.h1 * 100).toFixed(1)}%\n`;
      output += `  H2 (Hub-Spoke): ${(metrics.hypotheses.h2 * 100).toFixed(1)}%\n`;
      output += `  H3 (TDD Handoff): ${(metrics.hypotheses.h3 * 100).toFixed(1)}%\n`;
    }
    
    return output;
  }

  formatHistory(history) {
    let output = '📜 Command History:\n';
    history.forEach((item, index) => {
      const time = new Date(item.timestamp).toLocaleTimeString();
      output += `${index + 1}. [${time}] ${item.command}\n`;
    });
    return output;
  }

  formatHealth(health, verbose) {
    let output = '🏥 Agent Health:\n';
    output += `Status: ${health.status}\n`;
    output += `Uptime: ${health.uptime}\n`;
    output += `Memory: ${health.memory}MB\n`;
    
    if (verbose) {
      output += `Last Activity: ${health.lastActivity}\n`;
      output += `Handoffs: ${health.handoffs}\n`;
      output += `Errors: ${health.errors}\n`;
    }
    
    return output;
  }

  formatAgentMetrics(metrics, detailed) {
    let output = '📊 Agent Metrics:\n';
    output += `Tasks Completed: ${metrics.tasksCompleted}\n`;
    output += `Success Rate: ${(metrics.successRate * 100).toFixed(1)}%\n`;
    output += `Avg Response Time: ${metrics.avgResponseTime}ms\n`;
    
    if (detailed) {
      output += `\nHandoff Metrics:\n`;
      output += `  Sent: ${metrics.handoffs.sent}\n`;
      output += `  Received: ${metrics.handoffs.received}\n`;
      output += `  Test Pass Rate: ${(metrics.handoffs.testPassRate * 100).toFixed(1)}%\n`;
    }
    
    return output;
  }

  formatAgentInfo(info) {
    let output = `ℹ️ Agent Information:\n`;
    output += `ID: ${info.id}\n`;
    output += `Type: ${info.type}\n`;
    output += `Specialization: ${info.specialization}\n`;
    output += `Created: ${info.created}\n`;
    output += `Status: ${info.status}\n`;
    output += `Tools: ${info.tools.join(', ')}\n`;
    return output;
  }

  formatGateStatus(status, verbose) {
    let output = '🚪 Gate Status:\n';
    
    status.gates.forEach(gate => {
      const icon = gate.passed ? '✅' : '❌';
      output += `${icon} ${gate.name}`;
      if (verbose && !gate.passed) {
        output += ` - ${gate.reason}`;
      }
      output += '\n';
    });
    
    output += `\nCompliance: ${(status.compliance * 100).toFixed(1)}%\n`;
    
    if (status.violations > 0) {
      output += `⚠️ Violations: ${status.violations}\n`;
    }
    
    return output;
  }

  formatGateReport(report) {
    let output = '📋 Gate Compliance Report:\n';
    output += `Generated: ${report.timestamp}\n`;
    output += `Overall Compliance: ${(report.overallCompliance * 100).toFixed(1)}%\n\n`;
    
    report.phases.forEach(phase => {
      output += `${phase.name}: ${phase.status}\n`;
      if (phase.issues.length > 0) {
        phase.issues.forEach(issue => {
          output += `  - ${issue}\n`;
        });
      }
    });
    
    return output;
  }

  formatGateHistory(history) {
    let output = '📜 Gate History:\n';
    history.forEach(item => {
      const icon = item.passed ? '✅' : '❌';
      output += `${icon} ${item.phase} - ${item.timestamp}\n`;
    });
    return output;
  }

  // Van Maintenance Command Handlers
  async vanHealthCheck(args, flags) {
    const VanMaintenanceSystem = require('./van-maintenance');
    const van = new VanMaintenanceSystem();
    
    try {
      const results = await van.runHealthChecks();
      
      return {
        action: 'health-check',
        success: true,
        results,
        output: this.formatHealthCheck(results, flags.verbose)
      };
    } catch (error) {
      return {
        action: 'health-check',
        success: false,
        error: error.message,
        output: `❌ Health check failed: ${error.message}`
      };
    }
  }

  async vanAutoRepair(args, flags) {
    const VanMaintenanceSystem = require('./van-maintenance');
    const van = new VanMaintenanceSystem();
    
    try {
      // First run health checks to find issues
      const health = await van.runHealthChecks();
      
      if (health.issues.length === 0) {
        return {
          action: 'repair',
          success: true,
          repairsNeeded: false,
          output: '✅ No repairs needed - system healthy'
        };
      }
      
      const repairs = await van.runAutoRepairs(health.issues);
      
      return {
        action: 'repair',
        success: true,
        repairsNeeded: true,
        repairs,
        output: this.formatRepairResults(repairs)
      };
    } catch (error) {
      return {
        action: 'repair',
        success: false,
        error: error.message,
        output: `❌ Auto-repair failed: ${error.message}`
      };
    }
  }

  async vanOptimize(args, flags) {
    const VanMaintenanceSystem = require('./van-maintenance');
    const van = new VanMaintenanceSystem();
    
    try {
      const optimizations = await van.runOptimizations();
      
      return {
        action: 'optimize',
        success: true,
        optimizations,
        output: this.formatOptimizationResults(optimizations)
      };
    } catch (error) {
      return {
        action: 'optimize',
        success: false,
        error: error.message,
        output: `❌ Optimization failed: ${error.message}`
      };
    }
  }

  async vanFullMaintenance(args, flags) {
    const VanMaintenanceSystem = require('./van-maintenance');
    const van = new VanMaintenanceSystem();
    
    try {
      const report = await van.performMaintenance();
      
      return {
        action: 'full-maintenance',
        success: true,
        report,
        output: this.formatMaintenanceReport(report)
      };
    } catch (error) {
      return {
        action: 'full-maintenance',
        success: false,
        error: error.message,
        output: `❌ Full maintenance failed: ${error.message}`
      };
    }
  }

  async vanGenerateReport(args, flags) {
    const VanMaintenanceSystem = require('./van-maintenance');
    const van = new VanMaintenanceSystem();
    
    try {
      const report = await van.performMaintenance();
      const reportPath = await van.generateMaintenanceReport(report);
      
      return {
        action: 'report',
        success: true,
        reportPath,
        report,
        output: `📋 Maintenance report generated: ${reportPath}\n\n${van.generateSummary(report)}`
      };
    } catch (error) {
      return {
        action: 'report',
        success: false,
        error: error.message,
        output: `❌ Report generation failed: ${error.message}`
      };
    }
  }

  async vanSchedule(args, flags) {
    const VanMaintenanceSystem = require('./van-maintenance');
    const van = new VanMaintenanceSystem();
    
    try {
      const schedule = van.startScheduledMaintenance();
      
      return {
        action: 'schedule',
        success: true,
        schedule,
        output: `⏰ Scheduled maintenance activated:\n  - Health checks: ${schedule.healthCheck}\n  - Full maintenance: ${schedule.fullMaintenance}\n  - Optimizations: ${schedule.optimizations}`
      };
    } catch (error) {
      return {
        action: 'schedule',
        success: false,
        error: error.message,
        output: `❌ Schedule activation failed: ${error.message}`
      };
    }
  }

  async vanHelp(args, flags) {
    const topic = args[0];
    
    return {
      action: 'help',
      topic,
      output: this.getVanHelp(topic)
    };
  }

  // Van maintenance formatting methods
  formatHealthCheck(results, verbose) {
    let output = `🏥 System Health Check Results:\n`;
    output += `Overall Health: ${results.healthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}\n`;
    output += `Health Score: ${this.getScoreColor(results.score)}\n\n`;
    
    if (verbose || !results.healthy) {
      output += `Individual Checks:\n`;
      results.checks.forEach(check => {
        const icon = check.healthy ? '✅' : '❌';
        output += `${icon} ${check.name}: ${check.score}/100\n`;
        
        if (!check.healthy && check.issues) {
          check.issues.forEach(issue => {
            output += `   - ${issue.type}: ${issue.severity}\n`;
          });
        }
      });
    }
    
    if (results.issues.length > 0) {
      output += `\n⚠️ Issues Found (${results.issues.length}):\n`;
      results.issues.forEach(issue => {
        output += `  - ${issue.name}: ${issue.issues.length} problems\n`;
      });
    }
    
    return output;
  }

  formatRepairResults(repairs) {
    let output = '🔧 Auto-Repair Results:\n';
    
    const successful = repairs.filter(r => r.success);
    const failed = repairs.filter(r => !r.success);
    
    output += `✅ Successful: ${successful.length}\n`;
    output += `❌ Failed: ${failed.length}\n\n`;
    
    successful.forEach(repair => {
      output += `✅ ${repair.name}: Fixed ${repair.fixed} issues\n`;
      if (repair.details) {
        repair.details.forEach(detail => {
          output += `   - ${detail}\n`;
        });
      }
    });
    
    if (failed.length > 0) {
      output += `\n❌ Failed Repairs:\n`;
      failed.forEach(repair => {
        output += `❌ ${repair.name}: ${repair.error}\n`;
      });
    }
    
    return output;
  }

  formatOptimizationResults(optimizations) {
    let output = '⚡ Optimization Results:\n';
    
    const successful = optimizations.filter(o => o.success);
    const improved = successful.filter(o => o.improved);
    
    output += `✅ Successful: ${successful.length}\n`;
    output += `⚡ Improved: ${improved.length}\n\n`;
    
    successful.forEach(opt => {
      const icon = opt.improved ? '⚡' : 'ℹ️';
      output += `${icon} ${opt.name}`;
      
      if (opt.improved) {
        if (opt.filesRemoved) output += ` - Removed ${opt.filesRemoved} files`;
        if (opt.duplicatesRemoved) output += ` - Removed ${opt.duplicatesRemoved} duplicates`;
        if (opt.agentsArchived) output += ` - Archived ${opt.agentsArchived} agents`;
        if (opt.filesArchived) output += ` - Archived ${opt.filesArchived} files`;
      } else {
        output += ' - Already optimal';
      }
      output += '\n';
    });
    
    return output;
  }

  formatMaintenanceReport(report) {
    let output = '🔧 Full Maintenance Report:\n';
    output += `Timestamp: ${report.timestamp}\n`;
    output += `Health Score: ${this.getScoreColor(report.health.score)}\n`;
    output += `Issues Found: ${report.health.issues.length}\n`;
    output += `Repairs Made: ${report.repairs.filter(r => r.success).length}\n`;
    output += `Optimizations: ${report.optimizations.filter(o => o.success).length}\n\n`;
    
    if (report.health.issues.length > 0) {
      output += 'Top Issues:\n';
      report.health.issues.slice(0, 3).forEach(issue => {
        output += `  - ${issue.name}: ${issue.issues.length} problems\n`;
      });
      output += '\n';
    }
    
    if (report.repairs.length > 0) {
      output += 'Repairs Performed:\n';
      report.repairs.filter(r => r.success).forEach(repair => {
        output += `  ✅ ${repair.name}: Fixed ${repair.fixed} issues\n`;
      });
      output += '\n';
    }
    
    if (report.optimizations.filter(o => o.improved).length > 0) {
      output += 'Optimizations Applied:\n';
      report.optimizations.filter(o => o.improved).forEach(opt => {
        output += `  ⚡ ${opt.name}\n`;
      });
    }
    
    return output;
  }

  getScoreColor(score) {
    if (score >= 90) return `${score}/100 ✅`;
    if (score >= 70) return `${score}/100 ⚠️`;
    if (score >= 50) return `${score}/100 🔶`;
    return `${score}/100 ❌`;
  }

  // Natural language handling removed - explicit commands only
  async handleNaturalLanguageInput(input) {
    return {
      success: false,
      error: 'Natural language not supported. Use explicit commands like /collective status',
      suggestion: 'Try /help for available commands',
      naturalLanguageAttempt: true
    };
  }
  
  getVanHelp(topic) {
    const helpTopics = {
      check: '/van check [--verbose] - Run health checks on ecosystem',
      repair: '/van repair - Auto-repair detected issues',
      optimize: '/van optimize - Run performance optimizations',
      full: '/van full - Complete maintenance cycle',
      report: '/van report - Generate maintenance report',
      schedule: '/van schedule - Enable scheduled maintenance',
      help: '/van help [topic] - Show help information'
    };

    if (topic && helpTopics[topic]) {
      return `📖 ${helpTopics[topic]}`;
    }

    return `📖 Van Maintenance Commands Help:

Available commands:
${Object.values(helpTopics).map(cmd => `  ${cmd}`).join('\n')}

Description:
The Van Maintenance System provides comprehensive health monitoring,
auto-repair capabilities, and optimization routines for the agent
ecosystem. It ensures all agents, tests, hooks, and documentation
remain synchronized and healthy.

Examples:
  /van check --verbose
  /van repair
  /van optimize
  /van full
  /van report
  /van schedule
  
Aliases:
  /v → /van
  /maintenance → /van full`;
  }
}

module.exports = CollectiveCommandParser;