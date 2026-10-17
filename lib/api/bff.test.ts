import { afterEach, describe, expect, it, vi } from "vitest";

import { DELETE, GET, POST, PATCH, PUT } from "@/app/api/backend/[...path]/route";

const originalFetch = global.fetch;

function routeContext(path: string[]) {
  return { params: Promise.resolve({ path }) };
}

afterEach(() => {
  global.fetch = originalFetch;
  vi.unstubAllEnvs();
});

describe("BFF route handler", () => {
  it.each([204, 404, 409])("forwards catalog removal and preserves backend status %i", async status => {
    vi.stubEnv("TURNERO_API_BASE_URL", "http://localhost:8080");
    const fetchMock = vi.fn().mockResolvedValue(new Response(status === 204 ? null : JSON.stringify({ message: "Rejected" }), {
      status, headers: { "content-type": "application/json" },
    }));
    global.fetch = fetchMock;
    const response = await DELETE(new Request("http://localhost:3000/api/backend/api/v1/service-offerings/5/catalog", {
      method: "DELETE", headers: { cookie: "turnero_session=opaque" },
    }), routeContext(["api", "v1", "service-offerings", "5", "catalog"]));
    expect(response.status).toBe(status);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [target, options] = fetchMock.mock.calls[0];
    expect(target.toString()).toBe("http://localhost:8080/api/v1/service-offerings/5/catalog");
    expect(options.method).toBe("DELETE");
    expect(options.headers.get("cookie")).toBe("turnero_session=opaque");
    if (status === 204) expect(await response.text()).toBe("");
    else expect(await response.json()).toEqual({ message: "Rejected" });
  });

  it("rejects unsupported catalog methods and malformed IDs without calling upstream", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock;
    const read = await GET(new Request("http://localhost:3000/api/backend/api/v1/service-offerings/5/catalog"), routeContext(["api", "v1", "service-offerings", "5", "catalog"]));
    expect(read.status).toBe(405);
    expect(read.headers.get("allow")).toBe("DELETE");
    const malformed = await DELETE(new Request("http://localhost:3000/api/backend/api/v1/service-offerings/invalid/catalog", { method: "DELETE" }), routeContext(["api", "v1", "service-offerings", "invalid", "catalog"]));
    expect(malformed.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

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

it.each([200, 400, 401, 503])("forwards staff listing through the actual handler with filters, cookies and status %i", async status => {
  vi.stubEnv("TURNERO_API_BASE_URL", "http://localhost:8080");
  const body = status === 200 ? { data: [], page: { number: 2, size: 20, total_elements: 0, total_pages: 0 } } : { message: "Rejected" };
  const fetchMock = vi.fn().mockResolvedValue(Response.json(body, { status }));
  global.fetch = fetchMock;
  const query = "q=Ana+%26+color&status=ACTIVE&page=2&size=20&sort=name%2Cdesc";
  const response = await GET(new Request(`http://localhost:3000/api/backend/api/v1/staff-members?${query}`, {
    headers: { cookie: "turnero_session=opaque" },
  }), routeContext(["api", "v1", "staff-members"]));
  expect(response.status).toBe(status);
  expect(await response.json()).toEqual(body);
  const [target, options] = fetchMock.mock.calls[0];
  expect(target.toString()).toBe(`http://localhost:8080/api/v1/staff-members?${query}`);
  expect(options.method).toBe("GET");
  expect(options.headers.get("cookie")).toBe("turnero_session=opaque");
});

it.each([
  ["GET", "/5", 200], ["GET", "/5", 404], ["POST", "", 201], ["POST", "", 409], ["PATCH", "/5", 200], ["PATCH", "/5", 400],
] as const)("forwards staff editor %s %s and preserves status %i", async (method, suffix, status) => {
  vi.stubEnv("TURNERO_API_BASE_URL", "http://localhost:8080");
  const body = { name: "Ana", role_label: "", specialty: "Color", ...(method === "POST" ? { user_id: 1 } : {}) };
  const responseBody = status === 409 ? { code: "STAFF_USER_ALREADY_LINKED" } : { id: 5 };
  const fetch = vi.fn().mockResolvedValue(Response.json(responseBody, { status }));
  global.fetch = fetch;
  const handler = { GET, POST, PATCH }[method];
  const response = await handler(new Request(`http://localhost:3000/api/backend/api/v1/staff-members${suffix}`, {
    method, headers: { cookie: "turnero_session=opaque", "content-type": "application/json" },
    ...(method === "GET" ? {} : { body: JSON.stringify(body) }),
  }), routeContext(["api", "v1", "staff-members", ...(suffix ? ["5"] : [])]));
  expect(response.status).toBe(status);
  expect(await response.json()).toEqual(responseBody);
  const [target, options] = fetch.mock.calls[0];
  expect(target.toString()).toBe(`http://localhost:8080/api/v1/staff-members${suffix}`);
  expect(options.method).toBe(method);
  expect(options.headers.get("cookie")).toBe("turnero_session=opaque");
  if (method !== "GET") expect(new TextDecoder().decode(options.body)).toBe(JSON.stringify(body));
});

it("forwards the authenticated current staff lookup and permits only GET", async () => {
  vi.stubEnv("TURNERO_API_BASE_URL", "http://localhost:8080");
  const fetch = vi.fn().mockResolvedValue(Response.json({ staff_member: null }));
  global.fetch = fetch;
  const context = routeContext(["api", "v1", "staff-members", "me"]);
  const response = await GET(new Request("http://localhost:3000/api/backend/api/v1/staff-members/me", { headers: { cookie: "turnero_session=opaque" } }), context);
  expect(await response.json()).toEqual({ staff_member: null });
  const [target, options] = fetch.mock.calls[0];
  expect(target.toString()).toBe("http://localhost:8080/api/v1/staff-members/me");
  expect(options.headers.get("cookie")).toBe("turnero_session=opaque");
  const rejected = await PATCH(new Request("http://localhost:3000/api/backend/api/v1/staff-members/me", { method: "PATCH" }), context);
  expect(rejected.status).toBe(405);
  expect(fetch).toHaveBeenCalledTimes(1);
});


it.each([["GET", 200], ["GET", 404], ["PUT", 204], ["PUT", 400], ["PUT", 401], ["PUT", 404], ["PUT", 409], ["PUT", 503]] as const)("forwards staff services %s with status %i through the real proxy", async (method, status) => {
  vi.stubEnv("TURNERO_API_BASE_URL", "http://localhost:8080");
  const requestBody = { service_offering_ids: [20, 30] };
  const responseBody = status === 200 ? [{ id: 20, duration_minutes: 30, price_cents: 1000, status: "INACTIVE" }] : { code: "REJECTED", message: "Rejected" };
  const fetch = vi.fn().mockResolvedValue(status === 204 ? new Response(null, { status }) : Response.json(responseBody, { status }));
  global.fetch = fetch;
  const response = await ({ GET, PUT }[method])(new Request("http://localhost:3000/api/backend/api/v1/staff-members/5/service-offerings", {
    method, headers: { cookie: "turnero_session=opaque", "content-type": "application/json" },
    ...(method === "PUT" ? { body: JSON.stringify(requestBody) } : {}),
  }), routeContext(["api", "v1", "staff-members", "5", "service-offerings"]));
  expect(response.status).toBe(status);
  if (status === 204) expect(await response.text()).toBe("");
  else expect(await response.json()).toEqual(responseBody);
  const [target, options] = fetch.mock.calls[0];
  expect(target.toString()).toBe("http://localhost:8080/api/v1/staff-members/5/service-offerings");
  expect(options.method).toBe(method);
  expect(options.headers.get("cookie")).toBe("turnero_session=opaque");
  if (method === "PUT") expect(new TextDecoder().decode(options.body)).toBe(JSON.stringify(requestBody));
});
