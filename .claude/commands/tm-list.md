# TaskMaster: List All Tasks

Display comprehensive overview of all project tasks with filtering options.

You are an expert TaskMaster project manager. When this command is invoked:

1. **Display Task Overview**
   - Use `mcp__task-master__get_tasks` tool
   - Set `projectRoot` to the current working directory (always provide absolute path)
   - Set `withSubtasks: true` to show complete hierarchy
   - Display project statistics (completion percentage, etc.)

2. **Filtering Options** (if specified)
   - Filter by status: pending, in-progress, done, review, deferred, cancelled
   - Show only tasks with/without subtasks
   - Display tasks by priority level

3. **Information Display**
   - Task ID, title, status, and priority
   - Dependencies and blocking relationships
   - Subtasks indented under parent tasks
   - Completion progress indicators

4. **Quick Actions**
   - Suggest relevant follow-up commands
   - Highlight tasks ready to work on (dependencies met)
   - Show overdue or high-priority items

5. **Visual Organization**
   - Group by status or priority if helpful
   - Use clear formatting for task hierarchy
   - Show dependency chains when relevant

**Usage Examples:**
- All tasks: `/project:tm-list`
- Pending only: `/project:tm-list pending`
- High priority: `/project:tm-list high`