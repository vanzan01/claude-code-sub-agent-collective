#!/bin/bash
# mock-deliverable-generator.sh
# Generates mock deliverables for hook validation during mock agent execution

LOG_FILE="/tmp/mock-deliverable-generator.log"
timestamp() { date '+%Y-%m-%d %H:%M:%S'; }
log() { echo "[$(timestamp)] $1" >> "$LOG_FILE"; }

EVENT=${EVENT:-""}
SUBAGENT_NAME=${SUBAGENT_NAME:-""}
AGENT_OUTPUT=${AGENT_OUTPUT:-""}

log "Mock Deliverable Generator - Event: $EVENT, Agent: $SUBAGENT_NAME"

# Only generate on SubagentStop for mock agents
if [[ "$EVENT" != "SubagentStop" ]]; then
    exit 0
fi

# Only for mock agents
if [[ "$SUBAGENT_NAME" != mock-* ]]; then
    exit 0
fi

MOCK_DIR="/tmp/mock-deliverables"
mkdir -p "$MOCK_DIR"

generate_mock_deliverables() {
    local agent="$1"
    
    case "$agent" in
        "mock-prd-research-agent")
            log "Generating PRD research deliverables"
            cat > "$MOCK_DIR/prd-analysis.md" << 'EOF'
# PRD Analysis Results

## Technical Stack Research
- React 18 with TypeScript 
- Vite build system
- Component architecture patterns

## Task Breakdown
- UI Components: 4 components identified
- API Integration: localStorage persistence 
- Testing Strategy: Jest + React Testing Library
EOF
            ;;
            
        "mock-project-manager-agent")
            log "Generating project management deliverables"
            cat > "$MOCK_DIR/project-plan.json" << 'EOF'
{
  "phases": [
    { "name": "Setup", "status": "complete" },
    { "name": "Implementation", "status": "ready" },
    { "name": "Testing", "status": "pending" }
  ],
  "dependencies": [],
  "timeline": "2 weeks"
}
EOF
            ;;
            
        "mock-implementation-agent")
            log "Generating implementation deliverables"
            cat > "$MOCK_DIR/TaskList.tsx" << 'EOF'
import React, { useState } from 'react';

interface Task {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
}

export const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  
  return (
    <div className="task-list">
      {tasks.map(task => (
        <div key={task.id} className={`task task-${task.status}`}>
          {task.title}
        </div>
      ))}
    </div>
  );
};
EOF
            
            cat > "$MOCK_DIR/TaskList.test.tsx" << 'EOF'
import { render, screen } from '@testing-library/react';
import { TaskList } from './TaskList';

describe('TaskList', () => {
  it('renders empty task list', () => {
    render(<TaskList />);
    expect(screen.getByTestId('task-list')).toBeInTheDocument();
  });
  
  it('displays tasks when provided', () => {
    render(<TaskList />);
    // Mock test assertions
    expect(true).toBe(true);
  });
});
EOF

            cat > "$MOCK_DIR/test-results.json" << 'EOF'
{
  "numTotalTests": 15,
  "numPassedTests": 15,
  "numFailedTests": 0,
  "coverage": {
    "lines": { "pct": 95 },
    "statements": { "pct": 94 },
    "functions": { "pct": 96 },
    "branches": { "pct": 92 }
  }
}
EOF
            ;;
            
        "mock-testing-agent")
            log "Generating testing deliverables"
            cat > "$MOCK_DIR/test-report.html" << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Test Results</title></head>
<body>
  <h1>Mock Test Results</h1>
  <p>✅ All 15 tests passed</p>
  <p>📊 Coverage: 95%</p>
</body>
</html>
EOF

            cat > "$MOCK_DIR/coverage-report.json" << 'EOF'
{
  "total": {
    "lines": { "total": 100, "covered": 95, "pct": 95 },
    "statements": { "total": 85, "covered": 80, "pct": 94 },
    "functions": { "total": 25, "covered": 24, "pct": 96 }
  }
}
EOF
            ;;
            
        "mock-quality-gate-agent")
            log "Generating quality gate deliverables"
            cat > "$MOCK_DIR/security-scan.json" << 'EOF'
{
  "vulnerabilities": [],
  "riskLevel": "low",
  "securityScore": 95,
  "lastScan": "2025-01-15T10:30:00Z"
}
EOF

            cat > "$MOCK_DIR/performance-metrics.json" << 'EOF'
{
  "loadTime": 1200,
  "bundleSize": 245000,
  "performanceScore": 92,
  "accessibility": 98
}
EOF
            ;;
            
        "mock-completion-agent")
            log "Generating completion deliverables"
            cat > "$MOCK_DIR/delivery-manifest.json" << 'EOF'
{
  "deliveryId": "mock-delivery-001",
  "components": ["TaskList", "TaskForm", "Dashboard"],
  "testsPassing": 15,
  "coveragePercent": 95,
  "qualityGatesPassed": true,
  "deliveryTimestamp": "2025-01-15T10:45:00Z"
}
EOF
            ;;
    esac
    
    log "Generated mock deliverables for $agent in $MOCK_DIR"
    return 0
}

# Generate deliverables for the current agent
generate_mock_deliverables "$SUBAGENT_NAME"

exit 0