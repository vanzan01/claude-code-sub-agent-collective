# Implementation Guide: Vue 3 Component Architecture

**Guide Version:** 1.0
**Target Audience:** Implementation Agent, Senior Developers
**Complexity Level:** Intermediate

## Overview

This guide provides comprehensive instructions for implementing a scalable Vue 3 component architecture for the todo application using TypeScript, Composition API, and accessibility best practices.

## Prerequisites

- Vue 3.3.0+ with Composition API
- TypeScript 5.0+
- Vite build tool
- Basic understanding of Vue SFCs
- Familiarity with accessibility standards

## Architecture Overview

The component architecture follows a hierarchical pattern:

```
App.vue (Root)
├── TodoApp.vue (Main Container)
│   ├── TodoHeader.vue
│   │   └── TodoForm.vue
│   ├── TodoList.vue
│   │   └── TodoItem.vue
│   └── TodoFooter.vue
│       └── TodoFilters.vue
```

## Implementation Steps

### Phase 1: Foundation Components

#### Step 1: Create Base TodoItem Component

```vue
<!-- src/components/TodoItem.vue -->
<template>
  <li class="todo-item" :class="{ completed: todo.completed }">
    <div class="todo-content">
      <input
        :id="`todo-${todo.id}`"
        type="checkbox"
        :checked="todo.completed"
        @change="handleToggle"
        class="todo-toggle"
        :aria-label="`Mark '${todo.text}' as ${todo.completed ? 'incomplete' : 'complete'}`"
      />
      <label
        :for="`todo-${todo.id}`"
        class="todo-text"
        :class="{ completed: todo.completed }"
      >
        {{ todo.text }}
      </label>
    </div>
    <button
      @click="handleDelete"
      class="todo-delete"
      :aria-label="`Delete todo: ${todo.text}`"
      type="button"
    >
      ×
    </button>
  </li>
</template>

<script setup lang="ts">
import type { Todo } from '@/types'

interface Props {
  todo: Todo
}

interface Emits {
  toggle: [id: number]
  delete: [id: number]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function handleToggle() {
  emit('toggle', props.todo.id)
}

function handleDelete() {
  emit('delete', props.todo.id)
}
</script>

<style scoped>
.todo-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e5e5;
  background: white;
  transition: background-color 0.2s ease;
}

.todo-item:focus-within {
  background-color: #f8f9fa;
}

.todo-content {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 12px;
}

.todo-toggle {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.todo-text {
  flex: 1;
  cursor: pointer;
  font-size: 16px;
  line-height: 1.4;
  transition: all 0.2s ease;
}

.todo-text.completed {
  text-decoration: line-through;
  color: #6c757d;
}

.todo-delete {
  background: none;
  border: none;
  font-size: 24px;
  color: #dc3545;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.todo-delete:hover,
.todo-delete:focus {
  background-color: #f8d7da;
  outline: 2px solid #dc3545;
}
</style>
```

**Expected outcome:** Accessible todo item component with proper ARIA labels
**Validation:** Test keyboard navigation and screen reader compatibility

#### Step 2: Create TodoForm Component

```vue
<!-- src/components/TodoForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="todo-form">
    <div class="form-group">
      <label for="new-todo" class="visually-hidden">
        Add new todo item
      </label>
      <input
        id="new-todo"
        ref="inputRef"
        v-model="newTodoText"
        type="text"
        class="todo-input"
        placeholder="What needs to be done?"
        :aria-describedby="hasError ? 'todo-error' : 'todo-hint'"
        :aria-invalid="hasError"
        maxlength="200"
      />
      <button
        type="submit"
        class="add-button"
        :disabled="!canSubmit"
        aria-label="Add new todo"
      >
        Add
      </button>
    </div>
    <div id="todo-hint" class="form-hint">
      Press Enter or click Add to create a new todo
    </div>
    <div
      v-if="hasError"
      id="todo-error"
      class="error-message"
      role="alert"
      aria-live="polite"
    >
      {{ errorMessage }}
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'

interface Emits {
  submit: [text: string]
}

const emit = defineEmits<Emits>()

const inputRef = ref<HTMLInputElement>()
const newTodoText = ref('')
const errorMessage = ref('')

const hasError = computed(() => errorMessage.value.length > 0)
const canSubmit = computed(() => 
  newTodoText.value.trim().length > 0 && 
  newTodoText.value.trim().length <= 200
)

async function handleSubmit() {
  const trimmedText = newTodoText.value.trim()
  
  // Validation
  if (!trimmedText) {
    errorMessage.value = 'Todo text cannot be empty'
    return
  }
  
  if (trimmedText.length > 200) {
    errorMessage.value = 'Todo text cannot exceed 200 characters'
    return
  }
  
  // Clear error and submit
  errorMessage.value = ''
  emit('submit', trimmedText)
  newTodoText.value = ''
  
  // Refocus input for better UX
  await nextTick()
  inputRef.value?.focus()
}

// Clear error when user starts typing
function clearError() {
  if (hasError.value) {
    errorMessage.value = ''
  }
}

// Expose focus method for external use
defineExpose({
  focus: () => inputRef.value?.focus()
})
</script>

<style scoped>
.todo-form {
  padding: 16px;
  background: white;
  border-bottom: 1px solid #e5e5e5;
}

.form-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.todo-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e5e5e5;
  border-radius: 4px;
  font-size: 16px;
  transition: border-color 0.2s ease;
}

.todo-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.todo-input[aria-invalid="true"] {
  border-color: #dc3545;
}

.add-button {
  padding: 12px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.add-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.add-button:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.form-hint {
  font-size: 14px;
  color: #6c757d;
  margin-top: 4px;
}

.error-message {
  color: #dc3545;
  font-size: 14px;
  margin-top: 4px;
  font-weight: 500;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
```

### Phase 2: Container Components

#### Step 3: Create TodoList Component

```vue
<!-- src/components/TodoList.vue -->
<template>
  <div class="todo-list-container">
    <div
      v-if="todos.length === 0"
      class="empty-state"
      role="status"
      aria-live="polite"
    >
      <p>No todos yet. Add one above to get started!</p>
    </div>
    
    <ul
      v-else
      class="todo-list"
      role="list"
      :aria-label="`Todo list with ${todos.length} items`"
    >
      <TodoItem
        v-for="todo in todos"
        :key="todo.id"
        :todo="todo"
        @toggle="handleToggle"
        @delete="handleDelete"
      />
    </ul>
    
    <!-- Live region for announcements -->
    <div
      ref="announcementRef"
      class="visually-hidden"
      aria-live="polite"
      aria-atomic="true"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TodoItem from './TodoItem.vue'
import type { Todo } from '@/types'

interface Props {
  todos: Todo[]
}

interface Emits {
  toggle: [id: number]
  delete: [id: number]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const announcementRef = ref<HTMLElement>()

function handleToggle(id: number) {
  const todo = props.todos.find(t => t.id === id)
  if (todo) {
    const status = todo.completed ? 'incomplete' : 'complete'
    announce(`Todo marked as ${status}: ${todo.text}`)
  }
  emit('toggle', id)
}

function handleDelete(id: number) {
  const todo = props.todos.find(t => t.id === id)
  if (todo) {
    announce(`Todo deleted: ${todo.text}`)
  }
  emit('delete', id)
}

function announce(message: string) {
  if (announcementRef.value) {
    announcementRef.value.textContent = message
    // Clear after announcement
    setTimeout(() => {
      if (announcementRef.value) {
        announcementRef.value.textContent = ''
      }
    }, 1000)
  }
}
</script>

<style scoped>
.todo-list-container {
  flex: 1;
  overflow-y: auto;
}

.todo-list {
  list-style: none;
  margin: 0;
  padding: 0;
  background: white;
}

.empty-state {
  padding: 48px 24px;
  text-align: center;
  color: #6c757d;
  font-size: 18px;
}

.empty-state p {
  margin: 0;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
```

### Phase 3: Integration and Main Container

#### Step 4: Create Main TodoApp Component

```vue
<!-- src/components/TodoApp.vue -->
<template>
  <div class="todo-app">
    <header class="todo-header">
      <h1>Todo Application</h1>
      <TodoForm @submit="addTodo" />
    </header>
    
    <main class="todo-main">
      <TodoList
        :todos="filteredTodos"
        @toggle="toggleTodo"
        @delete="deleteTodo"
      />
    </main>
    
    <footer v-if="todos.length > 0" class="todo-footer">
      <div class="todo-stats" role="status">
        <span>{{ activeCount }} {{ activeCount === 1 ? 'item' : 'items' }} left</span>
      </div>
      
      <TodoFilters
        :current-filter="currentFilter"
        @filter-change="setFilter"
      />
      
      <button
        v-if="completedCount > 0"
        @click="clearCompleted"
        class="clear-completed"
        type="button"
      >
        Clear completed ({{ completedCount }})
      </button>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import TodoForm from './TodoForm.vue'
import TodoList from './TodoList.vue'
import TodoFilters from './TodoFilters.vue'
import { useTodos } from '@/composables/useTodos'
import type { FilterType } from '@/types'

const {
  todos,
  addTodo,
  toggleTodo,
  deleteTodo,
  clearCompleted,
  currentFilter,
  setFilter,
  filteredTodos
} = useTodos()

const activeCount = computed(() => 
  todos.value.filter(todo => !todo.completed).length
)

const completedCount = computed(() => 
  todos.value.filter(todo => todo.completed).length
)
</script>

<style scoped>
.todo-app {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.2),
              0 25px 50px 0 rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  min-height: 400px;
}

.todo-header {
  background: #f8f9fa;
  border-bottom: 1px solid #e5e5e5;
}

.todo-header h1 {
  margin: 0;
  padding: 24px 16px 8px;
  font-size: 32px;
  font-weight: 300;
  text-align: center;
  color: #333;
}

.todo-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.todo-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f8f9fa;
  border-top: 1px solid #e5e5e5;
  font-size: 14px;
  flex-wrap: wrap;
  gap: 12px;
}

.todo-stats {
  color: #6c757d;
}

.clear-completed {
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  text-decoration: underline;
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.clear-completed:hover,
.clear-completed:focus {
  color: #dc3545;
  background-color: rgba(220, 53, 69, 0.1);
  outline: 2px solid #dc3545;
}

@media (max-width: 480px) {
  .todo-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .todo-stats {
    text-align: center;
  }
}
</style>
```

## Code Patterns and Examples

### Pattern 1: Composable Integration

```typescript
// src/composables/useTodos.ts
import { ref, computed, watch } from 'vue'
import type { Todo, FilterType } from '@/types'

export function useTodos() {
  const todos = ref<Todo[]>(loadFromStorage())
  const currentFilter = ref<FilterType>('all')
  
  // Computed properties
  const filteredTodos = computed(() => {
    switch (currentFilter.value) {
      case 'active':
        return todos.value.filter(todo => !todo.completed)
      case 'completed':
        return todos.value.filter(todo => todo.completed)
      default:
        return todos.value
    }
  })
  
  // Actions
  function addTodo(text: string) {
    const newTodo: Todo = {
      id: Date.now(),
      text: text.trim(),
      completed: false
    }
    todos.value.push(newTodo)
  }
  
  // Auto-save
  watch(todos, (newTodos) => {
    saveToStorage(newTodos)
  }, { deep: true })
  
  return {
    todos,
    currentFilter,
    filteredTodos,
    addTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
    setFilter
  }
}
```

### Pattern 2: TypeScript Interface Definitions

```typescript
// src/types/index.ts
export interface Todo {
  id: number
  text: string
  completed: boolean
}

export type FilterType = 'all' | 'active' | 'completed'

export interface TodoFormEmits {
  submit: [text: string]
}

export interface TodoItemEmits {
  toggle: [id: number]
  delete: [id: number]
}
```

## Common Pitfalls and Solutions

### Pitfall 1: Missing Key Bindings
**Problem:** Keyboard users can't efficiently navigate the todo list
**Solution:** Implement arrow key navigation and keyboard shortcuts

```typescript
// Add to TodoList component
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    // Focus management logic
  }
}
```

### Pitfall 2: Screen Reader Announcements
**Problem:** Dynamic changes aren't announced to screen readers
**Solution:** Use live regions and proper ARIA attributes

```vue
<div 
  role="status" 
  aria-live="polite" 
  class="visually-hidden"
>
  {{ statusMessage }}
</div>
```

## Performance Considerations

1. **Component Virtualization:** For large todo lists (>100 items), implement virtual scrolling
2. **Debounced Storage:** Debounce localStorage writes to prevent excessive saves
3. **Lazy Loading:** Use dynamic imports for non-critical components

## Security Considerations

1. **Input Sanitization:** Sanitize todo text to prevent XSS
2. **Content Security Policy:** Configure CSP headers
3. **Storage Validation:** Validate data loaded from localStorage

## Quality Checklist

- [ ] All components have proper TypeScript types
- [ ] ARIA attributes implemented correctly
- [ ] Keyboard navigation works throughout
- [ ] Screen reader compatibility verified
- [ ] Form validation provides clear feedback
- [ ] Error states handled gracefully
- [ ] Responsive design works on mobile
- [ ] Performance optimized for large lists

## References

- [Vue 3 Component Basics](https://vuejs.org/guide/essentials/component-basics.html)
- [Vue 3 TypeScript Support](https://vuejs.org/guide/typescript/overview.html)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Vue Accessibility Guide](https://vue-a11y.com/)