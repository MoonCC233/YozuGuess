import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, X, BookOpen } from 'lucide-react';
import { api } from '../api';
import { GAME_TITLES } from '@yozu/shared';
import type { Character, GameTitle } from '@yozu/shared';

const TITLES: GameTitle[] = [
  'braban', 'exe', 'natsora', 'tenran', 'noble', 'dracu', 'ailenote',
  'sannabitch', 'sengoku', 'riddle', 'stella', 'rebo', 'limelight',
];

export default function Codex() {
  const { t } = useTranslation();
  const [chars, setChars] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [titleFilter, setTitleFilter] = useState<GameTitle | 'all'>('all');
  const [selected, setSelected] = useState<Character | null>(null);

  useEffect(() => {
    api
      .listCodex()
      .then(setChars)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return chars.filter((c) => {
      if (titleFilter !== 'all' && c.title !== titleFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.nameJp.toLowerCase().includes(q)
      );
    });
  }, [chars, query, titleFilter]);

  const counts = useMemo(() => {
    const m: Record<string, number> = { all: chars.length };
    for (const tt of TITLES) m[tt] = chars.filter((c) => c.title === tt).length;
    return m;
  }, [chars]);

  return (
    <div className="page codex-page">
      <h1>{t('codex.title')}</h1>
      <p className="codex-desc">{t('codex.desc')}</p>

      <div className="codex-toolbar">
        <div className="codex-search">
          <Search size={16} />
          <input
            type="text"
            placeholder={t('codex.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button className="codex-search-clear" onClick={() => setQuery('')} aria-label="clear">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="codex-filters">
          <button
            className={`codex-filter ${titleFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTitleFilter('all')}
          >
            {t('codex.all')} <span className="codex-filter-count">{counts.all}</span>
          </button>
          {TITLES.map((tt) => (
            <button
              key={tt}
              className={`codex-filter ${titleFilter === tt ? 'active' : ''}`}
              onClick={() => setTitleFilter(tt)}
            >
              {GAME_TITLES[tt].short} <span className="codex-filter-count">{counts[tt]}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="muted">{t('common.loading')}</p>
      ) : filtered.length === 0 ? (
        <p className="muted">{t('codex.empty')}</p>
      ) : (
        <div className="codex-grid">
          {filtered.map((c) => (
            <button key={c.id} className="codex-card" onClick={() => setSelected(c)}>
              <div className="codex-card-title">
                <span className={`codex-badge title-${c.title}`}>{GAME_TITLES[c.title].short}</span>
                {c.isMain && <span className="codex-main-dot" title={t('codex.main')}>★</span>}
              </div>
              <div className="codex-card-name">{c.name}</div>
              <div className="codex-card-name-jp">{c.nameJp}</div>
              <div className="codex-card-meta">
                <span>位次 {c.rank}</span>
                <span>·</span>
                <span>爆闪 {c.bakusen}</span>
              </div>
              <div className="codex-card-attrs">
                <span>{c.hair}发</span>
                <span>{c.eyes}瞳</span>
                <span>{GAME_TITLES[c.title].year}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="codex-modal-backdrop" onClick={() => setSelected(null)}>
          <div className="codex-modal" onClick={(e) => e.stopPropagation()}>
            <button className="codex-modal-close" onClick={() => setSelected(null)} aria-label="close">
              <X size={18} />
            </button>
            <div className="codex-modal-head">
              <span className={`codex-badge title-${selected.title}`}>
                {GAME_TITLES[selected.title].zh}
              </span>
              {selected.isMain && <span className="codex-main-dot">★</span>}
            </div>
            <h2 className="codex-modal-name">{selected.name}</h2>
            <div className="codex-modal-name-jp">{selected.nameJp}</div>
            <table className="codex-detail-table">
              <tbody>
                <tr><th>{t('rules.columns.rank')}</th><td>{selected.rank}</td></tr>
                <tr><th>{t('rules.columns.bakusen')}</th><td>{selected.bakusen}</td></tr>
                <tr><th>{t('rules.columns.hair')}</th><td>{selected.hair}</td></tr>
                <tr><th>{t('rules.columns.eyes')}</th><td>{selected.eyes}</td></tr>
                <tr><th>{t('rules.columns.titleYear')}</th><td>{GAME_TITLES[selected.title].year}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
