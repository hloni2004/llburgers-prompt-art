/**
 * Central API client.
 *
 * - access token stored in memory (never localStorage/sessionStorage).
 * - refresh token stored only in an HttpOnly cookie managed by the browser.
 * - authFetch() silently refreshes on 401 and retries.
 */

import { setStompToken } from '@/lib/stomp';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8080';

// ─── In-memory access token ─────────────────────────────────────────────────
let _accessToken: string | null = null;

export const setAccessToken = (token: string | null): void => {
  _accessToken = token;
};

export const getAccessToken = (): string | null => _accessToken;

// ─── Token refresh ───────────────────────────────────────────────────────────
// Singleton promise prevents multiple simultaneous refresh calls.
let _refreshPromise: Promise<string | null> | null = null;

export const refreshTokens = async (): Promise<string | null> => {
  if (_refreshPromise) return _refreshPromise;

  _refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // sends the HttpOnly refresh cookie
      });
      if (!res.ok) {
        setAccessToken(null);
        setStompToken(null);  // Clear WebSocket auth on refresh failure
        return null;
      }
      const data = await res.json() as { accessToken: string };
      setAccessToken(data.accessToken);
      setStompToken(data.accessToken);  // Sync WebSocket auth token
      return data.accessToken;
    } catch {
      setAccessToken(null);
      setStompToken(null);  // Clear WebSocket auth on error
      return null;
    } finally {
      _refreshPromise = null;
    }
  })();

  return _refreshPromise;
};

// ─── Authenticated fetch ─────────────────────────────────────────────────────
/**
 * Drop-in replacement for `fetch` that:
 * 1. Attaches `Authorization: Bearer <token>` when a token is available.
 * 2. On HTTP 401, attempts one silent token refresh and retries the request.
 */
export const authFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> => {
  const headers = new Headers((init.headers as HeadersInit | undefined) ?? {});
  if (_accessToken) headers.set('Authorization', `Bearer ${_accessToken}`);

  let response = await fetch(input, { ...init, headers, credentials: 'include' });

  if (response.status === 401 && !String(input).includes('/api/auth/')) {
    const newToken = await refreshTokens();
    if (newToken) {
      headers.set('Authorization', `Bearer ${newToken}`);
      response = await fetch(input, { ...init, headers, credentials: 'include' });
    }
  }

  return response;
};

/** Build a full backend URL from a path, e.g. `/api/products`. */
export const apiUrl = (path: string): string => `${API_BASE}${path}`;

// ─── API Types ───────────────────────────────────────────────────────────────

export interface ApiExtra {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  availability: boolean;
  stockQuantity: number;
  deleted?: boolean;
}

export interface ApiProduct {
  id: string;
  name: string;
  description?: string;
  details?: string;
  price: number;
  imageUrl?: string;
  availability: boolean;
  category: 'BURGER' | 'DRINK' | 'SAUCE' | 'SIDE';
  stockQuantity: number;
  deleted?: boolean;
  featured?: boolean;
  tag?: string;
}

export interface ApiOrderItemExtra {
  id: string;
  extra: { id: string; name: string; price: number };
  quantity: number;
}

export interface ApiOrderItemSide {
  id: string;
  side: { id: string; name: string; price: number };
  quantity: number;
}

export interface ApiOrderItem {
  id: string;
  product: ApiProduct;
  quantity: number;
  totalPrice: number;
  unitPrice?: number;
  extras: ApiOrderItemExtra[];
  sides: ApiOrderItemSide[];
}

export interface ApiCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface ApiOrder {
  id: string;
  customer: ApiCustomer;
  totalPrice: number;
  status: 'PROCESSING' | 'ON_THE_WAY' | 'DELIVERED';
  paymentStatus: 'PENDING' | 'PAID';
  deliveryBlock: string;
  deliveryRoomNumber: string;
  specialInstructions?: string;
  createdAt: string;
  orderItems: ApiOrderItem[];
}

export interface ApiAuditLog {
  id: string;
  action: string;
  entity: string;
  detail: string;
  performedBy?: string;
  createdAt: string;
}

// ─── Product Admin API ───────────────────────────────────────────────────────

export const adminFetchProducts = async (): Promise<ApiProduct[]> => {
  const res = await authFetch(apiUrl('/api/products'));
  if (!res.ok) throw new Error('Failed to fetch products');
  return res.json() as Promise<ApiProduct[]>;
};

export const adminCreateProduct = async (data: Omit<ApiProduct, 'id' | 'deleted'>): Promise<ApiProduct> => {
  const res = await authFetch(apiUrl('/api/products'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create product');
  return res.json() as Promise<ApiProduct>;
};

export const adminUpdateProduct = async (product: ApiProduct): Promise<ApiProduct> => {
  const res = await authFetch(apiUrl('/api/products'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error('Failed to update product');
  return res.json() as Promise<ApiProduct>;
};

export const adminUploadProductImage = async (id: string, file: File): Promise<ApiProduct> => {
  const form = new FormData();
  form.append('file', file);
  const res = await authFetch(apiUrl(`/api/products/${id}/image`), {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error('Failed to upload image');
  return res.json() as Promise<ApiProduct>;
};

export const adminSoftDeleteProduct = async (id: string): Promise<ApiProduct> => {
  const res = await authFetch(apiUrl(`/api/products/${id}/soft-delete`), { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to delete product');
  return res.json() as Promise<ApiProduct>;
};

// ─── Extras Public API ───────────────────────────────────────────────────────

export const fetchAvailableExtras = async (): Promise<ApiExtra[]> => {
  const res = await fetch(apiUrl('/api/extras/available'));
  if (!res.ok) throw new Error('Failed to fetch extras');
  return res.json() as Promise<ApiExtra[]>;
};

// ─── Extras Admin API ────────────────────────────────────────────────────────

export const adminFetchExtras = async (): Promise<ApiExtra[]> => {
  const res = await authFetch(apiUrl('/api/extras'));
  if (!res.ok) throw new Error('Failed to fetch extras');
  return res.json() as Promise<ApiExtra[]>;
};

export const adminCreateExtra = async (data: Omit<ApiExtra, 'id' | 'deleted'>): Promise<ApiExtra> => {
  const res = await authFetch(apiUrl('/api/extras'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create extra');
  return res.json() as Promise<ApiExtra>;
};

export const adminUpdateExtra = async (extra: ApiExtra): Promise<ApiExtra> => {
  const res = await authFetch(apiUrl('/api/extras'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(extra),
  });
  if (!res.ok) throw new Error('Failed to update extra');
  return res.json() as Promise<ApiExtra>;
};

export const adminSoftDeleteExtra = async (id: string): Promise<ApiExtra> => {
  const res = await authFetch(apiUrl(`/api/extras/${id}/soft-delete`), { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to delete extra');
  return res.json() as Promise<ApiExtra>;
};

// ─── Customer Order API ───────────────────────────────────────────────────────

export interface PlaceOrderItemPayload {
  product: { id: string };
  quantity: number;
  totalPrice: number;
  extras: Array<{ extra: { id: string }; quantity: number }>;
  sides: never[];
}

export interface PlaceOrderPayload {
  customer: { id: string };
  deliveryBlock: string;
  deliveryRoomNumber: string;
  specialInstructions?: string;
  orderItems: PlaceOrderItemPayload[];
}

/** Place an order as an authenticated customer — calls POST /api/orders. */
export const placeOrderApi = async (payload: PlaceOrderPayload): Promise<ApiOrder> => {
  const res = await authFetch(apiUrl('/api/orders'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as Record<string, string>;
    throw new Error(data.message ?? data.error ?? 'Failed to place order');
  }
  return res.json() as Promise<ApiOrder>;
};

/** Fetch all orders for a specific customer. */
export const fetchCustomerOrders = async (customerId: string): Promise<ApiOrder[]> => {
  const res = await authFetch(apiUrl(`/api/orders/customer/${customerId}`));
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json() as Promise<ApiOrder[]>;
};

// ─── Order Admin API ─────────────────────────────────────────────────────────

export const adminFetchOrders = async (): Promise<ApiOrder[]> => {
  const res = await authFetch(apiUrl('/api/orders'));
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json() as Promise<ApiOrder[]>;
};

export const adminUpdateOrderStatus = async (
  id: string,
  status: 'PROCESSING' | 'ON_THE_WAY' | 'DELIVERED',
): Promise<ApiOrder> => {
  const res = await authFetch(apiUrl(`/api/orders/${id}/status?status=${status}`), { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to update order status');
  return res.json() as Promise<ApiOrder>;
};

export const adminMarkOrderPaid = async (id: string): Promise<ApiOrder> => {
  const res = await authFetch(apiUrl(`/api/orders/${id}/payment?status=PAID`), { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to mark order as paid');
  return res.json() as Promise<ApiOrder>;
};

// ─── Audit Log API ───────────────────────────────────────────────────────────

export const adminFetchAuditLogs = async (): Promise<ApiAuditLog[]> => {
  const res = await authFetch(apiUrl('/api/audit'));
  if (!res.ok) throw new Error('Failed to fetch audit logs');
  return res.json() as Promise<ApiAuditLog[]>;
};

export const adminPushAuditLog = async (
  action: string,
  entity: string,
  detail: string,
  performedBy: string,
): Promise<void> => {
  await authFetch(apiUrl('/api/audit'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, entity, detail, performedBy }),
  });
};

// ─── Business Status API ──────────────────────────────────────────────────────

/** Returns true when the business is currently open, false when closed. */
export const fetchBusinessIsOpen = async (): Promise<boolean> => {
  const res = await fetch(apiUrl('/api/business-status/is-open'));
  if (!res.ok) return true; // assume open on error
  return res.json() as Promise<boolean>;
};

/** Opens the business (admin only). */
export const adminOpenBusiness = async (adminId: string): Promise<void> => {
  const res = await authFetch(apiUrl(`/api/business-status/open?adminId=${adminId}`), { method: 'POST' });
  if (!res.ok) throw new Error('Failed to open business');
};

/** Closes the business (admin only). */
export const adminCloseBusiness = async (adminId: string, closedMessage = 'Currently closed'): Promise<void> => {
  const res = await authFetch(
    apiUrl(`/api/business-status/close?adminId=${adminId}&closedMessage=${encodeURIComponent(closedMessage)}`),
    { method: 'POST' },
  );
  if (!res.ok) throw new Error('Failed to close business');
};

// ─── OTP / Forgot Password API ────────────────────────────────────────────────

/**
 * Request a 6-digit OTP sent to the provided email address.
 * Always resolves (avoids email enumeration on failure).
 */
export const sendPasswordOtp = async (email: string): Promise<void> => {
  await fetch(apiUrl('/api/auth/forgot-password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
};

/**
 * Verify a 6-digit OTP for the given email.
 * Returns `{ resetToken }` on success or throws on failure.
 */
export const verifyPasswordOtp = async (
  email: string,
  otp: string,
): Promise<{ resetToken: string }> => {
  const res = await fetch(apiUrl('/api/auth/verify-otp'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp }),
  });
  const data = await res.json() as Record<string, string>;
  if (!res.ok) throw new Error(data.error ?? 'Invalid or expired OTP.');
  return { resetToken: data.resetToken };
};

// ─── User Management API (Super Admin) ───────────────────────────────────────

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER';
  active: boolean;
  createdAt: string;
}

export const adminFetchUsers = async (): Promise<ApiUser[]> => {
  const res = await authFetch(apiUrl('/api/users'));
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json() as Promise<ApiUser[]>;
};

export const adminUpdateUserRole = async (id: string, role: 'CUSTOMER' | 'ADMIN' | 'SUPER'): Promise<ApiUser> => {
  const res = await authFetch(apiUrl(`/api/users/${id}/role?role=${role}`), { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to update user role');
  return res.json() as Promise<ApiUser>;
};

export const adminToggleUserActive = async (id: string, active: boolean): Promise<ApiUser> => {
  const endpoint = active ? `/api/users/${id}/activate` : `/api/users/${id}/deactivate`;
  const res = await authFetch(apiUrl(endpoint), { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to update user status');
  return res.json() as Promise<ApiUser>;
};

export const adminDeleteUser = async (id: string): Promise<void> => {
  const res = await authFetch(apiUrl(`/api/users/${id}`), { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete user');
};

