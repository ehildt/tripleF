import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/bootstrap/index.ts',
    'src/find-up/index.ts',
    'src/get-boolean-env/index.ts',
    'src/get-byte-size-env/index.ts',
    'src/get-number-env/index.ts',
    'src/hash-payload/index.ts',
    'src/is-buffer-or-serialized/index.ts',
    'src/object-io/index.ts',
    'src/text-to-lines/index.ts',
  ],
  format: ['esm'],
  target: 'node24',
  platform: 'node',
  tsconfig: 'tsconfig.build.json',
  splitting: true,
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
