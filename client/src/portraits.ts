import portraitIds from './portraitIds.json';

/** 有立绘的角色 id，由 scripts/build-portraits.mjs 生成 */
const AVAILABLE = new Set<number>(portraitIds as number[]);

export type PortraitVariant = 'card' | 'thumb';

export function hasPortrait(characterId: number): boolean {
  return AVAILABLE.has(characterId);
}

/** 立绘 URL；没有立绘的角色返回 null，由调用方渲染占位 */
export function portraitUrl(characterId: number, variant: PortraitVariant = 'card'): string | null {
  if (!AVAILABLE.has(characterId)) return null;
  return `/portraits/${variant}/${characterId}.webp`;
}
