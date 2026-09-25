import { expect, test } from "@playwright/test";

const authMeUrl = "http://127.0.0.1:3000/api/backend/api/v1/auth/me";
const bookingSettingsUrl = "http://127.0.0.1:3000/api/backend/api/v1/booking-settings";

const currentUser = {
  business: { id: 10, name: "Barber Studio", onboarding_status: "COMPLETED", slug: "barber-studio" },
  user: { avatar_url: null, email: "juan@example.com", id: 1, name: "Juan Perez", role: "OWNER" },
};

const currentBookingSettings = {
  booking_window_days: 7,
  cancellation_notice_hours: 3,
  created_at: "2026-09-22T10:00:00Z",
  manual_confirmation_enabled: true,
  min_notice_hours: 2,
  public_booking_enabled: true,
  requires_customer_login: false,
  slot_interval_minutes: 30,
  updated_at: "2026-09-22T10:00:00Z",
  whatsapp_reminders_enabled: false,
};

function isMobileProject(projectName: string) {
  return projectName.startsWith("mobile");
}

test.describe("booking settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(authMeUrl, (route) => route.fulfill({ contentType: "application/json", json: currentUser, status: 200 }));
  });

  test("hydrates editable rules and keeps post-MVP fields out of view", async ({ page }) => {
    await page.route(bookingSettingsUrl, (route) => route.fulfill({ contentType: "application/json", json: currentBookingSettings, status: 200 }));
    await page.goto("/configuracion/reservas");

    await expect(page.getByRole("heading", { name: "Reglas de reserva" })).toBeVisible();
    await expect(page.getByRole("switch", { name: "Aceptar reservas online" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("switch", { name: "Requerir confirmación manual" })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByLabel("Ventana de reserva")).toHaveValue("7");
    await expect(page.getByLabel("Intervalo de agenda")).toHaveValue("30");
    await expect(page.getByText("Reservas sin login")).not.toBeVisible();
    await expect(page.getByText("WhatsApp")).not.toBeVisible();
  });

  test("enables saving only for unsaved edits and disables it again after reverting or saving", async ({ page }) => {
    let saveCalls = 0;
    await page.route(bookingSettingsUrl, async (route) => {
      if (route.request().method() === "PATCH") {
        saveCalls += 1;
        await route.fulfill({ contentType: "application/json", json: { ...currentBookingSettings, public_booking_enabled: false }, status: 200 });
        return;
      }
      await route.fulfill({ contentType: "application/json", json: currentBookingSettings, status: 200 });
    });
    await page.goto("/configuracion/reservas");

    const toggle = page.getByRole("switch", { name: "Aceptar reservas online" });
    const save = page.getByRole("button", { name: "Guardar cambios" });
    await expect(save).toBeDisabled();
    await toggle.click();
    await expect(save).toBeEnabled();
    await toggle.click();
    await expect(save).toBeDisabled();
    await toggle.click();
    await save.click();
    await expect(page.getByText("Cambios guardados")).toBeVisible();
    await expect(save).toBeDisabled();
    expect(saveCalls).toBe(1);
  });

  test("saves all editable rules and never sends post-MVP fields", async ({ page }, testInfo) => {
    await page.route(bookingSettingsUrl, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ contentType: "application/json", json: currentBookingSettings, status: 200 });
        return;
      }

      expect(route.request().method()).toBe("PATCH");
      expect(route.request().postDataJSON()).toEqual({
        booking_window_days: 14,
        cancellation_notice_hours: 4,
        manual_confirmation_enabled: false,
        min_notice_hours: 1,
        public_booking_enabled: false,
        slot_interval_minutes: 45,
      });
      await route.fulfill({
        contentType: "application/json",
        json: {
          ...currentBookingSettings,
          booking_window_days: 14,
          cancellation_notice_hours: 4,
          manual_confirmation_enabled: false,
          min_notice_hours: 1,
          public_booking_enabled: false,
          slot_interval_minutes: 45,
        },
        status: 200,
      });
    });
    await page.goto("/configuracion/reservas");
    await page.getByRole("switch", { name: "Aceptar reservas online" }).click();
    await page.getByRole("switch", { name: "Requerir confirmación manual" }).click();
    await page.getByLabel("Ventana de reserva").fill("14");
    await page.getByLabel("Anticipación mínima para reservar").fill("1");
    await page.getByLabel("Anticipación para cancelar").fill("4");
    await page.getByLabel("Intervalo de agenda").selectOption("45");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByText("Cambios guardados")).toBeVisible();
    const alertBox = await page.getByTestId("floating-alert").boundingBox();
    const saveBox = await page.getByRole("button", { name: "Guardar cambios" }).boundingBox();
    expect(alertBox).not.toBeNull();
    expect(saveBox).not.toBeNull();
    const gap = (saveBox?.y ?? 0) - (alertBox?.y ?? 0) - (alertBox?.height ?? 0);
    if (isMobileProject(testInfo.project.name)) expect(gap).toBeGreaterThanOrEqual(0);
    else expect(gap).toBeCloseTo(8, 0);
    await page.getByRole("button", { name: "Cerrar confirmación" }).click();
    await expect(page.getByText("Cambios guardados")).not.toBeVisible();
  });

  test("offers every allowed interval", async ({ page }) => {
    await page.route(bookingSettingsUrl, (route) => route.fulfill({ contentType: "application/json", json: currentBookingSettings, status: 200 }));
    await page.goto("/configuracion/reservas");

    const interval = page.getByLabel("Intervalo de agenda");
    for (const value of ["15", "30", "45", "60"]) {
      await interval.selectOption(value);
      await expect(interval).toHaveValue(value);
    }
  });

  test("shows invalid ranges beside their fields without sending a request", async ({ page }) => {
    let patchCalls = 0;
    await page.route(bookingSettingsUrl, async (route) => {
      if (route.request().method() === "PATCH") patchCalls += 1;
      await route.fulfill({ contentType: "application/json", json: currentBookingSettings, status: 200 });
    });
    await page.goto("/configuracion/reservas");
    await page.getByLabel("Ventana de reserva").fill("0");
    await page.getByLabel("Anticipación mínima para reservar").fill("-1");
    await page.getByLabel("Anticipación para cancelar").fill("");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByTestId("floating-alert")).not.toBeVisible();
    await expect(page.getByText("Ingresá una cantidad entera de al menos 1 día.")).toBeInViewport();
    await expect(page.getByText("Ingresá una cantidad entera de 0 horas o más.")).toHaveCount(2);
    await expect(page.getByLabel("Anticipación para cancelar")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Ventana de reserva")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByLabel("Ventana de reserva")).toBeFocused();
    await expect(page.getByTestId("form-validation-summary")).toHaveCount(0);
    await expect(page.getByLabel("Anticipación para cancelar")).toHaveAttribute("aria-invalid", "true");
    expect(patchCalls).toBe(0);
  });

  test("shows API validation beside the affected field", async ({ page }) => {
    await page.route(bookingSettingsUrl, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ contentType: "application/json", json: currentBookingSettings, status: 200 });
        return;
      }
      await route.fulfill({
        contentType: "application/json",
        json: {
          code: "VALIDATION_ERROR",
          details: [{ field: "bookingWindowDays", message: "La ventana supera el máximo permitido." }],
          message: "Validation error",
          status: 400,
        },
        status: 400,
      });
    });
    await page.goto("/configuracion/reservas");
    await page.getByLabel("Ventana de reserva").fill("90");
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(page.getByText("La ventana supera el máximo permitido.")).toBeVisible();
    await expect(page.getByLabel("Ventana de reserva")).toBeFocused();
    await expect(page.getByLabel("Ventana de reserva")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("La ventana supera el máximo permitido.")).toBeInViewport();
    await expect(page.getByTestId("floating-alert")).not.toBeVisible();
  });

  test("shows API validation beside an affected switch", async ({ page }) => {
    await page.route(bookingSettingsUrl, async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ contentType: "application/json", json: currentBookingSettings, status: 200 });
        return;
      }
      await route.fulfill({
        contentType: "application/json",
        json: {
          code: "VALIDATION_ERROR",
          details: [{ field: "manualConfirmationEnabled", message: "La confirmación manual no está disponible." }],
          message: "Validation error",
          status: 400,
        },
        status: 400,
      });
    });
    await page.goto("/configuracion/reservas");
    const confirmation = page.getByRole("switch", { name: "Requerir confirmación manual" });
    await confirmation.click();
    await page.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(confirmation).toBeFocused();
    await expect(confirmation).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("La confirmación manual no está disponible.")).toBeInViewport();
    await expect(page.getByTestId("floating-alert")).not.toBeVisible();
  });

  test("offers a retry when loading rules fails", async ({ page }) => {
    let attempts = 0;
    await page.route(bookingSettingsUrl, async (route) => {
      attempts += 1;
      if (attempts === 1) {
        await route.abort("failed");
        return;
      }
      await route.fulfill({ contentType: "application/json", json: currentBookingSettings, status: 200 });
    });
    await page.goto("/configuracion/reservas");

    await expect(page.getByRole("button", { name: "Reintentar" })).toBeVisible();
    await page.getByRole("button", { name: "Reintentar" }).click();
    await expect(page.getByLabel("Ventana de reserva")).toHaveValue("7");
  });

  test("keeps the mobile save action above the persistent navigation", async ({ page }, testInfo) => {
    test.skip(!isMobileProject(testInfo.project.name), "Mobile-only layout check.");
    await page.route(bookingSettingsUrl, (route) => route.fulfill({ contentType: "application/json", json: currentBookingSettings, status: 200 }));
    await page.goto("/configuracion/reservas");

    const saveButton = page.getByTestId("booking-settings-mobile-save");
    const navigation = page.getByRole("navigation", { name: "Navegación principal" });
    await expect(saveButton).toBeVisible();
    const [saveBox, navigationBox] = await Promise.all([saveButton.boundingBox(), navigation.boundingBox()]);

    expect(saveBox).not.toBeNull();
    expect(navigationBox).not.toBeNull();
    expect((saveBox?.y ?? 0) + (saveBox?.height ?? 0)).toBeLessThanOrEqual(navigationBox?.y ?? 0);
  });
});
