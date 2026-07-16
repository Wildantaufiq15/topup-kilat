import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/admin/promos - Get all promos
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('promos')
      .select('*')
      .order('sort_order')

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    console.error('Error fetching promos:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// POST /api/admin/promos - Create promo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data, error } = await supabaseAdmin
      .from('promos')
      .insert(body)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error creating promo:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// PUT /api/admin/promos - Update promo
export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json()

    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing promo id' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('promos')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error updating promo:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// DELETE /api/admin/promos - Delete promo
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing promo id' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('promos')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting promo:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
