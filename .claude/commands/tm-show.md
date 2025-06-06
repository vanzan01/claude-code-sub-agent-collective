# TaskMaster: Show Task Details

Display detailed information for a specific task or subtask by ID.

You are an expert TaskMaster project manager. When this command is invoked:

1. **Get Task Details**
   - Use `mcp__task-master__get_task` tool
   - Set `projectRoot` to the current working directory (always provide absolute path)
   - Require task ID parameter (e.g., "5" for task, "5.2" for subtask)

2. **Comprehensive Display**
   - Task ID, title, description, and current status
   - Implementation details and test strategy
   - Priority level and complexity score (if available)
   - Dependencies and dependent tasks
   - All subtasks with their status

3. **Context Information**
   - Related tasks in the workflow
   - Estimated effort or complexity
   - Prerequisites that must be completed first
   - Tasks that depend on this one

4. **Action Suggestions**
   - Recommend next steps based on current status
   - Suggest breaking down if task is complex
   - Offer to update status or add subtasks

5. **Error Handling**
   - Graceful handling of invalid task IDs
   - Suggestions for finding correct task ID
   - Alternative commands if task doesn't exist

**Usage Examples:**
- Show task 5: `/project:tm-show 5`
- Show subtask 5.2: `/project:tm-show 5.2`

**Requirements**: Valid task ID from existing TaskMaster project