import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../api.js';
import { useAuth } from '../AuthContext.js';
import { errorMessage } from '../errors.js';
import { Toast } from '../components/Toast.js';

type Tab = 'login' | 'register';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp } = useAuth();
  const initialTab: Tab = location.pathname === '/register' ? 'register' : 'login';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const name = username.trim();
    if (name === '') {
      setToast('请填写用户名');
      return;
    }
    if (password === '') {
      setToast('请填写密码');
      return;
    }
    if (tab === 'register' && password !== confirm) {
      setToast('两次输入的密码不一致');
      return;
    }
    setBusy(true);
    try {
      if (tab === 'register') await signUp(name, password);
      else await signIn(name, password);
      navigate('/me');
    } catch (err) {
      setToast(err instanceof ApiError ? errorMessage(err.code) : '请求失败，请检查网络');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page auth">
      <h1 className="title">{tab === 'register' ? '注册账号' : '登录'}</h1>
      <p className="subtitle">登录后自动记录战绩，未登录也能照常游玩</p>

      <div className="card">
        <div className="choice-group choice-row" role="tablist" aria-label="登录或注册">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'login'}
            className={`choice choice-sm ${tab === 'login' ? 'selected' : ''}`}
            onClick={() => setTab('login')}
          >
            <strong>登录</strong>
            <span>已有账号</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'register'}
            className={`choice choice-sm ${tab === 'register' ? 'selected' : ''}`}
            onClick={() => setTab('register')}
          >
            <strong>注册</strong>
            <span>新建一个</span>
          </button>
        </div>

        <form className="form" onSubmit={(e) => void onSubmit(e)}>
          <label className="field">
            <span className="field-label">用户名</span>
            <input
              className="text-input"
              type="text"
              autoComplete="username"
              maxLength={16}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label className="field">
            <span className="field-label">密码</span>
            <input
              className="text-input"
              type="password"
              autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {tab === 'register' ? (
            <>
              <label className="field">
                <span className="field-label">确认密码</span>
                <input
                  className="text-input"
                  type="password"
                  autoComplete="new-password"
                  maxLength={128}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </label>
              <p className="muted">用户名 2-16 位，密码至少 8 位。</p>
            </>
          ) : null}
          <div className="actions">
            <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
              {tab === 'register' ? '注册并登录' : '登录'}
            </button>
          </div>
        </form>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </section>
  );
}
