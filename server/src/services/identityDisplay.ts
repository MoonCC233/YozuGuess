// 由种子派生稳定的展示码（访客/用户显示名），模仿 csgofriberg 的 displayCodeFromSeed。
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉易混字符

function hashSeed(namespace: string, seed: string): number {
  let h = 2166136261 >>> 0;
  const s = `${namespace}:${seed}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function displayCodeFromSeed(namespace: string, seed: string): string {
  let n = hashSeed(namespace, seed);
  let out = '';
  for (let i = 0; i < 5; i++) {
    out += ALPHABET[n % ALPHABET.length];
    n = Math.floor(n / ALPHABET.length) ^ (n << 13);
    n >>>= 0;
  }
  return out;
}

export function guestNameFromKey(key: string): string {
  return `访客#${displayCodeFromSeed('guest', key)}`;
}

export function userNameFromUsername(username: string): string {
  return `用户#${displayCodeFromSeed('user', username)}`;
}
