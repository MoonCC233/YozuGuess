/** 四张站点 Logo，放在 public/logos 下，每次页面加载随机选一张 */
const LOGOS = ['/logos/logo-1.png', '/logos/logo-2.png', '/logos/logo-3.png', '/logos/logo-4.png'] as const;

/** 本次页面加载使用的 Logo：模块首次求值时抽取，刷新即轮换 */
export const brandLogo: string = LOGOS[Math.floor(Math.random() * LOGOS.length)]!;

export { LOGOS as BRAND_LOGOS };
