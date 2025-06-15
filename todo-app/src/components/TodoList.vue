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