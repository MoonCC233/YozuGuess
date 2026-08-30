import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchMeta, type MetaInfo } from './api.js';

interface MetaContextValue {
  meta: MetaInfo | null;
  error: string | null;
}

const MetaContext = createContext<MetaContextValue>({ meta: null, error: null });

export function MetaProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<MetaInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchMeta()
      .then((m) => {
        if (alive) setMeta(m);
      })
      .catch(() => {
        if (alive) setError('无法加载游戏信息，请确认服务端已启动');
      });
    return () => {
      alive = false;
    };
  }, []);

  const value = useMemo(() => ({ meta, error }), [meta, error]);
  return <MetaContext.Provider value={value}>{children}</MetaContext.Provider>;
}

export function useMeta(): MetaContextValue {
  return useContext(MetaContext);
}

/** 作品短名，meta 未就绪时回退到 key */
export function useTitleLabel(): (title: string) => string {
  const { meta } = useMeta();
  return (title: string) => {
    const entry = meta?.titles?.[title as keyof MetaInfo['titles']];
    return entry ? entry.zh : title;
  };
}
