import { useTranslation } from 'react-i18next';
import { ArrowUp, ArrowDown, Target } from 'lucide-react';

export default function Rules() {
  const { t } = useTranslation();
  return (
    <div className="page rules-page">
      <h1>{t('rules.title')}</h1>
      <p className="rules-desc">{t('rules.desc')}</p>

      <div className="rule-quick-guide">
        <div className="rule-feedback rule-feedback-correct">
          <span className="rule-color-swatch" />
          <div><strong>{t('rules.green')}</strong><span>{t('rules.greenText')}</span></div>
        </div>
        <div className="rule-feedback rule-feedback-close">
          <span className="rule-color-swatch" />
          <div><strong>{t('rules.yellow')}</strong><span>{t('rules.yellowText')}</span></div>
        </div>
        <div className="rule-feedback rule-feedback-wrong">
          <span className="rule-color-swatch" />
          <div><strong>{t('rules.gray')}</strong><span>{t('rules.grayText')}</span></div>
        </div>
        <div className="rule-feedback rule-feedback-arrow">
          <span className="rule-arrow-pair"><ArrowUp size={16} /><ArrowDown size={16} /></span>
          <div><strong>{t('rules.arrow')}</strong><span>{t('rules.arrowText')}</span></div>
        </div>
      </div>

      <div className="guess-limit">
        <span>{t('rules.max')}</span> {t('rules.guesses')}
      </div>

      <div className="rule-panels">
        <article className="rule-panel">
          <div className="rule-panel-title"><Target size={18} /> {t('rules.columns.title')} / {t('rules.columns.hair')} / {t('rules.columns.eyes')}</div>
          <p>完全一致才显示绿色；否则灰色。</p>
        </article>
        <article className="rule-panel">
          <div className="rule-panel-title"><Target size={18} /> {t('rules.columns.rank')} / {t('rules.columns.titleYear')} / {t('rules.columns.bakusen')}</div>
          <p>数值相差在阈值内显示黄色并带方向箭头；差距过大显示灰色。</p>
        </article>
      </div>
    </div>
  );
}
