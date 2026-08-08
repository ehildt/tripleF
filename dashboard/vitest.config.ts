import path from 'node:path';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import vue from '@vitejs/plugin-vue';
import { playwright } from '@vitest/browser-playwright';
import { configDefaults, defineConfig } from 'vitest/config';
const dirname = import.meta.dirname;

const storybookBrowserEnabled = process.env.VITEST_ENABLE_BROWSER === 'true';

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
          globals: true,
          environment: 'jsdom',
          setupFiles: ['./vitest-globals.ts'],
          exclude: [
            ...configDefaults.exclude,
            '**/node_modules/**',
            '**/dist/**',
          ],
        },
      },
      ...(storybookBrowserEnabled
        ? [
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
                browser: {
                  enabled: true,
                  headless: true,
                  provider: playwright({}),
                  instances: [
                    {
                      browser: 'chromium',
                    },
                  ],
                },
              },
            },
          ]
        : []),
    ],
  },
});
