'use client';

import { create } from 'zustand';

export type AuthUser = { id: string; email: string; name?: string };

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  hydrate: () => void;
  setAuth: (token: string, user: AuthUser) => void;
  clear: () => void;
};

const STORAGE_KEY = 'knowledge-stack.auth';

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrate: () => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { token: string; user: AuthUser };
      set({ token: parsed.token, user: parsed.user });
    } catch {
      /* ignore malformed storage */
    }
  },
  setAuth: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
    }
    set({ token, user });
  },
  clear: () => {
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
    set({ token: null, user: null });
  },
}));
