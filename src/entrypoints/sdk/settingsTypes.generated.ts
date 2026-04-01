// Stub file for settings types
// These types would normally be generated from a JSON schema

export interface Settings {
  // API configuration
  apiKey?: string
  model?: string
  maxTokens?: number

  // Permissions
  permissionMode?: 'default' | 'plan' | 'bypassPermissions'

  // UI settings
  theme?: 'light' | 'dark' | 'system'

  // Experimental features
  experiments?: Record<string, boolean>

  // Allow any additional settings
  [key: string]: unknown
}
