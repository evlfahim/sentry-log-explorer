import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      core: path.resolve(__dirname, '../core/src'),
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/setupTests.ts'],
    watch: false,
    testTimeout: 15000,
    hookTimeout: 15000,
    teardownTimeout: 5000,
    include: ['src/components/**/*.test.{ts,tsx}', 'src/App.test.tsx', 'src/open-file.test.tsx'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    sequence: {
      concurrent: false,
    },
  },
});
