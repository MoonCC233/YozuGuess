import type { PlayerInfo } from './types';
import { api as http, errMsg } from './api/client';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.code || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  listCharacters: () => fetch(`${http.defaults.baseURL}/characters`).then((r) => json<PlayerInfo[]>(r)),

  startSingle: (mode: 'classic' | 'easy') =>
    fetch(`${http.defaults.baseURL}/game/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    }).then((r) => json<{ id: string; maxGuesses: number; mode: string }>(r)),

  guessSingle: (id: string, characterId: number) =>
    fetch(`${http.defaults.baseURL}/game/${id}/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId }),
    }).then((r) => json<any>(r)),

  revealSingle: (id: string) =>
    fetch(`${http.defaults.baseURL}/game/${id}/reveal`, { method: 'POST' }).then((r) => json<any>(r)),

  daily: () => fetch(`${http.defaults.baseURL}/daily`).then((r) => json<any>(r)),
  guessDaily: (characterId: number) =>
    fetch(`${http.defaults.baseURL}/daily/guess`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ characterId }),
    }).then((r) => json<any>(r)),

  recordStat: (mode: 'classic' | 'easy' | 'daily', won: boolean, guessCount: number) =>
    http.post('/stats/record', { mode, won, guessCount }).then(() => undefined).catch((e: unknown) => { throw new Error(errMsg(e)); }),

  recordLeaderboard: (won: boolean) =>
    http.post('/leaderboard/record', { won }).then(() => undefined).catch((e: unknown) => { throw new Error(errMsg(e)); }),

  leaderboard: () => fetch(`${http.defaults.baseURL}/leaderboard`).then((r) => json<any[]>(r)),
  statsSummary: () => fetch(`${http.defaults.baseURL}/stats/summary`).then((r) => json<any>(r)),

  listReplays: () => fetch(`${http.defaults.baseURL}/replays`).then((r) => json<import('./types').ReplaySummary[]>(r)),
  getReplay: (id: string) => fetch(`${http.defaults.baseURL}/replays/${id}`).then((r) => json<import('./types').ReplayRecord>(r)),
  statsDetail: () => fetch(`${http.defaults.baseURL}/stats/detail`).then((r) => json<import('./types').StatsDetail>(r)),

  listCodex: () => fetch(`${http.defaults.baseURL}/database`).then((r) => json<import('./types').Character[]>(r)),
};
