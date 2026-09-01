import { isDifficulty } from '@yozu/shared';
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
    const difficulty: Difficulty = isDifficulty(parsed.difficulty) ? parsed.difficulty : 'easy';
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

const THEME_KEY = 'yozu:theme';

export type ThemePref = 'system' | 'light' | 'dark';

export function saveTheme(pref: ThemePref): void {
  try {
    localStorage.setItem(THEME_KEY, pref);
  } catch {
    // 忽略
  }
}

export function loadTheme(): ThemePref {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
  } catch {
    // 忽略
  }
  return 'system';
}

const CODEX_VIEW_KEY = 'yozu:codexView';

export type CodexView = 'card' | 'table';

/** 记住图鉴的卡片 / 表格视图选择 */
export function saveCodexView(view: CodexView): void {
  try {
    localStorage.setItem(CODEX_VIEW_KEY, view);
  } catch {
    // 忽略
  }
}

export function loadCodexView(): CodexView {
  try {
    if (localStorage.getItem(CODEX_VIEW_KEY) === 'table') return 'table';
  } catch {
    // 忽略
  }
  return 'card';
}
