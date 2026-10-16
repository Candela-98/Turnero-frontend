import { expect, test, type Page } from "@playwright/test";
import { expectAdminNotice } from "./helpers/admin-patterns";
import { AxeBuilder } from "@axe-core/playwright";

const user = { business: { id: 10, name: "Barber Studio", onboarding_status: "COMPLETED", slug: "barber-studio" }, user: { avatar_url: null, email: "juan@example.com", id: 1, name: "Juan", role: "OWNER" } };
const initialService = { id: 1, name: "Corte", category: "Corte", duration_minutes: 30, price_cents: 600000, status: "ACTIVE" };
async function fill(page: Page, name = "Barba") {
  await page.getByLabel("Nombre", { exact: true }).fill(name);
  await page.getByLabel("Categoría (opcional)", { exact: true }).fill("Barba");
  await page.getByLabel("Duración (minutos)", { exact: true }).fill("45");
  await page.getByLabel("Precio (ARS)", { exact: true }).fill("6000,50");
}

test.describe("service form", () => {
  let services: typeof initialService[];
  let writes: { method: string; body: Record<string, unknown> }[];
  let reads: number;
  test.beforeEach(async ({ page }) => {
    services = [{ ...initialService }]; writes = []; reads = 0;
    await page.route("**/api/backend/api/v1/auth/me", route => route.fulfill({ json: user }));
    await page.route("**/api/backend/api/v1/service-offerings/categories", route => route.fulfill({ json: [...new Set(services.map(service => service.category).filter(Boolean))] }));
    await page.route("**/api/backend/api/v1/service-offerings?*", route => {
      reads++;
      return route.fulfill({ json: { data: services, page: { number: Number(new URL(route.request().url()).searchParams.get("page")), size: 20, total_elements: services.length, total_pages: 1 } } });
    });
    await page.route(/\/api\/backend\/api\/v1\/service-offerings(?:\/\d+)?$/, async route => {
      const method = route.request().method();
      if (method === "GET") return route.fulfill({ json: services[0] });
      const body = route.request().postDataJSON();
      writes.push({ method, body });
      const service = method === "POST" ? { ...body, id: 2, status: "ACTIVE" } : { ...services[0], ...body };
      if (method === "POST") services.push(service); else services[0] = service;
      return route.fulfill({ status: method === "POST" ? 201 : 200, json: service });
    });
    await page.goto("/servicios");
    await expect(page.getByRole("heading", { name: "Corte", exact: true })).toBeVisible();
  });

  test("creates with exact cents and refreshes the catalog and categories", async ({ page }) => {
    const before = reads;
    await page.getByRole("button", { name: "Nuevo servicio", exact: true }).click();
    await fill(page);
    await page.getByRole("button", { name: "Crear servicio", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Barba", exact: true })).toBeVisible();
    expect(writes).toEqual([{ method: "POST", body: { name: "Barba", category: "Barba", duration_minutes: 45, price_cents: 600050 } }]);
    expect(reads).toBeGreaterThan(before);
    await expect(page.getByRole("button", { name: "Nuevo servicio", exact: true })).toBeFocused();
    await page.getByRole("button", { name: /^Filtros/ }).click();
    await expect(page.getByRole("radio", { name: "Barba", exact: true })).toBeVisible();
  });

  test("success follows viewport scroll, closes manually and expires after six seconds", async ({ page }) => {
    services = Array.from({ length: 20 }, (_, index) => ({ ...initialService, id: index + 1, name: `Corte ${index + 1}` }));
    await page.clock.install();
    await page.getByRole("button", { name: "Nuevo servicio", exact: true }).click();
    await fill(page);
    await page.getByRole("button", { name: "Crear servicio", exact: true }).click();
    const alert = page.getByTestId("floating-alert");
    await expect(alert).toContainText("Servicio creado");
    expect(await alert.evaluate(element => getComputedStyle(element).position)).toBe("fixed");
    const before = await alert.boundingBox();
    expect(before).not.toBeNull();
    await page.evaluate(() => window.scrollBy(0, 400));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    const after = await alert.boundingBox();
    expect(after?.x).toBe(before?.x);
    expect(after?.y).toBe(before?.y);
    await expectAdminNotice(page);
    await page.mouse.move(0, 0);
    await page.clock.fastForward(6001);
    await expect(alert).toHaveCount(0);

    await page.getByRole("button", { name: "Editar Barba", exact: true }).click();
    await page.getByLabel("Nombre", { exact: true }).fill("Barba nueva");
    await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
    await expect(alert).toContainText("Servicio actualizado");
    await alert.getByRole("button", { name: "Cerrar confirmación", exact: true }).click();
    await expect(alert).toHaveCount(0);
  });

  test("hydrates edit, detects reversal, patches only changes and refetches detail", async ({ page }) => {
    let details = 0;
    await page.route("**/api/backend/api/v1/service-offerings/1", async route => {
      if (route.request().method() === "GET") details++;
      await route.fallback();
    });
    await page.getByRole("button", { name: "Editar Corte", exact: true }).click();
    const save = page.getByRole("button", { name: "Guardar cambios", exact: true });
    await expect(page.getByLabel("Precio (ARS)", { exact: true })).toHaveValue("6000,00");
    await expect(save).toBeDisabled();
    await page.getByLabel("Nombre", { exact: true }).fill("Otro");
    await expect(save).toBeEnabled();
    await page.getByLabel("Nombre", { exact: true }).fill("Corte");
    await expect(save).toBeDisabled();
    await page.getByLabel("Categoría (opcional)", { exact: true }).fill("");
    await save.click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(writes).toEqual([{ method: "PATCH", body: { category: "" } }]);
    expect(details).toBeGreaterThanOrEqual(2);
    await page.getByRole("button", { name: "Editar Corte", exact: true }).click();
    await expect(page.getByLabel("Categoría (opcional)", { exact: true })).toHaveValue("");
    await expect(save).toBeDisabled();
  });

  test("validates without writing and confirms unsaved discard", async ({ page }) => {
    await page.getByRole("button", { name: "Nuevo servicio", exact: true }).click();
    await page.getByRole("button", { name: "Crear servicio", exact: true }).click();
    await expect(page.getByText("Ingresá el nombre del servicio.")).toBeVisible();
    await expect(page.getByLabel("Nombre", { exact: true })).toBeFocused();
    expect(writes).toHaveLength(0);
    await fill(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "Seguir editando", exact: true }).click();
    await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Barba");
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await page.getByRole("button", { name: "Descartar", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("button", { name: "Nuevo servicio", exact: true }).click();
    await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("");
  });

  test("keeps drafts after API errors and prevents duplicate submits or closing while saving", async ({ page }) => {
    let calls = 0;
    let release: (() => void) | undefined;
    await page.route("**/api/backend/api/v1/service-offerings", async route => {
      calls++;
      if (calls === 1) return route.fulfill({ status: 400, json: { details: [{ field: "durationMinutes", message: "Duración inválida" }] } });
      if (calls === 2) return route.fulfill({ status: 503, json: { message: "Unavailable" } });
      await new Promise<void>(resolve => { release = resolve; });
      services.push({ ...initialService, id: 2, name: "Barba" });
      return route.fulfill({ status: 201, json: services[1] });
    });
    await page.getByRole("button", { name: "Nuevo servicio", exact: true }).click();
    await fill(page);
    const save = page.getByRole("button", { name: "Crear servicio", exact: true });
    await save.click();
    await expect(page.getByText("Duración inválida", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Barba");
    await save.click();
    await expect(page.getByText("No pudimos guardar", { exact: true })).toBeVisible();
    await save.click();
    await expect(page.getByRole("button", { name: "Creando...", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Cerrar formulario", exact: true })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.locator("form").evaluate(form => { (form as HTMLFormElement).requestSubmit(); (form as HTMLFormElement).requestSubmit(); });
    expect(calls).toBe(3);
    release!();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("handles failed detail with retry and missing service", async ({ page }) => {
    let missing = false;
    await page.route("**/api/backend/api/v1/service-offerings/1", route => route.fulfill({ status: missing ? 404 : 503, json: { message: "Failure" } }));
    await page.getByRole("button", { name: "Editar Corte", exact: true }).click();
    await expect(page.getByText("No pudimos cargar el servicio", { exact: true })).toBeVisible();
    missing = true;
    await page.getByRole("button", { name: "Reintentar", exact: true }).click();
    await expect(page.getByText("El servicio ya no está disponible", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Volver al listado", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(writes).toHaveLength(0);
  });

  test("does not repeat a successful write when catalog refresh fails", async ({ page }) => {
    await page.getByRole("button", { name: "Nuevo servicio", exact: true }).click();
    await fill(page);
    await page.route("**/api/backend/api/v1/service-offerings?*", route => route.fulfill({ status: 503, json: { message: "Refresh failure" } }));
    await page.getByRole("button", { name: "Crear servicio", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByText("El cambio se guardó, pero no pudimos actualizar los datos.")).toBeVisible();
    await page.route("**/api/backend/api/v1/service-offerings?*", route => route.fulfill({ json: { data: services, page: { number: 0, size: 20, total_elements: 2, total_pages: 1 } } }));
    await page.getByRole("button", { name: "Reintentar actualización", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Barba", exact: true })).toBeVisible();
    expect(writes).toHaveLength(1);
  });

  test("creates from empty catalog and suggestion failures do not block saving", async ({ page }) => {
    services = [];
    await page.route("**/api/backend/api/v1/service-offerings/categories", route => route.fulfill({ status: 503, json: { message: "Failure" } }));
    await page.reload();
    await expect(page.getByText("Todavía no hay servicios")).toBeVisible();
    await page.getByRole("button", { name: "Nuevo servicio", exact: true }).last().click();
    await fill(page);
    await page.getByRole("button", { name: "Crear servicio", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Barba", exact: true })).toBeVisible();
    expect(writes).toHaveLength(1);
  });

  test("loads fresh detail each time and preserves drafts during background refetch", async ({ page }) => {
    let detailReads = 0;
    await page.route("**/api/backend/api/v1/service-offerings/1", async route => {
      if (route.request().method() === "GET") detailReads++;
      await route.fallback();
    });
    const edit = page.getByRole("button", { name: "Editar Corte", exact: true });
    await edit.click();
    await expect(page.getByLabel("Duración (minutos)", { exact: true })).toHaveValue("30");
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    services[0].duration_minutes = 60;
    await edit.click();
    await expect(page.getByLabel("Duración (minutos)", { exact: true })).toHaveValue("60");
    await page.getByLabel("Nombre", { exact: true }).fill("Mi borrador");
    await page.evaluate(() => { window.dispatchEvent(new Event("offline")); window.dispatchEvent(new Event("online")); });
    await expect.poll(() => detailReads).toBeGreaterThanOrEqual(3);
    await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Mi borrador");
    await page.getByRole("button", { name: "Cerrar formulario", exact: true }).click();
    await page.getByRole("button", { name: "Descartar", exact: true }).click();
  });

  test("keeps list search and category selection after editing", async ({ page }) => {
    await page.getByRole("searchbox", { name: "Buscar por servicio o categoría" }).fill("Corte");
    await expect.poll(() => reads).toBeGreaterThan(1);
    await page.getByRole("button", { name: /^Filtros/ }).click();
    await page.getByRole("radio", { name: "Corte", exact: true }).check();
    await page.getByRole("button", { name: "Aplicar filtros", exact: true }).click();
    await page.getByRole("button", { name: "Editar Corte", exact: true }).click();
    await page.getByLabel("Duración (minutos)", { exact: true }).fill("45");
    await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("searchbox", { name: "Buscar por servicio o categoría" })).toHaveValue("Corte");
    await expect(page.getByRole("button", { name: "Quitar categoría Corte", exact: true })).toBeVisible();
  });

  test("returns to a valid page when an edit shrinks the result count", async ({ page }) => {
    const pages: number[] = [];
    await page.route("**/api/backend/api/v1/service-offerings?*", route => {
      const pageNumber = Number(new URL(route.request().url()).searchParams.get("page"));
      pages.push(pageNumber);
      const edited = services[0].duration_minutes === 45;
      return route.fulfill({ json: { data: edited && pageNumber === 1 ? [] : services, page: { number: pageNumber, size: 20, total_elements: edited ? 20 : 21, total_pages: edited ? 1 : 2 } } });
    });
    await page.reload();
    await page.getByRole("button", { name: "Siguiente", exact: true }).click();
    await expect(page.getByText("Página 2 de 2")).toBeVisible();
    await page.getByRole("button", { name: "Editar Corte", exact: true }).click();
    await page.getByLabel("Duración (minutos)", { exact: true }).fill("45");
    await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Corte", exact: true })).toBeVisible();
    expect(pages.at(-1)).toBe(0);
    expect(writes).toHaveLength(1);
  });

  test("has accessible form and safe visible actions", async ({ page }, testInfo) => {
    await page.getByRole("button", { name: "Nuevo servicio", exact: true }).click();
    await fill(page);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations).toEqual([]);
    const save = page.getByRole("button", { name: "Crear servicio", exact: true });
    await expect(save).toBeVisible();
    const box = await save.boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
    await page.screenshot({ path: testInfo.outputPath("service-form.png") });
    if (page.viewportSize()!.width < 768) {
      await page.setViewportSize({ width: page.viewportSize()!.width, height: 500 });
      await page.getByLabel("Precio (ARS)", { exact: true }).focus();
      await expect(save).toBeInViewport();
      const reduced = await save.boundingBox();
      expect(reduced!.y + reduced!.height).toBeLessThanOrEqual(500);
    }
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    const discardResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(discardResults.violations).toEqual([]);
    await page.getByRole("button", { name: "Descartar", exact: true }).click();
    services[0].name = "S".repeat(100);
    services[0].category = "C".repeat(100);
    services[0].price_cents = 2147483647;
    await page.reload();
    await page.setViewportSize({ width: 768, height: 900 });
    await expect(page.getByRole("heading", { name: services[0].name, exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(768);
  });
});
