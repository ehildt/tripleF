import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/pdf/index.ts'],
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
    options.external = ['node:*', '@nestjs/common', 'pdfjs-dist', '@napi-rs/canvas'];
  },
  treeshake: true,
  dts: true,
});
