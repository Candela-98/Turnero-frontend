import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/backend/[...path]/route";

const originalFetch = global.fetch;

function routeContext(path: string[]) {
  return { params: Promise.resolve({ path }) };
}

afterEach(() => {
  global.fetch = originalFetch;
  vi.unstubAllEnvs();
});

describe("BFF route handler", () => {
  it("forwards allowed requests, query params and required headers to the private backend", async () => {
    vi.stubEnv("TURNERO_API_BASE_URL", "http://localhost:8080");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ user: { id: 1 } }), {
        headers: { "content-type": "application/json", "x-request-id": "req-123" },
      }),
    );
    global.fetch = fetchMock;

    const response = await GET(
      new Request("http://localhost:3000/api/backend/api/v1/auth/me?include=business", {
        headers: {
          accept: "application/json",
          cookie: "turnero_session=opaque",
          "user-agent": "Vitest",
        },
      }),
      routeContext(["api", "v1", "auth", "me"]),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user: { id: 1 } });
    expect(response.headers.get("x-request-id")).toBe("req-123");

    const [target, options] = fetchMock.mock.calls[0] ?? [];
    expect(target.toString()).toBe("http://localhost:8080/api/v1/auth/me?include=business");
    expect(options).toMatchObject({ method: "GET", cache: "no-store" });
    expect(options.headers.get("cookie")).toBe("turnero_session=opaque");
    expect(options.headers.get("accept")).toBe("application/json");
  });

  it("preserves multiple session cookies from the upstream response", async () => {
    vi.stubEnv("TURNERO_API_BASE_URL", "http://localhost:8080");
    const upstreamHeaders = new Headers({ "content-type": "application/json" });
    upstreamHeaders.append("set-cookie", "turnero_session=one; HttpOnly; Path=/");
    upstreamHeaders.append("set-cookie", "csrf=two; Path=/");
    global.fetch = vi.fn().mockResolvedValue(new Response("{}", { headers: upstreamHeaders }));

    const response = await GET(
      new Request("http://localhost:3000/api/backend/api/v1/auth/google", {
        body: JSON.stringify({ id_token: "google-token" }),
        headers: { "content-type": "application/json" },
        method: "POST",
      }),
      routeContext(["api", "v1", "auth", "google"]),
    );
    const cookies = (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie?.() ?? [];

    expect(response.status).toBe(200);
    expect(cookies).toEqual([
      "turnero_session=one; HttpOnly; Path=/",
      "csrf=two; Path=/",
    ]);
  });

  it("rejects unknown routes and unsupported methods before calling the backend", async () => {
    vi.stubEnv("TURNERO_API_BASE_URL", "http://localhost:8080");
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    const unknownRoute = await GET(
      new Request("http://localhost:3000/api/backend/api/v1/private/secrets"),
      routeContext(["api", "v1", "private", "secrets"]),
    );
    const unsupportedMethod = await GET(
      new Request("http://localhost:3000/api/backend/api/v1/auth/logout"),
      routeContext(["api", "v1", "auth", "logout"]),
    );

    expect(unknownRoute.status).toBe(404);
    expect((await unknownRoute.json()).code).toBe("BFF_ROUTE_NOT_FOUND");
    expect(unsupportedMethod.status).toBe(405);
    expect(unsupportedMethod.headers.get("allow")).toBe("POST");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("normalizes unavailable and timed-out upstreams without leaking backend configuration", async () => {
    vi.stubEnv("TURNERO_API_BASE_URL", "");
    const fetchMock = vi.fn();
    global.fetch = fetchMock;

    const unconfigured = await GET(
      new Request("http://localhost:3000/api/backend/api/v1/auth/me"),
      routeContext(["api", "v1", "auth", "me"]),
    );

    expect(unconfigured.status).toBe(502);
    expect((await unconfigured.json()).code).toBe("UPSTREAM_UNAVAILABLE");
    expect(fetchMock).not.toHaveBeenCalled();

    vi.stubEnv("TURNERO_API_BASE_URL", "http://localhost:8080");
    global.fetch = vi.fn().mockRejectedValueOnce(new TypeError("connection refused"));

    const unavailable = await GET(
      new Request("http://localhost:3000/api/backend/api/v1/auth/me"),
      routeContext(["api", "v1", "auth", "me"]),
    );

    global.fetch = vi.fn().mockRejectedValueOnce(new DOMException("aborted", "AbortError"));
    const timedOut = await GET(
      new Request("http://localhost:3000/api/backend/api/v1/auth/me"),
      routeContext(["api", "v1", "auth", "me"]),
    );

    expect(unavailable.status).toBe(502);
    expect((await unavailable.json()).code).toBe("UPSTREAM_UNAVAILABLE");
    expect(timedOut.status).toBe(504);
    expect((await timedOut.json()).code).toBe("UPSTREAM_TIMEOUT");
  });
});
