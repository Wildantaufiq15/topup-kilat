/**
 * Digiflazz Price List API
 *
 * Get available products from Digiflazz
 * GET: Fetch price list with optional filters
 */

import { NextRequest, NextResponse } from 'next/server'

// Mock price list data (replace with actual Digiflazz API call when available)
const MOCK_PRODUCTS = [
  {
    buyer_sku_code: 'ml10',
    sku_code: 'ML10',
    product_name: 'Mobile Legends 10 Diamonds',
    category: 'Games',
    brand: 'Mobile Legends',
    type: 'Send',
    price: 2000,
    price_base: 1900,
    margin: 100,
    stock: '1000',
    provider: 'HL',
    uniq: 0,
    status: 'Available',
  },
  {
    buyer_sku_code: 'ml55',
    sku_code: 'ML55',
    product_name: 'Mobile Legends 55 Diamonds',
    category: 'Games',
    brand: 'Mobile Legends',
    type: 'Send',
    price: 10000,
    price_base: 9500,
    margin: 500,
    stock: '1000',
    provider: 'HL',
    uniq: 0,
    status: 'Available',
  },
  {
    buyer_sku_code: 'ff50',
    sku_code: 'FF50',
    product_name: 'Free Fire 50 Diamonds',
    category: 'Games',
    brand: 'Free Fire',
    type: 'Send',
    price: 7500,
    price_base: 7000,
    margin: 500,
    stock: '1000',
    provider: 'FF',
    uniq: 0,
    status: 'Available',
  },
]

export async function GET(request: NextRequest) {
  const requestId = `pl-${Date.now()}`

  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const brand = searchParams.get('brand')
    const code = searchParams.get('code')

    console.log(`[${requestId}] Price list request:`, { category, brand, code })

    // TODO: Replace with actual Digiflazz API call when API is working
    // For now, return mock data filtered by params

    let products = [...MOCK_PRODUCTS]

    // Apply filters
    if (category) {
      products = products.filter(p => p.category.toLowerCase() === category.toLowerCase())
    }
    if (brand) {
      products = products.filter(p => p.brand.toLowerCase() === brand.toLowerCase())
    }
    if (code) {
      products = products.filter(p =>
        p.buyer_sku_code.toLowerCase().includes(code.toLowerCase()) ||
        p.product_name.toLowerCase().includes(code.toLowerCase())
      )
    }

    console.log(`[${requestId}] Returning ${products.length} products`)

    return NextResponse.json({
      success: true,
      data: products,
      count: products.length,
      filters: { category, brand, code },
    })
  } catch (error: any) {
    console.error(`[${requestId}] Error:`, error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch price list' },
      { status: 500 }
    )
  }
}
