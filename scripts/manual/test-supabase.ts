/**
 * Supabase Connection Test
 * Run with: npx tsx scripts/manual/test-supabase.ts
 *
 * Requires .env.local with:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!')
  console.log('\nMake sure you have .env.local with:')
  console.log('  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co')
  console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  console.log('🔄 Testing Supabase connection...\n')
  console.log('URL:', supabaseUrl)

  // Test 1: Check tables exist
  console.log('\n1️⃣ Checking tables...')
  const { data: games, error: gamesError } = await supabase.from('games').select('count')

  if (gamesError) {
    console.log('❌ Error:', gamesError.message)
    console.log('\n💡 Make sure you ran the SQL schema in Supabase SQL Editor first!')
    return
  }

  console.log('✅ Tables accessible! Games count:', games?.[0]?.count || 0)

  // Test 2: List games
  console.log('\n2️⃣ Fetching games...')
  const { data: gamesList, error: gamesListError } = await supabase
    .from('games')
    .select('*')
    .limit(3)

  if (gamesListError) {
    console.log('❌ Error:', gamesListError.message)
    return
  }

  console.log('✅ Found', gamesList?.length || 0, 'games:')
  gamesList?.forEach((game: any) => {
    console.log(`   - ${game.name} (${game.slug})`)
  })

  // Test 3: Check if we can insert (with RLS)
  console.log('\n3️⃣ Testing insert (with RLS)...')
  const testId = 'test-' + Date.now()
  const { error: insertError } = await supabase.from('games').insert({
    id: testId,
    name: 'Test Game',
    slug: 'test-' + Date.now(),
    category: 'MOBILE',
    logo: 'https://example.com/test.png',
    is_active: true,
  })

  if (insertError) {
    console.log('⚠️  Insert test skipped/error:', insertError.message)
    console.log('    This is expected if RLS is enabled!')
  } else {
    // Rollback
    await supabase.from('games').delete().eq('id', testId)
    console.log('✅ Insert works!')
  }

  console.log('\n🎉 Supabase connection is working!')
}

testConnection().catch(console.error)
