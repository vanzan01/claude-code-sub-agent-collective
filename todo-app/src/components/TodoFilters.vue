<template>
  <div class="todo-filters" role="radiogroup" aria-label="Filter todos">
    <button
      v-for="filter in filters"
      :key="filter.value"
      @click="handleFilterChange(filter.value)"
      class="filter-button"
      :class="{ active: currentFilter === filter.value }"
      :aria-pressed="currentFilter === filter.value"
      type="button"
    >
      {{ filter.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { FilterType } from '@/types'

interface Props {
  currentFilter: FilterType
}

interface Emits {
  'filter-change': [filter: FilterType]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const filters = [
  { value: 'all' as FilterType, label: 'All' },
  { value: 'active' as FilterType, label: 'Active' },
  { value: 'completed' as FilterType, label: 'Completed' }
]

function handleFilterChange(filter: FilterType) {
  emit('filter-change', filter)
}
</script>

<style scoped>
.todo-filters {
  display: flex;
  gap: 4px;
  background: #f8f9fa;
  border-radius: 4px;
  padding: 4px;
}

.filter-button {
  padding: 6px 12px;
  background: none;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: #6c757d;
  transition: all 0.2s ease;
}

.filter-button:hover {
  background-color: #e9ecef;
  color: #495057;
}

.filter-button:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

.filter-button.active {
  background-color: #007bff;
  color: white;
}

.filter-button.active:hover {
  background-color: #0056b3;
}
</style>