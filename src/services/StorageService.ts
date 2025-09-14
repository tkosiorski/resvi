export class StorageService {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const result = await chrome.storage.local.get([key])
      return result[key] || null
    } catch (error) {
      console.error(`Failed to get ${key} from storage:`, error)
      return null
    }
  }

  static async set(key: string, value: any): Promise<boolean> {
    try {
      await chrome.storage.local.set({ [key]: value })
      return true
    } catch (error) {
      console.error(`Failed to set ${key} in storage:`, error)
      return false
    }
  }

  static async remove(key: string): Promise<boolean> {
    try {
      await chrome.storage.local.remove([key])
      return true
    } catch (error) {
      console.error(`Failed to remove ${key} from storage:`, error)
      return false
    }
  }

  static async clear(): Promise<boolean> {
    try {
      await chrome.storage.local.clear()
      return true
    } catch (error) {
      console.error('Failed to clear storage:', error)
      return false
    }
  }
}