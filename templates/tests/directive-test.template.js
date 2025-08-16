// directive-test.template.js
// Directive enforcement validation tests
// Project: {{PROJECT_NAME}}
// Generated: {{INSTALL_DATE}}

describe('Directive Enforcement', () => {
  
  describe('DIRECTIVE 1: NEVER IMPLEMENT DIRECTLY', () => {
    test('should block direct implementation without agent routing', () => {
      const directImplementation = {
        action: 'implement',
        context: 'Create new feature component',
        agentRouting: false
      };
      
      expect(() => validateDirective1(directImplementation))
        .toThrow('Direct implementation not allowed');
    });
    
    test('should allow implementation through agent routing', () => {
      const agentImplementation = {
        action: 'implement',
        context: 'Create feature via @implementation-agent',
        agentRouting: true,
        routedAgent: '@implementation-agent'
      };
      
      expect(() => validateDirective1(agentImplementation)).not.toThrow();
    });
  });
  
  describe('DIRECTIVE 2: COLLECTIVE ROUTING PROTOCOL', () => {
    test('should enforce hub-and-spoke routing pattern', () => {
      const hubRouting = {
        from: 'hub-controller',
        to: '@implementation-agent',
        viaHub: true
      };
      
      const directRouting = {
        from: '@test-agent',
        to: '@implementation-agent',
        viaHub: false
      };
      
      expect(validateDirective2(hubRouting)).toBe(true);
      expect(() => validateDirective2(directRouting))
        .toThrow('Direct agent communication not allowed');
    });
    
    test('should validate routing agent capabilities', () => {
      const routingRequest = {
        type: 'code-generation',
        requirements: ['file-operations', 'testing']
      };
      
      const selectedAgent = selectAgentByCapability(routingRequest);
      expect(selectedAgent).toMatch(/@.*-agent$/);
    });
  });
  
  describe('DIRECTIVE 3: TEST-DRIVEN VALIDATION', () => {
    test('should require test contracts for handoffs', () => {
      const handoffWithContract = {
        from: '@routing-agent',
        to: '@implementation-agent',
        contract: {
          preconditions: ['requirements-defined'],
          postconditions: ['implementation-complete']
        }
      };
      
      const handoffWithoutContract = {
        from: '@routing-agent',
        to: '@implementation-agent',
        contract: null
      };
      
      expect(validateDirective3(handoffWithContract)).toBe(true);
      expect(validateDirective3(handoffWithoutContract)).toBe(false);
    });
    
    test('should validate contract preconditions', () => {
      const contract = {
        preconditions: ['dependencies-installed', 'tests-written'],
        postconditions: ['code-implemented', 'tests-passing']
      };
      
      const validation = validateContract(contract);
      expect(validation).toHaveProperty('preconditionsValid');
      expect(validation).toHaveProperty('postConditionsValid');
    });
  });
  
  describe('Security Validation', () => {
    test('should block malicious command injection attempts', () => {
      const maliciousInputs = [
        '$(rm -rf /)',
        '`curl malicious.com`',
        '; rm important.file',
        '|| wget hack.sh'
      ];
      
      maliciousInputs.forEach(input => {
        expect(() => validateSecurity(input))
          .toThrow('Potentially malicious input detected');
      });
    });
    
    test('should allow safe inputs', () => {
      const safeInputs = [
        'Create a login component',
        'Implement user authentication',
        'Add validation to form fields'
      ];
      
      safeInputs.forEach(input => {
        expect(() => validateSecurity(input)).not.toThrow();
      });
    });
  });
  
});

// Test helper functions
function validateDirective1(action) {
  if (action.action === 'implement' && !action.agentRouting) {
    throw new Error('Direct implementation not allowed');
  }
  return true;
}

function validateDirective2(routing) {
  if (!routing.viaHub && routing.from.includes('@') && routing.to.includes('@')) {
    throw new Error('Direct agent communication not allowed');
  }
  return true;
}

function validateDirective3(handoff) {
  return handoff.contract !== null;
}

function validateContract(contract) {
  return {
    preconditionsValid: Array.isArray(contract.preconditions) && contract.preconditions.length > 0,
    postConditionsValid: Array.isArray(contract.postconditions) && contract.postconditions.length > 0
  };
}

function validateSecurity(input) {
  const maliciousPatterns = [
    /\$\(/,  // Command substitution
    /`[^`]*`/,  // Backtick execution
    /;\s*(rm|curl|wget|sudo)/,  // Dangerous commands
    /\|\|/,  // Command chaining
    />/  // Redirection (simplified check)
  ];
  
  maliciousPatterns.forEach(pattern => {
    if (pattern.test(input)) {
      throw new Error('Potentially malicious input detected');
    }
  });
  
  return true;
}

function selectAgentByCapability(request) {
  const agentCapabilities = {
    '@implementation-agent': ['code-generation', 'file-operations'],
    '@testing-agent': ['testing', 'validation'],
    '@research-agent': ['analysis', 'documentation']
  };
  
  for (const [agent, capabilities] of Object.entries(agentCapabilities)) {
    if (capabilities.includes(request.type)) {
      return agent;
    }
  }
  
  return '@routing-agent'; // Fallback
}