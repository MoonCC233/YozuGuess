import { useEffect, useState } from 'react';
import { Routes, Route, NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Home as HomeIcon, Gamepad2, CalendarDays, Users, BarChart3, Trophy, BookOpen, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { useAppStore } from './store';
import { useAuth } from './store/auth';
import { api, errMsg } from './api/client';
import { toast } from './components/Toast';
import Home from './pages/Home';
import SingleGame from './pages/SingleGame';
import Daily from './pages/Daily';
import MultiLobby from './pages/MultiLobby';
import MultiRoom from './pages/MultiRoom';
import Stats from './pages/Stats';
import Leaderboard from './pages/Leaderboard';
import Rules from './pages/Rules';
import Replay from './pages/Replay';
import Codex from './pages/Codex';
import Login from './pages/Login';

const navItems = [
  { to: '/', icon: HomeIcon, key: 'home' as const, end: true },
  { to: '/single', icon: Gamepad2, key: 'single' as const },
  { to: '/daily', icon: CalendarDays, key: 'daily' as const },
  { to: '/multi', icon: Users, key: 'multi' as const },
  { to: '/codex', icon: BookOpen, key: 'codex' as const },
  { to: '/stats', icon: BarChart3, key: 'stats' as const },
  { to: '/leaderboard', icon: Trophy, key: 'leaderboard' as const },
  { to: '/rules', icon: BookOpen, key: 'rules' as const },
];

export default function App() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme, lang, setLang } = useAppStore();
  const { user, initialized, setUser } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang, i18n]);

  const logout = async () => {
    setLoggingOut(true);
    try {
      await api.post('/auth/logout');
      setUser(null);
      navigate('/');
    } catch (error) {
      toast.error(errMsg(error));
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-logo">🍊</span>
          <div>
            <div className="brand-title">{t('app.title')}</div>
            <div className="brand-sub">{t('app.subtitle')}</div>
          </div>
        </div>
        <nav className="topnav">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
              <item.icon size={16} />
              <span>{t(`nav.${item.key}`)}</span>
            </NavLink>
          ))}
        </nav>
        <div className="topbar-actions">
          <select className="lang-select" value={lang} onChange={(e) => setLang(e.target.value as any)}>
            <option value="zh">中文</option>
            <option value="en">EN</option>
            <option value="ja">日本語</option>
          </select>
          <button className="icon-btn" onClick={toggleTheme} aria-label="theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {initialized && (user ? (
            <div className="auth-controls">
              <span className="auth-user" title={user.username}><UserIcon size={14} /> {user.displayId}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => void logout()} disabled={loggingOut} aria-label={t('auth.logout')}>
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <Link className="btn btn-sm" to="/login" aria-label={t('auth.loginRegister')}>
              <LogIn size={15} />
              <span className="btn-text">{t('auth.loginRegister')}</span>
            </Link>
          ))}
        </div>
      </header>
      <main className="content" key={location.pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/single" element={<SingleGame />} />
          <Route path="/daily" element={<Daily />} />
          <Route path="/multi" element={<MultiLobby />} />
          <Route path="/multi/:code" element={<MultiRoom />} />
          <Route path="/codex" element={<Codex />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/replay/:id" element={<Replay />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/rules" element={<Rules />} />
        </Routes>
      </main>
      <footer className="footer">
        柚一把 · 致敬 csgofriberg · 数据仅供娱乐
      </footer>
      <ToastHost />
    </div>
  );
}

import { ToastHost } from './components/Toast';
