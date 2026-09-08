import { afterEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser, loginWithGoogle, logout } from "./api";

describe("auth api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs in with Google by sending id_token and receiving a session", async () => {
    const session = {
      business: { id: 10, name: "Barber Studio", onboarding_status: "COMPLETED", slug: "barber-studio" },
      user: { avatar_url: null, email: "juan@example.com", id: 1, name: "Juan Perez", role: "OWNER" as const },
    };
    const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify(session), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(loginWithGoogle("google-id-token")).resolves.toEqual(session);

    expect(fetchMock).toHaveBeenCalledWith("/api/backend/api/v1/auth/google", {
      body: JSON.stringify({ id_token: "google-id-token" }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
  });

  it("returns the authenticated user from /auth/me", async () => {
    const currentUser = {
      business: { id: 10, name: "Barber Studio", onboarding_status: "COMPLETED", slug: "barber-studio" },
      user: { avatar_url: null, email: "juan@example.com", id: 1, name: "Juan Perez", role: "OWNER" },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(currentUser), {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }),
      ),
    );

    await expect(getCurrentUser()).resolves.toEqual(currentUser);
  });

  it("rejects when the session is invalid or expired", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Invalid session" }), {
          headers: { "Content-Type": "application/json" },
          status: 401,
        }),
      ),
    );

    await expect(getCurrentUser()).rejects.toMatchObject({
      status: 401,
    });
  });

  it("accepts logout with an empty 204 response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    await expect(logout()).resolves.toBeUndefined();
  });
});
