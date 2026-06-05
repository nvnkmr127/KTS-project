import React, { createContext, useContext, useState } from 'react';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const MOCK_USERS: { email: string; password: string; user: User }[] = [
  {
    email: 'admin@krishnaveni.edu',
    password: 'admin123',
    user: { id: '1', name: 'Dr. S. Narasimha Rao', role: 'admin', email: 'admin@krishnaveni.edu', initials: 'NR', designation: 'Principal & Administrator' },
  },
  {
    email: 'teacher@krishnaveni.edu',
    password: 'teacher123',
    user: { id: '2', name: 'Mrs. Lakshmi Devi', role: 'teacher', email: 'teacher@krishnaveni.edu', initials: 'LD', designation: 'Senior Teacher', subject: 'Mathematics', classes: ['8A', '8B', '9A'] },
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string) => {
    const match = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (match) {
      setUser(match.user);
      return { ok: true };
    }
    return { ok: false, error: 'Invalid credentials. Please check your email and password.' };
  };

  const logout = () => setUser(null);

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
