// ============================================
// TOPUP KILAT - Type Definitions
// ============================================

// --------------------------------------------
// GAME TYPES
// --------------------------------------------
export interface Game {
  id: string
  name: string
  slug: string
  category: GameCategory
  logo: string
  banner: string
  description: string
  requiresServerId: boolean
  isActive: boolean
  featured: boolean
  totalTransactions: number
  createdAt: Date
  updatedAt: Date
}

export type GameCategory = 'mobile' | 'pc' | 'console' | 'voucher'

export interface GameProduct {
  id: string
  gameId: string
  label: string
  description?: string
  image?: string
  price: number
  originalPrice?: number
  discount?: number
  stock: 'available' | 'limited' | 'empty'
  supplierCode: string
  isActive: boolean
  sortOrder: number
}

// --------------------------------------------
// USER & AUTH TYPES
// --------------------------------------------
export interface User {
  id: string
  email: string
  phone?: string
  name?: string
  avatar?: string
  role: UserRole
  memberTier: MemberTier
  pointsBalance: number
  isVerified: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type UserRole = 'guest' | 'user' | 'cs' | 'finance' | 'admin' | 'super_admin'

export type MemberTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// --------------------------------------------
// VOUCHER & PROMO TYPES
// --------------------------------------------
export interface Voucher {
  id: string
  code: string
  name: string
  description?: string
  discountType: 'percentage' | 'fixed' | 'cashback'
  discountValue: number
  minTransaction: number
  maxDiscount?: number
  quota: number
  usedQuota: number
  startDate: Date
  endDate: Date
  applicableGames?: string[] // game IDs
  isActive: boolean
  createdAt: Date
}

export interface Promo {
  id: string
  title: string
  description: string
  image: string
  link?: string
  startDate: Date
  endDate: Date
  isActive: boolean
  position: 'banner' | 'popup' | 'badge'
}

// --------------------------------------------
// ORDER & TRANSACTION TYPES
// --------------------------------------------
export interface Order {
  id: string
  invoiceNo: string
  userId?: string
  gameId: string
  productId: string
  userGameId: string
  serverId?: string
  voucherId?: string
  voucherCode?: string
  subtotal: number
  discount: number
  total: number
  status: OrderStatus
  paymentMethod?: PaymentMethod
  paymentId?: string
  paymentUrl?: string
  paidAt?: Date
  completedAt?: Date
  failureReason?: string
  retryCount: number
  createdAt: Date
  updatedAt: Date
  // Populated fields
  game?: Game
  product?: GameProduct
  user?: Partial<User>
}

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'processing'
  | 'success'
  | 'failed'
  | 'expired'
  | 'refunded'
  | 'cancelled'

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  total: number
}

// --------------------------------------------
// PAYMENT TYPES
// --------------------------------------------
export interface Payment {
  id: string
  orderId: string
  method: PaymentMethod
  amount: number
  status: PaymentStatus
  providerRef?: string
  paymentUrl?: string
  qrCode?: string
  vaNumber?: string
  instructions?: string
  paidAt?: Date
  expiredAt?: Date
  createdAt: Date
}

export type PaymentMethod =
  | 'qris'
  | 'gopay'
  | 'ovo'
  | 'dana'
  | 'shopeepay'
  | 'bcava'
  | 'bniva'
  | 'mandiriva'
  | 'briva'
  | 'permatava'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'cancelled'

// --------------------------------------------
// CHECKOUT TYPES
// --------------------------------------------
export interface CheckoutSession {
  gameId: string
  gameSlug: string
  gameName: string
  productId: string
  productName: string
  productPrice: number
  userGameId: string
  serverId?: string
  voucherCode?: string
  voucherDiscount?: number
  subtotal: number
  discount: number
  total: number
  step: CheckoutStep
}

export type CheckoutStep = 'identify' | 'order' | 'payment' | 'confirmation'

// --------------------------------------------
// NOTIFICATION TYPES
// --------------------------------------------
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown>
  isRead: boolean
  createdAt: Date
}

export type NotificationType =
  | 'order_created'
  | 'order_paid'
  | 'order_processing'
  | 'order_success'
  | 'order_failed'
  | 'payment_reminder'
  | 'promo_new'
  | 'points_earned'

// --------------------------------------------
// API RESPONSE TYPES
// --------------------------------------------
export interface ApiResponse<T = unknown> {
  success: boolean
  data: T | null
  meta?: {
    page?: number
    pageSize?: number
    totalPages?: number
    total?: number
  }
  error?: ApiError
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, string[]>
}

// --------------------------------------------
// FORM TYPES
// --------------------------------------------
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  name: string
  email: string
  phone?: string
  password: string
  confirmPassword: string
}

export interface TopupFormData {
  userId: string
  serverId?: string
  productId: string
  voucherCode?: string
}

// --------------------------------------------
// ADMIN TYPES
// --------------------------------------------
export interface AdminStats {
  totalTransactions: number
  totalRevenue: number
  pendingTransactions: number
  successRate: number
  topGames: Array<{
    gameId: string
    gameName: string
    transactionCount: number
  }>
  revenueByDay: Array<{
    date: string
    revenue: number
    transactions: number
  }>
}

export interface AdminOrderFilter {
  status?: OrderStatus
  gameId?: string
  dateFrom?: Date
  dateTo?: Date
  search?: string
  page?: number
  pageSize?: number
}
