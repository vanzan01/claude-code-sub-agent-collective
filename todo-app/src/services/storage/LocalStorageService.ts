import type { IStorageService, StorageResult, StorageError } from './types'

export class LocalStorageService implements IStorageService {
  private readonly prefix: string
  private readonly maxRetries = 3
  private readonly retryDelay = 100

  constructor(prefix = 'todo-app') {
    this.prefix = prefix
  }

  async getItem<T>(key: string): Promise<StorageResult<T>> {
    const fullKey = this.getFullKey(key)
    
    try {
      if (!this.isAvailable()) {
        return this.createErrorResult('ACCESS_DENIED', 'localStorage is not available')
      }

      const item = localStorage.getItem(fullKey)
      if (item === null) {
        return { success: true, data: undefined }
      }

      const parsed = this.parseWithValidation<T>(item)
      return { success: true, data: parsed }
      
    } catch (error) {
      return this.handleError(error, 'Failed to get item from storage')
    }
  }

  async setItem<T>(key: string, value: T): Promise<StorageResult<void>> {
    const fullKey = this.getFullKey(key)
    
    return this.withRetry(async () => {
      try {
        if (!this.isAvailable()) {
          return this.createErrorResult('ACCESS_DENIED', 'localStorage is not available')
        }

        const serialized = this.serializeWithValidation(value)
        
        // Check storage quota before writing
        const quotaCheck = await this.checkQuota(serialized.length)
        if (!quotaCheck.success) {
          return quotaCheck
        }

        localStorage.setItem(fullKey, serialized)
        return { success: true }
        
      } catch (error) {
        const serialized = this.serializeWithValidation(value)
        if (this.isQuotaExceededError(error)) {
          return this.handleQuotaExceeded(fullKey, serialized)
        }
        return this.handleError(error, 'Failed to save item to storage')
      }
    })
  }

  async removeItem(key: string): Promise<StorageResult<void>> {
    const fullKey = this.getFullKey(key)
    
    try {
      if (!this.isAvailable()) {
        return this.createErrorResult('ACCESS_DENIED', 'localStorage is not available')
      }

      localStorage.removeItem(fullKey)
      return { success: true }
      
    } catch (error) {
      return this.handleError(error, 'Failed to remove item from storage')
    }
  }

  async clear(): Promise<StorageResult<void>> {
    try {
      if (!this.isAvailable()) {
        return this.createErrorResult('ACCESS_DENIED', 'localStorage is not available')
      }

      // Only clear items with our prefix
      const keys = Object.keys(localStorage)
        .filter(key => key.startsWith(this.prefix))
      
      for (const key of keys) {
        localStorage.removeItem(key)
      }
      
      return { success: true }
      
    } catch (error) {
      return this.handleError(error, 'Failed to clear storage')
    }
  }

  isAvailable(): boolean {
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, testKey)
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }

  async getStorageUsage(): Promise<StorageResult<number>> {
    try {
      let totalSize = 0
      
      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key) && key.startsWith(this.prefix)) {
          totalSize += localStorage[key].length * 2 // UTF-16 characters
        }
      }
      
      return { success: true, data: totalSize }
      
    } catch (error) {
      return this.handleError(error, 'Failed to calculate storage usage')
    }
  }

  // Private helper methods
  private getFullKey(key: string): string {
    return `${this.prefix}:${key}`
  }

  private parseWithValidation<T>(item: string): T {
    try {
      return JSON.parse(item)
    } catch (error) {
      throw new Error(`Corrupted data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private serializeWithValidation<T>(value: T): string {
    try {
      return JSON.stringify(value)
    } catch (error) {
      throw new Error(`Serialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async checkQuota(dataSize: number): Promise<StorageResult<void>> {
    try {
      const usage = await this.getStorageUsage()
      if (!usage.success) return { success: true } // Proceed if quota check fails
      
      const currentUsage = usage.data || 0
      const estimatedTotal = currentUsage + dataSize
      const maxStorage = 5 * 1024 * 1024 // 5MB typical limit
      
      if (estimatedTotal > maxStorage * 0.9) { // 90% threshold
        return this.createErrorResult('QUOTA_EXCEEDED', 'Storage quota nearly exceeded')
      }
      
      return { success: true }
      
    } catch (error) {
      return { success: true } // Proceed if quota check fails
    }
  }

  private async handleQuotaExceeded(key: string, data: string): Promise<StorageResult<void>> {
    try {
      // Try to free up space by removing old backups
      await this.cleanupOldBackups()
      
      // Retry the operation
      localStorage.setItem(key, data)
      return { success: true }
      
    } catch (error) {
      return this.createErrorResult('QUOTA_EXCEEDED', 'Storage quota exceeded and cleanup failed')
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    const backupKeys = Object.keys(localStorage)
      .filter(key => key.startsWith(`${this.prefix}:backup_`))
      .sort()
    
    // Keep only the 3 most recent backups
    const keysToRemove = backupKeys.slice(0, -3)
    keysToRemove.forEach(key => localStorage.removeItem(key))
  }

  private isQuotaExceededError(error: unknown): boolean {
    return error instanceof DOMException && (
      error.code === 22 ||
      error.code === 1014 ||
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    )
  }

  private async withRetry<T>(operation: () => Promise<StorageResult<T>>): Promise<StorageResult<T>> {
    let lastError: StorageError | undefined
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      const result = await operation()
      
      if (result.success || attempt === this.maxRetries) {
        return result
      }
      
      lastError = result.error
      await this.delay(this.retryDelay * attempt)
    }
    
    return { success: false, error: lastError }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private createErrorResult(type: StorageError['type'], message: string): StorageResult<any> {
    return {
      success: false,
      error: { type, message }
    }
  }

  private handleError(error: unknown, message: string): StorageResult<any> {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      error: {
        type: 'NETWORK_ERROR',
        message: `${message}: ${errorMessage}`,
        originalError: error instanceof Error ? error : undefined
      }
    }
  }
}