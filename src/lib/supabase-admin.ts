/**
 * Supabase Admin Client
 * Server-side only - uses service role key for bypassing RLS
 *
 * IMPORTANT: This should ONLY be used in:
 * - API routes (server-side)
 * - Server Actions
 * - Background jobs
 *
 * NEVER import this in client-side code (components, pages, etc.)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time errors
let supabaseAdminInstance: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
  // Return a mock client during build time to avoid errors
  // Vercel will have the actual env vars at runtime
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  // During build time, return a mock that will be replaced at runtime
  if (!supabaseUrl || !supabaseKey) {
    // Create a minimal mock client that won't crash during build
    // It will be replaced by the real client at runtime when env vars are available
    if (!supabaseAdminInstance) {
      // Use placeholder values - will be replaced at runtime
      supabaseAdminInstance = createClient(
        'https://placeholder.supabase.co',
        'placeholder-key',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )
    }
    return supabaseAdminInstance
  }

  // Runtime: create real client
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return supabaseAdminInstance
}

/**
 * Example usage in API routes:
 *
 * ```ts
 * import { supabaseAdmin } from '@/lib/supabase-admin'
 *
 * // This bypasses RLS and can update any row
 * const { data, error } = await supabaseAdmin()
 *   .from('orders')
 *   .update({ status: 'PAID' })
 *   .eq('id', orderId)
 * ```
 */
export const supabaseAdmin = {
  from: (table: string) => getSupabaseAdmin().from(table),
  rpc: (fn: string, params?: any) => getSupabaseAdmin().rpc(fn, params),
  auth: getSupabaseAdmin().auth,
}
