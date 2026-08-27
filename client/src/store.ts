import { create } from 'zustand';

type Theme = 'dark' | 'light';
type Lang = 'zh' | 'en' | 'ja';

interface AppState {
  theme: Theme;
  lang: Lang;
  toggleTheme: () => void;
  setLang: (l: Lang) => void;
}

const initialTheme: Theme =
  (localStorage.getItem('yozu-theme') as Theme) ||
  (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
const initialLang = (localStorage.getItem('yozu-lang') as Lang) || 'zh';

export const useAppStore = create<AppState>((set) => ({
  theme: initialTheme,
  lang: initialLang,
  toggleTheme: () =>
    set((s) => {
      const t = s.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('yozu-theme', t);
      return { theme: t };
    }),
  setLang: (l) => {
    localStorage.setItem('yozu-lang', l);
    set({ lang: l });
  },
}));
