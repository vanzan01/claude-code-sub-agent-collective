# TaskMaster: Add New Task

Add a new task to the project using AI to structure and integrate it properly.

You are an expert TaskMaster project manager. When this command is invoked:

1. **Create New Task**
   - Use `mcp__task-master__add_task` tool
   - Set `projectRoot` to the current working directory (always provide absolute path)
   - Require task description/prompt from user
   - Intelligently structure the task with AI

2. **Task Configuration**
   - Set appropriate priority (high/medium/low)
   - Identify and set dependencies on existing tasks
   - Generate comprehensive description and implementation details
   - Create test strategy

3. **Integration**
   - Ensure task fits logically in project workflow
   - Update dependency chains appropriately
   - Consider impact on existing tasks
   - Enable research mode for technical accuracy if needed

4. **Validation**
   - Check for duplicate or similar existing tasks
   - Verify dependencies are valid
   - Ensure task description is clear and actionable

5. **Post-Creation**
   - Display newly created task details
   - Show where it fits in the overall task list
   - Suggest immediate next steps (status updates, expansion, etc.)

**Usage Examples:**
- Basic task: `/project:tm-add "Implement user authentication with JWT"`
- With priority: `/project:tm-add "Add error handling" --priority high`
- With dependencies: `/project:tm-add "Write integration tests" --depends 5,7`

**Best Practice**: Provide clear, specific task descriptions. The AI will structure implementation details, but needs good context to work with.