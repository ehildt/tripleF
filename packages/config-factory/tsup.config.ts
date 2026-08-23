import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/cache-return-value/index.ts',
    'src/config-factory/index.ts',
    'src/validate-return-value/index.ts',
  ],
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
    ];
  },
  treeshake: true,
  dts: true,
});
