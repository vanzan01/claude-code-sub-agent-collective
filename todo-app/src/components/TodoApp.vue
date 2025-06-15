<template>
  <div class="todo-app">
    <header class="todo-header">
      <h1>Todo Application</h1>
      <TodoForm @submit="addTodo" />
    </header>
    
    <!-- Error Display -->
    <div
      v-if="error"
      class="error-banner"
      role="alert"
      aria-live="polite"
    >
      <p>{{ error }}</p>
      <button @click="clearError" class="error-close" aria-label="Dismiss error">×</button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state" role="status" aria-live="polite">
      <p>Loading todos...</p>
    </div>
    
    <main v-else class="todo-main">
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

    <!-- Storage Info (Debug - can be removed in production) -->
    <div v-if="!storageInfo.available" class="storage-warning" role="alert">
      <p>⚠️ Local storage is not available. Your todos will not be saved.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import TodoForm from './TodoForm.vue'
import TodoList from './TodoList.vue'
import TodoFilters from './TodoFilters.vue'
import { useTodos } from '@/composables/useTodos'

const {
  todos,
  filteredTodos,
  currentFilter,
  isLoading,
  error,
  storageInfo,
  activeCount,
  completedCount,
  addTodo,
  toggleTodo,
  deleteTodo,
  clearCompleted,
  setFilter,
  clearError
} = useTodos()
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
  border-radius: 8px;
  overflow: hidden;
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

.error-banner {
  background-color: #f8d7da;
  color: #721c24;
  padding: 12px 16px;
  border-bottom: 1px solid #f5c6cb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.error-banner p {
  margin: 0;
  flex: 1;
}

.error-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #721c24;
  cursor: pointer;
  padding: 4px 8px;
  margin-left: 12px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.error-close:hover,
.error-close:focus {
  background-color: rgba(114, 28, 36, 0.1);
  outline: 2px solid #721c24;
}

.loading-state {
  padding: 48px 24px;
  text-align: center;
  color: #6c757d;
  font-size: 18px;
}

.loading-state p {
  margin: 0;
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

.storage-warning {
  background-color: #fff3cd;
  color: #856404;
  padding: 12px 16px;
  border-top: 1px solid #ffeaa7;
  text-align: center;
}

.storage-warning p {
  margin: 0;
  font-size: 14px;
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