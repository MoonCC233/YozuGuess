import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';
import { api } from '../api';

export default function Leaderboard() {
  const { t } = useTranslation();
  const [list, setList] = useState<Array<{ name: string; wins: number; plays: number }>>([]);

  useEffect(() => {
    api.leaderboard().then(setList).catch(() => {});
  }, []);

  return (
    <div className="page">
      <h1>{t('nav.leaderboard')}</h1>
      {list.length === 0 ? (
        <p className="muted">还没有记录，去玩一局吧！</p>
      ) : (
        <table className="leaderboard-table">
          <thead>
            <tr><th>#</th><th>{t('multi.name')}</th><th>{t('common.win')}</th><th>场次</th><th>胜率</th></tr>
          </thead>
          <tbody>
            {list.map((row, i) => (
              <tr key={row.name}>
                <td><Trophy size={14} className={i < 3 ? `rank-${i + 1}` : ''} /> {i + 1}</td>
                <td>{row.name}</td>
                <td>{row.wins}</td>
                <td>{row.plays}</td>
                <td>{row.plays ? Math.round((row.wins / row.plays) * 100) : 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
