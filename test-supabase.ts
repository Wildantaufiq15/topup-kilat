// Quick test script to verify Supabase connection
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tzykgukfnmgjwvaebtnc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6eWtndWtmbm1nand2YWVidG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMjMzNTAsImV4cCI6MjA5ODg5OTM1MH0.OK9X2af-Rv9jm-bcmgLmiEoy8vIlAFnsahRT88QbwEg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🔄 Testing Supabase connection...\n');

  // Test 1: Check tables exist
  console.log('1️⃣ Checking tables...');
  const { data: games, error: gamesError } = await supabase.from('games').select('count');

  if (gamesError) {
    console.log('❌ Error:', gamesError.message);
    console.log('\n💡 Make sure you ran the SQL schema in Supabase SQL Editor first!');
    return;
  }

  console.log('✅ Tables accessible! Games count:', games?.[0]?.count || 0);

  // Test 2: List games
  console.log('\n2️⃣ Fetching games...');
  const { data: gamesList, error: gamesListError } = await supabase
    .from('games')
    .select('*')
    .limit(3);

  if (gamesListError) {
    console.log('❌ Error:', gamesListError.message);
    return;
  }

  console.log('✅ Found', gamesList?.length || 0, 'games:');
  gamesList?.forEach(game => {
    console.log(`   - ${game.name} (${game.slug})`);
  });

  // Test 3: Check if we can insert
  console.log('\n3️⃣ Testing insert (will rollback)...');
  const testId = 'test-' + Date.now();
  const { error: insertError } = await supabase.from('games').insert({
    id: testId,
    name: 'Test Game',
    slug: 'test-' + Date.now(),
    category: 'MOBILE',
    logo: 'https://example.com/test.png',
    is_active: true,
  });

  if (insertError) {
    console.log('⚠️  Insert test skipped/error:', insertError.message);
  } else {
    // Rollback
    await supabase.from('games').delete().eq('id', testId);
    console.log('✅ Insert works!');
  }

  console.log('\n🎉 Supabase connection is working!');
}

testConnection().catch(console.error);
