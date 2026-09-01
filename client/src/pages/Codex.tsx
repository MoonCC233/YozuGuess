import { useEffect, useMemo, useState } from 'react';
import { fetchCodex, type CodexCharacter, type TitleMeta } from '../api.js';
import type { GameTitle } from '@yozu/shared';
import { Portrait } from '../components/Portrait.js';
import { loadCodexView, saveCodexView, type CodexView } from '../storage.js';

/** 卡片视图里前若干张不走懒加载，避免首屏出现空格位 */
const EAGER_COUNT = 12;

export function Codex() {
  const [characters, setCharacters] = useState<CodexCharacter[]>([]);
  const [titles, setTitles] = useState<Record<GameTitle, TitleMeta> | null>(null);
  const [keyword, setKeyword] = useState('');
  const [title, setTitle] = useState<string>('all');
  const [view, setView] = useState<CodexView>(() => loadCodexView());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCodex()
      .then((r) => {
        setCharacters(r.characters);
        setTitles(r.titles);
      })
      .catch(() => setError('图鉴加载失败'));
  }, []);

  function switchView(next: CodexView) {
    setView(next);
    saveCodexView(next);
  }

  const rows = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return characters.filter((c) => {
      if (title !== 'all' && c.title !== title) return false;
      if (q === '') return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.nameJp.toLowerCase().includes(q) ||
        c.cv.toLowerCase().includes(q)
      );
    });
  }, [characters, keyword, title]);

  return (
    <section className="page">
      <h1 className="title-sm">角色图鉴</h1>
      <p className="muted">共 {characters.length} 位角色，可按作品筛选或搜索名字与声优。</p>
      {error ? <p className="alert">{error}</p> : null}

      <div className="filters">
        <label>
          <span className="sr-only">搜索</span>
          <input
            type="search"
            className="guess-input"
            placeholder="搜索角色名或声优"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </label>
        <label>
          <span className="sr-only">按作品筛选</span>
          <select className="select" value={title} onChange={(e) => setTitle(e.target.value)}>
            <option value="all">全部作品</option>
            {titles
              ? Object.entries(titles).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.zh}（{meta.year}）
                  </option>
                ))
              : null}
          </select>
        </label>
        <div className="view-switch" role="tablist" aria-label="图鉴视图">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'card'}
            className={`view-tab ${view === 'card' ? 'selected' : ''}`}
            onClick={() => switchView('card')}
          >
            卡片
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'table'}
            className={`view-tab ${view === 'table' ? 'selected' : ''}`}
            onClick={() => switchView('table')}
          >
            表格
          </button>
        </div>
      </div>

      <p className="muted codex-count" aria-live="polite">
        当前显示 {rows.length} 位
      </p>

      {rows.length === 0 ? (
        <p className="muted">没有匹配的角色</p>
      ) : view === 'card' ? (
        <ul className="codex-grid">
          {rows.map((c, i) => (
            <li key={c.id} className="codex-card">
              <Portrait characterId={c.id} name={c.name} variant="card" eager={i < EAGER_COUNT} />
              <div className="codex-card-body">
                <h2 className="codex-name">
                  {c.name}
                  {c.nameJp !== c.name ? <small className="name-jp">{c.nameJp}</small> : null}
                </h2>
                <span className="codex-title">{titles?.[c.title]?.zh ?? c.title}</span>
                <ul className="codex-tags">
                  <li className="badge">{c.rank}</li>
                  <li className="badge">发色{c.hair}</li>
                  <li className="badge">瞳色{c.eyes}</li>
                  <li className="badge">爆闪 {c.bakusen}</li>
                </ul>
                <p className="codex-cv">
                  CV {c.cv}
                  {c.cvAliases.length > 0 ? <small className="aliases">同一位声优：{c.cvAliases.join('、')}</small> : null}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="board-wrap">
          <table className="board codex">
            <thead>
              <tr>
                <th scope="col">立绘</th>
                <th scope="col">角色</th>
                <th scope="col">作品</th>
                <th scope="col">位次</th>
                <th scope="col">发色</th>
                <th scope="col">瞳色</th>
                <th scope="col">爆闪</th>
                <th scope="col">声优</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c, i) => (
                <tr key={c.id}>
                  <td className="codex-thumb-cell">
                    <Portrait characterId={c.id} name={c.name} variant="thumb" eager={i < EAGER_COUNT} />
                  </td>
                  <th scope="row" className="row-name">
                    {c.name}
                    {c.nameJp !== c.name ? <small className="name-jp">{c.nameJp}</small> : null}
                  </th>
                  <td>{titles?.[c.title]?.zh ?? c.title}</td>
                  <td>{c.rank}</td>
                  <td>{c.hair}</td>
                  <td>{c.eyes}</td>
                  <td>{c.bakusen}</td>
                  <td>
                    {c.cv}
                    {c.cvAliases.length > 0 ? <small className="aliases">同一位声优：{c.cvAliases.join('、')}</small> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
