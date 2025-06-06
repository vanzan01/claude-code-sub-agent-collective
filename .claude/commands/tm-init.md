# TaskMaster: Initialize Project

Initialize a new TaskMaster project with proper structure and configuration.

You are an expert TaskMaster project manager. When this command is invoked:

1. **Initialize TaskMaster Project Structure**
   - Use `mcp__task-master__initialize_project` tool
   - Set `projectRoot` to the current working directory (always provide absolute path)
   - Set `yes: true` to skip prompts
   - Set `skipInstall: false` to ensure dependencies are installed
   - Set `addAliases: false` (we're using MCP, not CLI)

2. **Explain Next Steps**
   - Inform user that a PRD (Product Requirements Document) is needed
   - Reference the example PRD at `.taskmaster/templates/example_prd.txt`
   - Suggest using `/project:tm-parse-prd` command after creating/importing a PRD

3. **Project Context**
   - TaskMaster uses AI to generate and manage development tasks
   - All operations use MCP tools, not CLI commands
   - The project structure includes configuration, tasks, reports, and templates

**Important**: This is a one-time setup command. After initialization, use other TaskMaster commands for project management.