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

import { getCurrentUser, loginWithGoogle } from "@/lib/auth/api";
import { getAuthErrorMessage, isUnauthorizedError } from "@/lib/auth/errors";
import type { AuthMeResponse } from "@/lib/auth/types";

export type AuthStatus = "authenticated" | "error" | "loading" | "unauthenticated";

type AuthContextValue = {
  error: string | null;
  refreshUser: () => Promise<AuthMeResponse | null>;
  signInWithGoogle: (idToken: string) => Promise<AuthMeResponse>;
  status: AuthStatus;
  user: AuthMeResponse | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthMeResponse | null>(null);

  const refreshUser = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const currentUser = await getCurrentUser();

      setUser(currentUser);
      setStatus("authenticated");

      return currentUser;
    } catch (refreshError) {
      setUser(null);
      setError(getAuthErrorMessage(refreshError));
      setStatus(isUnauthorizedError(refreshError) ? "unauthenticated" : "error");

      return null;
    }
  }, []);

  const signInWithGoogle = useCallback(async (idToken: string) => {
    setStatus("loading");
    setError(null);

    try {
      await loginWithGoogle(idToken);

      const currentUser = await getCurrentUser();

      setUser(currentUser);
      setStatus("authenticated");

      return currentUser;
    } catch (loginError) {
      setUser(null);
      setError(getAuthErrorMessage(loginError));
      setStatus(isUnauthorizedError(loginError) ? "unauthenticated" : "error");

      throw loginError;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialUser() {
      try {
        const currentUser = await getCurrentUser();

        if (!isMounted) {
          return;
        }

        setUser(currentUser);
        setStatus("authenticated");
      } catch (refreshError) {
        if (!isMounted) {
          return;
        }

        setUser(null);
        setError(getAuthErrorMessage(refreshError));
        setStatus(isUnauthorizedError(refreshError) ? "unauthenticated" : "error");
      }
    }

    void loadInitialUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      error,
      refreshUser,
      signInWithGoogle,
      status,
      user,
    }),
    [error, refreshUser, signInWithGoogle, status, user],
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
