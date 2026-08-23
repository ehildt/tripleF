import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.spec.ts'],
    coverage: {
      exclude: ['**/index.ts', '**/*.d.ts', '**/node_modules/**', 'dist/**', 'coverage/**'],
    },
  },
});
