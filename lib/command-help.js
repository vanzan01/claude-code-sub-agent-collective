class CommandHelpSystem {
  constructor() {
    this.helpTopics = new Map();
    this.initializeHelp();
  }

  initializeHelp() {
    // Collective help
    this.addHelp('collective', {
      description: 'System coordination and control commands',
      commands: {
        route: {
          syntax: '/collective route <request>',
          description: 'Route request to appropriate agent',
          examples: [
            '/collective route create a button component',
            '/collective route implement user authentication',
            '/collective route fix failing tests --skip-test'
          ],
          arguments: {
            request: 'Natural language description of the task to route'
          },
          flags: { 
            '--skip-test': 'Skip test validation during routing',
            '--metrics': 'Include routing metrics in output'
          }
        },
        status: {
          syntax: '/collective status [--verbose]',
          description: 'Show system status and health information',
          examples: [
            '/collective status',
            '/collective status --verbose'
          ],
          flags: { 
            '--verbose': 'Show detailed status including agent information'
          }
        },
        agents: {
          syntax: '/collective agents [--detailed]',
          description: 'List all available agents in the collective',
          examples: [
            '/collective agents',
            '/collective agents --detailed'
          ],
          flags: { 
            '--detailed': 'Show detailed agent information including status and capabilities'
          }
        },
        metrics: {
          syntax: '/collective metrics [--detailed]',
          description: 'Display collective performance metrics',
          examples: [
            '/collective metrics',
            '/collective metrics --detailed'
          ],
          flags: { 
            '--detailed': 'Include detailed hypothesis validation metrics'
          }
        },
        validate: {
          syntax: '/collective validate [phase] [--strict]',
          description: 'Validate collective system integrity',
          examples: [
            '/collective validate',
            '/collective validate system --strict',
            '/collective validate agents'
          ],
          arguments: {
            phase: 'Optional: system, agents, hooks, behavioral (default: current)'
          },
          flags: { 
            '--strict': 'Use strict validation mode with enhanced checks'
          }
        },
        test: {
          syntax: '/collective test [type] [--coverage] [--watch]',
          description: 'Run collective system test suites',
          examples: [
            '/collective test',
            '/collective test handoffs --coverage',
            '/collective test all --watch'
          ],
          arguments: {
            type: 'Optional: all, handoffs, contracts, integration (default: all)'
          },
          flags: { 
            '--coverage': 'Include test coverage report',
            '--watch': 'Run tests in watch mode'
          }
        },
        research: {
          syntax: '/collective research <hypothesis>',
          description: 'Validate research hypothesis with current data',
          examples: [
            '/collective research h1_jitLoading',
            '/collective research h2_hubSpoke',
            '/collective research h3_tddHandoff'
          ],
          arguments: { 
            hypothesis: 'h1_jitLoading (JIT Context Loading), h2_hubSpoke (Hub-Spoke Coordination), h3_tddHandoff (Test-Driven Handoffs)'
          }
        },
        coordinate: {
          syntax: '/collective coordinate <task>',
          description: 'Coordinate multi-agent task execution',
          examples: [
            '/collective coordinate build a todo app',
            '/collective coordinate implement authentication system',
            '/collective coordinate refactor component architecture'
          ],
          arguments: { 
            task: 'Complex task description requiring multiple agents'
          }
        },
        maintain: {
          syntax: '/collective maintain [--repair]',
          description: 'Invoke van-maintenance-agent for ecosystem health',
          examples: [
            '/collective maintain',
            '/collective maintain --repair'
          ],
          flags: { 
            '--repair': 'Attempt automatic repair of detected issues'
          }
        },
        history: {
          syntax: '/collective history [limit]',
          description: 'Show command execution history',
          examples: [
            '/collective history',
            '/collective history 20'
          ],
          arguments: {
            limit: 'Optional: Number of commands to show (default: 10)'
          }
        },
        help: {
          syntax: '/collective help [topic]',
          description: 'Show help information',
          examples: [
            '/collective help',
            '/collective help route',
            '/collective help status'
          ],
          arguments: {
            topic: 'Optional: Specific command to get help for'
          }
        }
      }
    });

    // Agent help
    this.addHelp('agent', {
      description: 'Agent management and monitoring commands',
      commands: {
        spawn: {
          syntax: '/agent spawn <type> [specialization] [--template] [--skip-contract]',
          description: 'Create new specialized agent instance',
          examples: [
            '/agent spawn testing integration',
            '/agent spawn component --template=custom',
            '/agent spawn feature authentication --skip-contract'
          ],
          arguments: { 
            type: 'component (UI components), feature (business logic), testing (test creation), research (documentation), infrastructure (build systems), behavioral-transformation (CLAUDE.md)',
            specialization: 'Optional: Specific focus area for the agent'
          },
          flags: { 
            '--template': 'Use specific agent template (default, custom, minimal)',
            '--skip-contract': 'Skip creation of test contract'
          }
        },
        list: {
          syntax: '/agent list [--detailed]',
          description: 'List all available agents',
          examples: [
            '/agent list',
            '/agent list --detailed'
          ],
          flags: { 
            '--detailed': 'Show detailed agent information including capabilities and status'
          }
        },
        status: {
          syntax: '/agent status <id> [--verbose]',
          description: 'Show specific agent status and metrics',
          examples: [
            '/agent status routing-agent',
            '/agent status testing-implementation-agent --verbose'
          ],
          arguments: {
            id: 'Agent identifier (routing-agent, behavioral-transformation-agent, etc.)'
          },
          flags: { 
            '--verbose': 'Show detailed status including recent activities'
          }
        },
        route: {
          syntax: '/agent route <request>',
          description: 'Test routing logic without executing',
          examples: [
            '/agent route create a button component',
            '/agent route fix authentication bug'
          ],
          arguments: {
            request: 'Task description to test routing for'
          }
        },
        health: {
          syntax: '/agent health [id] [--verbose]',
          description: 'Check agent health and performance metrics',
          examples: [
            '/agent health',
            '/agent health routing-agent --verbose'
          ],
          arguments: {
            id: 'Optional: Specific agent ID to check (default: all agents)'
          },
          flags: { 
            '--verbose': 'Show detailed health metrics including memory and performance'
          }
        },
        handoff: {
          syntax: '/agent handoff <from> <to> [--skip-test]',
          description: 'Execute manual agent handoff',
          examples: [
            '/agent handoff component-agent testing-agent',
            '/agent handoff routing-agent feature-agent --skip-test'
          ],
          arguments: { 
            from: 'Source agent identifier',
            to: 'Target agent identifier'
          },
          flags: { 
            '--skip-test': 'Skip handoff validation tests'
          }
        },
        metrics: {
          syntax: '/agent metrics <id> [--detailed]',
          description: 'Show agent performance metrics',
          examples: [
            '/agent metrics routing-agent',
            '/agent metrics testing-agent --detailed'
          ],
          arguments: {
            id: 'Agent identifier to get metrics for'
          },
          flags: { 
            '--detailed': 'Include detailed handoff and performance metrics'
          }
        },
        info: {
          syntax: '/agent info <id>',
          description: 'Get detailed agent information',
          examples: [
            '/agent info routing-agent',
            '/agent info behavioral-transformation-agent'
          ],
          arguments: {
            id: 'Agent identifier to get information about'
          }
        },
        test: {
          syntax: '/agent test <id>',
          description: 'Test agent contract validation',
          examples: [
            '/agent test routing-agent',
            '/agent test component-implementation-agent'
          ],
          arguments: {
            id: 'Agent identifier to test'
          }
        },
        kill: {
          syntax: '/agent kill <id> [--force]',
          description: 'Terminate agent instance',
          examples: [
            '/agent kill test-agent',
            '/agent kill stuck-agent --force'
          ],
          arguments: {
            id: 'Agent identifier to terminate'
          },
          flags: { 
            '--force': 'Force termination without graceful shutdown'
          }
        },
        help: {
          syntax: '/agent help [topic]',
          description: 'Show agent command help',
          examples: [
            '/agent help',
            '/agent help spawn',
            '/agent help handoff'
          ],
          arguments: {
            topic: 'Optional: Specific agent command to get help for'
          }
        }
      }
    });

    // Gate help
    this.addHelp('gate', {
      description: 'Quality gate enforcement and validation commands',
      commands: {
        status: {
          syntax: '/gate status [--verbose]',
          description: 'Show quality gate status and compliance',
          examples: [
            '/gate status',
            '/gate status --verbose'
          ],
          flags: { 
            '--verbose': 'Show detailed gate information including reasons for failures'
          }
        },
        validate: {
          syntax: '/gate validate [phase] [--strict]',
          description: 'Validate quality gate requirements',
          examples: [
            '/gate validate',
            '/gate validate implementation --strict',
            '/gate validate testing'
          ],
          arguments: { 
            phase: 'Optional: planning, infrastructure, implementation, testing, polish, completion (default: current)'
          },
          flags: { 
            '--strict': 'Use strict validation mode with enhanced quality checks'
          }
        },
        bypass: {
          syntax: '/gate bypass <gate> <reason> [--emergency]',
          description: 'Emergency quality gate bypass (use with extreme caution)',
          examples: [
            '/gate bypass testing-gate "Critical hotfix deployment"',
            '/gate bypass completion-gate "Security emergency patch" --emergency'
          ],
          arguments: { 
            gate: 'Gate name to bypass (planning-gate, implementation-gate, testing-gate, completion-gate)',
            reason: 'Detailed justification for bypass (required for audit trail)'
          },
          flags: { 
            '--emergency': 'Mark as emergency bypass for high-priority tracking'
          }
        },
        history: {
          syntax: '/gate history [limit]',
          description: 'Show quality gate validation history',
          examples: [
            '/gate history',
            '/gate history 20'
          ],
          arguments: {
            limit: 'Optional: Number of history entries to show (default: 10)'
          }
        },
        enforce: {
          syntax: '/gate enforce <phase> [--strict]',
          description: 'Enforce quality gate validation for specific phase',
          examples: [
            '/gate enforce implementation',
            '/gate enforce testing --strict'
          ],
          arguments: { 
            phase: 'Phase to enforce: planning, infrastructure, implementation, testing, polish, completion'
          },
          flags: { 
            '--strict': 'Use strict enforcement mode'
          }
        },
        report: {
          syntax: '/gate report [--export] [--format=<format>]',
          description: 'Generate comprehensive compliance report',
          examples: [
            '/gate report',
            '/gate report --export --format=json',
            '/gate report --format=markdown'
          ],
          flags: { 
            '--export': 'Export report to file',
            '--format': 'Output format: json, markdown, html, csv (default: json)'
          }
        },
        help: {
          syntax: '/gate help [topic]',
          description: 'Show gate command help',
          examples: [
            '/gate help',
            '/gate help bypass',
            '/gate help validate'
          ],
          arguments: {
            topic: 'Optional: Specific gate command to get help for'
          }
        }
      }
    });

    // Add global help topics
    this.addGlobalHelp();
  }

  addGlobalHelp() {
    this.addHelp('global', {
      description: 'Global command system help and information',
      commands: {
        aliases: {
          syntax: 'Command aliases for convenience',
          description: 'Shortened versions of common commands',
          examples: [
            '/c → /collective',
            '/a → /agent', 
            '/g → /gate',
            '/status → /collective status',
            '/route → /collective route',
            '/spawn → /agent spawn'
          ]
        },
        'natural-language': {
          syntax: 'Natural language command support',
          description: 'Use natural language to execute commands',
          examples: [
            '"show status" → /collective status',
            '"list agents" → /agent list',
            '"validate gates" → /gate validate',
            '"spawn testing agent" → /agent spawn testing',
            '"check system health" → /collective status --verbose'
          ]
        },
        patterns: {
          syntax: 'Common command patterns',
          description: 'Frequently used command combinations',
          examples: [
            'System Health Check: /collective status --verbose',
            'Full Agent Listing: /agent list --detailed', 
            'Complete Validation: /gate validate --strict',
            'Troubleshoot Issues: /collective maintain --repair',
            'Route Complex Task: /collective route "your task description"'
          ]
        }
      }
    });
  }

  addHelp(namespace, helpData) {
    this.helpTopics.set(namespace, helpData);
  }

  getHelp(query = '') {
    if (!query) {
      return this.getGeneralHelp();
    }
    
    const parts = query.split(' ').filter(p => p.length > 0);
    
    if (parts.length === 1) {
      // Namespace help
      return this.getNamespaceHelp(parts[0]);
    } else {
      // Command help
      return this.getCommandHelp(parts[0], parts[1]);
    }
  }

  getGeneralHelp() {
    let help = '# 🎯 Claude Code Sub-Agent Collective - Command System Help\n\n';
    help += 'The collective command system provides natural language and structured command interfaces for controlling the multi-agent orchestration system.\n\n';
    
    help += '## 📚 Available Command Namespaces\n\n';
    
    for (const [namespace, data] of this.helpTopics) {
      if (namespace === 'global') continue; // Handle global separately
      
      help += `### 🔧 /${namespace}\n`;
      help += `${data.description}\n\n`;
      
      const commands = Object.keys(data.commands);
      help += 'Commands: ' + commands.map(c => `\`${c}\``).join(', ') + '\n\n';
    }
    
    help += '## 🗣️ Natural Language Support\n';
    help += 'You can use natural language to execute commands:\n\n';
    help += '- "show me the system status" → `/collective status`\n';
    help += '- "list all available agents" → `/agent list`\n';
    help += '- "validate the quality gates" → `/gate validate`\n';
    help += '- "spawn a testing agent for integration" → `/agent spawn testing integration`\n\n';
    
    help += '## ⚡ Command Aliases\n';
    help += 'Use shortcuts for common commands:\n\n';
    help += '- `/c` → `/collective`\n';
    help += '- `/a` → `/agent`\n';
    help += '- `/g` → `/gate`\n';
    help += '- `/status` → `/collective status`\n';
    help += '- `/route` → `/collective route`\n';
    help += '- `/spawn` → `/agent spawn`\n\n';
    
    help += '## 🚀 Quick Start Examples\n\n';
    help += '```bash\n';
    help += '# Check system status\n';
    help += '/collective status --verbose\n\n';
    help += '# Route a task to the appropriate agent\n';
    help += '/collective route create a user authentication component\n\n';
    help += '# List all available agents\n';
    help += '/agent list --detailed\n\n';
    help += '# Validate quality gates\n';
    help += '/gate validate implementation --strict\n\n';
    help += '# Get help for specific commands\n';
    help += '/collective help route\n';
    help += '/agent help spawn\n';
    help += '/gate help bypass\n';
    help += '```\n\n';
    
    help += '## 📖 Getting More Help\n';
    help += '- Type `/[namespace] help` for namespace-specific help\n';
    help += '- Type `/[namespace] help [command]` for command-specific help\n';
    help += '- Use `--help` flag with any command for inline help\n';
    help += '- All commands support tab completion and suggestions\n\n';
    
    help += '## 🔍 Advanced Features\n';
    help += '- **Command History**: Access recent commands with `/collective history`\n';
    help += '- **Autocomplete**: Tab completion for commands, arguments, and flags\n';
    help += '- **Fuzzy Matching**: Typo-tolerant command suggestions\n';
    help += '- **Context Awareness**: Commands adapt based on system state\n';
    help += '- **Performance Metrics**: All commands include execution timing\n\n';
    
    return help;
  }

  getNamespaceHelp(namespace) {
    const helpData = this.helpTopics.get(namespace);
    
    if (!helpData) {
      const available = Array.from(this.helpTopics.keys()).filter(k => k !== 'global');
      return `❌ Unknown namespace: **${namespace}**\n\n🔍 Available namespaces: ${available.join(', ')}\n\nType \`/help\` for general help.`;
    }
    
    let help = `# 🔧 /${namespace} - ${helpData.description}\n\n`;
    help += '## Available Commands\n\n';
    
    for (const [command, cmdData] of Object.entries(helpData.commands)) {
      help += `### 📋 ${command}\n`;
      help += `**Syntax:** \`${cmdData.syntax}\`\n\n`;
      help += `**Description:** ${cmdData.description}\n\n`;
      
      if (cmdData.arguments && Object.keys(cmdData.arguments).length > 0) {
        help += '**Arguments:**\n';
        for (const [arg, desc] of Object.entries(cmdData.arguments)) {
          help += `- \`${arg}\`: ${desc}\n`;
        }
        help += '\n';
      }
      
      if (cmdData.flags && Object.keys(cmdData.flags).length > 0) {
        help += '**Flags:**\n';
        for (const [flag, desc] of Object.entries(cmdData.flags)) {
          help += `- \`${flag}\`: ${desc}\n`;
        }
        help += '\n';
      }
      
      if (cmdData.examples && cmdData.examples.length > 0) {
        help += '**Examples:**\n';
        help += '```bash\n';
        cmdData.examples.forEach(ex => {
          help += `${ex}\n`;
        });
        help += '```\n';
      }
      
      help += '---\n\n';
    }
    
    help += `## 💡 Quick Tips for /${namespace}\n\n`;
    if (namespace === 'collective') {
      help += '- Use `/collective status` regularly to monitor system health\n';
      help += '- Route complex tasks with `/collective route` for optimal agent selection\n';
      help += '- Check `/collective metrics` to validate research hypotheses\n';
    } else if (namespace === 'agent') {
      help += '- Use `/agent list --detailed` to understand available capabilities\n';
      help += '- Spawn specialized agents with `/agent spawn [type] [specialization]`\n';
      help += '- Monitor agent health with `/agent health` for optimal performance\n';
    } else if (namespace === 'gate') {
      help += '- Run `/gate status` before major operations\n';
      help += '- Use `--strict` mode for production deployments\n';
      help += '- Document all bypasses with clear reasons for audit trails\n';
    }
    
    help += `\n📚 For command-specific help, use: \`/${namespace} help [command]\`\n`;
    
    return help;
  }

  getCommandHelp(namespace, command) {
    const helpData = this.helpTopics.get(namespace);
    
    if (!helpData) {
      return `❌ Unknown namespace: **${namespace}**`;
    }
    
    const cmdData = helpData.commands[command];
    
    if (!cmdData) {
      const available = Object.keys(helpData.commands);
      return `❌ Unknown command: **/${namespace} ${command}**\n\n🔍 Available commands: ${available.join(', ')}\n\nType \`/${namespace} help\` for namespace help.`;
    }
    
    let help = `# 📋 /${namespace} ${command}\n\n`;
    help += `**Description:** ${cmdData.description}\n\n`;
    help += `**Syntax:** \`${cmdData.syntax}\`\n\n`;
    
    if (cmdData.arguments && Object.keys(cmdData.arguments).length > 0) {
      help += '## 📝 Arguments\n\n';
      for (const [arg, desc] of Object.entries(cmdData.arguments)) {
        help += `**\`${arg}\`**  \n${desc}\n\n`;
      }
    }
    
    if (cmdData.flags && Object.keys(cmdData.flags).length > 0) {
      help += '## 🏃 Flags\n\n';
      for (const [flag, desc] of Object.entries(cmdData.flags)) {
        help += `**\`${flag}\`**  \n${desc}\n\n`;
      }
    }
    
    if (cmdData.examples && cmdData.examples.length > 0) {
      help += '## 🚀 Examples\n\n';
      help += '```bash\n';
      cmdData.examples.forEach((ex, index) => {
        help += `# Example ${index + 1}\n${ex}\n\n`;
      });
      help += '```\n\n';
    }
    
    // Add related commands
    const relatedCommands = this.getRelatedCommands(namespace, command);
    if (relatedCommands.length > 0) {
      help += '## 🔗 Related Commands\n\n';
      relatedCommands.forEach(related => {
        help += `- \`/${namespace} ${related}\`\n`;
      });
      help += '\n';
    }
    
    // Add troubleshooting tips
    const troubleshooting = this.getTroubleshootingTips(namespace, command);
    if (troubleshooting.length > 0) {
      help += '## 🔧 Troubleshooting\n\n';
      troubleshooting.forEach(tip => {
        help += `💡 **${tip.issue}**  \n${tip.solution}\n\n`;
      });
    }
    
    help += `---\n\n📚 For more help: \`/${namespace} help\` | \`/help\`\n`;
    
    return help;
  }

  getRelatedCommands(namespace, command) {
    const relations = {
      'collective': {
        'status': ['agents', 'metrics'],
        'route': ['coordinate'],
        'agents': ['status'],
        'metrics': ['status', 'research'],
        'validate': ['test', 'maintain'],
        'test': ['validate'],
        'research': ['metrics'],
        'coordinate': ['route'],
        'maintain': ['validate', 'status']
      },
      'agent': {
        'list': ['status', 'health'],
        'spawn': ['list', 'status'],
        'status': ['list', 'health', 'metrics'],
        'health': ['status', 'metrics'],
        'handoff': ['status', 'test'],
        'metrics': ['status', 'health'],
        'test': ['handoff', 'status'],
        'kill': ['list', 'status']
      },
      'gate': {
        'status': ['validate', 'history'],
        'validate': ['status', 'enforce'],
        'enforce': ['validate', 'status'],
        'report': ['status', 'history'],
        'history': ['status', 'report'],
        'bypass': ['status', 'validate']
      }
    };
    
    return relations[namespace]?.[command] || [];
  }

  getTroubleshootingTips(namespace, command) {
    const tips = {
      'collective:route': [
        {
          issue: 'Agent not found for request',
          solution: 'Check available agents with `/agent list` and ensure your request matches agent capabilities'
        },
        {
          issue: 'Routing takes too long',
          solution: 'Use `--skip-test` flag to bypass validation tests for faster routing'
        }
      ],
      'collective:status': [
        {
          issue: 'Status shows system issues',
          solution: 'Run `/collective maintain --repair` to attempt automatic fixes, or check individual components'
        }
      ],
      'agent:spawn': [
        {
          issue: 'Agent spawn fails',
          solution: 'Verify agent type is correct and check system resources with `/collective status`'
        },
        {
          issue: 'Template not found',
          solution: 'Use default template or check available templates in agent configuration'
        }
      ],
      'gate:bypass': [
        {
          issue: 'Bypass not allowed',
          solution: 'Ensure you have proper permissions and provide a detailed reason for the bypass'
        },
        {
          issue: 'Audit trail required',
          solution: 'All bypasses are logged. Use `--emergency` flag only for critical situations'
        }
      ]
    };
    
    return tips[`${namespace}:${command}`] || [];
  }

  // Interactive help features
  getInteractiveHelp(userInput, context = {}) {
    // Analyze user input for help intent
    const helpIntent = this.analyzeHelpIntent(userInput);
    
    if (helpIntent.isHelpRequest) {
      return this.getContextualHelp(helpIntent, context);
    }
    
    return null;
  }

  analyzeHelpIntent(input) {
    const helpKeywords = ['help', 'how', 'what', 'guide', 'explain', 'show me'];
    const hasHelpKeyword = helpKeywords.some(keyword => 
      input.toLowerCase().includes(keyword)
    );
    
    if (!hasHelpKeyword) {
      return { isHelpRequest: false };
    }
    
    // Extract command mentions
    const commandMentions = [];
    const commandPattern = /\/(\w+)(?:\s+(\w+))?/g;
    let match;
    while ((match = commandPattern.exec(input)) !== null) {
      commandMentions.push({
        namespace: match[1],
        command: match[2]
      });
    }
    
    return {
      isHelpRequest: true,
      commandMentions,
      originalInput: input
    };
  }

  getContextualHelp(helpIntent, context) {
    if (helpIntent.commandMentions.length > 0) {
      const mention = helpIntent.commandMentions[0];
      if (mention.command) {
        return this.getCommandHelp(mention.namespace, mention.command);
      } else {
        return this.getNamespaceHelp(mention.namespace);
      }
    }
    
    // Generic contextual help based on system state
    let help = "🤖 **Contextual Help**\n\n";
    
    if (context.recentErrors && context.recentErrors.length > 0) {
      help += "⚠️ **Recent Issues Detected**\n";
      help += "You might want to try:\n";
      help += "- `/collective status --verbose` - Check system health\n";
      help += "- `/collective maintain --repair` - Fix common issues\n";
      help += "- `/gate status` - Check quality gate compliance\n\n";
    }
    
    if (context.systemState?.newUser) {
      help += "🌟 **Getting Started**\n";
      help += "Try these essential commands:\n";
      help += "- `/collective status` - See system overview\n";
      help += "- `/agent list` - View available agents\n";
      help += "- `/collective route \"your task here\"` - Route tasks to agents\n\n";
    }
    
    help += "💡 **Quick Tips**\n";
    help += "- Use tab completion for command suggestions\n";
    help += "- Type commands in natural language (e.g., \"show status\")\n";
    help += "- Add `--help` to any command for specific help\n";
    help += "- Use `/help` for comprehensive documentation\n";
    
    return help;
  }

  // Method to get help for error scenarios
  getErrorHelp(error, command) {
    let help = `❌ **Command Error Help**\n\n`;
    help += `**Error:** ${error}\n`;
    help += `**Command:** ${command}\n\n`;
    
    if (error.includes('Unknown command')) {
      help += "💡 **Suggestion:** Check command spelling or try:\n";
      help += "- `/help` - See all available commands\n";
      help += "- Use tab completion for suggestions\n";
      help += "- Try natural language (e.g., \"show status\")\n";
    } else if (error.includes('required')) {
      help += "💡 **Suggestion:** This command needs arguments:\n";
      help += `- Try \`${command} --help\` for syntax help\n`;
      help += "- Check the examples in the help documentation\n";
    } else if (error.includes('Invalid command format')) {
      help += "💡 **Suggestion:** Command format issues:\n";
      help += "- Commands start with `/` (e.g., `/collective status`)\n";
      help += "- Use spaces between namespace and command\n";
      help += "- Try natural language if structured commands are unclear\n";
    }
    
    return help;
  }
}

module.exports = CommandHelpSystem;