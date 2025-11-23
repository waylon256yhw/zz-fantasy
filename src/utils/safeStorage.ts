/**
 * Safe Storage Utility
 *
 * Provides localStorage access with automatic fallback to memory storage
 * when localStorage is not available (e.g., in DZMM iframe sandbox).
 */

class SafeStorage {
  private memoryStorage: Map<string, string> = new Map();
  private useLocalStorage = true;

  constructor() {
    // Test localStorage availability
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      this.useLocalStorage = true;
      console.log('[SafeStorage] localStorage is available');
    } catch (error) {
      this.useLocalStorage = false;
      console.warn('[SafeStorage] localStorage not available, using memory storage');
      console.warn('[SafeStorage] Data will be lost on page refresh');
    }
  }

  /**
   * Store a value
   */
  setItem(key: string, value: string): void {
    if (this.useLocalStorage) {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.warn('[SafeStorage] localStorage.setItem failed, falling back to memory');
        this.memoryStorage.set(key, value);
      }
    } else {
      this.memoryStorage.set(key, value);
    }
  }

  /**
   * Retrieve a value
   */
  getItem(key: string): string | null {
    if (this.useLocalStorage) {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.warn('[SafeStorage] localStorage.getItem failed, falling back to memory');
        return this.memoryStorage.get(key) || null;
      }
    }
    return this.memoryStorage.get(key) || null;
  }

  /**
   * Remove a value
   */
  removeItem(key: string): void {
    if (this.useLocalStorage) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('[SafeStorage] localStorage.removeItem failed');
      }
    }
    this.memoryStorage.delete(key);
  }

  /**
   * Clear all values
   */
  clear(): void {
    if (this.useLocalStorage) {
      try {
        localStorage.clear();
      } catch (error) {
        console.warn('[SafeStorage] localStorage.clear failed');
      }
    }
    this.memoryStorage.clear();
  }

  /**
   * Check if localStorage is available
   */
  isLocalStorageAvailable(): boolean {
    return this.useLocalStorage;
  }
}

// Export singleton instance
export const safeStorage = new SafeStorage();
