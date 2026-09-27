// vite.config.ts
import { defineConfig } from "file:///data/data/com.termux/files/home/codeforge/node_modules/.pnpm/vite@5.4.21_@types+node@20.19.43_terser@5.51.2/node_modules/vite/dist/node/index.js";
import react from "file:///data/data/com.termux/files/home/codeforge/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@20.19.43_terser@5.51.2_/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///data/data/com.termux/files/home/codeforge/node_modules/.pnpm/vite-plugin-pwa@0.17.5_vite@5.4.21_@types+node@20.19.43_terser@5.51.2__workbox-build@7.4.1_@t_pqw5sidnmv43rhofivmy4yueme/node_modules/vite-plugin-pwa/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "/data/data/com.termux/files/home/codeforge/apps/web";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "apple-touch-icon.png"],
      manifest: {
        name: "CodeForge",
        short_name: "CodeForge",
        description: "Local-first learn to code platform",
        theme_color: "#0d1117",
        background_color: "#0d1117",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/icon-72.png",
            sizes: "72x72",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icon-96.png",
            sizes: "96x96",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icon-128.png",
            sizes: "128x128",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icon-144.png",
            sizes: "144x144",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icon-152.png",
            sizes: "152x152",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icon-384.png",
            sizes: "384x384",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ],
        categories: ["education", "developer"],
        screenshots: [],
        shortcuts: [
          {
            name: "Courses",
            short_name: "Courses",
            description: "Browse courses",
            url: "/courses",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }]
          },
          {
            name: "Builds",
            short_name: "Builds",
            description: "Create builds",
            url: "/builds",
            icons: [{ src: "/icon-192.png", sizes: "192x192" }]
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "gstatic-fonts-cache",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src"),
      "@codeforge/core": path.resolve(__vite_injected_original_dirname, "../../packages/core/src"),
      "@codeforge/data": path.resolve(__vite_injected_original_dirname, "../../packages/data/src"),
      "@codeforge/course-engine": path.resolve(__vite_injected_original_dirname, "../../packages/course-engine/src"),
      "@codeforge/exercise-engine": path.resolve(__vite_injected_original_dirname, "../../packages/exercise-engine/src"),
      "@codeforge/code-execution": path.resolve(__vite_injected_original_dirname, "../../packages/code-execution/src"),
      "@codeforge/editor": path.resolve(__vite_injected_original_dirname, "../../packages/editor/src"),
      "@codeforge/gamification": path.resolve(__vite_injected_original_dirname, "../../packages/gamification/src"),
      "@codeforge/worlds": path.resolve(__vite_injected_original_dirname, "../../packages/worlds/src"),
      "@codeforge/avatar": path.resolve(__vite_injected_original_dirname, "../../packages/avatar/src"),
      "@codeforge/community": path.resolve(__vite_injected_original_dirname, "../../packages/community/src"),
      "@codeforge/builds": path.resolve(__vite_injected_original_dirname, "../../packages/builds/src"),
      "@codeforge/ai-assistant": path.resolve(__vite_injected_original_dirname, "../../packages/ai-assistant/src")
    }
  },
  build: {
    target: "es2022",
    minify: "esbuild",
    sourcemap: true,
    rollupOptions: {
      external: ["y-indexeddb", "y-webrtc", "idb", "sql.js", "canvas", "@radix-ui/react-slot", "monaco-editor"],
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          editor: ["@codeforge/editor"],
          gamification: ["@codeforge/gamification"],
          worlds: ["phaser", "@codeforge/worlds"],
          ai: ["@codeforge/ai-assistant", "@xenova/transformers"]
        }
      }
    }
  },
  server: {
    port: 3e3,
    host: true
  },
  optimizeDeps: {
    include: ["monaco-editor", "phaser", "@xenova/transformers", "y-indexeddb", "y-webrtc", "yjs"],
    exclude: ["canvas"]
  },
  ssr: {
    external: ["y-indexeddb", "y-webrtc", "idb", "sql.js", "canvas", "@radix-ui/react-slot", "monaco-editor"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvZGF0YS9kYXRhL2NvbS50ZXJtdXgvZmlsZXMvaG9tZS9jb2RlZm9yZ2UvYXBwcy93ZWJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9kYXRhL2RhdGEvY29tLnRlcm11eC9maWxlcy9ob21lL2NvZGVmb3JnZS9hcHBzL3dlYi92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vZGF0YS9kYXRhL2NvbS50ZXJtdXgvZmlsZXMvaG9tZS9jb2RlZm9yZ2UvYXBwcy93ZWIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5pbXBvcnQgeyBWaXRlUFdBIH0gZnJvbSAndml0ZS1wbHVnaW4tcHdhJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICBWaXRlUFdBKHtcbiAgICAgIHJlZ2lzdGVyVHlwZTogJ2F1dG9VcGRhdGUnLFxuICAgICAgaW5jbHVkZUFzc2V0czogWydmYXZpY29uLmljbycsICdyb2JvdHMudHh0JywgJ2FwcGxlLXRvdWNoLWljb24ucG5nJ10sXG4gICAgICBtYW5pZmVzdDoge1xuICAgICAgICBuYW1lOiAnQ29kZUZvcmdlJyxcbiAgICAgICAgc2hvcnRfbmFtZTogJ0NvZGVGb3JnZScsXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnTG9jYWwtZmlyc3QgbGVhcm4gdG8gY29kZSBwbGF0Zm9ybScsXG4gICAgICAgIHRoZW1lX2NvbG9yOiAnIzBkMTExNycsXG4gICAgICAgIGJhY2tncm91bmRfY29sb3I6ICcjMGQxMTE3JyxcbiAgICAgICAgZGlzcGxheTogJ3N0YW5kYWxvbmUnLFxuICAgICAgICBvcmllbnRhdGlvbjogJ3BvcnRyYWl0LXByaW1hcnknLFxuICAgICAgICBzY29wZTogJy8nLFxuICAgICAgICBzdGFydF91cmw6ICcvJyxcbiAgICAgICAgaWNvbnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICcvaWNvbi03Mi5wbmcnLFxuICAgICAgICAgICAgc2l6ZXM6ICc3Mng3MicsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICAgIHB1cnBvc2U6ICdhbnkgbWFza2FibGUnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnL2ljb24tOTYucG5nJyxcbiAgICAgICAgICAgIHNpemVzOiAnOTZ4OTYnLFxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgICAgICBwdXJwb3NlOiAnYW55IG1hc2thYmxlJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJy9pY29uLTEyOC5wbmcnLFxuICAgICAgICAgICAgc2l6ZXM6ICcxMjh4MTI4JyxcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgcHVycG9zZTogJ2FueSBtYXNrYWJsZScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICcvaWNvbi0xNDQucG5nJyxcbiAgICAgICAgICAgIHNpemVzOiAnMTQ0eDE0NCcsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICAgIHB1cnBvc2U6ICdhbnkgbWFza2FibGUnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnL2ljb24tMTUyLnBuZycsXG4gICAgICAgICAgICBzaXplczogJzE1MngxNTInLFxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgICAgICBwdXJwb3NlOiAnYW55IG1hc2thYmxlJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJy9pY29uLTE5Mi5wbmcnLFxuICAgICAgICAgICAgc2l6ZXM6ICcxOTJ4MTkyJyxcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxuICAgICAgICAgICAgcHVycG9zZTogJ2FueSBtYXNrYWJsZScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICcvaWNvbi0zODQucG5nJyxcbiAgICAgICAgICAgIHNpemVzOiAnMzg0eDM4NCcsXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcbiAgICAgICAgICAgIHB1cnBvc2U6ICdhbnkgbWFza2FibGUnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnL2ljb24tNTEyLnBuZycsXG4gICAgICAgICAgICBzaXplczogJzUxMng1MTInLFxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXG4gICAgICAgICAgICBwdXJwb3NlOiAnYW55IG1hc2thYmxlJyxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBjYXRlZ29yaWVzOiBbJ2VkdWNhdGlvbicsICdkZXZlbG9wZXInXSxcbiAgICAgICAgc2NyZWVuc2hvdHM6IFtdLFxuICAgICAgICBzaG9ydGN1dHM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lOiAnQ291cnNlcycsXG4gICAgICAgICAgICBzaG9ydF9uYW1lOiAnQ291cnNlcycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0Jyb3dzZSBjb3Vyc2VzJyxcbiAgICAgICAgICAgIHVybDogJy9jb3Vyc2VzJyxcbiAgICAgICAgICAgIGljb25zOiBbeyBzcmM6ICcvaWNvbi0xOTIucG5nJywgc2l6ZXM6ICcxOTJ4MTkyJyB9XSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdCdWlsZHMnLFxuICAgICAgICAgICAgc2hvcnRfbmFtZTogJ0J1aWxkcycsXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0NyZWF0ZSBidWlsZHMnLFxuICAgICAgICAgICAgdXJsOiAnL2J1aWxkcycsXG4gICAgICAgICAgICBpY29uczogW3sgc3JjOiAnL2ljb24tMTkyLnBuZycsIHNpemVzOiAnMTkyeDE5MicgfV0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICB3b3JrYm94OiB7XG4gICAgICAgIGdsb2JQYXR0ZXJuczogWycqKi8qLntqcyxjc3MsaHRtbCxpY28scG5nLHN2Zyx3b2ZmMn0nXSxcbiAgICAgICAgcnVudGltZUNhY2hpbmc6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICB1cmxQYXR0ZXJuOiAvXmh0dHBzOlxcL1xcL2ZvbnRzXFwuZ29vZ2xlYXBpc1xcLmNvbVxcLy4qL2ksXG4gICAgICAgICAgICBoYW5kbGVyOiAnQ2FjaGVGaXJzdCcsXG4gICAgICAgICAgICBvcHRpb25zOiB7XG4gICAgICAgICAgICAgIGNhY2hlTmFtZTogJ2dvb2dsZS1mb250cy1jYWNoZScsXG4gICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcbiAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiAxMCxcbiAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiAzNjUsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGNhY2hlYWJsZVJlc3BvbnNlOiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzZXM6IFswLCAyMDBdLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHVybFBhdHRlcm46IC9eaHR0cHM6XFwvXFwvZm9udHNcXC5nc3RhdGljXFwuY29tXFwvLiovaSxcbiAgICAgICAgICAgIGhhbmRsZXI6ICdDYWNoZUZpcnN0JyxcbiAgICAgICAgICAgIG9wdGlvbnM6IHtcbiAgICAgICAgICAgICAgY2FjaGVOYW1lOiAnZ3N0YXRpYy1mb250cy1jYWNoZScsXG4gICAgICAgICAgICAgIGV4cGlyYXRpb246IHtcbiAgICAgICAgICAgICAgICBtYXhFbnRyaWVzOiAxMCxcbiAgICAgICAgICAgICAgICBtYXhBZ2VTZWNvbmRzOiA2MCAqIDYwICogMjQgKiAzNjUsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIGNhY2hlYWJsZVJlc3BvbnNlOiB7XG4gICAgICAgICAgICAgICAgc3RhdHVzZXM6IFswLCAyMDBdLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIGRldk9wdGlvbnM6IHtcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSksXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcbiAgICAgICdAY29kZWZvcmdlL2NvcmUnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vLi4vcGFja2FnZXMvY29yZS9zcmMnKSxcbiAgICAgICdAY29kZWZvcmdlL2RhdGEnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vLi4vcGFja2FnZXMvZGF0YS9zcmMnKSxcbiAgICAgICdAY29kZWZvcmdlL2NvdXJzZS1lbmdpbmUnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vLi4vcGFja2FnZXMvY291cnNlLWVuZ2luZS9zcmMnKSxcbiAgICAgICdAY29kZWZvcmdlL2V4ZXJjaXNlLWVuZ2luZSc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLi9wYWNrYWdlcy9leGVyY2lzZS1lbmdpbmUvc3JjJyksXG4gICAgICAnQGNvZGVmb3JnZS9jb2RlLWV4ZWN1dGlvbic6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLi9wYWNrYWdlcy9jb2RlLWV4ZWN1dGlvbi9zcmMnKSxcbiAgICAgICdAY29kZWZvcmdlL2VkaXRvcic6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLi9wYWNrYWdlcy9lZGl0b3Ivc3JjJyksXG4gICAgICAnQGNvZGVmb3JnZS9nYW1pZmljYXRpb24nOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vLi4vcGFja2FnZXMvZ2FtaWZpY2F0aW9uL3NyYycpLFxuICAgICAgJ0Bjb2RlZm9yZ2Uvd29ybGRzJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uLy4uL3BhY2thZ2VzL3dvcmxkcy9zcmMnKSxcbiAgICAgICdAY29kZWZvcmdlL2F2YXRhcic6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLi9wYWNrYWdlcy9hdmF0YXIvc3JjJyksXG4gICAgICAnQGNvZGVmb3JnZS9jb21tdW5pdHknOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi4vLi4vcGFja2FnZXMvY29tbXVuaXR5L3NyYycpLFxuICAgICAgJ0Bjb2RlZm9yZ2UvYnVpbGRzJzogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJy4uLy4uL3BhY2thZ2VzL2J1aWxkcy9zcmMnKSxcbiAgICAgICdAY29kZWZvcmdlL2FpLWFzc2lzdGFudCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuLi8uLi9wYWNrYWdlcy9haS1hc3Npc3RhbnQvc3JjJyksXG4gICAgfSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICB0YXJnZXQ6ICdlczIwMjInLFxuICAgIG1pbmlmeTogJ2VzYnVpbGQnLFxuICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBleHRlcm5hbDogWyd5LWluZGV4ZWRkYicsICd5LXdlYnJ0YycsICdpZGInLCAnc3FsLmpzJywgJ2NhbnZhcycsICdAcmFkaXgtdWkvcmVhY3Qtc2xvdCcsICdtb25hY28tZWRpdG9yJ10sXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgdmVuZG9yOiBbJ3JlYWN0JywgJ3JlYWN0LWRvbScsICdyZWFjdC1yb3V0ZXItZG9tJ10sXG4gICAgICAgICAgZWRpdG9yOiBbJ0Bjb2RlZm9yZ2UvZWRpdG9yJ10sXG4gICAgICAgICAgZ2FtaWZpY2F0aW9uOiBbJ0Bjb2RlZm9yZ2UvZ2FtaWZpY2F0aW9uJ10sXG4gICAgICAgICAgd29ybGRzOiBbJ3BoYXNlcicsICdAY29kZWZvcmdlL3dvcmxkcyddLFxuICAgICAgICAgIGFpOiBbJ0Bjb2RlZm9yZ2UvYWktYXNzaXN0YW50JywgJ0B4ZW5vdmEvdHJhbnNmb3JtZXJzJ10sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgaG9zdDogdHJ1ZSxcbiAgfSxcbiAgb3B0aW1pemVEZXBzOiB7XG4gICAgaW5jbHVkZTogWydtb25hY28tZWRpdG9yJywgJ3BoYXNlcicsICdAeGVub3ZhL3RyYW5zZm9ybWVycycsICd5LWluZGV4ZWRkYicsICd5LXdlYnJ0YycsICd5anMnXSxcbiAgICBleGNsdWRlOiBbJ2NhbnZhcyddLFxuICB9LFxuICBzc3I6IHtcbiAgICBleHRlcm5hbDogWyd5LWluZGV4ZWRkYicsICd5LXdlYnJ0YycsICdpZGInLCAnc3FsLmpzJywgJ2NhbnZhcycsICdAcmFkaXgtdWkvcmVhY3Qtc2xvdCcsICdtb25hY28tZWRpdG9yJ10sXG4gIH0sXG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQTJVLFNBQVMsb0JBQW9CO0FBQ3hXLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFDeEIsT0FBTyxVQUFVO0FBSGpCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNO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
