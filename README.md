# TaskMaster: Complete User Manual

Your step-by-step guide to autonomous AI-powered software development with TaskMaster.

## Overview

TaskMaster transforms software development by using AI to parse requirements, generate tasks, analyze complexity, and autonomously implement code. This manual walks you through the complete workflow from MCP installation to autonomous development.

## Installation

### Install TaskMaster MCP in Claude Code
```bash
claude mcp add task-master -s user -- npx -y --package=task-master-ai task-master-ai
```

**What this does:**
- Installs TaskMaster MCP tools
- Configures all necessary dependencies
- Makes TaskMaster commands available in Claude Code
- Ready for immediate use (no additional setup required)

## Prerequisites

- Claude Code installed
- TaskMaster MCP installed (see above)
- Project directory ready for development
- Product Requirements Document (PRD) prepared

## Phase 1: PRD Setup

### Step 1: Create Your PRD
Create a PRD file in your project directory with:
- Project goals and vision
- Core features and functionality  
- Technical requirements and constraints
- User stories and acceptance criteria
- Database schemas (if applicable)
- Performance and security requirements

**PRD Best Practices:**
- Be specific about technologies/frameworks
- Include user stories and acceptance criteria
- Specify database schemas if applicable
- Mention performance and security requirements

## Phase 2: Task Generation

### Step 2: Parse PRD and Generate Tasks
```
/project:tm-parse-prd
```
**What it does:**
- Reads your PRD document
- Uses AI to generate structured development tasks
- Creates dependency relationships
- Assigns priorities and complexity estimates

**Expected output:** 10-30 tasks in `.taskmaster/tasks/tasks.json`

### Step 3: Review Generated Tasks
```
/project:tm-list
```
**Review checklist:**
- Do tasks cover all PRD requirements?
- Are priorities appropriate?
- Do dependencies make sense?
- Any missing or unnecessary tasks?

**Optional:** Add additional tasks if needed
```
/project:tm-add "Implement additional feature X"
```

## Phase 3: Task Analysis & Preparation

### Step 4: Analyze Task Complexity
```
/project:tm-analyze
```
**What it does:**
- Evaluates each task's complexity (1-10 scale)
- Identifies tasks needing breakdown
- Generates expansion recommendations
- Creates complexity report

**Expected output:** 
- High complexity tasks (8-10): Need expansion
- Medium complexity tasks (5-7): Consider expansion  
- Low complexity tasks (1-4): Ready for development

### Step 5: Expand Complex Tasks
**Option A:** Expand all eligible tasks
```
/project:tm-expand-all
```

**Option B:** Expand specific tasks
```
/project:tm-expand 5
/project:tm-expand 12
```

**What expansion does:**
- Breaks complex tasks into 3-7 subtasks
- Creates detailed implementation steps
- Maintains dependency relationships
- Provides clearer development path

### Step 6: Final Review
```
/project:tm-list --with-subtasks
```
**Verify:**
- All complex tasks are expanded
- Subtasks are logical and actionable
- Dependencies are correct
- Ready for autonomous development

## Phase 4: Autonomous Development

### Option 1: Full Autonomous Mode (Recommended)
```
/project:tm-auto-cycle
```
**What happens:**
- Executes ALL available tasks automatically
- Follows dependency order
- Implements code with testing
- Commits after each completion
- Runs until project complete

**Best for:** Well-defined projects with clear requirements

### Option 2: Controlled Single-Task Mode
```
/project:tm-auto-dev
```
**What happens:**
- Executes next available task
- Complete implementation with testing
- Updates task status to done
- Waits for your command to continue

**Best for:** When you want oversight between tasks

### Option 3: Sprint-Based Development
```
/project:tm-sprint --priority high
```
**What happens:**
- Executes batch of related tasks
- Focuses on specific priority level
- Sprint planning and review
- Quality gates throughout

**Best for:** Feature-focused development sessions

### Option 4: Targeted Implementation
```
/project:tm-implement 5
```
**What happens:**
- Implements specific task by ID
- Handles all subtasks
- Complete testing workflow
- Updates status when done

**Best for:** Specific high-priority or blocked tasks

## Phase 5: Monitoring & Management

### Track Progress
```
/project:tm-list
/project:tm-next
```

### Check Specific Tasks
```
/project:tm-show 5
```

### Update Status Manually (if needed)
```
/project:tm-status 5 done
```

### Add New Tasks During Development
```
/project:tm-add "Handle edge case discovered during testing"
```

## Quality Assurance Features

**Automatic Quality Checks:**
- Runs existing tests after each task
- Checks for lint/type errors
- Validates no regressions
- Follows existing code patterns

**Safety Features:**
- Commits after each completed task
- Stops for manual review of critical tasks
- Validates changes before proceeding
- Creates backups before major changes

## Common Workflows

### Quick Start (15 minutes setup → autonomous development)
1. Install MCP: `claude mcp add task-master -s user -- npx -y --package=task-master-ai task-master-ai`
2. Create PRD file in your project directory
3. `/project:tm-parse-prd`
4. `/project:tm-expand-all`
5. `/project:tm-auto-cycle`

### Controlled Development (oversight between tasks)
1-4. Same setup steps as Quick Start  
5. Repeatedly run `/project:tm-auto-dev` with review between tasks

### Sprint-Based Development (focused sessions)
1-4. Same setup steps as Quick Start
5. `/project:tm-sprint --priority high` (work on critical tasks first)
6. `/project:tm-sprint --priority medium` (continue with medium priority)

## Troubleshooting

### Task Generation Issues
- **Too few tasks:** Make PRD more detailed
- **Tasks too vague:** Add technical specifications to PRD
- **Missing dependencies:** Manually add with `/project:tm-add-dependency`

### Development Issues
- **Task fails:** Check task details with `/project:tm-show [id]`
- **Tests failing:** Review implementation requirements
- **Blocked tasks:** Use `/project:tm-status [id] deferred` and continue with others

### Project Management
- **View all commands:** `/project:taskmaster`
- **Check project status:** `/project:tm-list`
- **Find next task:** `/project:tm-next`

## Best Practices

1. **PRD Quality:** Spend time creating a detailed, clear PRD
2. **Review Tasks:** Always review generated tasks before development
3. **Expand Complex:** Break down high-complexity tasks (scores ≥7)
4. **Start Simple:** Begin with high-priority, low-complexity tasks
5. **Monitor Progress:** Check task status regularly during development
6. **Quality First:** Let TaskMaster run tests and quality checks
7. **Iterative:** Add tasks as requirements evolve

## Expected Timeline

- **MCP Installation:** 1 minute
- **PRD Creation:** 10-15 minutes  
- **Task Setup (Phase 2-3):** 5-10 minutes
- **Development (Phase 4):** Autonomous (hours to days depending on project)
- **Total Hands-on Time:** 15-25 minutes setup, then autonomous execution

TaskMaster transforms months of manual development planning into minutes of setup, followed by autonomous AI-powered implementation.

---

## Quick Command Reference

### Core Workflow Commands
- `/project:tm-parse-prd` - Parse PRD and generate tasks
- `/project:tm-expand-all` - Break down complex tasks into subtasks  
- `/project:tm-auto-cycle` - Run full autonomous development cycle
- `/project:tm-list` - View all tasks and progress

### Task Management Commands
- `/project:tm-next` - Get next available task to work on
- `/project:tm-show [id]` - Show detailed task information
- `/project:tm-status [id] [status]` - Update task status
- `/project:tm-add [description]` - Add new task with AI structuring

### Development Commands
- `/project:tm-auto-dev` - Execute next task autonomously (single task)
- `/project:tm-implement [id]` - Implement specific task by ID
- `/project:tm-sprint` - Execute batch of tasks in sprint mode

### Analysis Commands
- `/project:tm-analyze` - Analyze task complexity
- `/project:tm-expand [id]` - Expand specific task into subtasks
- `/project:tm-complexity` - View complexity analysis report

All operations use TaskMaster MCP tools for optimal performance and integration.