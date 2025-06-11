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
    setupFiles: ['./src/test/setup.ts'],

    // Include test files pattern
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
        'coverage/',
        'src/client/**', // Exclude auto-generated API client
      ],
      // Coverage thresholds - fail build if not met
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
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
    },
  },
})
