import { afterEach, describe, expect, it, vi } from "vitest";

import { apiFetch, ApiError } from "./client";

describe("apiFetch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("uses the configured backend URL and includes credentials", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.turnero.test");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetch<{ ok: boolean }>("/api/v1/auth/me");

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith("https://api.turnero.test/api/v1/auth/me", {
      body: undefined,
      credentials: "include",
      headers: {},
      method: "GET",
    });
  });

  it("returns undefined for an empty successful JSON response", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.turnero.test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("", {
          headers: { "Content-Type": "application/json" },
          status: 200,
        }),
      ),
    );

    await expect(apiFetch<void>("/api/v1/auth/google", { method: "POST" })).resolves.toBeUndefined();
  });

  it("throws ApiError for unsuccessful responses", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.turnero.test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Invalid session" }), {
          headers: { "Content-Type": "application/json" },
          status: 401,
          statusText: "Unauthorized",
        }),
      ),
    );

    await expect(apiFetch("/api/v1/auth/me")).rejects.toMatchObject({
      body: { message: "Invalid session" },
      status: 401,
      statusText: "Unauthorized",
    } satisfies Partial<ApiError>);
  });
});
