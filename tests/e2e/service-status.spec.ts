import { expect, test } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { expectAdminNotice, expectAdminViewport } from "./helpers/admin-patterns";

const auth = { business: { id: 10, name: "Barber Studio", onboarding_status: "READY", slug: "barber-studio" }, user: { id: 1, name: "Juan", email: "juan@example.com", avatar_url: null, role: "OWNER" } };
type Service = { id: number; name: string; category: string | null; duration_minutes: number; price_cents: number; status: string };
const initial: Service = { id: 1, name: "Corte", category: "Corte", duration_minutes: 30, price_cents: 600000, status: "ACTIVE" };

test.describe("service status", () => {
  let services: Service[];
  let writes: number;
  let details: number;
  test.beforeEach(async ({ page }) => {
    services = [{ ...initial }, { ...initial, id: 2, name: "Barba", category: null }];
    writes = 0; details = 0;
    await page.route("**/api/backend/api/v1/auth/me", route => route.fulfill({ json: auth }));
    await page.route("**/api/backend/api/v1/service-offerings/categories", route => route.fulfill({ json: [...new Set(services.map(service => service.category).filter(Boolean))] }));
    await page.route("**/api/backend/api/v1/service-offerings?*", route => {
      const params = new URL(route.request().url()).searchParams;
      const q = (params.get("q") ?? "").toLowerCase();
      const category = params.get("category");
      const status = params.get("status");
      const number = Number(params.get("page"));
      const size = Number(params.get("size"));
      const selected = services.filter(service => (!q || `${service.name} ${service.category ?? ""}`.toLowerCase().includes(q)) && (!category || service.category === category) && (!status || service.status === status));
      return route.fulfill({ json: { data: selected.slice(number * size, (number + 1) * size), page: { number, size, total_elements: selected.length, total_pages: Math.ceil(selected.length / size) } } });
    });
    await page.route("**/api/backend/api/v1/service-offerings/*/catalog", route => {
      const id = Number(new URL(route.request().url()).pathname.split("/").at(-2));
      const service = services.find(item => item.id === id);
      if (!service) return route.fulfill({ status: 404 });
      if (service.status !== "INACTIVE") return route.fulfill({ status: 409 });
      writes++; services = services.filter(item => item.id !== id);
      return route.fulfill({ status: 204 });
    });
    await page.route(/\/api\/backend\/api\/v1\/service-offerings\/\d+$/, route => {
      const id = Number(new URL(route.request().url()).pathname.split("/").at(-1));
      const service = services.find(service => service.id === id);
      if (!service) return route.fulfill({ status: 404, json: { message: "Not found" } });
      if (route.request().method() === "DELETE") {
        writes++; service.status = "INACTIVE";
        return route.fulfill({ status: 204 });
      }
      if (route.request().method() === "PATCH") { writes++; Object.assign(service, route.request().postDataJSON()); }
      else details++;
      return route.fulfill({ json: service });
    });
  });

  test("cancels, deactivates and restores from the catalog without losing search", async ({ page }) => {
    await page.goto("/servicios");
    await page.getByLabel("Buscar por servicio o categoría", { exact: true }).fill("Corte");
    await page.getByRole("button", { name: "Desactivar Corte", exact: true }).click();
    await expect(page.getByRole("button", { name: "Cancelar", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    expect(writes).toBe(0);
    await page.getByRole("button", { name: "Desactivar Corte", exact: true }).click();
    await page.getByRole("button", { name: "Desactivar", exact: true }).click();
    await expect(page.getByRole("button", { name: "Restaurar Corte", exact: true })).toBeEnabled();
    await expect(page.getByTestId("floating-alert")).toContainText("Servicio desactivado");
    await expectAdminNotice(page);
    await expect(page.getByLabel("Buscar por servicio o categoría", { exact: true })).toHaveValue("Corte");
    await page.getByRole("button", { name: "Restaurar Corte", exact: true }).click();
    await page.getByRole("button", { name: "Restaurar", exact: true }).click();
    await expect(page.getByRole("button", { name: "Desactivar Corte", exact: true })).toBeEnabled();
    await expect(page.getByTestId("floating-alert")).toContainText("Servicio restaurado");
    expect(writes).toBe(2);
    expect(services).toHaveLength(2);
    await page.reload();
    await expect(page.getByRole("button", { name: "Desactivar Corte", exact: true })).toBeVisible();
    expect(details).toBe(0);
    await expectAdminViewport(page);
  });

  test("keeps the confirmation open after a failed write and allows retry", async ({ page }) => {
    await page.goto("/servicios");
    await page.route("**/api/backend/api/v1/service-offerings/1", route => route.fulfill({ status: 503, json: { message: "Failure" } }));
    await page.getByRole("button", { name: "Desactivar Corte", exact: true }).click();
    await page.getByRole("button", { name: "Desactivar", exact: true }).click();
    await expect(page.getByText("No pudimos desactivar el servicio. Intentá nuevamente.")).toBeVisible();
    await page.unroute("**/api/backend/api/v1/service-offerings/1");
    await page.getByRole("button", { name: "Desactivar", exact: true }).click();
    await expect(page.getByRole("button", { name: "Restaurar Corte", exact: true })).toBeEnabled();
    expect(writes).toBe(1);
  });

  test("blocks double submits and closing while saving", async ({ page }) => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/api/backend/api/v1/service-offerings/1", async route => {
      writes++; await gate; services[0].status = "INACTIVE";
      await route.fulfill({ status: 204 });
    });
    await page.goto("/servicios");
    await page.getByRole("button", { name: "Desactivar Corte", exact: true }).click();
    await page.getByRole("button", { name: "Desactivar", exact: true }).click();
    await expect(page.getByRole("button", { name: "Desactivando…", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Cancelar", exact: true })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toBeVisible();
    expect(writes).toBe(1); release();
    await expect(page.getByRole("button", { name: "Restaurar Corte", exact: true })).toBeEnabled();
  });

  test("retries reads only when refresh fails after a confirmed write", async ({ page }) => {
    await page.goto("/servicios");
    await expect(page.getByRole("button", { name: "Desactivar Corte", exact: true })).toBeVisible();
    let failed = true;
    await page.route("**/api/backend/api/v1/service-offerings?*", route => failed ? route.fulfill({ status: 503, json: { message: "Failure" } }) : route.fallback());
    await page.getByRole("button", { name: "Desactivar Corte", exact: true }).click();
    await page.getByRole("button", { name: "Desactivar", exact: true }).click();
    await expect(page.getByRole("button", { name: "Reintentar actualización" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Restaurar Corte", exact: true })).toBeEnabled();
    failed = false;
    await page.getByRole("button", { name: "Reintentar actualización" }).click();
    await expect(page.getByRole("button", { name: "Reintentar actualización" })).toHaveCount(0);
    expect(writes).toBe(1);
  });

  for (const restoring of [false, true]) test(`clamps the last page when ${restoring ? "restoring" : "deactivating"}`, async ({ page }) => {
    services = Array.from({ length: 21 }, (_, index) => ({ ...initial, id: index + 1, name: `Corte ${index + 1}`, status: restoring ? "INACTIVE" : "ACTIVE" }));
    await page.goto("/servicios");
    await page.getByRole("button", { name: "Filtros", exact: true }).click();
    await page.getByRole("radio", { name: restoring ? "Inactivos" : "Activos", exact: true }).click();
    await page.getByRole("button", { name: "Aplicar filtros", exact: true }).click();
    await page.getByRole("button", { name: "Siguiente", exact: true }).click();
    await page.getByRole("button", { name: `${restoring ? "Restaurar" : "Desactivar"} Corte 21`, exact: true }).click();
    await page.getByRole("button", { name: restoring ? "Restaurar" : "Desactivar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Corte 1", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Corte 21", exact: true })).toHaveCount(0);
    expect(writes).toBe(1);
    await expectAdminViewport(page);
  });

  test("has accessible confirmations and redirects former detail URLs", async ({ page }) => {
    await page.goto("/servicios/1");
    await expect(page).toHaveURL(/\/servicios$/);
    await expect(page.getByRole("link", { name: /Ver detalle/ })).toHaveCount(0);
    await page.getByRole("button", { name: "Desactivar Corte", exact: true }).click();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter(item => ["critical", "serious"].includes(item.impact ?? ""))).toEqual([]);
    await expectAdminViewport(page);
  });
  test("only inactive services can be removed, cancellation preserves them and success hides them and their category", async ({ page }) => {
    services[0].status = "INACTIVE";
    await page.goto("/servicios");
    await expect(page.getByRole("button", { name: "Eliminar Barba", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Eliminar Corte", exact: true }).click();
    await expect(page.getByText("Se quitará del catálogo y no podrás restaurarlo. Los turnos anteriores conservarán su información.")).toBeVisible();
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    expect(writes).toBe(0);
    await page.getByRole("button", { name: "Eliminar Corte", exact: true }).click();
    await page.getByRole("button", { name: "Eliminar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Corte", exact: true })).toHaveCount(0);
    await expect(page.getByTestId("floating-alert")).toContainText("Servicio eliminado");
    await expectAdminNotice(page);
    await page.getByRole("button", { name: "Filtros", exact: true }).click();
    await expect(page.getByRole("radio", { name: "Corte", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Cerrar filtros", exact: true }).click();
    await page.reload();
    await expect(page.getByRole("heading", { name: "Corte", exact: true })).toHaveCount(0);
    expect(writes).toBe(1);
    await expectAdminViewport(page);
  });

  test("does not remove a service when the server rejects elimination", async ({ page }) => {
    services[0].status = "INACTIVE";
    await page.route("**/api/backend/api/v1/service-offerings/1/catalog", route => route.fulfill({ status: 409, json: { message: "Conflict" } }));
    await page.goto("/servicios");
    await page.getByRole("button", { name: "Eliminar Corte", exact: true }).click();
    await page.getByRole("button", { name: "Eliminar", exact: true }).click();
    await expect(page.getByText("No pudimos eliminar el servicio. Intentá nuevamente.")).toBeVisible();
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await expect(page.getByRole("button", { name: "Restaurar Corte", exact: true })).toBeEnabled();
    expect(writes).toBe(0);
  });

});
