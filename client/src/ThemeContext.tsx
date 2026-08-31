import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loadTheme, saveTheme, type ThemePref } from './storage.js';

type Resolved = 'light' | 'dark';

interface ThemeContextValue {
  /** 用户选择：system / light / dark */
  pref: ThemePref;
  /** 实际生效的主题 */
  resolved: Resolved;
  setPref: (pref: ThemePref) => void;
  /** 依次循环 system → light → dark → system */
  cycle: () => void;
}

const THEME_COLOR: Record<Resolved, string> = {
  dark: '#100c1c',
  light: '#fff8ec',
};

const ThemeContext = createContext<ThemeContextValue>({
  pref: 'system',
  resolved: 'dark',
  setPref: () => {},
  cycle: () => {},
});

function systemTheme(): Resolved {
  try {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>(() => loadTheme());
  const [system, setSystem] = useState<Resolved>(() => systemTheme());

  // system 模式下跟随系统偏好变化
  useEffect(() => {
    let mq: MediaQueryList;
    try {
      mq = window.matchMedia('(prefers-color-scheme: light)');
    } catch {
      return;
    }
    const sync = () => setSystem(mq.matches ? 'light' : 'dark');
    // 部分环境（旧 Safari、嵌入式 WebView）不派发 change，回到前台时补一次同步
    const onVisible = () => {
      if (document.visibilityState === 'visible') sync();
    };

    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', sync);
    } else {
      mq.addListener(sync);
    }
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', onVisible);
    sync();

    return () => {
      if (typeof mq.removeEventListener === 'function') {
        mq.removeEventListener('change', sync);
      } else {
        mq.removeListener(sync);
      }
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const resolved: Resolved = pref === 'system' ? system : pref;

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', THEME_COLOR[resolved]);
  }, [resolved]);

  const setPref = useCallback((next: ThemePref) => {
    setPrefState(next);
    saveTheme(next);
  }, []);

  const cycle = useCallback(() => {
    setPrefState((cur) => {
      const next: ThemePref = cur === 'system' ? 'light' : cur === 'light' ? 'dark' : 'system';
      saveTheme(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ pref, resolved, setPref, cycle }), [pref, resolved, setPref, cycle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
