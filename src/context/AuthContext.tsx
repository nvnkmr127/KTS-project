import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { api } from '../services/api';

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
          console.error("Failed to refresh user profile:", e);
          logout();
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
        // If profile fetch fails (e.g. returns 403 Forbidden because account was set to inactive)
        logout();
        alert(e.message || 'Account is inactive, contact admin.');
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
    // Check demo credentials first (works without backend)
    const demo = DEMO_USERS[email.trim().toLowerCase()];
    if (demo && password === demo.password) {
      localStorage.setItem('token', 'demo-token');
      localStorage.setItem('user', JSON.stringify(demo.user));
      setUser(demo.user);
      return { ok: true };
    }

    try {
      const res = await api.login({ email, password });
      if (res.user) {
        setUser(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
        return { ok: true };
      }
      return { ok: false, error: 'Login failed' };
    } catch (e: any) {
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
