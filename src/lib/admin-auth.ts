/**
 * Admin Authentication Helper
 *
 * Provides authentication verification for admin API routes
 * Uses Supabase service role to bypass RLS for auth checks
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export type AdminRole = 'ADMIN' | 'SUPER_ADMIN' | 'CS' | 'FINANCE'

export interface AuthResult {
  success: boolean
  userId?: string
  role?: AdminRole
  error?: string
}

/**
 * Verify admin authentication from request
 * Checks:
 * 1. User is authenticated (valid session)
 * 2. User has admin role (ADMIN, SUPER_ADMIN, CS, FINANCE)
 *
 * @param request - The Next.js request object
 * @param required - If true, returns error when no token. If false, returns success when no token.
 */
export async function verifyAdminAuth(request: NextRequest, required: boolean = true): Promise<AuthResult> {
  try {
    // Get Authorization header
    const authHeader = request.headers.get('Authorization')

    // If no auth header and auth is not required, return success (public access)
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      if (!required) {
        return { success: true } // Public access allowed
      }
      return {
        success: false,
        error: 'Missing or invalid Authorization header'
      }
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.error('[Admin Auth] Token verification failed:', authError?.message)
      return {
        success: false,
        error: 'Invalid or expired token'
      }
    }

    // Get user role from users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role, is_active')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('[Admin Auth] User not found in database:', userError?.message)
      return {
        success: false,
        error: 'User not found'
      }
    }

    // Check if user is active
    if (!userData.is_active) {
      return {
        success: false,
        error: 'User account is disabled'
      }
    }

    // Check if user has admin role
    const validRoles: AdminRole[] = ['ADMIN', 'SUPER_ADMIN', 'CS', 'FINANCE']
    if (!validRoles.includes(userData.role as AdminRole)) {
      console.warn(`[Admin Auth] User ${user.id} with role ${userData.role} attempted admin access`)
      return {
        success: false,
        error: 'Insufficient permissions'
      }
    }

    return {
      success: true,
      userId: user.id,
      role: userData.role as AdminRole
    }

  } catch (error: any) {
    console.error('[Admin Auth] Unexpected error:', error)
    return {
      success: false,
      error: 'Authentication check failed'
    }
  }
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    { success: false, message },
    { status: 401 }
  )
}

/**
 * Create forbidden response
 */
export function forbiddenResponse(message: string = 'Forbidden'): NextResponse {
  return NextResponse.json(
    { success: false, message },
    { status: 403 }
  )
}
