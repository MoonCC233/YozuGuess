import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, LogIn } from 'lucide-react';
import { getSocket } from '../socket';

export default function MultiLobby() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState(localStorage.getItem('yozu-name') || '');
  const [code, setCode] = useState('');
  const [boType, setBoType] = useState(3);
  const [gameMode, setGameMode] = useState<'bo' | 'relay'>('bo');
  const [roundDuration, setRoundDuration] = useState(120);
  const [asSpectator, setAsSpectator] = useState(false);
  const [error, setError] = useState('');

  const persistName = (v: string) => {
    setName(v);
    localStorage.setItem('yozu-name', v);
  };

  const create = () => {
    if (!name.trim()) return setError('请填写昵称');
    const socket = getSocket();
    socket.emit('room:create', { name, boType, gameMode, roundDurationMs: roundDuration * 1000 }, (res: any) => {
      if (res?.error) return setError(res.error);
      navigate(`/multi/${res.code}`);
    });
  };

  const join = () => {
    if (!name.trim()) return setError('请填写昵称');
    if (code.length !== 5) return setError('房间码为 5 位');
    const socket = getSocket();
    socket.emit('room:join', { code: code.toUpperCase(), name, asSpectator }, (res: any) => {
      if (res?.error) return setError(res.error);
      navigate(`/multi/${res.code}`);
    });
  };

  return (
    <div className="page multi-lobby">
      <h1>{t('nav.multi')}</h1>
      <div className="lobby-form">
        <label>{t('multi.name')}</label>
        <input value={name} onChange={(e) => persistName(e.target.value)} placeholder={t('multi.name')} />

        <label>{t('multi.boType')}</label>
        <select value={boType} onChange={(e) => setBoType(Number(e.target.value))}>
          <option value={1}>BO1</option>
          <option value={3}>BO3</option>
          <option value={5}>BO5</option>
          <option value={7}>BO7</option>
        </select>

        <label>{t('multi.roundDuration')}</label>
        <input type="number" value={roundDuration} min={30} max={300} onChange={(e) => setRoundDuration(Number(e.target.value))} />

        <div className="lobby-buttons">
          <button className="btn btn-primary" onClick={create}><Plus size={16} /> {t('multi.create')}</button>
        </div>

        <div className="lobby-divider">— 或 —</div>

        <label>{t('multi.code')}</label>
        <input value={code} maxLength={5} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="ABCDE" />

        <label className="lobby-check">
          <input type="checkbox" checked={asSpectator} onChange={(e) => setAsSpectator(e.target.checked)} />
          {t('multi.spectate')}
        </label>

        <button className="btn" onClick={join}><LogIn size={16} /> {t('multi.join')}</button>

        {error && <div className="lobby-error">{error}</div>}
      </div>
    </div>
  );
}
