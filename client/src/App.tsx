import { NavLink, Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home.js';
import { Game } from './pages/Game.js';
import { Codex } from './pages/Codex.js';
import { Rules } from './pages/Rules.js';
import { MultiLobby } from './pages/MultiLobby.js';
import { MultiRoom } from './pages/MultiRoom.js';
import { Login } from './pages/Login.js';
import { Profile } from './pages/Profile.js';
import { Leaderboard } from './pages/Leaderboard.js';
import { MetaProvider } from './MetaContext.js';
import { AuthProvider, useAuth } from './AuthContext.js';
import { ThemeProvider } from './ThemeContext.js';
import { ThemeToggle } from './components/ThemeToggle.js';
import { brandLogo } from './brandLogo.js';

function AccountLink() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? (
    <NavLink to="/me" className="nav-account">
      {user.username}
    </NavLink>
  ) : (
    <NavLink to="/login">登录</NavLink>
  );
}

export function App() {
  return (
    <MetaProvider>
      <AuthProvider>
        <ThemeProvider>
          <div className="app">
            <div className="bg-decor" aria-hidden="true">
              <span className="bg-orb bg-orb-1" />
              <span className="bg-orb bg-orb-2" />
              <span className="bg-orb bg-orb-3" />
            </div>
            <header className="topbar">
              <NavLink to="/" className="brand" aria-label="柚一把 首页">
                <img className="brand-mark" src={brandLogo} alt="" aria-hidden="true" width={42} height={42} />
                <span className="brand-text">
                  柚一把
                  <small>YozuGuess</small>
                </span>
              </NavLink>
              <nav className="nav" aria-label="主导航">
                <NavLink to="/" end>
                  开始
                </NavLink>
                <NavLink to="/multi">联机</NavLink>
                <NavLink to="/codex">图鉴</NavLink>
                <NavLink to="/rules">规则</NavLink>
                <NavLink to="/leaderboard">排行</NavLink>
                <AccountLink />
                <ThemeToggle />
              </nav>
            </header>
            <main className="main">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/game" element={<Game />} />
                <Route path="/multi" element={<MultiLobby />} />
                <Route path="/multi/:code" element={<MultiRoom />} />
                <Route path="/codex" element={<Codex />} />
                <Route path="/rules" element={<Rules />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Login />} />
                <Route path="/me" element={<Profile />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="*" element={<Home />} />
              </Routes>
            </main>
            <footer className="footer">
              <span>柚一把 · 猜柚子社全作品角色</span>
              <span>玩法参考 弗一把 (csgofriberg)</span>
            </footer>
          </div>
        </ThemeProvider>
      </AuthProvider>
    </MetaProvider>
  );
}
