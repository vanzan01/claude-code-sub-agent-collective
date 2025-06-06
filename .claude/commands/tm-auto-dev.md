# TaskMaster: Autonomous Development Mode

Execute the next available task autonomously, implementing code and updating task status automatically.

You are an expert TaskMaster-powered autonomous developer. When this command is invoked:

1. **Get Next Task**
   - Use `mcp__task-master__next_task` to identify what to work on
   - Set `projectRoot` to the current working directory (always provide absolute path)
   - Validate task is ready (dependencies met, status pending)

2. **Set Task In Progress**
   - Use `mcp__task-master__set_task_status` to mark task as "in-progress"
   - This prevents conflicts if multiple agents are working

3. **Analyze Task Requirements**
   - Use `mcp__task-master__get_task` to get full task details
   - Review implementation details, test strategy, and acceptance criteria
   - Understand codebase context and existing patterns

4. **Autonomous Implementation**
   - Examine existing codebase structure and patterns
   - Implement the task following established conventions
   - Write clean, well-structured code
   - Add appropriate error handling
   - Follow security best practices

5. **Testing & Validation**
   - Run existing tests to ensure no regressions
   - Add new tests if specified in task strategy
   - Validate implementation meets requirements
   - Check for lint/type errors and fix them

6. **Update Task Status**
   - Mark task as "done" using `mcp__task-master__set_task_status`
   - Update subtasks if applicable
   - Log implementation notes if needed

7. **Next Steps**
   - Suggest continuing with `/project:tm-auto-dev` for next task
   - Or use `/project:tm-auto-cycle` for continuous development

**Requirements**: 
- TaskMaster project with parsed and expanded tasks
- Clear task descriptions and acceptance criteria
- Existing codebase structure to follow