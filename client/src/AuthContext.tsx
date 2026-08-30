import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  fetchMe,
  loginAccount,
  logoutAccount,
  registerAccount,
  type AccountUser,
} from './api.js';

interface AuthContextValue {
  user: AccountUser | null;
  /** 首次拉取 /auth/me 是否还在进行，用于避免顶栏闪烁 */
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 会话在 httpOnly cookie 里，前端读不到，只能问服务端当前是谁
  useEffect(() => {
    let alive = true;
    fetchMe()
      .then((res) => {
        if (alive) setUser(res.user);
      })
      .catch(() => {
        if (alive) setUser(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    const res = await loginAccount(username, password);
    setUser(res.user);
  }, []);

  const signUp = useCallback(async (username: string, password: string) => {
    const res = await registerAccount(username, password);
    setUser(res.user);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutAccount();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, signIn, signUp, signOut }),
    [user, loading, signIn, signUp, signOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
