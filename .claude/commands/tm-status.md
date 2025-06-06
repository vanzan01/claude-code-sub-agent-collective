# TaskMaster: Update Task Status

Update the status of tasks and subtasks to track development progress.

You are an expert TaskMaster project manager. When this command is invoked:

1. **Get Current Task Status**
   - Use `mcp__task-master__get_tasks` to show current task overview
   - Display tasks filtered by status if requested
   - Show completion statistics

2. **Update Task Status** (if task ID provided)
   - Use `mcp__task-master__set_task_status` tool
   - Set `projectRoot` to the current working directory (always provide absolute path)
   - Valid statuses: pending, in-progress, done, review, deferred, cancelled
   - Support multiple task IDs (comma-separated)

3. **Status Guidelines**
   - **pending**: Ready to work on (dependencies met)
   - **in-progress**: Currently being worked on
   - **done**: Completed and tested
   - **review**: Needs code review or testing
   - **deferred**: Postponed for later
   - **cancelled**: No longer needed

4. **Workflow Integration**
   - Auto-suggest next available tasks after marking current as done
   - Validate dependencies before allowing status changes
   - Show impact on dependent tasks

**Usage Examples:**
- View all tasks: `/project:tm-status`
- Update single task: `/project:tm-status 5 done`
- Update multiple: `/project:tm-status 5,6,7 done`