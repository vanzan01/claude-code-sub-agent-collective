# ADR-002: State Management Strategy

**Status:** Accepted
**Date:** 2025-06-15
**Authors:** Research Agent
**Tags:** architecture, state-management, composition-api

## Context

The todo application requires state management for CRUD operations, filtering, and local storage persistence. The solution must integrate well with Vue 3, support TypeScript, and provide a testing-friendly architecture.

## Decision Drivers

- Simplicity over complexity for small application scope
- TypeScript support and type inference
- Local storage integration ease
- Testing capabilities and patterns
- Performance characteristics for frequent updates
- Minimal boilerplate and configuration
- Maintainability for small team

## Considered Options

### 1. Pinia (Official Vue Store)
- **Pros:** 
  - Official Vue recommendation
  - Excellent TypeScript support
  - Plugin system for persistence
  - Good testing utilities
- **Cons:** 
  - Additional dependency for simple app
  - Store concepts may be overkill
- **Implementation effort:** Medium

### 2. Vuex (Legacy Store)
- **Pros:** 
  - Mature and stable
  - Comprehensive documentation
- **Cons:** 
  - More boilerplate than needed
  - Legacy status in Vue 3
  - Complex TypeScript setup
- **Implementation effort:** High

### 3. Composition API with Local Storage
- **Pros:** 
  - No additional dependencies
  - Perfect TypeScript integration
  - Direct local storage control
  - Simplest testing approach
  - Minimal overhead
- **Cons:** 
  - No built-in dev tools
  - Manual persistence implementation
- **Implementation effort:** Low

## Decision Outcome

**Chosen Option:** Composition API with Local Storage

**Rationale:** For a simple todo application, the Composition API provides all necessary state management capabilities without additional complexity. Direct local storage integration offers better control and simpler testing patterns.

## Implementation Guidance

- Create `useTodos` composable for main state management
- Use `ref` and `reactive` for state containers
- Implement `watch` for automatic persistence
- Use `readonly` to prevent external mutations
- Structure composables by feature domain

### Core Implementation Pattern:

```typescript
// src/composables/useTodos.ts
interface TodoItem {
  id: number
  text: string
  completed: boolean
}

export function useTodos() {
  const todos = ref<TodoItem[]>(
    JSON.parse(localStorage.getItem('todos') || '[]')
  )

  function addTodo(text: string) {
    const newTodo: TodoItem = {
      id: Date.now(),
      text,
      completed: false
    }
    todos.value.push(newTodo)
  }

  function removeTodo(id: number) {
    todos.value = todos.value.filter(todo => todo.id !== id)
  }

  function toggleTodo(id: number) {
    const todo = todos.value.find(t => t.id === id)
    if (todo) todo.completed = !todo.completed
  }

  // Auto-save to localStorage
  watch(todos, (newTodos) => {
    localStorage.setItem('todos', JSON.stringify(newTodos))
  }, { deep: true })

  return {
    todos: readonly(todos),
    addTodo,
    removeTodo,
    toggleTodo
  }
}
```

## Consequences

- **Positive:** 
  - Minimal complexity and learning curve
  - Perfect TypeScript integration
  - Easy to test individual functions
  - Direct control over persistence
  - No framework lock-in for state logic
- **Negative:** 
  - Manual implementation of advanced features
  - No built-in debugging tools
  - Requires careful design for larger apps
- **Neutral:** 
  - Migration to Pinia possible if app grows
  - Standard Vue patterns throughout

## Validation Criteria

- [ ] State updates trigger reactive UI changes
- [ ] Local storage persistence working correctly
- [ ] All state functions are unit testable
- [ ] TypeScript types are properly inferred
- [ ] No memory leaks in watch handlers

## References

- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Vue Reactivity Fundamentals](https://vuejs.org/guide/essentials/reactivity-fundamentals.html)
- [Research Analysis: State Management Evaluation](../2025-06-15_state-management-evaluation-for-vue-3-todo-applica.md)