import { randomUUID } from 'node:crypto';
import {
  MAX_GUESSES,
  compareGuess,
  getCharacter,
  pickDailyAnswer,
  pickRandomAnswer,
  toDateKey,
  type Character,
  type Difficulty,
  type GuessFeedback,
} from '@yozu/shared';
import { config } from './config.js';

export type GameMode = 'free' | 'daily';
export type GameStatus = 'playing' | 'won' | 'lost' | 'revealed';

interface GameSession {
  id: string;
  mode: GameMode;
  difficulty: Difficulty;
  dateKey: string | null;
  answerId: number;
  guesses: GuessFeedback[];
  status: GameStatus;
  startedAt: number;
  updatedAt: number;
}

/** 对客户端可见的对局状态；答案仅在结束后下发 */
export interface GameStateView {
  sessionId: string;
  mode: GameMode;
  difficulty: Difficulty;
  dateKey: string | null;
  status: GameStatus;
  maxGuesses: number;
  guessCount: number;
  remaining: number;
  guesses: GuessFeedback[];
  answer: Character | null;
}

const sessions = new Map<string, GameSession>();

function isExpired(session: GameSession, now: number): boolean {
  return now - session.updatedAt > config.sessionTtlMs;
}

/** 清理过期对局；超出上限时淘汰最旧的对局 */
function sweep(now = Date.now()): void {
  for (const [id, session] of sessions) {
    if (isExpired(session, now)) sessions.delete(id);
  }
  if (sessions.size <= config.maxSessions) return;
  const oldestFirst = [...sessions.values()].sort((a, b) => a.updatedAt - b.updatedAt);
  const overflow = sessions.size - config.maxSessions;
  for (let i = 0; i < overflow; i += 1) {
    const victim = oldestFirst[i];
    if (victim) sessions.delete(victim.id);
  }
}

function isFinished(status: GameStatus): boolean {
  return status !== 'playing';
}

function toView(session: GameSession): GameStateView {
  return {
    sessionId: session.id,
    mode: session.mode,
    difficulty: session.difficulty,
    dateKey: session.dateKey,
    status: session.status,
    maxGuesses: MAX_GUESSES,
    guessCount: session.guesses.length,
    remaining: Math.max(0, MAX_GUESSES - session.guesses.length),
    guesses: session.guesses,
    answer: isFinished(session.status) ? getCharacter(session.answerId) ?? null : null,
  };
}

export function startGame(mode: GameMode, difficulty: Difficulty): GameStateView {
  sweep();
  const now = Date.now();
  const dateKey = mode === 'daily' ? toDateKey(new Date()) : null;
  const answer =
    mode === 'daily' && dateKey
      ? pickDailyAnswer(difficulty, dateKey)
      : pickRandomAnswer(difficulty);
  const session: GameSession = {
    id: randomUUID(),
    mode,
    difficulty,
    dateKey,
    answerId: answer.id,
    guesses: [],
    status: 'playing',
    startedAt: now,
    updatedAt: now,
  };
  sessions.set(session.id, session);
  return toView(session);
}

export function getGame(sessionId: string): GameStateView | null {
  const session = sessions.get(sessionId);
  if (!session) return null;
  if (isExpired(session, Date.now())) {
    sessions.delete(sessionId);
    return null;
  }
  return toView(session);
}

export type GuessError = 'SESSION_NOT_FOUND' | 'GAME_FINISHED' | 'CHARACTER_NOT_FOUND' | 'DUPLICATE_GUESS';

export function submitGuess(
  sessionId: string,
  characterId: number
): { ok: true; state: GameStateView; feedback: GuessFeedback } | { ok: false; error: GuessError } {
  const session = sessions.get(sessionId);
  if (!session || isExpired(session, Date.now())) {
    if (session) sessions.delete(sessionId);
    return { ok: false, error: 'SESSION_NOT_FOUND' };
  }
  if (isFinished(session.status)) return { ok: false, error: 'GAME_FINISHED' };

  const guessed = getCharacter(characterId);
  if (!guessed) return { ok: false, error: 'CHARACTER_NOT_FOUND' };
  if (session.guesses.some((g) => g.characterId === characterId)) {
    return { ok: false, error: 'DUPLICATE_GUESS' };
  }

  const answer = getCharacter(session.answerId);
  if (!answer) return { ok: false, error: 'SESSION_NOT_FOUND' };

  const feedback = compareGuess(guessed, answer);
  session.guesses.push(feedback);
  session.updatedAt = Date.now();
  if (feedback.correct) session.status = 'won';
  else if (session.guesses.length >= MAX_GUESSES) session.status = 'lost';

  return { ok: true, state: toView(session), feedback };
}

export function revealAnswer(
  sessionId: string
): { ok: true; state: GameStateView } | { ok: false; error: 'SESSION_NOT_FOUND' } {
  const session = sessions.get(sessionId);
  if (!session || isExpired(session, Date.now())) {
    if (session) sessions.delete(sessionId);
    return { ok: false, error: 'SESSION_NOT_FOUND' };
  }
  if (!isFinished(session.status)) session.status = 'revealed';
  session.updatedAt = Date.now();
  return { ok: true, state: toView(session) };
}

export function endGame(sessionId: string): void {
  sessions.delete(sessionId);
}

/** 仅用于测试：清空内存中的全部对局 */
export function resetSessions(): void {
  sessions.clear();
}

export function sessionCount(): number {
  return sessions.size;
}
