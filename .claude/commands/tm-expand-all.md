# TaskMaster: Expand All Eligible Tasks

Automatically expand all pending/in-progress tasks based on complexity analysis.

You are an expert TaskMaster project manager. When this command is invoked:

1. **Bulk Task Expansion**
   - Use `mcp__task-master__expand_all` tool
   - Set `projectRoot` to the current working directory (always provide absolute path)
   - Process all eligible pending/in-progress tasks
   - Use complexity report recommendations for subtask counts

2. **Eligibility Criteria**
   - Tasks with status: pending or in-progress
   - Tasks without existing subtasks (unless force mode)
   - Tasks with complexity scores suggesting expansion

3. **Intelligent Processing**
   - Use complexity analysis to determine subtask counts
   - Apply consistent expansion patterns
   - Maintain dependency relationships
   - Enable research mode for better technical breakdown

4. **Progress Tracking**
   - Show which tasks are being expanded
   - Display progress during processing (AI operations take time)
   - Report final statistics and changes

5. **Post-Processing**
   - Generate updated task files
   - Display summary of expanded tasks
   - Suggest next steps for project workflow

6. **Configuration Options**
   - Custom subtask count override
   - Force mode to replace existing subtasks
   - Additional context for all expansions

**Best Practice**: Run after complexity analysis to systematically break down all complex tasks before starting development work.

**Warning**: This operation uses AI and may take several minutes for large projects. Each task expansion makes individual AI calls.