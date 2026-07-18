/**
 * Admin API Client
 *
 * Provides authenticated API calls for admin pages
 * Automatically includes auth token from Supabase session
 */

import { supabase } from './supabase'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: any
}

export async function adminApi(endpoint: string, options: ApiOptions = {}) {
  const { method = 'GET', body } = options

  // Get auth token from Supabase session
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('Not authenticated')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add auth token
  if (session.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }

  const response = await fetch(endpoint, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const result = await response.json()

  if (!result.success) {
    throw new Error(result.message || 'Request failed')
  }

  return result
}

// Convenience methods
export const admin = {
  get: (endpoint: string) => adminApi(endpoint, { method: 'GET' }),
  post: (endpoint: string, body?: any) => adminApi(endpoint, { method: 'POST', body }),
  put: (endpoint: string, body?: any) => adminApi(endpoint, { method: 'PUT', body }),
  patch: (endpoint: string, body?: any) => adminApi(endpoint, { method: 'PATCH', body }),
  delete: (endpoint: string) => adminApi(endpoint, { method: 'DELETE' }),
}
