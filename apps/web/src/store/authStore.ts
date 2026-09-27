import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  level: number;
  xp: number;
  streak: number;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initialize: () => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      initialize: async () => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 100));
        const savedUser = localStorage.getItem('codeforge-user');
        if (savedUser) {
          set({ user: JSON.parse(savedUser), isAuthenticated: true });
        }
        set({ isLoading: false });
      },

      login: async (username: string, password: string) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 500));

        const user: User = {
          id: crypto.randomUUID(),
          username,
          level: 1,
          xp: 0,
          streak: 0,
        };

        localStorage.setItem('codeforge-user', JSON.stringify(user));
        set({ user, isAuthenticated: true, isLoading: false });
      },

      register: async (username: string, email: string, password: string) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 500));

        const user: User = {
          id: crypto.randomUUID(),
          username,
          email,
          level: 1,
          xp: 0,
          streak: 0,
        };

        localStorage.setItem('codeforge-user', JSON.stringify(user));
        set({ user, isAuthenticated: true, isLoading: false });
      },

      logout: () => {
        localStorage.removeItem('codeforge-user');
        set({ user: null, isAuthenticated: false });
      },

      updateUser: (updates) => {
        set((state) => {
          if (!state.user) return state;
          const newUser = { ...state.user, ...updates };
          localStorage.setItem('codeforge-user', JSON.stringify(newUser));
          return { user: newUser };
        });
      },
    }),
    {
      name: 'codeforge-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);