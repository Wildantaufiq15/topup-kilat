// API Client for Topup Kilat using Supabase
import { supabase } from './supabase';
import type { Database } from './supabase';

// Types
type User = Database['public']['Tables']['users']['Row'];
type Game = Database['public']['Tables']['games']['Row'];
type GameProduct = Database['public']['Tables']['game_products']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];
type Payment = Database['public']['Tables']['payments']['Row'];
type Voucher = Database['public']['Tables']['vouchers']['Row'];
type Promo = Database['public']['Tables']['promos']['Row'];
type Banner = Database['public']['Tables']['promos']['Row'];

// API Client
class ApiClient {
  // ==================== AUTH ====================

  async register(data: { email: string; name: string; password: string; phone?: string }) {
    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });

    if (authError) throw new Error(authError.message);

    if (!authData.user) throw new Error('Registration failed');

    // Create user profile with retry logic
    let profileError = null;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      const { error } = await supabase.from('users').insert({
        id: authData.user!.id,
        email: data.email,
        name: data.name,
        phone: data.phone || null,
      });

      if (!error) {
        profileError = null;
        break;
      }

      profileError = error;
      retries++;

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (profileError) {
      console.warn('Profile creation warning:', profileError.message);
      // Don't throw - auth user is created, profile can be created later
    }

    // Get the created profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user!.id)
      .maybeSingle();

    return { user: authData.user, profile, message: 'Registration successful' };
  }

  async login(data: { email: string; password: string }) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (authError) throw new Error(authError.message);

    // Get user profile - use maybeSingle to avoid 406 error
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.warn('Profile fetch warning:', profileError.message);
    }

    return {
      user: profile,
      session: authData.session,
      message: 'Login successful',
    };
  }

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    return { message: 'Logged out successfully' };
  }

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  // ==================== GAMES ====================

  async getGames(params?: { category?: string; search?: string }) {
    let query = supabase.from('games').select('*').eq('is_active', true);

    if (params?.category) {
      query = query.eq('category', params.category.toUpperCase());
    }

    if (params?.search) {
      query = query.ilike('name', `%${params.search}%`);
    }

    const { data, error } = await query.order('sort_order');
    if (error) throw new Error(error.message);
    return data;
  }

  async getGameBySlug(slug: string) {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Game not found');
    return data;
  }

  async getPopularGames(limit = 8) {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('is_active', true)
      .eq('featured', true)
      .order('sort_order')
      .limit(limit);
    if (error) throw new Error(error.message);
    return data;
  }

  // ==================== PRODUCTS ====================

  async getProductsByGame(gameId: string) {
    const { data, error } = await supabase
      .from('game_products')
      .select('*')
      .eq('game_id', gameId)
      .eq('is_active', true)
      .order('price');
    if (error) throw new Error(error.message);
    return data || [];
  }

  // ==================== ORDERS ====================

  /**
   * @deprecated Use POST /api/orders/create instead
   * This function is kept for backward compatibility but should not be used directly.
   * All order creation should go through the server-side API route to ensure price integrity.
   */
  async createOrder(data: {
    gameSlug: string;
    productId: string;
    userGameId: string;
    serverId?: string;
    voucherCode?: string;
  }) {
    // Get game and product
    const { data: game } = await supabase.from('games').select('*').eq('slug', data.gameSlug).maybeSingle();
    if (!game) throw new Error('Game not found');

    const { data: product } = await supabase.from('game_products').select('*').eq('id', data.productId).maybeSingle();
    if (!product) throw new Error('Product not found');

    // Generate invoice
    const invoiceNo = `TK${Date.now()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Get user ID if logged in - use getSession which returns Promise
    const session = await this.getSession();
    const userId = session?.user?.id || null;

    // Calculate total
    let subtotal = product.price;
    let voucherDiscount = 0;
    let voucherId = null;

    // Apply voucher if provided
    if (data.voucherCode) {
      const { data: voucher } = await supabase
        .from('vouchers')
        .select('*')
        .eq('code', data.voucherCode.toUpperCase())
        .eq('is_active', true)
        .gt('usage_limit', 0)
        .maybeSingle();

      if (voucher && (!voucher.expires_at || new Date(voucher.expires_at) > new Date())) {
        voucherId = voucher.id;
        if (voucher.discount_type === 'PERCENTAGE') {
          voucherDiscount = Math.floor((subtotal * voucher.discount_value) / 100);
          if (voucher.max_discount) voucherDiscount = Math.min(voucherDiscount, voucher.max_discount);
        } else {
          voucherDiscount = voucher.discount_value;
        }
      }
    }

    const total = Math.max(0, subtotal - voucherDiscount);

    // Create order - use the supabase client directly to ensure proper auth context
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        game_id: game.id,
        product_id: product.id,
        invoice_no: invoiceNo,
        user_game_id: data.userGameId,
        server_id: data.serverId || null,
        voucher_id: voucherId,
        voucher_code: data.voucherCode?.toUpperCase() || null,
        voucher_discount: voucherDiscount,
        subtotal,
        total,
        status: 'PENDING',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw new Error(orderError.message);
    }

    return order;
  }

  async getOrder(orderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        game:games(*),
        product:game_products(*)
      `)
      .eq('id', orderId)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getOrderByInvoice(invoiceNo: string) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        game:games(*),
        product:game_products(*)
      `)
      .eq('invoice_no', invoiceNo)
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  async getUserOrders() {
    const session = await this.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        game:games(*),
        product:game_products(*)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  }

  // ==================== PAYMENTS ====================

  async getPayment(paymentId: string) {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  }

  async checkout(orderId: string, paymentMethod: string) {
    // Get order
    const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (!order) throw new Error('Order not found');
    if (order.status !== 'PENDING') throw new Error('Order is not pending');

    // Generate payment reference
    const providerRef = `PAY-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const expiredAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        method: paymentMethod,
        amount: order.total,
        status: 'PENDING',
        provider_ref: providerRef,
        expired_at: expiredAt.toISOString(),
      })
      .select()
      .single();

    if (paymentError) throw new Error(paymentError.message);

    // Generate mock payment details based on method
    let paymentUrl = '';
    let qrCode = '';
    let vaNumber = '';

    switch (paymentMethod) {
      case 'QRIS':
        qrCode = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        paymentUrl = `https://api.sakurupiah.com/qris/${providerRef}`;
        break;
      case 'BCA_VA':
      case 'BNI_VA':
      case 'MANDIRI_VA':
      case 'BRI_VA':
        const prefix = { BCA_VA: '88088', BNI_VA: '88012', MANDIRI_VA: '88013', BRI_VA: '88011' };
        const num = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
        vaNumber = `${prefix[paymentMethod as keyof typeof prefix] || '88088'}${num}`;
        paymentUrl = vaNumber;
        break;
      default:
        paymentUrl = `https://api.sakurupiah.com/pay/${providerRef}`;
    }

    // Update payment with details
    await supabase
      .from('payments')
      .update({
        payment_url: paymentUrl,
        qr_code: qrCode || null,
        va_number: vaNumber || null,
      })
      .eq('id', payment.id);

    // Update order payment method
    await supabase.from('orders').update({ payment_method: paymentMethod }).eq('id', orderId);

    return {
      ...payment,
      payment_url: paymentUrl,
      qr_code: qrCode || null,
      va_number: vaNumber || null,
    };
  }

  // ==================== VOUCHERS ====================

  async validateVoucher(code: string, amount?: number) {
    const { data: voucher, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !voucher) throw new Error('Voucher tidak valid');

    if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
      throw new Error('Voucher sudah expired');
    }

    if (voucher.usage_limit && voucher.used_quota >= voucher.usage_limit) {
      throw new Error('Voucher sudah mencapai batas penggunaan');
    }

    if (amount && voucher.min_transaction && amount < voucher.min_transaction) {
      throw new Error(`Minimal transaksi Rp ${voucher.min_transaction.toLocaleString('id-ID')}`);
    }

    return voucher;
  }

  async getActiveVouchers() {
    const { data, error } = await supabase
      .from('vouchers')
      .select('*')
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('sort_order', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
  }

  // ==================== BANNERS ====================

  async getBanners() {
    const { data, error } = await supabase
      .from('promos')
      .select('*')
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('sort_order');
    if (error) throw new Error(error.message);
    return data;
  }

  async getAllBanners() {
    const { data, error } = await supabase
      .from('promos')
      .select('*')
      .order('sort_order');
    if (error) throw new Error(error.message);
    return data;
  }

  async createBanner(data: {
    title: string;
    subtitle?: string;
    image: string;
    link?: string;
    type?: 'BANNER' | 'POPUP' | 'SLIDER';
    sortOrder?: number;
    startsAt?: string;
    expiresAt?: string;
  }) {
    const { data: banner, error } = await supabase
      .from('promos')
      .insert({
        title: data.title,
        subtitle: data.subtitle || null,
        image: data.image,
        link: data.link || null,
        type: data.type || 'BANNER',
        sort_order: data.sortOrder || 0,
        is_active: true,
        starts_at: data.startsAt || new Date().toISOString(),
        expires_at: data.expiresAt || null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return banner;
  }

  async updateBanner(id: string, data: {
    title?: string;
    subtitle?: string;
    image?: string;
    link?: string;
    type?: 'BANNER' | 'POPUP' | 'SLIDER';
    sortOrder?: number;
    isActive?: boolean;
    startsAt?: string;
    expiresAt?: string;
  }) {
    const updateData: Record<string, any> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.link !== undefined) updateData.link = data.link;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.sortOrder !== undefined) updateData.sort_order = data.sortOrder;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;
    if (data.startsAt !== undefined) updateData.starts_at = data.startsAt;
    if (data.expiresAt !== undefined) updateData.expires_at = data.expiresAt;

    const { data: banner, error } = await supabase
      .from('promos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return banner;
  }

  async deleteBanner(id: string) {
    const { error } = await supabase
      .from('promos')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
    return { message: 'Banner deleted' };
  }

  // ==================== PROMOS ====================

  async getPromoBanners() {
    const { data, error } = await supabase
      .from('promos')
      .select('*')
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .order('sort_order');
    if (error) throw new Error(error.message);
    return data;
  }

  // ==================== USER ====================

  async getProfile() {
    const session = await this.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Profile not found');
    return data;
  }

  async updateProfile(data: { name?: string; phone?: string }) {
    const session = await this.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data: updated, error } = await supabase
      .from('users')
      .update({
        name: data.name,
        phone: data.phone,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('Update profile error:', error);
      throw new Error(error.message);
    }
    if (!updated) throw new Error('Failed to update profile');
    return updated;
  }

  // ==================== WISHLIST ====================

  async getWishlist() {
    const session = await this.getSession();
    if (!session) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        *,
        game:games(*)
      `)
      .eq('user_id', session.user.id);
    if (error) throw new Error(error.message);
    return data;
  }

  async addToWishlist(gameId: string) {
    const session = await this.getSession();
    if (!session) throw new Error('Not authenticated');

    const { error } = await supabase.from('wishlists').insert({
      user_id: session.user.id,
      game_id: gameId,
    });
    if (error) throw new Error(error.message);
    return { message: 'Added to wishlist' };
  }

  async removeFromWishlist(gameId: string) {
    const session = await this.getSession();
    if (!session) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', session.user.id)
      .eq('game_id', gameId);
    if (error) throw new Error(error.message);
    return { message: 'Removed from wishlist' };
  }
}

export const api = new ApiClient();

// Auth helpers
export const auth = {
  setSession: (session: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('supabase_session', JSON.stringify(session));
    }
  },
  clearSession: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('supabase_session');
    }
  },
  getSession: () => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('supabase_session');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  },
  isLoggedIn: () => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('supabase_session');
    }
    return false;
  },
};
