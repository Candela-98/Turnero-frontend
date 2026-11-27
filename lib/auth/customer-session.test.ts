import { QueryClient } from "@tanstack/react-query";
import { afterEach, expect, it, vi } from "vitest";
import { CustomerSessionStore } from "./customer-session";
const dto = (id = 7, slug = "studio") => ({ business: { id: 10, name: "Studio", slug }, customer: { id, name: `Client ${id}`, email: "client@example.test", phone_number: null, status: "ACTIVE", public_booking_blocked: false } });
const active: CustomerSessionStore[] = [];
const store = (slug = "studio") => { const result = new CustomerSessionStore(slug); active.push(result); return result; };
const deferred = () => { let resolve!: (value: Response) => void; const promise = new Promise<Response>(yes => { resolve = yes; }); return { promise, resolve }; };
afterEach(() => { active.forEach(item => item.dispose()); active.length = 0; vi.unstubAllGlobals(); });
it("restores the customer contract with an isolated cache and no-store", async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json(dto())); vi.stubGlobal("fetch", fetch);
  const session = store(); await session.restore();
  expect(session.getSnapshot().status).toBe("authenticated");
  expect(session.getSnapshot().session?.customer.phone).toBeNull();
  expect(fetch.mock.calls[0][0]).toBe("/api/backend/api/v1/customer/businesses/studio/auth/me");
  expect(fetch.mock.calls[0][1]).toMatchObject({ credentials: "include", cache: "no-store" });
});
it("sends only id_token and allows retry after login failure", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 401 })).mockResolvedValueOnce(new Response(null, { status: 401 })).mockResolvedValueOnce(Response.json(dto())); vi.stubGlobal("fetch", fetch);
  const session = store(); await session.restore(); await session.signIn("bad-token");
  expect(session.getSnapshot().status).toBe("anonymous");
  expect(session.getSnapshot().error).toContain("Google");
  await session.signIn("good-token");
  expect(JSON.parse(fetch.mock.calls[2][1].body)).toEqual({ id_token: "good-token" });
  expect(session.getSnapshot().status).toBe("authenticated");
});
it.each([403, 503])("distinguishes initial %s from an absent session", async status => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status })));
  const session = store(); await session.restore();
  expect(session.getSnapshot().status).toBe("error"); expect(session.getSnapshot().error).not.toContain("venció");
});
it("expires only customer data after a private 401 and keeps admin cache and business", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(Response.json(dto())).mockResolvedValueOnce(new Response(null, { status: 401 })); vi.stubGlobal("fetch", fetch);
  const session = store(), admin = new QueryClient(); admin.setQueryData(["admin"], "private admin");
  await session.restore(); session.cache.setQueryData(["customer", "studio", 7, "private"], "private client");
  await expect(session.requestPrivate("auth/me")).rejects.toMatchObject({ status: 401 });
  expect(session.getSnapshot().status).toBe("anonymous"); expect(session.getSnapshot().error).toContain("venció");
  expect(session.cache.getQueryCache().getAll()).toHaveLength(0); expect(session.slug).toBe("studio");
  expect(admin.getQueryData(["admin"])).toBe("private admin"); admin.clear();
});
it.each([403, 500])("does not expire a private request on %s", async status => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(Response.json(dto())).mockResolvedValueOnce(new Response(null, { status })));
  const session = store(); await session.restore(); await session.refresh();
  expect(session.getSnapshot().status).toBe("authenticated"); expect(session.getSnapshot().error).not.toContain("venció");
});
it("cancels private queries immediately and ignores their late result after logout", async () => {
  const late = deferred(); let signal: AbortSignal | undefined;
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(Response.json(dto())).mockImplementationOnce((_url, options) => { signal = options.signal; return late.promise; }).mockResolvedValueOnce(new Response(null, { status: 204 })));
  const session = store(); await session.restore();
  const pending = session.queryPrivate(["private"], "auth/me").catch(() => null);
  await session.signOut(); expect(signal?.aborted).toBe(true);
  late.resolve(Response.json(dto())); await pending;
  expect(session.getSnapshot().status).toBe("anonymous"); expect(session.cache.getQueryCache().getAll()).toHaveLength(0);
});
it("invalidates pending private results after expiry and account changes", async () => {
  const late = deferred();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(Response.json(dto())).mockReturnValueOnce(late.promise).mockResolvedValueOnce(new Response(null, { status: 401 })).mockResolvedValueOnce(Response.json(dto(8))));
  const session = store(); await session.restore(); const pending = session.queryPrivate(["private"], "auth/me").catch(() => null);
  await expect(session.requestPrivate("auth/me")).rejects.toMatchObject({ status: 401 });
  await session.signIn("other-account"); late.resolve(Response.json(dto())); await pending;
  expect(session.getSnapshot().session?.customer.id).toBe(8); expect(session.cache.getQueryCache().getAll()).toHaveLength(0);
});
it("rejects late restoration when changing business and never shares cache", async () => {
  const late = deferred();
  const fetch = vi.fn().mockReturnValueOnce(late.promise).mockResolvedValueOnce(Response.json(dto(8, "other")));
  vi.stubGlobal("fetch", fetch);
  const old = store(); const pending = old.restore();
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  old.dispose(); const next = store("other"); await next.restore();
  late.resolve(Response.json(dto())); await pending;
  expect(old.getSnapshot().session).toBeNull(); expect(next.getSnapshot().session?.customer.id).toBe(8);
  expect(old.cache).not.toBe(next.cache);
});
it("keeps logout failure recoverable without claiming the server closed it", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(Response.json(dto())).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(new Response(null, { status: 204 })));
  const session = store(); await session.restore(); await session.signOut();
  expect(session.getSnapshot()).toMatchObject({ status: "error", session: null, retry: "logout" });
  await session.signOut(); expect(session.getSnapshot()).toMatchObject({ status: "anonymous", retry: "restore" });
});
it("rejects a backend session from another business", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(dto(7, "other"))));
  const session = store(); await session.restore(); expect(session.getSnapshot().status).toBe("error"); expect(session.getSnapshot().session).toBeNull();
});

it("disposal immediately removes an already restored private profile", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(dto())));
  const session = store(); await session.restore(); session.cache.setQueryData(["private"], "secret"); session.dispose();
  expect(session.getSnapshot().session).toBeNull(); expect(session.cache.getQueryCache().getAll()).toHaveLength(0);
});
it("refresh applies profile updates but never adopts another identity", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(Response.json(dto()))
    .mockResolvedValueOnce(Response.json({ ...dto(), customer: { ...dto().customer, name: "Updated name" } }))
    .mockResolvedValueOnce(Response.json(dto(8))));
  const session = store(); await session.restore(); await session.refresh();
  expect(session.getSnapshot().session?.customer.name).toBe("Updated name");
  await session.refresh(); expect(session.getSnapshot().session).toBeNull(); expect(session.getSnapshot().status).toBe("anonymous");
});

it("waits for an old view's logout cookie before restoring and signing into another business", async () => {
  const late = deferred();
  const fetch = vi.fn().mockResolvedValueOnce(Response.json(dto()))
    .mockReturnValueOnce(late.promise).mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockResolvedValueOnce(Response.json(dto(8, "other")));
  vi.stubGlobal("fetch", fetch);
  const old = store(); await old.restore();
  const closing = old.signOut(); await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2)); old.dispose();
  const next = store("other"); const restoring = next.restore();
  await Promise.resolve(); expect(fetch).toHaveBeenCalledTimes(2);
  expect(next.getSnapshot().status).toBe("checking");
  late.resolve(new Response(null, { status: 204 })); await closing; await restoring;
  await next.signIn("other-account");
  expect(fetch.mock.calls.map(call => call[0])).toEqual([
    "/api/backend/api/v1/customer/businesses/studio/auth/me",
    "/api/backend/api/v1/customer/businesses/studio/auth/logout",
    "/api/backend/api/v1/customer/businesses/other/auth/me",
    "/api/backend/api/v1/customer/businesses/other/auth/google",
  ]);
  expect(next.getSnapshot().session?.customer.id).toBe(8); expect(old.getSnapshot().session).toBeNull();
});
it("lets a pending login finish its cookie effects before a replacement view logs out", async () => {
  const late = deferred();
  const fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 401 }))
    .mockReturnValueOnce(late.promise).mockResolvedValueOnce(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetch);
  const old = store(); await old.restore(); const entering = old.signIn("old-identity");
  await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2)); old.dispose();
  const next = store(); const closing = next.signOut(); await Promise.resolve();
  expect(fetch).toHaveBeenCalledTimes(2);
  late.resolve(Response.json(dto())); await entering; await closing;
  expect(fetch.mock.calls[2][0]).toContain("auth/logout");
  expect(next.getSnapshot().status).toBe("anonymous"); expect(old.getSnapshot().session).toBeNull();
});
