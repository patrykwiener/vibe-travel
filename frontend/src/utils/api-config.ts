import { client } from '@/client/client.gen'
import { getAppConfig, getApiClientOptions, validateEnvironment } from './environment'

/**
 * Configures the API client with base URL and authentication
 */
export function setupApiClient() {
  // Validate environment configuration
  validateEnvironment()

  const config = getAppConfig()
  const clientOptions = getApiClientOptions()

  console.log(`Configuring API client for ${config.environment} environment`)
  console.log(`API Base URL: ${config.apiBaseUrl}`)
  console.log(`API Timeout: ${config.apiTimeout}ms`)

  // Configure the client with base URL and options
  client.setConfig(clientOptions)

  return client
}

/**
 * Get current API configuration
 */
export function getApiClientConfig() {
  return getAppConfig()
}

// Export configured client for use throughout the application
export const apiClient = setupApiClient()
