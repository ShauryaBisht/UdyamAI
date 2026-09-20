'use client';

import { create } from 'zustand';

export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'udyam_theme';

interface ThemeState {
  theme: Theme;
  hydrated: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  hydrate: () => void;
}

function applyThemeToDocument(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  hydrated: false,
  setTheme: (theme: Theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      applyThemeToDocument(theme);
    }
    set({ theme });
  },
  toggleTheme: () => {
    const nextTheme: Theme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(nextTheme);
  },
  hydrate: () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    let resolvedTheme: Theme = 'light';
    if (stored === 'dark' || stored === 'light') {
      resolvedTheme = stored;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      resolvedTheme = 'dark';
    }
    applyThemeToDocument(resolvedTheme);
    set({ theme: resolvedTheme, hydrated: true });
  },
}));
