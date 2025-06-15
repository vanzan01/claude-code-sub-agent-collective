import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LocalStorageService } from '../LocalStorageService'

describe('LocalStorageService', () => {
  let service: LocalStorageService
  let mockLocalStorage: Record<string, string>

  beforeEach(() => {
    mockLocalStorage = {}
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => mockLocalStorage[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          mockLocalStorage[key] = value
        }),
        removeItem: vi.fn((key: string) => {
          delete mockLocalStorage[key]
        }),
        clear: vi.fn(() => {
          mockLocalStorage = {}
        }),
        hasOwnProperty: vi.fn((key: string) => key in mockLocalStorage),
        key: vi.fn(),
        length: 0
      },
      writable: true
    })
    
    service = new LocalStorageService('test')
  })

  it('should save and retrieve data successfully', async () => {
    const testData = { id: 1, text: 'Test todo', completed: false }
    
    const saveResult = await service.setItem('test-key', testData)
    expect(saveResult.success).toBe(true)
    
    const loadResult = await service.getItem('test-key')
    expect(loadResult.success).toBe(true)
    expect(loadResult.data).toEqual(testData)
  })

  it('should return undefined for non-existent keys', async () => {
    const result = await service.getItem('non-existent-key')
    expect(result.success).toBe(true)
    expect(result.data).toBeUndefined()
  })

  it('should remove items successfully', async () => {
    await service.setItem('test-key', 'test-data')
    
    const removeResult = await service.removeItem('test-key')
    expect(removeResult.success).toBe(true)
    
    const getResult = await service.getItem('test-key')
    expect(getResult.data).toBeUndefined()
  })

  it('should check if localStorage is available', () => {
    expect(service.isAvailable()).toBe(true)
  })

  it('should handle JSON parsing errors', async () => {
    // Mock corrupted data
    vi.mocked(localStorage.getItem).mockReturnValue('invalid-json')
    
    const result = await service.getItem('corrupted-key')
    expect(result.success).toBe(false)
    expect(result.error?.message).toContain('Corrupted data')
  })

  it('should use prefixed keys', async () => {
    await service.setItem('my-key', 'test-data')
    
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'test:my-key',
      '"test-data"'
    )
  })
})