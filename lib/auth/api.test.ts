import { afterEach, describe, expect, it, vi } from "vitest";

import { getCurrentUser, loginWithGoogle } from "./api";

describe("auth api", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("logs in with Google by sending the idToken and accepting an empty body", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.turnero.test");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("", {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(loginWithGoogle("google-id-token")).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith("https://api.turnero.test/api/v1/auth/google", {
      body: JSON.stringify({ idToken: "google-id-token" }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
  });

  it("returns the authenticated user from /auth/me", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.turnero.test");
    const currentUser = {
      businessId: 10,
      businessName: "Barber Studio",
      businessSlug: "barber-studio",
      email: "juan@example.com",
      name: "Juan Perez",
      role: "ADMIN",
      userId: 1,
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
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.turnero.test");
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
});
