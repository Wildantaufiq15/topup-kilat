// API Client for Topup Kilat using Supabase
import { supabase } from './supabase';
import type { Database } from './supabase';

// Types
type Game = Database['public']['Tables']['games']['Row'];
type GameProduct = Database['public']['Tables']['game_products']['Row'];
type Order = Database['public']['Tables']['orders']['Row'];
type Voucher = Database['public']['Tables']['vouchers']['Row'];
type Banner = Database['public']['Tables']['promos']['Row'];

// API Client
class ApiClient {
  // ==================== SESSION ====================

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
    return { message: 'Logged out successfully' };
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

  // ==================== BANNERS/PROMOS ====================

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

  async updateBanner(id: string, data: {
    sortOrder?: number;
    isActive?: boolean;
  }) {
    const updateData: Record<string, any> = {};
    if (data.sortOrder !== undefined) updateData.sort_order = data.sortOrder;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const { data: banner, error } = await supabase
      .from('promos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return banner;
  }

  // ==================== USER PROFILE ====================

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
