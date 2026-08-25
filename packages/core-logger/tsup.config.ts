import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/core-logger/index.ts'],
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
      '@nestjs/common',
      '@nestjs/swagger',
      'joi',
      'pino',
      'pino-pretty',
    ];
  },
  treeshake: true,
  dts: true,
});
