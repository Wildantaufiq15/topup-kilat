/**
 * Zod Validation Schemas for API Routes
 *
 * Provides runtime validation for API requests to ensure data integrity.
 * TypeScript types only exist at compile-time - Zod validates at runtime.
 */

import { z } from 'zod'

// ==================== AUTH SCHEMAS ====================

export const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  phone: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password diperlukan'),
})

// ==================== ORDER SCHEMAS ====================

export const createOrderSchema = z.object({
  gameSlug: z.string().min(1, 'Game harus dipilih'),
  productId: z.string().uuid('ID produk tidak valid'),
  userGameId: z.string().min(1, 'ID Player harus diisi').max(100),
  serverId: z.string().optional(),
  voucherCode: z.string().max(50).optional(),
})

// ==================== PAYMENT SCHEMAS ====================

export const createPaymentSchema = z.object({
  orderId: z.string().uuid('ID order tidak valid'),
  invoiceNo: z.string().optional(),
  method: z.enum([
    'QRIS',
    'BCA_VA',
    'BNI_VA',
    'MANDIRI_VA',
    'BRI_VA',
    'GOPAY',
    'DANA',
    'SHOPEEPAY',
    'OVO',
    'LINKAJA',
  ], {
    errorMap: () => ({ message: 'Metode pembayaran tidak valid' }),
  }),
  // Optional customer info for Sakurupiah
  userName: z.string().max(100).optional(),
  userEmail: z.string().email().optional(),
  userPhone: z.string().max(20).optional(),
})

// ==================== VOUCHER SCHEMAS ====================

export const validateVoucherSchema = z.object({
  code: z.string().min(1, 'Kode voucher harus diisi').max(50),
  amount: z.number().positive().optional(),
})

// ==================== USER SCHEMAS ====================

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100).optional(),
  phone: z.string().max(20).optional(),
})

// ==================== GAME/PRODUCT SCHEMAS ====================

export const createGameSchema = z.object({
  name: z.string().min(1, 'Nama game harus diisi').max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan strip'),
  category: z.enum(['MOBILE', 'PC', 'CONSOLE', 'WEB']),
  logo: z.string().url('Logo harus URL yang valid').optional(),
  banner: z.string().url('Banner harus URL yang valid').optional().nullable(),
  description: z.string().max(500).optional().nullable(),
  requiresServerId: z.boolean().optional(),
  isActive: z.boolean().optional(),
  featured: z.boolean().optional(),
})

export const createProductSchema = z.object({
  gameId: z.string().uuid('ID game tidak valid'),
  name: z.string().min(1, 'Nama produk harus diisi').max(100),
  description: z.string().max(500).optional().nullable(),
  price: z.number().positive('Harga harus lebih dari 0'),
  originalPrice: z.number().positive().optional().nullable(),
  buyerSkuCode: z.string().max(100).optional().nullable(),
  isActive: z.boolean().optional(),
})

// ==================== BANNER SCHEMAS ====================

export const createBannerSchema = z.object({
  title: z.string().min(1, 'Judul harus diisi').max(100),
  subtitle: z.string().max(200).optional().nullable(),
  image: z.string().url('Image harus URL yang valid'),
  link: z.string().url().optional().nullable(),
  type: z.enum(['BANNER', 'POPUP', 'SLIDER']).optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
})

// ==================== VOUCHER CRUD SCHEMAS ====================

export const createVoucherSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z0-9]+$/, 'Kode voucher harus huruf besar dan angka'),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  type: z.enum(['DISCOUNT', 'CASHBACK', 'FREE_SHIPPING']),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive('Nilai discount harus lebih dari 0'),
  minTransaction: z.number().int().min(0).optional(),
  maxDiscount: z.number().positive().optional().nullable(),
  usageLimit: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().optional(),
  startsAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
})

// ==================== TYPE EXPORTS ====================

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type ValidateVoucherInput = z.infer<typeof validateVoucherSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type CreateGameInput = z.infer<typeof createGameSchema>
export type CreateProductInput = z.infer<typeof createProductSchema>
export type CreateBannerInput = z.infer<typeof createBannerSchema>
export type CreateVoucherInput = z.infer<typeof createVoucherSchema>

// ==================== UTILITY FUNCTIONS ====================

/**
 * Safe parse with formatted error messages
 */
export function parseWithMessages<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  const errors = result.error.errors.map(
    (err) => `${err.path.join('.')}: ${err.message}`
  )

  return { success: false, errors }
}
