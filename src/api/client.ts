const rawApiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, '') || 'http://127.0.0.1:8000';
const API_BASE = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

interface RequestOptions {
  method?: string;
  body?: unknown;
  token?: string;
}

// ── Request Deduplication Cache ──────────────────────────────────────
// Prevents duplicate GET requests within a short window
const _pendingRequests = new Map<string, Promise<any>>();
const _responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 2000; // 2 seconds for admin pages

function getCacheKey(endpoint: string, method: string): string {
  return `${method}:${endpoint}`;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;
  const cacheKey = getCacheKey(endpoint, method);

  // For GET requests, check in-flight deduplication and cache
  if (method === 'GET') {
    // Return pending request if one is already in-flight
    const pending = _pendingRequests.get(cacheKey);
    if (pending) return pending;

    // Return cached response if still fresh
    const cached = _responseCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  const requestPromise = fetch(`${API_BASE}${endpoint}`, config)
    .then(async (response) => {
      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      // Cache successful GET responses
      if (method === 'GET') {
        _responseCache.set(cacheKey, { data, timestamp: Date.now() });
      }
      // Invalidate related caches on write operations
      if (method !== 'GET') {
        // Clear all cached GETs for this resource type
        const resourcePrefix = endpoint.split('/').slice(0, 2).join('/');
        for (const key of _responseCache.keys()) {
          if (key.startsWith(`GET:${resourcePrefix}`)) {
            _responseCache.delete(key);
          }
        }
      }
      return data;
    })
    .finally(() => {
      _pendingRequests.delete(cacheKey);
    });

  if (method === 'GET') {
    _pendingRequests.set(cacheKey, requestPromise);
  }

  return requestPromise;
}

// ── Auth API ────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),
  me: (token: string) =>
    apiRequest<any>('/auth/me', { token }),
  updateMe: (token: string, data: any) =>
    apiRequest<any>('/auth/me', { method: 'PUT', body: data, token }),
};

// ── Books API ───────────────────────────────────────────────────────
export const booksApi = {
  list: (token: string, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest<any>(`/books${query}`, { token });
  },
  get: (token: string, id: number) =>
    apiRequest<any>(`/books/${id}`, { token }),
  create: (token: string, data: any) =>
    apiRequest<any>('/books', { method: 'POST', body: data, token }),
  update: (token: string, id: number, data: any) =>
    apiRequest<any>(`/books/${id}`, { method: 'PUT', body: data, token }),
  updateStock: (token: string, id: number, stock_count: number, in_stock?: boolean) =>
    apiRequest<any>(`/books/${id}/stock`, {
      method: 'PATCH',
      body: { stock_count, in_stock },
      token,
    }),
  delete: (token: string, id: number) =>
    apiRequest<any>(`/books/${id}`, { method: 'DELETE', token }),
};

// ── Categories API ──────────────────────────────────────────────────
export const categoriesApi = {
  list: (token: string) =>
    apiRequest<any[]>('/categories', { token }),
  create: (token: string, data: any) =>
    apiRequest<any>('/categories', { method: 'POST', body: data, token }),
  update: (token: string, id: number, data: any) =>
    apiRequest<any>(`/categories/${id}`, { method: 'PUT', body: data, token }),
  delete: (token: string, id: number) =>
    apiRequest<any>(`/categories/${id}`, { method: 'DELETE', token }),
};

// ── Orders API ──────────────────────────────────────────────────────
export const ordersApi = {
  list: (token: string, params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest<any[]>(`/orders${query}`, { token });
  },
  updateStatus: (token: string, id: number, status: string) =>
    apiRequest<any>(`/orders/${id}/status`, { method: 'PUT', body: { status }, token }),
  updatePaymentStatus: (token: string, id: number, payment_status: string) =>
    apiRequest<any>(`/orders/${id}/payment-status`, { method: 'PUT', body: { payment_status }, token }),
};

// ── Dashboard API ───────────────────────────────────────────────────
export const dashboardApi = {
  stats: (token: string) =>
    apiRequest<any>('/dashboard/stats', { token }),
};

// ── Users API ───────────────────────────────────────────────────────
export const usersApi = {
  list: (token: string) =>
    apiRequest<any[]>('/users', { token }),
  get: (token: string, id: number) =>
    apiRequest<any>(`/users/${id}`, { token }),
  create: (token: string, data: any) =>
    apiRequest<any>('/users', { method: 'POST', body: data, token }),
  update: (token: string, id: number, data: any) =>
    apiRequest<any>(`/users/${id}`, { method: 'PUT', body: data, token }),
  delete: (token: string, id: number) =>
    apiRequest<any>(`/users/${id}`, { method: 'DELETE', token }),
};

// ── Reviews API ─────────────────────────────────────────────────────
export const reviewsApi = {
  list: (token: string) =>
    apiRequest<any[]>('/reviews/admin/all', { token }),
  approve: (token: string, id: number, is_approved: boolean) =>
    apiRequest<any>(`/reviews/admin/${id}/approve`, { method: 'PUT', body: { is_approved }, token }),
  delete: (token: string, id: number) =>
    apiRequest<any>(`/reviews/admin/${id}`, { method: 'DELETE', token }),
};

// ── Sale Management APIs ────────────────────────────────────────────
export const salesApi = {
  // 1. Special Offers
  listSpecialOffers: (token?: string) =>
    apiRequest<any[]>('/sales/special-offers', { token }),
  createSpecialOffer: (token: string, data: any) =>
    apiRequest<any>('/sales/special-offers', { method: 'POST', body: data, token }),
  updateSpecialOffer: (token: string, id: number, data: any) =>
    apiRequest<any>(`/sales/special-offers/${id}`, { method: 'PUT', body: data, token }),
  deleteSpecialOffer: (token: string, id: number) =>
    apiRequest<any>(`/sales/special-offers/${id}`, { method: 'DELETE', token }),

  // 2. Discount Campaigns
  listCampaigns: (token?: string) =>
    apiRequest<any[]>('/sales/campaigns', { token }),
  createCampaign: (token: string, data: any) =>
    apiRequest<any>('/sales/campaigns', { method: 'POST', body: data, token }),
  updateCampaign: (token: string, id: number, data: any) =>
    apiRequest<any>(`/sales/campaigns/${id}`, { method: 'PUT', body: data, token }),
  deleteCampaign: (token: string, id: number) =>
    apiRequest<any>(`/sales/campaigns/${id}`, { method: 'DELETE', token }),

  // 3. Coupons
  listCoupons: (token: string) =>
    apiRequest<any[]>('/sales/coupons', { token }),
  createCoupon: (token: string, data: any) =>
    apiRequest<any>('/sales/coupons', { method: 'POST', body: data, token }),
  updateCoupon: (token: string, id: number, data: any) =>
    apiRequest<any>(`/sales/coupons/${id}`, { method: 'PUT', body: data, token }),
  deleteCoupon: (token: string, id: number) =>
    apiRequest<any>(`/sales/coupons/${id}`, { method: 'DELETE', token }),
  validateCoupon: (code: string, cartTotal: number) =>
    apiRequest<{ valid: boolean; message: string; discount_amount: number; coupon?: any }>(
      '/sales/coupons/validate',
      { method: 'POST', body: { code, cart_total: cartTotal } }
    ),

  // 4. Flash Sales
  listFlashSales: (token?: string) =>
    apiRequest<any[]>('/sales/flash-sales', { token }),
  createFlashSale: (token: string, data: any) =>
    apiRequest<any>('/sales/flash-sales', { method: 'POST', body: data, token }),
  updateFlashSale: (token: string, id: number, data: any) =>
    apiRequest<any>(`/sales/flash-sales/${id}`, { method: 'PUT', body: data, token }),
  deleteFlashSale: (token: string, id: number) =>
    apiRequest<any>(`/sales/flash-sales/${id}`, { method: 'DELETE', token }),
};
