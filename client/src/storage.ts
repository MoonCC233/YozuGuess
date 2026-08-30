import type { Difficulty, GameMode } from './api.js';

const KEY = 'yozu:session';

export interface StoredSession {
  sessionId: string;
  mode: GameMode;
  difficulty: Difficulty;
}

/** 记住进行中的对局，刷新页面后可续玩 */
export function saveSession(session: StoredSession): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // 隐私模式下 localStorage 不可用时忽略
  }
}

export function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (typeof parsed.sessionId !== 'string' || parsed.sessionId === '') return null;
    const mode: GameMode = parsed.mode === 'daily' ? 'daily' : 'free';
    const difficulty: Difficulty = parsed.difficulty === 'full' ? 'full' : 'heroine';
    return { sessionId: parsed.sessionId, mode, difficulty };
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 忽略
  }
}
