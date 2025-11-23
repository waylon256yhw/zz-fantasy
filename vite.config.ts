import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // Use vite-plugin-singlefile in 'singlefile' mode for DZMM deployment
    const isSingleFileMode = mode === 'singlefile';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: ['preview.piepia.space'],
      },
      plugins: [
        react(),
        // Add single-file plugin only in singlefile mode
        isSingleFileMode && viteSingleFile({ useRecommendedBuildConfig: true })
      ].filter(Boolean),
      // Disable public directory to avoid copy errors
      publicDir: false,
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
