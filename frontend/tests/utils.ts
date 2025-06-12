import { render, type RenderOptions } from '@testing-library/vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import type { Component } from 'vue'

// Create a mock router for tests
const createMockRouter = () => {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/login', component: { template: '<div>Login</div>' } },
      { path: '/notes', component: { template: '<div>Notes</div>' } },
      { path: '/notes/:noteId/edit', component: { template: '<div>Edit Note</div>' } },
    ],
  })
}

// Custom render function with providers
export const renderWithProviders = (component: Component, options: RenderOptions<Component> = {}) => {
  const pinia = createPinia()
  const router = createMockRouter()

  return render(component, {
    global: {
      plugins: [pinia, router],
      stubs: {
        // Completely bypass Transition component to render content directly
        Transition: false,
        ...options.global?.stubs,
      },
      ...options.global,
    },
    ...options,
  })
}

// Test helper for creating mock API responses
export const createMockApiResponse = <T>(data: T, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {},
})

// Test helper for creating mock API errors
export const createMockApiError = (message: string, status = 400) => ({
  response: {
    data: { detail: message },
    status,
    statusText: 'Bad Request',
  },
  message,
})

// Helper to wait for Vue's nextTick in tests
export const waitForNextTick = () => new Promise((resolve) => setTimeout(resolve, 0))

// Helper to create a mock user object
export const createMockUser = (overrides = {}) => ({
  id: '1',
  email: 'test@example.com',
  full_name: 'Test User',
  is_active: true,
  is_superuser: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})

// Helper to create a mock note object
export const createMockNote = (overrides = {}) => ({
  id: '1',
  title: 'Test Note',
  content: 'Test content',
  user_id: '1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
})
