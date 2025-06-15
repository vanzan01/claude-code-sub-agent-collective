export interface StorageResult<T> {
  success: boolean
  data?: T
  error?: StorageError
}

export interface StorageError {
  type: 'QUOTA_EXCEEDED' | 'ACCESS_DENIED' | 'CORRUPTED_DATA' | 'NETWORK_ERROR'
  message: string
  originalError?: Error
}

export interface IStorageService {
  getItem<T>(key: string): Promise<StorageResult<T>>
  setItem<T>(key: string, value: T): Promise<StorageResult<void>>
  removeItem(key: string): Promise<StorageResult<void>>
  clear(): Promise<StorageResult<void>>
  isAvailable(): boolean
  getStorageUsage(): Promise<StorageResult<number>>
}