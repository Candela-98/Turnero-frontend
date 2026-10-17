import { openStaffAction } from "./helpers/staff-actions";
import { expect, test, type Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { expectAdminNotice, expectAdminViewport } from "./helpers/admin-patterns";

const session = { business: { id: 10, name: "Barber Studio", onboarding_status: "COMPLETED", slug: "barber-studio" }, user: { id: 1, name: "Juan", email: "juan@example.com", role: "OWNER", avatar_url: null } };
const initial = { id: 5, business_id: 10, user_id: null as number | null, name: "Ana Pérez", role_label: "Barbera" as string | null, specialty: "Color" as string | null, avatar_url: null, status: "ACTIVE" };
async function fill(page: Page, name = "Bruno Gómez") {
  await page.getByLabel("Nombre", { exact: true }).fill(name);
  await page.getByLabel("Rol (opcional)", { exact: true }).fill("Barbero");
  await page.getByLabel("Especialidad", { exact: true }).fill("Cortes");
}

test.describe("staff form", () => {
  let members: typeof initial[];
  let writes: { method: string; body: Record<string, unknown> }[];
  let reads: number;
  let details: number;
  test.beforeEach(async ({ page }) => {
    members = [{ ...initial }]; writes = []; reads = 0; details = 0;
    await page.route("**/api/backend/api/v1/auth/me", route => route.fulfill({ json: session }));
    await page.route("**/api/backend/api/v1/staff-members/me", route => route.fulfill({ json: { staff_member: members.find(member => member.user_id === session.user.id) ?? null } }));
    await page.route("**/api/backend/api/v1/staff-members?*", route => {
      reads++;
      const url = new URL(route.request().url());
      const q = url.searchParams.get("q")?.toLowerCase() ?? "";
      const status = url.searchParams.get("status");
      const filtered = members.filter(member => (!status || member.status === status) && [member.name, member.role_label, member.specialty].some(value => value?.toLowerCase().includes(q)));
      const number = Number(url.searchParams.get("page"));
      return route.fulfill({ json: { data: filtered.slice(number * 20, number * 20 + 20), page: { number, size: 20, total_elements: filtered.length, total_pages: Math.ceil(filtered.length / 20) } } });
    });
    await page.route(/\/api\/backend\/api\/v1\/staff-members(?:\/\d+)?$/, route => {
      const method = route.request().method();
      const id = Number(route.request().url().split("/").at(-1));
      if (method === "GET") { details++; return route.fulfill({ json: members.find(member => member.id === id) }); }
      const body = route.request().postDataJSON(); writes.push({ method, body });
      const member = method === "POST" ? { ...initial, user_id: null, ...body, id: 6 } : { ...members.find(member => member.id === id), ...body };
      if (method === "POST") members.push(member); else members = members.map(current => current.id === id ? member : current);
      return route.fulfill({ status: method === "POST" ? 201 : 200, json: member });
    });
    await page.goto("/profesionales");
    await expect(page.getByRole("heading", { name: "Ana Pérez", exact: true })).toBeVisible();
  });

  test("creates without linking, refreshes, and shows shared success feedback", async ({ page }, testInfo) => {
    const before = reads;
    await page.getByRole("button", { name: "Nuevo profesional", exact: true }).click();
    await expect(page.getByText("Al crear el profesional, sus horarios iniciales se copian de los horarios del negocio.")).toBeVisible();
    await expect(page.getByRole("switch", { name: "Este profesional soy yo" })).not.toBeChecked();
    await fill(page);
    await expectAdminViewport(page);
    await page.screenshot({ path: testInfo.outputPath("staff-create.png"), fullPage: true });
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
    await page.getByRole("button", { name: "Crear profesional", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Bruno Gómez" })).toBeVisible();
    expect(writes).toEqual([{ method: "POST", body: { name: "Bruno Gómez", role_label: "Barbero", specialty: "Cortes" } }]);
    expect(reads).toBeGreaterThan(before);
    await expect(page.getByRole("button", { name: "Nuevo profesional", exact: true })).toBeFocused();
    await expectAdminNotice(page);
    await expect(page.getByTestId("floating-alert")).toContainText("Profesional creado");
    await page.getByRole("button", { name: "Cerrar confirmación" }).click();
    await expect(page.getByTestId("floating-alert")).toHaveCount(0);
  });

  test("links only the current user on creation and preserves that link during edit", async ({ page }) => {
    await page.getByRole("button", { name: "Nuevo profesional", exact: true }).click();
    await page.getByRole("switch", { name: "Este profesional soy yo" }).check();
    await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("");
    await fill(page, "Juan");
    await page.getByRole("button", { name: "Crear profesional", exact: true }).click();
    await openStaffAction(page, "Juan", "Editar datos");
    await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Juan");
    await expect(page.getByRole("switch")).toHaveCount(0);
    await page.getByLabel("Rol (opcional)", { exact: true }).fill("Dueño");
    await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Juan", exact: true }) }).getByText("Vos", { exact: true })).toBeVisible();
    expect(writes[0].body.user_id).toBe(1);
    expect(writes[1]).toEqual({ method: "PATCH", body: { role_label: "Dueño" } });
    expect(members.find(member => member.name === "Juan")?.user_id).toBe(1);
    await page.getByRole("button", { name: "Nuevo profesional", exact: true }).click();
    await expect(page.getByText(/Ya estás vinculado a Juan/)).toBeVisible();
    await expect(page.getByRole("switch", { name: "Este profesional soy yo" })).toBeDisabled();
  });

  test("identifies the linked professional by user ID in the list and editor", async ({ page }, testInfo) => {
    members[0] = { ...initial, user_id: 1 };
    members.push({ ...initial, id: 7, user_id: 2, name: "Juan" }, { ...initial, id: 8, user_id: null, name: "Otro profesional" });
    await page.reload();
    const ownRow = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Ana Pérez", exact: true }) });
    await expect(ownRow.getByText("Vos", { exact: true })).toBeVisible();
    await expect(page.getByText("Vos", { exact: true })).toHaveCount(1);
    await expectAdminViewport(page);
    await page.screenshot({ path: testInfo.outputPath("staff-own-profile.png"), fullPage: true });
    await openStaffAction(page, "Ana Pérez", "Editar datos");
    await expect(page.getByText("Tu perfil profesional", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Guardar cambios", exact: true })).toBeDisabled();
    await expect(page.getByRole("switch")).toHaveCount(0);
    await page.getByRole("button", { name: "Cerrar formulario" }).click();
    await openStaffAction(page, "Juan", "Editar datos");
    await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Juan");
    await expect(page.getByText("Tu perfil profesional", { exact: true })).toHaveCount(0);
  });

  test("disables linking for an inactive own profile outside the visible page and filters", async ({ page }, testInfo) => {
    members = [
      ...Array.from({ length: 21 }, (_, index) => ({ ...initial, id: index + 100, user_id: null, name: `Otro ${index + 1}` })),
      { ...initial, id: 500, user_id: 1, name: "Mi perfil existente", status: "INACTIVE" },
    ];
    await page.reload();
    await expect(page.getByRole("heading", { name: "Otro 1", exact: true })).toBeVisible();
    await expect(page.getByText("Vos", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: /^Filtros/ }).click();
    await page.getByRole("radio", { name: "Activos", exact: true }).check();
    await page.getByRole("button", { name: "Aplicar filtros" }).click();
    await page.getByRole("button", { name: "Nuevo profesional", exact: true }).click();
    const link = page.getByRole("switch", { name: "Este profesional soy yo" });
    await expect(page.getByText(/Ya estás vinculado a Mi perfil existente/)).toBeVisible();
    await expect(link).toBeDisabled();
    await expect(link).not.toBeChecked();
    await link.evaluate(button => (button as HTMLButtonElement).click());
    await expect(link).not.toBeChecked();
    await fill(page);
    await expectAdminViewport(page);
    await page.screenshot({ path: testInfo.outputPath("staff-link-disabled.png"), fullPage: true });
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
    await page.getByRole("button", { name: "Crear profesional", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(writes).toEqual([{ method: "POST", body: { name: "Bruno Gómez", role_label: "Barbero", specialty: "Cortes" } }]);
  });

  test("keeps linking disabled while checking or on error and enables it only after verification", async ({ page }) => {
    let release!: () => void;
    let fail = true;
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/api/backend/api/v1/staff-members/me", async route => {
      await pending;
      return fail ? route.fulfill({ status: 503, json: {} }) : route.fulfill({ json: { staff_member: null } });
    });
    await page.getByRole("button", { name: "Nuevo profesional", exact: true }).click();
    const link = page.getByRole("switch", { name: "Este profesional soy yo" });
    await expect(page.getByText("Comprobando tu vinculación…")).toBeVisible();
    await expect(link).toBeDisabled();
    release();
    await expect(page.getByRole("button", { name: "Reintentar comprobación" })).toBeVisible();
    await expect(link).toBeDisabled();
    fail = false;
    await page.getByRole("button", { name: "Reintentar comprobación" }).click();
    await expect(link).toBeEnabled();
    await link.check();
    await expect(link).toBeChecked();
  });

  test("hydrates edits, detects reversal, clears role, and reloads saved values", async ({ page }, testInfo) => {
    await openStaffAction(page, "Ana Pérez", "Editar datos");
    const save = page.getByRole("button", { name: "Guardar cambios", exact: true });
    await expect(page.getByLabel("Rol (opcional)", { exact: true })).toHaveValue("Barbera");
    await expect(save).toBeDisabled();
    await page.getByLabel("Nombre", { exact: true }).fill("Otra");
    await expect(save).toBeEnabled();
    await page.getByLabel("Nombre", { exact: true }).fill("Ana Pérez");
    await expect(save).toBeDisabled();
    await page.getByLabel("Rol (opcional)", { exact: true }).fill("");
    await page.screenshot({ path: testInfo.outputPath("staff-edit.png"), fullPage: true });
    await save.click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(writes).toEqual([{ method: "PATCH", body: { role_label: "" } }]);
    expect(details).toBeGreaterThanOrEqual(2);
    await openStaffAction(page, "Ana Pérez", "Editar datos");
    await expect(page.getByLabel("Rol (opcional)", { exact: true })).toHaveValue("");
    await expect(save).toBeDisabled();
  });

  test("validates, focuses the first invalid field, and confirms discard", async ({ page }) => {
    await page.getByRole("button", { name: "Nuevo profesional", exact: true }).click();
    await page.getByRole("button", { name: "Crear profesional", exact: true }).click();
    await expect(page.getByLabel("Nombre", { exact: true })).toBeFocused();
    await expect(page.getByText("Ingresá la especialidad.")).toBeVisible();
    expect(writes).toHaveLength(0);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
    await fill(page);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await page.getByRole("button", { name: "Seguir editando" }).click();
    await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Bruno Gómez");
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await page.getByRole("button", { name: "Descartar", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page.getByRole("button", { name: "Nuevo profesional", exact: true }).click();
    await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("");
    await expect(page.getByLabel("Rol (opcional)")).toHaveAttribute("maxlength", "80");
    await expect(page.getByLabel("Especialidad", { exact: true })).toHaveAttribute("maxlength", "150");
  });

  test("keeps values after an API error and blocks double submit and closing while saving", async ({ page }) => {
    let attempts = 0;
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/api/backend/api/v1/staff-members", async route => {
      attempts++;
      if (attempts === 1) return route.fulfill({ status: 503, json: { message: "offline" } });
      await pending; return route.fallback();
    });
    await page.getByRole("button", { name: "Nuevo profesional", exact: true }).click();
    await fill(page);
    await page.getByRole("button", { name: "Crear profesional", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText("No pudimos guardar el profesional.");
    await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Bruno Gómez");
    await page.getByRole("button", { name: "Crear profesional", exact: true }).evaluate(button => { (button as HTMLButtonElement).click(); (button as HTMLButtonElement).click(); });
    await expect(page.getByRole("button", { name: "Creando...", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Cerrar formulario" })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect.poll(() => attempts).toBe(2);
    release();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(writes).toHaveLength(1);
  });

  test("shows duplicate linkage and backend validation next to their fields", async ({ page }) => {
    let attempts = 0;
    await page.route("**/api/backend/api/v1/staff-members", route => {
      attempts++;
      return attempts === 1 ? route.fulfill({ status: 409, json: { code: "STAFF_USER_ALREADY_LINKED" } })
        : attempts === 2 ? route.fulfill({ status: 400, json: { details: [{ field: "roleLabel", message: "Rol inválido" }] } }) : route.fallback();
    });
    await page.getByRole("button", { name: "Nuevo profesional", exact: true }).click();
    await fill(page);
    await page.getByRole("switch", { name: "Este profesional soy yo" }).check();
    await page.getByRole("button", { name: "Crear profesional", exact: true }).click();
    await expect(page.getByRole("switch")).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByRole("switch")).toBeFocused();
    await expect(page.getByText(/Tu usuario ya está vinculado/)).toBeVisible();
    await expect(page.getByText(/identificado con «Vos» en el listado/)).toBeVisible();
    await page.getByRole("switch").uncheck();
    await page.getByRole("button", { name: "Crear profesional", exact: true }).click();
    await expect(page.getByLabel("Rol (opcional)")).toBeFocused();
    await expect(page.getByText("Rol inválido")).toBeVisible();
    await expect(page.getByTestId("floating-alert")).toHaveCount(0);
    await page.getByLabel("Rol (opcional)").fill("Otro rol");
    await page.getByRole("button", { name: "Crear profesional", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("can edit inactive legacy data without sending specialty, state, avatar or user", async ({ page }) => {
    members[0] = { ...initial, specialty: null, role_label: null, status: "INACTIVE", user_id: 1 };
    await openStaffAction(page, "Ana Pérez", "Editar datos");
    await expect(page.getByLabel("Especialidad", { exact: true })).toHaveValue("");
    await page.getByLabel("Nombre", { exact: true }).fill("Ana nueva");
    await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(writes).toEqual([{ method: "PATCH", body: { name: "Ana nueva" } }]);
    await expect(page.getByText("Inactivo", { exact: true })).toBeVisible();
  });

  test("handles loading, recoverable detail errors and a missing professional", async ({ page }) => {
    let missing = false;
    let recover = false;
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    await page.route("**/api/backend/api/v1/staff-members/5", async route => {
      await pending;
      if (missing) return route.fulfill({ status: 404, json: {} });
      if (!recover) return route.fulfill({ status: 503, json: {} });
      return route.fallback();
    });
    await openStaffAction(page, "Ana Pérez", "Editar datos");
    await expect(page.getByLabel("Cargando profesional")).toBeVisible();
    release();
    await expect(page.getByText("No pudimos cargar el profesional", { exact: true })).toBeVisible();
    recover = true;
    await page.getByRole("button", { name: "Reintentar", exact: true }).click();
    await expect(page.getByLabel("Nombre", { exact: true })).toHaveValue("Ana Pérez");
    await page.getByRole("button", { name: "Cerrar formulario" }).click();
    missing = true;
    await openStaffAction(page, "Ana Pérez", "Editar datos");
    await expect(page.getByText("El profesional ya no está disponible")).toBeVisible();
    await page.getByRole("button", { name: "Volver al listado" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("retries reads after refresh failure without repeating the confirmed write", async ({ page }) => {
    let fail = false;
    await page.route("**/api/backend/api/v1/staff-members?*", route => fail ? route.fulfill({ status: 503, json: {} }) : route.fallback());
    await page.getByRole("button", { name: "Nuevo profesional", exact: true }).click();
    await fill(page);
    fail = true;
    await page.getByRole("button", { name: "Crear profesional", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByText("El cambio se guardó, pero no pudimos actualizar los datos.", { exact: false })).toBeVisible();
    fail = false;
    await page.getByRole("button", { name: "Reintentar actualización", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Bruno Gómez" })).toBeVisible();
    expect(writes).toHaveLength(1);
  });

  test("preserves filters and clamps the page when editing removes its last match", async ({ page }) => {
    members = Array.from({ length: 21 }, (_, index) => ({ ...initial, id: index + 1, name: `Ana ${index + 1}` }));
    await page.getByRole("searchbox").fill("Ana");
    await expect(page.getByText("Página 1 de 2")).toBeVisible();
    await page.getByRole("button", { name: "Siguiente" }).click();
    await openStaffAction(page, "Ana 21", "Editar datos");
    await page.getByLabel("Nombre", { exact: true }).fill("Bruno");
    await page.getByRole("button", { name: "Guardar cambios", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Ana 1", exact: true })).toBeVisible();
    await expect(page.getByRole("searchbox")).toHaveValue("Ana");
    await expect(page.getByRole("button", { name: "Siguiente" })).toHaveCount(0);
    await expectAdminViewport(page);
  });
});
