import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@workspace/api-client-react';

interface SessionState {
  user: User | null;
  token: string | null;
  cartSessionId: string;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useSessionStore = create<SessionState>((set) => {
  let cartSessionId = localStorage.getItem('cartSessionId');
  if (!cartSessionId) {
    cartSessionId = uuidv4();
    localStorage.setItem('cartSessionId', cartSessionId);
  }

  return {
    user: null,
    token: localStorage.getItem('token'),
    cartSessionId,
    setUser: (user) => set({ user }),
    setToken: (token) => {
      if (token) localStorage.setItem('token', token);
      else localStorage.removeItem('token');
      set({ token });
    },
    logout: () => {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  };
});

export function useApiOptions() {
  const token = useSessionStore((s) => s.token);
  return {
    request: {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    }
  };
}
