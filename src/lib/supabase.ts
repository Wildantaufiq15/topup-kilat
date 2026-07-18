import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy initialization to avoid build-time errors
let supabaseInstance: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Return mock during build time if env vars are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    if (!supabaseInstance) {
      supabaseInstance = createClient(
        'https://placeholder.supabase.co',
        'placeholder-key',
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )
    }
    return supabaseInstance
  }

  // Runtime: create real client
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    })
  }

  return supabaseInstance
}

export const supabase = {
  from: (table: string) => getSupabaseClient().from(table),
  auth: getSupabaseClient().auth,
  channel: (name: string) => getSupabaseClient().channel(name),
  removeChannel: (channel: any) => getSupabaseClient().removeChannel(channel),
  storage: getSupabaseClient().storage,
}

// Helper types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          phone: string | null
          name: string | null
          password: string | null
          avatar: string | null
          role: 'USER' | 'CS' | 'FINANCE' | 'ADMIN' | 'SUPER_ADMIN'
          member_tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
          points_balance: number
          is_verified: boolean
          is_active: boolean
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      games: {
        Row: {
          id: string
          name: string
          slug: string
          category: 'MOBILE' | 'PC' | 'CONSOLE' | 'WEB'
          logo: string
          banner: string | null
          description: string | null
          requires_server_id: boolean
          is_active: boolean
          featured: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['games']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['games']['Insert']>
      }
      game_products: {
        Row: {
          id: string
          game_id: string
          name: string
          description: string | null
          price: number
          original_price: number | null
          stock: string
          product_id: string | null
          image: string | null
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
          price_base: number | null
          price_display: number | null
          buyer_sku_code: string | null
          is_best_seller: boolean
        }
        Insert: Omit<Database['public']['Tables']['game_products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['game_products']['Insert']>
      }
      orders: {
        Row: {
          id: string
          user_id: string | null
          game_id: string | null
          product_id: string | null
          invoice_no: string
          user_game_id: string
          server_id: string | null
          voucher_id: string | null
          voucher_code: string | null
          voucher_discount: number
          subtotal: number
          total: number
          status: 'PENDING' | 'PAID' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'REFUNDED'
          payment_method: string | null
          paid_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      payments: {
        Row: {
          id: string
          order_id: string
          method: string
          amount: number
          status: 'PENDING' | 'PAID' | 'EXPIRED' | 'FAILED'
          provider_ref: string | null
          merchant_ref: string | null  // Added for webhook lookup
          payment_url: string | null
          qr_code: string | null
          va_number: string | null
          instructions: string | null
          paid_at: string | null
          expired_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['payments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
      vouchers: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          type: 'DISCOUNT' | 'CASHBACK' | 'FREE_SHIPPING'
          discount_type: 'PERCENTAGE' | 'FIXED'
          discount_value: number
          min_transaction: number
          max_discount: number | null
          usage_limit: number | null
          used_quota: number
          is_active: boolean
          starts_at: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['vouchers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['vouchers']['Insert']>
      }
      promos: {
        Row: {
          id: string
          title: string
          subtitle: string | null
          image: string
          link: string | null
          type: 'BANNER' | 'POPUP' | 'SLIDER'
          is_active: boolean
          sort_order: number
          starts_at: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['promos']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['promos']['Insert']>
      }
    }
  }
}
