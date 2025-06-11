import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import globals from 'globals'

export default [
  // Global ignores
  {
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**', '**/src/client/*.gen.ts', '**/html/**'],
  },

  // Base configuration for all files
  js.configs.recommended,

  // TypeScript files configuration
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
    },
  },

  // Vue files configuration
  ...pluginVue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: pluginVue.parser,
      parserOptions: {
        parser: typescriptParser, // Use TypeScript parser for <script> blocks
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      vue: pluginVue,
    },
    rules: {
      ...typescript.configs.recommended.rules,
    },
  },

  // JavaScript files configuration
  {
    files: ['**/*.{js,mjs,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },

  // Test files configuration
  {
    files: ['**/*.{test,spec}.{js,ts,jsx,tsx}', '**/test/**/*.{js,ts,jsx,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        // Vitest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in test files
    },
  },

  // Prettier formatting skip
  skipFormatting,
]
