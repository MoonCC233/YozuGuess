import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { difficultyLabel, type PublicPlayer, type PublicRoom } from '@yozu/shared';
import { fetchCharacters, type CharacterListItem } from '../api.js';
import { errorMessage } from '../errors.js';
import {
  RoomError,
  getSocket,
  guess as sendGuess,
  leaveRoom as sendLeave,
  rejoinRoom,
  resetMatch,
  startRound,
} from '../socket.js';
import { clearRoom, loadRoom } from '../storage.js';
import { GuessBoard } from '../components/GuessBoard.js';
import { GuessInputBar } from '../components/GuessInputBar.js';
import { Toast } from '../components/Toast.js';

function formatSeconds(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function useCountdown(target: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (target === null) return;
    // 目标变化时立刻刷新，避免沿用挂载时抓到的过期时间戳
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [target]);
  return target === null ? 0 : Math.max(0, target - now);
}

export function MultiRoom() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState<PublicRoom | null>(null);
  const [characters, setCharacters] = useState<CharacterListItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [fatal, setFatal] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const revision = useRef(0);
  const [lastRound, setLastRound] = useState<PublicRoom['roundResult']>(null);

  const applyRoom = useCallback((next: PublicRoom) => {
    // 丢弃乱序到达的旧快照
    if (next.revision < revision.current) return;
    revision.current = next.revision;
    // 结算信息只在间歇期下发，缓存下来让玩家在下一小局里也能回看
    if (next.roundResult) setLastRound(next.roundResult);
    if (next.status === 'waiting' && next.round === 0) setLastRound(null);
    setRoom(next);
  }, []);

  useEffect(() => {
    fetchCharacters()
      .then((r) => setCharacters(r.characters))
      .catch(() => setToast('角色列表加载失败'));
  }, []);

  // 建立连接、订阅状态推送，并在（重）连接时用本地 key 认领座位
  useEffect(() => {
    const saved = loadRoom();
    if (!saved || saved.code !== code.toUpperCase()) {
      setFatal('没有找到这个房间的身份信息，请从大厅重新加入。');
      return;
    }

    const socket = getSocket();

    async function claim() {
      try {
        const handshake = await rejoinRoom({ code: saved!.code, key: saved!.key });
        revision.current = 0;
        applyRoom(handshake.room);
        setFatal(null);
      } catch (err) {
        if (err instanceof RoomError) {
          clearRoom();
          setFatal(errorMessage(err.code));
        } else {
          setToast('重连失败，正在重试…');
        }
      }
    }

    function onConnect() {
      setConnected(true);
      void claim();
    }
    function onDisconnect() {
      setConnected(false);
    }

    socket.on('room:state', applyRoom);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected) onConnect();

    return () => {
      socket.off('room:state', applyRoom);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [applyRoom, code]);

  const me = useMemo(
    () => room?.players.find((p) => p.key === room.viewerKey) ?? null,
    [room]
  );
  const opponents = useMemo(
    () => (room ? room.players.filter((p) => p.key !== room.viewerKey && !p.spectator) : []),
    [room]
  );
  const roundLeft = useCountdown(room?.status === 'playing' ? room.roundEndsAt : null);
  const nextLeft = useCountdown(room?.status === 'roundEnd' ? room.nextRoundAt : null);

  function failWith(err: unknown) {
    if (err instanceof RoomError) setToast(errorMessage(err.code));
    else if (err instanceof Error && err.message === 'SOCKET_TIMEOUT') setToast(errorMessage('SOCKET_TIMEOUT'));
    else setToast('操作失败，请重试');
  }

  async function run(action: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } catch (err) {
      failWith(err);
    } finally {
      setBusy(false);
    }
  }

  async function onLeave() {
    try {
      await sendLeave();
    } catch {
      // 离开失败也照常返回大厅
    }
    clearRoom();
    navigate('/multi');
  }

  if (fatal) {
    return (
      <section className="page">
        <p className="alert">{fatal}</p>
        <button type="button" className="btn btn-primary" onClick={() => navigate('/multi')}>
          回到联机大厅
        </button>
      </section>
    );
  }

  if (!room) {
    return (
      <section className="page">
        <p className="muted">正在连接房间 {code.toUpperCase()}…</p>
      </section>
    );
  }

  const isSpectator = me?.spectator ?? false;
  const canGuess = room.status === 'playing' && !isSpectator && me !== null && !me.done;
  const myGuesses = me?.guesses ?? [];
  const guessedIds = myGuesses
    .map((g) => ('hidden' in g ? null : g.characterId))
    .filter((id): id is number => id !== null);

  return (
    <section className="page room">
      <header className="room-head">
        <div>
          <h1 className="title-sm">
            房间 <span className="room-code">{room.code}</span>
          </h1>
          <p className="muted">
            BO{room.boType} · {difficultyLabel(room.difficulty)} · 先拿 {room.winsNeeded} 小局
            {room.round > 0 ? ` · 第 ${room.round} 小局` : ''}
            {isSpectator ? ' · 你是旁观者' : ''}
          </p>
        </div>
        <div className="room-status" aria-live="polite">
          {!connected ? <span className="badge badge-warn">连接已断开，正在重连…</span> : null}
          {room.status === 'playing' ? <span className="counter">剩余 {formatSeconds(roundLeft)}</span> : null}
          {room.status === 'roundEnd' && room.nextRoundAt ? (
            <span className="counter">{formatSeconds(nextLeft)} 后开始下一小局</span>
          ) : null}
          {room.status === 'waiting' ? <span className="badge">等待房主开始</span> : null}
          {room.status === 'finished' ? <span className="badge badge-done">整场结束</span> : null}
        </div>
      </header>

      <ol className="scoreboard">
        {room.players
          .filter((p) => !p.spectator)
          .map((p) => (
            <li key={p.key} className={`score-item${p.key === room.viewerKey ? ' is-me' : ''}`}>
              <span className="score-name">
                {p.name}
                {p.isHost ? <span className="tag">房主</span> : null}
                {!p.connected ? <span className="tag tag-warn">离线</span> : null}
              </span>
              <span className="score-value">{p.score}</span>
              <span className="score-sub">
                {p.solved ? '已猜中' : p.done ? '已用完' : `${p.guessCount}/${room.maxGuesses}`}
              </span>
            </li>
          ))}
      </ol>

      {room.spectators.length > 0 ? (
        <p className="muted spectator-line">旁观：{room.spectators.map((s) => s.name).join('、')}</p>
      ) : null}

      {room.status === 'waiting' || room.status === 'finished' ? (
        <div className="actions">
          {me?.isHost ? (
            <button
              type="button"
              className="btn btn-primary btn-lg"
              disabled={busy}
              onClick={() => void run(startRound)}
            >
              {room.status === 'finished' ? '再开一场' : '开始对战'}
            </button>
          ) : (
            <span className="muted">等待房主开始…</span>
          )}
          {me?.isHost && room.status !== 'waiting' ? (
            <button type="button" className="btn" disabled={busy} onClick={() => void run(resetMatch)}>
              重置比分
            </button>
          ) : null}
          <button type="button" className="btn btn-ghost" onClick={() => void onLeave()}>
            离开房间
          </button>
        </div>
      ) : null}

      {room.status === 'playing' && !isSpectator ? (
        <GuessInputBar
          characters={characters}
          guessedIds={guessedIds}
          disabled={!canGuess || busy}
          onGuess={(id) => void run(() => sendGuess(id))}
        />
      ) : null}

      {room.matchResult ? (
        <div
          className={`result ${room.matchResult.winnerKey === room.viewerKey ? 'result-win' : 'result-lose'}`}
          role="status"
        >
          <h2>
            {room.matchResult.winnerKey === null
              ? '整场打平'
              : room.matchResult.winnerKey === room.viewerKey
                ? '你赢下了这一场！'
                : `${room.players.find((p) => p.key === room.matchResult!.winnerKey)?.name ?? '对手'} 赢下了这一场`}
          </h2>
          <p className="muted">{room.matchResult.reason === 'forfeit' ? '对手离开了房间' : '按小局比分判定'}</p>
        </div>
      ) : null}

      {lastRound ? (
        <div className={`round-result${room.roundResult ? '' : ' round-result-past'}`} role="status">
          <h3>
            第 {lastRound.round} 小局
            {lastRound.winnerKey === null
              ? '打平'
              : lastRound.winnerKey === room.viewerKey
                ? '你拿下'
                : `由 ${room.players.find((p) => p.key === lastRound.winnerKey)?.name ?? '对手'} 拿下`}
          </h3>
          {lastRound.answer ? (
            <p>
              答案是 <strong>{lastRound.answer.name}</strong>（{lastRound.answer.nameJp}）
            </p>
          ) : null}
          <p className="muted">
            {lastRound.reason === 'solved'
              ? '有人猜中了'
              : lastRound.reason === 'timeout'
                ? '时间到，按接近程度判定'
                : lastRound.reason === 'exhausted'
                  ? '机会全部用完，按接近程度判定'
                  : '对手中途离开'}
          </p>
        </div>
      ) : null}

      {!isSpectator && me ? (
        <div className="board-block">
          <h3 className="board-title">你的猜测</h3>
          <GuessBoard guesses={me.guesses} maxGuesses={room.maxGuesses} />
        </div>
      ) : null}

      {(isSpectator ? room.players.filter((p) => !p.spectator) : opponents).map((p: PublicPlayer) => (
        <div className="board-block" key={p.key}>
          <h3 className="board-title">
            {p.name} 的猜测
            {p.guesses.length > 0 && 'hidden' in p.guesses[0]! ? <span className="tag">仅显示对比结果</span> : null}
          </h3>
          <GuessBoard guesses={p.guesses} maxGuesses={room.maxGuesses} compact />
        </div>
      ))}

      <ul className="legend">
        <li>
          <span className="swatch swatch-correct" aria-hidden="true" />
          完全一致
        </li>
        <li>
          <span className="swatch swatch-close" aria-hidden="true" />
          接近
        </li>
        <li>
          <span className="swatch swatch-wrong" aria-hidden="true" />
          不一致
        </li>
        <li>↑ 答案更大 / 位次更靠前 · ↓ 答案更小 / 位次更靠后</li>
      </ul>

      {room.status === 'playing' ? (
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={() => void onLeave()}>
            离开房间
          </button>
        </div>
      ) : null}

      <p className="muted">
        提示：把房间号 <strong>{room.code}</strong> 发给朋友，让他们在联机大厅输入即可加入。
      </p>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}
