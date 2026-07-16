# RLS Policy Analysis: Removing Direct INSERT for Orders

## Current State

The current RLS policies allow direct INSERT to the `orders` and `payments` tables from:
1. **anon (guest)** - via `Anon can insert own orders` and `Anon can insert payments for guest orders`
2. **authenticated** - via `Users can insert own orders` and `Users can insert payments for own orders`

This was designed to support direct Supabase client calls from the browser.

## After the Security Fix

With the new `/api/orders/create` endpoint:
- All order creation now goes through a server-side API route
- The route uses `SUPABASE_SERVICE_ROLE_KEY` which bypasses RLS
- Client only sends identifiers (gameSlug, productId, etc.)
- All price calculations happen server-side

## Should We Remove Direct INSERT Policies?

### Option A: Remove Direct INSERT Policies (Recommended for Maximum Security)

**Benefits:**
1. **Defense in depth** - Even if there's a vulnerability in the API route, direct database manipulation is blocked
2. **Single source of truth** - All order creation must go through validated server code
3. **Audit trail** - API routes can log all order creation attempts
4. **Consistent validation** - Voucher validation, price calculation, etc. cannot be bypassed

**Risks:**
1. If the API route has a bug, orders cannot be created at all
2. Any code that directly inserts orders will break
3. Testing becomes more complex (must go through API)

### Option B: Keep Direct INSERT Policies (Current State)

**Benefits:**
1. **Backward compatibility** - Existing code continues to work
2. **Simpler debugging** - Can query the database directly
3. **Redundancy** - If API route fails, direct inserts can still work (but without validation!)

**Risks:**
1. **Security vulnerability remains** - If direct inserts are possible, they bypass server validation
2. **Inconsistent state** - Orders created directly won't have properly validated prices
3. **Audit gap** - Direct inserts don't go through API logging

## Recommendation: Remove Direct INSERT Policies

**Why:**
1. The API route now handles all order creation with proper validation
2. Defense in depth is critical for financial transactions
3. Any legitimate use case (admin tools, testing) can use service role keys directly

**What to Remove:**
1. `Anon can insert own orders` (orders INSERT for guest)
2. `Users can insert own orders` (orders INSERT for authenticated)
3. `Anon can insert payments for guest orders` (payments INSERT for guest)
4. `Users can insert payments for own orders` (payments INSERT for authenticated)

**What to Keep:**
1. SELECT policies (needed for users to view their orders)
2. UPDATE policies for admins (order status updates)
3. The `payments` table INSERT policies should be evaluated - currently payment creation also goes through `/api/payments/create`

## Migration Plan

See `007_remove_direct_insert_policies.sql` for the implementation.
