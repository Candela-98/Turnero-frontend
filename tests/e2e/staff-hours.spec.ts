import { expect, test, type Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { openStaffAction } from "./helpers/staff-actions";
import { expectAdminNotice, expectAdminViewport } from "./helpers/admin-patterns";

const weekdays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const labels = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const session = { business: { id: 10, name: "Barber Studio", onboarding_status: "COMPLETED", slug: "barber-studio" }, user: { id: 1, name: "Juan", email: "juan@example.com", role: "OWNER", avatar_url: null } };
const member = { id: 5, business_id: 10, user_id: null, name: "Ana Pérez", role_label: "Barbera", specialty: "Cortes", avatar_url: null, status: "INACTIVE", service_count: 0 };
type Day = { day_of_week: string; starts_at: string | null; ends_at: string | null; is_available: boolean };
const initial: Day[] = weekdays.map(day => ({ day_of_week: day, starts_at: day === "SUNDAY" ? null : "09:00", ends_at: day === "SUNDAY" ? null : "18:00", is_available: day !== "SUNDAY" }));
const dialog = (page: Page) => page.getByRole("dialog", { name: "Horarios del profesional", exact: true });
const save = (page: Page) => dialog(page).getByRole("button", { name: "Guardar cambios", exact: true });
const toggle = (page: Page, day: string) => dialog(page).getByRole("switch", { name: `${day}: disponible`, exact: true });
const input = (page: Page, day: string, field: "inicio" | "fin") => dialog(page).getByLabel(`${day}: ${field}`, { exact: true });
async function open(page: Page) { await openStaffAction(page, member.name, "Horarios"); await expect(toggle(page, "Lunes")).toBeVisible(); }

test.describe("staff working hours", () => {
  let hours: Day[]; let writes: Day[][]; let gets: number;
  test.beforeEach(async ({ page }) => {
    hours = structuredClone(initial); writes = []; gets = 0;
    await page.route("**/api/backend/api/v1/business-hours", route => route.fulfill({ json: { data: weekdays.map((day, index) => ({ id: index + 1, day_of_week: day, opens_at: index === 6 ? null : "09:00", closes_at: index === 6 ? null : "18:00", is_closed: index === 6 })) } }));
    await page.route("**/api/backend/api/v1/auth/me", route => route.fulfill({ json: session }));
    await page.route("**/api/backend/api/v1/staff-members?*", route => route.fulfill({ json: { data: [member], page: { number: 0, size: 20, total_elements: 1, total_pages: 1 } } }));
    await page.route("**/api/backend/api/v1/staff-members/5/working-hours", route => {
      if (route.request().method() === "GET") { gets++; return route.fulfill({ json: [...hours].reverse() }); }
      const body = route.request().postDataJSON() as Day[]; writes.push(body);
      hours = body.map(day => ({ ...day, starts_at: day.is_available ? day.starts_at : null, ends_at: day.is_available ? day.ends_at : null }));
      return route.fulfill({ json: [...hours].reverse() });
    });
    await page.goto("/profesionales");
    await expect(page.getByRole("button", { name: `Más acciones de ${member.name}` })).toBeVisible();
    expect(gets).toBe(0);
  });

  test("opens from the action menu, hydrates the seven ordered days and has accessible fixed actions", async ({ page }, testInfo) => {
    await open(page);
    await expect(dialog(page).getByRole("switch")).toHaveCount(7);
    expect(await dialog(page).getByRole("switch").evaluateAll(nodes => nodes.map(node => node.getAttribute("aria-label")))).toEqual(labels.map(day => `${day}: disponible`));
    await expect(input(page, "Lunes", "inicio")).toHaveValue("09:00");
    await expect(toggle(page, "Domingo")).not.toBeChecked();
    await expect(save(page)).toBeDisabled();
    await expect(save(page)).toBeInViewport();
    expect((await save(page).boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await expectAdminViewport(page);
    await page.screenshot({ path: testInfo.outputPath("staff-hours.png"), fullPage: false });
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
    await toggle(page, "Sábado").scrollIntoViewIfNeeded();
    await expect(save(page)).toBeInViewport();
  });

  test("explains business limits next to fields without blocking save", async ({ page }, testInfo) => {
    await open(page);
    await input(page, "Martes", "fin").fill("19:00");
    await expect(input(page, "Martes", "fin")).toHaveAccessibleDescription("El negocio cierra a las 18:00; solo se podrán reservar turnos hasta esa hora.");
    await expect(input(page, "Martes", "fin")).toHaveAttribute("aria-invalid", "false");
    await expect(save(page)).toBeEnabled();
    await input(page, "Martes", "inicio").fill("08:00");
    await expect(input(page, "Martes", "inicio")).toHaveAccessibleDescription("El negocio abre a las 09:00; solo se podrán reservar turnos desde esa hora.");
    await dialog(page).getByText("El negocio cierra a las 18:00; solo se podrán reservar turnos hasta esa hora.", { exact: true }).scrollIntoViewIfNeeded();
    await expectAdminViewport(page);
    await expect(save(page)).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath("staff-hours-business-limits.png"), fullPage: false });
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
    await input(page, "Martes", "inicio").fill("09:00");
    await expect(input(page, "Martes", "inicio")).not.toHaveAttribute("aria-describedby", /hint/);
    await input(page, "Martes", "fin").fill("18:00");
    await expect(input(page, "Martes", "fin")).not.toHaveAttribute("aria-describedby", /hint/);
    await expect(save(page)).toBeDisabled();
    await input(page, "Martes", "fin").fill("19:00");
    await save(page).click(); await expect(dialog(page)).toHaveCount(0);
    expect(writes[0][1].ends_at).toBe("19:00");
    await open(page);
    await expect(input(page, "Martes", "fin")).toHaveAccessibleDescription(/El negocio cierra a las 18:00/);
    await expect(save(page)).toBeDisabled();
  });

  test("explains closed days and ranges without an overlap", async ({ page }) => {
    await open(page);
    await input(page, "Lunes", "inicio").fill("18:00");
    await input(page, "Lunes", "fin").fill("20:00");
    await expect(dialog(page).getByText(/Este horario no coincide con el del negocio/)).toBeVisible();
    await toggle(page, "Domingo").check();
    await expect(dialog(page).getByText(/El negocio está cerrado este día/)).toBeVisible();
    await toggle(page, "Domingo").uncheck();
    await expect(dialog(page).getByText(/El negocio está cerrado este día/)).toHaveCount(0);
    await save(page).click(); await expect(dialog(page)).toHaveCount(0);
    expect(writes[0][0].starts_at).toBe("18:00");
  });

  test("recovers a business comparison failure without replacing the staff draft", async ({ page }) => {
    let failed = true;
    await page.route("**/api/backend/api/v1/business-hours", route => failed ? route.fulfill({ status: 503, json: {} }) : route.fallback());
    await open(page);
    await expect(dialog(page).getByText("No pudimos comparar con los horarios del negocio", { exact: true })).toBeVisible();
    await input(page, "Martes", "fin").fill("19:00");
    await expect(save(page)).toBeEnabled();
    failed = false;
    await dialog(page).getByRole("button", { name: "Reintentar comparación" }).click();
    await expect(input(page, "Martes", "fin")).toHaveValue("19:00");
    await expect(input(page, "Martes", "fin")).toHaveAccessibleDescription(/El negocio cierra a las 18:00/);
    await save(page).click(); await expect(dialog(page)).toHaveCount(0);
    expect(writes).toHaveLength(1);
  });

  test("writes the full normalized week, preserves filters and reopens the saved response", async ({ page }) => {
    await page.getByRole("searchbox").fill("Ana");
    await page.waitForResponse(response => response.url().includes("staff-members?") && response.url().includes("q=Ana"));
    await open(page);
    await input(page, "Lunes", "fin").fill("14:30");
    await save(page).click();
    await expect(dialog(page)).toHaveCount(0);
    expect(writes).toHaveLength(1); expect(writes[0]).toHaveLength(7);
    expect(writes[0].map(day => day.day_of_week)).toEqual(weekdays);
    expect(writes[0][0].ends_at).toBe("14:30");
    expect(writes[0][6]).toEqual(initial[6]);
    await expect(page.getByRole("searchbox")).toHaveValue("Ana");
    await expectAdminNotice(page);
    await expect(page.getByTestId("floating-alert")).toContainText("Horarios actualizados");
    const readsBeforeReopen = gets;
    await open(page);
    await expect(input(page, "Lunes", "fin")).toHaveValue("14:30");
    await expect(save(page)).toBeDisabled();
    expect(gets).toBeGreaterThan(readsBeforeReopen);
  });

  test("validates missing and equal times, focuses errors and ignores reverted hidden hours", async ({ page }) => {
    await open(page);
    await toggle(page, "Lunes").uncheck(); await toggle(page, "Lunes").check();
    await expect(input(page, "Lunes", "inicio")).toHaveValue("09:00");
    await expect(save(page)).toBeDisabled();
    await toggle(page, "Domingo").check();
    await expect(input(page, "Domingo", "inicio")).toHaveValue("");
    await save(page).click();
    await expect(input(page, "Domingo", "inicio")).toBeFocused();
    await expect(input(page, "Domingo", "inicio")).toHaveAttribute("aria-invalid", "true");
    await input(page, "Domingo", "inicio").fill("12:00"); await input(page, "Domingo", "fin").fill("12:00");
    await save(page).click();
    await expect(input(page, "Domingo", "fin")).toBeFocused();
    await expect(dialog(page).getByText("La hora de fin debe ser posterior al inicio.")).toBeVisible();
    await toggle(page, "Domingo").uncheck();
    await expect(save(page)).toBeDisabled(); expect(writes).toEqual([]);
  });

  test("saves an all-unavailable week and displays seven days after reopening", async ({ page }, testInfo) => {
    await open(page);
    for (const day of labels.slice(0, 6)) await toggle(page, day).uncheck();
    await expect(dialog(page).getByText("No hay días disponibles", { exact: true })).toBeVisible();
    await expect(dialog(page).locator('input[type="time"]')).toHaveCount(0);
    await page.screenshot({ path: testInfo.outputPath("staff-hours-unavailable.png"), fullPage: false });
    await save(page).click();
    await expect(dialog(page)).toHaveCount(0);
    expect(writes[0].every(day => !day.is_available && day.starts_at === null && day.ends_at === null)).toBe(true);
    await open(page);
    await expect(dialog(page).getByRole("switch")).toHaveCount(7);
    await expect(save(page)).toBeDisabled();
  });

  test("supports keyboard menu navigation, confirms escape/cancel/close and returns focus", async ({ page }) => {
    const trigger = page.getByRole("button", { name: `Más acciones de ${member.name}` });
    await trigger.focus(); await page.keyboard.press("Enter");
    await expect(page.getByRole("menuitem", { name: "Ver detalle" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitem", { name: "Editar datos" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.getByRole("menuitem", { name: "Horarios", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(toggle(page, "Lunes")).toBeVisible();
    await toggle(page, "Lunes").focus(); await page.keyboard.press("Space");
    for (const close of ["escape", "Cancelar", "Cerrar horarios"]) {
      if (close === "escape") await page.keyboard.press("Escape");
      else await dialog(page).getByRole("button", { name: close, exact: true }).click();
      await expect(page.getByRole("alertdialog")).toBeVisible();
      await page.getByRole("button", { name: "Seguir editando" }).click();
      await expect(toggle(page, "Lunes")).not.toBeChecked();
    }
    await page.keyboard.press("Escape"); await page.getByRole("button", { name: "Descartar", exact: true }).click();
    await expect(dialog(page)).toHaveCount(0); await expect(trigger).toBeFocused();
    expect(writes).toEqual([]);
  });

  test("handles loading, invalid data, retry and a missing professional", async ({ page }) => {
    let release!: () => void; let mode = "invalid";
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/api/backend/api/v1/staff-members/5/working-hours", async route => {
      await pending;
      if (mode === "invalid") return route.fulfill({ json: [...hours.slice(0, 6), hours[0]] });
      if (mode === "missing") return route.fulfill({ status: 404, json: {} });
      return route.fallback();
    });
    await openStaffAction(page, member.name, "Horarios");
    await expect(page.getByLabel("Cargando horarios del profesional")).toBeVisible();
    await expect(dialog(page).getByRole("switch")).toHaveCount(0);
    release();
    await expect(dialog(page).getByText("No pudimos cargar los horarios", { exact: true })).toBeVisible();
    mode = "ok";
    await dialog(page).getByRole("button", { name: "Reintentar carga" }).click();
    await expect(toggle(page, "Lunes")).toBeVisible();
    await dialog(page).getByRole("button", { name: "Cancelar", exact: true }).click();
    mode = "missing";
    await openStaffAction(page, member.name, "Horarios");
    await expect(dialog(page).getByText("El profesional ya no está disponible")).toBeVisible();
    await dialog(page).getByRole("button", { name: "Volver al listado" }).click();
    await expect(dialog(page)).toHaveCount(0);
  });

  test("keeps the draft on save errors and blocks duplicate submission, edits and closing", async ({ page }) => {
    let attempt = 0; let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/api/backend/api/v1/staff-members/5/working-hours", async route => {
      if (route.request().method() !== "PUT") return route.fallback();
      attempt++; if (attempt === 1) return route.fulfill({ status: 503, json: {} });
      await pending; return route.fallback();
    });
    await open(page); await input(page, "Lunes", "fin").fill("15:00"); await save(page).click();
    await expect(dialog(page).getByText(/Tus cambios se conservan/)).toBeVisible();
    await expect(input(page, "Lunes", "fin")).toHaveValue("15:00");
    await dialog(page).getByRole("button", { name: "Reintentar guardado" }).evaluate(button => { (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click(); });
    await expect(dialog(page).getByRole("button", { name: "Guardando...", exact: true })).toBeDisabled();
    await expect(toggle(page, "Lunes")).toBeDisabled();
    await expect(dialog(page).getByRole("button", { name: "Cerrar horarios" })).toBeDisabled();
    await page.keyboard.press("Escape"); await expect(dialog(page)).toBeVisible();
    await expect.poll(() => attempt).toBe(2); release();
    await expect(dialog(page)).toHaveCount(0); expect(writes).toHaveLength(1);
  });

  test("waits for fresh data on every open and ignores a late cancelled response", async ({ page }) => {
    await open(page); await dialog(page).getByRole("button", { name: "Cancelar", exact: true }).click();
    let release!: () => void; let block = true;
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/api/backend/api/v1/staff-members/5/working-hours", async route => {
      if (block) { await pending; return route.fulfill({ json: initial }); }
      return route.fallback();
    });
    await openStaffAction(page, member.name, "Horarios");
    await expect(page.getByLabel("Cargando horarios del profesional")).toBeVisible();
    await expect(dialog(page).getByRole("switch")).toHaveCount(0);
    await dialog(page).getByRole("button", { name: "Cerrar horarios" }).click();
    block = false;
    hours[0].starts_at = "11:00";
    await open(page);
    await expect(input(page, "Lunes", "inicio")).toHaveValue("11:00");
    await input(page, "Lunes", "fin").fill("16:00");
    release();
    await expect(input(page, "Lunes", "inicio")).toHaveValue("11:00");
    await expect(input(page, "Lunes", "fin")).toHaveValue("16:00");
  });

  test("retries only a read when a successful write has an invalid response", async ({ page }) => {
    let failRead = false; let puts = 0;
    await page.route("**/api/backend/api/v1/staff-members/5/working-hours", async route => {
      if (route.request().method() === "PUT") { puts++; hours[0].ends_at = "14:00"; failRead = true; return route.fulfill({ json: [] }); }
      return failRead ? route.fulfill({ status: 503, json: {} }) : route.fallback();
    });
    await open(page); await input(page, "Lunes", "fin").fill("14:00"); await save(page).click();
    await expect(dialog(page).getByText("Los horarios se guardaron", { exact: true })).toBeVisible();
    await dialog(page).getByRole("button", { name: "Reintentar actualización" }).click();
    await expect(dialog(page)).toBeVisible();
    failRead = false;
    await dialog(page).getByRole("button", { name: "Reintentar actualización" }).click();
    await expect(dialog(page)).toHaveCount(0); expect(puts).toBe(1);
  });
});
