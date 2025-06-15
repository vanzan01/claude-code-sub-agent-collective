import type { Todo } from '@/types'
import type { IStorageService, StorageResult } from '@/services/storage/types'
import { LocalStorageService } from '@/services/storage/LocalStorageService'

interface TodoData {
  version: string
  todos: Todo[]
  createdAt: string
  lastUpdated: string
}

export class TodoRepository {
  private readonly storageService: IStorageService
  private readonly storageKey = 'todos'
  private readonly currentVersion = '1.0.0'
  private readonly backupKey = 'todos_backup'

  constructor(storageService?: IStorageService) {
    this.storageService = storageService || new LocalStorageService()
  }

  async loadTodos(): Promise<StorageResult<Todo[]>> {
    try {
      const result = await this.storageService.getItem<TodoData>(this.storageKey)
      
      if (!result.success) {
        return {
          success: false,
          error: result.error
        }
      }

      if (!result.data) {
        return { success: true, data: [] }
      }

      // Validate and migrate data if necessary
      const validatedData = await this.validateAndMigrate(result.data)
      if (!validatedData.success) {
        return this.attemptRecovery()
      }

      return { success: true, data: validatedData.data!.todos }
      
    } catch (error) {
      return this.attemptRecovery()
    }
  }

  async saveTodos(todos: Todo[]): Promise<StorageResult<void>> {
    try {
      // Create backup before saving
      await this.createBackup()
      
      const todoData: TodoData = {
        version: this.currentVersion,
        todos,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      }

      const result = await this.storageService.setItem(this.storageKey, todoData)
      
      if (!result.success) {
        // Attempt to restore from backup if save fails
        await this.restoreFromBackup()
      }
      
      return result
      
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'NETWORK_ERROR',
          message: `Failed to save todos: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    }
  }

  async clearTodos(): Promise<StorageResult<void>> {
    await this.createBackup()
    return this.storageService.removeItem(this.storageKey)
  }

  async getStorageInfo(): Promise<StorageResult<{ usage: number; available: boolean }>> {
    const usageResult = await this.storageService.getStorageUsage()
    
    return {
      success: true,
      data: {
        usage: usageResult.success ? usageResult.data! : 0,
        available: this.storageService.isAvailable()
      }
    }
  }

  // Private methods
  private async validateAndMigrate(data: unknown): Promise<StorageResult<TodoData>> {
    try {
      // Type guard for TodoData
      if (!this.isTodoData(data)) {
        throw new Error('Invalid data structure')
      }

      // Version migration logic
      if (data.version !== this.currentVersion) {
        const migrated = await this.migrateData(data)
        if (!migrated.success) {
          throw new Error('Migration failed')
        }
        data = migrated.data!
      }

      // Cast after validation
      const todoData = data as TodoData
      
      // Validate todos array
      const validTodos = todoData.todos.filter(this.isValidTodo)
      
      const result: TodoData = {
        version: todoData.version,
        todos: validTodos,
        createdAt: todoData.createdAt,
        lastUpdated: todoData.lastUpdated
      }
      
      return {
        success: true,
        data: result
      }
      
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'CORRUPTED_DATA',
          message: `Data validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    }
  }

  private isTodoData(data: unknown): data is TodoData {
    return (
      typeof data === 'object' &&
      data !== null &&
      'version' in data &&
      'todos' in data &&
      Array.isArray((data as any).todos)
    )
  }

  private isValidTodo(todo: unknown): todo is Todo {
    return (
      typeof todo === 'object' &&
      todo !== null &&
      'id' in todo &&
      'text' in todo &&
      'completed' in todo &&
      typeof (todo as any).id === 'number' &&
      typeof (todo as any).text === 'string' &&
      typeof (todo as any).completed === 'boolean'
    )
  }

  private async migrateData(data: TodoData): Promise<StorageResult<TodoData>> {
    // Implement version-specific migrations
    try {
      // Example migration from v0.9.0 to v1.0.0
      if (data.version === '0.9.0') {
        data.todos = data.todos.map((todo: any) => ({
          ...todo,
          id: todo.id || Date.now() + Math.random()
        }))
      }

      return {
        success: true,
        data: {
          ...data,
          version: this.currentVersion,
          lastUpdated: new Date().toISOString()
        } as TodoData
      }
      
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'CORRUPTED_DATA',
          message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    }
  }

  private async createBackup(): Promise<void> {
    try {
      const current = await this.storageService.getItem<TodoData>(this.storageKey)
      if (current.success && current.data) {
        const backupKey = `${this.backupKey}_${Date.now()}`
        await this.storageService.setItem(backupKey, current.data)
      }
    } catch (error) {
      // Backup creation is optional, don't fail the main operation
      console.warn('Failed to create backup:', error)
    }
  }

  private async restoreFromBackup(): Promise<StorageResult<void>> {
    try {
      const backupResult = await this.storageService.getItem<TodoData>(this.backupKey)
      if (backupResult.success && backupResult.data) {
        return this.storageService.setItem(this.storageKey, backupResult.data)
      }
      
      return {
        success: false,
        error: {
          type: 'CORRUPTED_DATA',
          message: 'No backup available for restoration'
        }
      }
      
    } catch (error) {
      return {
        success: false,
        error: {
          type: 'NETWORK_ERROR',
          message: `Backup restoration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      }
    }
  }

  private async attemptRecovery(): Promise<StorageResult<Todo[]>> {
    // Try to recover from backup
    const backupResult = await this.restoreFromBackup()
    
    if (backupResult.success) {
      return this.loadTodos()
    }
    
    // If all else fails, return empty array
    return { success: true, data: [] }
  }
}