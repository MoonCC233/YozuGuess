import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play, LogOut, Eye, Copy, Check } from 'lucide-react';
import { getSocket } from '../socket';
import { api } from '../api';
import type { PlayerInfo, RoomState } from '../types';
import GuessBoard from '../components/GuessBoard';
import GuessInputBar from '../components/GuessInputBar';

const REJOIN_KEY = 'yozu-multi-rejoin';

export default function MultiRoom() {
  const { code = '' } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [room, setRoom] = useState<RoomState | null>(null);
  const [characters, setCharacters] = useState<PlayerInfo[]>([]);
  const [myKey, setMyKey] = useState('');
  const [error, setError] = useState('');
  const [reconnecting, setReconnecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [roundAnswer, setRoundAnswer] = useState<any>(null);
  const socketRef = useRef(getSocket());
  const isFirstMount = useRef(true);

  useEffect(() => {
    api.listCharacters().then(setCharacters).catch(() => {});
    const socket = socketRef.current;
    const name = localStorage.getItem('yozu-name') || '玩家';
    const saved = JSON.parse(localStorage.getItem(REJOIN_KEY) || 'null');
    const tryRejoin = saved && saved.code === code;

    const onJoined = (res: any) => {
      if (res?.error) {
        setError(res.error);
        return;
      }
      setMyKey(res.key);
      setRoom(res.room);
      localStorage.setItem(REJOIN_KEY, JSON.stringify({ code, key: res.key }));
    };

    if (tryRejoin) {
      setReconnecting(true);
      socket.emit('room:rejoin', { code, key: saved.key }, (res: any) => {
        setReconnecting(false);
        if (res?.error) {
          localStorage.removeItem(REJOIN_KEY);
          socket.emit('room:join', { code, name, asSpectator: false }, (r: any) => onJoined(r));
        } else {
          onJoined(res);
        }
      });
    } else {
      socket.emit('room:join', { code, name, asSpectator: false }, (r: any) => onJoined(r));
    }

    socket.on('room:state', (r: RoomState) => setRoom(r));
    socket.on('room:guess:applied', () => {
      // 反馈已通过 room:state 的 guesses 字段下发，这里无需额外处理
    });
    socket.on('room:round:end', (payload: any) => {
      setRoundAnswer(payload.answer);
    });

    return () => {
      // React StrictMode 在开发环境会先挂载再卸载再挂载：跳过第一次（模拟）卸载的离开，
      // 避免把房主自己移除后重连成非房主，导致无法开始对局。
      if (isFirstMount.current) {
        isFirstMount.current = false;
        socket.off('room:state');
        socket.off('room:guess:applied');
        socket.off('room:round:end');
        return;
      }
      socket.emit('room:leave');
      localStorage.removeItem(REJOIN_KEY);
      socket.off('room:state');
      socket.off('room:guess:applied');
      socket.off('room:round:end');
    };
  }, [code]);

  const me = room?.players.find((p) => p.key === myKey);
  const isHost = me?.isHost;
  const isSpectator = me?.spectator ?? false;
  const opponents = room?.players.filter((p) => p.key !== myKey) ?? [];
  const canGuess = room?.status === 'playing' && !isSpectator;

  const start = () => {
    socketRef.current.emit('room:start', {}, (res: any) => {
      if (res?.error) setError(res.error);
    });
  };

  const guess = (characterId: number) => {
    socketRef.current.emit('room:guess', { characterId }, (res: any) => {
      if (res?.error) setError(res.error);
    });
  };

  const leave = () => {
    socketRef.current.emit('room:leave');
    localStorage.removeItem(REJOIN_KEY);
    navigate('/multi');
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  };

  if (!room) {
    return <div className="page"><p>{reconnecting ? t('multi.reconnecting') : error || '连接中…'}</p></div>;
  }

  return (
    <div className="page multi-room">
      <div className="game-header">
        <h1>{t('nav.multi')} · <span className="room-code">{room.code}</span></h1>
        <div className="room-header-actions">
          <button className="btn btn-ghost" onClick={copyCode}><Copy size={14} /> {copied ? t('multi.copied') : t('multi.copyCode')}</button>
          <button className="btn btn-ghost" onClick={leave}><LogOut size={16} /> {t('single.leave')}</button>
        </div>
      </div>

      <div className="score-bar">
        {room.players.map((p) => (
          <div key={p.key} className={`score-chip${p.key === myKey ? ' me' : ''}${!p.connected ? ' offline' : ''}`}>
            <span className="score-name">{p.name}{p.key === myKey ? `（${t('common.me')}）` : ''}{p.isHost ? ' 👑' : ''}</span>
            <span className="score-num">{p.score}</span>
          </div>
        ))}
        {room.spectators.length > 0 && (
          <span className="spectator-count"><Eye size={14} /> {room.spectators.length}</span>
        )}
      </div>

      {room.status === 'waiting' && (
        <div className="waiting-box">
          <p>{t('multi.waiting')}</p>
          <div className="player-list">
            {room.players.map((p) => (
              <div key={p.key} className={`player-chip${p.key === myKey ? ' me' : ''}`}>
                {p.name} {p.isHost ? '👑' : ''} {p.connected ? '🟢' : '⚪'}
              </div>
            ))}
            {room.spectators.map((s) => (
              <div key={s.key} className="player-chip spectator">{s.name} 👁 {s.connected ? '🟢' : '⚪'}</div>
            ))}
          </div>
          {isHost && (
            <button className="btn btn-primary" onClick={start} disabled={room.players.length < 2}>
              <Play size={16} /> {t('multi.start')}
            </button>
          )}
          {!isHost && <p className="muted">等待房主开始…</p>}
        </div>
      )}

      {(room.status === 'playing' || room.status === 'roundEnd') && (
        <div className="playing-box">
          <div className="round-info">
            {t('multi.round', { round: room.round })}
            {room.status === 'playing' && room.roundEndsAt && <RoundTimer endsAt={room.roundEndsAt} />}
            {room.status === 'roundEnd' && room.nextRoundAt && (
              <span className="next-round"> · {t('multi.nextRoundIn', { sec: Math.max(0, Math.ceil((room.nextRoundAt - Date.now()) / 1000)) })}</span>
            )}
          </div>

          {isSpectator && <div className="spectator-badge">{t('multi.spectating')}</div>}

          <div className="board-grid">
            {!isSpectator && (
              <div className="board-section">
                <h3>{t('multi.yourBoard')}</h3>
                <GuessBoard guesses={me?.guesses ?? []} />
                <GuessInputBar characters={characters} onGuess={guess} disabled={!canGuess} />
              </div>
            )}

            <div className="board-section">
              <h3>{t('multi.opponentBoard')}</h3>
              {opponents.length === 0 && <p className="muted">—</p>}
              {opponents.map((p) => (
                <div key={p.key} className="opponent-board">
                  <div className="opponent-name">{p.name}{!p.connected ? ' ⚪' : ''}</div>
                  <GuessBoard guesses={p.guesses ?? []} />
                </div>
              ))}
            </div>
          </div>

          {room.status === 'roundEnd' && (
            <div className="round-end-box">
              <h2>{t('multi.roundEnded')}</h2>
              {room.roundResult?.winnerKey ? (
                <p>{t('multi.roundWinner')}：{room.players.find((p) => p.key === room.roundResult!.winnerKey)?.name}</p>
              ) : (
                <p>{t('multi.draw')}</p>
              )}
              {roundAnswer && (
                <div className="round-answer">
                  {t('rules.columns.title')}：{roundAnswer.name}（{roundAnswer.nameJp}）
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {room.status === 'finished' && (
        <div className="finished-box">
          <h2>🏆 {t('multi.roundEnded')}</h2>
          <p>{room.matchResult?.winnerKey
            ? `${t('multi.roundWinner')}：${room.players.find((p) => p.key === room.matchResult!.winnerKey)?.name}`
            : t('multi.draw')}</p>
          {isHost && (
            <button className="btn btn-primary" onClick={start}><Play size={16} /> {t('multi.rematch')}</button>
          )}
          {!isHost && <p className="muted">等待房主开始下一局…</p>}
        </div>
      )}

      {error && <div className="lobby-error">{error}</div>}
    </div>
  );
}

function RoundTimer({ endsAt }: { endsAt: number }) {
  const [left, setLeft] = useState(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
  useEffect(() => {
    setLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    const id = setInterval(() => setLeft(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))), 500);
    return () => clearInterval(id);
  }, [endsAt]);
  return <span className="round-timer"> · ⏱ {left}s</span>;
}
