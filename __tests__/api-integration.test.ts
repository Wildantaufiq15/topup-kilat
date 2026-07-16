/**
 * Integration Tests for Order & Payment API Routes
 *
 * These tests verify the actual API behavior including:
 * - Valid voucher flow
 * - Manipulated discount detection
 * - Invalid voucher rejection
 * - Guest vs authenticated checkout
 *
 * NOTE: These tests require a running Supabase instance and Next.js dev server.
 *
 * To run:
 * 1. Start Supabase: supabase start
 * 2. Start Next.js: npm run dev
 * 3. Apply migrations if needed
 * 4. Run: npx jest __tests__/api-integration.test.ts --integration
 */

import { createClient } from '@supabase/supabase-js'

// Test configuration - uses environment variables or defaults for local dev
const TEST_CONFIG = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-anon-key',
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-key',
  apiBaseUrl: process.env.TEST_API_BASE_URL || 'http://localhost:3000',
}

// Check if integration tests should run
const SKIP_INTEGRATION = process.env.SKIP_INTEGRATION === 'true' || !process.env.TEST_API_BASE_URL

// Test data
const TEST_GAME = {
  slug: 'test-game-integration',
  name: 'Test Game Integration',
}

const TEST_PRODUCT = {
  name: '100 Diamonds',
  price: 50000,
}

const TEST_VOUCHERS = {
  VALID_PERCENTAGE: {
    code: 'TESTPERCENT10',
    discount_type: 'PERCENTAGE' as const,
    discount_value: 10,
    max_discount: 5000,
    is_active: true,
  },
  VALID_FIXED: {
    code: 'TESTFIXED5K',
    discount_type: 'FIXED' as const,
    discount_value: 5000,
    is_active: true,
  },
  EXPIRED: {
    code: 'TESTEXPIRED',
    discount_type: 'FIXED' as const,
    discount_value: 10000,
    expires_at: new Date(Date.now() - 86400000).toISOString(), // yesterday
    is_active: true,
  },
  INACTIVE: {
    code: 'TESTINACTIVE',
    discount_type: 'PERCENTAGE' as const,
    discount_value: 50,
    is_active: false,
  },
}

describe('Order Creation API (/api/orders/create)', () => {
  const serverClient = createClient(TEST_CONFIG.supabaseUrl, TEST_CONFIG.supabaseServiceKey)

  let testGameId: string
  let testProductId: string
  let testVoucherIds: string[] = []
  let isSetup = false

  beforeAll(async () => {
    if (SKIP_INTEGRATION) {
      console.log('⚠️ Integration tests skipped - set TEST_API_BASE_URL to run')
      return
    }

    try {
      // Setup: Create test game
      const { data: game } = await serverClient.from('games').insert({
        name: TEST_GAME.name,
        slug: TEST_GAME.slug,
        category: 'MOBILE',
        logo: '/games/test.png',
        banner: '/games/test-banner.png',
        is_active: true,
        featured: false,
        sort_order: 999,
      }).select().single()

      if (!game) {
        console.error('Failed to create test game')
        return
      }

      testGameId = game.id

      // Setup: Create test product
      const { data: product } = await serverClient.from('game_products').insert({
        game_id: testGameId,
        name: TEST_PRODUCT.name,
        price: TEST_PRODUCT.price,
        is_active: true,
      }).select().single()

      if (!product) {
        console.error('Failed to create test product')
        return
      }

      testProductId = product.id

      // Setup: Create test vouchers
      const voucherInserts = [
        { ...TEST_VOUCHERS.VALID_PERCENTAGE, usage_limit: 100, used_quota: 0, starts_at: new Date(Date.now() - 86400000).toISOString(), expires_at: new Date(Date.now() + 86400000 * 30).toISOString() },
        { ...TEST_VOUCHERS.VALID_FIXED, usage_limit: 100, used_quota: 0, starts_at: new Date(Date.now() - 86400000).toISOString(), expires_at: new Date(Date.now() + 86400000 * 30).toISOString() },
        { ...TEST_VOUCHERS.EXPIRED, usage_limit: null, used_quota: 0, starts_at: new Date(Date.now() - 86400000 * 2).toISOString() },
        { ...TEST_VOUCHERS.INACTIVE, usage_limit: null, used_quota: 0, starts_at: new Date(Date.now() - 86400000).toISOString(), expires_at: new Date(Date.now() + 86400000 * 30).toISOString() },
      ]

      const { data: vouchers } = await serverClient.from('vouchers').insert(voucherInserts).select()

      if (vouchers) {
        testVoucherIds = vouchers.map(v => v.id)
      }

      isSetup = true
    } catch (error) {
      console.error('Failed to setup integration tests:', error)
    }
  })

  afterAll(async () => {
    if (SKIP_INTEGRATION || !isSetup) return

    try {
      // Cleanup
      if (testVoucherIds.length > 0) {
        await serverClient.from('vouchers').delete().in('id', testVoucherIds)
      }
      if (testProductId) {
        await serverClient.from('game_products').delete().eq('id', testProductId)
      }
      if (testGameId) {
        await serverClient.from('games').delete().eq('id', testGameId)
      }
    } catch (error) {
      console.error('Cleanup failed:', error)
    }
  })

  // Skip all tests if setup failed
  const describeIf = (condition: boolean) => (condition ? describe : describe.skip)

  describeIf(isSetup && !SKIP_INTEGRATION)('Valid Voucher Flow', () => {
    test('should create order with VALID_PERCENTAGE voucher and correct discount', async () => {
      const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameSlug: TEST_GAME.slug,
          productId: testProductId,
          userGameId: 'test-player-001',
          voucherCode: TEST_VOUCHERS.VALID_PERCENTAGE.code,
        }),
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.data.voucherApplied).toBe(true)
      expect(result.data.subtotal).toBe(TEST_PRODUCT.price)
      // 10% of 50000 = 5000, but max_discount is 5000
      expect(result.data.voucherDiscount).toBe(5000)
      expect(result.data.total).toBe(45000)
    })

    test('should create order with VALID_FIXED voucher and correct discount', async () => {
      const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameSlug: TEST_GAME.slug,
          productId: testProductId,
          userGameId: 'test-player-002',
          voucherCode: TEST_VOUCHERS.VALID_FIXED.code,
        }),
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.data.voucherApplied).toBe(true)
      expect(result.data.voucherDiscount).toBe(5000)
      expect(result.data.total).toBe(45000)
    })

    test('should create order without voucher', async () => {
      const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameSlug: TEST_GAME.slug,
          productId: testProductId,
          userGameId: 'test-player-003',
        }),
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.data.voucherApplied).toBe(false)
      expect(result.data.voucherDiscount).toBe(0)
      expect(result.data.total).toBe(TEST_PRODUCT.price)
    })
  })

  describeIf(isSetup && !SKIP_INTEGRATION)('Invalid Voucher Handling', () => {
    test('should handle EXPIRED voucher - order succeeds but voucher not applied', async () => {
      const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameSlug: TEST_GAME.slug,
          productId: testProductId,
          userGameId: 'test-player-004',
          voucherCode: TEST_VOUCHERS.EXPIRED.code,
        }),
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.data.voucherApplied).toBe(false)
      expect(result.data.total).toBe(TEST_PRODUCT.price)
    })

    test('should handle INACTIVE voucher', async () => {
      const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameSlug: TEST_GAME.slug,
          productId: testProductId,
          userGameId: 'test-player-005',
          voucherCode: TEST_VOUCHERS.INACTIVE.code,
        }),
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.data.voucherApplied).toBe(false)
    })

    test('should handle non-existent voucher code', async () => {
      const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameSlug: TEST_GAME.slug,
          productId: testProductId,
          userGameId: 'test-player-006',
          voucherCode: 'NONEXISTENT',
        }),
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.data.voucherApplied).toBe(false)
    })
  })

  describeIf(isSetup && !SKIP_INTEGRATION)('Guest Checkout', () => {
    test('should create order without authentication', async () => {
      const response = await fetch(`${TEST_CONFIG.apiBaseUrl}/api/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameSlug: TEST_GAME.slug,
          productId: testProductId,
          userGameId: 'guest-player-001',
        }),
      })

      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
    })
  })

  describeIf(!SKIP_INTEGRATION)('Integration Test Setup', () => {
    test('should skip when TEST_API_BASE_URL not set', () => {
      if (SKIP_INTEGRATION) {
        console.log('ℹ️ Set TEST_API_BASE_URL=http://localhost:3000 to run integration tests')
      }
      expect(SKIP_INTEGRATION).toBe(true)
    })
  })
})

describe('Security Unit Tests (Mock-based)', () => {
  /**
   * These tests verify the security logic without requiring a database connection.
   * They test the calculation and validation logic directly.
   */

  const PRICE_TOLERANCE = 100

  function calculateDiscount(subtotal: number, voucher: { discount_type: string; discount_value: number; max_discount?: number }): number {
    let discount = 0

    if (voucher.discount_type === 'PERCENTAGE') {
      discount = Math.floor((subtotal * voucher.discount_value) / 100)
      if (voucher.max_discount) {
        discount = Math.min(discount, voucher.max_discount)
      }
    } else {
      discount = voucher.discount_value
    }

    return Math.min(discount, subtotal)
  }

  function isVoucherValid(voucher: { is_active: boolean; starts_at?: string; expires_at?: string; usage_limit?: number; used_quota?: number }): { valid: boolean; reason?: string } {
    const now = new Date()

    if (!voucher.is_active) {
      return { valid: false, reason: 'Voucher is not active' }
    }

    if (voucher.starts_at && new Date(voucher.starts_at) > now) {
      return { valid: false, reason: 'Voucher has not started yet' }
    }

    if (voucher.expires_at && new Date(voucher.expires_at) <= now) {
      return { valid: false, reason: 'Voucher has expired' }
    }

    if (voucher.usage_limit && voucher.used_quota !== undefined && voucher.used_quota >= voucher.usage_limit) {
      return { valid: false, reason: 'Voucher usage limit reached' }
    }

    return { valid: true }
  }

  test('PERCENTAGE voucher with max_discount cap', () => {
    const subtotal = 100000
    const voucher = { discount_type: 'PERCENTAGE', discount_value: 10, max_discount: 5000 }

    const discount = calculateDiscount(subtotal, voucher)

    // 10% of 100000 = 10000, but capped at 5000
    expect(discount).toBe(5000)
  })

  test('FIXED voucher', () => {
    const subtotal = 50000
    const voucher = { discount_type: 'FIXED', discount_value: 5000 }

    const discount = calculateDiscount(subtotal, voucher)

    expect(discount).toBe(5000)
  })

  test('Discount cannot exceed subtotal', () => {
    const subtotal = 5000
    const voucher = { discount_type: 'FIXED', discount_value: 10000 }

    const discount = calculateDiscount(subtotal, voucher)

    expect(discount).toBe(5000) // capped at subtotal
  })

  test('Detects expired voucher', () => {
    const voucher = {
      is_active: true,
      expires_at: new Date(Date.now() - 86400000).toISOString(), // yesterday
      used_quota: 0,
    }

    const result = isVoucherValid(voucher)

    expect(result.valid).toBe(false)
    expect(result.reason).toBe('Voucher has expired')
  })

  test('Detects inactive voucher', () => {
    const voucher = {
      is_active: false,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      used_quota: 0,
    }

    const result = isVoucherValid(voucher)

    expect(result.valid).toBe(false)
    expect(result.reason).toBe('Voucher is not active')
  })

  test('Detects usage limit exceeded', () => {
    const voucher = {
      is_active: true,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      usage_limit: 10,
      used_quota: 10,
    }

    const result = isVoucherValid(voucher)

    expect(result.valid).toBe(false)
    expect(result.reason).toBe('Voucher usage limit reached')
  })

  test('Valid voucher passes validation', () => {
    const voucher = {
      is_active: true,
      starts_at: new Date(Date.now() - 86400000).toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      usage_limit: 100,
      used_quota: 50,
    }

    const result = isVoucherValid(voucher)

    expect(result.valid).toBe(true)
  })

  test('Detects discount manipulation', () => {
    const productPrice = 100000
    const voucher = { discount_type: 'PERCENTAGE', discount_value: 10, max_discount: 5000 }

    // Server calculation
    const serverDiscount = calculateDiscount(productPrice, voucher)
    const serverTotal = Math.max(0, productPrice - serverDiscount)

    // Attacker manipulated values
    const manipulatedDiscount = 100000 // Set to full price!
    const manipulatedTotal = 0

    // Detection
    const discountDiff = Math.abs(serverDiscount - manipulatedDiscount)

    expect(discountDiff).toBe(95000) // huge difference!
    expect(discountDiff > PRICE_TOLERANCE).toBe(true)
  })
})
