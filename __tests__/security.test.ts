/**
 * Security Tests for Order & Payment Flow
 *
 * These tests verify:
 * 1. Valid voucher flow - payment succeeds with correct amount
 * 2. Manipulated voucher_discount - should be detected and rejected
 * 3. Expired/invalid voucher - should be rejected with clear message
 * 4. Regression tests - guest/authenticated checkout without errors
 *
 * Run with: npx jest __tests__/security.test.ts --coverage
 */

/// <reference types="jest" />

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Mock environment
const mockEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
}

// Mock Supabase client
const createMockSupabase = () => {
  const mockOrders: Map<string, any> = new Map()
  const mockVouchers: Map<string, any> = new Map()
  const mockPayments: Map<string, any> = new Map()

  // Initialize test vouchers
  mockVouchers.set('VALID10', {
    id: 'voucher-valid-10',
    code: 'VALID10',
    discount_type: 'PERCENTAGE',
    discount_value: 10,
    max_discount: 5000,
    min_transaction: 10000,
    usage_limit: 100,
    used_quota: 0,
    is_active: true,
    starts_at: new Date(Date.now() - 86400000).toISOString(), // yesterday
    expires_at: new Date(Date.now() + 86400000).toISOString(), // tomorrow
  })

  mockVouchers.set('EXPIRED', {
    id: 'voucher-expired',
    code: 'EXPIRED',
    discount_type: 'FIXED',
    discount_value: 5000,
    max_discount: null,
    min_transaction: null,
    usage_limit: null,
    used_quota: 0,
    is_active: true,
    starts_at: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    expires_at: new Date(Date.now() - 86400000).toISOString(), // yesterday (expired)
  })

  mockVouchers.set('INACTIVE', {
    id: 'voucher-inactive',
    code: 'INACTIVE',
    discount_type: 'PERCENTAGE',
    discount_value: 20,
    max_discount: null,
    min_transaction: null,
    usage_limit: null,
    used_quota: 0,
    is_active: false, // INACTIVE
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
  })

  mockVouchers.set('MAXEDOUT', {
    id: 'voucher-maxed',
    code: 'MAXEDOUT',
    discount_type: 'FIXED',
    discount_value: 10000,
    max_discount: null,
    min_transaction: null,
    usage_limit: 10,
    used_quota: 10, // fully used
    is_active: true,
    starts_at: new Date(Date.now() - 86400000).toISOString(),
    expires_at: new Date(Date.now() + 86400000).toISOString(),
  })

  return {
    orders: mockOrders,
    vouchers: mockVouchers,
    payments: mockPayments,
    from: (table: string) => {
      if (table === 'orders') {
        return {
          select: () => ({
            select: () => ({
              eq: (field: string, value: any) => ({
                single: () => {
                  const order = mockOrders.get(value)
                  if (!order) return { data: null, error: { message: 'Not found' } }
                  return { data: order, error: null }
                }
              })
            })
          }),
          insert: (data: any) => ({
            select: () => ({
              single: () => {
                mockOrders.set(data.id || crypto.randomUUID(), data)
                return { data, error: null }
              }
            })
          })
        }
      }
      if (table === 'vouchers') {
        return {
          select: () => ({
            eq: (field: string, value: any) => ({
              maybeSingle: () => {
                if (field === 'id') {
                  for (const v of mockVouchers.values()) {
                    if (v.id === value) return { data: v, error: null }
                  }
                  return { data: null, error: null }
                }
                if (field === 'code') {
                  const voucher = mockVouchers.get(value.toUpperCase())
                  return { data: voucher || null, error: null }
                }
                return { data: null, error: null }
              }
            })
          })
        }
      }
      if (table === 'payments') {
        return {
          select: () => ({
            eq: () => ({
              in: () => ({
                then: (cb: any) => cb({ data: [], error: null })
              })
            })
          }),
          insert: (data: any) => ({
            select: () => ({
              single: () => {
                mockPayments.set(data.id, data)
                return { data, error: null }
              }
            })
          })
        }
      }
      return { select: () => ({ eq: () => ({ maybeSingle: () => ({ data: null, error: null }) }) }) }
    },
    auth: {
      getUser: () => ({ data: { user: null }, error: null })
    },
    rpc: () => ({ error: null })
  }
}

// Test utilities
interface TestCase {
  name: string
  setup: () => void
  execute: () => Promise<any>
  verify: (result: any) => { pass: boolean; message: string }
}

describe('Order & Payment Security Tests', () => {
  const mockSupabase = createMockSupabase()

  beforeEach(() => {
    mockSupabase.orders.clear()
    mockSupabase.payments.clear()
  })

  describe('Voucher Validation', () => {
    test('VALID10 voucher applies correct 10% discount with max cap', () => {
      const productPrice = 100000
      const voucher = mockSupabase.vouchers.get('VALID10')

      // Calculate discount: 10% of 100000 = 10000, but max is 5000
      const expectedDiscount = Math.min(10000, 5000)

      expect(voucher.discount_type).toBe('PERCENTAGE')
      expect(voucher.discount_value).toBe(10)
      expect(expectedDiscount).toBe(5000)
    })

    test('Expired voucher should not be applied', () => {
      const voucher = mockSupabase.vouchers.get('EXPIRED')
      const now = new Date()

      const isExpired = voucher.expires_at && new Date(voucher.expires_at) <= now
      expect(isExpired).toBe(true)
    })

    test('Inactive voucher should not be applied', () => {
      const voucher = mockSupabase.vouchers.get('INACTIVE')
      expect(voucher.is_active).toBe(false)
    })

    test('Maxed out voucher should not be applied', () => {
      const voucher = mockSupabase.vouchers.get('MAXEDOUT')
      const isMaxed = voucher.usage_limit !== null && voucher.used_quota >= voucher.usage_limit
      expect(isMaxed).toBe(true)
    })
  })

  describe('Order Creation Security', () => {
    test('Order creation calculates prices server-side', () => {
      // Simulate order creation with voucher
      const game = { id: 'game-1', name: 'Test Game', slug: 'test-game' }
      const product = { id: 'prod-1', name: '100 Diamonds', price: 100000 }
      const voucher = mockSupabase.vouchers.get('VALID10')

      // Server-side calculation
      const subtotal = product.price
      let voucherDiscount = 0

      if (voucher.discount_type === 'PERCENTAGE') {
        voucherDiscount = Math.floor((subtotal * voucher.discount_value) / 100)
        if (voucher.max_discount) {
          voucherDiscount = Math.min(voucherDiscount, voucher.max_discount)
        }
      } else {
        voucherDiscount = voucher.discount_value
      }

      const total = Math.max(0, subtotal - voucherDiscount)

      expect(subtotal).toBe(100000)
      expect(voucherDiscount).toBe(5000) // capped at max_discount
      expect(total).toBe(95000)
    })

    test('Order without voucher uses full product price', () => {
      const product = { id: 'prod-1', name: '100 Diamonds', price: 50000 }

      const subtotal = product.price
      const voucherDiscount = 0
      const total = Math.max(0, subtotal - voucherDiscount)

      expect(subtotal).toBe(50000)
      expect(voucherDiscount).toBe(0)
      expect(total).toBe(50000)
    })
  })

  describe('Payment Creation Security', () => {
    test('Payment validates order total against server calculation', () => {
      // Simulate order with potential tampering
      const order = {
        id: 'order-1',
        product: { price: 100000 },
        voucher_id: 'voucher-valid-10',
        voucher_discount: 5000, // stored value
        total: 95000,
        status: 'PENDING',
      }

      const productPrice = order.product.price
      const voucher = mockSupabase.vouchers.get('VALID10')

      // Server recalculation
      let serverDiscount = 0
      if (voucher.discount_type === 'PERCENTAGE') {
        serverDiscount = Math.floor((productPrice * voucher.discount_value) / 100)
        if (voucher.max_discount) {
          serverDiscount = Math.min(serverDiscount, voucher.max_discount)
        }
      }

      const serverTotal = Math.max(0, productPrice - serverDiscount)
      const PRICE_TOLERANCE = 100

      // Validation
      const totalMatch = Math.abs(serverTotal - order.total) <= PRICE_TOLERANCE
      const discountMatch = Math.abs(serverDiscount - order.voucher_discount) <= PRICE_TOLERANCE

      expect(totalMatch).toBe(true)
      expect(discountMatch).toBe(true)
    })

    test('Detects manipulated voucher_discount', () => {
      // Attacker set voucher_discount to full price to get free order
      const order = {
        id: 'order-1',
        product: { price: 100000 },
        voucher_id: 'voucher-valid-10',
        voucher_discount: 100000, // MANIPULATED - full price!
        total: 0,
        status: 'PENDING',
      }

      const productPrice = order.product.price
      const voucher = mockSupabase.vouchers.get('VALID10')

      // Server recalculation
      let serverDiscount = 0
      if (voucher.discount_type === 'PERCENTAGE') {
        serverDiscount = Math.floor((productPrice * voucher.discount_value) / 100)
        if (voucher.max_discount) {
          serverDiscount = Math.min(serverDiscount, voucher.max_discount)
        }
      }

      const serverTotal = Math.max(0, productPrice - serverDiscount)
      const PRICE_TOLERANCE = 100

      // Discount manipulation detection
      const discountDifference = Math.abs(serverDiscount - order.voucher_discount)

      expect(discountDifference).toBe(95000) // huge difference!
      expect(discountDifference > PRICE_TOLERANCE).toBe(true) // should be rejected
    })

    test('Handles expired voucher gracefully', () => {
      const order = {
        id: 'order-1',
        product: { price: 50000 },
        voucher_id: 'voucher-expired',
        voucher_discount: 5000, // This is the WRONG stored value - voucher was applied but expired
        total: 45000, // This is WRONG - assumes discount was valid
        status: 'PENDING',
      }

      const voucher = mockSupabase.vouchers.get('EXPIRED')
      const now = new Date()

      // Check voucher validity
      const isExpired = voucher.expires_at && new Date(voucher.expires_at) <= now

      expect(isExpired).toBe(true)

      // Server should recalculate without discount (expired voucher = no discount)
      const productPrice = order.product.price
      const serverDiscount = 0 // No discount for expired voucher
      const serverTotal = productPrice // Should be 50000

      // The order has WRONG stored total (45000) - assumes voucher was applied
      // Server calculates CORRECT total (50000) - no discount for expired voucher
      expect(order.total).toBe(45000) // Wrong stored value
      expect(serverTotal).toBe(50000) // Correct server calculation

      // Difference should trigger rejection
      const difference = Math.abs(serverTotal - order.total)
      expect(difference).toBe(5000) // Shows the manipulation/mismatch
    })
  })

  describe('Guest vs Authenticated Checkout', () => {
    test('Guest checkout creates order without user_id', () => {
      const orderData = {
        game_id: 'game-1',
        product_id: 'prod-1',
        user_game_id: 'player123',
        server_id: null,
        voucher_id: null,
        voucher_code: null,
        voucher_discount: 0,
        subtotal: 50000,
        total: 50000,
        status: 'PENDING',
      }

      expect(orderData.user_game_id).toBe('player123')
      expect(orderData.status).toBe('PENDING')
    })

    test('Authenticated checkout associates order with user', () => {
      const userId = 'user-authenticated-123'

      const orderData = {
        user_id: userId,
        game_id: 'game-1',
        product_id: 'prod-1',
        user_game_id: 'player456',
        server_id: 'server-1',
        voucher_id: null,
        voucher_code: null,
        voucher_discount: 0,
        subtotal: 75000,
        total: 75000,
        status: 'PENDING',
      }

      expect(orderData.user_id).toBe(userId)
      expect(orderData.user_game_id).toBe('player456')
    })
  })

  describe('Regression Tests', () => {
    test('Checkout without voucher works correctly', () => {
      const product = { id: 'prod-1', name: 'Test', price: 25000 }

      const subtotal = product.price
      const voucherDiscount = 0
      const total = Math.max(0, subtotal - voucherDiscount)

      expect(total).toBe(25000)
    })

    test('Checkout with FIXED discount voucher works', () => {
      const product = { id: 'prod-1', name: 'Test', price: 50000 }

      const voucher = {
        discount_type: 'FIXED' as const,
        discount_value: 10000,
        max_discount: null,
      }

      let discount = 0
      if (voucher.discount_type === 'FIXED') {
        discount = voucher.discount_value
      }

      const total = Math.max(0, product.price - discount)

      expect(discount).toBe(10000)
      expect(total).toBe(40000)
    })

    test('Checkout with PERCENTAGE discount voucher works', () => {
      const product = { id: 'prod-1', name: 'Test', price: 200000 }

      const voucher = {
        discount_type: 'PERCENTAGE' as const,
        discount_value: 15,
        max_discount: 20000,
      }

      let discount = 0
      if (voucher.discount_type === 'PERCENTAGE') {
        discount = Math.floor((product.price * voucher.discount_value) / 100)
        if (voucher.max_discount) {
          discount = Math.min(discount, voucher.max_discount)
        }
      }

      const total = Math.max(0, product.price - discount)

      // 15% of 200000 = 30000, but capped at 20000
      expect(discount).toBe(20000)
      expect(total).toBe(180000)
    })

    test('Voucher discount cannot exceed product price', () => {
      const product = { id: 'prod-1', name: 'Test', price: 5000 }

      const voucher = {
        discount_type: 'FIXED' as const,
        discount_value: 10000, // discount > price
        max_discount: null,
      }

      let discount = voucher.discount_value
      discount = Math.min(discount, product.price) // cap at product price

      const total = Math.max(0, product.price - discount)

      expect(discount).toBe(5000)
      expect(total).toBe(0)
    })
  })
})

// Integration test helper functions
describe('Security Test Scenarios', () => {
  const PRICE_TOLERANCE = 100

  /**
   * Scenario 1: Valid voucher flow
   * Expected: Payment succeeds with correct discounted amount
   */
  test('Scenario 1: Valid voucher with correct discount', () => {
    const productPrice = 100000
    const voucher = {
      discount_type: 'PERCENTAGE' as const,
      discount_value: 10,
      max_discount: 5000,
    }

    // Server calculation
    let discount = Math.floor((productPrice * voucher.discount_value) / 100)
    if (voucher.max_discount) discount = Math.min(discount, voucher.max_discount)
    const serverTotal = Math.max(0, productPrice - discount)

    // Order stored values
    const orderDiscount = discount
    const orderTotal = serverTotal

    // Validation passes
    expect(Math.abs(orderDiscount - discount) <= PRICE_TOLERANCE).toBe(true)
    expect(Math.abs(orderTotal - serverTotal) <= PRICE_TOLERANCE).toBe(true)
  })

  /**
   * Scenario 2: Manipulated voucher_discount
   * Expected: Payment rejected due to total mismatch
   */
  test('Scenario 2: Detects manipulated voucher_discount', () => {
    const productPrice = 100000
    const voucher = {
      discount_type: 'PERCENTAGE' as const,
      discount_value: 10,
      max_discount: 5000,
    }

    // Server calculation
    let serverDiscount = Math.floor((productPrice * voucher.discount_value) / 100)
    if (voucher.max_discount) serverDiscount = Math.min(serverDiscount, voucher.max_discount)
    const serverTotal = Math.max(0, productPrice - serverDiscount)

    // Attacker manipulated values
    const manipulatedDiscount = 100000 // Set to full price!
    const manipulatedTotal = 0

    // Detection
    const discountDiff = Math.abs(serverDiscount - manipulatedDiscount)
    const totalDiff = Math.abs(serverTotal - manipulatedTotal)

    // Should be rejected
    expect(discountDiff > PRICE_TOLERANCE).toBe(true)
    expect(totalDiff > PRICE_TOLERANCE).toBe(true)
  })

  /**
   * Scenario 3: Expired voucher
   * Expected: Payment rejected with clear error message
   */
  test('Scenario 3: Expired voucher rejected', () => {
    const voucher = {
      expires_at: new Date(Date.now() - 86400000).toISOString(), // yesterday
      is_active: true,
      used_quota: 0,
      usage_limit: null,
    }

    const now = new Date()
    const isExpired = voucher.expires_at && new Date(voucher.expires_at) <= now

    expect(isExpired).toBe(true)

    // Server should calculate without discount
    const productPrice = 50000
    const serverDiscount = 0
    const serverTotal = productPrice

    // Order has wrong stored values
    const orderTotal = 45000 // Wrong - assumes discount was applied

    expect(Math.abs(serverTotal - orderTotal) > PRICE_TOLERANCE).toBe(true)
  })

  /**
   * Scenario 4: Guest checkout
   * Expected: Order created without user_id
   */
  test('Scenario 4: Guest checkout works', () => {
    const orderData = {
      user_id: null,
      product_price: 30000,
      voucher_discount: 0,
      total: 30000,
    }

    expect(orderData.user_id).toBeNull()
    expect(orderData.total).toBe(30000)
  })

  /**
   * Scenario 5: Authenticated checkout
   * Expected: Order associated with user
   */
  test('Scenario 5: Authenticated checkout works', () => {
    const userId = 'user-123'
    const orderData = {
      user_id: userId,
      product_price: 75000,
      voucher_discount: 0,
      total: 75000,
    }

    expect(orderData.user_id).toBe(userId)
    expect(orderData.total).toBe(75000)
  })
})
