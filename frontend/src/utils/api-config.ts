import { client } from '@/client/client.gen'

/**
 * Configures the API client with base URL and authentication
 */
export function setupApiClient() {
  // Configure the client with base URL and options
  client.setConfig({
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    // Enable sending cookies for JWT authentication
    credentials: 'include',
    // Additional headers for CORS and content type
    headers: {
      'Content-Type': 'application/json',
    },
  })

  return client
}

// Export configured client for use throughout the application
export const apiClient = setupApiClient()
