import { useEffect, useMemo, useState } from 'react';
import { fetchCodex, type CodexCharacter, type TitleMeta } from '../api.js';
import type { GameTitle } from '@yozu/shared';

export function Codex() {
  const [characters, setCharacters] = useState<CodexCharacter[]>([]);
  const [titles, setTitles] = useState<Record<GameTitle, TitleMeta> | null>(null);
  const [keyword, setKeyword] = useState('');
  const [title, setTitle] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCodex()
      .then((r) => {
        setCharacters(r.characters);
        setTitles(r.titles);
      })
      .catch(() => setError('图鉴加载失败'));
  }, []);

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
      </div>

      <div className="board-wrap">
        <table className="board codex">
          <thead>
            <tr>
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
            {rows.map((c) => (
              <tr key={c.id}>
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
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted">
                  没有匹配的角色
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
