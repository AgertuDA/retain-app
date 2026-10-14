import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, tokenStore } from '../lib/api';
import type { AuthResponse, User } from '../types';

interface AuthContextValue {
  user: User | null;
  /** True while the stored session is being verified on first load. */
  loading: boolean;
  isAdmin: boolean;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(() => tokenStore.get() !== null);

  // Restore the session from a stored token.
  useEffect(() => {
    if (!tokenStore.get()) return;
    api
      .me()
      .then((res) => setUser(res.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const accept = useCallback((res: AuthResponse) => {
    tokenStore.set(res.token);
    setUser(res.user);
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => accept(await api.register({ name, email, password })), [accept]);
  const signIn = useCallback(async (email: string, password: string) => accept(await api.login({ email, password })), [accept]);
  const signOut = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, isAdmin: user?.role === 'admin', signUp, signIn, signOut }),
    [user, loading, signUp, signIn, signOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
