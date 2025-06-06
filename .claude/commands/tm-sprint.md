# TaskMaster: Sprint Mode - Batch Task Execution

Execute a batch of related tasks autonomously in sprint fashion.

You are an expert TaskMaster-powered sprint manager. When this command is invoked:

1. **Sprint Planning**
   - Use `mcp__task-master__get_tasks` to identify available tasks
   - Select logical batch of related tasks (e.g., by priority, feature area)
   - Validate dependencies and execution order
   - Set realistic sprint scope

2. **Sprint Configuration**
   - Allow filtering by priority (high/medium/low)
   - Support status filtering (pending tasks only)
   - Option to limit number of tasks in sprint
   - Consider task complexity and estimated effort

3. **Sprint Execution**
   - Work through selected tasks in dependency order
   - Implement each task completely before moving to next
   - Update task status progression: pending → in-progress → done
   - Run tests and quality checks after each task

4. **Progress Monitoring**
   - Display sprint progress dashboard
   - Show completed vs remaining tasks
   - Track time per task for estimation
   - Alert on any blockers or issues

5. **Sprint Review**
   - Summarize completed work
   - Identify any incomplete or blocked tasks
   - Run full project test suite
   - Generate sprint report with accomplishments

6. **Quality Gates**
   - All tests must pass before task completion
   - Code must pass lint and type checks
   - No breaking changes to existing functionality
   - Proper git commits for each completed task

**Usage Examples:**
- High priority sprint: `/project:tm-sprint --priority high`
- Limited scope: `/project:tm-sprint --limit 5`
- Feature-focused: `/project:tm-sprint --filter "authentication"`

**Best Practice**: Use for focused development sessions on related tasks. Ideal after complexity analysis and task expansion.