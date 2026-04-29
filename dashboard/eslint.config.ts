import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sonarjs from 'eslint-plugin-sonarjs';
import eslintPluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import typescriptEslint from 'typescript-eslint';

const __dirname = import.meta.dirname;

export default defineConfig([
  {
    ignores: ['*.d.ts', '**/coverage', '**/dist'],
  },

  // Base + TS
  eslint.configs.recommended,
  eslintPluginPrettierRecommended,
  ...typescriptEslint.configs.recommended,

  // Vue (flat configs are arrays; spread and scope to .vue)
  ...eslintPluginVue.configs['flat/recommended'].map((cfg) => ({
    ...cfg,
    files: ['**/*.vue'],
  })),

  // SonarJS recommended rules
  sonarjs.configs.recommended,

  // Project-wide settings / overrides
  {
    files: ['**/*.{ts,vue,js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        tsconfigRootDir: __dirname,
        parser: typescriptEslint.parser,
        sourceType: 'module',
      },
    },
  },

  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'prettier/prettier': [
        'error',
        {
          printWidth: 80,
          trailingComma: 'all',
          bracketSpacing: true,
          usePrettierrc: true,
        },
      ],
      // Import sorting
      'simple-import-sort/imports': [
        'warn',
        {
          groups: [
            // side effect imports
            ['^\\u0000'],
            // node builtins
            ['^node:'],
            // packages
            ['^@?\\w'],
            // alias paths like @/ or ~/
            ['^(@|~)/'],
            // parent, sibling, index
            [
              '^\\.\\.(?!/?$)',
              '^\\.\\./?$',
              '^\\./(?=.*/)(?!/?$)',
              '^\\.(?!/?$)',
              '^\\./?$',
            ],
            // styles
            ['^.+\\.s?css$'],
          ],
        },
      ],

      'simple-import-sort/exports': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'sonarjs/cognitive-complexity': 'warn',
      'sonarjs/todo-tag': 'warn',
      'sonarjs/no-identical-expressions': 'warn',
      'vue/multi-word-component-names': 'off',
    },
  },

  // Keep last to disable Prettier-conflicting rules
  eslintConfigPrettier,
]);
