"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { getCurrentUser, loginWithGoogle, logout } from "@/lib/auth/api";
import { getAuthErrorMessage, isForbiddenError, isUnauthorizedError } from "@/lib/auth/errors";
import type { AuthSession } from "@/lib/auth/types";

export type AuthStatus = "authenticated" | "error" | "forbidden" | "loading" | "unauthenticated";

type AuthContextValue = {
  error: string | null;
  refreshUser: () => Promise<AuthSession | null>;
  signInWithGoogle: (idToken: string) => Promise<AuthSession>;
  signOut: () => Promise<void>;
  status: AuthStatus;
  user: AuthSession["user"] | null;
  business: AuthSession["business"] | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthSession["user"] | null>(null);
  const [business, setBusiness] = useState<AuthSession["business"] | null>(null);

  const applySession = useCallback((session: AuthSession) => {
    setUser(session.user);
    setBusiness(session.business);
    setStatus("authenticated");
  }, []);

  const handleAuthError = useCallback((authError: unknown) => {
    setError(getAuthErrorMessage(authError));
    if (isUnauthorizedError(authError)) {
      setUser(null);
      setBusiness(null);
      setStatus("unauthenticated");
    } else if (isForbiddenError(authError)) {
      setStatus("forbidden");
    } else {
      setStatus("error");
    }
  }, []);

  const refreshUser = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const session = await getCurrentUser();
      applySession(session);
      return session;
    } catch (refreshError) {
      handleAuthError(refreshError);
      return null;
    }
  }, [applySession, handleAuthError]);

  const signInWithGoogle = useCallback(async (idToken: string) => {
    setStatus("loading");
    setError(null);

    try {
      const session = await loginWithGoogle(idToken);
      applySession(session);
      return session;
    } catch (loginError) {
      handleAuthError(loginError);
      throw loginError;
    }
  }, [applySession, handleAuthError]);

  const signOut = useCallback(async () => {
    try { await logout(); } catch { /* Expired sessions are already effectively signed out. */ }
    setUser(null);
    setBusiness(null);
    setError(null);
    setStatus("unauthenticated");
    router.replace("/login");
  }, [router]);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialUser() {
      try {
        const session = await getCurrentUser();

        if (!isMounted) {
          return;
        }

        applySession(session);
      } catch (refreshError) {
        if (!isMounted) {
          return;
        }

        handleAuthError(refreshError);
      }
    }

    void loadInitialUser();

    return () => {
      isMounted = false;
    };
  }, [applySession, handleAuthError]);

  const value = useMemo(
    () => ({
      business,
      error,
      refreshUser,
      signInWithGoogle,
      signOut,
      status,
      user,
    }),
    [business, error, refreshUser, signInWithGoogle, signOut, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
