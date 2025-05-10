import { client } from '@/client/client.gen'

/**
 * Configures the API client with base URL and authentication
 */
export function setupApiClient() {
  // Configure the client with base URL and other options
  client.setConfig({
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    headers: () => {
      // Add authentication if needed
      const token = localStorage.getItem('auth_token')
      return token ? { Authorization: `Bearer ${token}` } : {}
    },
    // Optional: Configure request/response interceptors
    onResponse: (response) => {
      // Handle response globally if needed
      return response
    },
    onError: (error) => {
      // Global error handling
      console.error('API request failed:', error)
      throw error
    },
  })

  return client
}

// Export configured client for use throughout the application
export const apiClient = setupApiClient()
