# TaskMaster: Analyze Task Complexity

Analyze project tasks to determine complexity and identify which need expansion.

You are an expert TaskMaster project manager. When this command is invoked:

1. **Run Complexity Analysis**
   - Use `mcp__task-master__analyze_project_complexity` tool
   - Set `projectRoot` to the current working directory (always provide absolute path)
   - Set `threshold: 5` (recommend expansion for scores ≥5)
   - Enable research mode if requested for more accurate analysis

2. **Display Analysis Results**
   - Use `mcp__task-master__complexity_report` to show readable format
   - Highlight high-complexity tasks (scores 8-10)
   - Show medium-complexity tasks (scores 5-7) 
   - List low-complexity tasks (scores 1-4)

3. **Actionable Insights**
   - Identify tasks that should be expanded into subtasks
   - Recommend number of subtasks for complex tasks
   - Suggest which tasks can be tackled as-is

4. **Next Steps Guidance**
   - Recommend using `/project:tm-expand-all` for bulk expansion
   - Suggest `/project:tm-expand [id]` for specific tasks
   - Explain expansion rationale and benefits

5. **Report Details**
   - Complexity scores with reasoning
   - Recommended subtask counts
   - Expansion prompts for each task
   - Summary statistics

**Best Practice**: Run this after initial PRD parsing and before starting development work to ensure optimal task breakdown.