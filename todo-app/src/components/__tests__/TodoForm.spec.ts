import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TodoForm from '../TodoForm.vue'

describe('TodoForm', () => {
  it('renders form elements correctly', () => {
    const wrapper = mount(TodoForm)

    expect(wrapper.find('input[type="text"]').exists()).toBe(true)
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true)
    expect(wrapper.find('input').attributes('placeholder')).toBe('What needs to be done?')
  })

  it('enables submit button when input has valid text', async () => {
    const wrapper = mount(TodoForm)
    const input = wrapper.find('input[type="text"]')
    const button = wrapper.find('button[type="submit"]')

    expect(button.attributes('disabled')).toBeDefined()

    await input.setValue('New todo item')
    expect(button.attributes('disabled')).toBeUndefined()
  })

  it('disables submit button for empty or too long text', async () => {
    const wrapper = mount(TodoForm)
    const input = wrapper.find('input[type="text"]')
    const button = wrapper.find('button[type="submit"]')

    // Empty text
    await input.setValue('')
    expect(button.attributes('disabled')).toBeDefined()

    // Only whitespace
    await input.setValue('   ')
    expect(button.attributes('disabled')).toBeDefined()

    // Too long text (over 200 characters)
    await input.setValue('x'.repeat(201))
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('emits submit event with trimmed text', async () => {
    const wrapper = mount(TodoForm)
    const input = wrapper.find('input[type="text"]')

    await input.setValue('  New todo item  ')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.emitted('submit')).toBeTruthy()
    expect(wrapper.emitted('submit')![0]).toEqual(['New todo item'])
  })

  it('clears input after successful submit', async () => {
    const wrapper = mount(TodoForm)
    const input = wrapper.find('input[type="text"]')

    await input.setValue('New todo item')
    await wrapper.find('form').trigger('submit.prevent')

    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('shows error for empty submission', async () => {
    const wrapper = mount(TodoForm)

    await wrapper.find('form').trigger('submit.prevent')
    
    await nextTick()
    expect(wrapper.find('.error-message').exists()).toBe(true)
    expect(wrapper.text()).toContain('Todo text cannot be empty')
  })

  it('shows error for text that is too long', async () => {
    const wrapper = mount(TodoForm)
    const input = wrapper.find('input[type="text"]')

    await input.setValue('x'.repeat(201))
    await wrapper.find('form').trigger('submit.prevent')
    
    await nextTick()
    expect(wrapper.find('.error-message').exists()).toBe(true)
    expect(wrapper.text()).toContain('cannot exceed 200 characters')
  })

  it('clears error when user starts typing', async () => {
    const wrapper = mount(TodoForm)
    const input = wrapper.find('input[type="text"]')

    // Trigger error
    await wrapper.find('form').trigger('submit.prevent')
    await nextTick()
    expect(wrapper.find('.error-message').exists()).toBe(true)

    // Start typing
    await input.setValue('a')
    expect(wrapper.find('.error-message').exists()).toBe(false)
  })

  it('has proper accessibility attributes', () => {
    const wrapper = mount(TodoForm)
    const input = wrapper.find('input[type="text"]')
    const label = wrapper.find('label')

    expect(input.attributes('id')).toBe('new-todo')
    expect(label.attributes('for')).toBe('new-todo')
    expect(input.attributes('aria-describedby')).toBe('todo-hint')
    expect(wrapper.find('#todo-hint').exists()).toBe(true)
  })
})