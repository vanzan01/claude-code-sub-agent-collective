// Jest setup file for claude-collective tests
// Configures test environment and global utilities

const fs = require('fs-extra');
const path = require('path');

// Set up test environment
global.console = {
  ...console,
  // Suppress console.log during tests unless explicitly needed
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
};

// Global test utilities
global.testUtils = {
  createMockAgent: (name, capabilities = []) => ({
    name,
    capabilities,
    status: 'active',
    lastUsed: new Date().toISOString()
  }),
  
  createMockHandoff: (from, to, context = {}) => ({
    from,
    to,
    context,
    timestamp: new Date().toISOString(),
    handoffId: `test_${Date.now()}`
  }),
  
  createMockContract: (preconditions = [], postconditions = []) => ({
    preconditions: preconditions.map(name => ({
      name,
      test: () => true,
      critical: true,
      errorMessage: `${name} validation failed`
    })),
    postconditions: postconditions.map(name => ({
      name,
      test: () => true,
      critical: false,
      errorMessage: `${name} validation failed`
    })),
    rollback: async () => ({ rolled_back: true })
  }),
  
  mockFileExists: (filePath, exists = true) => {
    jest.spyOn(fs, 'existsSync').mockImplementation((path) => {
      return path === filePath ? exists : jest.requireActual('fs-extra').existsSync(path);
    });
  },
  
  cleanup: () => {
    jest.restoreAllMocks();
  }
};

// Set up test directories
const testTempDir = path.join(__dirname, 'temp');
beforeEach(() => {
  if (fs.existsSync(testTempDir)) {
    fs.removeSync(testTempDir);
  }
  fs.ensureDirSync(testTempDir);
});

afterEach(() => {
  global.testUtils.cleanup();
  if (fs.existsSync(testTempDir)) {
    fs.removeSync(testTempDir);
  }
});

// Configure test timeout
jest.setTimeout(10000);