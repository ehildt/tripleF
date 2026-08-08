import path from 'node:path';

import swc from 'unplugin-swc';
import { defineConfig, type Plugin } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.spec.ts'],
    coverage: {
      exclude: ['**/*.dto.ts', '**/*.model.ts', '**/dtos/**/*.ts'],
    },
  },
  plugins: [
    // Vitest's OXC pipeline doesn't emit decorator metadata, so NestJS DI
    // tokens would be lost; SWC transpiles like tsc (legacyDecorator +
    // decoratorMetadata). https://docs.nestjs.com/recipes/swc#vitest
    // The cast bridges unplugin's Vite-8 plugin types to the Vite-7 types
    // this vitest copy resolves; the plugin is runtime-compatible with both.
    swc.vite({
      // Explicit module type so a `.swcrc` can't change output to CJS.
      module: { type: 'es6' },
    }) as unknown as Plugin,
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
