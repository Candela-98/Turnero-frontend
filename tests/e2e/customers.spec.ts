import { expect, test } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { expectAdminViewport } from "./helpers/admin-patterns";

const session = {
  business: { id: 10, name: "Barber Studio", onboarding_status: "COMPLETED", slug: "barber-studio" },
  user: { avatar_url: null, email: "juan@example.com", id: 1, name: "Juan Perez", role: "OWNER" },
};
type Customer = { id: number; name: string; email?: string | null; phone_number?: string | null; status: "ACTIVE" | "INACTIVE" };
let rows: Customer[];
let requests: URL[];
let failed: boolean;
const search = "Buscar por nombre, teléfono o email";

test.beforeEach(async ({ page }) => {
  failed = false; requests = [];
  rows = Array.from({ length: 26 }, (_, i) => ({ id: i + 1, name: i === 0 ? "Ana Pérez" : i === 1 ? "Bruno Gómez" : "Cliente " + String(i + 1).padStart(3, "0"),
    email: i === 0 ? "ANA@example.com" : null, phone_number: i === 0 ? "+54 (11) 5555-1234" : null, status: i === 1 ? "INACTIVE" : "ACTIVE" }));
  await page.route("**/api/backend/api/v1/auth/me", route => route.fulfill({ json: session }));
  await page.route("**/api/backend/api/v1/customers?*", route => {
    const url = new URL(route.request().url()); requests.push(url);
    if (failed) return route.fulfill({ status: 503, json: { message: "Unavailable" } });
    const q = (url.searchParams.get("q") ?? "").toLocaleLowerCase();
    const state = url.searchParams.get("status");
    const digits = q.replace(/[^0-9]/g, "");
    const telephone = /^[0-9+().\s-]+$/.test(q) && digits.length > 0;
    const found = rows.filter(row => (!state || state === "ALL" || row.status === state) && (!q || row.name.toLowerCase().includes(q) ||
      row.email?.toLowerCase().includes(q) || row.phone_number?.includes(q) || telephone && row.phone_number?.replace(/[^0-9]/g, "").includes(digits)))
      .sort((a, b) => a.name.localeCompare(b.name, "es") || a.id - b.id);
    const number = Number(url.searchParams.get("page")); const size = Number(url.searchParams.get("size"));
    return route.fulfill({ json: { data: found.slice(number * size, (number + 1) * size),
      page: { number, size, total_elements: found.length, total_pages: Math.ceil(found.length / size) } } });
  });
});

test("renders contact summaries, paginates and debounces literal searches", async ({ page }, info) => {
  await page.goto("/clientes");
  await expect(page.getByText("25 clientes", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ana Pérez", exact: true })).toBeVisible();
  await expect(page.getByText("AP", { exact: true })).toBeVisible();
  await expect(page.getByText("+54 (11) 5555-1234", { exact: true })).toBeVisible();
  await expect(page.getByText("ANA@example.com", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Nuevo cliente" })).toBeVisible();
  await expectAdminViewport(page);
  await page.screenshot({ path: info.outputPath("customers-list.png"), fullPage: false });
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect(page.getByText("Página 2 de 2", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ana Pérez", exact: true })).toHaveCount(0);
  const field = page.getByRole("searchbox", { name: search });
  const count = requests.length;
  await field.fill("Ana");
  await expect(page.getByLabel("Cargando clientes", { exact: true })).toBeVisible();
  await page.waitForTimeout(100); expect(requests.length).toBe(count);
  await expect.poll(() => requests.at(-1)?.searchParams.get("q")).toBe("Ana");
  expect(requests.at(-1)?.searchParams.get("page")).toBe("0");
  await expect(page.getByText("1 cliente", { exact: true })).toBeVisible();
  await field.fill("+54 (11) 5555-1234");
  await expect.poll(() => requests.at(-1)?.searchParams.get("q")).toBe("+54 (11) 5555-1234");
  await expect(page.getByRole("heading", { name: "Ana Pérez", exact: true })).toBeVisible();
  await field.fill("ana@EXAMPLE");
  await expect.poll(() => requests.at(-1)?.searchParams.get("q")).toBe("ana@EXAMPLE");
  await expect(page.getByText("1 cliente", { exact: true })).toBeVisible();
});

test("keeps filters provisional, supports keyboard cancellation, clear and removable pills", async ({ page }, info) => {
  await page.goto("/clientes");
  await expect(page.getByText("25 clientes", { exact: true })).toBeVisible();
  const trigger = page.getByRole("button", { name: /^Filtros/ });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Filtrar clientes" });
  const before = requests.length;
  await dialog.getByRole("radio", { name: "Sin archivar", exact: true }).check();
  expect(requests).toHaveLength(before);
  await page.screenshot({ path: info.outputPath("customers-filters.png"), fullPage: false });
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
  await page.keyboard.press("Escape"); await expect(trigger).toBeFocused();
  await trigger.click(); await expect(dialog.getByRole("radio", { name: "Sin archivar", exact: true })).toBeChecked();
  await dialog.getByRole("radio", { name: "Archivados", exact: true }).check();
  await dialog.getByRole("button", { name: "Aplicar filtros", exact: true }).click();
  await expect(page.getByText("1 cliente", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bruno Gómez", exact: true })).toBeVisible();
  expect(requests.at(-1)?.searchParams.get("status")).toBe("INACTIVE");
  await expect(page).toHaveURL(/status=INACTIVE/);
  await trigger.click(); await dialog.getByRole("button", { name: "Limpiar", exact: true }).click();
  await page.getByRole("button", { name: "Cerrar filtros", exact: true }).click();
  await expect(page.getByRole("button", { name: "Quitar filtro de archivo" })).toBeVisible();
  await trigger.click(); await dialog.getByRole("button", { name: "Limpiar", exact: true }).click();
  await dialog.getByRole("button", { name: "Aplicar filtros", exact: true }).click();
  await expect(page.getByText("25 clientes", { exact: true })).toBeVisible();
  await trigger.click(); await dialog.getByRole("radio", { name: "Todos", exact: true }).check();
  await dialog.getByRole("button", { name: "Aplicar filtros", exact: true }).click();
  await expect(page.getByText("26 clientes", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Quitar filtro de archivo" }).click();
  await expect(page.getByText("25 clientes", { exact: true })).toBeVisible();
});

test("keeps a pending search when applying a status and resets the page", async ({ page }) => {
  await page.goto("/clientes?page=1"); await expect(page.getByText("Página 2 de 2", { exact: true })).toBeVisible();
  await page.getByRole("searchbox", { name: search }).fill("Ana");
  await page.getByRole("button", { name: /^Filtros/ }).click();
  await page.getByRole("radio", { name: "Sin archivar", exact: true }).check();
  await page.getByRole("button", { name: "Aplicar filtros", exact: true }).click();
  await expect(page.getByRole("searchbox", { name: search })).toHaveValue("Ana");
  await expect(page.getByText("1 cliente", { exact: true })).toBeVisible();
  expect(requests.at(-1)?.searchParams.get("q")).toBe("Ana");
  expect(requests.at(-1)?.searchParams.get("status")).toBe("ACTIVE");
  expect(requests.at(-1)?.searchParams.get("page")).toBe("0");
});

test("restores deep links, reload and browser back and forward", async ({ page }) => {
  await page.goto("/clientes?q=Cliente&status=ACTIVE&page=1");
  await expect(page.getByText("Página 2 de 2", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("searchbox", { name: search })).toHaveValue("Cliente");
  await expect(page.getByText("Página 2 de 2", { exact: true })).toBeVisible();
  await page.evaluate(() => window.history.pushState(null, "", "/clientes?q=Bruno&status=INACTIVE"));
  await expect(page.getByRole("heading", { name: "Bruno Gómez", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("searchbox", { name: search })).toHaveValue("Cliente");
  await expect(page.getByText("Página 2 de 2", { exact: true })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", { name: "Bruno Gómez", exact: true })).toBeVisible();
});

test("distinguishes loading, an empty business and no matches", async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  rows = [];
  await page.route("**/api/backend/api/v1/customers?*", async route => { await pending; return route.fallback(); });
  await page.goto("/clientes");
  await expect(page.getByLabel("Cargando clientes", { exact: true })).toBeVisible();
  release();
  await expect(page.getByText("Todavía no hay clientes", { exact: true })).toBeVisible();
  await expect(page.getByText("0 clientes", { exact: true })).toBeVisible();
  await page.getByRole("searchbox", { name: search }).fill("nadie");
  await expect(page.getByText("No encontramos clientes", { exact: true })).toBeVisible();
  await expect(page.getByText("Todavía no hay clientes", { exact: true })).toHaveCount(0);
});

test("shows recoverable errors without confusing them with empty results", async ({ page }, info) => {
  failed = true; await page.goto("/clientes");
  await expect(page.getByText("No pudimos cargar los clientes", { exact: true })).toBeVisible();
  await expect(page.getByText("Todavía no hay clientes", { exact: true })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("customers-error.png"), fullPage: false });
  failed = false; await page.getByRole("button", { name: "Reintentar", exact: true }).click();
  await expect(page.getByText("25 clientes", { exact: true })).toBeVisible();
});

test("ignores a late response from a superseded search", async ({ page }) => {
  rows[1].status = "ACTIVE";
  let release!: () => void; let waiting = false;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/backend/api/v1/customers?*", async route => {
    if (new URL(route.request().url()).searchParams.get("q") === "Ana") { waiting = true; await pending; }
    return route.fallback();
  });
  await page.goto("/clientes"); await expect(page.getByText("26 clientes", { exact: true })).toBeVisible();
  const field = page.getByRole("searchbox", { name: search });
  await field.fill("Ana"); await expect.poll(() => waiting).toBe(true);
  await field.fill("Bruno");
  await expect(page.getByRole("heading", { name: "Bruno Gómez", exact: true })).toBeVisible();
  release();
  await expect.poll(() => requests.at(-1)?.searchParams.get("q")).toBe("Ana");
  await expect(page.getByRole("heading", { name: "Ana Pérez", exact: true })).toHaveCount(0);
  await expect(field).toHaveValue("Bruno");
});

test("wraps long contact data and omits absent fields with accessible rows", async ({ page }, info) => {
  rows = [{ id: 1, name: "Cliente".repeat(17), email: "a".repeat(125) + "@example.com", phone_number: "+54 (11) 5555-1234", status: "ACTIVE" },
    { id: 2, name: "Sin contacto", status: "INACTIVE" }];
  await page.goto("/clientes?status=ALL"); await expect(page.getByText("2 clientes", { exact: true })).toBeVisible();
  const absent = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Sin contacto", exact: true }) });
  await expect(absent.getByText("Teléfono:", { exact: true })).toHaveCount(0);
  await expect(absent.getByText("Email:", { exact: true })).toHaveCount(0);
  await expectAdminViewport(page);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath("customers-long.png"), fullPage: false });
});

test("clamps out-of-range pages and keeps pagination above mobile navigation", async ({ page }) => {
  await page.goto("/clientes?page=999");
  await expect(page.getByText("Página 2 de 2", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/clientes\?page=1$/);
  const previous = page.getByRole("button", { name: "Anterior", exact: true });
  await previous.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await expect(previous).toBeInViewport();
  await expectAdminViewport(page);
  if (page.viewportSize()!.width < 768) {
    const box = (await previous.boundingBox())!;
    const nav = (await page.getByRole("navigation", { name: "Navegación principal" }).boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(nav.y);
  }
  await previous.click(); await expect(page).toHaveURL(/\/clientes$/);
});
