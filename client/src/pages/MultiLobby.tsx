import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BO_TYPES, DIFFICULTIES, DIFFICULTY_META, type BoType } from '@yozu/shared';
import type { Difficulty } from '../api.js';
import { useMeta } from '../MetaContext.js';
import { useAuth } from '../AuthContext.js';
import { errorMessage } from '../errors.js';
import { RoomError, createRoom, joinRoom, rejoinRoom } from '../socket.js';
import { clearRoom, loadRoom, saveRoom } from '../storage.js';
import { Toast } from '../components/Toast.js';

const BO_HINT: Record<BoType, string> = {
  1: '一局定胜负',
  3: '先拿 2 小局',
  5: '先拿 3 小局',
  7: '先拿 4 小局',
};

export function MultiLobby() {
  const navigate = useNavigate();
  const { meta } = useMeta();
  const { user, loading: authLoading } = useAuth();
  const [code, setCode] = useState('');
  const [boType, setBoType] = useState<BoType>(3);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [spectator, setSpectator] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [saved, setSaved] = useState(loadRoom());

  function failWith(err: unknown) {
    if (err instanceof RoomError) setToast(errorMessage(err.code));
    else if (err instanceof Error && err.message === 'SOCKET_TIMEOUT') setToast(errorMessage('SOCKET_TIMEOUT'));
    else setToast('连接失败，请检查网络');
  }

  async function onCreate() {
    if (!user) return;
    setBusy(true);
    try {
      const handshake = await createRoom({ boType, difficulty });
      saveRoom({ code: handshake.code, key: handshake.key, name: user.username });
      navigate(`/multi/${handshake.code}`);
    } catch (err) {
      failWith(err);
    } finally {
      setBusy(false);
    }
  }

  async function onJoin() {
    if (!user) return;
    const roomCode = code.trim().toUpperCase();
    if (roomCode.length !== 5) {
      setToast('房间号是 5 位字符');
      return;
    }
    setBusy(true);
    try {
      const handshake = await joinRoom({ code: roomCode, spectator });
      saveRoom({ code: handshake.code, key: handshake.key, name: user.username });
      navigate(`/multi/${handshake.code}`);
    } catch (err) {
      failWith(err);
    } finally {
      setBusy(false);
    }
  }

  async function onResume() {
    if (!saved) return;
    setBusy(true);
    try {
      await rejoinRoom({ code: saved.code, key: saved.key });
      navigate(`/multi/${saved.code}`);
    } catch (err) {
      clearRoom();
      setSaved(null);
      failWith(err);
    } finally {
      setBusy(false);
    }
  }

  if (authLoading) {
    return (
      <section className="page lobby">
        <h1 className="title">联机对战</h1>
        <p className="muted">正在确认登录状态…</p>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="page lobby">
        <h1 className="title">联机对战</h1>
        <p className="subtitle">和朋友同时猜同一个角色，谁先猜中谁拿下这一小局</p>
        <div className="card">
          <h2>需要登录</h2>
          <p className="muted">
            联机对战里显示的名字直接取自账号用户名，所以要先登录才能建房或加入。单人模式无需登录。
          </p>
          <div className="actions">
            <Link className="btn btn-primary btn-lg" to="/login">
              去登录
            </Link>
            <Link className="btn btn-ghost" to="/register">
              注册新账号
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page lobby">
      <h1 className="title">联机对战</h1>
      <p className="subtitle">和朋友同时猜同一个角色，谁先猜中谁拿下这一小局</p>

      <div className="card">
        <h2>你的名字</h2>
        <p className="muted">
          房间里显示为 <strong>{user.username}</strong>，想换个名字请到{' '}
          <Link to="/me">账号中心</Link> 修改。
        </p>
      </div>

      {saved ? (
        <div className="card card-resume">
          <h2>回到房间 {saved.code}</h2>
          <p className="muted">检测到你之前在这个房间里，可以直接重连。</p>
          <div className="actions">
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void onResume()}>
              重新连接
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                clearRoom();
                setSaved(null);
              }}
            >
              忘掉它
            </button>
          </div>
        </div>
      ) : null}

      <div className="card">
        <h2>创建房间</h2>
        <h3 className="field-label">赛制</h3>
        <div className="choice-group choice-row" role="radiogroup" aria-label="赛制">
          {BO_TYPES.map((bo) => (
            <button
              key={bo}
              type="button"
              role="radio"
              aria-checked={boType === bo}
              className={`choice choice-sm ${boType === bo ? 'selected' : ''}`}
              onClick={() => setBoType(bo)}
            >
              <strong>BO{bo}</strong>
              <span>{BO_HINT[bo]}</span>
            </button>
          ))}
        </div>

        <h3 className="field-label">难度</h3>
        <div className="choice-group choice-quad" role="radiogroup" aria-label="难度">
          {DIFFICULTIES.map((id) => {
            const info = meta?.difficulties.find((d) => d.id === id) ?? DIFFICULTY_META[id];
            const size = meta?.poolSizes[id];
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={difficulty === id}
                aria-label={`${info.tier} ${info.label}`}
                className={`choice choice-sm ${difficulty === id ? 'selected' : ''}`}
                onClick={() => setDifficulty(id)}
              >
                <small className="choice-tier">{info.tier}</small>
                <strong className="choice-label">{info.label}</strong>
                <span>
                  {info.desc}
                  {size ? `（${size} 位）` : ''}
                </span>
              </button>
            );
          })}
        </div>

        <div className="actions">
          <button type="button" className="btn btn-primary btn-lg" disabled={busy} onClick={() => void onCreate()}>
            建房并等人
          </button>
        </div>
      </div>

      <div className="card">
        <h2>加入房间</h2>
        <div className="join-row">
          <input
            className="text-input code-input"
            type="text"
            maxLength={5}
            placeholder="房间号"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            aria-label="房间号"
          />
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void onJoin()}>
            加入
          </button>
        </div>
        <label className="checkbox">
          <input type="checkbox" checked={spectator} onChange={(e) => setSpectator(e.target.checked)} />
          以旁观身份加入（能看到所有人的完整战况，但不参与作答）
        </label>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}
