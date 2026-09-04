import path from 'node:path';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import vue from '@vitejs/plugin-vue';
import { playwright } from '@vitest/browser-playwright';
import { configDefaults, defineConfig } from 'vitest/config';
const dirname = import.meta.dirname;

// Browser-backed projects (vitest browser mode, real Chromium via Playwright)
// are opt-in: the default `pnpm test` run stays fast and jsdom-only.
const browserProjectsEnabled = process.env.VITEST_ENABLE_BROWSER === 'true';

const browserInstance = {
  enabled: true,
  headless: true,
  provider: playwright({}),
  instances: [{ browser: 'chromium' }],
} as const;

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**'],
      exclude: [
        'src/main.ts',
        'src/test/**',
        'src/**/*.type.ts',
        'src/types/**',
        'src/api/**',
        'src/assets/**',
      ],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'jsdom',
          globals: true,
          environment: 'jsdom',
          setupFiles: ['./vitest-globals.ts'],
          exclude: [
            ...configDefaults.exclude,
            '**/node_modules/**',
            '**/dist/**',
            '**/*.browser.spec.ts',
          ],
        },
      },
      ...(browserProjectsEnabled
        ? [
            // Real-browser project: spec files ending in .browser.spec.ts run in
            // real Chromium (real IndexedDB, real localStorage) via Playwright.
            {
              extends: true,
              test: {
                name: 'browser',
                include: ['src/**/*.browser.spec.ts'],
                browser: browserInstance,
              },
            },
            {
              extends: true,
              plugins: [
                // The plugin will run tests for the stories defined in your Storybook config
                // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
                storybookTest({
                  configDir: path.join(dirname, '.storybook'),
                }),
              ],
              test: {
                name: 'storybook',
                browser: browserInstance,
              },
            },
          ]
        : []),
    ],
  },
});
