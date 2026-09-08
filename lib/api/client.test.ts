import { afterEach, describe, expect, it, vi } from "vitest";

import { apiFetch } from "./client";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe("apiFetch", () => {
  it("uses the same-origin BFF and includes credentials", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [] }), {
        headers: { "content-type": "application/json" },
      }),
    );
    global.fetch = fetchMock;

    const response = await apiFetch<{ data: unknown[] }>("/api/v1/customers?page=0", {
      body: { name: "Ana" },
      method: "POST",
    });

    expect(response).toEqual({ data: [] });
    expect(fetchMock).toHaveBeenCalledWith("/api/backend/api/v1/customers?page=0", {
      body: JSON.stringify({ name: "Ana" }),
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      method: "POST",
    });
  });

  it("returns undefined for successful empty responses", async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));

    await expect(apiFetch<void>("/api/v1/auth/logout", { method: "POST" })).resolves.toBeUndefined();
  });

  it("exposes normalized API errors", async () => {
    global.fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ code: "UPSTREAM_TIMEOUT", details: [], message: "Intenta nuevamente." }),
        { headers: { "content-type": "application/json" }, status: 504 },
      ),
    );

    await expect(apiFetch("/api/v1/auth/me")).rejects.toMatchObject({
      code: "UPSTREAM_TIMEOUT",
      details: [],
      message: "Intenta nuevamente.",
      status: 504,
    });
  });

  it("rejects endpoints outside the API namespace or absolute URLs", async () => {
    await expect(apiFetch("/api/backend/api/v1/auth/me")).rejects.toThrow(
      "/api/v1/",
    );
    await expect(apiFetch("https://example.com/api/v1/auth/me")).rejects.toThrow(
      "/api/v1/",
    );
    await expect(apiFetch("/api/v1/auth/me#fragment")).rejects.toThrow("same-origin");
  });
});
