import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://tzykgukfnmgjwvaebtnc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6eWtndWtmbm1nand2YWVidG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzMjMzNTAsImV4cCI6MjA5ODg5OTM1MH0.OK9X2af-Rv9jm-bcmgLmiEoy8vIlAFnsahRT88QbwEg'
);

async function checkOrders() {
  console.log('🔍 Checking orders in Supabase...\n');

  // Check orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (ordersError) {
    console.log('❌ Orders error:', ordersError.message);
  } else {
    console.log('📦 Orders found:', orders?.length || 0);
    if (orders) {
      orders.forEach(o => {
        console.log('  Invoice:', o.invoice_no);
        console.log('  Status:', o.status);
        console.log('  Total: Rp', o.total?.toLocaleString('id-ID'));
        console.log('  User Game ID:', o.user_game_id);
        console.log();
      });
    }
  }

  // Check payments
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('*')
    .limit(5);

  if (paymentsError) {
    console.log('❌ Payments error:', paymentsError.message);
  } else {
    console.log('💳 Payments found:', payments?.length || 0);
    if (payments) {
      payments.forEach(p => {
        console.log('  Order ID:', p.order_id);
        console.log('  Method:', p.method);
        console.log('  Status:', p.status);
        console.log();
      });
    }
  }
}

checkOrders().catch(console.error);
