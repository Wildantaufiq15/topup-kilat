import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/admin/users - Get all users
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// PUT /api/admin/users - Update user
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing user id' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error updating user:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
