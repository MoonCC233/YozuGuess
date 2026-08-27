import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import { GAME_TITLES } from '@yozu/shared';
import type { ReplaySummary, StatsDetail } from '../types';

export default function Stats() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<StatsDetail | null>(null);
  const [replays, setReplays] = useState<ReplaySummary[]>([]);

  useEffect(() => {
    api.statsDetail().then(setDetail).catch(() => {});
    api.listReplays().then(setReplays).catch(() => {});
  }, []);

  return (
    <div className="page stats-page">
      <h1>{t('nav.stats')}</h1>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-value">{detail?.totalGames ?? '—'}</div>
          <div className="stat-label">{t('stats.totalGames')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{detail?.winRate ?? '—'}%</div>
          <div className="stat-label">{t('stats.winRate')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{detail?.avgGuesses ?? '—'}</div>
          <div className="stat-label">{t('stats.avgGuesses')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{detail?.totalGuesses ?? '—'}</div>
          <div className="stat-label">{t('stats.totalGuesses')}</div>
        </div>
      </div>

      <div className="stats-section">
        <h2>{t('stats.byTitle')}</h2>
        {detail && detail.titleStats.length > 0 ? (
          <div className="title-stats">
            {detail.titleStats.map((s) => (
              <div key={s.title} className="title-stat-chip">
                <span className="title-stat-name">{GAME_TITLES[s.title as keyof typeof GAME_TITLES]?.short ?? s.title}</span>
                <span className="title-stat-count">{s.count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">{t('stats.noData')}</p>
        )}
      </div>

      <div className="stats-section">
        <h2>{t('stats.hotChars')}</h2>
        {detail && detail.characterStats.length > 0 ? (
          <table className="leaderboard-table">
            <thead>
              <tr><th>{t('rules.columns.title')}</th><th>{t('stats.charName')}</th><th>{t('stats.guessed')}</th><th>{t('stats.hit')}</th></tr>
            </thead>
            <tbody>
              {detail.characterStats.map((c) => (
                <tr key={c.id}>
                  <td>{GAME_TITLES[c.title as keyof typeof GAME_TITLES]?.short ?? c.title}</td>
                  <td>{c.name}</td>
                  <td>{c.guessed}</td>
                  <td>{c.won}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted">{t('stats.noData')}</p>
        )}
      </div>

      <div className="stats-section">
        <h2>{t('stats.replays')}</h2>
        {replays.length === 0 ? (
          <p className="muted">{t('stats.noReplays')}</p>
        ) : (
          <ul className="replay-list">
            {replays.map((r) => (
              <li key={r.id} className="replay-item" onClick={() => navigate(`/replay/${r.id}`)}>
                <span className={`replay-badge ${r.status}`}>{r.status === 'won' ? '✅' : '❌'}</span>
                <span className="replay-mode">{t(`stats.mode.${r.mode}`)}</span>
                <span className="replay-date">{r.date}</span>
                <span className="replay-count">{t('stats.guessCount', { n: r.guessCount })}</span>
                <span className="replay-arrow">›</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
