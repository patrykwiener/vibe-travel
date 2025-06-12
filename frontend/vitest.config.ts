/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    // Enable global testing utilities like describe, it, expect
    globals: true,

    // Use jsdom environment for DOM testing
    environment: 'jsdom',

    // Setup files run before each test file
    setupFiles: ['./tests/setup.ts'],

    // Include test files pattern
    include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'coverage/',
        'src/client/**', // Exclude auto-generated API client
        'src/assets/**', // Exclude static assets
        'src/utils/api-config.ts', // Exclude API client configuration
        'src/main.ts', // Exclude main entry point
        'src/router/index.ts', // Exclude router setup
        'src/App.vue', // Exclude root Vue component
      ],
      // Coverage thresholds - fail build if not met
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },

    // Test output configuration
    reporters: ['verbose'],

    // Watch mode configuration
    watch: false,

    // Test timeout
    testTimeout: 10000,

    // Retry failed tests
    retry: 1,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@tests': fileURLToPath(new URL('./tests', import.meta.url)),
    },
  },
})
