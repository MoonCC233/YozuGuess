import type { AttributeFeedback, GuessFeedback } from '@yozu/shared';
import { useTitleLabel } from '../MetaContext.js';

const COLUMNS: Array<{ key: keyof GuessFeedback['attributes']; label: string }> = [
  { key: 'title', label: '作品' },
  { key: 'rank', label: '位次' },
  { key: 'hair', label: '发色' },
  { key: 'eyes', label: '瞳色' },
  { key: 'titleYear', label: '年份' },
  { key: 'bakusen', label: '爆闪' },
  { key: 'cv', label: '声优' },
];

const LEVEL_TEXT: Record<AttributeFeedback['level'], string> = {
  correct: '完全一致',
  close: '接近',
  wrong: '不一致',
};

function hintArrow(hint: AttributeFeedback['hint']): string {
  if (hint === 'higher') return '↑';
  if (hint === 'lower') return '↓';
  return '';
}

function Cell({ attr, text }: { attr: AttributeFeedback; text: string }) {
  const arrow = hintArrow(attr.hint);
  return (
    <td className={`cell cell-${attr.level}`}>
      <span className="cell-value">{text}</span>
      {arrow ? (
        <span className="cell-hint" aria-hidden="true">
          {arrow}
        </span>
      ) : null}
      <span className="sr-only">
        {LEVEL_TEXT[attr.level]}
        {attr.hint === 'higher' ? '，答案更大' : attr.hint === 'lower' ? '，答案更小' : ''}
      </span>
    </td>
  );
}

export function GuessBoard({ guesses, maxGuesses }: { guesses: GuessFeedback[]; maxGuesses: number }) {
  const titleLabel = useTitleLabel();
  const emptyRows = Math.max(0, maxGuesses - guesses.length);

  return (
    <div className="board-wrap">
      <table className="board">
        <caption className="sr-only">猜测记录，每列显示该属性与答案的对比结果</caption>
        <thead>
          <tr>
            <th scope="col">角色</th>
            {COLUMNS.map((c) => (
              <th key={c.key} scope="col">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {guesses.map((g) => (
            <tr key={g.characterId} className={g.correct ? 'row-correct' : undefined}>
              <th scope="row" className="row-name">
                {g.name}
              </th>
              {COLUMNS.map((c) => {
                const attr = g.attributes[c.key];
                const text = c.key === 'title' ? titleLabel(String(attr.value)) : String(attr.value);
                return <Cell key={c.key} attr={attr} text={text} />;
              })}
            </tr>
          ))}
          {Array.from({ length: emptyRows }, (_, i) => (
            <tr key={`empty-${i}`} className="row-empty">
              <th scope="row" className="row-name">
                —
              </th>
              {COLUMNS.map((c) => (
                <td key={c.key} className="cell cell-empty" />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
