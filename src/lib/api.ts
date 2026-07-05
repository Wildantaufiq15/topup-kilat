// API Client for Topup Kilat

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async register(data: { email: string; name: string; password: string; phone?: string }) {
    return this.request('/auth/register', { method: 'POST', body: data });
  }

  async login(data: { email: string; password: string }) {
    return this.request<{ accessToken: string; refreshToken: string; user: any }>('/auth/login', { method: 'POST', body: data });
  }

  async refreshToken(refreshToken: string) {
    return this.request('/auth/refresh', { method: 'POST', body: { refreshToken } });
  }

  // Games
  async getGames(params?: { category?: string; search?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const queryString = query.toString();
    return this.request(`/games${queryString ? `?${queryString}` : ''}`);
  }

  async getGameBySlug(slug: string) {
    return this.request(`/games/slug/${slug}`);
  }

  async getPopularGames(limit?: number) {
    return this.request(`/games/popular${limit ? `?limit=${limit}` : ''}`);
  }

  // Products
  async getProductsByGame(gameId: string) {
    return this.request(`/products/game/${gameId}`);
  }

  // Vouchers
  async validateVoucher(code: string, amount?: number) {
    return this.request('/vouchers/validate', {
      method: 'POST',
      body: { code, amount },
    });
  }

  async getActiveVouchers() {
    return this.request('/vouchers/active');
  }

  // Promos
  async getPromos() {
    return this.request('/promos');
  }

  async getPromoBanners() {
    return this.request('/promos/banners');
  }

  // Orders
  async createOrder(data: { gameSlug: string; productId: string; userGameId: string; serverId?: string; voucherCode?: string }) {
    return this.request('/orders', { method: 'POST', body: data });
  }

  async getOrder(orderId: string) {
    return this.request(`/orders/${orderId}`);
  }

  async getOrderByInvoice(invoiceNo: string) {
    return this.request(`/orders/invoice/${invoiceNo}`);
  }

  async getUserOrders(params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    const queryString = query.toString();
    return this.request(`/orders${queryString ? `?${queryString}` : ''}`);
  }

  async checkout(orderId: string, paymentMethod: string) {
    return this.request(`/orders/${orderId}/checkout`, {
      method: 'POST',
      body: { paymentMethod },
    });
  }

  // User
  async getProfile() {
    return this.request('/users/me');
  }

  async updateProfile(data: { name?: string; phone?: string }) {
    return this.request('/users/me', { method: 'PATCH', body: data });
  }

  async getPointsHistory() {
    return this.request('/users/points');
  }

  async getWishlist() {
    return this.request('/users/wishlist');
  }

  async addToWishlist(gameId: string) {
    return this.request(`/users/wishlist/${gameId}`, { method: 'POST' });
  }

  async removeFromWishlist(gameId: string) {
    return this.request(`/users/wishlist/${gameId}`, { method: 'DELETE' });
  }

  // Notifications
  async getNotifications(params?: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.unreadOnly) query.set('unreadOnly', 'true');
    const queryString = query.toString();
    return this.request(`/notifications${queryString ? `?${queryString}` : ''}`);
  }

  async markNotificationRead(notificationId: string) {
    return this.request(`/notifications/${notificationId}/read`, { method: 'POST' });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', { method: 'POST' });
  }
}

export const api = new ApiClient(API_BASE_URL);

// Auth helpers
export const auth = {
  setToken: (accessToken: string, refreshToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
  },
  clearToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  },
  isLoggedIn: () => {
    return typeof window !== 'undefined' && !!localStorage.getItem('accessToken');
  },
};
