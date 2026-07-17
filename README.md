# Topup Kilat

Platform top up game tercepat dan paling dipercaya di Indonesia.

## Tech Stack

- **Frontend**: Next.js 15 + React + TypeScript + Tailwind CSS + Framer Motion
- **State Management**: React Context
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payment Gateway**: Sakurupiah
- **Notifications**: Fonnte WhatsApp API
- **Validation**: Zod (runtime schema validation)
- **Rate Limiting**: Upstash Redis (optional)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Sakurupiah account (for payment gateway)
- Fonnte account (for WhatsApp notifications)

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=https://topupkilat.store

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Digiflazz (Game Supplier)
DIGIFLAZZ_PROXY_URL=https://api.topupkilat.store
DIGIFLAZZ_USERNAME=your-username

# Sakurupiah Payment Gateway
SAKURUPIAH_API_ID=your-api-id
SAKURUPIAH_API_KEY=your-api-key
SAKURUPIAH_API_URL=https://sakurupiah.id/api
SAKURUPIAH_CALLBACK_URL=https://topupkilat.store/api/callback/sakurupiah

# Fonnte WhatsApp Notifications
FONNTE_API_KEY=your-fonnte-api-key
ADMIN_WHATSAPP_NUMBER=08xxxxxxxxx

# Upstash Redis (for Rate Limiting - Optional)
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build

```bash
npm run build
npm start
```

## Docker

### Build Image

```bash
# Build the Docker image
docker build -t topupkilat .

# Run the container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
  -e SAKURUPIAH_API_ID=your-api-id \
  -e SAKURUPIAH_API_KEY=your-api-key \
  -e SAKURUPIAH_SANDBOX=true \
  -e FONNTE_API_KEY=your-fonnte-key \
  -e ADMIN_WHATSAPP_NUMBER=08xxxxxxxxx \
  topupkilat
```

### Docker Compose (Local Development)

```bash
# Create .env.docker from .env.example with your values
cp .env.example .env.docker

# Edit .env.docker with your credentials

# Start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Health Check

The container includes a health check at `/api/health`. Docker will automatically monitor this endpoint.

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' topupkilat
```

## Database Setup

### Running Migrations

All database migrations are stored in `supabase/migrations/`. To apply migrations:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Copy and paste the migration file content
5. Click **Run**

### Migration Files

| File | Description |
|------|-------------|
| `supabase-setup.sql` | Initial schema setup (tables, columns) |
| `supabase/migrations/001_enable_rls.sql` | Enable Row Level Security (RLS) |
| `supabase/migrations/002_fix_rls_guest_checkout.sql` | Fix RLS for guest checkout |
| `supabase/migrations/003_update_promos_images.sql` | Update promos images |
| `supabase/migrations/005_create_storage_buckets.sql` | Create Supabase Storage buckets |
| `supabase/migrations/006_create_increment_voucher_usage.sql` | RPC for voucher usage |
| `supabase/migrations/007_remove_direct_insert_policies.sql` | Remove direct INSERT policies |
| `supabase/migrations/008_add_performance_indexes.sql` | Add database indexes |
| `supabase/migrations/009_fulfillment.sql` | Add fulfillment columns & SKU codes |
| `supabase/migrations/010_webhook_idempotency.sql` | Add payment_callback_log table |

> ⚠️ **Important**: `supabase-setup.sql` creates tables with RLS disabled. Always apply `001_enable_rls.sql` after setting up the schema.

### RLS (Row Level Security) - IMPORTANT

RLS is **critical for security**. After initial setup, you must apply RLS policies to protect user data.

#### Applying RLS Migration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Run `supabase/migrations/001_enable_rls.sql`

#### What RLS Protects

| Table | Public Read | Authenticated | Admin Only |
|-------|-------------|---------------|------------|
| `users` | ❌ | Own profile only | Full access |
| `games` | ✅ Active only | ✅ Active only | Full access |
| `game_products` | ✅ Active only | ✅ Active only | Full access |
| `orders` | ❌ | Own orders only | Full access |
| `payments` | ❌ | Own payments only | Full access |
| `vouchers` | ✅ Active only | ✅ Active only | Full access |
| `promos` | ✅ Active only | ✅ Active only | Full access |
| `wishlists` | ❌ | Own wishlists | Full access |
| `points_ledger` | ❌ | Own transactions | Full access |
| `notifications` | ❌ | Own notifications | Full access |
| `supplier_requests` | ❌ | ❌ | ✅ Full access |

#### Key Security Principles

1. **Orders/Payments Status Updates** - Only server-side API routes can update status (using service_role key). Client cannot directly update.
2. **User Role Protection** - Only admins can change roles; users cannot elevate their own privileges.
3. **User Data Isolation** - Users can only see their own orders, payments, wishlists, points, and notifications.
4. **Public Read Access** - Only `games`, `game_products`, `promos`, and `vouchers` can be read without authentication.

#### Testing RLS

After applying RLS, run the test script to verify policies:

```bash
# Set environment variables first
export NEXT_PUBLIC_SUPABASE_URL=your-url
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
export SUPABASE_SERVICE_ROLE_KEY=your-service-key

# Run tests
npx tsx scripts/test-rls-security.ts
```

Expected output:
- ✅ Anon cannot update user role
- ✅ Anon cannot update order status
- ✅ Anon cannot update payment status
- ✅ User A cannot see User B's orders
- ✅ Anon can read public games and promos
- ✅ Anon cannot access supplier_requests

#### Verifying RLS Status

To check if RLS is enabled on your tables:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

All tables should show `rowsecurity = true`.

To check existing policies:

```sql
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin panel pages
│   ├── api/               # API routes
│   ├── games/             # Games listing page
│   ├── topup/[slug]/      # Top up detail page
│   ├── checkout/          # Checkout page
│   ├── login/             # Login page
│   └── register/          # Register page
├── components/
│   ├── ui/                # Base UI components
│   ├── game/              # Game-specific components
│   └── admin/             # Admin components
├── context/               # React Context providers
├── lib/                   # Utilities and helpers
└── types/                 # TypeScript type definitions

supabase/
└── migrations/            # Database migrations

scripts/
└── test-rls-security.ts   # RLS security tests
```

## Features

### User Features
- [x] Landing page with featured games
- [x] Game listing with search and filters
- [x] Top up detail page with ID validation
- [x] Product/nominal selection
- [x] Checkout with payment method selection
- [x] QRIS and Virtual Account payments
- [x] Order history dashboard
- [x] User profile management
- [x] Wishlist
- [x] Voucher/promo code support

### Admin Features
- [x] Dashboard with statistics
- [x] Transaction management
- [x] Product/game management
- [x] Voucher management
- [x] User management with role-based access
- [x] Featured games toggle
- [x] Banner upload for games

### Payment Integration
- [x] Sakurupiah payment gateway
- [x] QRIS (Direct scan)
- [x] Virtual Account (BCA, BRI, BNI, Mandiri)
- [x] E-Wallet (GoPay, DANA, ShopeePay, OVO, LinkAja)
- [x] Payment status polling
- [x] WhatsApp notifications via Fonnte

## Deployment

The project is deployed on Vercel. Push to the `main` branch to trigger deployment.

### Production Checklist

Before going live:

1. [x] Apply RLS migration (`supabase/migrations/001_enable_rls.sql`)
2. [x] Apply all database migrations
3. [x] Run RLS security tests and verify all pass
4. [ ] Set Sakurupiah to production mode
5. [ ] Update Sakurupiah API credentials to production
6. [ ] Update callback URL to production domain
7. [ ] Deposit saldo ke Digiflazz (~Rp 500.000)
8. [ ] Verify webhook endpoint is accessible
9. [ ] Test complete payment flow (end-to-end)
10. [x] Setup Upstash Redis untuk rate limiting (optional)
11. [x] Review pg_policies to confirm all policies are created correctly

## Security Notes

### Why RLS is Critical

The Supabase `anon` key is publicly accessible (embedded in client bundles). Without RLS:
- Anyone can read ALL user data
- Anyone can modify order statuses
- Anyone can elevate their privileges to admin

### Payment Integrity (Price Tampering Prevention)

Client-side price manipulation is a critical vulnerability in payment flows. Attackers can use browser DevTools or API clients (Postman, curl) to modify the `amount` parameter before it's sent to the server.

#### Protection Measures

1. **Server-Side Price Calculation**: The payment endpoint (`/api/payments/create`) never accepts `amount` from the client. It always fetches the real price from the database.

2. **Order Total Validation**: Before creating a payment, the server:
   - Fetches the order from database
   - Recalculates the total from `product.price - voucher_discount`
   - Compares with the stored `orders.total`
   - Rejects if there's a mismatch (possible tampering)

3. **Double Payment Prevention**: The system prevents creating multiple payments for the same order:
   - Rejects if order already has a PAID payment
   - Rejects if order already has a PENDING payment

4. **Transaction Limits**: Enforces maximum transaction amount (Rp 50,000,000).

5. **Zod Validation**: All API inputs are validated with Zod schemas to prevent invalid data.

```typescript
// Payment API only accepts orderId, not amount
POST /api/payments/create
{
  "orderId": "uuid",      // Required, validated with UUID format
  "method": "QRIS",       // Required, validated with enum
  "userName": "..."       // Optional
  // NOTE: "amount" is NOT accepted - server fetches from database
}
```

### Rate Limiting

Rate limiting protects against:
- Brute force attacks
- API abuse
- DDoS attempts

#### Configuration

| Endpoint | Limit | Purpose |
|----------|-------|---------|
| `/api/orders/create` | 10/min | Prevent spam orders |
| `/api/payments/create` | 10/min | Prevent payment abuse |
| `/api/callback/sakurupiah` | 30/min | Webhook traffic |

Rate limiting is optional and requires Upstash Redis. If not configured, requests are allowed.

**To test payment integrity:**
```bash
npx tsx scripts/test-payment-tampering.ts
```

### Webhook Security (Payment Callbacks)

Payment gateway callbacks are **critical security endpoints** that process financial transactions. Without proper signature verification:

- Attackers could send fake payment notifications
- Unpaid orders could be marked as PAID
- Financial fraud could occur

#### Sakurupiah Callback Protection

All callbacks MUST include a valid `x-callback-signature` header containing HMAC-SHA256 of the request body:

```typescript
// Signature verification is MANDATORY
const isValid = verifyCallbackSignature(rawBody, signature)
if (!isValid) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
}
```

**To test webhook security:**
```bash
npx tsx scripts/test-callback-security.ts
```

#### Webhook Files

| File | Description |
|------|-------------|
| `src/app/api/callback/sakurupiah/route.ts` | Sakurupiah payment callback (signature verified) |

### RLS Best Practices

1. **Never trust client input** - Always validate server-side
2. **Use service_role key only in server-side API routes** - Never expose to client
3. **Test RLS policies** - Run `test-rls-security.ts` after any policy changes
4. **Test payment integrity** - Run `test-payment-tampering.ts` to verify price cannot be manipulated
5. **Test webhook security** - Run `test-callback-security.ts` to verify signature validation

## Troubleshooting

### RLS Issues After Migration

If you get "Permission denied" errors after applying RLS:

1. **Check the user's authentication status** - Are they logged in?
2. **Verify the RLS policy conditions match the query** - Check `pg_policies`
3. **Check Supabase logs for policy evaluation details** - Dashboard > Logs
4. **Confirm RLS is enabled** - Run the verification query above

### Common Issues

| Issue | Solution |
|-------|----------|
| "Permission denied" on SELECT | Check if RLS is enabled and policy exists |
| Cannot insert/update data | Verify user is authenticated and policy allows the operation |
| Anon can access protected data | RLS migration not applied - run `001_enable_rls.sql` |
| Admin can't access all data | Check `is_admin()` function and user role in database |

### API Routes Using Service Role

Some API routes need service role access for admin operations:

- `/api/payments/create` - Creates payment with server-calculated amounts
- `/api/callback/sakurupiah` - Updates payment status (webhook)
- `/api/payments/status` - Checks payment status with Sakurupiah API

These routes use `supabaseAdmin` (service role client) internally.

## License

MIT

---

*Last updated: July 2026*
