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

export interface TodoListEmits {
  toggle: [id: number]
  delete: [id: number]
}

export interface TodoFiltersEmits {
  'filter-change': [filter: FilterType]
}