import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Gamepad2, CalendarDays, Users, BarChart3, Trophy, BookOpen } from 'lucide-react';

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const cards = [
    { to: '/single', icon: Gamepad2, title: t('home.single'), desc: t('home.singleDesc'), tone: 'a' },
    { to: '/daily', icon: CalendarDays, title: t('home.daily'), desc: t('home.dailyDesc'), tone: 'b' },
    { to: '/multi', icon: Users, title: t('home.multi'), desc: t('home.multiDesc'), tone: 'c' },
    { to: '/stats', icon: BarChart3, title: t('home.stats'), desc: '', tone: 'd' },
    { to: '/leaderboard', icon: Trophy, title: t('home.leaderboard'), desc: '', tone: 'e' },
    { to: '/rules', icon: BookOpen, title: t('home.rules'), desc: '', tone: 'f' },
  ];

  return (
    <div className="home">
      <section className="hero">
        <h1>🍊 {t('app.title')}</h1>
        <p>{t('app.subtitle')}</p>
      </section>
      <div className="card-grid">
        {cards.map((c) => (
          <button key={c.to} className={`home-card tone-${c.tone}`} onClick={() => navigate(c.to)}>
            <span className="home-card-icon"><c.icon size={24} /></span>
            <div className="home-card-title">{c.title}</div>
            {c.desc && <div className="home-card-desc">{c.desc}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}
