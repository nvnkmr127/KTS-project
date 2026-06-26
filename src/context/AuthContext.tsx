import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api, ApiError } from '../services/api';

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

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

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
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
          alert('Account is inactive, contact admin.');
        }
      } catch (e: any) {
        // Only logout for a confirmed 403 "account inactive" response from the server.
        // Any other error (network timeout, 500, CORS, etc.) is a TRANSIENT issue —
        // logging the user out for a wifi blip is very bad UX.
        if (e instanceof ApiError && e.status === 403) {
          logout();
          alert(e.message || 'Account is inactive, contact admin.');
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
          alert('You have been logged out by an administrator.');
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
            } catch (err) {}
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  // Demo users for offline / no-backend usage
  const DEMO_USERS: Record<string, { email: string; password: string; user: User }> = {
    'admin@krishnaveni.edu': {
      email: 'admin@krishnaveni.edu',
      password: 'admin123',
      user: {
        id: '1',
        name: 'Admin User',
        email: 'admin@krishnaveni.edu',
        role: 'admin',
        initials: 'AU',
        designation: 'Administrator',
      },
    },
    'teacher@krishnaveni.edu': {
      email: 'teacher@krishnaveni.edu',
      password: 'teacher123',
      user: {
        id: '2',
        name: 'Teacher User',
        email: 'teacher@krishnaveni.edu',
        role: 'teacher',
        initials: 'TU',
        designation: 'Teacher',
      },
    },
  };

  const login = async (email: string, password: string) => {
    try {
      const res = await api.login({ email, password });
      if (res.user) {
        setUser(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
        return { ok: true };
      }
      return { ok: false, error: 'Login failed' };
    } catch (e: any) {
      // Check if credentials match a demo user as a fallback (works without backend or database seeding)
      const demo = DEMO_USERS[email.trim().toLowerCase()];
      if (demo && password === demo.password) {
        localStorage.setItem('token', 'demo-token');
        localStorage.setItem('user', JSON.stringify(demo.user));
        setUser(demo.user);
        return { ok: true };
      }
      return { ok: false, error: e.message || 'Invalid credentials. Please check your email and password.' };
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
