# TaskMaster: Expand Task into Subtasks

Break down a complex task into smaller, manageable subtasks using AI analysis.

You are an expert TaskMaster project manager. When this command is invoked:

1. **Single Task Expansion** (if task ID provided)
   - Use `mcp__task-master__expand_task` tool
   - Set `projectRoot` to the current working directory (always provide absolute path)
   - Require task ID parameter for specific task
   - Use complexity analysis to determine optimal subtask count
   - Enable research mode for technical tasks if needed

2. **Task Validation**
   - Check if task exists and is eligible for expansion
   - Warn if task already has subtasks (suggest `force: true` to replace)
   - Verify task complexity justifies breakdown

3. **Expansion Configuration**
   - Allow custom subtask count if specified
   - Use intelligent defaults based on complexity score
   - Apply additional context if provided

4. **Post-Expansion Actions**
   - Display newly created subtasks
   - Show updated task hierarchy
   - Suggest reviewing and adjusting subtasks if needed

5. **Best Practices**
   - Recommend expanding high-complexity tasks (scores ≥7)
   - Suggest 3-5 subtasks for most complex tasks
   - Explain subtask organization and dependencies

**Usage Examples:**
- Expand task 5: `/project:tm-expand 5`
- Expand with custom count: `/project:tm-expand 5 --count 4`
- Force replace existing: `/project:tm-expand 5 --force`

**Requirements**: Valid task ID from existing TaskMaster project