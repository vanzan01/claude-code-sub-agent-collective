class CommandAutocomplete {
  constructor(parser) {
    this.parser = parser;
    this.cache = new Map();
    this.naturalLanguagePatterns = new Map();
    this.cacheTimers = new Map(); // Track cleanup timers
    
    this.initializeNaturalLanguagePatterns();
  }

  initializeNaturalLanguagePatterns() {
    // Natural language to command mappings for autocomplete
    this.naturalLanguagePatterns.set('show status', '/collective status');
    this.naturalLanguagePatterns.set('list agents', '/agent list');
    this.naturalLanguagePatterns.set('show agents', '/agent list');
    this.naturalLanguagePatterns.set('display metrics', '/collective metrics');
    this.naturalLanguagePatterns.set('show metrics', '/collective metrics');
    this.naturalLanguagePatterns.set('validate gates', '/gate validate');
    this.naturalLanguagePatterns.set('check gates', '/gate validate');
    this.naturalLanguagePatterns.set('spawn agent', '/agent spawn');
    this.naturalLanguagePatterns.set('create agent', '/agent spawn');
    this.naturalLanguagePatterns.set('route request', '/collective route');
    this.naturalLanguagePatterns.set('help', '/collective help');
  }

  getSuggestions(partial, context = {}) {
    // Check cache
    const cacheKey = `${partial}:${JSON.stringify(context)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const suggestions = [];
    
    // Parse partial input
    const parts = partial.split(' ');
    
    if (partial.startsWith('/')) {
      // Direct command suggestions
      if (parts.length === 1) {
        // Suggest namespaces
        suggestions.push(...this.getNamespaceSuggestions(partial));
      } else if (parts.length === 2) {
        // Suggest commands for namespace
        const namespace = parts[0].replace('/', '');
        suggestions.push(...this.getCommandSuggestions(namespace, parts[1]));
      } else if (parts.length > 2) {
        // Suggest arguments
        const namespace = parts[0].replace('/', '');
        const command = parts[1];
        suggestions.push(...this.getArgumentSuggestions(namespace, command, parts.slice(2)));
      }
    } else {
      // Natural language suggestions
      suggestions.push(...this.getNaturalLanguageSuggestions(partial, context));
    }
    
    // Add contextual suggestions based on system state
    suggestions.push(...this.getContextualSuggestions(partial, context));
    
    // Cache results
    this.cache.set(cacheKey, suggestions);
    
    // Clear cache after 60 seconds
    const timerId = setTimeout(() => {
      this.cache.delete(cacheKey);
      this.cacheTimers.delete(cacheKey);
    }, 60000).unref();
    this.cacheTimers.set(cacheKey, timerId);
    
    return this.rankSuggestions(suggestions, partial, context);
  }

  getNamespaceSuggestions(partial) {
    const namespaces = ['collective', 'agent', 'gate'];
    const prefix = partial.replace('/', '');
    
    return namespaces
      .filter(ns => ns.startsWith(prefix))
      .map(ns => ({
        text: `/${ns} `,
        displayText: `/${ns}`,
        description: this.getNamespaceDescription(ns),
        type: 'namespace',
        insertText: `/${ns} `,
        priority: 100
      }));
  }

  getCommandSuggestions(namespace, partial) {
    const commands = this.parser.getAvailableCommands(namespace);
    
    return commands
      .filter(cmd => cmd.startsWith(partial))
      .map(cmd => ({
        text: `/${namespace} ${cmd}`,
        displayText: cmd,
        description: this.getCommandDescription(namespace, cmd),
        type: 'command',
        insertText: `/${namespace} ${cmd} `,
        priority: 90,
        namespace,
        command: cmd
      }));
  }

  getArgumentSuggestions(namespace, command, partialArgs) {
    const suggestions = [];
    const argIndex = partialArgs.length - 1;
    const lastArg = partialArgs[argIndex] || '';
    
    // Command-specific suggestions
    if (namespace === 'collective') {
      if (command === 'research') {
        suggestions.push(
          { text: 'h1_jitLoading', description: 'JIT Context Loading hypothesis', type: 'argument' },
          { text: 'h2_hubSpoke', description: 'Hub-and-Spoke Coordination hypothesis', type: 'argument' },
          { text: 'h3_tddHandoff', description: 'Test-Driven Handoffs hypothesis', type: 'argument' }
        );
      } else if (command === 'validate') {
        suggestions.push(
          { text: 'system', description: 'Validate entire collective system', type: 'argument' },
          { text: 'agents', description: 'Validate agent registry', type: 'argument' },
          { text: 'hooks', description: 'Validate hook integration', type: 'argument' },
          { text: 'behavioral', description: 'Validate behavioral system', type: 'argument' }
        );
      }
    } else if (namespace === 'agent') {
      if (command === 'spawn') {
        if (argIndex === 0) {
          suggestions.push(
            { text: 'component', description: 'UI component development agent', type: 'argument' },
            { text: 'feature', description: 'Business logic implementation agent', type: 'argument' },
            { text: 'testing', description: 'Test creation and validation agent', type: 'argument' },
            { text: 'research', description: 'Technical research agent', type: 'argument' },
            { text: 'infrastructure', description: 'Build systems and tooling agent', type: 'argument' },
            { text: 'behavioral-transformation', description: 'CLAUDE.md transformation agent', type: 'argument' }
          );
        } else if (argIndex === 1) {
          suggestions.push(
            { text: 'integration', description: 'Integration testing specialization', type: 'argument' },
            { text: 'unit', description: 'Unit testing specialization', type: 'argument' },
            { text: 'e2e', description: 'End-to-end testing specialization', type: 'argument' },
            { text: 'performance', description: 'Performance testing specialization', type: 'argument' },
            { text: 'accessibility', description: 'Accessibility testing specialization', type: 'argument' }
          );
        }
      } else if (command === 'status' || command === 'info' || command === 'health' || command === 'metrics' || command === 'test' || command === 'kill') {
        // Suggest available agent IDs
        suggestions.push(
          { text: 'routing-agent', description: 'Main routing coordination agent', type: 'argument' },
          { text: 'behavioral-transformation-agent', description: 'Behavioral system agent', type: 'argument' },
          { text: 'testing-implementation-agent', description: 'Testing framework agent', type: 'argument' },
          { text: 'component-implementation-agent', description: 'Component development agent', type: 'argument' },
          { text: 'feature-implementation-agent', description: 'Feature implementation agent', type: 'argument' }
        );
      }
    } else if (namespace === 'gate') {
      if (command === 'validate' || command === 'enforce') {
        suggestions.push(
          { text: 'planning', description: 'Planning phase gate validation', type: 'argument' },
          { text: 'infrastructure', description: 'Infrastructure phase gate validation', type: 'argument' },
          { text: 'implementation', description: 'Implementation phase gate validation', type: 'argument' },
          { text: 'testing', description: 'Testing phase gate validation', type: 'argument' },
          { text: 'polish', description: 'Polish phase gate validation', type: 'argument' },
          { text: 'completion', description: 'Completion phase gate validation', type: 'argument' }
        );
      } else if (command === 'bypass') {
        // First suggest gate names, then common reasons
        if (argIndex === 0) {
          suggestions.push(
            { text: 'planning-gate', description: 'Planning phase quality gate', type: 'argument' },
            { text: 'implementation-gate', description: 'Implementation quality gate', type: 'argument' },
            { text: 'testing-gate', description: 'Testing quality gate', type: 'argument' },
            { text: 'completion-gate', description: 'Completion quality gate', type: 'argument' }
          );
        } else if (argIndex >= 1) {
          suggestions.push(
            { text: '"Emergency deployment"', description: 'Emergency deployment bypass', type: 'argument' },
            { text: '"Critical hotfix"', description: 'Critical hotfix bypass', type: 'argument' },
            { text: '"System maintenance"', description: 'System maintenance bypass', type: 'argument' },
            { text: '"Security update"', description: 'Security update bypass', type: 'argument' }
          );
        }
      }
    }
    
    // Add common flags for all commands
    if (lastArg.startsWith('--')) {
      suggestions.push(...this.getFlagSuggestions(namespace, command, lastArg));
    }
    
    return suggestions
      .filter(s => s.text.toLowerCase().startsWith(lastArg.toLowerCase()))
      .map(s => ({
        ...s,
        insertText: s.text,
        priority: 80
      }));
  }

  getFlagSuggestions(namespace, command, partialFlag) {
    const commonFlags = [
      { flag: '--help', description: 'Show command help' },
      { flag: '--verbose', description: 'Verbose output' },
      { flag: '--detailed', description: 'Detailed information' }
    ];
    
    const commandSpecificFlags = {
      'collective:status': [
        { flag: '--verbose', description: 'Show detailed system status' }
      ],
      'collective:test': [
        { flag: '--coverage', description: 'Include test coverage report' },
        { flag: '--watch', description: 'Watch mode for continuous testing' }
      ],
      'collective:route': [
        { flag: '--skip-test', description: 'Skip test validation' },
        { flag: '--metrics', description: 'Include routing metrics' }
      ],
      'agent:spawn': [
        { flag: '--template', description: 'Use specific agent template' },
        { flag: '--skip-contract', description: 'Skip test contract creation' }
      ],
      'agent:list': [
        { flag: '--detailed', description: 'Show detailed agent information' }
      ],
      'agent:handoff': [
        { flag: '--skip-test', description: 'Skip handoff validation' }
      ],
      'gate:validate': [
        { flag: '--strict', description: 'Strict validation mode' }
      ],
      'gate:report': [
        { flag: '--export', description: 'Export report to file' },
        { flag: '--format', description: 'Output format (json, markdown, html)' }
      ],
      'gate:bypass': [
        { flag: '--emergency', description: 'Emergency bypass mode' }
      ]
    };
    
    const key = `${namespace}:${command}`;
    const flags = [...commonFlags, ...(commandSpecificFlags[key] || [])];
    
    return flags
      .filter(f => f.flag.startsWith(partialFlag))
      .map(f => ({
        text: f.flag,
        description: f.description,
        type: 'flag',
        insertText: f.flag + '=',
        priority: 70
      }));
  }

  getNaturalLanguageSuggestions(partial, context) {
    const suggestions = [];
    const lowerPartial = partial.toLowerCase();
    
    // Direct pattern matches
    for (const [pattern, command] of this.naturalLanguagePatterns) {
      if (pattern.includes(lowerPartial) || lowerPartial.includes(pattern)) {
        const similarity = this.calculateSimilarity(lowerPartial, pattern);
        if (similarity > 0.3) {
          suggestions.push({
            text: command,
            displayText: pattern,
            description: `Natural language: "${pattern}" → ${command}`,
            type: 'natural',
            insertText: command + ' ',
            priority: Math.floor(similarity * 60),
            similarity
          });
        }
      }
    }
    
    // Intent-based suggestions
    const intents = this.extractIntents(lowerPartial);
    for (const intent of intents) {
      const commands = this.getCommandsForIntent(intent);
      suggestions.push(...commands.map(cmd => ({
        text: cmd.command,
        displayText: cmd.description,
        description: `Intent: ${intent} → ${cmd.command}`,
        type: 'intent',
        insertText: cmd.command + ' ',
        priority: 50
      })));
    }
    
    return suggestions;
  }

  getContextualSuggestions(partial, context) {
    const suggestions = [];
    
    // Recent command history suggestions
    if (context.recentCommands) {
      for (const recentCmd of context.recentCommands.slice(0, 3)) {
        if (recentCmd.toLowerCase().includes(partial.toLowerCase())) {
          suggestions.push({
            text: recentCmd,
            displayText: recentCmd,
            description: 'Recent command',
            type: 'history',
            insertText: recentCmd,
            priority: 40
          });
        }
      }
    }
    
    // System state based suggestions
    if (context.systemState) {
      if (context.systemState.hasIssues && !partial.includes('status')) {
        suggestions.push({
          text: '/collective status --verbose',
          displayText: 'Check system status',
          description: 'System issues detected - check status',
          type: 'contextual',
          insertText: '/collective status --verbose',
          priority: 85
        });
      }
      
      if (context.systemState.failedTests && !partial.includes('test')) {
        suggestions.push({
          text: '/collective test',
          displayText: 'Run tests',
          description: 'Failed tests detected - run test suite',
          type: 'contextual',
          insertText: '/collective test',
          priority: 75
        });
      }
    }
    
    return suggestions;
  }

  extractIntents(input) {
    const intents = [];
    
    // Action intents
    if (/\b(show|display|get|check)\b/.test(input)) intents.push('show');
    if (/\b(list|enumerate)\b/.test(input)) intents.push('list');
    if (/\b(create|spawn|new|add)\b/.test(input)) intents.push('create');
    if (/\b(validate|verify|test)\b/.test(input)) intents.push('validate');
    if (/\b(route|send|delegate)\b/.test(input)) intents.push('route');
    if (/\b(help|assist|guide)\b/.test(input)) intents.push('help');
    
    // Entity intents
    if (/\b(agent|agents)\b/.test(input)) intents.push('agent');
    if (/\b(gate|gates|quality)\b/.test(input)) intents.push('gate');
    if (/\b(status|state|health)\b/.test(input)) intents.push('status');
    if (/\b(metrics|stats|statistics)\b/.test(input)) intents.push('metrics');
    
    return intents;
  }

  getCommandsForIntent(intent) {
    const intentCommands = {
      show: [
        { command: '/collective status', description: 'Show system status' },
        { command: '/agent list', description: 'Show available agents' },
        { command: '/gate status', description: 'Show gate status' }
      ],
      list: [
        { command: '/agent list', description: 'List all agents' },
        { command: '/collective agents', description: 'List collective agents' }
      ],
      create: [
        { command: '/agent spawn', description: 'Create new agent' }
      ],
      validate: [
        { command: '/gate validate', description: 'Validate quality gates' },
        { command: '/collective validate', description: 'Validate system' }
      ],
      route: [
        { command: '/collective route', description: 'Route request to agent' }
      ],
      help: [
        { command: '/collective help', description: 'Show help information' }
      ],
      agent: [
        { command: '/agent list', description: 'Agent operations' },
        { command: '/agent spawn', description: 'Create agent' }
      ],
      gate: [
        { command: '/gate status', description: 'Gate operations' },
        { command: '/gate validate', description: 'Validate gates' }
      ],
      status: [
        { command: '/collective status', description: 'System status' }
      ],
      metrics: [
        { command: '/collective metrics', description: 'System metrics' }
      ]
    };
    
    return intentCommands[intent] || [];
  }

  calculateSimilarity(str1, str2) {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
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

  rankSuggestions(suggestions, partial, context) {
    // Remove duplicates
    const seen = new Set();
    const unique = suggestions.filter(s => {
      const key = `${s.text}:${s.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    
    // Sort by priority (higher is better)
    unique.sort((a, b) => {
      // Primary sort by priority
      if (b.priority !== a.priority) {
        return (b.priority || 0) - (a.priority || 0);
      }
      
      // Secondary sort by exact match at start
      const aStartsExact = a.text.toLowerCase().startsWith(partial.toLowerCase());
      const bStartsExact = b.text.toLowerCase().startsWith(partial.toLowerCase());
      if (aStartsExact && !bStartsExact) return -1;
      if (!aStartsExact && bStartsExact) return 1;
      
      // Tertiary sort by length (shorter is better for completion)
      return a.text.length - b.text.length;
    });
    
    // Limit to top 10 suggestions
    return unique.slice(0, 10);
  }

  getNamespaceDescription(namespace) {
    const descriptions = {
      collective: 'System coordination and control commands',
      agent: 'Agent management and monitoring commands',
      gate: 'Quality gate enforcement commands'
    };
    return descriptions[namespace] || '';
  }

  getCommandDescription(namespace, command) {
    const descriptions = {
      'collective:route': 'Route request to appropriate agent',
      'collective:status': 'Show system status and health',
      'collective:agents': 'List all available agents',
      'collective:metrics': 'Display system performance metrics',
      'collective:validate': 'Validate collective system integrity',
      'collective:help': 'Show help information',
      'collective:test': 'Run system test suites',
      'collective:research': 'Validate research hypotheses',
      'collective:coordinate': 'Coordinate multi-agent tasks',
      'collective:maintain': 'System maintenance operations',
      'collective:history': 'Show command history',
      'agent:spawn': 'Create new specialized agent',
      'agent:list': 'List available agents',
      'agent:status': 'Show specific agent status',
      'agent:route': 'Test routing logic',
      'agent:help': 'Show agent command help',
      'agent:health': 'Check agent health status',
      'agent:handoff': 'Manual agent handoff',
      'agent:metrics': 'Show agent performance metrics',
      'agent:info': 'Get detailed agent information',
      'agent:test': 'Test agent contracts',
      'agent:kill': 'Terminate agent instance',
      'gate:status': 'Show quality gate status',
      'gate:validate': 'Validate quality gate requirements',
      'gate:bypass': 'Emergency quality gate bypass',
      'gate:history': 'Show gate validation history',
      'gate:help': 'Show gate command help',
      'gate:enforce': 'Enforce quality gate validation',
      'gate:report': 'Generate compliance report'
    };
    return descriptions[`${namespace}:${command}`] || '';
  }

  // Public method for clearing cache
  clearCache() {
    // Clear all active timers
    for (const timerId of this.cacheTimers.values()) {
      clearTimeout(timerId);
    }
    this.cacheTimers.clear();
    this.cache.clear();
  }

  // Public method for adding custom patterns
  addNaturalLanguagePattern(pattern, command) {
    this.naturalLanguagePatterns.set(pattern, command);
  }
}

module.exports = CommandAutocomplete;