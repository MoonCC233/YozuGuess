import type { Character, GameTitle, GuessFeedback } from '@yozu/shared';

export type GameMode = 'free' | 'daily';
export type Difficulty = 'heroine' | 'full';
export type GameStatus = 'playing' | 'won' | 'lost' | 'revealed';

export interface GameState {
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

export interface CharacterListItem {
  id: number;
  name: string;
  nameJp: string;
}

export interface TitleMeta {
  zh: string;
  jp: string;
  short: string;
  year: number;
}

export interface MetaInfo {
  maxGuesses: number;
  titles: Record<GameTitle, TitleMeta>;
  poolSizes: Record<Difficulty, number>;
  totalCharacters: number;
}

export interface CodexCharacter extends Character {
  cvAliases: string[];
}

export class ApiError extends Error {
  constructor(
    readonly code: string,
    readonly status: number
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
  });
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : {};
  if (!res.ok) {
    const code =
      typeof data === 'object' && data && 'code' in data ? String((data as { code: unknown }).code) : 'REQUEST_FAILED';
    throw new ApiError(code, res.status);
  }
  return data as T;
}

export function fetchMeta(): Promise<MetaInfo> {
  return call<MetaInfo>('/meta');
}

export function fetchCharacters(): Promise<{ characters: CharacterListItem[] }> {
  return call<{ characters: CharacterListItem[] }>('/characters');
}

export function fetchCodex(): Promise<{ characters: CodexCharacter[]; titles: Record<GameTitle, TitleMeta> }> {
  return call<{ characters: CodexCharacter[]; titles: Record<GameTitle, TitleMeta> }>('/codex');
}

export function startGame(mode: GameMode, difficulty: Difficulty): Promise<{ state: GameState }> {
  return call<{ state: GameState }>('/game/start', {
    method: 'POST',
    body: JSON.stringify({ mode, difficulty }),
  });
}

export function fetchGame(sessionId: string): Promise<{ state: GameState }> {
  return call<{ state: GameState }>(`/game/${encodeURIComponent(sessionId)}`);
}

export function submitGuess(
  sessionId: string,
  characterId: number
): Promise<{ state: GameState; feedback: GuessFeedback }> {
  return call<{ state: GameState; feedback: GuessFeedback }>('/game/guess', {
    method: 'POST',
    body: JSON.stringify({ sessionId, characterId }),
  });
}

export function revealAnswer(sessionId: string): Promise<{ state: GameState }> {
  return call<{ state: GameState }>('/game/reveal', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });
}

/* --------------------------------- 账号 --------------------------------- */

export interface AccountUser {
  id: number;
  username: string;
  createdAt: number;
  lastLoginAt: number | null;
}

export interface SoloStats {
  played: number;
  won: number;
  winRate: number;
  avgGuesses: number | null;
  bestGuesses: number | null;
  currentStreak: number;
  bestStreak: number;
  distribution: number[];
}

export interface MatchStats {
  played: number;
  won: number;
  lost: number;
  draw: number;
  winRate: number;
}

export interface AccountStats {
  solo: SoloStats;
  daily: SoloStats;
  match: MatchStats;
}

export interface SoloHistoryItem {
  id: number;
  mode: GameMode;
  difficulty: Difficulty;
  status: 'won' | 'lost' | 'revealed';
  guessCount: number;
  answerId: number;
  answerName: string;
  durationMs: number;
  dateKey: string | null;
  createdAt: number;
}

export interface MatchHistoryItem {
  id: number;
  roomCode: string;
  boType: number;
  difficulty: Difficulty;
  result: 'won' | 'lost' | 'draw';
  ownScore: number;
  rivalScore: number;
  opponents: string[];
  reason: string;
  createdAt: number;
}

export interface LeaderboardEntry {
  username: string;
  won: number;
  played: number;
  avgGuesses: number | null;
}

export function registerAccount(username: string, password: string): Promise<{ user: AccountUser }> {
  return call<{ user: AccountUser }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function loginAccount(username: string, password: string): Promise<{ user: AccountUser }> {
  return call<{ user: AccountUser }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function logoutAccount(): Promise<{ ok: true }> {
  return call<{ ok: true }>('/auth/logout', { method: 'POST' });
}

export function fetchMe(): Promise<{ user: AccountUser | null }> {
  return call<{ user: AccountUser | null }>('/auth/me');
}

export function changeAccountPassword(currentPassword: string, newPassword: string): Promise<{ ok: true }> {
  return call<{ ok: true }>('/auth/password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function fetchStats(): Promise<{ stats: AccountStats }> {
  return call<{ stats: AccountStats }>('/me/stats');
}

export function fetchHistory(
  limit = 20
): Promise<{ games: SoloHistoryItem[]; matches: MatchHistoryItem[] }> {
  return call<{ games: SoloHistoryItem[]; matches: MatchHistoryItem[] }>(`/me/history?limit=${limit}`);
}

export function fetchLeaderboard(limit = 10): Promise<{ entries: LeaderboardEntry[] }> {
  return call<{ entries: LeaderboardEntry[] }>(`/leaderboard?limit=${limit}`);
}
