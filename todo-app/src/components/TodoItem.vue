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