import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import TodoItem from '../TodoItem.vue'
import type { Todo } from '@/types'

describe('TodoItem', () => {
  const mockTodo: Todo = {
    id: 1,
    text: 'Test todo item',
    completed: false
  }

  it('renders todo item correctly', () => {
    const wrapper = mount(TodoItem, {
      props: { todo: mockTodo }
    })

    expect(wrapper.text()).toContain('Test todo item')
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true)
    expect(wrapper.find('button').exists()).toBe(true)
  })

  it('displays completed state correctly', () => {
    const completedTodo: Todo = { ...mockTodo, completed: true }
    const wrapper = mount(TodoItem, {
      props: { todo: completedTodo }
    })

    expect((wrapper.find('input[type="checkbox"]').element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.find('.todo-text').classes()).toContain('completed')
  })

  it('emits toggle event when checkbox is clicked', async () => {
    const wrapper = mount(TodoItem, {
      props: { todo: mockTodo }
    })

    await wrapper.find('input[type="checkbox"]').trigger('change')
    expect(wrapper.emitted('toggle')).toBeTruthy()
    expect(wrapper.emitted('toggle')![0]).toEqual([1])
  })

  it('emits delete event when delete button is clicked', async () => {
    const wrapper = mount(TodoItem, {
      props: { todo: mockTodo }
    })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('delete')).toBeTruthy()
    expect(wrapper.emitted('delete')![0]).toEqual([1])
  })

  it('has proper accessibility attributes', () => {
    const wrapper = mount(TodoItem, {
      props: { todo: mockTodo }
    })

    const checkbox = wrapper.find('input[type="checkbox"]')
    const label = wrapper.find('label')
    const deleteButton = wrapper.find('button')

    expect(checkbox.attributes('id')).toBe('todo-1')
    expect(checkbox.attributes('aria-label')).toContain('Test todo item')
    expect(label.attributes('for')).toBe('todo-1')
    expect(deleteButton.attributes('aria-label')).toContain('Delete todo: Test todo item')
  })
})