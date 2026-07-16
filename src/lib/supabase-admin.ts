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
  if (!supabaseAdminInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Missing Supabase environment variables. ' +
        'Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
      )
    }

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
