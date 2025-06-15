import { ref, watch, computed, onMounted } from 'vue'
import { TodoRepository } from '@/repositories/TodoRepository'
import type { Todo, FilterType } from '@/types'
import type { StorageResult } from '@/services/storage/types'

export function useTodos() {
  const todoRepository = new TodoRepository()
  
  // State
  const todos = ref<Todo[]>([])
  const currentFilter = ref<FilterType>('all')
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const storageInfo = ref({ usage: 0, available: true })

  // Computed
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

  const activeCount = computed(() => 
    todos.value.filter(todo => !todo.completed).length
  )

  const completedCount = computed(() => 
    todos.value.filter(todo => todo.completed).length
  )

  // Actions
  async function loadTodos(): Promise<void> {
    isLoading.value = true
    error.value = null
    
    try {
      const result = await todoRepository.loadTodos()
      
      if (result.success) {
        todos.value = result.data || []
      } else {
        handleStorageError(result)
      }
      
    } catch (err) {
      error.value = 'Failed to load todos'
    } finally {
      isLoading.value = false
    }
  }

  async function saveTodos(): Promise<void> {
    try {
      const result = await todoRepository.saveTodos(todos.value)
      
      if (!result.success) {
        handleStorageError(result)
      }
      
    } catch (err) {
      error.value = 'Failed to save todos'
    }
  }

  function addTodo(text: string): void {
    const newTodo: Todo = {
      id: Date.now(),
      text: text.trim(),
      completed: false
    }
    todos.value.push(newTodo)
  }

  function toggleTodo(id: number): void {
    const todo = todos.value.find(t => t.id === id)
    if (todo) {
      todo.completed = !todo.completed
    }
  }

  function deleteTodo(id: number): void {
    todos.value = todos.value.filter(todo => todo.id !== id)
  }

  function clearCompleted(): void {
    todos.value = todos.value.filter(todo => !todo.completed)
  }

  function setFilter(filter: FilterType): void {
    currentFilter.value = filter
  }

  async function clearAllTodos(): Promise<void> {
    try {
      const result = await todoRepository.clearTodos()
      
      if (result.success) {
        todos.value = []
      } else {
        handleStorageError(result)
      }
      
    } catch (err) {
      error.value = 'Failed to clear todos'
    }
  }

  async function refreshStorageInfo(): Promise<void> {
    try {
      const result = await todoRepository.getStorageInfo()
      
      if (result.success) {
        storageInfo.value = result.data!
      }
      
    } catch (err) {
      console.warn('Failed to get storage info:', err)
    }
  }

  function handleStorageError(result: StorageResult<any>): void {
    if (result.error) {
      switch (result.error.type) {
        case 'QUOTA_EXCEEDED':
          error.value = 'Storage is full. Please delete some items.'
          break
        case 'ACCESS_DENIED':
          error.value = 'Storage access denied. Data will not be saved.'
          break
        case 'CORRUPTED_DATA':
          error.value = 'Data corruption detected. Attempting recovery...'
          break
        default:
          error.value = result.error.message || 'Unknown storage error'
      }
    }
  }

  function clearError(): void {
    error.value = null
  }

  // Auto-save when todos change
  watch(todos, () => {
    saveTodos()
  }, { deep: true })

  // Load todos on mount
  onMounted(async () => {
    await loadTodos()
    await refreshStorageInfo()
  })

  return {
    // State
    todos,
    currentFilter,
    isLoading,
    error,
    storageInfo,
    
    // Computed
    filteredTodos,
    activeCount,
    completedCount,
    
    // Actions
    addTodo,
    toggleTodo,
    deleteTodo,
    clearCompleted,
    setFilter,
    clearAllTodos,
    refreshStorageInfo,
    clearError
  }
}