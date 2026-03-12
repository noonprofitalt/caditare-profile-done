import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  
  // VALIDATION: Prevent build if required environment variables are missing
  if (mode === 'production') {
    const requiredEnv = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    const missing = requiredEnv.filter(key => !env[key]);
    if (missing.length > 0) {
      throw new Error(
        `FATAL BUILD ERROR: The following required environment variables are missing for production build: ${missing.join(', ')}. ` +
        `Make sure these are added as Secrets in GitHub or in your .env.production file.`
      );
    }
  }

  return {
    server: {
      port: 3000,
      host: true,
    },
    plugins: [
      react(),
      nodePolyfills(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: false, // We're using the standalone manifest.json we built earlier
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          maximumFileSizeToCacheInBytes: 10485760, // 10MB to cover react-pdf
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      rollupOptions: {
        // Output chunking handled automatically by Vite
      },
      chunkSizeWarningLimit: 1600, // Elevated for pdf-renderer
    }
  };
});
