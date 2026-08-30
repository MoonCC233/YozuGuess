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

const ROOM_KEY = 'yozu:room';

export interface StoredRoom {
  code: string;
  key: string;
  name: string;
}

/** 记住联机房间身份，刷新或断线后可重连 */
export function saveRoom(room: StoredRoom): void {
  try {
    localStorage.setItem(ROOM_KEY, JSON.stringify(room));
  } catch {
    // 忽略
  }
}

export function loadRoom(): StoredRoom | null {
  try {
    const raw = localStorage.getItem(ROOM_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredRoom>;
    if (typeof parsed.code !== 'string' || parsed.code === '') return null;
    if (typeof parsed.key !== 'string' || parsed.key === '') return null;
    return { code: parsed.code, key: parsed.key, name: typeof parsed.name === 'string' ? parsed.name : '' };
  } catch {
    return null;
  }
}

export function clearRoom(): void {
  try {
    localStorage.removeItem(ROOM_KEY);
  } catch {
    // 忽略
  }
}

const NAME_KEY = 'yozu:nickname';

export function saveNickname(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // 忽略
  }
}

export function loadNickname(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}
