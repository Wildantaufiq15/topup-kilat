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

import { createClient } from '@supabase/supabase-js'

// Create admin client with service role key
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * Example usage in API routes:
 *
 * ```ts
 * import { supabaseAdmin } from '@/lib/supabase-admin'
 *
 * // This bypasses RLS and can update any row
 * const { data, error } = await supabaseAdmin
 *   .from('orders')
 *   .update({ status: 'PAID' })
 *   .eq('id', orderId)
 * ```
 */
