import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/admin/games - Get all games
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('games')
      .select('*')
      .order('sort_order')

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    console.error('Error fetching games:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// POST /api/admin/games - Create game
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, error } = await supabaseAdmin
      .from('games')
      .insert(body)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error creating game:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// PUT /api/admin/games - Update game
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing game id' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('games')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error updating game:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// DELETE /api/admin/games - Delete game
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing game id' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('games')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting game:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
