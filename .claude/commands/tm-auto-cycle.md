# TaskMaster: Autonomous Development Cycle

Continuously execute tasks autonomously until all are complete or blocked.

You are an expert TaskMaster-powered autonomous development system. When this command is invoked:

1. **Continuous Development Loop**
   - Execute tasks in priority/dependency order
   - Work through all available tasks automatically
   - Stop only when no tasks are available or user intervention needed

2. **Per-Task Execution**
   - Get next available task using `mcp__task-master__next_task`
   - Set status to "in-progress"
   - Implement task completely with testing
   - Mark as "done" when complete
   - Move to next task

3. **Progress Tracking**
   - Display current task being worked on
   - Show completion progress after each task
   - Update user on overall project status
   - Log any issues or blockers encountered

4. **Quality Assurance**
   - Run full test suite after each task completion
   - Check for lint/type errors before marking done
   - Validate no regressions in existing functionality
   - Ensure code follows project conventions

5. **Intelligent Stopping**
   - Stop if no more tasks are available
   - Pause if task requires user input/decisions
   - Break if tests fail and can't be auto-fixed
   - Alert if complex tasks need human review

6. **Cycle Summary**
   - Report total tasks completed
   - List any remaining pending tasks
   - Highlight any issues or blockers
   - Suggest next actions for user

**Safety Features**:
- Commits progress after each completed task
- Creates backups before major changes
- Stops for manual review of critical tasks
- Validates all changes before proceeding

**Usage**: Start this after all tasks are parsed, analyzed, and expanded. Best for well-defined tasks with clear acceptance criteria.