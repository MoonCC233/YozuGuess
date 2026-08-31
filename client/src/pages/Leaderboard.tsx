import { useEffect, useState } from 'react';
import { ApiError, fetchLeaderboard, type LeaderboardEntry } from '../api.js';
import { errorMessage } from '../errors.js';
import { Toast } from '../components/Toast.js';

export function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchLeaderboard(20)
      .then((res) => {
        if (alive) setEntries(res.entries);
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setEntries([]);
        setToast(err instanceof ApiError ? errorMessage(err.code) : '加载失败，请稍后再试');
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <section className="page leaderboard">
      <h1 className="title">排行榜</h1>
      <p className="subtitle">按单人猜中局数排序，平均猜测次数越少越靠前</p>

      <div className="card">
        {entries === null ? (
          <p className="loading">加载中…</p>
        ) : entries.length === 0 ? (
          <p className="muted">还没有人上榜，第一个就是你。</p>
        ) : (
          <ol className="rank">
            {entries.map((entry, idx) => (
              <li key={entry.username}>
                <span className="rank-no">{idx + 1}</span>
                <span className="rank-name">{entry.username}</span>
                <span className="rank-meta">
                  猜中 {entry.won} / {entry.played} 局 · 平均 {entry.avgGuesses ?? '—'} 次
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}
