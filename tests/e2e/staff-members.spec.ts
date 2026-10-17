import { expect, test } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { expectAdminViewport } from "./helpers/admin-patterns";

const currentUser = {
  business: { id: 10, name: "Barber Studio", onboarding_status: "COMPLETED", slug: "barber-studio" },
  user: { avatar_url: null, email: "juan@example.com", id: 1, name: "Juan Perez", role: "OWNER" },
};
const member = (id = 1, name = "Ana Pérez") => ({ id, business_id: 10, user_id: null, name, role_label: "Directora", specialty: "Colorista", avatar_url: "/broken-avatar.png", status: "ACTIVE" });
const result = (name = "Ana Pérez", page = 0, total = 21) => ({ data: [member(page + 1, name)], page: { number: page, size: 20, total_elements: total, total_pages: Math.ceil(total / 20) } });

test.beforeEach(async ({ page }) => {
  await page.route("**/api/backend/api/v1/auth/me", route => route.fulfill({ json: currentUser }));
  await page.route("**/broken-avatar.png", route => route.fulfill({ status: 404, body: "" }));
});

test("paginates, debounces search, resets page, and applies or cancels draft filters", async ({ page }, testInfo) => {
  const requests: URL[] = [];
  await page.route("**/api/backend/api/v1/staff-members?*", route => {
    const url = new URL(route.request().url()); requests.push(url);
    const number = Number(url.searchParams.get("page"));
    return route.fulfill({ json: result(number ? "Bruno Gómez" : "Ana Pérez", number) });
  });
  await page.goto("/profesionales");
  await expect(page.getByRole("heading", { name: "Ana Pérez" })).toBeVisible();
  await expect(page.getByText("AP", { exact: true })).toBeVisible();
  await expectAdminViewport(page);
  await page.screenshot({ path: testInfo.outputPath("staff-list.png"), fullPage: true });
  await page.getByRole("button", { name: "Siguiente" }).click();
  await expect(page.getByRole("heading", { name: "Bruno Gómez" })).toBeVisible();
  const search = page.getByRole("searchbox", { name: "Buscar por nombre, rol o especialidad" });
  const count = requests.length;
  await search.fill("An");
  await expect(page.getByRole("heading", { name: "Bruno Gómez" })).toHaveCount(0);
  await page.waitForTimeout(100);
  expect(requests.length).toBe(count);
  await search.fill("Ana");
  await expect.poll(() => requests.at(-1)?.searchParams.get("q")).toBe("Ana");
  expect(requests.at(-1)?.searchParams.get("page")).toBe("0");
  const trigger = page.getByRole("button", { name: /^Filtros/ });
  await trigger.click();
  const initial = requests.length;
  await page.getByRole("radio", { name: "Activos", exact: true }).check();
  expect(requests.length).toBe(initial);
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(page.getByRole("radio", { name: "Todos", exact: true })).toBeChecked();
  await page.getByRole("radio", { name: "Inactivos", exact: true }).check();
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect.poll(() => requests.at(-1)?.searchParams.get("status")).toBe("INACTIVE");
  await page.getByRole("button", { name: "Quitar filtro de estado" }).click();
  await expect(page.getByRole("button", { name: "Quitar filtro de estado" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Ana Pérez" })).toBeVisible();
  await trigger.click();
  await page.getByRole("radio", { name: "Activos", exact: true }).check();
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await trigger.click();
  await page.getByRole("button", { name: "Limpiar", exact: true }).click();
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page.getByRole("button", { name: "Quitar filtro de estado" })).toHaveCount(0);
});

test("distinguishes loading, empty business and empty search", async ({ page }) => {
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/backend/api/v1/staff-members?*", async route => {
    await pending;
    return route.fulfill({ json: { data: [], page: { number: 0, size: 20, total_elements: 0, total_pages: 0 } } });
  });
  await page.goto("/profesionales");
  await expect(page.getByRole("status", { name: "Cargando profesionales" })).toBeVisible();
  release();
  await expect(page.getByText("Todavía no hay profesionales")).toBeVisible();
  await page.getByRole("searchbox").fill("nadie");
  await expect(page.getByText("No encontramos profesionales")).toBeVisible();
});

test("retries errors and ignores late responses while hiding prior results", async ({ page }) => {
  let fail = true;
  let lateFinished = false;
  await page.route("**/api/backend/api/v1/staff-members?*", async route => {
    if (fail) return route.fulfill({ status: 503, json: { message: "Unavailable" } });
    const status = new URL(route.request().url()).searchParams.get("status");
    if (status === "ACTIVE") {
      await new Promise(resolve => setTimeout(resolve, 800));
      lateFinished = true;
    }
    return route.fulfill({ json: result(status === "ACTIVE" ? "Respuesta anterior" : "Profesional actual", 0, 1) });
  });
  await page.goto("/profesionales");
  await expect(page.getByText("No se pudieron cargar los profesionales.", { exact: false })).toBeVisible();
  fail = false;
  await page.getByRole("button", { name: "Reintentar" }).click();
  await expect(page.getByRole("heading", { name: "Profesional actual" })).toBeVisible();
  await page.getByRole("button", { name: /^Filtros/ }).click();
  await page.getByRole("radio", { name: "Activos", exact: true }).check();
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page.getByRole("status", { name: "Cargando profesionales" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Profesional actual" })).toHaveCount(0);
  await page.getByRole("button", { name: /^Filtros/ }).click();
  await page.getByRole("radio", { name: "Inactivos", exact: true }).check();
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page.getByRole("heading", { name: "Profesional actual" })).toBeVisible();
  await expect.poll(() => lateFinished).toBe(true);
  await expect(page.getByRole("heading", { name: "Respuesta anterior" })).toHaveCount(0);
});

test("supports long content, optional fields, keyboard and basic accessibility", async ({ page }, testInfo) => {
  await page.route("**/api/backend/api/v1/staff-members?*", route => route.fulfill({ json: {
    data: [member(1, "Profesional".repeat(12)), { ...member(2, "Bruno Gómez"), avatar_url: null, role_label: null, specialty: null, status: "INACTIVE" }],
    page: { number: 0, size: 20, total_elements: 2, total_pages: 1 },
  } }));
  await page.goto("/profesionales");
  await expect(page.getByRole("heading", { name: "Bruno Gómez" })).toBeVisible();
  await expectAdminViewport(page);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: /^Filtros/ }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "Filtrar profesionales" })).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("staff-filters.png"), fullPage: true });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: /^Filtros/ })).toBeFocused();
});

test("keeps the final row and pagination accessible above mobile navigation", async ({ page }) => {
  await page.route("**/api/backend/api/v1/staff-members?*", route => route.fulfill({ json: {
    data: Array.from({ length: 20 }, (_, index) => member(index + 1, `Profesional ${index + 1}`)),
    page: { number: 0, size: 20, total_elements: 21, total_pages: 2 },
  } }));
  await page.goto("/profesionales");
  const last = page.getByRole("heading", { name: "Profesional 20", exact: true });
  await expect(last).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const next = page.getByRole("button", { name: "Siguiente" });
  await expect(next).toBeInViewport();
  await expect(last).toBeInViewport();
  await expectAdminViewport(page);
  if (page.viewportSize()!.width < 768) {
    const nav = await page.getByRole("navigation", { name: "Navegación principal" }).boundingBox();
    const button = await next.boundingBox();
    expect(button!.y + button!.height).toBeLessThanOrEqual(nav!.y);
  }
});
