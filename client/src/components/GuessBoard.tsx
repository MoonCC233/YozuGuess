import { ArrowUp, ArrowDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { AttributeFeedback, GuessFeedback, HiddenAttributeFeedback } from '../types';
import { GAME_TITLES } from '@yozu/shared';

function Cell({
  attr,
  label,
  format,
}: {
  attr: AttributeFeedback | HiddenAttributeFeedback;
  label: string;
  format?: (value: string) => string;
}) {
  const { t } = useTranslation();
  if (!('value' in attr)) {
    return (
      <td className={`${attr.level} masked-cell`} data-label={label}>
        {attr.hint && attr.level !== 'correct' && (
          <span className="dir">
            {attr.hint === 'higher' ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
          </span>
        )}
      </td>
    );
  }
  const text = format ? format(String(attr.value)) : String(attr.value);
  return (
    <td className={attr.level} data-label={label}>
      {text}
      {attr.hint && attr.level !== 'correct' && (
        <span className="dir">
          {attr.hint === 'higher' ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
        </span>
      )}
    </td>
  );
}

export default function GuessBoard({ guesses }: { guesses: GuessFeedback[] }) {
  const { t } = useTranslation();
  const columns = [
    t('rules.columns.rank'),
    t('rules.columns.hair'),
    t('rules.columns.eyes'),
    t('rules.columns.titleYear'),
    t('rules.columns.bakusen'),
    t('rules.columns.cv'),
  ];
  return (
    <div className="game-table-wrap">
      <table className="game-table">
        <thead>
          <tr>
            <th>{t('rules.columns.title') && '角色'}</th>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {guesses.map((g, i) => (
            <tr key={`${g.characterId}-${i}`} className={`${i === guesses.length - 1 ? 'row-latest' : ''} ${g.correct ? 'row-correct' : ''}`}>
              <td className={`name ${g.correct ? 'correct' : ''}`} data-label="角色">
                {g.name}
                <span className="name-jp">{GAME_TITLES[(g.attributes.title.value as keyof typeof GAME_TITLES)]?.short}</span>
              </td>
              <Cell attr={g.attributes.rank} label={columns[0]} />
              <Cell attr={g.attributes.hair} label={columns[1]} />
              <Cell attr={g.attributes.eyes} label={columns[2]} />
              <Cell attr={g.attributes.titleYear} label={columns[3]} />
              <Cell attr={g.attributes.bakusen} label={columns[4]} />
              <Cell attr={g.attributes.cv} label={columns[5]} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
