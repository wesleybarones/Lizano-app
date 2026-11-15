import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './lib/api';

const Ctx = createContext(null);
export const useStore = () => useContext(Ctx);

/* Sessão + dados da marca. Recarrega sozinho quando algo muda (tempo real). */
export function StoreProvider({ children }) {
  const [me, setMe] = useState(undefined); // undefined = carregando, null = sem login
  const [data, setData] = useState({ pieces: [], kits: [], resellers: [], loaded: false });
  const timer = useRef();

  useEffect(() => {
    api.auth.current().then(setMe).catch(() => setMe(null));
  }, []);

  const reload = useCallback(async () => {
    if (!me) return;
    const admin = me.role === 'admin';
    try {
      const [pieces, kits, resellers] = await Promise.all([
        api.pieces.list(),
        api.kits.list(),
        admin ? api.resellers.list() : Promise.resolve([]),
      ]);
      setData({ pieces, kits, resellers, loaded: true });
    } catch (e) {
      // sessão trocada ou sem conexão: mantém os dados e tenta de novo na próxima mudança
      console.warn('Falha ao recarregar dados:', e.message);
    }
  }, [me]);

  useEffect(() => {
    if (!me) return undefined;
    reload();
    return api.subscribe(() => {
      clearTimeout(timer.current);
      timer.current = setTimeout(reload, 250);
    });
  }, [me, reload]);

  const value = useMemo(
    () => ({
      me,
      ...data,
      reload,
      async signIn(login, password) {
        const m = await api.auth.signIn(login, password);
        setData({ pieces: [], kits: [], resellers: [], loaded: false });
        setMe(m);
      },
      async signOut() {
        await api.auth.signOut();
        setMe(null);
      },
      async refreshMe() {
        setMe(await api.auth.current());
      },
    }),
    [me, data, reload],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Executa uma ação, recarrega os dados e devolve erro legível
export function useAction() {
  const { reload } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = useCallback(
    async (fn) => {
      setBusy(true);
      setError('');
      try {
        const r = await fn();
        await reload();
        return r ?? true;
      } catch (e) {
        setError(e.message || 'Algo deu errado. Tente de novo.');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [reload],
  );
  return { busy, error, setError, run };
}
