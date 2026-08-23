import pluginJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '.husky',
      '.gitlab',
      '.vscode',
      '.json',
      '.depcruise.mjs',
      '**/generated/**',
    ],
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  eslintConfigPrettier,
  {
    plugins: {
      sonarjs,
      'simple-import-sort': simpleImportSort,
    },
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: 'tsconfig.json',
        sourceType: 'module',
        ecmaVersion: 'latest',
        parser: '@typescript-eslint/parser',
      },
    },
    rules: {
      'no-console': 'warn',
      'prettier/prettier': [
        'error',
        {
          printWidth: 80,
          trailingComma: 'all',
          bracketSpacing: true,
          usePrettierrc: true,
        },
      ],
      'simple-import-sort/exports': 'warn',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'warn',
      'sonarjs/cognitive-complexity': 'warn',
      'sonarjs/no-identical-expressions': 'warn',
      'simple-import-sort/imports': [
        'warn',
        {
          groups: [
            // Node.js builtins
            ['^node:'],
            // Packages
            ['^@?\\w'],
            // Internal packages
            ['^(@app|@modules|@services)(/.*|$)'],
            // Side effect imports
            ['^\\u0000'],
            // Parent imports
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            // Sibling imports
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            // Style imports
            ['^.+\\.s?css$'],
          ],
        },
      ],
    },
  },
];
