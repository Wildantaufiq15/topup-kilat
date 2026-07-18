/**
 * Digiflazz API Client
 *
 * Documentation: https://developer.digiflazz.com/
 *
 * Important Notes:
 * - Signature is calculated from: MD5(username + apiKey + command_string)
 * - Command string in signature is DIFFERENT from cmd in body!
 *
 * Command Mapping:
 * | CMD in Body | Sign from  | Endpoint         |
 * |-------------|------------|------------------|
 * | deposit     | depo       | /v1/cek-saldo    |
 * | prepaid     | pricelist  | /v1/price-list   |
 * | pasca       | pricelist  | /v1/price-list   |
 * | (topup)     | ref_id     | /v1/transaction  |
 */

import * as crypto from 'node:crypto'

// Configuration - Note: API key is loaded from proxy server, not here
const DIGIFLAZZ_PROXY_URL = process.env.DIGIFLAZZ_PROXY_URL || 'https://api.topupkilat.store'
const API_USERNAME = process.env.DIGIFLAZZ_USERNAME || 'kemikegwdEJo'

// In-memory cache for price list (5 minutes TTL)
interface CacheEntry<T> {
  data: T
  timestamp: number
}
const priceListCache: Map<string, CacheEntry<any>> = new Map()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// Get cache key based on params
function getCacheKey(params?: { code?: string; category?: string; brand?: string }): string {
  if (!params) return 'all'
  return JSON.stringify(params || {})
}

// Clear expired cache entries
function cleanExpiredCache(): void {
  const now = Date.now()
  for (const [key, entry] of priceListCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      priceListCache.delete(key)
    }
  }
}

// Command to signature string mapping
const SIGNATURE_MAP: Record<string, string> = {
  'deposit': 'depo',
  'prepaid': 'pricelist',
  'pasca': 'pricelist',
}

export interface DigiflazzProduct {
  buyer_sku_code: string
  sku_code: string
  product_name: string
  category: string
  brand: string
  type: string
  price: number
  price_base: number
  margin: number
  stock: string | number
  provider: string
  uniq: string | number
  status: string
}

export interface DigiflazzBalance {
  deposit: number
}

export interface DigiflazzTopupRequest {
  buyer_sku_code: string
  customer_no: string
  ref_id: string
  testing?: boolean
  max_price?: number
  cb_url?: string
}

export interface DigiflazzTopupResponse {
  ref_id: string
  customer_no: string
  buyer_sku_code: string
  message: string
  status: 'Sukses' | 'Pending' | 'Gagal'
  rc: string
  sn?: string
  buyer_last_saldo?: number
  price?: number
}

export interface DigiflazzApiResponse<T> {
  data?: T
  rc?: string
  message?: string
}

/**
 * Generate MD5 signature for Digiflazz API
 * Format: MD5(username + apiKey + command_string)
 *
 * NOTE: This signature is used when calling the proxy.
 * The proxy will add the API key internally.
 */
function generateSignature(cmd: string, refId?: string): string {
  // Get API key from environment (should be set on proxy server)
  const apiKey = process.env.DIGIFLAZZ_API_KEY || ''

  // Map command to signature string
  const signCmd = SIGNATURE_MAP[cmd] || cmd

  // For topup/ref_id commands, use ref_id in signature
  let signatureInput = API_USERNAME + apiKey + signCmd
  if (refId) {
    signatureInput += refId
  }

  // Generate MD5 hash
  return crypto.createHash('md5').update(signatureInput).digest('hex')
}

/**
 * Make request to Digiflazz API through proxy
 * The proxy handles signature generation and API key
 */
async function digiflazzRequest<T>(
  endpoint: string,
  payload: Record<string, any>
): Promise<DigiflazzApiResponse<T>> {
  try {
    const response = await fetch(DIGIFLAZZ_PROXY_URL + endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    // Parse response as text first to handle non-JSON responses
    const text = await response.text()

    if (!response.ok) {
      console.error('Digiflazz Proxy Error:', response.status, text)
      throw new Error(`Digiflazz Proxy Error: ${response.status} - ${text}`)
    }

    // Try to parse as JSON
    try {
      return JSON.parse(text)
    } catch {
      // If not JSON, check if it's an array
      if (text.startsWith('[')) {
        return { data: JSON.parse(text) } as DigiflazzApiResponse<T>
      }
      throw new Error(`Invalid JSON response: ${text.substring(0, 200)}`)
    }
  } catch (error: any) {
    // Re-throw with more context
    if (error.message.includes('Digiflazz Proxy Error')) {
      throw error
    }
    console.error('Digiflazz request failed:', error)
    throw new Error(`Gagal terhubung ke Digiflazz: ${error.message}`)
  }
}

/**
 * Check Digiflazz account balance (deposit)
 */
export async function checkBalance(): Promise<DigiflazzBalance> {
  const sign = generateSignature('deposit')

  const response: any = await digiflazzRequest<DigiflazzBalance>('/', {
    cmd: 'deposit',
    username: API_USERNAME,
    sign: sign,
  })

  // Handle different response formats
  let deposit = 0

  if (response?.data) {
    // { data: { deposit: X } }
    deposit = response.data.deposit
  } else if (typeof response?.deposit === 'number') {
    // { deposit: X }
    deposit = response.deposit
  }

  if (deposit === undefined || deposit === null) {
    console.error('Unexpected balance response:', response)
    throw new Error(response?.message || 'Failed to check balance')
  }

  return { deposit }
}

/**
 * Get price list for prepaid products
 * Filter options: code, category, brand
 * Uses in-memory cache with 5-minute TTL to avoid rate limits
 */
export async function getPriceList(params?: {
  code?: string
  category?: string
  brand?: string
}): Promise<DigiflazzProduct[]> {
  const cacheKey = getCacheKey(params)

  // Check cache first
  cleanExpiredCache()
  const cached = priceListCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    console.log(`[Digiflazz] Cache hit for key: ${cacheKey}`)
    return cached.data
  }

  const sign = generateSignature('prepaid')

  const payload: Record<string, any> = {
    cmd: 'prepaid',
    username: API_USERNAME,
    sign: sign,
  }

  // Add filters if provided
  if (params?.code) payload.code = params.code
  if (params?.category) payload.category = params.category
  if (params?.brand) payload.brand = params.brand

  const response: any = await digiflazzRequest<DigiflazzProduct[]>('/', payload)

  // Handle different response formats:
  // 1. { data: [...] } - wrapped response
  // 2. [...] - direct array
  // 3. { data: { data: [...] } } - nested
  let data: any = null

  if (Array.isArray(response)) {
    data = response
  } else if (response?.data) {
    // Check if data is an array or has nested data
    if (Array.isArray(response.data)) {
      data = response.data
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      data = response.data.data
    } else {
      // data might be an object with array property
      const possibleArray = Object.values(response.data).find(v => Array.isArray(v))
      data = possibleArray || []
    }
  }

  if (!data || !Array.isArray(data)) {
    console.error('Unexpected Digiflazz response format:', response)
    throw new Error(response?.message || 'Format response tidak valid dari Digiflazz')
  }

  // Cache the result
  priceListCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  })
  console.log(`[Digiflazz] Cached ${data.length} products with key: ${cacheKey}`)

  return data
}

/**
 * Clear Digiflazz price list cache
 * Call this after syncing products to ensure fresh data on next fetch
 */
export function clearPriceListCache(): void {
  priceListCache.clear()
  console.log('[Digiflazz] Price list cache cleared')
}

/**
 * Get price list for postpaid products
 */
export async function getPostpaidPriceList(): Promise<DigiflazzProduct[]> {
  const sign = generateSignature('pasca')

  const response = await digiflazzRequest<DigiflazzProduct[]>('/', {
    cmd: 'pasca',
    username: API_USERNAME,
    sign: sign,
  })

  if (!response.data) {
    throw new Error(response.message || 'Failed to get postpaid price list')
  }

  return response.data
}

/**
 * Create topup transaction
 * For testing mode, set testing: true
 */
export async function createTopup(params: {
  buyer_sku_code: string
  customer_no: string
  ref_id: string
  testing?: boolean
}): Promise<DigiflazzTopupResponse> {
  const sign = generateSignature('topup', params.ref_id)

  const response = await digiflazzRequest<DigiflazzTopupResponse>('/', {
    cmd: 'topup',
    username: API_USERNAME,
    sign: sign,
    buyer_sku_code: params.buyer_sku_code,
    customer_no: params.customer_no,
    ref_id: params.ref_id,
    testing: params.testing || false,
  })

  if (!response.data) {
    throw new Error(response.message || 'Failed to create topup')
  }

  return response.data
}

/**
 * Verify topup status by ref_id
 */
export async function checkTopupStatus(refId: string): Promise<DigiflazzTopupResponse> {
  const sign = generateSignature('topup', refId)

  // Use same topup endpoint with the same ref_id to check status
  // Digiflazz returns the transaction status for existing ref_id
  const response = await digiflazzRequest<DigiflazzTopupResponse>('/', {
    cmd: 'topup',
    username: API_USERNAME,
    sign: sign,
    ref_id: refId,
  })

  if (!response.data) {
    throw new Error(response.message || 'Failed to check topup status')
  }

  return response.data
}

// Response codes reference
export const RC_CODES = {
  '00': 'Transaksi Sukses',
  '01': 'Transaksi Pending',
  '02': 'Transaksi Gagal',
  '03': 'Saldo tidak cukup',
  '40': 'Payload Error',
  '41': 'Signature tidak valid',
  '42': 'Username tidak cocok',
  '43': 'SKU tidak ditemukan',
  '44': 'Saldo tidak cukup',
  '45': 'IP tidak di-whitelist',
  '49': 'Ref ID tidak unik',
  '88': 'Sistem error',
}

export default {
  checkBalance,
  getPriceList,
  getPostpaidPriceList,
  createTopup,
  checkTopupStatus,
  clearPriceListCache,
  RC_CODES,
}
