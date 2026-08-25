import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/bullmq-logger/index.ts'],
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
      '@nestjs/common',
      '@nestjs/swagger',
      'bullmq',
      'joi',
      'pino',
      'pino-pretty',
    ];
  },
  treeshake: true,
  dts: true,
});
