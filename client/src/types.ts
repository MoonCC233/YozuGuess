import type {
  AttributeFeedback,
  Character,
  FeedbackLevel,
  GuessFeedback,
  HiddenAttributeFeedback,
} from '@yozu/shared';

export type { AttributeFeedback, Character, FeedbackLevel, GuessFeedback, HiddenAttributeFeedback };

export interface PlayerInfo {
  id: number;
  name: string;
  nameJp: string;
  title: string;
  rank: number;
  isMain: boolean;
}

export type MultiplayerGuessFeedback = GuessFeedback | (HiddenGuessFeedback & { hidden: true });

export interface HiddenGuessFeedback {
  hidden: true;
  correct: boolean;
  attributes: Record<string, HiddenAttributeFeedback>;
}

export interface RoomState {
  code: string;
  boType: number;
  gameMode: string;
  roundDurationMs: number;
  status: 'waiting' | 'playing' | 'roundEnd' | 'finished';
  round: number;
  roundEndsAt: number | null;
  nextRoundAt: number | null;
  targetCharacterId?: number;
  players: Array<{
    key: string;
    name: string;
    connected: boolean;
    score: number;
    guessCount: number;
    eliminated: boolean;
    skipped: boolean;
    isHost: boolean;
    spectator: boolean;
    guesses: GuessFeedback[];
  }>;
  spectators: Array<{ key: string; name: string; connected: boolean }>;
  matchResult: { winnerKey: string | null; reason: string; forfeitedKey: null | string } | null;
  roundResult: { winnerKey: string | null; reason: string } | null;
  revision: number;
}

export interface ReplaySummary {
  id: string;
  mode: 'classic' | 'easy' | 'daily';
  date: string;
  status: 'won' | 'lost';
  guessCount: number;
  targetCharacterId: number;
}

export interface ReplayRecord extends ReplaySummary {
  createdAt: number;
  finishedAt: number;
  guesses: GuessFeedback[];
  guessTimes: number[];
  answer: {
    id: number;
    name: string;
    nameJp: string;
    title: string;
    rank: string;
    bakusen: number;
    hair: string;
    eyes: string;
    cv: string;
  } | null;
}

export interface StatsDetail {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  totalGuesses: number;
  avgGuesses: number;
  characterStats: Array<{ id: number; name: string; title: string; guessed: number; won: number }>;
  titleStats: Array<{ title: string; count: number }>;
}
