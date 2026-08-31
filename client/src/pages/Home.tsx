import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { DIFFICULTIES, DIFFICULTY_META } from '@yozu/shared';
import type { Difficulty, GameMode } from '../api.js';
import { useMeta } from '../MetaContext.js';
import { loadSession } from '../storage.js';
import { brandLogo } from '../brandLogo.js';

export function Home() {
  const navigate = useNavigate();
  const { meta, error } = useMeta();
  const [mode, setMode] = useState<GameMode>('free');
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    setHasSaved(loadSession() !== null);
  }, []);

  function start() {
    navigate(`/game?mode=${mode}&difficulty=${difficulty}&fresh=1`);
  }

  return (
    <section className="page home">
      <div className="hero">
        <img className="hero-art" src={brandLogo} alt="" aria-hidden="true" width={104} height={104} />
        <div className="hero-copy">
          <h1 className="title">柚一把</h1>
          <p className="subtitle">在 {meta?.maxGuesses ?? 8} 次机会内猜出柚子社作品中的角色</p>
          <ul className="hero-tags">
            <li className="badge">作品 · 位次 · 发色 · 瞳色</li>
            <li className="badge">年份 · 爆闪 · 声优</li>
            <li className="badge badge-done">共 {meta?.totalCharacters ?? '—'} 位角色</li>
          </ul>
        </div>
      </div>
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
        <div className="choice-group choice-quad" role="radiogroup" aria-label="难度">
          {DIFFICULTIES.map((id) => {
            const info = meta?.difficulties.find((d) => d.id === id) ?? DIFFICULTY_META[id];
            const size = meta?.poolSizes[id];
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={difficulty === id}
                aria-label={`${info.tier} ${info.label}`}
                className={`choice ${difficulty === id ? 'selected' : ''}`}
                onClick={() => setDifficulty(id)}
              >
                <small className="choice-tier">{info.tier}</small>
                <strong className="choice-label">{info.label}</strong>
                <span>
                  {info.desc}
                  {size ? `（${size} 位）` : ''}
                </span>
              </button>
            );
          })}
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
        <button type="button" className="btn" onClick={() => navigate('/multi')}>
          联机对战
        </button>
      </div>
    </section>
  );
}
