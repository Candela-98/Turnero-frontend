import { expect, test } from "@playwright/test";

const authMeUrl = "http://127.0.0.1:3000/api/backend/api/v1/auth/me";
const businessHoursUrl = "http://127.0.0.1:3000/api/backend/api/v1/business-hours";

const currentUser = {
  business: { id: 10, name: "Barber Studio", onboarding_status: "COMPLETED", slug: "barber-studio" },
  user: { avatar_url: null, email: "juan@example.com", id: 1, name: "Juan Perez", role: "OWNER" },
};

const weekdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;

function weeklyHours({ closedMonday = false, closedSunday = false, unordered = false } = {}) {
  const data = weekdays.map((day, index) => {
    const isClosed = (closedMonday && day === "MONDAY") || (closedSunday && day === "SUNDAY");
    return {
      closes_at: isClosed ? null : "18:00",
      day_of_week: day,
      id: index + 1,
      is_closed: isClosed,
      opens_at: isClosed ? null : "09:00",
    };
  });

  return { data: unordered ? [data[6], ...data.slice(0, 6)] : data };
}

function isMobileProject(projectName: string) {
  return projectName.startsWith("mobile");
}

test.describe("business hours", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(authMeUrl, (route) => route.fulfill({ contentType: "application/json", json: currentUser, status: 200 }));
  });

  test("orders an unordered weekly response from Monday through Sunday", async ({ page }) => {
    await page.route(businessHoursUrl, (route) => route.fulfill({ contentType: "application/json", json: weeklyHours({ unordered: true }), status: 200 }));
    await page.goto("/configuracion/horarios");

    await expect(page.getByRole("heading", { name: "Horarios de atención" })).toBeVisible();
    await expect(page.locator("fieldset p.font-semibold")).toHaveText([
      "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo",
    ]);
    await expect(page.getByLabel("Martes: apertura")).toHaveValue("09:00");
  });

  test("replaces the full week and sends null hours for a closed day", async ({ page }, testInfo) => {
    await page.route(businessHoursUrl, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ contentType: "application/json", json: weeklyHours(), status: 200 });
        return;
      }

      expect(route.request().method()).toBe("PUT");
      expect(route.request().postDataJSON()).toEqual({
        hours: [
          { closes_at: null, day_of_week: "MONDAY", is_closed: true, opens_at: null },
          ...weekdays.slice(1).map((day) => ({ closes_at: "18:00", day_of_week: day, is_closed: false, opens_at: "09:00" })),
        ],
      });
      await route.fulfill({ contentType: "application/json", json: weeklyHours({ closedMonday: true }), status: 200 });
    });
    await page.goto("/configuracion/horarios");
    await page.getByRole("switch", { name: "Lunes: abierto" }).click();
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByText("Cambios guardados")).toBeVisible();
    await expect(page.getByText("Los horarios del negocio están actualizados.")).toBeVisible();
    await expect(page.getByTestId("floating-alert")).toBeInViewport();
    if (isMobileProject(testInfo.project.name)) {
      const alertBox = await page.getByTestId("floating-alert").boundingBox();
      const saveBox = await page.getByTestId("business-hours-mobile-save").boundingBox();
      expect(alertBox).not.toBeNull();
      expect(saveBox).not.toBeNull();
      expect((alertBox?.y ?? 0) + (alertBox?.height ?? 0)).toBeLessThanOrEqual(saveBox?.y ?? 0);
    }
  });

  test("closes a successful save notice automatically", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "The shared six-second timer needs one browser coverage run.");
    await page.route(businessHoursUrl, (route) => route.fulfill({ contentType: "application/json", json: weeklyHours({ closedMonday: route.request().method() === "PUT" }), status: 200 }));
    await page.goto("/configuracion/horarios");
    await page.getByRole("switch", { name: "Lunes: abierto" }).click();
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByText("Cambios guardados")).toBeInViewport();
    await page.mouse.move(0, 0);
    await expect(page.getByTestId("floating-alert")).not.toBeVisible({ timeout: 8_000 });
  });

  test("keeps invalid open-day hours in the form without sending a replacement", async ({ page }) => {
    let putCalls = 0;
    await page.route(businessHoursUrl, async (route) => {
      if (route.request().method() === "PUT") putCalls += 1;
      await route.fulfill({ contentType: "application/json", json: weeklyHours(), status: 200 });
    });
    await page.goto("/configuracion/horarios");
    await page.getByLabel("Lunes: cierre").fill("08:00");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByText("La hora de cierre debe ser posterior a la apertura.")).toBeVisible();
    await expect(page.getByLabel("Lunes: cierre")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Lunes: cierre")).toBeFocused();
    await page.getByRole("button", { name: "Cerrar resumen de errores" }).click();
    await expect(page.getByText("Revisá los horarios", { exact: true })).not.toBeVisible();
    await expect(page.getByText("La hora de cierre debe ser posterior a la apertura.")).toBeVisible();
    expect(putCalls).toBe(0);
  });

  test("scrolls gradually to the first invalid time field", async ({ page }, testInfo) => {
    test.skip(isMobileProject(testInfo.project.name), "Desktop scroll duration check.");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.route(businessHoursUrl, (route) => route.fulfill({ contentType: "application/json", json: weeklyHours(), status: 200 }));
    await page.goto("/configuracion/horarios");
    await page.getByLabel("Lunes: cierre").fill("08:00");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    const start = await page.evaluate(() => window.scrollY);
    await page.waitForTimeout(300);
    const midway = await page.evaluate(() => window.scrollY);
    await expect(page.getByLabel("Lunes: cierre")).toBeFocused();
    const end = await page.evaluate(() => window.scrollY);

    expect(start - midway).toBeGreaterThan(100);
    expect(midway - end).toBeGreaterThan(100);
  });

  test("shows the error summary beside an invalid Sunday field", async ({ page }) => {
    await page.route(businessHoursUrl, (route) => route.fulfill({ contentType: "application/json", json: weeklyHours(), status: 200 }));
    await page.goto("/configuracion/horarios");
    await page.getByLabel("Domingo: apertura").fill("");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByLabel("Domingo: apertura")).toBeFocused();
    await expect(page.getByText("Revisá los horarios", { exact: true })).toBeInViewport();
    await expect(page.getByText("Ingresá una hora de apertura.")).toBeInViewport();
  });

  test("does not send a replacement after reopening and reclosing Sunday", async ({ page }) => {
    let putCalls = 0;
    await page.route(businessHoursUrl, (route) => {
      if (route.request().method() === "PUT") putCalls += 1;
      return route.fulfill({ contentType: "application/json", json: weeklyHours({ closedSunday: true }), status: 200 });
    });
    await page.goto("/configuracion/horarios");

    const sundaySwitch = page.getByRole("switch", { name: "Domingo: abierto" });
    await sundaySwitch.click();
    await page.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(page.getByText("Ingresá una hora de apertura.")).toBeVisible();

    await sundaySwitch.click();
    await expect(page.getByText("Revisá los horarios", { exact: true })).not.toBeVisible();
    await expect(page.getByText("No pudimos guardar los horarios", { exact: true })).not.toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    expect(putCalls).toBe(0);
  });

  test("shows a retry after an API failure and recovers", async ({ page }) => {
    let attempts = 0;
    await page.route(businessHoursUrl, async (route) => {
      attempts += 1;
      if (attempts === 1) {
        await route.fulfill({ contentType: "application/json", json: { message: "Forbidden" }, status: 403 });
        return;
      }
      await route.fulfill({ contentType: "application/json", json: weeklyHours(), status: 200 });
    });
    await page.goto("/configuracion/horarios");

    await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();
    await page.getByRole("button", { name: "Reintentar" }).click();
    await expect(page.getByLabel("Lunes: apertura")).toHaveValue("09:00");
  });

  test("shows an API save failure without discarding the form", async ({ page }, testInfo) => {
    await page.route(businessHoursUrl, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ contentType: "application/json", json: weeklyHours(), status: 200 });
        return;
      }
      await route.fulfill({ contentType: "application/json", json: { message: "Unauthorized" }, status: 401 });
    });
    await page.goto("/configuracion/horarios");
    await page.getByLabel("Martes: apertura").fill("10:00");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByText("No pudimos guardar los horarios", { exact: true })).toBeVisible();
    await expect(page.getByTestId("floating-alert")).toBeInViewport();
    await expect(page.getByLabel("Martes: apertura")).toHaveValue("10:00");
    if (testInfo.project.name === "mobile") {
      await page.waitForTimeout(6_200);
      await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();
      await page.getByRole("button", { name: "Cerrar error" }).click();
      await expect(page.getByTestId("floating-alert")).not.toBeVisible();
    }
  });

  test("keeps the mobile save action above the persistent navigation", async ({ page }, testInfo) => {
    test.skip(!isMobileProject(testInfo.project.name), "Mobile-only layout check.");
    await page.route(businessHoursUrl, (route) => route.fulfill({ contentType: "application/json", json: weeklyHours(), status: 200 }));
    await page.goto("/configuracion/horarios");

    const saveButton = page.getByTestId("business-hours-mobile-save");
    const navigation = page.getByRole("navigation", { name: "Navegación principal" });
    await expect(saveButton).toBeVisible();
    const [saveBox, navigationBox] = await Promise.all([saveButton.boundingBox(), navigation.boundingBox()]);

    expect(saveBox).not.toBeNull();
    expect(navigationBox).not.toBeNull();
    expect((saveBox?.y ?? 0) + (saveBox?.height ?? 0)).toBeLessThanOrEqual(navigationBox?.y ?? 0);
  });
});
