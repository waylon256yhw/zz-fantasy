/**
 * DZMM Platform API Type Definitions
 *
 * DZMM provides three core APIs for building AI-powered interactive applications:
 * - completions: Streaming AI text generation
 * - kv: Cloud key-value storage
 * - chat: Tree-structured conversation storage (not used in this project)
 */

declare global {
  interface Window {
    dzmm: {
      /**
       * Streaming AI text generation
       *
       * @param params - Generation parameters
       * @param params.model - Model name (turbo/medium/max/xl)
       * @param params.messages - Conversation history (only 'user' and 'assistant' roles)
       * @param params.maxTokens - Max tokens to generate (200-3000, default 1000)
       * @param callback - Streaming callback function
       * @param callback.content - Cumulative content (not incremental)
       * @param callback.done - True when generation completes
       *
       * @example
       * await window.dzmm.completions(
       *   {
       *     model: 'nalang-max-0826',
       *     messages: [
       *       { role: 'user', content: 'Tell me a story' },
       *       { role: 'assistant', content: 'Once upon a time...' }
       *     ],
       *     maxTokens: 2000
       *   },
       *   (content, done) => {
       *     console.log(content); // Full content so far
       *     if (done) console.log('Complete!');
       *   }
       * );
       */
      completions: (
        params: {
          model:
            | 'nalang-turbo-0826'    // Fastest, most economical
            | 'nalang-medium-0826'   // Balanced performance
            | 'nalang-max-0826'      // Enhanced reasoning (recommended for games)
            | 'nalang-xl-0826'       // Strongest comprehension
            | 'nalang-max-0826-16k'  // Fast version with 16K context
            | 'nalang-xl-0826-16k';  // Fast XL with 16K context
          messages: Array<{
            role: 'user' | 'assistant'; // ⚠️ 'system' role NOT supported
            content: string;
          }>;
          maxTokens?: number; // 200-3000, default 1000. ⚠️ Exceeding range causes HTTP 400
        },
        callback: (content: string, done: boolean) => void
      ) => Promise<void>;

      /**
       * Cloud key-value storage
       *
       * - Development mode: Data lost on page refresh
       * - Production mode: Persistent cloud storage
       * - Limits: Keys ≤256 chars, values ≤1MB recommended
       * - Auto-serializes/deserializes objects
       */
      kv: {
        /**
         * Store a value
         * @param key - Storage key
         * @param value - Any JSON-serializable value
         */
        put: (key: string, value: any) => Promise<void>;

        /**
         * Retrieve a value
         * @param key - Storage key
         * @returns Object with 'value' property (null if not found)
         */
        get: (key: string) => Promise<{ value: any | null }>;

        /**
         * Delete a value
         * @param key - Storage key
         */
        delete: (key: string) => Promise<void>;
      };

      /**
       * Tree-structured conversation storage
       *
       * Supports branching narratives and multi-route stories.
       * Not used in this project (using KV storage instead).
       */
      chat: {
        insert: (
          parentId: string | null,
          messages: Array<{ role: 'user' | 'assistant'; content: string }>
        ) => Promise<{ ids: string[] }>;

        list: (ids: string[]) => Promise<
          Array<{
            id: string;
            role: string;
            content: string;
            timestamp: number;
            parent: string | null;
            children: string[];
          }>
        >;

        timeline: (messageId: string) => Promise<string[]>;
      };
    };
  }
}

export {};
