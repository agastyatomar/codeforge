import { defineConfig, mergeConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@codeforge/core': path.resolve(__dirname, 'packages/core/src'),
      '@codeforge/data': path.resolve(__dirname, 'packages/data/src'),
      '@codeforge/course-engine': path.resolve(__dirname, 'packages/course-engine/src'),
      '@codeforge/exercise-engine': path.resolve(__dirname, 'packages/exercise-engine/src'),
      '@codeforge/code-execution': path.resolve(__dirname, 'packages/code-execution/src'),
      '@codeforge/editor': path.resolve(__dirname, 'packages/editor/src'),
      '@codeforge/gamification': path.resolve(__dirname, 'packages/gamification/src'),
      '@codeforge/worlds': path.resolve(__dirname, 'packages/worlds/src'),
      '@codeforge/avatar': path.resolve(__dirname, 'packages/avatar/src'),
      '@codeforge/community': path.resolve(__dirname, 'packages/community/src'),
      '@codeforge/builds': path.resolve(__dirname, 'packages/builds/src'),
      '@codeforge/ai-assistant': path.resolve(__dirname, 'packages/ai-assistant/src'),
      '@codeforge/authoring': path.resolve(__dirname, 'packages/authoring/src'),
      '@codeforge/templates': path.resolve(__dirname, 'packages/templates/src'),
      '@codeforge/assessment': path.resolve(__dirname, 'packages/assessment/src'),
      '@codeforge/analytics': path.resolve(__dirname, 'packages/analytics/src'),
      '@codeforge/adaptive': path.resolve(__dirname, 'packages/adaptive/src'),
      '@codeforge/competitive': path.resolve(__dirname, 'packages/competitive/src'),
      '@codeforge/mentorship': path.resolve(__dirname, 'packages/mentorship/src'),
      '@codeforge/theming': path.resolve(__dirname, 'packages/theming/src'),
      '@codeforge/i18n': path.resolve(__dirname, 'packages/i18n/src'),
      '@codeforge/a11y': path.resolve(__dirname, 'packages/a11y/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});