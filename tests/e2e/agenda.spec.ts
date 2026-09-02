import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const authMeUrl = "http://127.0.0.1:3000/api/v1/auth/me";

test.describe("agenda smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(authMeUrl, async (route) => {
      await route.fulfill({
        contentType: "application/json",
        json: {
          businessId: 10,
          businessName: "Barber Studio",
          businessSlug: "barber-studio",
          email: "juan@example.com",
          name: "Juan Perez",
          role: "ADMIN",
          userId: 1,
        },
        status: 200,
      });
    });
  });

  test("renders the desktop agenda and exposes core operational content", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Desktop-only smoke.");

    await page.goto("/");

    const board = page.getByTestId("desktop-agenda-board");

    await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();
    await expect(page.getByText("Martes 28 de abril · Operación diaria")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Principal" })).toBeVisible();
    await expect(board.getByText("Santiago Moreno")).toBeVisible();
    await expect(board.getByText("Disponible").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Nuevo turno" })).toBeVisible();
  });

  test("renders the mobile agenda and filters pending appointments", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Mobile-only smoke.");

    await page.goto("/");

    await expect(page.getByText("Agenda de hoy")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Navegación principal" })).toBeVisible();

    await page.getByRole("button", { name: "Pendientes" }).click();

    const list = page.getByTestId("mobile-agenda-list");

    await expect(list.getByText("Martin Costa")).toBeVisible();
    await expect(list.getByText("Confirmar por WhatsApp").first()).toBeVisible();
  });

  test("filters the mobile agenda by staff member", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Mobile-only smoke.");

    await page.goto("/");

    await page.getByRole("button", { name: "Mateo" }).click();

    const list = page.getByTestId("mobile-agenda-list");

    await expect(list.getByText("Santiago Moreno")).toBeVisible();
    await expect(list.getByText("Lucas Pereira")).not.toBeVisible();
  });

  test("has no critical accessibility violations", async ({ page }) => {
    await page.goto("/");

    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast"])
      .withTags(["wcag2a", "wcag2aa"])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test("opens the desktop appointment drawer and prepares a mock appointment", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Desktop-only smoke.");

    await page.goto("/");

    await page.getByRole("button", { name: "Nuevo turno" }).click();

    const drawer = page.getByLabel("Crear turno");
    const form = drawer.getByTestId("appointment-flow");

    await expect(drawer.getByRole("heading", { name: "Nuevo turno" })).toBeVisible();
    await expect(form.getByRole("heading", { name: "Cliente" })).toBeVisible();
    await expect(form.getByRole("heading", { name: "Servicio" })).toBeVisible();

    await form.getByRole("button", { name: "Crear turno" }).click();

    await expect(form.getByText("Turno preparado")).toBeVisible();
  });

  test("opens the mobile appointment screen and validates quick customer fields", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Mobile-only smoke.");

    await page.goto("/");

    await page.getByRole("button", { name: "Nuevo turno" }).click();

    const form = page.getByTestId("appointment-flow");

    await expect(page.getByRole("heading", { name: "Crear turno" })).toBeVisible();
    await form.getByRole("button", { name: "Rapido" }).click();
    await form.getByLabel("Nombre del cliente").fill("Ana Gomez");
    await form.getByLabel("Telefono del cliente").fill("+54 11 6000-0000");
    await form.getByRole("button", { name: "Crear turno" }).click();

    await expect(form.getByText("Turno preparado")).toBeVisible();
  });
});
