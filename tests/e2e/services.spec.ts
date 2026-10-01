import { expect, test } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

const currentUser = {
  business: { id: 10, name: "Barber Studio", onboarding_status: "COMPLETED", slug: "barber-studio" },
  user: { avatar_url: null, email: "juan@example.com", id: 1, name: "Juan Perez", role: "OWNER" },
};

const offering = (id: number, name: string, category = "Corte", status = "ACTIVE") => ({
  id, name, category, duration_minutes: 30, price_cents: 250000, status,
});

test.describe("services", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/backend/api/v1/auth/me", (route) => route.fulfill({ json: currentUser }));
    await page.route("**/api/backend/api/v1/service-offerings/categories", (route) => route.fulfill({ json: ["Corte", "Barba", "Color"] }));
  });

  test("searches, filters, and paginates", async ({ page }) => {
    const requests: URL[] = [];
    await page.route("**/api/backend/api/v1/service-offerings?*", (route) => {
      const url = new URL(route.request().url());
      requests.push(url);
      const currentPage = Number(url.searchParams.get("page"));
      const name = currentPage === 0 ? "Corte clásico" : "Corte premium";
      return route.fulfill({ json: { data: [offering(currentPage + 1, name)], page: { number: currentPage, size: 20, total_elements: 21, total_pages: 2 } } });
    });
    await page.goto("/servicios");
    await expect(page.getByRole("heading", { name: "Corte clásico" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
    await page.getByRole("button", { name: "Siguiente" }).click();
    await expect(page.getByRole("heading", { name: "Corte premium" })).toBeVisible();
    await page.getByRole("button", { name: /^Filtros/ }).click();
    await page.getByRole("radio", { name: "Barba", exact: true }).check();
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(page.getByText("Página 1 de 2")).toBeVisible();
    await page.getByRole("button", { name: /^Filtros/ }).click();
    await page.getByRole("radio", { name: "Inactivos", exact: true }).check();
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await page.getByRole("searchbox", { name: "Buscar por servicio o categoría" }).fill("barba");
    await expect.poll(() => requests.at(-1)?.searchParams.get("q")).toBe("barba");
    expect(requests.at(-1)?.searchParams.get("category")).toBe("Barba");
    expect(requests.at(-1)?.searchParams.get("status")).toBe("INACTIVE");
    expect(requests.at(-1)?.searchParams.get("page")).toBe("0");
  });

  test("distinguishes empty catalog and no matches", async ({ page }) => {
    await page.route("**/api/backend/api/v1/service-offerings?*", (route) => route.fulfill({ json: { data: [], page: { number: 0, size: 20, total_elements: 0, total_pages: 0 } } }));
    await page.goto("/servicios");
    await expect(page.getByText("Todavía no hay servicios")).toBeVisible();
    await page.getByRole("button", { name: /^Filtros/ }).click();
    await page.getByRole("radio", { name: "Activos", exact: true }).check();
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(page.getByText("No encontramos servicios")).toBeVisible();
  });

  test("has no basic accessibility violations", async ({ page }) => {
    await page.route("**/api/backend/api/v1/service-offerings?*", (route) => route.fulfill({ json: { data: [offering(1, "Corte clásico")], page: { number: 0, size: 20, total_elements: 1, total_pages: 1 } } }));
    await page.goto("/servicios");
    await expect(page.getByRole("heading", { name: "Corte clásico" })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(results.violations).toEqual([]);
    await page.getByRole("button", { name: /^Filtros/ }).click();
    const dialogResults = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    expect(dialogResults.violations).toEqual([]);
  });

  test("applies draft filters, cancels edits, removes pills, and clears", async ({ page }) => {
    const requests: URL[] = [];
    await page.route("**/api/backend/api/v1/service-offerings?*", route => {
      requests.push(new URL(route.request().url()));
      return route.fulfill({ json: { data: [offering(1, "Corte clásico")], page: { number: 0, size: 20, total_elements: 1, total_pages: 1 } } });
    });
    await page.goto("/servicios");
    await expect(page.getByRole("heading", { name: "Corte clásico" })).toBeVisible();
    const initialRequests = requests.length;
    const trigger = page.getByRole("button", { name: /^Filtros/ });
    await trigger.click();
    await page.getByRole("radio", { name: "Activos", exact: true }).check();
    await page.getByRole("radio", { name: "Barba", exact: true }).check();
    expect(requests.length).toBe(initialRequests);
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(trigger).toBeFocused();
    await expect.poll(() => requests.at(-1)?.searchParams.get("status")).toBe("ACTIVE");
    await expect(page.getByRole("button", { name: "Quitar categoría Barba" })).toBeVisible();
    await expect(trigger).toHaveText("Filtros2");
    await trigger.click();
    await page.getByRole("radio", { name: "Inactivos", exact: true }).check();
    await page.keyboard.press("Escape");
    await trigger.click();
    await expect(page.getByRole("radio", { name: "Activos", exact: true })).toBeChecked();
    await page.getByRole("button", { name: "Cerrar filtros" }).click();
    await page.getByRole("button", { name: "Quitar categoría Barba" }).click();
    await expect.poll(() => requests.at(-1)?.searchParams.has("category")).toBe(false);
    await expect(trigger).toHaveText("Filtros1");
    await trigger.click();
    await page.getByRole("button", { name: "Limpiar", exact: true }).click();
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(page.getByRole("button", { name: "Quitar filtro de estado" })).toHaveCount(0);
    await expect(trigger).toHaveText("Filtros");
  });

  test("searches a large category catalog inside the dialog", async ({ page }) => {
    await page.route("**/api/backend/api/v1/service-offerings/categories", route => route.fulfill({ json: ["Barba", ...Array.from({ length: 12 }, (_, i) => `Categoría ${i}`)] }));
    await page.route("**/api/backend/api/v1/service-offerings?*", route => route.fulfill({ json: { data: [], page: { number: 0, size: 20, total_elements: 0, total_pages: 0 } } }));
    await page.goto("/servicios");
    await page.getByRole("button", { name: /^Filtros/ }).click();
    await page.getByRole("searchbox", { name: "Buscar categoría", exact: true }).fill("barba");
    await expect(page.getByRole("radio", { name: "Barba", exact: true })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Categoría 0", exact: true })).toHaveCount(0);
    await page.getByRole("radio", { name: "Barba", exact: true }).check();
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(page.getByRole("button", { name: "Quitar categoría Barba" })).toBeVisible();
  });

  test("retries an error and ignores a late prior response", async ({ page }) => {
    let calls = 0;
    let fail = true;
    await page.route("**/api/backend/api/v1/service-offerings?*", async (route) => {
      calls += 1;
      if (fail) return route.fulfill({ status: 503, json: { message: "Unavailable" } });
      const status = new URL(route.request().url()).searchParams.get("status");
      if (status === "ACTIVE") await new Promise((resolve) => setTimeout(resolve, 500));
      return route.fulfill({ json: { data: [offering(calls, status === "ACTIVE" ? "Respuesta vieja" : "Servicio actual")], page: { number: 0, size: 20, total_elements: 1, total_pages: 1 } } });
    });
    await page.goto("/servicios");
    await expect(page.getByText("No se pudieron cargar los servicios.", { exact: false })).toBeVisible();
    fail = false;
    await page.getByRole("button", { name: "Reintentar" }).last().click();
    await expect(page.getByRole("heading", { name: "Servicio actual" })).toBeVisible();
    await page.getByRole("button", { name: /^Filtros/ }).click();
    await page.getByRole("radio", { name: "Activos", exact: true }).check();
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await page.getByRole("button", { name: /^Filtros/ }).click();
    await page.getByRole("radio", { name: "Inactivos", exact: true }).check();
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await expect(page.getByRole("heading", { name: "Servicio actual" })).toBeVisible();
    await page.waitForTimeout(600);
    await expect(page.getByRole("heading", { name: "Respuesta vieja" })).toHaveCount(0);
  });
});
