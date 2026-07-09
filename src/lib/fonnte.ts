/**
 * Fonnte WhatsApp API Client
 * Documentation: https://fonnte.com/
 *
 * Fonnte is a WhatsApp Business API provider that allows sending
 * messages to WhatsApp numbers without official WhatsApp Business API approval.
 */

// Fonnte API endpoint
const FONNTE_API_URL = 'https://api.fonnte.com/send'

interface FonnteResponse {
  status: boolean
  message?: string
  reason?: string
  data?: {
    id?: string
    phone: string
    message: string
    timestamp: number
  }
}

interface SendWhatsAppOptions {
  phone: string // WhatsApp number (format: 08xxxxxxxxx or +62xxxxxxxxx)
  message: string
  fileUrl?: string // Optional: for sending images/documents
  delay?: string // Delay in seconds (e.g., "2")
  countryCode?: string // Country code (default: "62")
}

// Format phone number to Fonnte format (62xxxxxxxxxx)
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let formatted = phone.replace(/\D/g, '')

  // If starts with 0, replace with 62
  if (formatted.startsWith('0')) {
    formatted = '62' + formatted.substring(1)
  }

  // If doesn't start with 62, add it
  if (!formatted.startsWith('62')) {
    formatted = '62' + formatted
  }

  return formatted
}

/**
 * Send WhatsApp message via Fonnte API
 * Based on official Fonnte documentation
 */
export async function sendWhatsApp(options: SendWhatsAppOptions): Promise<FonnteResponse> {
  const apiKey = process.env.FONNTE_API_KEY

  if (!apiKey) {
    console.error('FONNTE_API_KEY is not configured')
    return {
      status: false,
      reason: 'FONNTE_API_KEY is not configured'
    }
  }

  const formattedPhone = formatPhoneNumber(options.phone)

  try {
    // Build form data as per Fonnte documentation
    const formData = new FormData()
    formData.append('target', formattedPhone)
    formData.append('message', options.message)
    formData.append('delay', options.delay || '2')
    formData.append('countryCode', options.countryCode || '62')

    // Add file URL if provided (for sending images/documents)
    if (options.fileUrl) {
      formData.append('url', options.fileUrl)
    }

    const response = await fetch(FONNTE_API_URL, {
      method: 'POST',
      mode: 'cors',
      headers: new Headers({
        'Authorization': apiKey, // Token directly, no "Bearer" prefix
      }),
      body: formData,
    })

    const data = await response.json()
    console.log('Fonnte API Response:', JSON.stringify(data))

    return data
  } catch (error: any) {
    console.error('Fonnte API Error:', error.message)
    return {
      status: false,
      reason: error.message || 'Failed to send WhatsApp message'
    }
  }
}

// ==================== NOTIFICATION TEMPLATES ====================

interface OrderNotificationData {
  invoiceNo: string
  gameName: string
  productName: string
  userGameId: string
  serverId?: string
  total: number
  paymentMethod: string
  status: 'PENDING' | 'PAID' | 'SUCCESS' | 'EXPIRED' | 'FAILED'
}

/**
 * Format price to Indonesian Rupiah
 */
function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Send notification to admin when new order is created
 */
export async function notifyAdminNewOrder(data: OrderNotificationData): Promise<FonnteResponse> {
  const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER

  if (!adminPhone) {
    console.log('ADMIN_WHATSAPP_NUMBER not configured, skipping admin notification')
    return { status: false, reason: 'Admin phone not configured' }
  }

  const statusEmoji = {
    PENDING: '⏳',
    PAID: '💰',
    SUCCESS: '✅',
    EXPIRED: '⏰',
    FAILED: '❌',
  }[data.status] || '📋'

  const message = `
${statusEmoji} *PESANAN BARU - Topup Kilat*

📋 *Invoice:* ${data.invoiceNo}

🎮 *Game:* ${data.gameName}
💎 *Product:* ${data.productName}
👤 *ID Game:* ${data.userGameId}
${data.serverId ? `🖥️ *Server:* ${data.serverId}` : ''}

💳 *Metode:* ${data.paymentMethod}
💰 *Total:* ${formatRupiah(data.total)}
📊 *Status:* ${data.status}

---
_Notifikasi otomatis dari Topup Kilat_
`.trim()

  return sendWhatsApp({
    phone: adminPhone,
    message,
  })
}

/**
 * Send notification to admin when payment is received (PAID)
 */
export async function notifyAdminPaymentReceived(data: OrderNotificationData): Promise<FonnteResponse> {
  const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER

  if (!adminPhone) {
    console.log('ADMIN_WHATSAPP_NUMBER not configured, skipping admin notification')
    return { status: false, reason: 'Admin phone not configured' }
  }

  const message = `
💰💰💰 *PEMBAYARAN DITERIMA* 💰💰💰

📋 *Invoice:* ${data.invoiceNo}

🎮 *Game:* ${data.gameName}
💎 *Product:* ${data.productName}
👤 *ID Game:* ${data.userGameId}
${data.serverId ? `🖥️ *Server:* ${data.serverId}` : ''}

💳 *Metode:* ${data.paymentMethod}
💰 *Total:* ${formatRupiah(data.total)}

⏰ Segera proses pesanan!

---
_Notifikasi otomatis dari Topup Kilat_
`.trim()

  return sendWhatsApp({
    phone: adminPhone,
    message,
  })
}

/**
 * Send notification to admin when payment is expired
 */
export async function notifyAdminPaymentExpired(data: OrderNotificationData): Promise<FonnteResponse> {
  const adminPhone = process.env.ADMIN_WHATSAPP_NUMBER

  if (!adminPhone) {
    console.log('ADMIN_WHATSAPP_NUMBER not configured, skipping admin notification')
    return { status: false, reason: 'Admin phone not configured' }
  }

  const message = `
⏰ *PEMBAYARAN EXPIRED* ⏰

📋 *Invoice:* ${data.invoiceNo}

🎮 *Game:* ${data.gameName}
💎 *Product:* ${data.productName}
👤 *ID Game:* ${data.userGameId}

💳 *Metode:* ${data.paymentMethod}
💰 *Total:* ${formatRupiah(data.total)}

📝 Pesanan ini tidak perlu diproses.

---
_Notifikasi otomatis dari Topup Kilat_
`.trim()

  return sendWhatsApp({
    phone: adminPhone,
    message,
  })
}

/**
 * Send notification to customer when order is successful
 */
export async function notifyCustomerOrderSuccess(
  customerPhone: string,
  data: OrderNotificationData
): Promise<FonnteResponse> {
  const message = `
✅ *PESANAN BERHASIL!* ✅

Terima kasih telah berbelanja di *Topup Kilat*!

📋 *Invoice:* ${data.invoiceNo}

🎮 *Game:* ${data.gameName}
💎 *Product:* ${data.productName}
👤 *ID Game:* ${data.userGameId}
${data.serverId ? `🖥️ *Server:* ${data.serverId}` : ''}

💰 *Total:* ${formatRupiah(data.total)}

🎉 Item Anda sedang dalam proses pengiriman!

---
_Hubungi CS jika ada pertanyaan_
`.trim()

  return sendWhatsApp({
    phone: customerPhone,
    message,
  })
}
