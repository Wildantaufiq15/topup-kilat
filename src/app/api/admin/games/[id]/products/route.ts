import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/admin/games/[id]/products - Get products by game ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const { data, error } = await supabaseAdmin
      .from('game_products')
      .select('*')
      .eq('game_id', id)
      .order('price')

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// POST /api/admin/games/[id]/products - Create product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const { data, error } = await supabaseAdmin
      .from('game_products')
      .insert({ ...body, game_id: id })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error creating product:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
