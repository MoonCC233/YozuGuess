import type { AttributeFeedback, GuessFeedback, HiddenGuessFeedback } from '@yozu/shared';
import { useTitleLabel } from '../MetaContext.js';
import { Portrait } from './Portrait.js';

const COLUMNS: Array<{ key: keyof GuessFeedback['attributes']; label: string }> = [
  { key: 'title', label: '作品' },
  { key: 'rank', label: '位次' },
  { key: 'hair', label: '发色' },
  { key: 'eyes', label: '瞳色' },
  { key: 'titleYear', label: '年份' },
  { key: 'bakusen', label: '爆闪' },
  { key: 'cv', label: '声优' },
];

/** 每格反馈翻入的递进延迟，配合 .cell 的 cell-flip 形成从左到右的波浪 */
const FLIP_STEP_MS = 45;

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

function isHidden(guess: GuessFeedback | HiddenGuessFeedback): guess is HiddenGuessFeedback {
  return 'hidden' in guess && guess.hidden;
}

function Cell({
  attr,
  text,
  delayMs,
}: {
  attr: { level: AttributeFeedback['level']; hint?: AttributeFeedback['hint'] };
  text: string;
  delayMs: number;
}) {
  const arrow = hintArrow(attr.hint);
  return (
    <td className={`cell cell-${attr.level}`} style={{ animationDelay: `${delayMs}ms` }}>
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

/** 缺立绘、对手视角、空行共用的占位，尺寸与 portrait-thumb 一致，行高不会跳 */
function PortraitPlaceholder({ text }: { text: string }) {
  return (
    <span className="portrait portrait-thumb portrait-empty" aria-hidden="true">
      {text}
    </span>
  );
}

interface Props {
  guesses: Array<GuessFeedback | HiddenGuessFeedback>;
  maxGuesses: number;
  /** 对手视角时隐藏具体数值，只保留颜色与箭头 */
  compact?: boolean;
}

export function GuessBoard({ guesses, maxGuesses, compact = false }: Props) {
  const titleLabel = useTitleLabel();
  const emptyRows = Math.max(0, maxGuesses - guesses.length);

  return (
    <div className={`board-wrap${compact ? ' board-compact' : ''}`}>
      <table className="board">
        <caption className="sr-only">猜测记录，每列显示该属性与答案的对比结果</caption>
        <thead>
          <tr>
            <th scope="col">立绘</th>
            <th scope="col">角色</th>
            {COLUMNS.map((c) => (
              <th key={c.key} scope="col">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {guesses.map((g, index) => {
            const hidden = isHidden(g);
            return (
              <tr key={hidden ? `hidden-${index}` : g.characterId} className={g.correct ? 'row-correct' : undefined}>
                <td className="board-thumb-cell">
                  {hidden ? (
                    <PortraitPlaceholder text="？" />
                  ) : (
                    <Portrait characterId={g.characterId} name={g.name} variant="thumb" eager />
                  )}
                </td>
                <th scope="row" className="row-name">
                  {hidden ? '？？？' : g.name}
                </th>
                {COLUMNS.map((c, col) => {
                  const attr = g.attributes[c.key];
                  const text = hidden
                    ? ''
                    : c.key === 'title'
                      ? titleLabel(String((attr as AttributeFeedback).value))
                      : String((attr as AttributeFeedback).value);
                  return <Cell key={c.key} attr={attr} text={text} delayMs={col * FLIP_STEP_MS} />;
                })}
              </tr>
            );
          })}
          {Array.from({ length: emptyRows }, (_, i) => (
            <tr key={`empty-${i}`} className="row-empty">
              <td className="board-thumb-cell">
                <PortraitPlaceholder text="—" />
              </td>
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
