/**
 * Environment configuration utilities
 * Provides typed access to environment variables and configuration
 */

export type Environment = 'development' | 'staging' | 'production'

export interface AppConfig {
  apiBaseUrl: string
  environment: Environment
  devToolsEnabled: boolean
  apiTimeout: number
  isDevelopment: boolean
  isStaging: boolean
  isProduction: boolean
}

/**
 * Get the current application configuration from environment variables
 */
export function getAppConfig(): AppConfig {
  const environment = (import.meta.env.VITE_ENVIRONMENT || 'development') as Environment
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
  const devToolsEnabled = import.meta.env.VITE_DEV_TOOLS !== 'false'
  const apiTimeout = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10)

  return {
    apiBaseUrl,
    environment,
    devToolsEnabled,
    apiTimeout,
    isDevelopment: environment === 'development',
    isStaging: environment === 'staging',
    isProduction: environment === 'production',
  }
}

/**
 * Validate that all required environment variables are set
 */
export function validateEnvironment(): void {
  const config = getAppConfig()

  // Validate base URL format
  try {
    new URL(config.apiBaseUrl)
  } catch {
    throw new Error(`Invalid API base URL: ${config.apiBaseUrl}`)
  }

  // Validate timeout
  if (config.apiTimeout <= 0) {
    throw new Error(`Invalid API timeout: ${config.apiTimeout}`)
  }

  // Log configuration in development
  if (config.isDevelopment) {
    console.log('App Configuration:', {
      environment: config.environment,
      apiBaseUrl: config.apiBaseUrl,
      devToolsEnabled: config.devToolsEnabled,
      apiTimeout: config.apiTimeout,
    })
  }
}

/**
 * Get API client configuration options
 */
export function getApiClientOptions() {
  const config = getAppConfig()

  return {
    baseUrl: config.apiBaseUrl,
    credentials: 'include' as const,
    headers: {
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(config.apiTimeout),
  }
}
