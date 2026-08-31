import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { difficultyLabel } from '@yozu/shared';
import {
  ApiError,
  changeAccountPassword,
  fetchHistory,
  fetchStats,
  type AccountStats,
  type MatchHistoryItem,
  type SoloHistoryItem,
  type SoloStats,
} from '../api.js';
import { useAuth } from '../AuthContext.js';
import { errorMessage } from '../errors.js';
import { Toast } from '../components/Toast.js';

const SOLO_STATUS: Record<SoloHistoryItem['status'], string> = {
  won: '猜中',
  lost: '失败',
  revealed: '放弃',
};

const MATCH_RESULT: Record<MatchHistoryItem['result'], string> = {
  won: '胜',
  lost: '负',
  draw: '平',
};

function percent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

function formatDate(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function StatBlock({ title, stats }: { title: string; stats: SoloStats }) {
  const peak = Math.max(1, ...stats.distribution);
  return (
    <div className="card">
      <h2>{title}</h2>
      <dl className="stat-grid">
        <div className="stat">
          <dt>已玩</dt>
          <dd>{stats.played}</dd>
        </div>
        <div className="stat">
          <dt>猜中</dt>
          <dd>{stats.won}</dd>
        </div>
        <div className="stat">
          <dt>胜率</dt>
          <dd>{percent(stats.winRate)}</dd>
        </div>
        <div className="stat">
          <dt>平均次数</dt>
          <dd>{stats.avgGuesses ?? '—'}</dd>
        </div>
        <div className="stat">
          <dt>最快猜中</dt>
          <dd>{stats.bestGuesses ?? '—'}</dd>
        </div>
        <div className="stat">
          <dt>当前连胜</dt>
          <dd>{stats.currentStreak}</dd>
        </div>
        <div className="stat">
          <dt>最长连胜</dt>
          <dd>{stats.bestStreak}</dd>
        </div>
      </dl>

      <h3 className="field-label">猜中次数分布</h3>
      {stats.won === 0 ? (
        <p className="muted">还没有猜中记录。</p>
      ) : (
        <ul className="dist">
          {stats.distribution.map((count, idx) => (
            <li key={idx}>
              <span className="dist-label">{idx + 1}</span>
              <span className="dist-track">
                <span className="dist-bar" style={{ width: `${(count / peak) * 100}%` }} />
              </span>
              <span className="dist-count">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Profile() {
  const navigate = useNavigate();
  const { user, loading, signOut, rename } = useAuth();
  const [stats, setStats] = useState<AccountStats | null>(null);
  const [games, setGames] = useState<SoloHistoryItem[]>([]);
  const [matches, setMatches] = useState<MatchHistoryItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [busy, setBusy] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [renaming, setRenaming] = useState(false);

  const load = useCallback(() => {
    void Promise.all([fetchStats(), fetchHistory(20)])
      .then(([s, h]) => {
        setStats(s.stats);
        setGames(h.games);
        setMatches(h.matches);
      })
      .catch((err: unknown) => {
        setToast(err instanceof ApiError ? errorMessage(err.code) : '加载失败，请稍后再试');
      });
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    load();
  }, [loading, user, navigate, load]);

  useEffect(() => {
    if (user) setNameDraft(user.username);
  }, [user]);

  async function onRename(event: FormEvent) {
    event.preventDefault();
    const trimmed = nameDraft.trim();
    if (trimmed === '' || trimmed === user?.username) {
      setToast('请输入一个新的用户名');
      return;
    }
    setRenaming(true);
    try {
      await rename(trimmed);
      setToast('用户名已更新，联机房间里也会用新名字');
    } catch (err) {
      setToast(err instanceof ApiError ? errorMessage(err.code) : '请求失败，请检查网络');
    } finally {
      setRenaming(false);
    }
  }

  async function onChangePassword(event: FormEvent) {
    event.preventDefault();
    if (next.length < 8) {
      setToast('新密码至少 8 位');
      return;
    }
    setBusy(true);
    try {
      await changeAccountPassword(current, next);
      setCurrent('');
      setNext('');
      setToast('密码已更新，其他设备需要重新登录');
    } catch (err) {
      setToast(err instanceof ApiError ? errorMessage(err.code) : '请求失败，请检查网络');
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) {
    return (
      <section className="page">
        <p className="loading">加载中…</p>
      </section>
    );
  }

  return (
    <section className="page profile">
      <h1 className="title">{user.username}</h1>
      <p className="subtitle">
        注册于 {formatDate(user.createdAt)} · <Link to="/leaderboard">看看排行榜</Link>
      </p>

      <div className="actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            void signOut().then(() => navigate('/'));
          }}
        >
          退出登录
        </button>
      </div>

      {stats ? (
        <>
          <StatBlock title="单人总览" stats={stats.solo} />
          <StatBlock title="每日一柚" stats={stats.daily} />
          <div className="card">
            <h2>联机对战</h2>
            <dl className="stat-grid">
              <div className="stat">
                <dt>场次</dt>
                <dd>{stats.match.played}</dd>
              </div>
              <div className="stat">
                <dt>胜</dt>
                <dd>{stats.match.won}</dd>
              </div>
              <div className="stat">
                <dt>负</dt>
                <dd>{stats.match.lost}</dd>
              </div>
              <div className="stat">
                <dt>平</dt>
                <dd>{stats.match.draw}</dd>
              </div>
              <div className="stat">
                <dt>胜率</dt>
                <dd>{percent(stats.match.winRate)}</dd>
              </div>
            </dl>
          </div>
        </>
      ) : (
        <p className="loading">统计加载中…</p>
      )}

      <div className="card">
        <h2>最近单人对局</h2>
        {games.length === 0 ? (
          <p className="muted">还没有记录，去玩一局吧。</p>
        ) : (
          <ul className="history">
            {games.map((g) => (
              <li key={g.id}>
                <span className={`tag tag-${g.status}`}>{SOLO_STATUS[g.status]}</span>
                <span className="history-main">
                  {g.answerName}
                  <small>
                    {g.mode === 'daily' ? '每日一柚' : `自由练习 · ${difficultyLabel(g.difficulty)}`} ·{' '}
                    {g.guessCount} 次
                  </small>
                </span>
                <span className="history-time">{formatDate(g.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h2>最近联机对战</h2>
        {matches.length === 0 ? (
          <p className="muted">还没有对战记录。</p>
        ) : (
          <ul className="history">
            {matches.map((m) => (
              <li key={m.id}>
                <span className={`tag tag-${m.result}`}>{MATCH_RESULT[m.result]}</span>
                <span className="history-main">
                  {m.ownScore} : {m.rivalScore}
                  <small>
                    BO{m.boType} · {difficultyLabel(m.difficulty)} ·{' '}
                    {m.opponents.length > 0 ? `对手 ${m.opponents.join('、')}` : '无对手'}
                    {m.reason === 'forfeit' ? ' · 对手弃权' : ''}
                  </small>
                </span>
                <span className="history-time">{formatDate(m.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h2>修改用户名</h2>
        <p className="muted">用户名同时是登录名，也是联机房间里显示的名字，改完请用新名字登录。</p>
        <form className="form" onSubmit={(e) => void onRename(e)}>
          <label className="field">
            <span className="field-label">用户名</span>
            <input
              className="text-input"
              type="text"
              maxLength={16}
              autoComplete="username"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
            />
          </label>
          <div className="actions">
            <button type="submit" className="btn btn-primary" disabled={renaming}>
              保存用户名
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2>修改密码</h2>
        <form className="form" onSubmit={(e) => void onChangePassword(e)}>
          <label className="field">
            <span className="field-label">当前密码</span>
            <input
              className="text-input"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">新密码</span>
            <input
              className="text-input"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </label>
          <div className="actions">
            <button type="submit" className="btn btn-primary" disabled={busy}>
              更新密码
            </button>
          </div>
        </form>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}
