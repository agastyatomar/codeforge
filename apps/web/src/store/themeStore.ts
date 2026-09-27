import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  initialize: () => void;
  toggleTheme: (theme?: Theme) => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      resolvedTheme: 'dark',

      initialize: () => {
        const savedTheme = localStorage.getItem('codeforge-theme') as Theme || 'system';
        const resolved = get().resolveTheme(savedTheme);
        set({ theme: savedTheme, resolvedTheme: resolved });
        document.documentElement.classList.toggle('dark', resolved === 'dark');
      },

      resolveTheme: (theme: Theme): 'light' | 'dark' => {
        if (theme === 'system') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return theme;
      },

      toggleTheme: (theme?: Theme) => {
        const current = get().theme;
        const themes: Theme[] = ['light', 'dark', 'system'];
        const nextIndex = (themes.indexOf(current) + 1) % themes.length;
        const nextTheme = theme || themes[nextIndex];
        get().setTheme(nextTheme);
      },

      setTheme: (theme: Theme) => {
        const resolved = get().resolveTheme(theme);
        set({ theme, resolvedTheme: resolved });
        localStorage.setItem('codeforge-theme', theme);
        document.documentElement.classList.toggle('dark', resolved === 'dark');
      },
    }),
    {
      name: 'codeforge-theme',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);