import { NavLink, Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home.js';
import { Game } from './pages/Game.js';
import { Codex } from './pages/Codex.js';
import { Rules } from './pages/Rules.js';
import { MultiLobby } from './pages/MultiLobby.js';
import { MultiRoom } from './pages/MultiRoom.js';
import { MetaProvider } from './MetaContext.js';

export function App() {
  return (
    <MetaProvider>
      <div className="app">
        <header className="topbar">
          <NavLink to="/" className="brand" aria-label="柚一把 首页">
            <span className="brand-mark" aria-hidden="true">
              柚
            </span>
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
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <footer className="footer">
          <span>柚一把 · 猜柚子社全作品角色</span>
          <span>玩法参考 弗一把 (csgofriberg)</span>
        </footer>
      </div>
    </MetaProvider>
  );
}
