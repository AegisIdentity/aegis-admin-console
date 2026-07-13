import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from 'oidc-client-ts';
import { userManager } from './userManager';

export interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** Display name derived from the id_token profile. */
  displayName: string;
  /** Tenant slug from the token's `tenant` claim, if present. */
  tenant: string | null;
  login: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    userManager
      .getUser()
      .then((u) => active && setUser(u))
      .finally(() => active && setIsLoading(false));

    const onLoaded = (u: User) => setUser(u);
    const onUnloaded = () => setUser(null);
    userManager.events.addUserLoaded(onLoaded);
    userManager.events.addUserUnloaded(onUnloaded);
    return () => {
      active = false;
      userManager.events.removeUserLoaded(onLoaded);
      userManager.events.removeUserUnloaded(onUnloaded);
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const profile = user?.profile;
    return {
      user,
      isLoading,
      isAuthenticated: !!user && !user.expired,
      displayName:
        (profile?.name as string) ??
        (profile?.preferred_username as string) ??
        (profile?.sub as string) ??
        'Signed-in user',
      tenant: (profile?.tenant as string | undefined) ?? null,
      login: () => void userManager.signinRedirect(),
      logout: () => void userManager.signoutRedirect(),
    };
  }, [user, isLoading]);

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
