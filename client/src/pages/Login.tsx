import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { KeyRound } from 'lucide-react';
import Page from '../components/Page';
import { api, errMsg } from '../api/client';
import { useAuth } from '../store/auth';
import { toast } from '../components/Toast';

type Mode = 'login' | 'register';
type Field = 'username' | 'password' | 'confirmPassword' | 'email';
type Errors = Partial<Record<Field, string>>;

const USERNAME_PATTERN = /^[\w一-龥-]{2,20}$/;
const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+$/;

export default function Login() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const setUser = useAuth((s) => s.setUser);
  const navigate = useNavigate();

  const clearError = (field: Field) =>
    setErrors((cur) => {
      if (!cur[field]) return cur;
      const next = { ...cur };
      delete next[field];
      return next;
    });

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next: Errors = {};
    if (!username) next.username = t('auth.usernameRequired');
    else if (!USERNAME_PATTERN.test(username)) next.username = t('auth.usernameInvalid');
    if (!password) next.password = t('auth.passwordRequired');
    else if (password.length < 8 || password.length > 128) next.password = t('auth.passwordLength');
    if (mode === 'register') {
      if (password !== confirmPassword) next.confirmPassword = t('auth.mismatch');
      if (email && !EMAIL_PATTERN.test(email.trim())) next.email = t('auth.emailInvalid');
    }
    setErrors(next);
    if (Object.keys(next).length) {
      (e.currentTarget.elements.namedItem(Object.keys(next)[0]) as HTMLElement | null)?.focus();
      return;
    }
    setLoading(true);
    try {
      const res = await api.post<{ user: import('../store/auth').UserInfo }>(`/auth/${mode}`, {
        username,
        password,
        ...(mode === 'register' && email ? { email } : {}),
      });
      setUser(res.data.user);
      // 登录后认领匿名战绩（失败不阻塞）
      try {
        await api.post('/auth/claim');
      } catch {
        /* 忽略 */
      }
      navigate('/');
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title={mode === 'login' ? t('auth.login') : t('auth.register')} icon={<KeyRound size={17} />}>
      <div className="card auth-card">
        <p className="muted" style={{ textAlign: 'center' }}>{t('auth.description')}</p>
        <form className="form" onSubmit={submit} noValidate>
          <div className="auth-field">
            <input
              className="input"
              name="username"
              placeholder={t('auth.username')}
              value={username}
              autoComplete="username"
              aria-invalid={Boolean(errors.username)}
              onChange={(e) => { setUsername(e.target.value); clearError('username'); }}
            />
            {errors.username && <span className="auth-field-error">{errors.username}</span>}
          </div>
          <div className="auth-field">
            <input
              className="input"
              name="password"
              type="password"
              placeholder={t('auth.password')}
              value={password}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              aria-invalid={Boolean(errors.password)}
              onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
            />
            {errors.password && <span className="auth-field-error">{errors.password}</span>}
          </div>
          {mode === 'register' && (
            <>
              <div className="auth-field">
                <input
                  className="input"
                  name="confirmPassword"
                  type="password"
                  placeholder={t('auth.confirmPassword')}
                  value={confirmPassword}
                  autoComplete="new-password"
                  aria-invalid={Boolean(errors.confirmPassword)}
                  onChange={(e) => { setConfirmPassword(e.target.value); clearError('confirmPassword'); }}
                />
                {errors.confirmPassword && <span className="auth-field-error">{errors.confirmPassword}</span>}
              </div>
              <div className="auth-field">
                <input
                  className="input"
                  name="email"
                  type="email"
                  placeholder={t('auth.emailOptional')}
                  value={email}
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                />
                {errors.email && <span className="auth-field-error">{errors.email}</span>}
              </div>
            </>
          )}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? t('common.loading') : mode === 'login' ? t('auth.login') : t('auth.register')}
          </button>
        </form>
        <button
          className="btn btn-ghost btn-block"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? t('auth.toRegister') : t('auth.toLogin')}
        </button>
      </div>
    </Page>
  );
}
