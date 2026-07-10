/**
 * Check Database Data
 * Run this to verify games and products exist
 * Uses anon key since games/products are publicly readable
 */

// Load environment variables
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('❌ Missing environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

async function checkData() {
  const client = createClient(SUPABASE_URL!, ANON_KEY!)

  console.log('🔍 Checking database data...\n')

  // Check games (publicly readable)
  const { data: games, error: gamesError } = await client
    .from('games')
    .select('id, name, slug, is_active, featured')
    .eq('is_active', true)

  if (gamesError) {
    console.error('Error fetching games:', gamesError)
  } else {
    console.log(`📦 Active Games found: ${games?.length || 0}`)
    if (games && games.length > 0) {
      games.forEach(g => {
        console.log(`   ✅ ${g.name} (${g.slug}) - Featured: ${g.featured ? '⭐' : '-'} ${g.id.slice(0, 8)}...`)
      })
    } else {
      console.log('   ⚠️  No ACTIVE games found!')
    }
  }

  // Check products (publicly readable)
  const { data: products, error: productsError } = await client
    .from('game_products')
    .select('id, name, price, is_active, game_id')
    .eq('is_active', true)
    .limit(10)

  if (productsError) {
    console.error('Error fetching products:', productsError)
  } else {
    console.log(`\n📦 Active Products found: ${products?.length || 0}`)
    if (products && products.length > 0) {
      products.forEach(p => {
        console.log(`   ✅ ${p.name} - Rp ${p.price.toLocaleString('id-ID')} - ${p.id.slice(0, 8)}...`)
      })
      if (products.length === 10) {
        console.log('   ... (showing first 10)')
      }
    } else {
      console.log('   ⚠️  No ACTIVE products found!')
    }
  }

  // Summary
  const hasGames = games && games.length > 0
  const hasProducts = products && products.length > 0

  console.log('\n' + '='.repeat(50))
  if (hasGames && hasProducts) {
    console.log('✅ Database has all required data!')
    console.log('   You can run: npx tsx scripts/test-payment-tampering.ts')
  } else {
    console.log('❌ Database is missing data:')
    if (!hasGames) console.log('   - No active games found')
    if (!hasProducts) console.log('   - No active products found')
    console.log('\n💡 Add games and products via admin panel:')
    console.log('   1. Go to /admin/products')
    console.log('   2. Add a game first')
    console.log('   3. Then add products for that game')
  }
}

checkData().catch(console.error)
