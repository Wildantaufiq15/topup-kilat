/**
 * Sakurupiah Payment Gateway Client
 * Documentation: https://sakurupiah.id/developers/api-dokumentasi
 */

import * as crypto from 'node:crypto'

const API_URL = process.env.SAKURUPIAH_API_URL || 'https://sakurupiah.id/api'
const API_ID = process.env.SAKURUPIAH_API_ID || ''
const API_KEY = process.env.SAKURUPIAH_API_KEY || ''
const CALLBACK_URL = process.env.SAKURUPIAH_CALLBACK_URL || ''

export interface SakurupiahChannel {
  kode: string
  nama: string
  minimal: string
  maksimal: string
  biaya: string
  percent: string
  tipe: 'DIRECT' | 'REDIRECT'
  logo: string
  status: string
  addition: {
    tambahan_biaya: string
    jenis: string
    default_expired: string
    settlement: string
  }
  guide?: {
    title: string
    payment_guide: string
  }
}

export interface SakurupiahInvoice {
  via: string
  payment_kode: string
  trx_id: string
  merchant_ref: string
  nama: string
  email: string
  phone: string
  total: number
  merchant_fee: string
  fee: number
  amount_merchant: number
  date: string
  time: string
  expired: string
  payment_status: string
  qr?: string
  payment_no?: string
  checkout_url?: string
}

export interface SakurupiahBalance {
  nama_merchant: string
  balance: string
  saldo_tersedia: string
}

export interface CreateInvoiceParams {
  method: string
  name: string
  email: string
  phone: string
  amount: number
  merchant_ref: string
  expired?: number
  produk?: string[]
  qty?: number[]
  harga?: number[]
  description?: string
  return_url?: string
}

export interface SakurupiahResponse<T> {
  status: string
  message: string
  data?: T
  produk?: Array<{
    nama_produk: string
    qty: string
    harga: number
    size?: string
    note?: string
  }>
}

/**
 * Generate HMAC-SHA256 signature
 */
function generateSignature(
  apiId: string,
  method: string,
  merchantRef: string,
  amount: number,
  apiKey: string
): string {
  const data = `${apiId}${method}${merchantRef}${amount}`
  return require('crypto')
    .createHmac('sha256', apiKey)
    .update(data)
    .digest('hex')
}

/**
 * Make request to Sakurupiah API
 */
async function sakurupiahRequest<T>(
  endpoint: string,
  payload: Record<string, any>
): Promise<SakurupiahResponse<T>> {
  const url = `${API_URL}/${endpoint}`

  // Build form data properly handling arrays
  const formData = new URLSearchParams()
  for (const [key, value] of Object.entries(payload)) {
    if (Array.isArray(value)) {
      // For arrays, add each item with same key
      value.forEach((item) => {
        formData.append(key, String(item))
      })
    } else {
      formData.append(key, String(value))
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  })

  if (!response.ok) {
    // Get response text for debugging
    const text = await response.text()
    console.error('Sakurupiah API Error:', response.status, text)
    throw new Error(`Sakurupiah API Error: ${response.status} - ${text}`)
  }

  return response.json()
}

/**
 * Get available payment channels
 */
export async function getPaymentChannels(): Promise<SakurupiahChannel[]> {
  const response = await sakurupiahRequest<SakurupiahChannel[]>('list-payment.php', {
    api_id: API_ID,
    method: 'list',
  })

  if (response.status !== '200') {
    throw new Error(response.message || 'Failed to get payment channels')
  }

  return response.data || []
}

/**
 * Check merchant balance
 */
export async function checkBalance(): Promise<SakurupiahBalance> {
  const response = await sakurupiahRequest<SakurupiahBalance>('check_balance.php', {
    api_id: API_ID,
    method: 'balance',
  })

  if (response.status !== '200') {
    throw new Error(response.message || 'Failed to check balance')
  }

  return response.data as SakurupiahBalance
}

/**
 * Create new invoice
 */
export async function createInvoice(
  params: CreateInvoiceParams
): Promise<SakurupiahInvoice> {
  const merchantRef = params.merchant_ref || `TK-${Date.now()}`
  const expired = params.expired || 24

  // Generate signature
  const signature = generateSignature(
    API_ID,
    params.method,
    merchantRef,
    params.amount,
    API_KEY
  )

  // Build payload
  const payload: Record<string, any> = {
    api_id: API_ID,
    method: params.method,
    name: params.name,
    email: params.email,
    phone: params.phone.replace(/^0/, '62'), // Convert 08xx to 62xx
    amount: params.amount.toString(),
    merchant_ref: merchantRef,
    merchant_fee: 'Merchant', // Who pays fee: "Merchant" or "Customer"
    expired: expired.toString(),
    signature,
    callback_url: CALLBACK_URL || 'https://topup-kilat-chi.vercel.app/api/callback/sakurupiah',
    return_url: params.return_url || 'https://topup-kilat-chi.vercel.app/checkout/success',
  }

  // Add product details if provided
  if (params.produk && params.produk.length > 0) {
    payload.produk = params.produk
    payload.qty = params.qty
    payload.harga = params.harga
  }

  if (params.return_url) {
    payload.return_url = params.return_url
  }

  const response = await sakurupiahRequest<SakurupiahInvoice>('create.php', payload)

  // Handle response - Sakurupiah returns {status, message, data: [...]}
  if (response.status !== '200') {
    throw new Error(response.message || `API Error: ${response.status}`)
  }

  // Response data is an array with one invoice
  const invoiceData = Array.isArray(response.data) ? response.data[0] : response.data

  if (!invoiceData) {
    throw new Error('No invoice data returned')
  }

  return {
    ...invoiceData,
    merchant_ref: merchantRef, // Ensure merchant_ref is set
  }
}

/**
 * Check transaction status
 */
export async function checkTransactionStatus(
  trxId?: string,
  merchantRef?: string
): Promise<{ status: string }> {
  const payload: Record<string, string> = {
    api_id: API_ID,
    method: 'status',
  }

  if (trxId) {
    payload.trx_id = trxId
  }
  if (merchantRef) {
    payload.merchant_ref = merchantRef
  }

  if (!trxId && !merchantRef) {
    throw new Error('Either trx_id or merchant_ref is required')
  }

  const response = await sakurupiahRequest<{ status: string }>('status-transaction.php', payload)

  if (response.status !== '200') {
    throw new Error(response.message || 'Failed to check transaction status')
  }

  const data = Array.isArray(response.data) ? response.data[0] : response.data
  return { status: data?.status || 'unknown' }
}

/**
 * Verify callback signature from Sakurupiah
 * Uses HMAC-SHA256 with the raw request body and API key
 *
 * @param rawBody - The raw JSON string body from the callback request
 * @param signature - The signature from x-callback-signature header
 * @returns true if signature is valid, false otherwise
 */
export function verifyCallbackSignature(
  rawBody: string,
  signature: string
): boolean {
  if (!rawBody || !signature) {
    return false
  }

  if (!API_KEY) {
    console.error('SAKURUPIAH_API_KEY is not configured - cannot verify signature')
    return false
  }

  const expectedSignature = require('crypto')
    .createHmac('sha256', API_KEY)
    .update(rawBody)
    .digest('hex')

  // Use timing-safe comparison to prevent timing attacks
  const sigBuffer = Buffer.from(signature, 'utf8')
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8')

  if (sigBuffer.length !== expectedBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer)
}

// Payment method codes supported
export const PAYMENT_METHODS = {
  QRIS: { kode: 'QRIS', nama: 'QRIS', type: 'DIRECT' as const },
  BCAVA: { kode: 'BCAVA', nama: 'BCA Virtual Account', type: 'DIRECT' as const },
  BRIVA: { kode: 'BRIVA', nama: 'BRI Virtual Account', type: 'DIRECT' as const },
  BNIVA: { kode: 'BNIVA', nama: 'BNI Virtual Account', type: 'DIRECT' as const },
  MANDIRIVA: { kode: 'MANDIRIVA', nama: 'Mandiri Virtual Account', type: 'DIRECT' as const },
  GOPAY: { kode: 'GOPAY', nama: 'GoPay', type: 'REDIRECT' as const },
  DANA: { kode: 'DANA', nama: 'DANA', type: 'REDIRECT' as const },
  SHOPEEPAY: { kode: 'SHOPEEPAY', nama: 'ShopeePay', type: 'REDIRECT' as const },
  OVO: { kode: 'OVO', nama: 'OVO', type: 'REDIRECT' as const },
  LINKAJA: { kode: 'LINKAJA', nama: 'LinkAja', type: 'REDIRECT' as const },
}

export default {
  getPaymentChannels,
  checkBalance,
  createInvoice,
  checkTransactionStatus,
  verifyCallbackSignature,
  PAYMENT_METHODS,
}
