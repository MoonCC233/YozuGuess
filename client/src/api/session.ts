import { api, errMsg } from './client';
import { useAuth } from '../store/auth';
import { toast } from '../components/Toast';

let sessionRequest: Promise<void> | null = null;

interface SessionResponse {
  authenticated: boolean;
  user?: import('../store/auth').UserInfo;
  guest?: { name: string };
}

/** 应用启动时调用：恢复登录态或确保有访客身份 */
export function initializeIdentity(): Promise<void> {
  if (sessionRequest) return sessionRequest;
  sessionRequest = (async () => {
    const auth = useAuth.getState();
    try {
      const res = await api.post<SessionResponse>('/auth/session');
      if (res.data.authenticated && res.data.user) {
        auth.setUser(res.data.user);
      } else {
        auth.setUser(null);
      }
    } catch (error) {
      auth.setUser(null);
      toast.error(errMsg(error));
    } finally {
      auth.setInitialized();
    }
  })();
  return sessionRequest;
}
