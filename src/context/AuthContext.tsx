import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api, ApiError } from '../services/api';
import { useDialog } from './DialogContext';

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { alert } = useDialog();

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    return null;
  });

  useEffect(() => {
    async function refreshUser() {
      const token = localStorage.getItem('token');
      // Skip API call for demo token — no backend needed
      if (token && token !== 'demo-token') {
        try {
          const res = await api.getMe();
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('user', JSON.stringify(res.user));
          }
        } catch (e) {
          // Only logout on a real 401 (token truly invalid/expired).
          // Network errors, 5xx server errors, or CORS failures are transient
          // and should NOT kick the user out — keep them on their cached session.
          if (e instanceof ApiError && e.status === 401) {
            logout();
          } else {
            console.warn('Could not refresh session (non-auth error, keeping user logged in):', e);
          }
        }
      }
    }

    // User is already initialized synchronously in useState

    refreshUser();
  }, []);

  // Listen for 401 Unauthorized events dispatched by api.ts
  // This replaces the old `window.location.href = '/login'` hard redirect,
  // which could land on the Laravel backend's /login page in production instead of the SPA.
  useEffect(() => {
    const handleUnauthorized = () => {
      api.logout();
      localStorage.removeItem('user');
      setUser(null);
    };
    window.addEventListener('kts:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('kts:unauthorized', handleUnauthorized);
  }, []);

  // Poll server to check if user status has been changed to inactive while logged in

  useEffect(() => {
    if (!user) return;
    // Skip polling for demo users — no backend to verify against
    const token = localStorage.getItem('token');
    if (token === 'demo-token') return;

    const interval = setInterval(async () => {
      try {
        const res = await api.getMe();
        if (res.user && res.user.status && res.user.status.toLowerCase() === 'inactive') {
          logout();
          alert('Account is inactive, contact admin.', 'Account Inactive');
        }
      } catch (e) {
        // Only logout for a confirmed 403 "account inactive" response from the server.
        // Any other error (network timeout, 500, CORS, etc.) is a TRANSIENT issue —
        // logging the user out for a wifi blip is very bad UX.
        if (e instanceof ApiError && e.status === 403) {
          logout();
          alert((e as Error).message || 'Account is inactive, contact admin.', 'Account Inactive');
        } else if (e instanceof ApiError && e.status === 401) {
          // 401 is already handled by kts:unauthorized event in api.ts — skip duplicate action
          console.warn('Session expired (handled by kts:unauthorized)');
        } else {
          // Transient error — silently ignore and keep user logged in
          console.warn('Polling /me failed (transient, keeping session):', e);
        }
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [user]);

  // Listen for storage changes to sync authentication state and force logouts across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // If storage was cleared entirely
      if (!e.key) {
        if (!localStorage.getItem('token')) {
          setUser(null);
        }
        return;
      }

      // Handle force logout flag
      if (user) {
        const expectedKey = `kts_force_logout_${user.email?.toLowerCase()}`;
        if (e.key === expectedKey && e.newValue) {
          logout();
          alert('You have been logged out by an administrator.', 'Session Ended');
          return;
        }
      }

      // Sync user state changes (e.g. login/role switch in another tab)
      if (e.key === 'user') {
        if (e.newValue) {
          try {
            const parsedUser = JSON.parse(e.newValue);
            if (JSON.stringify(user) !== JSON.stringify(parsedUser)) {
              setUser(parsedUser);
            }
  // eslint-disable-next-line unused-imports/no-unused-vars
          } catch (err) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }

      // Sync token change (e.g. logout in another tab)
      if (e.key === 'token') {
        if (!e.newValue) {
          setUser(null);
        } else {
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              if (JSON.stringify(user) !== JSON.stringify(parsedUser)) {
                setUser(parsedUser);
              }
   
    /* empty */
            } catch (err) {}
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.login({ email, password });
      if (res.user) {
        setUser(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
        return { ok: true };
      }
      return { ok: false, error: 'Login failed' };
    } catch (e) {
      return { ok: false, error: (e as Error).message || 'Invalid credentials. Please check your email and password.' };
    }
  };

  const logout = () => {
    api.logout();
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
