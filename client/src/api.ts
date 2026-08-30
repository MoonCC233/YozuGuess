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
