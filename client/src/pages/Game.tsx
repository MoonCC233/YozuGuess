import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ApiError,
  fetchCharacters,
  fetchGame,
  revealAnswer,
  startGame,
  submitGuess,
  type CharacterListItem,
  type Difficulty,
  type GameMode,
  type GameState,
} from '../api.js';
import { errorMessage } from '../errors.js';
import { clearSession, loadSession, saveSession } from '../storage.js';
import { GuessBoard } from '../components/GuessBoard.js';
import { GuessInputBar } from '../components/GuessInputBar.js';
import { Toast } from '../components/Toast.js';
import { useTitleLabel } from '../MetaContext.js';

function parseMode(value: string | null): GameMode {
  return value === 'daily' ? 'daily' : 'free';
}

function parseDifficulty(value: string | null): Difficulty {
  return value === 'full' ? 'full' : 'heroine';
}

export function Game() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const titleLabel = useTitleLabel();
  const [state, setState] = useState<GameState | null>(null);
  const [characters, setCharacters] = useState<CharacterListItem[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const bootstrapped = useRef(false);

  useEffect(() => {
    fetchCharacters()
      .then((r) => setCharacters(r.characters))
      .catch(() => setToast('角色列表加载失败'));
  }, []);

  const begin = useCallback(
    async (mode: GameMode, difficulty: Difficulty) => {
      setLoading(true);
      try {
        const { state: next } = await startGame(mode, difficulty);
        setState(next);
        saveSession({ sessionId: next.sessionId, mode: next.mode, difficulty: next.difficulty });
      } catch (err) {
        setToast(err instanceof ApiError ? errorMessage(err.code) : '无法开始游戏');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 首次进入：带 fresh=1 时开新局，否则尝试恢复本地记录的对局
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    const mode = parseMode(params.get('mode'));
    const difficulty = parseDifficulty(params.get('difficulty'));
    const fresh = params.get('fresh') === '1';

    if (fresh) {
      setParams(new URLSearchParams({ mode, difficulty }), { replace: true });
      void begin(mode, difficulty);
      return;
    }

    const saved = loadSession();
    if (!saved) {
      void begin(mode, difficulty);
      return;
    }
    fetchGame(saved.sessionId)
      .then((r) => {
        setState(r.state);
        setLoading(false);
      })
      .catch(() => {
        clearSession();
        void begin(saved.mode, saved.difficulty);
      });
  }, [begin, params, setParams]);

  async function guess(characterId: number) {
    if (!state || busy) return;
    setBusy(true);
    try {
      const { state: next } = await submitGuess(state.sessionId, characterId);
      setState(next);
      if (next.status !== 'playing') clearSession();
    } catch (err) {
      if (err instanceof ApiError) {
        setToast(errorMessage(err.code));
        if (err.code === 'SESSION_NOT_FOUND') clearSession();
      } else {
        setToast('提交失败，请重试');
      }
    } finally {
      setBusy(false);
    }
  }

  async function reveal() {
    if (!state) return;
    try {
      const { state: next } = await revealAnswer(state.sessionId);
      setState(next);
      clearSession();
    } catch (err) {
      setToast(err instanceof ApiError ? errorMessage(err.code) : '操作失败');
    }
  }

  function restart() {
    clearSession();
    const mode = state?.mode ?? parseMode(params.get('mode'));
    const difficulty = state?.difficulty ?? parseDifficulty(params.get('difficulty'));
    void begin(mode, difficulty);
  }

  if (loading && !state) {
    return (
      <section className="page">
        <p className="muted">正在准备本局…</p>
      </section>
    );
  }

  if (!state) {
    return (
      <section className="page">
        <p className="alert">无法开始游戏。</p>
        <button type="button" className="btn" onClick={() => navigate('/')}>
          返回首页
        </button>
      </section>
    );
  }

  const finished = state.status !== 'playing';
  const answer = state.answer;

  return (
    <section className="page game">
      <header className="game-head">
        <div>
          <h1 className="title-sm">
            {state.mode === 'daily' ? '每日一柚' : '自由练习'} ·{' '}
            {state.difficulty === 'heroine' ? '简单版' : '完整版'}
          </h1>
          {state.mode === 'daily' && state.dateKey ? <p className="muted">今日题目：{state.dateKey}</p> : null}
        </div>
        <p className="counter" aria-live="polite">
          剩余 <strong>{state.remaining}</strong> / {state.maxGuesses} 次
        </p>
      </header>

      <GuessInputBar
        characters={characters}
        guessedIds={state.guesses.map((g) => g.characterId)}
        disabled={finished || busy}
        onGuess={(id) => void guess(id)}
      />

      {finished && answer ? (
        <div className={`result ${state.status === 'won' ? 'result-win' : 'result-lose'}`} role="status">
          <h2>
            {state.status === 'won'
              ? `恭喜！${state.guessCount} 次猜中`
              : state.status === 'lost'
                ? '机会用完了'
                : '已公布答案'}
          </h2>
          <p>
            答案是 <strong>{answer.name}</strong>（{answer.nameJp}）· {titleLabel(answer.title)} ·{' '}
            {answer.rank} · 发色{answer.hair} · 瞳色{answer.eyes} · 爆闪 {answer.bakusen} · CV {answer.cv}
          </p>
          <div className="actions">
            <button type="button" className="btn btn-primary" onClick={restart}>
              再来一局
            </button>
            <button type="button" className="btn" onClick={() => navigate('/')}>
              返回首页
            </button>
          </div>
        </div>
      ) : (
        <div className="actions">
          <button type="button" className="btn" onClick={restart}>
            换一局
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => void reveal()}>
            我猜不出来，看答案
          </button>
        </div>
      )}

      <GuessBoard guesses={state.guesses} maxGuesses={state.maxGuesses} />

      <ul className="legend">
        <li>
          <span className="swatch swatch-correct" aria-hidden="true" />
          完全一致
        </li>
        <li>
          <span className="swatch swatch-close" aria-hidden="true" />
          接近（相邻位次 / 数值相差不大 / 同一位声优的其他化名）
        </li>
        <li>
          <span className="swatch swatch-wrong" aria-hidden="true" />
          不一致
        </li>
        <li>↑ 答案更大 · ↓ 答案更小</li>
      </ul>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}
