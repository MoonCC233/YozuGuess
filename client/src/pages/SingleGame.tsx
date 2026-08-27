import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RotateCcw, Lightbulb, Home, Trophy } from 'lucide-react';
import GuessBoard from '../components/GuessBoard';
import GuessInputBar from '../components/GuessInputBar';
import { api } from '../api';
import type { GuessFeedback, PlayerInfo } from '../types';

export default function SingleGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<PlayerInfo[]>([]);
  const [gameId, setGameId] = useState<string | null>(null);
  const [maxGuesses] = useState(8);
  const [mode, setMode] = useState<'classic' | 'easy'>('classic');
  const [guesses, setGuesses] = useState<GuessFeedback[]>([]);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [answer, setAnswer] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listCharacters().then(setCharacters).catch(() => {});
  }, []);

  const start = useCallback(async (mode: 'classic' | 'easy' = 'classic') => {
    setBusy(true);
    try {
      const res = await api.startSingle(mode);
      setGameId(res.id);
      setMode(mode);
      setGuesses([]);
      setStatus('playing');
      setAnswer(null);
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    start('classic');
  }, [start]);

  const guess = async (characterId: number) => {
    if (!gameId || status !== 'playing' || busy) return;
    setBusy(true);
    try {
      const res = await api.guessSingle(gameId, characterId);
      setGuesses((g) => [...g, res.feedback]);
      setStatus(res.status);
      if (res.answer) {
        setAnswer(res.answer);
        const won = res.status === 'won';
        api.recordStat(mode, won, res.guessCount).catch(() => {});
        api.recordLeaderboard(won).catch(() => {});
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const reveal = async () => {
    if (!gameId) return;
    const res = await api.revealSingle(gameId);
    setAnswer(res.answer);
    setStatus('lost');
  };

  return (
    <div className="page single-game">
      <div className="game-header">
        <h1>{t('nav.single')}</h1>
        <div className="game-actions">
          <button className="btn" onClick={() => start('classic')} disabled={busy}><RotateCcw size={16} /> {t('single.restart')}</button>
          <button className="btn btn-ghost" onClick={reveal} disabled={status !== 'playing'}><Lightbulb size={16} /> {t('single.reveal')}</button>
          <button className="btn btn-ghost" onClick={() => navigate('/')}><Home size={16} /></button>
        </div>
      </div>

      <div className="guess-counter">
        {t('single.guesses', { current: guesses.length, max: maxGuesses })}
      </div>

      <GuessBoard guesses={guesses} />

      <GuessInputBar characters={characters} onGuess={guess} disabled={status !== 'playing'} />

      <div className="guess-legend">
        <span><i className="legend-correct" />{t('rules.green')}</span>
        <span><i className="legend-close" />{t('rules.yellow')}</span>
        <span><i className="legend-wrong" />{t('rules.gray')}</span>
        <span><i className="legend-arrow">↕</i>{t('rules.arrow')}</span>
      </div>

      {answer && (
        <div className={`answer-overlay ${status === 'won' ? 'win' : 'lose'}`}>
          <div className="answer-card">
            <Trophy size={32} />
            <h2>{status === 'won' ? t('single.won') : t('single.lost')}</h2>
            <p>{answer.name}（{answer.nameJp}）</p>
            <p className="muted">{t('single.usedGuesses', { count: guesses.length })}</p>
            <button className="btn" onClick={() => start('classic')}>{t('single.restart')}</button>
          </div>
        </div>
      )}
    </div>
  );
}
