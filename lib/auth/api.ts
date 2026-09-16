import { apiFetch } from "@/lib/api/client";

import type { AuthSession, LoginWithGoogleRequest } from "./types";

export function loginWithGoogle(idToken: string): Promise<AuthSession> {
  const body: LoginWithGoogleRequest = { id_token: idToken };

  return apiFetch<AuthSession>("/api/v1/auth/google", {
    body,
    method: "POST",
  });
}

export function getCurrentUser(): Promise<AuthSession> {
  return apiFetch<AuthSession>("/api/v1/auth/me");
}

export function logout(): Promise<void> {
  return apiFetch<void>("/api/v1/auth/logout", { method: "POST" });
}
