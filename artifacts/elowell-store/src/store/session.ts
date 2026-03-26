import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@/lib/api';

interface SessionState {
  user: User | null;
  token: string | null;
  cartSessionId: string;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  clearCart: () => void;
}

export const useSessionStore = create<SessionState>((set, get) => {
  let cartSessionId = localStorage.getItem('cartSessionId');
  if (!cartSessionId) {
    cartSessionId = uuidv4();
    localStorage.setItem('cartSessionId', cartSessionId);
  }

  // Initialize user from localStorage
  let initialUser = null;
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      initialUser = JSON.parse(storedUser);
    }
  } catch (error) {
    console.error('Failed to parse stored user:', error);
    localStorage.removeItem('user');
  }

  return {
    user: initialUser,
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
      localStorage.removeItem('user');
      // Clear cart on logout
      get().clearCart();
      set({ user: null, token: null });
    },
    clearCart: () => {
      // Generate new cart session ID to effectively clear the cart
      const newCartSessionId = uuidv4();
      localStorage.setItem('cartSessionId', newCartSessionId);
      set({ cartSessionId: newCartSessionId });
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
