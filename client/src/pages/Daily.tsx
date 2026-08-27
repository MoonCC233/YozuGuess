import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import GuessBoard from '../components/GuessBoard';
import GuessInputBar from '../components/GuessInputBar';
import { api } from '../api';
import type { GuessFeedback, PlayerInfo } from '../types';

export default function Daily() {
  const { t } = useTranslation();
  const [characters, setCharacters] = useState<PlayerInfo[]>([]);
  const [date, setDate] = useState('');
  const [guesses, setGuesses] = useState<GuessFeedback[]>([]);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [answer, setAnswer] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listCharacters().then(setCharacters).catch(() => {});
    api.daily().then((d) => {
      setDate(d.date);
      setGuesses([]);
      setStatus(d.status);
    }).catch(() => {});
  }, []);

  const guess = async (characterId: number) => {
    if (status !== 'playing' || busy) return;
    setBusy(true);
    try {
      const res = await api.guessDaily(characterId);
      setGuesses((g) => [...g, res.feedback]);
      setStatus(res.status);
      if (res.answer) setAnswer(res.answer);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page single-game">
      <div className="game-header">
        <h1>{t('daily.title')}</h1>
        <div className="daily-date"><CalendarDays size={16} /> {date} · {t('daily.todayTarget')}</div>
      </div>

      <div className="guess-counter">
        {t('single.guesses', { current: guesses.length, max: 8 })}
      </div>

      <GuessBoard guesses={guesses} />
      <GuessInputBar characters={characters} onGuess={guess} disabled={status !== 'playing'} />

      {answer && (
        <div className={`answer-overlay ${status === 'won' ? 'win' : 'lose'}`}>
          <div className="answer-card">
            <h2>{status === 'won' ? t('single.won') : t('single.lost')}</h2>
            <p>{answer.name}（{answer.nameJp}）</p>
            <p className="muted">{t('single.usedGuesses', { count: guesses.length })}</p>
          </div>
        </div>
      )}
    </div>
  );
}
