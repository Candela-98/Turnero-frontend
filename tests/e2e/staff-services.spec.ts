import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { expectAdminNotice, expectAdminViewport } from "./helpers/admin-patterns";

const session = { business: { id: 10, name: "Barber Studio", onboarding_status: "COMPLETED", slug: "barber-studio" }, user: { id: 1, name: "Juan", email: "juan@example.com", role: "OWNER", avatar_url: null } };
const member = { id: 5, business_id: 10, user_id: 1, name: "Ana Pérez", role_label: "Barbera", specialty: "Cortes", avatar_url: null, status: "INACTIVE" };
const makeService = (id: number) => ({ id, name: `Servicio ${String(id).padStart(2, "0")}`, category: id <= 20 ? "Cabello" : "Barba", duration_minutes: 30, price_cents: 5000, status: id === 50 ? "INACTIVE" : "ACTIVE" });
type Service = ReturnType<typeof makeService>;
const servicesButton = (page: Page) => page.getByRole("button", { name: /^(?:Servicios(?: \(\d+\))?|Asignar servicios) de Ana Pérez$/ });
async function open(page: Page) {
  await servicesButton(page).click();
  await expect(page.getByRole("radio", { name: "Catálogo", exact: true })).toBeVisible();
  await page.getByRole("radio", { name: "Catálogo", exact: true }).check();
}
const dialog = (page: Page) => page.getByRole("dialog", { name: "Servicios del profesional" });
const checkbox = (page: Page, id: number) => dialog(page).getByRole("checkbox", { name: makeService(id).name, exact: true });
const search = (page: Page) => dialog(page).getByRole("searchbox");
const save = (page: Page) => dialog(page).getByRole("button", { name: "Guardar cambios", exact: true });

test.describe("staff services", () => {
  let catalog: Service[];
  let assigned: number[];
  let writes: number[][];
  let catalogReads: URL[];
  test.beforeEach(async ({ page }) => {
    catalog = [...Array.from({ length: 42 }, (_, index) => makeService(index + 1)), makeService(50)];
    assigned = [1, 50]; writes = []; catalogReads = [];
    await page.route("**/api/backend/api/v1/auth/me", route => route.fulfill({ json: session }));
    await page.route("**/api/backend/api/v1/staff-members?*", route => route.fulfill({ json: { data: [{ ...member, service_count: assigned.length }], page: { number: 0, size: 20, total_elements: 1, total_pages: 1 } } }));
    await page.route("**/api/backend/api/v1/staff-members/5/service-offerings", route => {
      if (route.request().method() === "GET") return route.fulfill({ json: catalog.filter(service => assigned.includes(service.id)) });
      assigned = route.request().postDataJSON().service_offering_ids;
      writes.push([...assigned]);
      return route.fulfill({ status: 204 });
    });
    await page.route("**/api/backend/api/v1/service-offerings?*", route => {
      const url = new URL(route.request().url()); catalogReads.push(url);
      const q = (url.searchParams.get("q") ?? "").toLocaleLowerCase();
      const data = catalog.filter(service => service.status === url.searchParams.get("status") && `${service.name} ${service.category}`.toLocaleLowerCase().includes(q));
      const number = Number(url.searchParams.get("page"));
      return route.fulfill({ json: { data: data.slice(number * 20, (number + 1) * 20), page: { number, size: 20, total_elements: data.length, total_pages: Math.ceil(data.length / 20) } } });
    });
    await page.goto("/profesionales");
    await expect(servicesButton(page)).toBeVisible();
    expect(catalogReads).toHaveLength(0);
  });

  test("shows counts and specialty, opens the matching view and updates the row after saving", async ({ page }, testInfo) => {
    let reads = 0;
    await page.route("**/api/backend/api/v1/staff-members/5/service-offerings", route => {
      if (route.request().method() === "GET") reads++;
      return route.fallback();
    });
    await page.reload();
    await expect(servicesButton(page)).toHaveText("Servicios (2)");
    await expect(page.getByText("Especialidad: Cortes", { exact: true })).toBeVisible();
    expect(reads).toBe(0);
    await expectAdminViewport(page);
    await page.screenshot({ path: testInfo.outputPath("staff-service-count.png"), fullPage: false });
    await servicesButton(page).click();
    await expect(dialog(page).getByRole("radio", { name: "Seleccionados (2)", exact: true })).toBeChecked();
    await expect(checkbox(page, 50)).toBeChecked();
    await dialog(page).getByRole("button", { name: "Quitar todos" }).click();
    await save(page).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(servicesButton(page)).toHaveText("Asignar servicios");
    await expectAdminViewport(page);
    await page.screenshot({ path: testInfo.outputPath("staff-service-count-empty.png"), fullPage: false });
    await servicesButton(page).click();
    await expect(dialog(page).getByRole("radio", { name: "Catálogo", exact: true })).toBeChecked();
    await checkbox(page, 2).check();
    await save(page).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(servicesButton(page)).toHaveText("Servicios (1)");
    await servicesButton(page).click();
    await expect(dialog(page).getByRole("radio", { name: "Seleccionados (1)", exact: true })).toBeChecked();
    await expect(checkbox(page, 2)).toBeChecked();
    expect(writes).toEqual([[], [2]]);
  });

  test("uses fresh associations for the initial view when the row count is outdated", async ({ page }) => {
    await expect(servicesButton(page)).toHaveText("Servicios (2)");
    assigned = [];
    await servicesButton(page).click();
    await expect(dialog(page).getByRole("radio", { name: "Catálogo", exact: true })).toBeChecked();
    await expect(save(page)).toBeDisabled();
  });

  test("selects across pages and both views, preserves inactive associations and saves a complete set", async ({ page }, testInfo) => {
    await open(page);
    await expect(save(page)).toBeDisabled();
    await expect(checkbox(page, 1)).toBeChecked();
    await expect(checkbox(page, 50)).toHaveCount(0);
    await checkbox(page, 2).check();
    await dialog(page).getByRole("button", { name: "Siguiente" }).click();
    await checkbox(page, 21).check();
    await search(page).fill("Servicio 42");
    await expect(checkbox(page, 42)).toBeVisible();
    await expect(dialog(page).getByText("Página 2 de 3")).toHaveCount(0);
    await checkbox(page, 42).check();
    await dialog(page).getByRole("radio", { name: "Seleccionados (5)", exact: true }).check();
    await expect(checkbox(page, 50)).toBeChecked();
    await expect(dialog(page).getByText("Inactivo", { exact: true })).toBeVisible();
    await expectAdminViewport(page);
    await expect(save(page)).toBeInViewport();
    expect((await save(page).boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: testInfo.outputPath("staff-services-selected.png"), fullPage: false });
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
    await save(page).click();
    await expect(dialog(page)).toHaveCount(0);
    expect(writes).toEqual([[1, 2, 21, 42, 50]]);
    await expectAdminNotice(page);
    await expect(page.getByTestId("floating-alert")).toContainText("Servicios actualizados");
    await open(page);
    await dialog(page).getByRole("radio", { name: "Seleccionados (5)", exact: true }).check();
    await expect(checkbox(page, 21)).toBeChecked();
    await expect(save(page)).toBeDisabled();
    expect(catalogReads.every(url => url.searchParams.get("size") === "20" && url.searchParams.get("status") === "ACTIVE")).toBe(true);
  });

  test("can leave one service or none, restore the baseline, and detect reversal", async ({ page }) => {
    await open(page);
    await checkbox(page, 2).check(); await checkbox(page, 2).uncheck();
    await expect(save(page)).toBeDisabled();
    await dialog(page).getByRole("button", { name: "Quitar todos" }).click();
    await expect(save(page)).toBeEnabled();
    await dialog(page).getByRole("button", { name: "Restablecer selección" }).click();
    await expect(save(page)).toBeDisabled();
    await dialog(page).getByRole("radio", { name: "Seleccionados (2)", exact: true }).check();
    await checkbox(page, 50).click();
    await expect(checkbox(page, 50)).toHaveCount(0);
    await save(page).click();
    await expect(dialog(page)).toHaveCount(0);
    expect(writes).toEqual([[1]]);
    await open(page);
    await dialog(page).getByRole("button", { name: "Quitar todos" }).click();
    await save(page).click();
    await expect(dialog(page)).toHaveCount(0);
    expect(writes).toEqual([[1], []]);
    await open(page);
    await dialog(page).getByRole("radio", { name: "Seleccionados (0)", exact: true }).check();
    await expect(dialog(page).getByText("No hay servicios seleccionados", { exact: true })).toBeVisible();
    await expect(save(page)).toBeDisabled();
  });

  test("debounces server search, ignores a late response, and resets pagination", async ({ page }) => {
    await open(page);
    await dialog(page).getByRole("button", { name: "Siguiente" }).click();
    await expect(dialog(page).getByText("Página 2 de 3")).toBeVisible();
    const count = catalogReads.length;
    await search(page).fill("Bar");
    await page.waitForTimeout(100);
    expect(catalogReads).toHaveLength(count);
    await search(page).fill("Barba");
    await expect(checkbox(page, 21)).toBeVisible();
    expect(catalogReads.at(-1)!.searchParams.get("q")).toBe("Barba");
    expect(catalogReads.at(-1)!.searchParams.get("page")).toBe("0");
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/api/backend/api/v1/service-offerings?*", async route => {
      if (new URL(route.request().url()).searchParams.get("q") === "Cabello") await pending;
      return route.fallback();
    });
    await search(page).fill("Cabello");
    await page.waitForRequest(request => new URL(request.url()).searchParams.get("q") === "Cabello");
    await search(page).fill("Servicio 42");
    await expect(checkbox(page, 42)).toBeVisible();
    release();
    await expect(checkbox(page, 1)).toHaveCount(0);
    await checkbox(page, 42).check();
    await dialog(page).getByRole("radio", { name: "Seleccionados (3)", exact: true }).check();
    const beforeLocal = catalogReads.length;
    await search(page).fill("Servicio 42");
    await expect(checkbox(page, 1)).toHaveCount(0);
    await expect(checkbox(page, 42)).toBeChecked();
    expect(catalogReads).toHaveLength(beforeLocal);
  });

  test("paginates the local selection, keeps models from every catalog page and uses fresh associations on reopen", async ({ page }) => {
    assigned = Array.from({ length: 25 }, (_, index) => index + 1);
    await open(page);
    await dialog(page).getByRole("radio", { name: "Seleccionados (25)", exact: true }).check();
    await expect(dialog(page).getByText("Página 1 de 2")).toBeVisible();
    await dialog(page).getByRole("button", { name: "Siguiente" }).click();
    await checkbox(page, 25).click();
    await expect(checkbox(page, 25)).toHaveCount(0);
    await expect(dialog(page).getByRole("radio", { name: "Seleccionados (24)", exact: true })).toBeChecked();
    await search(page).fill("Cabello");
    await expect(checkbox(page, 1)).toBeVisible();
    await expect(dialog(page).getByText("Página 2 de 2")).toHaveCount(0);
    await dialog(page).getByRole("button", { name: "Restablecer selección" }).click();
    await expect(save(page)).toBeDisabled();
    await dialog(page).getByRole("button", { name: "Cancelar", exact: true }).click();
    assigned = [42];
    await open(page);
    await dialog(page).getByRole("radio", { name: "Seleccionados (1)", exact: true }).check();
    await expect(checkbox(page, 42)).toBeChecked();
  });

  test("confirms discard for escape, cancel and close and restores keyboard focus", async ({ page }) => {
    await open(page);
    await checkbox(page, 2).focus(); await page.keyboard.press("Space");
    await expect(checkbox(page, 2)).toBeChecked();
    for (const action of ["escape", "cancel", "close"]) {
      if (action === "escape") await page.keyboard.press("Escape");
      else await dialog(page).getByRole("button", { name: action === "cancel" ? "Cancelar" : "Cerrar servicios", exact: true }).click();
      await expect(page.getByRole("alertdialog")).toBeVisible();
      await page.getByRole("button", { name: "Seguir editando" }).click();
      await expect(checkbox(page, 2)).toBeChecked();
    }
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Descartar", exact: true }).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(servicesButton(page)).toBeFocused();
    expect(writes).toEqual([]);
  });

  test("waits for both initial reads, retries failures and shows distinct empty states", async ({ page }) => {
    let release!: () => void; let fail = true;
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/api/backend/api/v1/staff-members/5/service-offerings", async route => {
      await pending;
      return fail ? route.fulfill({ status: 503, json: {} }) : route.fallback();
    });
    await servicesButton(page).click();
    await expect(page.getByLabel("Cargando servicios del profesional")).toBeVisible();
    await expect(dialog(page).getByRole("checkbox")).toHaveCount(0);
    release();
    await expect(dialog(page).getByText("No pudimos cargar los servicios", { exact: true })).toBeVisible();
    fail = false;
    await dialog(page).getByRole("button", { name: "Reintentar carga" }).click();
    await dialog(page).getByRole("radio", { name: "Catálogo", exact: true }).check();
    await checkbox(page, 2).check();
    let catalogFail = true;
    await page.route("**/api/backend/api/v1/service-offerings?*", route => catalogFail ? route.fulfill({ status: 503, json: {} }) : route.fallback());
    await search(page).fill("ninguno");
    await expect(dialog(page).getByText("No pudimos cargar el catálogo", { exact: true })).toBeVisible();
    await expect(dialog(page).getByRole("radio", { name: "Seleccionados (3)", exact: true })).toBeVisible();
    catalogFail = false;
    await dialog(page).getByRole("button", { name: "Reintentar catálogo" }).click();
    await expect(dialog(page).getByText("No encontramos servicios", { exact: true })).toBeVisible();
    await dialog(page).getByRole("button", { name: "Restablecer selección" }).click();
    await dialog(page).getByRole("button", { name: "Cancelar", exact: true }).click();
    catalog = []; assigned = [];
    await open(page);
    await expect(dialog(page).getByText("No hay servicios activos", { exact: true })).toBeVisible();
    await dialog(page).getByRole("radio", { name: "Seleccionados (0)", exact: true }).check();
    await expect(dialog(page).getByText("No hay servicios seleccionados", { exact: true })).toBeVisible();
  });

  test("keeps the draft after conflict and missing service errors, then blocks double submission and closing", async ({ page }) => {
    let attempt = 0; let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/api/backend/api/v1/staff-members/5/service-offerings", async route => {
      if (route.request().method() !== "PUT") return route.fallback();
      attempt++;
      if (attempt <= 2) return route.fulfill({ status: attempt === 1 ? 409 : 404, json: {} });
      await pending; return route.fallback();
    });
    await open(page); await checkbox(page, 2).check(); await save(page).click();
    await expect(dialog(page).getByText(/Un servicio seleccionado pasó a inactivo/)).toBeVisible();
    await dialog(page).getByRole("button", { name: "Revisar selección" }).click();
    await expect(checkbox(page, 2)).toBeChecked();
    await dialog(page).getByRole("button", { name: "Reintentar guardado" }).click();
    await expect(dialog(page).getByText(/El profesional o algún servicio ya no está disponible/)).toBeVisible();
    await dialog(page).getByRole("button", { name: "Reintentar guardado" }).evaluate(button => { (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click(); });
    await expect(dialog(page).getByRole("button", { name: "Guardando...", exact: true })).toBeDisabled();
    await expect(dialog(page).getByRole("button", { name: "Cerrar servicios" })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeVisible();
    await expect.poll(() => attempt).toBe(3);
    release();
    await expect(dialog(page)).toHaveCount(0);
    expect(writes).toEqual([[1, 2, 50]]);
  });

  test("retries a failed post-save read without issuing another PUT", async ({ page }) => {
    let fail = false;
    await page.route("**/api/backend/api/v1/staff-members?*", route => fail ? route.fulfill({ status: 503, json: {} }) : route.fallback());
    await open(page); await checkbox(page, 2).check();
    fail = true;
    await save(page).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(page.getByText(/El cambio se guardó, pero no pudimos actualizar los datos/)).toBeVisible();
    fail = false;
    await page.getByRole("button", { name: "Reintentar actualización", exact: true }).click();
    await expect(servicesButton(page)).toBeVisible();
    expect(writes).toEqual([[1, 2, 50]]);
  });

  test("retries a failed association refresh after the editor closes without repeating the write", async ({ page }) => {
    let failReads = false; let gets = 0; let puts = 0;
    await page.route("**/api/backend/api/v1/staff-members/5/service-offerings", route => {
      if (route.request().method() === "PUT") { puts++; failReads = true; return route.fallback(); }
      gets++;
      return failReads ? route.fulfill({ status: 503, json: {} }) : route.fallback();
    });
    await open(page); await checkbox(page, 2).check(); await save(page).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(page.getByText(/El cambio se guardó, pero no pudimos actualizar los datos/)).toBeVisible();
    const previous = gets;
    failReads = false;
    await page.getByRole("button", { name: "Reintentar actualización", exact: true }).click();
    await expect.poll(() => gets).toBeGreaterThan(previous);
    await expect(page.getByRole("button", { name: "Reintentar actualización", exact: true })).toHaveCount(0);
    expect(puts).toBe(1);
  });

  test("wraps long service names without horizontal scroll", async ({ page }, testInfo) => {
    catalog[0].name = "ServicioExtremadamenteLargo".repeat(8);
    catalog[0].category = "CategoriaSinEspacios".repeat(5);
    await open(page);
    await expectAdminViewport(page);
    await expect(save(page)).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath("staff-services-catalog.png"), fullPage: false });
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
  });
});
