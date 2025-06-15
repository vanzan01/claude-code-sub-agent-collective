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
        @input="clearError"
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