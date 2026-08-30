import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Difficulty, GameMode } from '../api.js';
import { useMeta } from '../MetaContext.js';
import { loadSession } from '../storage.js';

export function Home() {
  const navigate = useNavigate();
  const { meta, error } = useMeta();
  const [mode, setMode] = useState<GameMode>('free');
  const [difficulty, setDifficulty] = useState<Difficulty>('heroine');
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    setHasSaved(loadSession() !== null);
  }, []);

  function start() {
    navigate(`/game?mode=${mode}&difficulty=${difficulty}&fresh=1`);
  }

  return (
    <section className="page home">
      <h1 className="title">柚一把</h1>
      <p className="subtitle">在 {meta?.maxGuesses ?? 8} 次机会内猜出柚子社作品中的角色</p>
      {error ? <p className="alert">{error}</p> : null}

      <div className="card">
        <h2>玩法模式</h2>
        <div className="choice-group" role="radiogroup" aria-label="玩法模式">
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'free'}
            className={`choice ${mode === 'free' ? 'selected' : ''}`}
            onClick={() => setMode('free')}
          >
            <strong>自由练习</strong>
            <span>每局随机抽取角色，想玩多少局都行</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={mode === 'daily'}
            className={`choice ${mode === 'daily' ? 'selected' : ''}`}
            onClick={() => setMode('daily')}
          >
            <strong>每日一柚</strong>
            <span>全网当天同一个答案，次日更新</span>
          </button>
        </div>
      </div>

      <div className="card">
        <h2>难度</h2>
        <div className="choice-group" role="radiogroup" aria-label="难度">
          <button
            type="button"
            role="radio"
            aria-checked={difficulty === 'heroine'}
            className={`choice ${difficulty === 'heroine' ? 'selected' : ''}`}
            onClick={() => setDifficulty('heroine')}
          >
            <strong>简单版</strong>
            <span>只从可攻略女主角中抽取{meta ? `（${meta.poolSizes.heroine} 位）` : ''}</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={difficulty === 'full'}
            className={`choice ${difficulty === 'full' ? 'selected' : ''}`}
            onClick={() => setDifficulty('full')}
          >
            <strong>完整版</strong>
            <span>全部角色，含男主角与配角{meta ? `（${meta.poolSizes.full} 位）` : ''}</span>
          </button>
        </div>
      </div>

      <div className="actions">
        <button type="button" className="btn btn-primary btn-lg" onClick={start}>
          开始游戏
        </button>
        {hasSaved ? (
          <button type="button" className="btn" onClick={() => navigate('/game')}>
            继续上一局
          </button>
        ) : null}
      </div>
    </section>
  );
}
