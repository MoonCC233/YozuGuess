import { useTheme } from '../ThemeContext.js';
import type { ThemePref } from '../storage.js';

const LABEL: Record<ThemePref, string> = {
  system: '跟随系统',
  light: '亮色',
  dark: '暗色',
};

function Icon({ pref }: { pref: ThemePref }) {
  if (pref === 'light') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4l1.6 1.6M17 17l1.6 1.6M18.6 5.4L17 7M7 17l-1.6 1.6" strokeLinecap="round" />
      </svg>
    );
  }
  if (pref === 'dark') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path d="M20 14.4A8.4 8.4 0 1 1 9.6 4a6.9 6.9 0 0 0 10.4 10.4Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="8.4" />
      <path d="M12 3.6a8.4 8.4 0 0 0 0 16.8Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ThemeToggle() {
  const { pref, resolved, cycle } = useTheme();
  const nextPref: ThemePref = pref === 'system' ? 'light' : pref === 'light' ? 'dark' : 'system';
  const current = pref === 'system' ? `跟随系统（当前${resolved === 'light' ? '亮色' : '暗色'}）` : LABEL[pref];

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={cycle}
      aria-label={`主题：${current}，点击切换为${LABEL[nextPref]}`}
      title={`主题：${current}`}
    >
      <Icon pref={pref} />
      <span className="theme-toggle-text">{LABEL[pref]}</span>
    </button>
  );
}
