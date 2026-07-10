/**
 * Check ALL Products (including inactive)
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function checkAllProducts() {
  // Using REST API directly
  const response = await fetch(`${SUPABASE_URL}/rest/v1/game_products?select=id,name,price,is_active,game_id&order=created_at.desc&limit=20`, {
    headers: {
      'apikey': ANON_KEY!,
      'Authorization': `Bearer ${ANON_KEY}`,
    }
  })

  const products = await response.json()

  console.log('🔍 All Products (including inactive):\n')
  console.log(`Found: ${Array.isArray(products) ? products.length : 0}\n`)

  if (Array.isArray(products) && products.length > 0) {
    products.forEach(p => {
      console.log(`${p.is_active ? '✅' : '❌'} ${p.name} - Rp ${p.price?.toLocaleString('id-ID') || 'N/A'} - Active: ${p.is_active}`)
    })
  } else {
    console.log('No products found at all!')
  }
}

checkAllProducts().catch(console.error)
