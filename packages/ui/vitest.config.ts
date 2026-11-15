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
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    watch: false,
    testTimeout: 15000,
    hookTimeout: 15000,
    teardownTimeout: 5000,
    // Only the real suites. The other src/*.test.* files are leftover experiments from
    // earlier debugging (custom JSDOM instances, source-text checks) and are not run.
    include: ['src/components/**/*.test.{ts,tsx}', 'src/App.test.tsx', 'src/open-file.test.tsx'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    // Child processes instead of worker threads: worker threads + jsdom can hang on Node 22.
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
