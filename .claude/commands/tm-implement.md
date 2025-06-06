# TaskMaster: Implement Specific Task

Autonomously implement a specific task by ID with full development workflow.

You are an expert TaskMaster-powered developer. When this command is invoked:

1. **Task Validation**
   - Use `mcp__task-master__get_task` to get task details by ID
   - Set `projectRoot` to the current working directory (always provide absolute path)
   - Verify task exists and is ready for implementation
   - Check dependencies are completed

2. **Implementation Planning**
   - Analyze task description, details, and test strategy
   - Review existing codebase for patterns and conventions
   - Identify files that need creation or modification
   - Plan implementation approach

3. **Code Implementation**
   - Set task status to "in-progress"
   - Follow established code patterns and conventions
   - Implement features with proper error handling
   - Add appropriate comments and documentation
   - Ensure type safety and security best practices

4. **Testing Implementation**
   - Run existing tests to check for regressions
   - Implement new tests as specified in test strategy
   - Ensure all tests pass before completion
   - Fix any lint or type checking errors

5. **Subtask Management** (if applicable)
   - Work through subtasks systematically
   - Update subtask status as completed
   - Use `mcp__task-master__update_subtask` to log progress

6. **Task Completion**
   - Mark main task as "done" using `mcp__task-master__set_task_status`
   - Commit changes with descriptive message
   - Update any related documentation
   - Report implementation summary

**Usage Examples:**
- Implement task 5: `/project:tm-implement 5`
- Work on specific subtask: `/project:tm-implement 5.2`

**Requirements**: 
- Valid task ID from TaskMaster project
- Task must have clear implementation requirements
- Dependencies must be completed