import { hasPortrait, portraitUrl } from '../portraits.js';

interface Props {
  characterId: number;
  name: string;
  variant: 'card' | 'thumb';
  /** 首屏几张立即加载，其余交给浏览器懒加载 */
  eager?: boolean;
}

/** 角色立绘。缺图时退化为姓名首字占位，保持格位不塌陷 */
export function Portrait({ characterId, name, variant, eager = false }: Props) {
  const url = portraitUrl(characterId, variant);
  if (url === null || !hasPortrait(characterId)) {
    return (
      <span className={`portrait portrait-${variant} portrait-empty`} aria-hidden="true">
        {name.slice(0, 1)}
      </span>
    );
  }
  return (
    <span className={`portrait portrait-${variant}`}>
      <img
        src={url}
        alt={`${name}的立绘`}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
      />
    </span>
  );
}
