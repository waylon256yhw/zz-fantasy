/**
 * DZMM API Service Layer
 *
 * Provides safe wrappers around DZMM platform APIs with:
 * - Automatic readiness detection (dzmm:ready event)
 * - Parameter validation (prevents HTTP 400 errors)
 * - Error handling and logging
 */

export class DZMMService {
  private static readyPromise: Promise<void> | null = null;
  private static isReady = false;

  /**
   * Wait for DZMM API to be ready
   *
   * Uses three detection methods:
   * 1. Check if window.dzmm exists immediately
   * 2. Listen for 'dzmm:ready' event
   * 3. Fallback check after 2 seconds
   */
  static async waitForReady(): Promise<void> {
    if (this.isReady) return;
    if (this.readyPromise) return this.readyPromise;

    this.readyPromise = new Promise((resolve) => {
      // Method 1: Direct check
      if (window.dzmm) {
        this.isReady = true;
        resolve();
        return;
      }

      // Method 2: Event listener
      const listener = () => {
        this.isReady = true;
        resolve();
        window.removeEventListener('dzmm:ready', listener);
      };
      window.addEventListener('dzmm:ready', listener);

      // Method 3: Fallback check after 2s
      setTimeout(() => {
        if (window.dzmm && !this.isReady) {
          this.isReady = true;
          resolve();
        }
      }, 2000);
    });

    return this.readyPromise;
  }

  /**
   * Streaming AI text generation with automatic validation
   *
   * @throws Error if maxTokens out of range (200-3000)
   * @throws Error if consecutive same-role messages detected
   */
  static async completions(
    params: Parameters<typeof window.dzmm.completions>[0],
    callback: Parameters<typeof window.dzmm.completions>[1]
  ): Promise<void> {
    await this.waitForReady();

    // Validation 1: maxTokens range check
    if (params.maxTokens !== undefined) {
      if (params.maxTokens < 200 || params.maxTokens > 3000) {
        const error = new Error(
          `maxTokens must be between 200-3000, got ${params.maxTokens}`
        );
        console.error('[DZMM Service] Parameter validation failed:', error);
        throw error;
      }
    }

    // Validation 2: No consecutive same-role messages
    for (let i = 1; i < params.messages.length; i++) {
      if (params.messages[i].role === params.messages[i - 1].role) {
        const error = new Error(
          `Consecutive ${params.messages[i].role} messages detected at index ${i}. ` +
            'DZMM API requires alternating user/assistant roles.'
        );
        console.error('[DZMM Service] Message validation failed:', error);
        console.error('Messages:', params.messages);
        throw error;
      }
    }

    // Validation 3: Check for 'system' role (not supported)
    const hasSystemRole = params.messages.some((msg) => msg.role === 'system' as any);
    if (hasSystemRole) {
      const error = new Error(
        "DZMM API does not support 'system' role. Use 'user' role for system prompts."
      );
      console.error('[DZMM Service] Role validation failed:', error);
      throw error;
    }

    // Log API call for debugging
    console.log('[DZMM Service] Calling completions API:', {
      model: params.model,
      messageCount: params.messages.length,
      maxTokens: params.maxTokens || 1000,
    });

    try {
      await window.dzmm.completions(params, callback);
    } catch (error) {
      console.error('[DZMM Service] Completions API error:', error);
      throw error;
    }
  }

  /**
   * Store a value in DZMM KV storage
   */
  static async kvPut(key: string, value: any): Promise<void> {
    await this.waitForReady();

    // Key length validation
    if (key.length > 256) {
      throw new Error(`KV key too long: ${key.length} chars (max 256)`);
    }

    console.log('[DZMM Service] KV put:', key);

    try {
      await window.dzmm.kv.put(key, value);
    } catch (error) {
      console.error('[DZMM Service] KV put error:', error);
      throw error;
    }
  }

  /**
   * Retrieve a value from DZMM KV storage
   */
  static async kvGet(key: string): Promise<{ value: any | null }> {
    await this.waitForReady();

    console.log('[DZMM Service] KV get:', key);

    try {
      return await window.dzmm.kv.get(key);
    } catch (error) {
      console.error('[DZMM Service] KV get error:', error);
      throw error;
    }
  }

  /**
   * Delete a value from DZMM KV storage
   */
  static async kvDelete(key: string): Promise<void> {
    await this.waitForReady();

    console.log('[DZMM Service] KV delete:', key);

    try {
      await window.dzmm.kv.delete(key);
    } catch (error) {
      console.error('[DZMM Service] KV delete error:', error);
      throw error;
    }
  }

  /**
   * Check if DZMM API is currently ready
   */
  static checkReady(): boolean {
    return this.isReady && !!window.dzmm;
  }
}
