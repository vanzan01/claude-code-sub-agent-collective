const CommandSystem = require('../lib/command-system');
const CollectiveCommandParser = require('../lib/command-parser');
const CommandAutocomplete = require('../lib/command-autocomplete');
const CommandHistoryManager = require('../lib/command-history');
const CommandHelpSystem = require('../lib/command-help');
const fs = require('fs-extra');
const path = require('path');

describe('Phase 5 - Command System Implementation', () => {
  let commandSystem;
  let tempDir;

  beforeEach(async () => {
    // Create temporary directory for test history
    tempDir = path.join(__dirname, 'temp', `test-${Date.now()}`);
    await fs.ensureDir(tempDir);
    
    commandSystem = new CommandSystem({
      historyFile: path.join(tempDir, 'test-history.json'),
      enableMetrics: true,
      enableAutocomplete: true
    });
  });

  afterEach(async () => {
    // Clean up
    if (commandSystem) {
      await commandSystem.shutdown();
    }
    if (tempDir && await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  describe('CollectiveCommandParser', () => {
    let parser;

    beforeEach(() => {
      parser = new CollectiveCommandParser();
    });

    test('should parse basic collective commands', async () => {
      const result = await parser.parse('/collective status');
      
      expect(result.success).toBe(true);
      expect(result.namespace).toBe('collective');
      expect(result.command).toBe('status');
      expect(result.result.action).toBe('status');
    });

    test('should parse agent commands with arguments', async () => {
      const result = await parser.parse('/agent spawn testing integration');
      
      expect(result.success).toBe(true);
      expect(result.namespace).toBe('agent');
      expect(result.command).toBe('spawn');
      expect(result.result.action).toBe('spawn');
      expect(result.result.type).toBe('testing');
      expect(result.result.specialization).toBe('integration');
    });

    test('should parse gate commands with flags', async () => {
      const result = await parser.parse('/gate validate implementation --strict');
      
      expect(result.success).toBe(true);
      expect(result.namespace).toBe('gate');
      expect(result.command).toBe('validate');
      expect(result.result.strict).toBe(true);
    });

    test('should reject natural language commands', async () => {
      const testCases = [
        'show status',
        'list agents', 
        'validate gates',
        'spawn testing agent'
      ];

      for (const input of testCases) {
        const result = await parser.parse(input);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid command format');
      }
    });

    test('should handle command aliases', async () => {
      const testCases = [
        '/c status',
        '/a list', 
        '/g validate',
        '/status',
        '/route test task'
      ];

      for (const command of testCases) {
        const result = await parser.parse(command);
        expect(result.success).toBe(true);
      }
    });

    test('should provide suggestions for invalid commands', async () => {
      const result = await parser.parse('/collective stauts'); // typo
      
      expect(result.success).toBe(false);
      expect(result.suggestion).toContain('Did you mean');
    });

    test('should handle complex command arguments', async () => {
      const result = await parser.parse('/collective route "create a user authentication component with validation"');
      
      expect(result.success).toBe(true);
      expect(result.result.request).toContain('authentication component');
    });
  });

  describe('CommandAutocomplete', () => {
    let parser;
    let autocomplete;

    beforeEach(() => {
      parser = new CollectiveCommandParser();
      autocomplete = new CommandAutocomplete(parser);
    });

    afterEach(() => {
      if (autocomplete) {
        autocomplete.clearCache();
      }
    });

    test('should provide namespace suggestions', () => {
      const suggestions = autocomplete.getSuggestions('/col');
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].text).toBe('/collective ');
      expect(suggestions[0].type).toBe('namespace');
    });

    test('should provide command suggestions', () => {
      const suggestions = autocomplete.getSuggestions('/collective st');
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.text.includes('status'))).toBe(true);
    });

    test('should provide argument suggestions', () => {
      const suggestions = autocomplete.getSuggestions('/agent spawn test');
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.text === 'testing')).toBe(true);
    });

    test('should provide natural language suggestions', () => {
      const suggestions = autocomplete.getSuggestions('show stat');
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.type === 'natural')).toBe(true);
    });

    test('should provide flag suggestions', () => {
      const suggestions = autocomplete.getSuggestions('/collective status --verb');
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.text === '--verbose')).toBe(true);
    });

    test('should rank suggestions by relevance', () => {
      const suggestions = autocomplete.getSuggestions('/agent');
      
      expect(suggestions).toBeTruthy();
      expect(suggestions[0].priority).toBeGreaterThanOrEqual(suggestions[1]?.priority || 0);
    });
  });

  describe('CommandHistoryManager', () => {
    let history;
    let tempHistoryFile;

    beforeEach(async () => {
      tempHistoryFile = path.join(tempDir, 'history.json');
      history = new CommandHistoryManager(tempHistoryFile);
    });

    test('should add commands to history', async () => {
      const command = '/collective status';
      const result = { success: true, namespace: 'collective', command: 'status' };
      
      await history.addCommand(command, result, 150);
      
      const historyEntries = history.getHistory(5);
      expect(historyEntries.length).toBe(1);
      expect(historyEntries[0].command).toBe(command);
      expect(historyEntries[0].metadata.executionTime).toBe(150);
    });

    test('should search command history', async () => {
      await history.addCommand('/collective status', { success: true }, 100);
      await history.addCommand('/agent list', { success: true }, 80);
      await history.addCommand('/gate validate', { success: true }, 200);
      
      const results = history.searchHistory('status');
      expect(results.length).toBe(1);
      expect(results[0].command).toBe('/collective status');
    });

    test('should generate statistics', async () => {
      await history.addCommand('/collective status', { success: true }, 100);
      await history.addCommand('/agent list', { success: false, error: 'Test error' }, 80);
      await history.addCommand('/collective status', { success: true }, 120);
      
      const stats = history.getStatistics();
      expect(stats.total).toBe(3);
      expect(stats.successful).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.successRate).toBeCloseTo(0.67, 1);
    });

    test('should export history in different formats', async () => {
      await history.addCommand('/collective status', { success: true }, 100);
      
      const jsonExport = history.exportHistory('json');
      expect(jsonExport).toContain('collective status');
      expect(() => JSON.parse(jsonExport)).not.toThrow();
      
      const csvExport = history.exportHistory('csv');
      expect(csvExport).toContain('Timestamp,Command');
      expect(csvExport).toContain('collective status');
      
      const mdExport = history.exportHistory('markdown');
      expect(mdExport).toContain('# Command History Export');
      expect(mdExport).toContain('collective status');
    });

    test('should persist history to disk', async () => {
      await history.addCommand('/collective status', { success: true }, 100);
      await history.saveHistory();
      
      expect(await fs.pathExists(tempHistoryFile)).toBe(true);
      
      const savedData = await fs.readJson(tempHistoryFile);
      expect(savedData.history.length).toBe(1);
      expect(savedData.history[0].command).toBe('/collective status');
    });
  });

  describe('CommandHelpSystem', () => {
    let help;

    beforeEach(() => {
      help = new CommandHelpSystem();
    });

    test('should provide general help', () => {
      const generalHelp = help.getHelp();
      
      expect(generalHelp).toContain('Claude Code Sub-Agent Collective');
      expect(generalHelp).toContain('/collective');
      expect(generalHelp).toContain('/agent');
      expect(generalHelp).toContain('/gate');
    });

    test('should provide namespace-specific help', () => {
      const collectiveHelp = help.getHelp('collective');
      
      expect(collectiveHelp).toContain('/collective');
      expect(collectiveHelp).toContain('status');
      expect(collectiveHelp).toContain('route');
      expect(collectiveHelp).toContain('agents');
    });

    test('should provide command-specific help', () => {
      const commandHelp = help.getHelp('collective route');
      
      expect(commandHelp).toContain('/collective route');
      expect(commandHelp).toContain('Route request to appropriate agent');
      expect(commandHelp).toContain('Examples');
    });

    test('should handle unknown namespaces', () => {
      const unknownHelp = help.getHelp('unknown');
      
      expect(unknownHelp).toContain('Unknown namespace');
      expect(unknownHelp).toContain('Available namespaces');
    });

    test('should handle unknown commands', () => {
      const unknownCommand = help.getHelp('collective unknown');
      
      expect(unknownCommand).toContain('Unknown command');
      expect(unknownCommand).toContain('Available commands');
    });

    test('should provide interactive help', () => {
      const interactiveHelp = help.getInteractiveHelp('how do I use /collective route');
      
      expect(interactiveHelp).toContain('/collective route');
      expect(interactiveHelp).toBeTruthy();
    });

    test('should provide error-specific help', () => {
      const errorHelp = help.getErrorHelp('Unknown command: /collective stauts', '/collective stauts');
      
      expect(errorHelp).toContain('Command Error Help');
      expect(errorHelp).toContain('Unknown command');
      expect(errorHelp).toContain('Suggestion');
    });
  });

  describe('CommandSystem Integration', () => {
    test('should execute commands successfully', async () => {
      const result = await commandSystem.executeCommand('/collective status');
      
      expect(result.success).toBe(true);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.timestamp).toBeTruthy();
    });

    test('should reject natural language commands', async () => {
      const result = await commandSystem.executeCommand('show system status');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid command format');
    });

    test('should provide autocomplete suggestions', () => {
      const suggestions = commandSystem.getSuggestions('/coll');
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].text).toContain('/collective');
    });

    test('should maintain command history', async () => {
      await commandSystem.executeCommand('/collective status');
      await commandSystem.executeCommand('/agent list');
      
      const history = commandSystem.getCommandHistory(5);
      expect(history.length).toBe(2);
      expect(history[0].command).toBe('/agent list');
      expect(history[1].command).toBe('/collective status');
    });

    test('should track performance metrics', async () => {
      await commandSystem.executeCommand('/collective status');
      await commandSystem.executeCommand('/agent list');
      
      const metrics = commandSystem.getMetrics();
      expect(metrics.system.totalCommands).toBe(2);
      expect(metrics.system.successfulCommands).toBe(2);
      expect(metrics.usage.successRate).toBe(1);
    });

    test('should handle command validation', () => {
      expect(commandSystem.validateCommand('').valid).toBe(false);
      expect(commandSystem.validateCommand(null).valid).toBe(false);
      expect(commandSystem.validateCommand('/collective status').valid).toBe(true);
    });

    test('should preprocess commands', () => {
      expect(commandSystem.preprocessCommand('  /collective   status  ')).toBe('/collective status');
      expect(commandSystem.preprocessCommand('/collecitve status')).toBe('/collective status');
    });

    test('should execute batch commands', async () => {
      const commands = ['/collective status', '/agent list', '/gate status'];
      const results = await commandSystem.executeBatch(commands);
      
      expect(results.total).toBe(3);
      expect(results.successful).toBe(3);
      expect(results.failed).toBe(0);
      expect(results.results.length).toBe(3);
    });

    test('should export system data', async () => {
      await commandSystem.executeCommand('/collective status');
      
      const jsonExport = await commandSystem.exportData('json');
      expect(jsonExport).toContain('timestamp');
      expect(jsonExport).toContain('metrics');
      expect(() => JSON.parse(jsonExport)).not.toThrow();
      
      const mdExport = await commandSystem.exportData('markdown');
      expect(mdExport).toContain('# Command System Export');
      expect(mdExport).toContain('System Metrics');
    });

    test('should perform system maintenance', async () => {
      const maintenancePromise = new Promise((resolve) => {
        commandSystem.once('maintenance:complete', resolve);
      });
      
      await commandSystem.performMaintenance();
      
      const event = await maintenancePromise;
      expect(event.timestamp).toBeTruthy();
    });

    test('should handle errors gracefully', async () => {
      const result = await commandSystem.executeCommand('/invalid command format');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
      expect(result.executionTime).toBeGreaterThan(0);
    });

    test('should measure performance', async () => {
      const startTime = Date.now();
      const result = await commandSystem.executeCommand('/collective status');
      const endTime = Date.now();
      
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.executionTime).toBeLessThanOrEqual(Math.max(1, endTime - startTime));
    });
  });

  describe('Command System Edge Cases', () => {
    test('should handle empty commands', async () => {
      // Mock console.error to verify it's called but not display the message
      const originalConsoleError = console.error;
      const errorMessages = [];
      console.error = (...args) => {
        errorMessages.push(args.join(' '));
      };

      const result = await commandSystem.executeCommand('');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Empty command');
      
      // Verify error was logged
      expect(errorMessages.length).toBe(1);
      expect(errorMessages[0]).toContain('Command execution failed: Empty command');

      // Restore console.error
      console.error = originalConsoleError;
    });

    test('should handle very long commands', async () => {
      const longCommand = '/collective route ' + 'a'.repeat(1000);
      const result = await commandSystem.executeCommand(longCommand);
      expect(result.success).toBe(true);
    });

    test('should handle special characters', async () => {
      const result = await commandSystem.executeCommand('/collective route "test with special chars: !@#$%^&*()"');
      expect(result.success).toBe(true);
    });

    test('should handle concurrent commands', async () => {
      const promises = [
        commandSystem.executeCommand('/collective status'),
        commandSystem.executeCommand('/agent list'),
        commandSystem.executeCommand('/gate status')
      ];
      
      const results = await Promise.all(promises);
      expect(results.every(r => r.success)).toBe(true);
    });

    test('should handle command with quotes', async () => {
      const result = await commandSystem.executeCommand('/gate bypass testing-gate "Emergency deployment for critical bug fix"');
      expect(result.success).toBe(true);
      expect(result.result.reason).toBe('Emergency deployment for critical bug fix');
    });
  });

  describe('Performance Requirements', () => {
    test('should execute simple commands under 100ms', async () => {
      const result = await commandSystem.executeCommand('/collective status');
      expect(result.executionTime).toBeLessThan(100);
    });

    test('should handle autocomplete under 50ms', () => {
      const start = Date.now();
      commandSystem.getSuggestions('/collective st');
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(50);
    });

    test('should maintain performance with large history', async () => {
      // Add many commands to history
      for (let i = 0; i < 100; i++) {
        await commandSystem.executeCommand('/collective status');
      }
      
      const start = Date.now();
      const result = await commandSystem.executeCommand('/collective status');
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Natural Language Processing', () => {
    test('should reject natural language commands', async () => {
      const queries = [
        'show me the status',
        'what is the system status',
        'how is everything',
        'check system health',
        'display current state'
      ];

      for (const query of queries) {
        const result = await commandSystem.executeCommand(query);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid command format');
      }
    });

    test('should suggest proper command format', async () => {
      const result = await commandSystem.executeCommand('show status');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Commands must start with /');
    });
  });
});

// Test coverage and validation
describe('Phase 5 Validation Criteria', () => {
  test('should meet all Phase 5 requirements', () => {
    // Command System Success
    expect(CollectiveCommandParser).toBeDefined();
    expect(CommandAutocomplete).toBeDefined();
    expect(CommandHistoryManager).toBeDefined();
    expect(CommandHelpSystem).toBeDefined();
    expect(CommandSystem).toBeDefined();
    
    // User Experience
    const parser = new CollectiveCommandParser();
    expect(parser.parseNaturalLanguage).toBeDefined();
    expect(parser.getSuggestion).toBeDefined();
    
    // Integration Success
    const commandSystem = new CommandSystem();
    expect(commandSystem.executeCommand).toBeDefined();
    expect(commandSystem.getSuggestions).toBeDefined();
    expect(commandSystem.getHelp).toBeDefined();
  });

  test('should support all required command namespaces', () => {
    const parser = new CollectiveCommandParser();
    
    // Collective commands
    expect(parser.commands.has('collective:status')).toBe(true);
    expect(parser.commands.has('collective:route')).toBe(true);
    expect(parser.commands.has('collective:agents')).toBe(true);
    expect(parser.commands.has('collective:metrics')).toBe(true);
    expect(parser.commands.has('collective:validate')).toBe(true);
    
    // Agent commands
    expect(parser.commands.has('agent:list')).toBe(true);
    expect(parser.commands.has('agent:spawn')).toBe(true);
    expect(parser.commands.has('agent:status')).toBe(true);
    expect(parser.commands.has('agent:route')).toBe(true);
    
    // Gate commands
    expect(parser.commands.has('gate:status')).toBe(true);
    expect(parser.commands.has('gate:validate')).toBe(true);
    expect(parser.commands.has('gate:bypass')).toBe(true);
    expect(parser.commands.has('gate:history')).toBe(true);
  });

  test('should support required aliases', () => {
    const parser = new CollectiveCommandParser();
    
    expect(parser.aliases.has('/c')).toBe(true);
    expect(parser.aliases.has('/a')).toBe(true);
    expect(parser.aliases.has('/g')).toBe(true);
    expect(parser.aliases.has('/status')).toBe(true);
    expect(parser.aliases.has('/route')).toBe(true);
    expect(parser.aliases.has('/spawn')).toBe(true);
  });
});