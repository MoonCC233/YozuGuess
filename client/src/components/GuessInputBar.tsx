import { useMemo, useState } from 'react';
import { Search, Send } from 'lucide-react';
import { GAME_TITLES } from '@yozu/shared';
import type { PlayerInfo } from '../types';

export default function GuessInputBar({
  characters,
  onGuess,
  disabled,
}: {
  characters: PlayerInfo[];
  onGuess: (id: number) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return characters
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.nameJp.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, characters]);

  const pick = (c: PlayerInfo) => {
    onGuess(c.id);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="guess-input-bar">
      <div className="search-box">
        <Search size={16} />
        <input
          value={query}
          placeholder="搜索角色名…"
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          disabled={disabled}
        />
        {open && results.length > 0 && (
          <ul className="search-results">
            {results.map((c) => (
              <li key={c.id} onClick={() => pick(c)}>
                <span className="sr-name">{c.name}</span>
                <span className="sr-jp">{c.nameJp}</span>
                <span className="sr-title">{GAME_TITLES[c.title as keyof typeof GAME_TITLES]?.short}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button className="guess-send" disabled={disabled || !query.trim()} onClick={() => {
        if (results[0]) pick(results[0]);
      }}>
        <Send size={16} /> 猜！
      </button>
    </div>
  );
}
