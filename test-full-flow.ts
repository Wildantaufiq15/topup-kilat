import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tzykgukfnmgjwvaebtnc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6eWtndWtmbm1nand2YWVidG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMjMzNTAsImV4cCI6MjA5ODg5OTM1MH0.OK9X2af-Rv9jm-bcmgLmiEoy8vIlAFnsahRT88QbwEg'
);

async function testOrderFlow() {
  console.log('🔄 Testing full order flow...\n');

  // 1. Get a game
  console.log('1️⃣ Getting game...');
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('*')
    .eq('slug', 'mobile-legends')
    .single();

  if (gameError || !game) {
    console.log('❌ Game error:', gameError?.message);
    return;
  }
  console.log('✅ Game:', game.name);

  // 2. Get a product
  console.log('\n2️⃣ Getting product...');
  const { data: products, error: productsError } = await supabase
    .from('game_products')
    .select('*')
    .eq('game_id', game.id)
    .limit(1);

  if (productsError || !products || products.length === 0) {
    console.log('❌ Products error:', productsError?.message);
    return;
  }
  console.log('✅ Product:', products[0].name, '- Rp', products[0].price);

  // 3. Create order
  console.log('\n3️⃣ Creating order...');
  const invoiceNo = 'AUTO' + Date.now();

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      game_id: game.id,
      product_id: products[0].id,
      invoice_no: invoiceNo,
      user_game_id: '999888777',
      server_id: '1234',
      subtotal: products[0].price,
      total: products[0].price,
      status: 'PENDING',
    })
    .select()
    .single();

  if (orderError) {
    console.log('❌ Order error:', orderError.message);
    console.log('\n🔍 This is likely an RLS issue!');
    console.log('💡 Run this SQL in Supabase to fix:');
    console.log('   ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;');
    return;
  }

  console.log('✅ Order created!');
  console.log('   Invoice:', order.invoice_no);
  console.log('   Status:', order.status);

  // 4. Create payment
  console.log('\n4️⃣ Creating payment...');
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      order_id: order.id,
      method: 'QRIS',
      amount: order.total,
      status: 'PENDING',
      provider_ref: 'TEST-' + Date.now(),
      expired_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (paymentError) {
    console.log('❌ Payment error:', paymentError.message);
    return;
  }

  console.log('✅ Payment created!');
  console.log('\n🎉 FULL ORDER FLOW SUCCESS!');
  console.log('Invoice:', invoiceNo);
}

testOrderFlow().catch(console.error);
