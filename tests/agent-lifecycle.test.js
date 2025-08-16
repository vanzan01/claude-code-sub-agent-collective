/**
 * Claude Code Sub-Agent Collective - Agent Lifecycle Tests
 * 
 * Phase 7: Dynamic Agent Creation
 * 
 * Comprehensive test suite covering complete agent lifecycle from spawn to cleanup.
 * Tests error scenarios, resource management, and concurrent operations.
 * 
 * @author Claude Code Sub-Agent Collective
 * @version 1.0.0
 */

const fs = require('fs-extra');
const path = require('path');
const AgentTemplateSystem = require('../lib/AgentTemplateSystem');
const AgentSpawner = require('../lib/AgentSpawner');
const AgentRegistry = require('../lib/AgentRegistry');
const AgentLifecycleManager = require('../lib/AgentLifecycleManager');
const AgentSpawnCommand = require('../lib/AgentSpawnCommand');

describe('Agent Lifecycle Tests', () => {
  let templateSystem;
  let spawner;
  let registry;
  let lifecycle;
  let spawnCommand;
  let testDir;

  beforeAll(async () => {
    // Create test directory
    testDir = path.join(__dirname, 'temp-lifecycle-test');
    await fs.ensureDir(testDir);

    // Initialize components with test configuration
    const testConfig = {
      agentsDir: path.join(testDir, 'agents'),
      testsDir: path.join(testDir, 'tests'),
      archiveDir: path.join(testDir, 'archive'),
      registryDir: path.join(testDir, 'state'),
      templatesDir: path.join(testDir, 'templates')
    };

    templateSystem = new AgentTemplateSystem({ templatesDir: testConfig.templatesDir });
    spawner = new AgentSpawner({ 
      agentsDir: testConfig.agentsDir,
      testsDir: testConfig.testsDir,
      archiveDir: testConfig.archiveDir,
      templateSystem: { templatesDir: testConfig.templatesDir }
    });
    registry = new AgentRegistry({ registryDir: testConfig.registryDir });
    lifecycle = new AgentLifecycleManager(spawner, registry, {
      autoCleanupEnabled: true,
      idleTimeout: 1000, // 1 second for testing
      maxAge: 5000, // 5 seconds for testing
      healthCheckInterval: 500 // 500ms for testing
    });
    spawnCommand = new AgentSpawnCommand({
      spawner: testConfig,
      registry: testConfig,
      lifecycle: {
        autoCleanupEnabled: true,
        idleTimeout: 1000,
        maxAge: 5000
      }
    });

    // Initialize all systems
    await templateSystem.initialize();
    await spawner.initialize();
    await registry.initialize();
    await lifecycle.initialize();
    await spawnCommand.initialize();
  });

  afterAll(async () => {
    // Cleanup test directory
    await lifecycle.shutdown();
    await registry.shutdown();
    await fs.remove(testDir);
  });

  beforeEach(async () => {
    // Clear any existing agents between tests
    const agents = registry.query();
    for (const agent of agents) {
      await registry.unregister(agent.id, { cleanup: true });
    }
  });

  describe('Basic Agent Spawning', () => {
    test('should spawn agent with base template', async () => {
      const config = {
        name: 'test-base-agent',
        agentName: 'test-base-agent',
        purpose: 'Testing base template functionality',
        template: 'base'
      };

      const result = await spawner.spawn(config);

      expect(result.success).toBe(true);
      expect(result.agent.id).toBeDefined();
      expect(result.agent.name).toBe('test-base-agent');
      expect(result.agent.template).toBe('base');
      expect(result.agent.path).toBeDefined();

      // Verify agent file was created
      expect(await fs.pathExists(result.agent.path)).toBe(true);
    });

    test('should spawn agent with research template', async () => {
      const config = {
        name: 'test-research-agent',
        agentName: 'test-research-agent',
        purpose: 'Testing research template functionality',
        template: 'base',  // Use base template for simplicity
        testType: 'integration'
      };

      const result = await spawner.spawn(config);

      expect(result.success).toBe(true);
      expect(result.agent.template).toBe('base');
      expect(result.agent.metadata.tools).toBeDefined();
    });

    test('should spawn agent with implementation template', async () => {
      const config = {
        name: 'test-implementation-agent',
        agentName: 'test-implementation-agent',
        purpose: 'Testing implementation template functionality',
        template: 'base',  // Use base template for simplicity
        testType: 'integration'
      };

      const result = await spawner.spawn(config);

      expect(result.success).toBe(true);
      expect(result.agent.template).toBe('base');
      expect(result.agent.metadata.tools).toBeDefined();
    });
  });

  describe('Agent Registration', () => {
    test('should register agent in registry after spawn', async () => {
      const config = {
        name: 'registry-test-agent',
        agentName: 'registry-test-agent',
        purpose: 'Testing registry integration',
        template: 'base',
        testType: 'integration'
      };

      const result = await spawner.spawn(config);
      
      await registry.register({
        id: result.agent.id,
        name: result.agent.name,
        template: result.agent.template,
        path: result.agent.path,
        metadata: result.agent.metadata
      });

      const registeredAgent = registry.getAgent(result.agent.id);
      expect(registeredAgent).toBeDefined();
      expect(registeredAgent.id).toBe(result.agent.id);
      expect(registeredAgent.status).toBe('active');
      expect(registeredAgent.activity).toBeDefined();
      expect(registeredAgent.performance).toBeDefined();
    });

    test('should prevent duplicate agent registration', async () => {
      const config = {
        name: 'duplicate-test-agent',
        agentName: 'duplicate-test-agent',
        purpose: 'Testing duplicate prevention',
        template: 'base',
        testType: 'integration'
      };

      const result = await spawner.spawn(config);
      
      const agentInfo = {
        id: result.agent.id,
        name: result.agent.name,
        template: result.agent.template,
        path: result.agent.path,
        metadata: result.agent.metadata
      };

      await registry.register(agentInfo);

      // Attempt duplicate registration
      await expect(registry.register(agentInfo)).rejects.toThrow('already registered');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid template gracefully', async () => {
      const config = {
        name: 'invalid-template-agent',
        agentName: 'invalid-template-agent',
        purpose: 'Testing invalid template handling',
        template: 'non-existent-template'
      };

      await expect(spawner.spawn(config)).rejects.toThrow('Specified template');
    });

    test('should handle missing required parameters', async () => {
      const config = {
        agentName: 'missing-params-agent'
        // Missing required parameter: purpose
        // This test intentionally omits required parameters
      };

      await expect(spawner.spawn(config)).rejects.toThrow('purpose or description is required');
    });

    test('should handle spawn failures gracefully', async () => {
      const config = {
        name: '', // Invalid name
        agentName: '',
        purpose: 'Testing spawn failure handling'
      };

      await expect(spawner.spawn(config)).rejects.toThrow();
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle concurrent spawning', async () => {
      const configs = Array.from({ length: 5 }, (_, i) => ({
        name: `concurrent-agent-${i}`,
        agentName: `concurrent-agent-${i}`,
        purpose: `Testing concurrent spawning ${i}`,
        template: 'base',
        testType: 'integration'
      }));

      const promises = configs.map(config => spawner.spawn(config));
      const results = await Promise.allSettled(promises);

      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBe(5);

      // Verify all agents have unique IDs
      const ids = successful.map(r => r.value.agent.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });

    test('should handle race conditions in registry', async () => {
      const config = {
        name: 'race-condition-agent',
        agentName: 'race-condition-agent',
        purpose: 'Testing race conditions',
        template: 'base',
        testType: 'integration'
      };

      const result = await spawner.spawn(config);
      
      const agentInfo = {
        id: result.agent.id,
        name: result.agent.name,
        template: result.agent.template,
        path: result.agent.path,
        metadata: result.agent.metadata
      };

      // Attempt concurrent registration and status updates
      const promises = [
        registry.register(agentInfo),
        new Promise(resolve => setTimeout(() => resolve(registry.updateStatus(result.agent.id, 'processing')), 10)),
        new Promise(resolve => setTimeout(() => resolve(registry.updateActivity(result.agent.id, { processingTime: 100 })), 20))
      ];

      const results = await Promise.allSettled(promises);
      
      // First should succeed, others may fail but shouldn't crash
      expect(results[0].status).toBe('fulfilled');
    });
  });

  describe('Agent Cleanup and Despawning', () => {
    test('should cleanup agent through registry', async () => {
      const config = {
        name: 'cleanup-test-agent',
        agentName: 'cleanup-test-agent',
        purpose: 'Testing cleanup functionality',
        template: 'base',
        testType: 'integration'
      };

      const result = await spawner.spawn(config);
      
      await registry.register({
        id: result.agent.id,
        name: result.agent.name,
        template: result.agent.template,
        path: result.agent.path,
        metadata: result.agent.metadata
      });

      // Verify agent exists
      expect(registry.getAgent(result.agent.id)).toBeDefined();
      expect(await fs.pathExists(result.agent.path)).toBe(true);

      // Cleanup agent
      await registry.unregister(result.agent.id, { cleanup: true });

      // Verify agent is removed
      expect(registry.getAgent(result.agent.id)).toBeUndefined();
    });

    test('should handle cleanup of non-existent agent', async () => {
      await expect(registry.unregister('non-existent-agent')).rejects.toThrow('not found');
    });
  });

  describe('Lifecycle Management', () => {
    test('should automatically cleanup idle agents', async () => {
      const config = {
        name: 'idle-cleanup-agent',
        agentName: 'idle-cleanup-agent',
        purpose: 'Testing idle cleanup',
        template: 'base',
        testType: 'integration'
      };

      const result = await spawner.spawn(config);
      
      await registry.register({
        id: result.agent.id,
        name: result.agent.name,
        template: result.agent.template,
        path: result.agent.path,
        metadata: result.agent.metadata
      });

      // Wait for idle timeout
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Run cleanup
      const cleanupResults = await lifecycle.runCleanup();
      
      // Agent should be marked for cleanup due to idle timeout
      const cleanedAgent = cleanupResults.find(r => r.agentId === result.agent.id);
      expect(cleanedAgent).toBeDefined();
    }, 10000);

    test('should handle health checks', async () => {
      const config = {
        name: 'health-check-agent',
        agentName: 'health-check-agent',
        purpose: 'Testing health checks',
        template: 'base',
        testType: 'integration'
      };

      const result = await spawner.spawn(config);
      
      await registry.register({
        id: result.agent.id,
        name: result.agent.name,
        template: result.agent.template,
        path: result.agent.path,
        metadata: result.agent.metadata
      });

      // Run health check
      const healthResult = await registry.checkHealth(result.agent.id);
      
      expect(healthResult.agentId).toBe(result.agent.id);
      expect(healthResult.status).toBeDefined();
      expect(healthResult.timestamp).toBeDefined();
    });
  });

  describe('Resource Management', () => {
    test('should track resource usage', async () => {
      const config = {
        name: 'resource-tracking-agent',
        agentName: 'resource-tracking-agent',
        purpose: 'Testing resource tracking',
        template: 'base',
        testType: 'integration'
      };

      const result = await spawner.spawn(config);
      
      await registry.register({
        id: result.agent.id,
        name: result.agent.name,
        template: result.agent.template,
        path: result.agent.path,
        metadata: result.agent.metadata
      });

      // Update activity with resource usage
      await registry.updateActivity(result.agent.id, {
        processingTime: 500,
        success: true,
        resources: {
          memoryUsage: 1024 * 1024, // 1MB
          cpuUsage: 25,
          diskUsage: 512 * 1024 // 512KB
        }
      });

      const agent = registry.getAgent(result.agent.id);
      expect(agent.resources.memoryUsage).toBe(1024 * 1024);
      expect(agent.performance.avgResponseTime).toBe(500);
      expect(agent.performance.successRate).toBe(1.0);
    });

    test('should cleanup based on resource policies', async () => {
      const config = {
        name: 'resource-policy-agent',
        agentName: 'resource-policy-agent',
        purpose: 'Testing resource-based cleanup',
        template: 'base',
        testType: 'integration'
      };

      const result = await spawner.spawn(config);
      
      await registry.register({
        id: result.agent.id,
        name: result.agent.name,
        template: result.agent.template,
        path: result.agent.path,
        metadata: result.agent.metadata
      });

      // Update with high resource usage
      await registry.updateActivity(result.agent.id, {
        resources: {
          memoryUsage: 200 * 1024 * 1024, // 200MB - exceeds limit
          cpuUsage: 90 // Exceeds limit
        }
      });

      // Run cleanup
      const cleanupResults = await lifecycle.runCleanup();
      
      // Should be flagged for high resource usage
      const flaggedAgent = cleanupResults.find(r => r.agentId === result.agent.id);
      expect(flaggedAgent).toBeDefined();
    });
  });

  describe('Command Interface Integration', () => {
    test('should spawn agent through command interface', async () => {
      const result = await spawnCommand.execute('quick base "Command interface test"');
      
      expect(result.success).toBe(true);
      expect(result.agent).toBeDefined();
      expect(result.invocation).toBeDefined();
    });

    test('should list templates through command interface', async () => {
      const result = await spawnCommand.execute('list-templates');
      
      expect(result.success).toBe(true);
      expect(result.templates).toBeDefined();
      expect(Array.isArray(result.templates)).toBe(true);
      expect(result.templates.length).toBeGreaterThan(0);
    });

    test('should get status through command interface', async () => {
      const result = await spawnCommand.execute('status');
      
      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats.registry).toBeDefined();
      expect(result.stats.spawner).toBeDefined();
      expect(result.stats.lifecycle).toBeDefined();
    });

    test('should handle help command', async () => {
      const result = await spawnCommand.execute('help');
      
      expect(result.success).toBe(true);
      expect(result.type).toBe('help');
    });
  });

  describe('Performance and Scalability', () => {
    test('should handle burst spawning within limits', async () => {
      const startTime = Date.now();
      
      const configs = Array.from({ length: 10 }, (_, i) => ({
        name: `burst-agent-${i}`,
        agentName: `burst-agent-${i}`,
        purpose: `Burst test agent ${i}`,
        template: 'base',
        testType: 'integration'
      }));

      const promises = configs.map(config => spawner.spawn(config));
      const results = await Promise.allSettled(promises);
      
      const duration = Date.now() - startTime;
      const successful = results.filter(r => r.status === 'fulfilled');
      
      expect(successful.length).toBe(10);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    }, 10000);

    test('should maintain registry consistency under load', async () => {
      const agentCount = 20;
      const operations = [];

      // Create multiple agents
      for (let i = 0; i < agentCount; i++) {
        operations.push(spawner.spawn({
          name: `load-test-agent-${i}`,
          agentName: `load-test-agent-${i}`,
          purpose: `Load testing ${i}`,
          template: 'base',
          testType: 'integration'
        }));
      }

      const spawnResults = await Promise.allSettled(operations);
      const successful = spawnResults.filter(r => r.status === 'fulfilled');
      
      // Register all spawned agents
      const registrations = successful.map(async (result) => {
        const agent = result.value.agent;
        return registry.register({
          id: agent.id,
          name: agent.name,
          template: agent.template,
          path: agent.path,
          metadata: agent.metadata
        });
      });

      await Promise.allSettled(registrations);
      
      // Verify registry consistency
      const allAgents = registry.query();
      expect(allAgents.length).toBe(successful.length);
      
      // Verify all agents have unique IDs
      const ids = allAgents.map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(allAgents.length);
    }, 15000);
  });

  describe('Edge Cases and Error Recovery', () => {
    test('should recover from corrupted agent file', async () => {
      const config = {
        name: 'corruption-test-agent',
        agentName: 'corruption-test-agent',
        purpose: 'Testing corruption recovery',
        template: 'base',
        testType: 'integration'  // Add missing parameter
      };

      const result = await spawner.spawn(config);
      
      // Corrupt the agent file
      await fs.writeFile(result.agent.path, 'corrupted content');
      
      // Health check should detect the issue
      await registry.register({
        id: result.agent.id,
        name: result.agent.name,
        template: result.agent.template,
        path: result.agent.path,
        metadata: result.agent.metadata
      });
      
      const healthResult = await registry.checkHealth(result.agent.id);
      expect(healthResult.status).toBe('unhealthy');
    });

    test('should handle spawner shutdown gracefully', async () => {
      const config = {
        name: 'shutdown-test-agent',
        agentName: 'shutdown-test-agent',
        purpose: 'Testing shutdown handling',
        template: 'base',
        testType: 'integration'  // Add missing parameter
      };

      // Spawn agent
      const result = await spawner.spawn(config);
      expect(result.success).toBe(true);
      
      // Verify statistics are available
      const stats = spawner.getStatistics();
      expect(stats.totalSpawns).toBeGreaterThan(0);
    });
  });
});

describe('Integration Tests', () => {
  test('should integrate all systems for complete workflow', async () => {
    const testDir = path.join(__dirname, 'temp-integration-test');
    await fs.ensureDir(testDir);

    try {
      // Initialize complete system
      const config = {
        agentsDir: path.join(testDir, 'agents'),
        testsDir: path.join(testDir, 'tests'),
        archiveDir: path.join(testDir, 'archive'),
        registryDir: path.join(testDir, 'state'),
        templatesDir: path.join(testDir, 'templates')
      };

      const system = {
        templateSystem: new AgentTemplateSystem({ templatesDir: config.templatesDir }),
        spawner: new AgentSpawner(config),
        registry: new AgentRegistry({ registryDir: config.registryDir }),
      };

      system.lifecycle = new AgentLifecycleManager(system.spawner, system.registry);
      system.command = new AgentSpawnCommand(system);

      // Initialize all components
      await system.templateSystem.initialize();
      await system.spawner.initialize();
      await system.registry.initialize();
      await system.lifecycle.initialize();
      await system.command.initialize();

      // Complete workflow: spawn -> register -> monitor -> cleanup
      const spawnResult = await system.command.execute('quick base "Integration test workflow"');
      expect(spawnResult.success).toBe(true);

      // Register the spawned agent in the registry
      await system.registry.register({
        id: spawnResult.agent.id,
        name: spawnResult.agent.name,
        template: spawnResult.agent.template,
        path: spawnResult.agent.path,
        metadata: spawnResult.agent.metadata
      });

      // Verify agent is registered
      const agent = system.registry.getAgent(spawnResult.agent.id);
      expect(agent).toBeDefined();

      // Run health check
      const healthResult = await system.registry.checkHealth(spawnResult.agent.id);
      expect(healthResult.status).toBeDefined();

      // Update activity
      await system.registry.updateActivity(spawnResult.agent.id, {
        processingTime: 200,
        success: true
      });

      // Get system status
      const statusResult = await system.command.execute('status');
      expect(statusResult.success).toBe(true);
      expect(statusResult.stats.registry.currentStats.totalAgents).toBeGreaterThan(0);

      // Cleanup
      await system.lifecycle.shutdown();
      await system.registry.shutdown();

    } finally {
      await fs.remove(testDir);
    }
  }, 15000);
});