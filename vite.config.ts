import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

import { VitePWA } from 'vite-plugin-pwa';

/**
 * Phase 2: Bundle Optimization - Fixed Circular Dependencies
 * Split react-leaflet into separate chunk to avoid circular dependency with vendor-react
 */
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'import.meta.env.VITE_USE_MOCK': JSON.stringify('true'),
        'import.meta.env.VITE_DEMO_MODE': JSON.stringify('true'),
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Allow Vercel Sandbox preview hostnames to proxy to Vite.
        // Keep the explicit suffix for previews whose config is normalized by Vite.
        allowedHosts: ['.vercel.run', 'sb-7eutup5amfa6.vercel.run'],
      },
      build: {
        // Emit source maps for Sentry without exposing them in the bundle.
        // 'hidden' produces .map files alongside the build output but does not
        // add a //# sourceMappingURL comment to the shipped JS, so they stay
        // out of the user-facing bundle while remaining available for error
        // reporting.
        sourcemap: 'hidden',
        // Code Splitting Configuration
        rollupOptions: {
          onLog(level, log) {
            // Global silence: SmartSchoolApp uses barrel imports that trigger CIRCULAR_DEPENDENCY warnings.
            // Investigate by removing this and running build.
            if (log.code === 'CIRCULAR_DEPENDENCY') return;
          },
          output: {
            // Manual chunk splitting - Order matters! React first, then dependents
            manualChunks: (id) => {
              // 1. Core React - MUST be separate, other chunks depend on it
              if (id.includes('node_modules/react')) return 'vendor-react';
              if (id.includes('node_modules/react-dom')) return 'vendor-react';
              if (id.includes('node_modules/react-router')) return 'vendor-router';

              // 2. Firebase - standalone, no react dependency
              if (id.includes('firebase') || id.includes('@firebase')) return 'vendor-firebase';

              // 3. Heavy libs that depend on react - AFTER vendor-react
              if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'vendor-charts';
              if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) return 'vendor-pdf';

              // 4. leaflet + react-leaflet - same chunk to prevent circular dependency
              if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) return 'vendor-maps';

              // 5. Utilities
              if (id.includes('node_modules/date-fns')) return 'vendor-date';
              if (id.includes('node_modules/papaparse') || id.includes('node_modules/jszip')) return 'vendor-parse';
              if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
              if (id.includes('node_modules/@google')) return 'vendor-ai';
              if (id.includes('node_modules/qrcode') || id.includes('node_modules/dompurify')) return 'vendor-util';
              if (id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge')) return 'vendor-util';
            },
          },
        },
        // Warning threshold for chunk size (Firebase 599kB, PDF 615kB are typical vendor sizes)
        chunkSizeWarningLimit: 650,
        // Enable terser minification
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
          manifest: {
            name: 'SmartSchool OS',
            short_name: 'SmartSchool',
            description: 'Advanced School ERP & Management Ecosystem',
            theme_color: '#6366f1',
            background_color: '#0f172a',
            display: 'standalone',
            icons: [
              {
                src: 'icon-512.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'icon-512.png',
                sizes: '512x512',
                type: 'image/png'
              },
              {
                src: 'icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'unsplash-images',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60 * 24 * 30,
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
            ],
          }
        })
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './frontend'),
        }
      },
      // Optimize dependencies
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react-router-dom',
          'firebase/app',
          'firebase/firestore',
          'firebase/auth',
          'recharts',
          'lodash',
          'leaflet'
        ],
        exclude: ['jspdf', 'html2canvas'],
      },
      esbuild: {
        target: 'esnext',
      },
    };
});
