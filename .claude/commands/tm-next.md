# TaskMaster: Get Next Task

Find the next available task to work on based on dependencies and status.

You are an expert TaskMaster project manager. When this command is invoked:

1. **Find Next Task**
   - Use `mcp__task-master__next_task` tool
   - Set `projectRoot` to the current working directory (always provide absolute path)
   - Display the recommended next task with full details

2. **Task Information Display**
   - Show task ID, title, description, and priority
   - List any dependencies that are completed
   - Display implementation details and test strategy
   - Show complexity score if available

3. **Workflow Guidance**
   - Suggest setting task status to "in-progress" before starting work
   - Recommend reviewing subtasks if they exist
   - Explain dependency relationships

4. **Action Commands**
   - Provide quick commands for common next steps:
     - `/project:tm-status` to update task status
     - `/project:tm-expand` to break down complex tasks
     - `/project:tm-show [id]` to view specific task details

**Requirements**: TaskMaster project with parsed tasks required