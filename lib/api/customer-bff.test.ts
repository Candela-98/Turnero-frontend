import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { GET, POST, PATCH } from "@/app/api/backend/[...path]/route";
const origin = "http://localhost:3000";
const prefix = "api/v1/customer/businesses/barber-studio/auth/";
const context = (action: string) => ({ params: Promise.resolve({ path: (prefix + action).split("/") }) });
beforeEach(() => { vi.stubEnv("TURNERO_API_BASE_URL", "http://localhost:8080"); vi.stubEnv("TURNERO_FRONTEND_ORIGIN", origin); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

it.each([["google", "POST", 200], ["me", "GET", 200], ["logout", "POST", 204]] as const)("proxies customer %s with cookies, body and every Set-Cookie", async (action, method, status) => {
  const upstreamHeaders = new Headers({ "cache-control": "public, max-age=999" });
  const cookies = ["turnero_customer_session=opaque; HttpOnly; Path=/", "another_cookie=second; Path=/; Expires=Wed, 01 Jan 2031 00:00:00 GMT"];
  cookies.forEach(cookie => upstreamHeaders.append("set-cookie", cookie));
  const fetch = vi.fn().mockResolvedValue(new Response(status === 204 ? null : "{}", { status, headers: upstreamHeaders }));
  vi.stubGlobal("fetch", fetch);
  const request = new Request(`${origin}/api/backend/${prefix}${action}`, { method,
    headers: { origin, cookie: "turnero_session=admin; turnero_customer_session=client", "content-type": "application/json" },
    ...(action === "google" ? { body: JSON.stringify({ id_token: "google-credential" }) } : {}) });
  const response = await (method === "GET" ? GET : POST)(request, context(action));
  expect(response.status).toBe(status);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(response.headers.getSetCookie()).toEqual(cookies);
  const [url, options] = fetch.mock.calls[0];
  expect(url.toString()).toBe(`http://localhost:8080/${prefix}${action}`);
  expect(options.cache).toBe("no-store");
  expect(options.headers.get("cookie")).toBe("turnero_session=admin; turnero_customer_session=client");
  if (action === "google") expect(JSON.parse(new TextDecoder().decode(options.body))).toEqual({ id_token: "google-credential" });
  else expect(options.body).toBeUndefined();
});
it.each(["google", "logout"])("enforces Origin for customer %s", async action => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  for (const candidate of [undefined, "null", "https://untrusted.test"]) {
    const response = await POST(new Request(`${origin}/api/backend/${prefix}${action}`, { method: "POST", headers: candidate ? { origin: candidate } : {} }), context(action));
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect((await response.json()).code).toBe("BFF_ORIGIN_FORBIDDEN");
  }
  expect(fetch).not.toHaveBeenCalled();
});
it.each([400, 401, 403, 409, 500, 503])("preserves backend errors %s without caching or logging credentials", async status => {
  const log = vi.spyOn(console, "error");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ code: "BACKEND_ERROR" }, { status })));
  const response = await GET(new Request(`${origin}/api/backend/${prefix}me`), context("me"));
  expect(response.status).toBe(status);
  expect(await response.json()).toEqual({ code: "BACKEND_ERROR" });
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(log).not.toHaveBeenCalled(); log.mockRestore();
});
it("does not cache transport failures", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("private internal message")));
  const response = await GET(new Request(`${origin}/api/backend/${prefix}me`), context("me"));
  expect(response.status).toBe(502);
  expect(response.headers.get("cache-control")).toBe("no-store");
  expect(await response.text()).not.toContain("private internal message");
});
it.each(["google", "me", "logout"])("rejects other methods for %s", async action => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  expect((await PATCH(new Request(`${origin}/api/backend/${prefix}${action}`, { method: "PATCH", headers: { origin } }), context(action))).status).toBe(405);
  expect(fetch).not.toHaveBeenCalled();
});
it("does not enable future appointment endpoints", async () => {
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  const response = await GET(new Request(`${origin}/api/backend/api/v1/customer/businesses/studio/appointments`), { params: Promise.resolve({ path: ["api", "v1", "customer", "businesses", "studio", "appointments"] }) });
  expect(response.status).toBe(404); expect(fetch).not.toHaveBeenCalled();
});
