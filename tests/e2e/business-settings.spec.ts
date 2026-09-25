import { expect, test } from "@playwright/test";

const authMeUrl = "**/api/backend/api/v1/auth/me";
const businessUrl = "**/api/backend/api/v1/business";

const currentUser = {
  business: { id: 10, name: "Barber Studio", onboarding_status: "COMPLETED", slug: "barber-studio" },
  user: { avatar_url: null, email: "juan@example.com", id: 1, name: "Juan Perez", role: "OWNER" },
};

const currentBusiness = {
  address: "Av. Palermo 1842, Buenos Aires",
  created_at: "2026-09-17T10:00:00",
  email: "hola@barberstudio.demo",
  id: 10,
  industry: "Barbería premium",
  name: "Barber Studio",
  onboarding_status: "COMPLETED",
  phone: "+54 11 4567-9821",
  slug: "barber-studio",
  status: "ACTIVE",
  timezone: "America/Argentina/Buenos_Aires",
  updated_at: "2026-09-17T10:00:00",
};

function isMobileProject(projectName: string) {
  return projectName.startsWith("mobile");
}

test.describe("business settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(authMeUrl, (route) => route.fulfill({ contentType: "application/json", json: currentUser, status: 200 }));
  });

  test("hydrates editable business data and keeps system fields out of view", async ({ page }, testInfo) => {
    await page.route(businessUrl, (route) => route.fulfill({ contentType: "application/json", json: currentBusiness, status: 200 }));
    await page.goto("/configuracion");

    await expect(page.getByRole("heading", { name: "Configuración" })).toBeVisible();
    await expect(page.getByLabel("Nombre del negocio")).toHaveValue("Barber Studio");
    await expect(page.getByLabel("Correo electrónico")).toHaveValue("hola@barberstudio.demo");
    await expect(page.getByLabel("Zona horaria")).toHaveValue("America/Argentina/Buenos_Aires");
    await expect(page.getByRole("link", { name: "Configurar reglas de reserva" })).toHaveAttribute("href", "/configuracion/reservas");
    await expect(page.getByRole("link", { name: "Configurar horarios de atención" })).toHaveAttribute("href", "/configuracion/horarios");
    await expect(page.getByTestId("business-time-reference")).toContainText(
      isMobileProject(testInfo.project.name) ? "Argentina — Buenos Aires" : "Hora actual de referencia en Argentina — Buenos Aires:",
    );
    await expect(page.getByText("barber-studio")).not.toBeVisible();
  });

  test("enables saving only for unsaved edits and disables it again after reverting or saving", async ({ page }) => {
    let saveCalls = 0;
    await page.route(businessUrl, async (route) => {
      if (route.request().method() === "PATCH") {
        saveCalls += 1;
        await route.fulfill({ contentType: "application/json", json: { ...currentBusiness, name: "Studio Nuevo" }, status: 200 });
        return;
      }
      await route.fulfill({ contentType: "application/json", json: currentBusiness, status: 200 });
    });
    await page.goto("/configuracion");

    const name = page.getByLabel("Nombre del negocio");
    const save = page.getByRole("button", { name: "Guardar cambios" });
    await expect(save).toBeDisabled();
    await name.fill("Studio Nuevo");
    await expect(save).toBeEnabled();
    await name.fill("Barber Studio");
    await expect(save).toBeDisabled();
    await name.fill("Studio Nuevo");
    await save.click();
    await expect(page.getByText("Cambios guardados")).toBeVisible();
    await expect(save).toBeDisabled();
    expect(saveCalls).toBe(1);
  });

  test("saves only editable fields and refreshes the business name in the shell", async ({ page }, testInfo) => {
    await page.route(businessUrl, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ contentType: "application/json", json: currentBusiness, status: 200 });
        return;
      }

      expect(route.request().method()).toBe("PATCH");
      expect(route.request().postDataJSON()).toEqual({
        address: "Av. Palermo 1842, Buenos Aires",
        email: "hola@barberstudio.demo",
        industry: "Barbería premium",
        name: "Studio Renuevo",
        phone: "+54 11 4567-9821",
        timezone: "America/Montevideo",
      });
      await route.fulfill({
        contentType: "application/json",
        json: { ...currentBusiness, name: "Studio Renuevo", timezone: "America/Montevideo" },
        status: 200,
      });
    });
    await page.goto("/configuracion");
    await page.getByLabel("Nombre del negocio").fill("Studio Renuevo");
    await page.getByLabel("Zona horaria").selectOption("America/Montevideo");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByText("Cambios guardados")).toBeVisible();
    const alertBox = await page.getByTestId("floating-alert").boundingBox();
    const saveBox = await page.getByRole("button", { name: "Guardar cambios" }).boundingBox();
    expect(alertBox).not.toBeNull();
    expect(saveBox).not.toBeNull();
    const gap = (saveBox?.y ?? 0) - (alertBox?.y ?? 0) - (alertBox?.height ?? 0);
    if (isMobileProject(testInfo.project.name)) expect(gap).toBeGreaterThanOrEqual(0);
    else expect(gap).toBeCloseTo(8, 0);
    await expect(page.getByTestId("business-time-reference")).toContainText(
      isMobileProject(testInfo.project.name) ? "Uruguay" : "Hora actual de referencia en Uruguay:",
    );
    if (!isMobileProject(testInfo.project.name)) {
      await expect(page.locator("aside").getByText("Studio Renuevo")).toBeVisible();
    } else {
      await expect(page.getByRole("banner").getByText("Studio Renuevo")).toBeVisible();
    }

    await page.getByRole("button", { name: "Cerrar confirmación" }).click();
    await expect(page.getByText("Cambios guardados")).not.toBeVisible();
  });

  test("keeps the mobile save action above the persistent navigation", async ({ page }, testInfo) => {
    test.skip(!isMobileProject(testInfo.project.name), "Mobile-only layout check.");
    await page.route(businessUrl, (route) => route.fulfill({ contentType: "application/json", json: currentBusiness, status: 200 }));
    await page.goto("/configuracion");

    const saveButton = page.getByTestId("business-settings-mobile-save");
    const navigation = page.getByRole("navigation", { name: "Navegación principal" });
    await expect(saveButton).toBeVisible();
    await expect(saveButton.evaluate((element) => getComputedStyle(element.parentElement!).position)).resolves.toBe("fixed");
    await expect(saveButton.evaluate((element) => getComputedStyle(element.parentElement!).bottom)).resolves.not.toBe("auto");
    const [saveBox, navigationBox] = await Promise.all([saveButton.boundingBox(), navigation.boundingBox()]);

    expect(saveBox).not.toBeNull();
    expect(navigationBox).not.toBeNull();
    expect((saveBox?.y ?? 0) + (saveBox?.height ?? 0)).toBeLessThanOrEqual(navigationBox?.y ?? 0);
  });

  test("shows server validation errors beside their fields", async ({ page }) => {
    await page.route(businessUrl, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ contentType: "application/json", json: currentBusiness, status: 200 });
        return;
      }
      await route.fulfill({
        contentType: "application/json",
        json: {
          code: "VALIDATION_ERROR",
          details: [{ field: "email", message: "El correo ya está en uso." }],
          message: "Validation error",
          status: 400,
        },
        status: 400,
      });
    });
    await page.goto("/configuracion");
    await page.getByLabel("Correo electrónico").fill("nuevo@barberstudio.demo");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByText("El correo ya está en uso.")).toBeInViewport();
    await expect(page.getByLabel("Correo electrónico")).toBeFocused();
    await expect(page.getByLabel("Correo electrónico")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByTestId("floating-alert")).not.toBeVisible();
  });

  test("validates required fields before sending the update", async ({ page }) => {
    let patchCalls = 0;
    await page.route(businessUrl, async (route) => {
      if (route.request().method() === "PATCH") patchCalls += 1;
      await route.fulfill({ contentType: "application/json", json: currentBusiness, status: 200 });
    });
    await page.goto("/configuracion");
    await page.getByLabel("Nombre del negocio").fill("");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByText("Ingresá el nombre del negocio.")).toBeInViewport();
    await expect(page.getByLabel("Nombre del negocio")).toBeFocused();
    await expect(page.getByLabel("Nombre del negocio")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByTestId("floating-alert")).not.toBeVisible();
    expect(patchCalls).toBe(0);
  });

  test("offers a retry when loading the business fails", async ({ page }) => {
    let attempts = 0;
    await page.route(businessUrl, async (route) => {
      attempts += 1;
      if (attempts === 1) {
        await route.abort("failed");
        return;
      }
      await route.fulfill({ contentType: "application/json", json: currentBusiness, status: 200 });
    });
    await page.goto("/configuracion");

    await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();
    await page.getByRole("button", { name: "Reintentar" }).click();
    await expect(page.getByLabel("Nombre del negocio")).toHaveValue("Barber Studio");
  });
});
