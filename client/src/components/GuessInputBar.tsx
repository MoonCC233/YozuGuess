import { useEffect, useMemo, useRef, useState } from 'react';
import type { CharacterListItem } from '../api.js';

interface Props {
  characters: CharacterListItem[];
  guessedIds: number[];
  disabled: boolean;
  onGuess: (characterId: number) => void;
}

const MAX_SUGGESTIONS = 8;

export function GuessInputBar({ characters, guessedIds, disabled, onGuess }: Props) {
  const [keyword, setKeyword] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const guessed = useMemo(() => new Set(guessedIds), [guessedIds]);

  const suggestions = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    if (q === '') return [];
    return characters
      .filter((c) => !guessed.has(c.id))
      .filter((c) => c.name.toLowerCase().includes(q) || c.nameJp.toLowerCase().includes(q))
      .slice(0, MAX_SUGGESTIONS);
  }, [characters, guessed, keyword]);

  useEffect(() => {
    setActiveIndex(0);
  }, [keyword]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function commit(item: CharacterListItem | undefined) {
    if (!item || disabled) return;
    onGuess(item.id);
    setKeyword('');
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (e.key === 'Enter') e.preventDefault();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      commit(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const listId = 'guess-suggestions';
  const activeId = suggestions[activeIndex] ? `guess-option-${suggestions[activeIndex]!.id}` : undefined;

  return (
    <div className="guess-bar" ref={wrapRef}>
      <label className="sr-only" htmlFor="guess-input">
        输入角色名进行猜测
      </label>
      <input
        id="guess-input"
        className="guess-input"
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open ? activeId : undefined}
        placeholder={disabled ? '本局已结束' : '输入角色名（中文或日文）'}
        value={keyword}
        disabled={disabled}
        onChange={(e) => {
          setKeyword(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      <button
        type="button"
        className="btn btn-primary"
        disabled={disabled || suggestions.length === 0}
        onClick={() => commit(suggestions[activeIndex])}
      >
        猜！
      </button>
      {open && suggestions.length > 0 ? (
        <ul className="suggestions" id={listId} role="listbox" aria-label="角色候选">
          {suggestions.map((c, i) => (
            <li
              key={c.id}
              id={`guess-option-${c.id}`}
              role="option"
              aria-selected={i === activeIndex}
              className={i === activeIndex ? 'active' : undefined}
            >
              <button type="button" onMouseEnter={() => setActiveIndex(i)} onClick={() => commit(c)}>
                <span className="sug-name">{c.name}</span>
                <span className="sug-jp">{c.nameJp}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
