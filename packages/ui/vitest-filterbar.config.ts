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
    watch: false,
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 3000,
    include: ['src/components/FilterBar.test.tsx'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
