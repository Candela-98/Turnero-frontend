import { expect, test, type Page } from "@playwright/test";
import { expectAdminViewport } from "./helpers/admin-patterns";
const api = "**/api/backend/api/v1";
const pagePath = "/reservar/barber-studio";
const session = (id = 7, slug = "barber-studio") => ({ business: { id: 10, name: "Barber Studio", slug }, customer: { id, name: id === 7 ? "Ana Cliente" : "Lucía Cliente", email: id === 7 ? "ana@example.test" : "lucia@example.test", phone_number: null, status: "ACTIVE", public_booking_blocked: false } });
const gate = () => { let release!: () => void; const promise = new Promise<void>(yes => { release = yes; }); return { promise, release }; };
async function google(page: Page) {
  await page.route("https://accounts.google.com/gsi/client", route => route.fulfill({ contentType: "application/javascript", body: `window.google={accounts:{id:{initialize:function(o){window.googleCallback=o.callback},renderButton:function(parent){var b=document.createElement('button');b.textContent='Continuar con Google';b.style.height='44px';b.onclick=function(){window.googleCallback({credential:'test-google-id-token'})};parent.appendChild(b)}}}};` }));
}
async function setup(page: Page, authenticated = false) {
  let loggedIn = authenticated, identity = 7;
  const observed: string[] = [];
  await google(page);
  await page.route(`${api}/**`, route => {
    const path = new URL(route.request().url()).pathname;
    observed.push(path);
    if (path.endsWith("/booking-profile")) return route.fulfill({ json: { business: { name: "Barber Studio", timezone: "America/Argentina/Buenos_Aires" }, booking_settings: { public_booking_enabled: true, booking_window_days: 7 } } });
    if (path.endsWith("/services")) return route.fulfill({ json: { services: [] } });
    if (path.includes("/customer/businesses/") && path.endsWith("/auth/me")) {
      const slug = path.split("/businesses/")[1].split("/")[0];
      return route.fulfill(loggedIn ? { json: session(identity, slug) } : { status: 401, json: { code: "UNAUTHORIZED" } });
    }
    if (path.includes("/customer/businesses/") && path.endsWith("/auth/google")) {
      expect(route.request().method()).toBe("POST"); expect(route.request().postDataJSON()).toEqual({ id_token: "test-google-id-token" });
      loggedIn = true;
      return route.fulfill({ json: session(identity), headers: { "set-cookie": "turnero_customer_session=client; HttpOnly; Path=/", "cache-control": "no-store" } });
    }
    if (path.includes("/customer/businesses/") && path.endsWith("/auth/logout")) {
      loggedIn = false;
      return route.fulfill({ status: 204, headers: { "set-cookie": "turnero_customer_session=; Max-Age=0; HttpOnly; Path=/" } });
    }
    if (path.endsWith("/auth/me")) return route.fulfill({ json: { business: { id: 10, name: "Barber Studio", slug: "barber-studio", onboarding_status: "COMPLETED" }, user: { id: 1, name: "Admin Owner", email: "admin@example.test", role: "OWNER", avatar_url: null } } });
    if (path.endsWith("/business")) return route.fulfill({ json: { id: 10, name: "Barber Studio", timezone: "America/Argentina/Buenos_Aires" } });
    if (path.endsWith("/booking-settings")) return route.fulfill({ json: { slot_interval_minutes: 30 } });
    return route.fulfill({ json: { data: [], page: { number: 0, size: 100, total_elements: 0, total_pages: 0 } } });
  });
  return { observed, expire: () => { loggedIn = false; }, changeAccount: () => { identity = 8; } };
}
const account = (page: Page) => page.getByRole("region", { name: "Tu cuenta en este negocio" });

test("initial check, login, canonical body and reload restore preserve the business", async ({ page }, testInfo) => {
  const state = await setup(page); const pending = gate();
  await page.route(`${api}/customer/businesses/barber-studio/auth/me`, async route => { await pending.promise; await route.fallback(); });
  await page.goto(pagePath); await expect(account(page).getByText("Comprobando tu sesión…")).toBeVisible();
  await expect(account(page).getByRole("button", { name: "Continuar con Google" })).toHaveCount(0);
  pending.release();
  await expect(account(page).getByRole("button", { name: "Continuar con Google" })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath("customer-login.png"), fullPage: true });
  await account(page).getByRole("button", { name: "Continuar con Google" }).click();
  await expect(account(page).getByText("ana@example.test")).toBeVisible();
  await page.reload(); await expect(account(page).getByText("Ana Cliente", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(pagePath + "$")); await expectAdminViewport(page);
  await page.screenshot({ path: testInfo.outputPath("customer-session.png"), fullPage: true });
  expect(state.observed.some(path => path === "/api/backend/api/v1/auth/me")).toBe(false);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});

test("login failure permits a fresh Google attempt", async ({ page }) => {
  await setup(page); let calls = 0;
  await page.route(`${api}/customer/businesses/barber-studio/auth/google`, route => ++calls === 1 ? route.fulfill({ status: 503, json: { code: "UNAVAILABLE" } }) : route.fallback());
  await page.goto(pagePath); await account(page).getByRole("button", { name: "Continuar con Google" }).click();
  await expect(account(page).getByText("No pudimos comprobar tu sesión. Revisá tu conexión y reintentá.")).toBeVisible();
  await account(page).getByRole("button", { name: "Continuar con Google" }).click();
  await expect(account(page).getByText("ana@example.test")).toBeVisible(); expect(calls).toBe(2);
});

test("initial server failure is recoverable instead of becoming absence of session", async ({ page }) => {
  await setup(page, true); let calls = 0;
  await page.route(`${api}/customer/businesses/barber-studio/auth/me`, route => ++calls === 1 ? route.fulfill({ status: 503, json: {} }) : route.fallback());
  await page.goto(pagePath); await account(page).getByRole("button", { name: "Reintentar comprobación" }).click();
  await expect(account(page).getByText("ana@example.test")).toBeVisible();
});

test("a private 401 removes identity and returns to login in the same business", async ({ page }) => {
  const state = await setup(page, true); await page.goto(pagePath);
  await expect(account(page).getByText("ana@example.test")).toBeVisible(); state.expire();
  await account(page).getByRole("button", { name: "Actualizar cuenta" }).click();
  await expect(account(page).getByText("Tu sesión venció. Volvé a ingresar para continuar.")).toBeVisible();
  await expect(account(page).getByRole("button", { name: "Continuar con Google" })).toBeVisible();
  await expect(account(page).getByText("ana@example.test")).toHaveCount(0); await expect(page).toHaveURL(new RegExp(pagePath + "$"));
});

test("private 403 and 5xx keep their meaning and do not expire the session", async ({ page }) => {
  await setup(page, true); await page.goto(pagePath); await expect(account(page).getByText("ana@example.test")).toBeVisible();
  let code = 403; await page.route(`${api}/customer/businesses/barber-studio/auth/me`, route => route.fulfill({ status: code, json: {} }));
  for (const status of [403, 503]) {
    code = status; await account(page).getByRole("button", { name: "Actualizar cuenta" }).click();
    await expect(account(page).getByRole("button", { name: "Actualizar cuenta" })).toBeEnabled();
    await expect(account(page).getByText("ana@example.test")).toBeVisible();
    await expect(account(page).getByRole("button", { name: "Continuar con Google" })).toHaveCount(0);
  }
});

test("logout hides private data immediately and ignores a late private response", async ({ page }) => {
  await setup(page, true); await page.goto(pagePath); await expect(account(page).getByText("ana@example.test")).toBeVisible();
  const pending = gate(); let started!: () => void; const requested = new Promise<void>(yes => { started = yes; });
  await page.route(`${api}/customer/businesses/barber-studio/auth/me`, async route => { started(); await pending.promise; await route.fulfill({ json: session() }).catch(() => {}); });
  await account(page).getByRole("button", { name: "Actualizar cuenta" }).click(); await requested;
  await account(page).getByRole("button", { name: "Cerrar sesión", exact: true }).click();
  await expect(account(page).getByText("ana@example.test")).toHaveCount(0);
  pending.release(); await expect(account(page).getByRole("button", { name: "Continuar con Google" })).toBeVisible();
  await expect(account(page).getByText("ana@example.test")).toHaveCount(0); await expect(page).toHaveURL(new RegExp(pagePath + "$"));
});

test("failed logout removes local data but shows retry instead of success", async ({ page }) => {
  await setup(page, true); await page.goto(pagePath); await expect(account(page).getByText("ana@example.test")).toBeVisible();
  let calls = 0; await page.route(`${api}/customer/businesses/barber-studio/auth/logout`, route => ++calls === 1 ? route.fulfill({ status: 503, json: {} }) : route.fallback());
  await account(page).getByRole("button", { name: "Cerrar sesión", exact: true }).click();
  await expect(account(page).getByText("No pudimos cerrar la sesión del servidor. Reintentá el cierre.")).toBeVisible();
  await expect(account(page).getByText("ana@example.test")).toHaveCount(0);
  await expect(account(page).getByRole("button", { name: "Continuar con Google" })).toHaveCount(0);
  await account(page).getByRole("button", { name: "Reintentar cierre de sesión" }).click();
  await expect(account(page).getByRole("button", { name: "Continuar con Google" })).toBeVisible();
});

test("account and business switches never reuse the previous private identity", async ({ page }) => {
  const state = await setup(page, true); await page.goto(pagePath); await expect(account(page).getByText("ana@example.test")).toBeVisible();
  await account(page).getByRole("button", { name: "Cerrar sesión", exact: true }).click(); state.changeAccount();
  await account(page).getByRole("button", { name: "Continuar con Google" }).click(); await expect(account(page).getByText("lucia@example.test")).toBeVisible();
  await expect(account(page).getByText("ana@example.test")).toHaveCount(0);
  await page.route(`${api}/customer/businesses/other-studio/auth/me`, route => route.fulfill({ status: 403, json: {} }));
  await page.goto("/reservar/other-studio"); await expect(account(page).getByRole("button", { name: "Reintentar comprobación" })).toBeVisible();
  await expect(account(page).getByText("lucia@example.test")).toHaveCount(0); await expect(page).toHaveURL(/other-studio$/);
});

test("customer logout preserves admin cookie and the admin session", async ({ page, context }) => {
  await context.addCookies([{ name: "turnero_session", value: "admin-private", url: "http://127.0.0.1:3100", httpOnly: true }]);
  await setup(page, true); await page.goto(pagePath); await expect(account(page).getByText("ana@example.test")).toBeVisible();
  await account(page).getByRole("button", { name: "Cerrar sesión", exact: true }).click();
  await expect(account(page).getByRole("button", { name: "Continuar con Google" })).toBeVisible();
  expect((await context.cookies()).find(cookie => cookie.name === "turnero_session")?.value).toBe("admin-private");
  await page.goto("/login"); await expect(page).toHaveURL(/agenda$/);
  await expect(page.getByRole("banner").getByTitle("Admin Owner")).toBeVisible();
});

test("a late restoration from another business cannot repopulate the new view", async ({ page }) => {
  await setup(page, true);
  const pending = gate(); let started!: () => void;
  const requested = new Promise<void>(yes => { started = yes; });
  await page.route(`${api}/customer/businesses/barber-studio/auth/me`, async route => {
    started(); await pending.promise; await route.fulfill({ json: session() }).catch(() => {});
  });
  await page.route(`${api}/customer/businesses/other-studio/auth/me`, route => route.fulfill({ status: 401, json: {} }));
  await page.goto(pagePath); await requested;
  await page.goto("/reservar/other-studio"); pending.release();
  await expect(account(page).getByRole("button", { name: "Continuar con Google" })).toBeVisible();
  await expect(account(page).getByText("ana@example.test")).toHaveCount(0); await expect(page).toHaveURL(/other-studio$/);
});

test("failed Google script loading can be retried without reloading the business", async ({ page }) => {
  await setup(page); let attempts = 0;
  await page.route("https://accounts.google.com/gsi/client", route => ++attempts === 1 ? route.abort() : route.fallback());
  await page.goto(pagePath);
  await account(page).getByRole("button", { name: "Reintentar Google" }).click();
  await account(page).getByRole("button", { name: "Continuar con Google" }).click();
  await expect(account(page).getByText("ana@example.test")).toBeVisible();
  expect(attempts).toBe(2); await expect(page).toHaveURL(new RegExp(pagePath + "$"));
});
