import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Trophy } from 'lucide-react';
import { api } from '../api';
import GuessBoard from '../components/GuessBoard';
import type { ReplayRecord } from '../types';

export default function Replay() {
  const { id = '' } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [replay, setReplay] = useState<ReplayRecord | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getReplay(id).then(setReplay).catch(() => setError('REPLAY_NOT_FOUND'));
  }, [id]);

  if (error) {
    return (
      <div className="page">
        <button className="btn btn-ghost" onClick={() => navigate('/stats')}><ArrowLeft size={16} /> {t('nav.stats')}</button>
        <p className="muted">{t('stats.noReplays')}</p>
      </div>
    );
  }

  if (!replay) return <div className="page"><p>{t('common.loading')}</p></div>;

  return (
    <div className="page single-game replay-page">
      <div className="game-header">
        <h1>{t('stats.replayTitle')}</h1>
        <button className="btn btn-ghost" onClick={() => navigate('/stats')}><ArrowLeft size={16} /> {t('nav.stats')}</button>
      </div>

      <div className="replay-meta">
        <span className={`replay-badge ${replay.status}`}>{replay.status === 'won' ? '✅' : '❌'}</span>
        <span>{t(`stats.mode.${replay.mode}`)}</span>
        <span>{replay.date}</span>
        <span>{t('stats.guessCount', { n: replay.guessCount })}</span>
      </div>

      <GuessBoard guesses={replay.guesses} />

      {replay.answer && (
        <div className={`answer-overlay static ${replay.status === 'won' ? 'win' : 'lose'}`}>
          <div className="answer-card">
            <Trophy size={28} />
            <h2>{replay.status === 'won' ? t('single.won') : t('single.lost')}</h2>
            <p>{replay.answer.name}（{replay.answer.nameJp}）</p>
            <p className="muted">{t('stats.targetOf', { title: replay.answer.title })}</p>
          </div>
        </div>
      )}
    </div>
  );
}
