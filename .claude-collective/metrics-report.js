#!/usr/bin/env node
/**
 * metrics-report.js
 * Simple metrics reporting for claude-collective research validation
 */

const fs = require('fs-extra');
const path = require('path');

class MetricsReporter {
  constructor(metricsDir = './metrics') {
    this.metricsDir = path.resolve(metricsDir);
  }

  async generateReport() {
    try {
      console.log('🔍 Claude Collective Metrics Report');
      console.log('===================================\n');

      // Check if metrics directory exists
      if (!fs.existsSync(this.metricsDir)) {
        console.log('❌ No metrics directory found at:', this.metricsDir);
        console.log('   Run some operations to generate metrics first.\n');
        return;
      }

      // Get all metrics files
      const files = fs.readdirSync(this.metricsDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      const logFiles = files.filter(f => f.endsWith('.log'));

      console.log('📊 Metrics Files Found:');
      console.log(`   JSON metrics: ${jsonFiles.length}`);
      console.log(`   Log files: ${logFiles.length}\n`);

      // Process JSON metrics
      let totalEvents = 0;
      const eventsByType = {};

      for (const file of jsonFiles) {
        const filePath = path.join(this.metricsDir, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.trim().split('\n').filter(line => line.trim());
          
          console.log(`📄 ${file}: ${lines.length} events`);
          totalEvents += lines.length;

          // Parse events and categorize
          lines.forEach(line => {
            try {
              const event = JSON.parse(line);
              const type = event.event || 'unknown';
              eventsByType[type] = (eventsByType[type] || 0) + 1;
            } catch (e) {
              // Skip malformed lines
            }
          });
        } catch (error) {
          console.log(`   ⚠️ Error reading ${file}: ${error.message}`);
        }
      }

      console.log(`\n📈 Total Events: ${totalEvents}`);
      
      if (Object.keys(eventsByType).length > 0) {
        console.log('\n📊 Events by Type:');
        Object.entries(eventsByType)
          .sort(([,a], [,b]) => b - a)
          .forEach(([type, count]) => {
            console.log(`   ${type}: ${count}`);
          });
      }

      // Process log files
      if (logFiles.length > 0) {
        console.log('\n📋 Log File Summary:');
        for (const file of logFiles) {
          const filePath = path.join(this.metricsDir, file);
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.trim().split('\n').length;
            const size = fs.statSync(filePath).size;
            console.log(`   ${file}: ${lines} lines, ${this.formatBytes(size)}`);
          } catch (error) {
            console.log(`   ⚠️ Error reading ${file}: ${error.message}`);
          }
        }
      }

      // Research metrics summary
      this.generateResearchSummary(eventsByType, totalEvents);

    } catch (error) {
      console.error('❌ Error generating metrics report:', error.message);
    }
  }

  generateResearchSummary(eventsByType, totalEvents) {
    console.log('\n🔬 Research Metrics Summary:');
    console.log('============================');
    
    // JIT Hypothesis metrics
    const jitEvents = Object.entries(eventsByType)
      .filter(([type]) => type.includes('jit') || type.includes('loading'))
      .reduce((sum, [, count]) => sum + count, 0);
    
    console.log(`📊 JIT Context Loading Events: ${jitEvents}`);
    
    // Hub-Spoke metrics  
    const hubEvents = Object.entries(eventsByType)
      .filter(([type]) => type.includes('routing') || type.includes('hub'))
      .reduce((sum, [, count]) => sum + count, 0);
    
    console.log(`🎯 Hub-Spoke Coordination Events: ${hubEvents}`);
    
    // TDD metrics
    const tddEvents = Object.entries(eventsByType)
      .filter(([type]) => type.includes('test') || type.includes('handoff'))
      .reduce((sum, [, count]) => sum + count, 0);
    
    console.log(`✅ Test-Driven Development Events: ${tddEvents}`);
    
    // Overall system health
    if (totalEvents > 0) {
      console.log(`\n💚 System Activity: ${totalEvents} total events recorded`);
      console.log('✅ Metrics collection is operational');
    } else {
      console.log('\n⚠️ No events recorded yet - system may be inactive');
    }
    
    console.log('\n📅 Report generated:', new Date().toISOString());
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// CLI usage
if (require.main === module) {
  const reporter = new MetricsReporter();
  reporter.generateReport().catch(console.error);
}

module.exports = MetricsReporter;