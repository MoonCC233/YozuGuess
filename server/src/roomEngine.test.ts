import { describe, it, expect, beforeEach } from 'vitest';
import { CHARACTERS, MAX_GUESSES, getCharacter, winsNeeded } from '@yozu/shared';
import type { Character, Difficulty } from '@yozu/shared';
import {
  applyGuess,
  createRoom,
  endRound,
  getRoom,
  joinRoom,
  leaveRoom,
  markDisconnected,
  publicRoom,
  rejoinRoom,
  resetMatch,
  resetRooms,
  roomCount,
  startRound,
  tickRooms,
  type Room,
  type RoomPlayer,
} from './roomEngine.js';
import { config } from './config.js';

const ANSWER = getCharacter(1)!; // 绫地宁宁
const OTHER = CHARACTERS.find((c) => c.id !== ANSWER.id && c.isMain)!;
const OTHER2 = CHARACTERS.find((c) => c.id !== ANSWER.id && c.id !== OTHER.id && c.isMain)!;

const fixedAnswer = (_difficulty: Difficulty): Character => ANSWER;

beforeEach(() => {
  resetRooms();
});

function setupRoom(boType: 1 | 3 | 5 | 7 = 3): {
  room: Room;
  host: RoomPlayer;
  guest: RoomPlayer;
} {
  const created = createRoom({
    hostName: '主机',
    boType,
    difficulty: 'easy',
    socketId: 'sock-host',
    pickAnswer: fixedAnswer,
  });
  if (!created.ok) throw new Error(created.error);
  const { room, player: host } = created.value;
  const joined = joinRoom(room.code, { name: '客人', socketId: 'sock-guest', spectator: false });
  if (!joined.ok) throw new Error(joined.error);
  return { room, host, guest: joined.value.player };
}

describe('room lifecycle', () => {
  it('creates a room with a 5-char code and the host as first player', () => {
    const created = createRoom({ hostName: '主机', boType: 3, difficulty: 'easy' });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const { room, player } = created.value;
    expect(room.code).toMatch(/^[A-Z2-9]{5}$/);
    expect(room.status).toBe('waiting');
    expect(player.isHost).toBe(true);
    expect(getRoom(room.code.toLowerCase())?.code).toBe(room.code);
    expect(roomCount()).toBe(1);
  });

  it('rejects join for unknown rooms and duplicate connected names', () => {
    const { room } = setupRoom();
    expect(joinRoom('ZZZZZ', { name: '甲', socketId: 's', spectator: false })).toEqual({
      ok: false,
      error: 'ROOM_NOT_FOUND',
    });
    expect(joinRoom(room.code, { name: '客人', socketId: 's2', spectator: false })).toEqual({
      ok: false,
      error: 'NAME_TAKEN',
    });
  });

  it('rejects a second join from the same account', () => {
    const created = createRoom({
      hostName: '房主',
      boType: 3,
      difficulty: 'easy',
      socketId: 'sock-host',
      userId: 7,
    });
    if (!created.ok) throw new Error(created.error);
    const room = created.value.room;
    // 同一账号换个显示名也算重复
    expect(joinRoom(room.code, { name: '别名', socketId: 's9', spectator: false, userId: 7 })).toEqual({
      ok: false,
      error: 'NAME_TAKEN',
    });
    expect(joinRoom(room.code, { name: '别人', socketId: 's10', spectator: false, userId: 8 }).ok).toBe(true);
  });

  it('forces late joiners into spectator mode', () => {
    const { room } = setupRoom();
    startRound(room);
    const joined = joinRoom(room.code, { name: '迟到的人', socketId: 's3', spectator: false });
    expect(joined.ok).toBe(true);
    if (!joined.ok) return;
    expect(joined.value.player.spectator).toBe(true);
    expect(joined.value.player.done).toBe(true);
  });

  it('needs at least two players to start', () => {
    const created = createRoom({ hostName: '独狼', boType: 3, difficulty: 'easy' });
    if (!created.ok) return;
    expect(startRound(created.value.room)).toEqual({ ok: false, error: 'NEED_MORE_PLAYERS' });
  });

  it('reconnects via player key and tracks disconnects', () => {
    const { room, guest } = setupRoom();
    markDisconnected('sock-guest');
    expect(room.players.find((p) => p.key === guest.key)?.connected).toBe(false);
    const back = rejoinRoom(room.code, guest.key, 'sock-guest-2');
    expect(back.ok).toBe(true);
    expect(room.players.find((p) => p.key === guest.key)?.connected).toBe(true);
    expect(rejoinRoom(room.code, 'bogus', 's')).toEqual({ ok: false, error: 'PLAYER_NOT_FOUND' });
  });

  it('hands the host role to the next player on leave', () => {
    const { room, host, guest } = setupRoom();
    leaveRoom(host.key);
    expect(room.players.find((p) => p.key === guest.key)?.isHost).toBe(true);
  });

  it('deletes the room when the last player leaves', () => {
    const { room, host, guest } = setupRoom();
    leaveRoom(host.key);
    leaveRoom(guest.key);
    expect(getRoom(room.code)).toBeUndefined();
  });
});

describe('round play', () => {
  it('starts a round with a fresh answer and clears previous guesses', () => {
    const { room } = setupRoom();
    startRound(room);
    expect(room.status).toBe('playing');
    expect(room.round).toBe(1);
    expect(room.answerId).toBe(ANSWER.id);
    expect(room.roundEndsAt).toBeGreaterThan(Date.now());
  });

  it('rejects guesses outside a round and from spectators', () => {
    const { room, host } = setupRoom();
    expect(applyGuess(room, host.key, ANSWER.id)).toEqual({ ok: false, error: 'NOT_PLAYING' });
    const spectator = joinRoom(room.code, { name: '观众', socketId: 'sv', spectator: true });
    startRound(room);
    if (!spectator.ok) return;
    expect(applyGuess(room, spectator.value.player.key, OTHER.id)).toEqual({
      ok: false,
      error: 'SPECTATOR_CANNOT_GUESS',
    });
  });

  it('rejects duplicate guesses and unknown characters', () => {
    const { room, host } = setupRoom();
    startRound(room);
    expect(applyGuess(room, host.key, OTHER.id).ok).toBe(true);
    expect(applyGuess(room, host.key, OTHER.id)).toEqual({ ok: false, error: 'DUPLICATE_GUESS' });
    expect(applyGuess(room, host.key, 99999)).toEqual({ ok: false, error: 'CHARACTER_NOT_FOUND' });
  });

  it('ends the round immediately when someone solves it', () => {
    const { room, host } = setupRoom();
    startRound(room);
    const res = applyGuess(room, host.key, ANSWER.id);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.feedback.correct).toBe(true);
    expect(res.value.roundOver).toBe(true);
    expect(room.status).toBe('roundEnd');
    expect(room.roundResult).toMatchObject({ round: 1, winnerKey: host.key, reason: 'solved' });
    expect(room.roundResult?.answer?.id).toBe(ANSWER.id);
    expect(room.players.find((p) => p.key === host.key)?.score).toBe(1);
  });

  it('blocks further guesses once a player is done', () => {
    const { room, host } = setupRoom();
    startRound(room);
    applyGuess(room, host.key, ANSWER.id);
    startRound(room);
    applyGuess(room, host.key, ANSWER.id);
    expect(applyGuess(room, host.key, OTHER.id)).toEqual({ ok: false, error: 'NOT_PLAYING' });
  });

  it('caps guesses at MAX_GUESSES per player per round', () => {
    const { room, host } = setupRoom();
    startRound(room);
    const wrong = CHARACTERS.filter((c) => c.id !== ANSWER.id).slice(0, MAX_GUESSES);
    for (const c of wrong) {
      expect(applyGuess(room, host.key, c.id).ok).toBe(true);
    }
    expect(room.players.find((p) => p.key === host.key)?.done).toBe(true);
  });

  it('awards the round to the earliest solver', () => {
    const { room, host, guest } = setupRoom();
    startRound(room);
    applyGuess(room, guest.key, OTHER.id, 1_000);
    const res = applyGuess(room, guest.key, ANSWER.id, 2_000);
    expect(res.ok).toBe(true);
    expect(room.roundResult?.winnerKey).toBe(guest.key);
    void host;
  });

  it('decides by best attribute match when nobody solves it', () => {
    const { room, host, guest } = setupRoom();
    startRound(room);
    // 同作品同位次的角色比随机配角命中更多属性
    const sameTitle = CHARACTERS.find((c) => c.id !== ANSWER.id && c.title === ANSWER.title)!;
    const different = CHARACTERS.find((c) => c.title !== ANSWER.title && c.hair !== ANSWER.hair)!;
    applyGuess(room, host.key, sameTitle.id);
    applyGuess(room, guest.key, different.id);
    endRound(room);
    expect(room.status).toBe('roundEnd');
    expect(room.roundResult?.reason).toBe('timeout');
    expect(room.roundResult?.winnerKey).toBe(host.key);
  });

  it('draws the round when both sides are equally close', () => {
    const { room, host, guest } = setupRoom();
    startRound(room);
    applyGuess(room, host.key, OTHER.id);
    applyGuess(room, guest.key, OTHER.id);
    endRound(room);
    expect(room.roundResult?.winnerKey).toBeNull();
  });

  it('ignores players who never guessed when judging proximity', () => {
    const { room, host, guest } = setupRoom();
    startRound(room);
    // 客人挂机一次都不猜，主机猜了一次同作品角色 -> 主机应当拿下小局
    const sameTitle = CHARACTERS.find((c) => c.id !== ANSWER.id && c.title === ANSWER.title)!;
    applyGuess(room, host.key, sameTitle.id);
    endRound(room);
    expect(room.roundResult?.winnerKey).toBe(host.key);
    void guest;
  });

  it('draws the round when nobody guessed at all', () => {
    const { room } = setupRoom();
    startRound(room);
    endRound(room);
    expect(room.roundResult?.reason).toBe('timeout');
    expect(room.roundResult?.winnerKey).toBeNull();
  });

  it('counts close attributes as partial progress when judging proximity', () => {
    const { room, host, guest } = setupRoom();
    startRound(room);
    // 找一个所有属性都不沾边的角色，和一个至少有 close 属性的角色对比
    const nearMiss = CHARACTERS.find(
      (c) =>
        c.id !== ANSWER.id &&
        c.title !== ANSWER.title &&
        Math.abs(c.rank - ANSWER.rank) > 0 &&
        Math.abs(c.rank - ANSWER.rank) <= 1
    );
    if (!nearMiss) return;
    const farMiss = CHARACTERS.find(
      (c) =>
        c.id !== ANSWER.id &&
        c.title !== ANSWER.title &&
        c.hair !== ANSWER.hair &&
        c.eye !== ANSWER.eye &&
        c.cv !== ANSWER.cv &&
        Math.abs(c.rank - ANSWER.rank) > 1 &&
        Math.abs(c.bakusen - ANSWER.bakusen) > 1 &&
        c.isMain !== ANSWER.isMain
    );
    if (!farMiss) return;
    applyGuess(room, host.key, nearMiss.id);
    applyGuess(room, guest.key, farMiss.id);
    endRound(room);
    expect(room.roundResult?.winnerKey).toBe(host.key);
  });

  it('marks the round exhausted when everyone runs out of guesses', () => {
    const { room, host, guest } = setupRoom();
    startRound(room);
    const wrong = CHARACTERS.filter((c) => c.id !== ANSWER.id).slice(0, MAX_GUESSES);
    for (const c of wrong) applyGuess(room, host.key, c.id);
    for (const c of wrong) applyGuess(room, guest.key, c.id);
    expect(room.status).toBe('roundEnd');
    expect(room.roundResult?.reason).toBe('exhausted');
  });
});

describe('match progression', () => {
  it('finishes the match when a player reaches the required wins', () => {
    const { room, host } = setupRoom(3);
    const target = winsNeeded(3);
    for (let i = 0; i < target; i += 1) {
      startRound(room);
      applyGuess(room, host.key, ANSWER.id);
    }
    expect(room.status).toBe('finished');
    expect(room.matchResult).toEqual({ winnerKey: host.key, reason: 'score' });
  });

  it('BO1 ends after a single round', () => {
    const { room, host } = setupRoom(1);
    startRound(room);
    applyGuess(room, host.key, ANSWER.id);
    expect(room.status).toBe('finished');
    expect(room.matchResult?.winnerKey).toBe(host.key);
  });

  it('schedules the next round during intermission and auto-starts it', () => {
    const { room, host } = setupRoom(5);
    startRound(room);
    applyGuess(room, host.key, ANSWER.id, 1_000);
    expect(room.status).toBe('roundEnd');
    expect(room.nextRoundAt).not.toBeNull();
    const changed = tickRooms(room.nextRoundAt! + 1);
    expect(changed).toHaveLength(1);
    expect(room.status).toBe('playing');
    expect(room.round).toBe(2);
  });

  it('ends the round on timeout via tick', () => {
    const { room, host } = setupRoom(3);
    startRound(room);
    applyGuess(room, host.key, OTHER.id);
    const changed = tickRooms(room.roundEndsAt! + 1);
    expect(changed).toHaveLength(1);
    expect(room.roundResult?.reason).toBe('timeout');
  });

  it('grants the match to the survivor when an opponent leaves mid-round', () => {
    const { room, host, guest } = setupRoom(3);
    startRound(room);
    leaveRoom(guest.key);
    expect(room.status).toBe('finished');
    expect(room.matchResult).toEqual({ winnerKey: host.key, reason: 'forfeit' });
  });

  it('resets scores for a rematch', () => {
    const { room, host } = setupRoom(1);
    startRound(room);
    applyGuess(room, host.key, ANSWER.id);
    resetMatch(room);
    expect(room.status).toBe('waiting');
    expect(room.round).toBe(0);
    expect(room.players.every((p) => p.score === 0)).toBe(true);
    expect(startRound(room).ok).toBe(true);
  });

  it('decides by score when all BO rounds are played without reaching the target', () => {
    const { room, host, guest } = setupRoom(3);
    // 三小局全部平局，比分 0:0 -> 整场平局
    for (let i = 0; i < 3; i += 1) {
      expect(startRound(room).ok).toBe(true);
      applyGuess(room, host.key, OTHER.id);
      applyGuess(room, guest.key, OTHER.id);
      endRound(room);
    }
    expect(room.round).toBe(3);
    expect(room.status).toBe('finished');
    expect(room.matchResult).toEqual({ winnerKey: null, reason: 'score' });
  });
});

describe('publicRoom', () => {
  it('hides opponent guess values during a round but reveals them after', () => {
    const { room, host, guest } = setupRoom(5);
    startRound(room);
    applyGuess(room, guest.key, OTHER.id);

    const asHost = publicRoom(room, host.key);
    const opponent = asHost.players.find((p) => p.key === guest.key)!;
    expect(opponent.guesses[0]).toMatchObject({ hidden: true });
    expect(JSON.stringify(opponent.guesses)).not.toContain(OTHER.name);
    expect(asHost.viewerKey).toBe(host.key);

    const asGuest = publicRoom(room, guest.key);
    expect(asGuest.players.find((p) => p.key === guest.key)!.guesses[0]).not.toHaveProperty('hidden');

    applyGuess(room, host.key, ANSWER.id);
    const afterRound = publicRoom(room, host.key);
    expect(afterRound.players.find((p) => p.key === guest.key)!.guesses[0]).not.toHaveProperty('hidden');
  });

  it('lets spectators see everything and never leaks the answer id', () => {
    const { room, guest } = setupRoom(3);
    const spectator = joinRoom(room.code, { name: '观众', socketId: 'sv', spectator: true });
    if (!spectator.ok) return;
    startRound(room);
    applyGuess(room, guest.key, OTHER.id);
    const view = publicRoom(room, spectator.value.player.key);
    expect(view.players.find((p) => p.key === guest.key)!.guesses[0]).not.toHaveProperty('hidden');
    expect(view.spectators).toHaveLength(1);
    expect(JSON.stringify(view)).not.toContain(ANSWER.name);
  });

  it('reports meta such as winsNeeded and round duration', () => {
    const { room, host } = setupRoom(5);
    const view = publicRoom(room, host.key);
    expect(view.winsNeeded).toBe(3);
    expect(view.maxGuesses).toBe(MAX_GUESSES);
    expect(view.roundDurationMs).toBe(config.roundDurationMs);
    void OTHER2;
  });
});
