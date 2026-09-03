import { apiFetch } from "@/lib/api/client";

import type { AuthMeResponse, LoginWithGoogleRequest } from "./types";

export function loginWithGoogle(idToken: string): Promise<void> {
  const body: LoginWithGoogleRequest = { idToken };

  return apiFetch<void>("/api/v1/auth/google", {
    body,
    method: "POST",
  });
}

export function getCurrentUser(): Promise<AuthMeResponse> {
  return apiFetch<AuthMeResponse>("/api/v1/auth/me");
}
