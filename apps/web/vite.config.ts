import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'CodeForge',
        short_name: 'CodeForge',
        description: 'Local-first learn to code platform',
        theme_color: '#0d1117',
        background_color: '#0d1117',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icon-96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icon-128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icon-144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icon-152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icon-384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        categories: ['education', 'developer'],
        screenshots: [],
        shortcuts: [
          {
            name: 'Courses',
            short_name: 'Courses',
            description: 'Browse courses',
            url: '/courses',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Builds',
            short_name: 'Builds',
            description: 'Create builds',
            url: '/builds',
            icons: [{ src: '/icon-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@codeforge/core': path.resolve(__dirname, '../../packages/core/src'),
      '@codeforge/data': path.resolve(__dirname, '../../packages/data/src'),
      '@codeforge/course-engine': path.resolve(__dirname, '../../packages/course-engine/src'),
      '@codeforge/exercise-engine': path.resolve(__dirname, '../../packages/exercise-engine/src'),
      '@codeforge/code-execution': path.resolve(__dirname, '../../packages/code-execution/src'),
      '@codeforge/editor': path.resolve(__dirname, '../../packages/editor/src'),
      '@codeforge/gamification': path.resolve(__dirname, '../../packages/gamification/src'),
      '@codeforge/worlds': path.resolve(__dirname, '../../packages/worlds/src'),
      '@codeforge/avatar': path.resolve(__dirname, '../../packages/avatar/src'),
      '@codeforge/community': path.resolve(__dirname, '../../packages/community/src'),
      '@codeforge/builds': path.resolve(__dirname, '../../packages/builds/src'),
      '@codeforge/ai-assistant': path.resolve(__dirname, '../../packages/ai-assistant/src'),
    },
  },
  build: {
    target: 'es2022',
    minify: 'esbuild',
    sourcemap: true,
    rollupOptions: {
      external: ['y-indexeddb', 'y-webrtc', 'idb', 'sql.js', 'canvas', '@radix-ui/react-slot', 'monaco-editor'],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          editor: ['@codeforge/editor'],
          gamification: ['@codeforge/gamification'],
          worlds: ['phaser', '@codeforge/worlds'],
          ai: ['@codeforge/ai-assistant', '@xenova/transformers'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
  optimizeDeps: {
    include: ['monaco-editor', 'phaser', '@xenova/transformers', 'yjs'],
    exclude: ['canvas', 'y-indexeddb', 'y-webrtc', 'y-webrtc'],
  },
  ssr: {
    external: ['y-indexeddb', 'y-webrtc', 'idb', 'sql.js', 'canvas', '@radix-ui/react-slot', 'monaco-editor'],
  },
});