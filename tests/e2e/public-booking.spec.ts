import { expect, test, type Page } from "@playwright/test";

import { expectAdminViewport } from "./helpers/admin-patterns";

const publicApi = "**/api/backend/api/v1/public/businesses/barber-studio";
const route = "/reservar/barber-studio";
const service = { id: 10, name: "Corte", duration_minutes: 30, price_cents: 950000 };
const staff = { id: 100, name: "Mateo Ruiz", role_label: "Barbero" };
const otherStaff = { id: 101, name: "Lucas", role_label: "Barbero" };

test.use({ timezoneId: "Asia/Tokyo" });

async function mockCatalog(page: Page) {
  await page.route("**/api/backend/api/v1/customer/businesses/*/auth/me", route => route.fulfill({ status: 401, json: { code: "UNAUTHORIZED" } }));
  await page.route(`${publicApi}/booking-profile`, (request) => request.fulfill({ json: {
    business: { name: "Barber Studio", timezone: "America/Argentina/Buenos_Aires" },
    booking_settings: { public_booking_enabled: true, booking_window_days: 7 },
  } }));
  await page.route(`${publicApi}/services`, (request) => request.fulfill({ json: { services: [
    { ...service, staff_members: [staff, otherStaff] },
    { ...service, id: 12, name: "Barba", staff_members: [otherStaff] },
  ] } }));
}

function slot(day: string, time: string, staffId = 100) {
  return { starts_at: `${day}T${time}:00`, ends_at: `${day}T${time}:00`, available_staff_member_ids: [staffId] };
}

test("uses the business day and resets the chosen slot after changing filters", async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-17T01:30:00Z"));
  await mockCatalog(page);
  const queries: URLSearchParams[] = [];
  await page.route(`${publicApi}/availability?*`, (request) => {
    const params = new URL(request.request().url()).searchParams;
    queries.push(params);
    const time = params.get("staff_member_id") === "any" ? "10:00" : "16:30";
    return request.fulfill({ json: [slot(params.get("from")!, time)] });
  });

  await page.goto(route);
  await expect(page.getByRole("heading", { name: "Reservar un turno" })).toBeVisible();
  await expect(page.getByRole("banner").getByText("Barber Studio")).toBeVisible();
  await expect(page.getByRole("radio", { name: /^Corte/ })).toBeVisible();
  expect(queries).toHaveLength(0);
  await page.getByText("Corte", { exact: true }).click();
  await expect(page.getByLabel("Fecha")).toHaveValue("2026-11-16");
  await expect(page.getByLabel("Fecha")).toHaveAttribute("max", "2026-11-22");
  await page.getByText("10:00", { exact: true }).click();
  await expect(page.getByText("Horario elegido")).toBeVisible();
  expect(queries[0].get("staff_member_id")).toBe("any");
  expect(queries[0].get("to")).toBe("2026-11-16");

  await page.getByText("Mateo Ruiz", { exact: true }).click();
  await expect(page.getByRole("radio", { name: "16:30" })).not.toBeChecked();
  await expect(page.getByText("Horario elegido")).toHaveCount(0);
  expect(queries.at(-1)?.get("staff_member_id")).toBe("100");

  await page.getByText("16:30", { exact: true }).click();
  await page.getByLabel("Fecha").fill("2026-11-17");
  await expect(page.getByRole("radio", { name: "16:30" })).not.toBeChecked();
  expect(queries.at(-1)?.get("from")).toBe("2026-11-17");

  await page.getByText("16:30", { exact: true }).click();
  await page.getByText("Barba", { exact: true }).click();
  await expect(page.getByRole("radio", { name: "10:00" })).not.toBeChecked();
  await expect(page.getByRole("radio", { name: /Mateo Ruiz/ })).toHaveCount(0);
  expect(queries.at(-1)?.get("service_offering_id")).toBe("12");
  expect(queries.at(-1)?.get("staff_member_id")).toBe("any");
  await expectAdminViewport(page);
});

test("ignores a late result and shows an empty day after retrying a failed read", async ({ page }) => {
  await mockCatalog(page);
  let releasePrevious!: () => void;
  const previous = new Promise<void>((resolve) => { releasePrevious = resolve; });
  let finishPrevious!: () => void;
  const previousFinished = new Promise<void>((resolve) => { finishPrevious = resolve; });
  let shouldFail = true;
  await page.route(`${publicApi}/availability?*`, async (request) => {
    const params = new URL(request.request().url()).searchParams;
    if (params.get("staff_member_id") === "any") {
      await previous;
      try {
        await request.fulfill({ json: [slot(params.get("from")!, "10:00")] });
      } catch {
        // An obsolete request may already have been aborted by the browser.
      } finally {
        finishPrevious();
      }
      return;
    }
    if (shouldFail) return request.fulfill({ status: 503, json: { code: "UPSTREAM_UNAVAILABLE" } });
    return request.fulfill({ json: [] });
  });

  await page.goto(route);
  const firstRequest = page.waitForRequest((request) => request.url().includes("staff_member_id=any"));
  await page.getByText("Corte", { exact: true }).click();
  await firstRequest;
  await expect(page.getByText("Cargando horarios…")).toBeVisible();
  await page.getByText("Mateo Ruiz", { exact: true }).click();
  await expect(page.getByText("No pudimos cargar los horarios")).toBeVisible();
  shouldFail = false;
  await page.getByRole("button", { name: "Reintentar" }).click();
  await expect(page.getByText("No hay horarios disponibles")).toBeVisible();
  releasePrevious();
  await previousFinished;
  await expect(page.getByRole("radio", { name: "10:00" })).toHaveCount(0);
  await expect(page.getByText("No hay horarios disponibles")).toBeVisible();
});

test("shows booking disabled from the Spring 403 without loading the catalog", async ({ page }) => {
  await page.route(`${publicApi}/booking-profile`, (request) => request.fulfill({
    status: 403, json: { code: "FORBIDDEN", message: "Public booking is disabled" },
  }));
  const requested: string[] = [];
  page.on("request", (request) => requested.push(request.url()));
  await page.goto(route);

  await expect(page.getByText("Las reservas online no están disponibles")).toBeVisible();
  expect(requested.some((url) => url.endsWith("/barber-studio/services"))).toBe(false);
});

const bookingDay = "2026-11-19";
const bookingContact = { name: "Ana Ruiz", email: "ana@example.test", phone_number: "+54 11 5555 1234" };

async function fillBooking(page: Page, professional = "Cualquiera disponible") {
  await page.clock.setFixedTime(new Date("2026-11-17T01:30:00Z"));
  await page.goto(route);
  await expect(page.getByRole("heading", { name: "Datos de contacto" })).toHaveCount(0);
  await page.getByText("Corte", { exact: true }).click();
  await page.getByText(professional, { exact: true }).click();
  await page.getByLabel("Fecha").fill(bookingDay);
  await page.getByText("10:30", { exact: true }).click();
  await page.getByLabel("Nombre").fill(bookingContact.name);
  await page.getByLabel("Email").fill(bookingContact.email);
  await page.getByLabel("Teléfono").fill(bookingContact.phone_number);
}

function createdBooking(status: "CONFIRMED" | "PENDING", time: string, staffId: number) {
  return {
    appointment_id: 900, service_offering_id: 10, staff_member_id: staffId,
    starts_at: `${bookingDay}T${time}:00`, ends_at: `${bookingDay}T11:30:00`,
    duration_minutes: 30, price_cents: 950000, cancel_token: "test-token", status,
  };
}

test("submits the exact slot once and shows the assigned professional and pending status", async ({ page }) => {
  await mockCatalog(page);
  await page.route(`${publicApi}/availability?*`, (request) => request.fulfill({ json: [slot(bookingDay, "10:30", otherStaff.id)] }));
  let finishRequest!: () => void;
  const submitting = new Promise<void>((resolve) => { finishRequest = resolve; });
  const bodies: unknown[] = [];
  await page.route(`${publicApi}/appointments`, async (request) => {
    bodies.push(request.request().postDataJSON());
    await submitting;
    return request.fulfill({ status: 201, json: createdBooking("PENDING", "10:30", otherStaff.id) });
  });

  await fillBooking(page);
  try {
    await page.getByRole("button", { name: "Solicitar turno" }).click();
    await expect(page.getByRole("button", { name: "Solicitando turno…" })).toBeDisabled();
    await page.getByRole("form", { name: "Datos de contacto" }).dispatchEvent("submit");
    await expect.poll(() => bodies).toEqual([{
      service_offering_id: service.id, staff_member_id: "any",
      starts_at: `${bookingDay}T10:30:00`, customer: bookingContact,
    }]);
  } finally {
    finishRequest();
  }
  const result = page.getByRole("region", { name: "Turno pendiente de confirmación" });
  await expect(result.getByText(otherStaff.name, { exact: true })).toBeVisible();
  await expect(result.getByText(/10:30/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Solicitar turno" })).toHaveCount(0);
  expect(bodies).toHaveLength(1);
  await expectAdminViewport(page);
});

test("refreshes an occupied slot, preserves contact and confirms after selecting another time", async ({ page }) => {
  await mockCatalog(page);
  let occupied = false;
  await page.route(`${publicApi}/availability?*`, (request) => request.fulfill({
    json: occupied ? [slot(bookingDay, "11:00")] : [slot(bookingDay, "10:30"), slot(bookingDay, "11:00")],
  }));
  const starts: string[] = [];
  await page.route(`${publicApi}/appointments`, (request) => {
    const body = request.request().postDataJSON();
    starts.push(body.starts_at);
    expect(body.staff_member_id).toBe(String(staff.id));
    if (!occupied) {
      occupied = true;
      return request.fulfill({ status: 409, json: { code: "CONFLICT" } });
    }
    return request.fulfill({ status: 201, json: createdBooking("CONFIRMED", "11:00", staff.id) });
  });

  await fillBooking(page, staff.name);
  await page.getByRole("button", { name: "Solicitar turno" }).click();
  await expect(page.getByText("Ese horario ya está ocupado")).toBeVisible();
  await expect(page.getByRole("radio", { name: "10:30" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Solicitar turno" })).toBeDisabled();
  await expect(page.getByLabel("Nombre")).toHaveValue(bookingContact.name);
  await expect(page.getByLabel("Email")).toHaveValue(bookingContact.email);
  await expect(page.getByLabel("Teléfono")).toHaveValue(bookingContact.phone_number);
  await page.getByText("11:00", { exact: true }).click();
  await page.getByRole("button", { name: "Solicitar turno" }).click();
  const result = page.getByRole("region", { name: "Turno confirmado" });
  await expect(result.getByText(staff.name, { exact: true })).toBeVisible();
  await expect(result.getByText(/11:00/)).toBeVisible();
  expect(starts).toEqual([`${bookingDay}T10:30:00`, `${bookingDay}T11:00:00`]);
});

for (const [status, code, message] of [
  [409, "CUSTOMER_IDENTITY_AMBIGUOUS", "El negocio debe revisar tu ficha"],
  [403, "CUSTOMER_BOOKING_BLOCKED", "No podés reservar online con estos datos"],
  [403, "FORBIDDEN", "Las reservas online no están disponibles"],
] as const) {
  test(`shows a dedicated message for ${code}`, async ({ page }) => {
    await mockCatalog(page);
    await page.route(`${publicApi}/availability?*`, (request) => request.fulfill({ json: [slot(bookingDay, "10:30")] }));
    await page.route(`${publicApi}/appointments`, (request) => request.fulfill({
      status, json: { code, message: "Información interna de prueba" },
    }));

    await fillBooking(page);
    await page.getByRole("button", { name: "Solicitar turno" }).click();
    await expect(page.getByText(message, { exact: true })).toBeVisible();
    await expect(page.getByText("Información interna de prueba")).toHaveCount(0);
    await expect(page.getByText("Ese horario ya está ocupado")).toHaveCount(0);
  });
}
