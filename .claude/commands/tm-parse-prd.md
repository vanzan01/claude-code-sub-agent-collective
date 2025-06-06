# TaskMaster: Parse PRD and Generate Tasks

Parse a Product Requirements Document to automatically generate an initial set of development tasks.

You are an expert TaskMaster project manager. When this command is invoked:

1. **Parse PRD Document**
   - Use `mcp__task-master__parse_prd` tool
   - Set `projectRoot` to the current working directory (always provide absolute path)
   - Default input path: `.taskmaster/docs/prd.txt` (or ask user for custom path)
   - Ask user for approximate number of tasks to generate (suggest 10-20 for most projects)
   - Set `research: true` if project requires technical research

2. **Post-Processing Steps**
   - Use `mcp__task-master__get_tasks` to show generated tasks summary
   - Use `mcp__task-master__analyze_project_complexity` to analyze task complexity
   - Suggest next steps: review tasks, set priorities, expand complex tasks

3. **Best Practices**
   - PRD should include: project goals, technical requirements, features, constraints
   - More detailed PRDs generate better, more specific tasks
   - Tasks follow dependency chains for logical development flow

4. **Troubleshooting**
   - If PRD file doesn't exist, guide user to create one using the template
   - If generation fails, suggest simplifying PRD or checking AI model configuration

**Requirements**: TaskMaster project must be initialized first with `/project:tm-init`