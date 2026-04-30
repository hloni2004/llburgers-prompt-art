import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { setAccessToken, refreshTokens, apiUrl, authFetch } from '@/api/api';
import { setStompToken } from '@/lib/stomp';

export type PaymentMethod = 'cash' | 'card' | 'eft';
export type DeliveryBlock = 'A' | 'B' | 'C';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'CUSTOMER' | 'ADMIN' | 'SUPER';
  deliveryBlock: DeliveryBlock;
  roomNumber: string;
  paymentMethod: PaymentMethod;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  deliveryBlock: DeliveryBlock;
  roomNumber: string;
  paymentMethod?: PaymentMethod;
  password: string;
}

interface AuthResult {
  ok: boolean;
  error?: string;
  role?: 'CUSTOMER' | 'ADMIN' | 'SUPER';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  /** True while the app checks for an existing session on first load. */
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<AuthResult>;
  register: (data: RegisterData) => Promise<AuthResult>;
  applyWebAuthnLogin: (data: { accessToken: string; user: Record<string, unknown> }) => AuthResult;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Maps the backend UserSummary JSON onto the frontend User shape. */
function mapApiUser(data: Record<string, unknown>): User {
  return {
    id:            String(data.id ?? ''),
    name:          String(data.name ?? ''),
    email:         String(data.email ?? ''),
    phone:         String(data.phone ?? ''),
    role:          (data.role as 'CUSTOMER' | 'ADMIN' | 'SUPER') ?? 'CUSTOMER',
    deliveryBlock: ((data.block as string) ?? 'A') as DeliveryBlock,
    roomNumber:    String(data.roomNumber ?? ''),
    paymentMethod: (((data.paymentMethods as string) ?? 'cash')
                    .split(',')[0]
                    .trim()) as PaymentMethod,
  };
}

const WEB_AUTHN_TOKEN_KEY = 'accessToken';

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]         = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);

  // On mount: attempt silent token refresh to restore an existing session.
  useEffect(() => {
    (async () => {
      try {
        const token = await refreshTokens();
        if (token) {
          const res = await authFetch(apiUrl('/api/auth/me'));
          if (res.ok) {
            const data = await res.json() as Record<string, unknown>;
            setUser(mapApiUser(data));
          }
        }
      } catch {
        // No valid session — remain logged out.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Login ────────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials: { email: string; password: string }): Promise<AuthResult> => {
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: credentials.email, password: credentials.password }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) return { ok: false, error: String(data.error ?? 'Login failed.') };
      const token = String(data.accessToken);
      setAccessToken(token);
      setStompToken(token);  // Authenticate WebSocket connection
      const mapped = mapApiUser(data.user as Record<string, unknown>);
      setUser(mapped);
      return { ok: true, role: mapped.role };
    } catch {
      return { ok: false, error: 'Network error. Please check your connection.' };
    }
  }, []);

  // ── Register ─────────────────────────────────────────────────────────────────
  const register = useCallback(async (formData: RegisterData): Promise<AuthResult> => {
    try {
      const res = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name:           formData.name,
          email:          formData.email,
          phone:          formData.phone,
          password:       formData.password,
          block:          formData.deliveryBlock,
          roomNumber:     formData.roomNumber,
          paymentMethods: formData.paymentMethod ?? 'cash',
        }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (!res.ok) return { ok: false, error: String(data.error ?? 'Registration failed.') };
      const token = String(data.accessToken);
      setAccessToken(token);
      setStompToken(token);  // Authenticate WebSocket connection
      const mapped = mapApiUser(data.user as Record<string, unknown>);
      setUser(mapped);
      return { ok: true, role: mapped.role };
    } catch {
      return { ok: false, error: 'Network error. Please check your connection.' };
    }
  }, []);

  const applyWebAuthnLogin = useCallback((data: { accessToken: string; user: Record<string, unknown> }): AuthResult => {
    const token = String(data.accessToken ?? '');
    if (!token) return { ok: false, error: 'Login failed.' };
    setAccessToken(token);
    setStompToken(token);
    const mapped = mapApiUser(data.user ?? {});
    setUser(mapped);
    return { ok: true, role: mapped.role };
  }, []);

  // ── Logout ──────────────────────────────────────────────────────────────────
  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch(apiUrl('/api/auth/logout'), {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      // Clear state regardless of API success – user is logged out locally.
      setAccessToken(null);
      setStompToken(null);  // Clear WebSocket authentication
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(WEB_AUTHN_TOKEN_KEY);
      }
    }
  }, []);

  // ── Optimistic local update ──────────────────────────────────────────────────
  const updateUser = useCallback((data: Partial<User>) => {
    setUser(prev => (prev ? { ...prev, ...data } : prev));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, register, applyWebAuthnLogin, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
