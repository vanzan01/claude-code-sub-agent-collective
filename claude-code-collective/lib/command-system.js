const CollectiveCommandParser = require('./command-parser');
const CommandAutocomplete = require('./command-autocomplete');
const CommandHistoryManager = require('./command-history');
const CommandHelpSystem = require('./command-help');
const EventEmitter = require('events');
const path = require('path');

class CommandSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      historyFile: options.historyFile || path.join(process.cwd(), '.claude-collective', 'command-history.json'),
      maxHistorySize: options.maxHistorySize || 1000,
      enableMetrics: options.enableMetrics !== false,
      enableAutocomplete: options.enableAutocomplete !== false,
      performanceThreshold: options.performanceThreshold || 100, // ms
      ...options
    };
    
    // Initialize components
    this.parser = new CollectiveCommandParser();
    this.history = new CommandHistoryManager(this.options.historyFile);
    this.autocomplete = new CommandAutocomplete(this.parser);
    this.help = new CommandHelpSystem();
    
    // Performance tracking
    this.metrics = {
      totalCommands: 0,
      successfulCommands: 0,
      failedCommands: 0,
      averageExecutionTime: 0,
      slowCommands: []
    };
    
    this.setupEventListeners();
    
    // System initialized
  }

  setupEventListeners() {
    // Listen to system events only - metrics handled directly in executeCommand
    this.on('system:ready', () => {
      // System ready
    });
  }

  async executeCommand(input, context = {}) {
    const startTime = Date.now();
    
    try {
      // Validate input
      if (typeof input !== 'string') {
        throw new Error('Invalid command input');
      }
      
      const trimmedInput = input.trim();
      if (!trimmedInput) {
        throw new Error('Empty command');
      }
      
      // Executing command
      
      // Parse and execute command
      const result = await this.parser.parse(trimmedInput);
      const executionTime = Math.max(1, Date.now() - startTime); // Ensure at least 1ms
      
      // Add to history
      await this.history.addCommand(trimmedInput, result, executionTime);
      
      // Update metrics
      this.updateCommandMetrics(result, executionTime);
      
      // Check performance
      if (executionTime > this.options.performanceThreshold) {
        console.warn(`⚠️ Slow command execution: ${executionTime}ms for "${trimmedInput}"`);
        this.metrics.slowCommands.push({
          command: trimmedInput,
          executionTime,
          timestamp: new Date().toISOString()
        });
      }
      
      // Emit success event
      this.emit('command:completed', {
        input: trimmedInput,
        result,
        executionTime,
        context
      });
      
      return {
        ...result,
        executionTime,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      const executionTime = Math.max(1, Date.now() - startTime); // Ensure at least 1ms
      
      console.error(`❌ Command execution failed: ${error.message}`);
      
      const errorResult = {
        success: false,
        error: error.message,
        executionTime,
        timestamp: new Date().toISOString()
      };
      
      // Add error to history
      await this.history.addCommand(input, errorResult, executionTime);
      
      // Emit error event
      this.emit('command:error', {
        input,
        error: error.message,
        executionTime,
        context
      });
      
      return errorResult;
    }
  }

  // Autocomplete functionality
  getSuggestions(partial, context = {}) {
    if (!this.options.enableAutocomplete) {
      return [];
    }
    
    // Add recent command history to context
    const enhancedContext = {
      ...context,
      recentCommands: this.history.getRecentCommands(5),
      systemState: this.getSystemState()
    };
    
    return this.autocomplete.getSuggestions(partial, enhancedContext);
  }

  // Help system integration
  getHelp(query = '') {
    return this.help.getHelp(query);
  }
  
  getInteractiveHelp(userInput, context = {}) {
    return this.help.getInteractiveHelp(userInput, context);
  }
  
  getErrorHelp(error, command) {
    return this.help.getErrorHelp(error, command);
  }

  // History management
  getCommandHistory(limit = 10, filter = {}) {
    return this.history.getHistory(limit, filter);
  }
  
  searchHistory(query, limit = 10) {
    return this.history.searchHistory(query, limit);
  }
  
  getHistoryStatistics() {
    return this.history.getStatistics();
  }

  // System state and metrics
  getSystemState() {
    return {
      totalCommands: this.metrics.totalCommands,
      successRate: this.getSuccessRate(),
      averageExecutionTime: this.metrics.averageExecutionTime,
      hasRecentErrors: this.hasRecentErrors(),
      hasSlowCommands: this.metrics.slowCommands.length > 0
    };
  }
  
  getMetrics() {
    const historyStats = this.history.getStatistics();
    
    return {
      system: this.metrics,
      history: historyStats,
      performance: {
        averageExecutionTime: this.metrics.averageExecutionTime,
        slowCommandsCount: this.metrics.slowCommands.length,
        performanceThreshold: this.options.performanceThreshold
      },
      usage: {
        totalCommands: this.metrics.totalCommands,
        successRate: this.getSuccessRate(),
        naturalLanguageUsage: historyStats.naturalLanguageUsageRate
      }
    };
  }

  // Utility methods
  updateCommandMetrics(result, executionTime) {
    this.metrics.totalCommands++;
    
    if (result.success) {
      this.metrics.successfulCommands++;
    } else {
      this.metrics.failedCommands++;
    }
    
    // Update average execution time
    const totalTime = this.metrics.averageExecutionTime * (this.metrics.totalCommands - 1) + executionTime;
    this.metrics.averageExecutionTime = Math.round(totalTime / this.metrics.totalCommands);
  }
  
  // Event-based metrics removed - using direct metrics in executeCommand
  
  getSuccessRate() {
    if (this.metrics.totalCommands === 0) return 1;
    return this.metrics.successfulCommands / this.metrics.totalCommands;
  }
  
  hasRecentErrors() {
    const recentHistory = this.history.getHistory(5);
    return recentHistory.some(entry => !entry.result.success);
  }

  // Command validation
  validateCommand(input) {
    if (!input || typeof input !== 'string') {
      return { valid: false, error: 'Command must be a non-empty string' };
    }
    
    const trimmed = input.trim();
    if (!trimmed) {
      return { valid: false, error: 'Command cannot be empty' };
    }
    
    // Check for potentially dangerous commands (basic security)
    const dangerousPatterns = [
      /rm\s+-rf/,
      /sudo\s+rm/,
      /\.\.\/\.\.\//,
      /system\(\"/,
      /exec\(/
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(trimmed)) {
        return { valid: false, error: 'Potentially dangerous command detected' };
      }
    }
    
    return { valid: true };
  }

  // Command preprocessing
  preprocessCommand(input) {
    // Normalize whitespace
    let processed = input.trim().replace(/\s+/g, ' ');
    
    // Handle common typos and variations
    const corrections = {
      '/collecitve': '/collective',
      '/agnet': '/agent',
      '/gaet': '/gate',
      'stauts': 'status',
      'lsit': 'list'
    };
    
    for (const [typo, correction] of Object.entries(corrections)) {
      processed = processed.replace(new RegExp(typo, 'gi'), correction);
    }
    
    return processed;
  }

  // Batch command execution
  async executeBatch(commands, options = {}) {
    const results = [];
    const { continueOnError = false, maxConcurrency = 1 } = options;
    
    if (maxConcurrency === 1) {
      // Sequential execution
      for (const command of commands) {
        try {
          const result = await this.executeCommand(command);
          results.push(result);
          
          if (!result.success && !continueOnError) {
            break;
          }
        } catch (error) {
          results.push({ success: false, error: error.message, command });
          if (!continueOnError) {
            break;
          }
        }
      }
    } else {
      // Parallel execution (limited concurrency)
      const chunks = this.chunkArray(commands, maxConcurrency);
      
      for (const chunk of chunks) {
        const chunkResults = await Promise.allSettled(
          chunk.map(command => this.executeCommand(command))
        );
        
        for (const result of chunkResults) {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            results.push({ success: false, error: result.reason.message });
          }
        }
      }
    }
    
    return {
      total: commands.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }
  
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Export functionality
  async exportData(format = 'json', options = {}) {
    const data = {
      timestamp: new Date().toISOString(),
      metrics: this.getMetrics(),
      history: this.getCommandHistory(options.historyLimit || 100),
      systemState: this.getSystemState()
    };
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      // CSV export focusing on command history
      return this.history.exportHistory('csv');
    } else if (format === 'markdown') {
      let md = '# Command System Export\n\n';
      md += `**Generated:** ${data.timestamp}\n\n`;
      
      md += '## System Metrics\n';
      md += `- Total Commands: ${data.metrics.system.totalCommands}\n`;
      md += `- Success Rate: ${(data.metrics.usage.successRate * 100).toFixed(1)}%\n`;
      md += `- Average Execution Time: ${data.metrics.system.averageExecutionTime}ms\n`;
      md += `- Natural Language Usage: ${(data.metrics.usage.naturalLanguageUsage * 100).toFixed(1)}%\n\n`;
      
      md += '## Recent Commands\n\n';
      data.history.forEach((entry, index) => {
        const status = entry.result.success ? '✅' : '❌';
        md += `${index + 1}. ${status} \`${entry.command}\`\n`;
      });
      
      return md;
    }
    
    throw new Error(`Unsupported export format: ${format}`);
  }

  // System maintenance
  async performMaintenance() {
    // Performing system maintenance
    
    // Clean old history
    const removedEntries = await this.history.clearOldHistory(30);
    // Removed old history entries
    
    // Clear caches
    this.autocomplete.clearCache();
    // Cleared autocomplete cache
    
    // Reset slow commands tracking if too many accumulated
    if (this.metrics.slowCommands.length > 100) {
      this.metrics.slowCommands = this.metrics.slowCommands.slice(-20);
      // Trimmed slow commands tracking
    }
    
    // Emit maintenance complete event
    this.emit('maintenance:complete', {
      removedHistoryEntries: removedEntries,
      timestamp: new Date().toISOString()
    });
    
    // Command system maintenance complete
  }

  // Graceful shutdown
  async shutdown() {
    // Shutting down command system
    
    // Save any pending history
    await this.history.saveHistory();
    
    // Clear autocomplete cache and timers
    this.autocomplete.clearCache();
    
    // Clear all listeners
    this.removeAllListeners();
    
    // Command system shutdown complete
  }
}

module.exports = CommandSystem;