import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/schemas/index.ts', 'src/prompts/index.ts', 'src/tools/index.ts'],
  format: ['esm'],
  target: 'node24',
  platform: 'node',
  tsconfig: 'tsconfig.build.json',
  splitting: false,
  bundle: true,
  shims: true,
  clean: true,
  outDir: 'dist',
  outExtension: () => ({ js: '.mjs' }),
  esbuildOptions(options) {
    options.platform = 'node';
    options.external = [
      'node:*',
      'net',
      'http',
      'https',
      'tls',
      'crypto',
      'path',
      'fs',
      'os',
      'url',
      'child_process',
      'util',
      'ai',
      'zod',
      '@triplef/helpers',
      '@mozilla/readability',
      'linkedom',
      'turndown',
    ];
  },
  treeshake: true,
  dts: true,
});
