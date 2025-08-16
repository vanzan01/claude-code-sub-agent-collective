const fs = require('fs-extra');
const path = require('path');

class CommandHistoryManager {
  constructor(historyFile) {
    this.historyFile = historyFile || path.join(process.cwd(), '.claude-collective', 'command-history.json');
    this.history = [];
    this.maxHistory = 1000;
    this.sessionHistory = [];
    this.sessionId = this.generateSessionId();
    
    this.loadHistory();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async loadHistory() {
    try {
      if (await fs.pathExists(this.historyFile)) {
        const data = await fs.readJson(this.historyFile);
        this.history = Array.isArray(data) ? data : (data.history || []);
        // History loaded successfully
      }
    } catch (error) {
      console.error('Failed to load command history:', error.message);
      this.history = [];
    }
  }

  async saveHistory() {
    try {
      await fs.ensureDir(path.dirname(this.historyFile));
      const historyData = {
        version: '1.0',
        lastUpdated: new Date().toISOString(),
        sessionId: this.sessionId,
        history: this.history
      };
      await fs.writeJson(this.historyFile, historyData, { spaces: 2 });
    } catch (error) {
      console.error('Failed to save command history:', error.message);
    }
  }

  async addCommand(command, result, executionTime = 0) {
    const entry = {
      id: this.generateEntryId(),
      command: command.trim(),
      result: {
        success: result.success,
        namespace: result.namespace,
        command: result.command || result.action,
        error: result.error,
        output: result.output
      },
      metadata: {
        timestamp: new Date().toISOString(),
        session: this.sessionId,
        executionTime,
        originalInput: result.originalInput,
        processedInput: result.processedInput,
        naturalLanguageAttempt: result.naturalLanguageAttempt || false
      }
    };
    
    // Add to both histories
    this.history.unshift(entry);
    this.sessionHistory.unshift(entry);
    
    // Trim history to max size
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(0, this.maxHistory);
    }
    
    // Save to disk asynchronously
    this.saveHistory().catch(err => 
      console.error('Background save failed:', err.message)
    );
    
    return entry;
  }

  generateEntryId() {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }

  getHistory(limit = 10, filter = {}) {
    let filtered = this.history;
    
    // Apply filters
    if (filter.namespace) {
      filtered = filtered.filter(e => e.result.namespace === filter.namespace);
    }
    
    if (filter.success !== undefined) {
      filtered = filtered.filter(e => e.result.success === filter.success);
    }
    
    if (filter.session) {
      filtered = filtered.filter(e => e.metadata.session === filter.session);
    }
    
    if (filter.since) {
      const since = new Date(filter.since);
      filtered = filtered.filter(e => new Date(e.metadata.timestamp) > since);
    }
    
    if (filter.command) {
      const commandQuery = filter.command.toLowerCase();
      filtered = filtered.filter(e => 
        e.command.toLowerCase().includes(commandQuery) ||
        (e.result.command && e.result.command.toLowerCase().includes(commandQuery))
      );
    }
    
    return filtered.slice(0, limit);
  }

  getSessionHistory(limit = 10) {
    return this.sessionHistory.slice(0, limit);
  }

  searchHistory(query, limit = 10) {
    const queryLower = query.toLowerCase();
    const results = this.history.filter(entry => 
      entry.command.toLowerCase().includes(queryLower) ||
      (entry.result.output && entry.result.output.toLowerCase().includes(queryLower)) ||
      (entry.result.error && entry.result.error.toLowerCase().includes(queryLower))
    );
    
    return results.slice(0, limit);
  }

  getRecentCommands(limit = 5) {
    return this.history
      .slice(0, limit)
      .map(entry => entry.command);
  }

  getPopularCommands(limit = 10) {
    const commandCounts = new Map();
    
    this.history.forEach(entry => {
      const cmdKey = entry.result.namespace && entry.result.command 
        ? `/${entry.result.namespace} ${entry.result.command}`
        : entry.command.split(' ').slice(0, 2).join(' ');
      
      commandCounts.set(cmdKey, (commandCounts.get(cmdKey) || 0) + 1);
    });
    
    return Array.from(commandCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([command, count]) => ({ command, count }));
  }

  getStatistics() {
    const stats = {
      total: this.history.length,
      sessionTotal: this.sessionHistory.length,
      successful: 0,
      failed: 0,
      byNamespace: {},
      byCommand: {},
      byTimeOfDay: {},
      averageExecutionTime: 0,
      mostUsed: [],
      recentFailures: [],
      naturalLanguageUsage: 0
    };
    
    let totalExecutionTime = 0;
    let executionTimeCount = 0;
    
    // Calculate statistics
    this.history.forEach(entry => {
      // Success/failure
      if (entry.result.success) {
        stats.successful++;
      } else {
        stats.failed++;
      }
      
      // Natural language usage
      if (entry.metadata.naturalLanguageAttempt) {
        stats.naturalLanguageUsage++;
      }
      
      // By namespace
      const ns = entry.result.namespace;
      if (ns) {
        stats.byNamespace[ns] = (stats.byNamespace[ns] || 0) + 1;
      }
      
      // By command
      const cmd = `${ns}:${entry.result.command}`;
      if (entry.result.command) {
        stats.byCommand[cmd] = (stats.byCommand[cmd] || 0) + 1;
      }
      
      // By time of day
      const hour = new Date(entry.metadata.timestamp).getHours();
      stats.byTimeOfDay[hour] = (stats.byTimeOfDay[hour] || 0) + 1;
      
      // Execution time
      if (entry.metadata.executionTime) {
        totalExecutionTime += entry.metadata.executionTime;
        executionTimeCount++;
      }
    });
    
    // Calculate averages
    if (executionTimeCount > 0) {
      stats.averageExecutionTime = Math.round(totalExecutionTime / executionTimeCount);
    }
    
    // Most used commands
    stats.mostUsed = Object.entries(stats.byCommand)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cmd, count]) => ({ command: cmd, count }));
    
    // Recent failures
    stats.recentFailures = this.history
      .filter(e => !e.result.success)
      .slice(0, 5)
      .map(e => ({
        command: e.command,
        error: e.result.error,
        timestamp: e.metadata.timestamp
      }));
    
    // Success rate
    stats.successRate = stats.total > 0 ? (stats.successful / stats.total) : 0;
    
    // Natural language usage percentage
    stats.naturalLanguageUsageRate = stats.total > 0 ? (stats.naturalLanguageUsage / stats.total) : 0;
    
    return stats;
  }

  getCommandsByTimeRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return this.history.filter(entry => {
      const entryDate = new Date(entry.metadata.timestamp);
      return entryDate >= start && entryDate <= end;
    });
  }

  getFailureAnalysis() {
    const failures = this.history.filter(e => !e.result.success);
    const analysis = {
      total: failures.length,
      byNamespace: {},
      byCommand: {},
      byErrorType: {},
      commonErrors: [],
      recentTrends: {}
    };
    
    failures.forEach(entry => {
      // By namespace
      const ns = entry.result.namespace || 'unknown';
      analysis.byNamespace[ns] = (analysis.byNamespace[ns] || 0) + 1;
      
      // By command
      const cmd = `${ns}:${entry.result.command || 'unknown'}`;
      analysis.byCommand[cmd] = (analysis.byCommand[cmd] || 0) + 1;
      
      // By error type
      const errorType = this.categorizeError(entry.result.error);
      analysis.byErrorType[errorType] = (analysis.byErrorType[errorType] || 0) + 1;
    });
    
    // Common errors
    analysis.commonErrors = Object.entries(analysis.byErrorType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));
    
    return analysis;
  }

  categorizeError(errorMessage) {
    if (!errorMessage) return 'unknown';
    
    const error = errorMessage.toLowerCase();
    
    if (error.includes('unknown command')) return 'unknown_command';
    if (error.includes('invalid command format')) return 'syntax_error';
    if (error.includes('required')) return 'missing_argument';
    if (error.includes('permission') || error.includes('unauthorized')) return 'permission_error';
    if (error.includes('network') || error.includes('connection')) return 'network_error';
    if (error.includes('timeout')) return 'timeout_error';
    
    return 'other';
  }

  async clearHistory() {
    this.history = [];
    this.sessionHistory = [];
    return this.saveHistory();
  }

  async clearOldHistory(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const originalCount = this.history.length;
    this.history = this.history.filter(entry => 
      new Date(entry.metadata.timestamp) > cutoffDate
    );
    
    const removedCount = originalCount - this.history.length;
    
    if (removedCount > 0) {
      await this.saveHistory();
      console.log(`Cleared ${removedCount} old commands from history`);
    }
    
    return removedCount;
  }

  exportHistory(format = 'json', filter = {}) {
    const historyToExport = this.getHistory(this.maxHistory, filter);
    
    if (format === 'json') {
      return JSON.stringify({
        exported: new Date().toISOString(),
        total: historyToExport.length,
        sessionId: this.sessionId,
        history: historyToExport
      }, null, 2);
    } else if (format === 'csv') {
      const headers = 'Timestamp,Command,Success,Namespace,Command Type,Error,Execution Time,Session\n';
      const rows = historyToExport.map(e => 
        `"${e.metadata.timestamp}","${e.command}",${e.result.success},"${e.result.namespace || ''}","${e.result.command || ''}","${e.result.error || ''}",${e.metadata.executionTime || 0},"${e.metadata.session}"`
      ).join('\n');
      return headers + rows;
    } else if (format === 'markdown') {
      let md = '# Command History Export\n\n';
      md += `**Exported:** ${new Date().toISOString()}\n`;
      md += `**Total Commands:** ${historyToExport.length}\n`;
      md += `**Session:** ${this.sessionId}\n\n`;
      
      md += '## Commands\n\n';
      md += '| Timestamp | Command | Success | Namespace | Error | Execution Time |\n';
      md += '|-----------|---------|---------|-----------|-------|----------------|\n';
      
      historyToExport.forEach(e => {
        const timestamp = new Date(e.metadata.timestamp).toLocaleString();
        const success = e.result.success ? '✅' : '❌';
        const error = (e.result.error || '').substring(0, 50);
        const execTime = e.metadata.executionTime || 0;
        
        md += `| ${timestamp} | \`${e.command}\` | ${success} | ${e.result.namespace || '-'} | ${error} | ${execTime}ms |\n`;
      });
      
      return md;
    }
    
    throw new Error(`Unsupported format: ${format}`);
  }

  // Real-time command suggestion based on history
  getCommandSuggestions(partial, limit = 5) {
    const suggestions = new Set();
    
    // Find commands that start with or contain the partial input
    this.history.forEach(entry => {
      const command = entry.command;
      if (command.toLowerCase().startsWith(partial.toLowerCase()) ||
          command.toLowerCase().includes(partial.toLowerCase())) {
        suggestions.add(command);
      }
    });
    
    return Array.from(suggestions).slice(0, limit);
  }

  // Get usage patterns for optimization
  getUsagePatterns() {
    const patterns = {
      peakHours: {},
      commandSequences: [],
      sessionLengths: [],
      errorPatterns: {}
    };
    
    // Peak hours analysis
    this.history.forEach(entry => {
      const hour = new Date(entry.metadata.timestamp).getHours();
      patterns.peakHours[hour] = (patterns.peakHours[hour] || 0) + 1;
    });
    
    // Command sequences (commands that often follow each other)
    for (let i = 0; i < this.history.length - 1; i++) {
      const current = this.history[i];
      const next = this.history[i + 1];
      
      // Only if within same session and close in time
      if (current.metadata.session === next.metadata.session) {
        const timeDiff = new Date(current.metadata.timestamp) - new Date(next.metadata.timestamp);
        if (timeDiff < 300000) { // 5 minutes
          const sequence = `${current.command} → ${next.command}`;
          const existing = patterns.commandSequences.find(s => s.sequence === sequence);
          if (existing) {
            existing.count++;
          } else {
            patterns.commandSequences.push({ sequence, count: 1 });
          }
        }
      }
    }
    
    // Sort sequences by frequency
    patterns.commandSequences.sort((a, b) => b.count - a.count);
    patterns.commandSequences = patterns.commandSequences.slice(0, 10);
    
    return patterns;
  }
}

module.exports = CommandHistoryManager;