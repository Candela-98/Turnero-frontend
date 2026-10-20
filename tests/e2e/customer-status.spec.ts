import { expect, test, type Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { expectAdminNotice, expectAdminViewport } from "./helpers/admin-patterns";

type Customer = { id: number; name: string; status: "ACTIVE" | "INACTIVE"; email: string | null; phone_number: string | null; internal_notes: string | null; public_booking_blocked?: boolean; public_booking_block_reason?: string | null };
const session = { business: { id: 10, name: "Barber Studio", onboarding_status: "COMPLETED", slug: "barber-studio" },
  user: { id: 1, name: "Juan", email: "juan@example.com", role: "OWNER", avatar_url: null } };
let rows: Customer[];
let writes: { id: number; method: string; body: unknown }[];
let listReads: number;
let detailReads: number[];
let detailCompleted: number[];
let readStatus: number;
let writeStatus: number;
let listError: boolean;
let failListAfterWrite: boolean;
let failDetailAfterWrite: boolean;
let malformedPatch: boolean;
let writeWait: Promise<void> | undefined;
let detailGate: { id: number; wait: Promise<void> } | undefined;

test.beforeEach(async ({ page }) => {
  writes = []; listReads = 0; detailReads = []; detailCompleted = []; readStatus = 200; writeStatus = 200;
  listError = false; failListAfterWrite = false; failDetailAfterWrite = false; malformedPatch = false; writeWait = undefined; detailGate = undefined;
  rows = Array.from({ length: 21 }, (_, i) => ({ id: i + 1, name: i === 0 ? "Ana Pérez" : i === 1 ? "Bruno Gómez" : `Cliente ${String(i + 1).padStart(3, "0")}`,
    status: "ACTIVE", email: i === 0 ? "ana@example.com" : null, phone_number: i === 0 ? "+54 (11) 5555-1234" : null,
    public_booking_blocked: false, internal_notes: i === 0 ? "Prefiere barba.\nSin perfume." : null }));
  await page.route("**/api/backend/api/v1/auth/me", route => route.fulfill({ json: session }));
  await page.route("**/api/backend/api/v1/customers**", async route => {
    const url = new URL(route.request().url()), method = route.request().method(), id = Number(url.pathname.split("/").at(-1));
    if (method === "GET" && !id) {
      listReads++;
      if (listError) return route.fulfill({ status: 503, json: {} });
      const q = url.searchParams.get("q")?.toLowerCase() ?? "", status = url.searchParams.get("status");
      const blocked = url.searchParams.get("public_booking_blocked");
      const filtered = rows.filter(row => (blocked === null || Boolean(row.public_booking_blocked) === (blocked === "true")) && (!status || status === "ALL" || row.status === status) && (!q || row.name.toLowerCase().includes(q)))
        .sort((a, b) => a.name.localeCompare(b.name, "es") || a.id - b.id);
      const number = Number(url.searchParams.get("page")), size = Number(url.searchParams.get("size"));
      return route.fulfill({ json: { data: filtered.slice(number * size, (number + 1) * size).map(row => ({ id: row.id, name: row.name, email: row.email, phone_number: row.phone_number, status: row.status, public_booking_blocked: Boolean(row.public_booking_blocked) })),
        page: { number, size, total_elements: filtered.length, total_pages: Math.ceil(filtered.length / size) } } });
    }
    const customer = rows.find(row => row.id === id);
    if (method === "GET") {
      detailReads.push(id);
      const snapshot = customer ? structuredClone(customer) : null;
      if (detailGate?.id === id) await detailGate.wait;
      await route.fulfill({ status: readStatus !== 200 ? readStatus : snapshot ? 200 : 404, json: snapshot ?? {} });
      detailCompleted.push(id); return;
    }
    const body = method === "PATCH" ? route.request().postDataJSON() : undefined;
    writes.push({ id, method, body });
    if (writeWait) await writeWait;
    if (writeStatus !== 200 || !customer) return route.fulfill({ status: !customer ? 404 : writeStatus, json: {} });
    if (method === "DELETE") customer.status = "INACTIVE";
    else { Object.assign(customer, body); if (body.public_booking_blocked === false) customer.public_booking_block_reason = null; }
    if (failListAfterWrite) listError = true;
    if (failDetailAfterWrite) readStatus = 503;
    if (method === "DELETE") return route.fulfill({ status: 204 });
    return route.fulfill({ json: malformedPatch ? { unexpected: true } : customer });
  });
});

const confirmation = (page: Page) => page.getByRole("alertdialog");
const confirm = (page: Page, verb = "Archivar") => confirmation(page).getByRole("button", { name: verb, exact: true });
async function action(page: Page, name: string, label: string) {
  await page.getByRole("button", { name: `Más acciones de ${name}`, exact: true }).click();
  await page.getByRole("menuitem", { name: label, exact: true }).click();
}

test("loads a deep link and reloads real contact, private notes and accessible actions", async ({ page }, info) => {
  await page.goto("/clientes/1");
  await expect(page.getByRole("heading", { name: "Ana Pérez", exact: true })).toBeVisible();
  await expect(page.getByText("ana@example.com", { exact: true })).toBeVisible();
  const notes = page.getByText("Prefiere barba.\nSin perfume.", { exact: true });
  await expect(notes).toBeVisible();
  expect(await notes.evaluate(element => getComputedStyle(element).whiteSpace)).toBe("pre-wrap");
  await expect(page.getByRole("button", { name: "Archivar", exact: true })).toBeInViewport();
  await expectAdminViewport(page);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath("customer-detail.png"), fullPage: false });
  await page.reload(); await expect(notes).toBeVisible();
  await expect(page.getByRole("link", { name: "Volver a clientes", exact: true })).toHaveAttribute("href", "/clientes");
  rows[1].status = "INACTIVE";
  await page.goto("/clientes/2");
  await expect(page.getByText("No hay notas internas.", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Restaurar", exact: true })).toBeVisible();
});

test("preserves filters, page and browser history through native detail links", async ({ page }) => {
  await page.goto("/clientes?page=1");
  await action(page, "Cliente 021", "Ver detalle");
  await expect(page).toHaveURL(/clientes\/21\?page=1$/);
  await page.reload(); await page.getByRole("link", { name: "Volver a clientes", exact: true }).click();
  await expect(page).toHaveURL(/clientes\?page=1$/);
  await expect(page.getByText("Página 2 de 2", { exact: true })).toBeVisible();
  await page.goBack(); await expect(page.getByRole("heading", { name: "Detalle del cliente", exact: true })).toBeVisible();
  await page.goForward(); await expect(page.getByRole("heading", { name: "Clientes", exact: true })).toBeVisible();
  await page.goto("/clientes?q=Ana&status=ALL");
  await action(page, "Ana Pérez", "Ver detalle");
  await expect(page.getByRole("link", { name: "Volver a clientes", exact: true })).toHaveAttribute("href", "/clientes?q=Ana&status=ALL");
  await page.getByRole("link", { name: "Volver a clientes", exact: true }).click();
  await expect(page.getByRole("searchbox", { name: "Buscar por nombre, teléfono o email", exact: true })).toHaveValue("Ana");
  await expect(page.getByRole("button", { name: "Quitar filtro de archivo", exact: true })).toBeVisible();
});

test("confirms status changes with Cancel focused and restores focus after keyboard cancellation", async ({ page }, info) => {
  await page.goto("/clientes?q=Ana"); await action(page, "Ana Pérez", "Archivar");
  await expect(confirmation(page).getByRole("button", { name: "Cancelar", exact: true })).toBeFocused();
  await expect(confirmation(page)).toContainText("Ya no aparecerá en la lista habitual. Sus datos, notas y turnos se conservarán.");
  await expectAdminViewport(page);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath("customer-confirmation.png"), fullPage: false });
  await page.keyboard.press("Escape"); await expect(confirmation(page)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Más acciones de Ana Pérez", exact: true })).toBeFocused();
  expect(writes).toHaveLength(0);
  await page.goto("/clientes/1"); await page.getByRole("button", { name: "Archivar", exact: true }).click();
  await confirmation(page).getByRole("button", { name: "Cancelar", exact: true }).click();
  await expect(page.getByRole("button", { name: "Archivar", exact: true })).toBeFocused();
});

test("archives and restores in detail with exact notices and intact notes", async ({ page }, info) => {
  await page.goto("/clientes/1"); await page.getByRole("button", { name: "Archivar", exact: true }).click(); await confirm(page).click();
  await expect(page.getByText("Archivado", { exact: true })).toBeVisible();
  await expect(page.getByTestId("floating-alert")).toContainText("Cliente archivado");
  await expect(page.getByTestId("floating-alert")).toContainText("Ya no aparece en la lista habitual. Sus datos y turnos se conservan.");
  await expectAdminNotice(page);
  await page.screenshot({ path: info.outputPath("customer-deactivated.png"), fullPage: false });
  await page.getByRole("button", { name: "Restaurar", exact: true }).click(); await confirm(page, "Restaurar").click();
  await expect(page.getByRole("button", { name: "Archivar", exact: true })).toBeVisible();
  await expect(page.getByTestId("floating-alert")).toContainText("Cliente restaurado");
  await expect(page.getByTestId("floating-alert")).toContainText("Vuelve a aparecer en la lista habitual.");
  await expectAdminNotice(page);
  await expect(page.getByText("Prefiere barba.\nSin perfume.", { exact: true })).toBeVisible();
  expect(writes).toEqual([{ id: 1, method: "DELETE", body: undefined }, { id: 1, method: "PATCH", body: { status: "ACTIVE" } }]);
  await expect(page).toHaveURL(/clientes\/1$/);
});

for (const verb of ["Archivar", "Restaurar"] as const) test(`clamps the filtered last page when ${verb.toLowerCase()} removes its final row`, async ({ page }) => {
  const status = verb === "Archivar" ? "ACTIVE" : "INACTIVE";
  rows = rows.map(row => ({ ...row, status }));
  await page.goto(`/clientes?status=${status}&page=1`);
  await expect(page.getByText("Página 2 de 2", { exact: true })).toBeVisible();
  await action(page, "Cliente 021", verb); await confirm(page, verb).click();
  await expect(page).toHaveURL(status === "ACTIVE" ? /clientes$/ : /clientes\?status=INACTIVE$/);
  await expect(page.getByText("20 clientes", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cliente 021", exact: true })).toHaveCount(0);
  await expect(page.getByRole("searchbox", { name: "Buscar por nombre, teléfono o email", exact: true })).toBeFocused();
  expect(writes).toHaveLength(1);
});

test("loads fresh data into the reused editor and keeps its draft during background refresh", async ({ page }) => {
  await page.goto("/clientes/1"); await expect(page.getByText("Prefiere barba.\nSin perfume.", { exact: true })).toBeVisible();
  rows[0].internal_notes = "Actualización del servidor";
  let release!: () => void; detailGate = { id: 1, wait: new Promise<void>(resolve => { release = resolve; }) };
  const before = detailReads.length;
  await page.getByRole("button", { name: "Editar datos", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Editar cliente", exact: true });
  await expect(dialog.getByLabel("Cargando cliente", { exact: true })).toBeVisible();
  await expect.poll(() => detailReads.length).toBeGreaterThan(before);
  release(); detailGate = undefined;
  const notes = dialog.getByRole("textbox", { name: "Notas internas (opcional)", exact: true });
  await expect(notes).toHaveValue("Actualización del servidor");
  const save = dialog.getByRole("button", { name: "Guardar cambios", exact: true });
  await expect(save).toBeDisabled(); await notes.fill("Borrador privado");
  rows[0].internal_notes = "Otro cambio del servidor";
  const reads = detailCompleted.length;
  await page.evaluate(() => { window.dispatchEvent(new Event("offline")); window.dispatchEvent(new Event("online")); });
  await expect.poll(() => detailCompleted.length).toBeGreaterThan(reads);
  await expect(notes).toHaveValue("Borrador privado");
  await save.click(); await expect(dialog).toHaveCount(0);
  await expect(page.getByText("Borrador privado", { exact: true })).toBeVisible();
  await expect(page.getByTestId("floating-alert")).toContainText("Cliente actualizado");
  await expect(page.getByTestId("floating-alert")).toContainText("Se guardaron los cambios en sus datos.");
  expect(writes).toEqual([{ id: 1, method: "PATCH", body: { internal_notes: "Borrador privado" } }]);
});

test("keeps status write errors open and retries without losing context", async ({ page }, info) => {
  writeStatus = 503; await page.goto("/clientes/1");
  await page.getByRole("button", { name: "Archivar", exact: true }).click(); await confirm(page).click();
  await expect(confirmation(page).getByText("No pudimos archivar el cliente", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Archivar", exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("customer-status-error.png"), fullPage: false });
  writeStatus = 200; await confirm(page).click();
  await expect(confirmation(page)).toHaveCount(0); await expect(page.getByText("Archivado", { exact: true })).toBeVisible();
  expect(writes).toHaveLength(2);
});

test("blocks duplicate writes, cancellation and Escape while pending", async ({ page }) => {
  let release!: () => void; writeWait = new Promise<void>(resolve => { release = resolve; });
  await page.goto("/clientes/1"); await page.getByRole("button", { name: "Archivar", exact: true }).click();
  await confirm(page).evaluate((button: HTMLButtonElement) => { button.click(); button.click(); });
  await expect.poll(() => writes.length).toBe(1);
  await expect(confirmation(page).getByRole("button", { name: "Archivando…", exact: true })).toBeDisabled();
  await expect(confirmation(page).getByRole("button", { name: "Cancelar", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape"); await expect(confirmation(page)).toBeVisible();
  release(); await expect(confirmation(page)).toHaveCount(0);
  await expect(page.getByText("Archivado", { exact: true })).toBeVisible(); expect(writes).toHaveLength(1);
});

test("shows read errors, missing customers and invalid IDs without editable actions", async ({ page }) => {
  readStatus = 503; await page.goto("/clientes/1");
  await expect(page.getByText("No pudimos cargar el cliente", { exact: true })).toBeVisible();
  readStatus = 200; await page.getByRole("button", { name: "Reintentar carga", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Ana Pérez", exact: true })).toBeVisible();
  readStatus = 404; await page.reload(); await expect(page.getByText("Cliente no encontrado", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Editar datos", exact: true })).toHaveCount(0);
  const reads = detailReads.length;
  for (const id of ["0", "not-a-number", "9007199254740992"]) {
    await page.goto(`/clientes/${id}`); await expect(page.getByText("Cliente no encontrado", { exact: true })).toBeVisible();
  }
  expect(detailReads).toHaveLength(reads);
});

test("handles a customer disappearing during confirmation without trapping Cancel", async ({ page }) => {
  await page.goto("/clientes/1"); await page.getByRole("button", { name: "Archivar", exact: true }).click();
  writeStatus = 404; rows = rows.filter(row => row.id !== 1);
  await confirm(page).click();
  await expect(confirmation(page).getByText("El cliente ya no está disponible", { exact: true })).toBeVisible();
  await expect(confirm(page)).toBeDisabled();
  await expect(confirmation(page).getByRole("button", { name: "Cancelar", exact: true })).toBeEnabled();
  await confirmation(page).getByRole("button", { name: "Actualizar datos", exact: true }).click();
  await expect(confirmation(page)).toHaveCount(0);
  await expect(page.getByText("Cliente no encontrado", { exact: true })).toBeVisible();
  expect(writes).toHaveLength(1);
});

test("retries only reads after list refresh fails following a confirmed deactivation", async ({ page }) => {
  failListAfterWrite = true; await page.goto("/clientes?status=ACTIVE"); await action(page, "Ana Pérez", "Archivar"); await confirm(page).click();
  await expect(page.getByTestId("floating-alert")).toContainText("Cliente archivado");
  await expect(page.getByText("El cambio se guardó, pero no pudimos actualizar los datos", { exact: true })).toBeVisible();
  expect(writes).toHaveLength(1); const reads = listReads;
  listError = false; await page.getByRole("button", { name: "Reintentar actualización", exact: true }).click();
  await expect(page.getByText("20 clientes", { exact: true })).toBeVisible(); expect(listReads).toBeGreaterThan(reads); expect(writes).toHaveLength(1);
  await expect(page).toHaveURL(/clientes\?status=ACTIVE$/);
});

test("preserves confirmed state and private notes when a malformed PATCH and detail refresh fail", async ({ page }) => {
  rows[0].status = "INACTIVE"; malformedPatch = true; failDetailAfterWrite = true;
  await page.goto("/clientes/1"); await page.getByRole("button", { name: "Restaurar", exact: true }).click(); await confirm(page, "Restaurar").click();
  await expect(page.getByTestId("floating-alert")).toContainText("Cliente restaurado");
  await expect(page.getByText("El cambio se guardó, pero no pudimos actualizar los datos", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Archivar", exact: true })).toBeVisible();
  await expect(page.getByText("Prefiere barba.\nSin perfume.", { exact: true })).toBeVisible();
  readStatus = 200; await page.getByRole("button", { name: "Reintentar actualización", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reintentar actualización", exact: true })).toHaveCount(0);
  expect(writes).toHaveLength(1);
});

test("ignores cancelled late detail responses while navigating to another client", async ({ page }) => {
  let release!: () => void; detailGate = { id: 1, wait: new Promise<void>(resolve => { release = resolve; }) };
  await page.goto("/clientes/1"); await expect(page.getByLabel("Cargando detalle del cliente", { exact: true })).toBeVisible();
  await expect.poll(() => detailReads.filter(id => id === 1).length).toBeGreaterThan(0);
  await page.goto("/clientes/2"); await expect(page.getByRole("heading", { name: "Bruno Gómez", exact: true })).toBeVisible();
  const oldReads = detailReads.filter(id => id === 1).length;
  release(); await expect.poll(() => detailCompleted.filter(id => id === 1).length).toBe(oldReads);
  await expect(page.getByRole("heading", { name: "Bruno Gómez", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ana Pérez", exact: true })).toHaveCount(0);
});

test("wraps long contact and notes content above the mobile navigation", async ({ page }, info) => {
  rows[0].name = "Cliente".repeat(14); rows[0].email = "e".repeat(115) + "@example.com"; rows[0].internal_notes = "Nota".repeat(400);
  await page.goto("/clientes/1"); await expect(page.getByRole("heading", { name: rows[0].name, exact: true })).toBeVisible();
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  const notes = page.getByText(rows[0].internal_notes, { exact: true }); await expect(notes).toBeInViewport();
  await expectAdminViewport(page);
  if (page.viewportSize()!.width < 768) {
    const box = (await notes.boundingBox())!, nav = (await page.getByRole("navigation", { name: "Navegación principal", exact: true }).boundingBox())!;
    expect(box.y + box.height).toBeLessThanOrEqual(nav.y);
  }
  await page.screenshot({ path: info.outputPath("customer-detail-long.png"), fullPage: false });
});

test("blocks with a required private reason and independently archives, restores and unblocks", async ({ page }, info) => {
  await page.goto("/clientes/1");
  await page.getByRole("button", { name: "Bloquear reservas", exact: true }).click();
  await expect(confirmation(page).getByRole("button", { name: "Cancelar", exact: true })).toBeFocused();
  await confirm(page, "Bloquear reservas").click();
  await expect(confirmation(page).getByRole("textbox", { name: "Motivo interno", exact: true })).toBeFocused();
  await expect(confirmation(page).getByText("Ingresá un motivo de hasta 500 caracteres.", { exact: true })).toBeVisible();
  expect(writes).toHaveLength(0);
  await confirmation(page).getByRole("textbox", { name: "Motivo interno", exact: true }).fill(" Ausencias reiteradas\nConversado con el cliente. ");
  await expectAdminViewport(page);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath("customer-block-reason.png"), fullPage: false });
  await confirm(page, "Bloquear reservas").click();
  await expect(page.getByText("Reservas bloqueadas", { exact: true })).toBeVisible();
  await expect(page.getByText("Ausencias reiteradas\nConversado con el cliente.", { exact: true })).toBeVisible();
  await expect(page.getByTestId("floating-alert")).toContainText("Reservas públicas bloqueadas");
  await expect(page.getByTestId("floating-alert")).toContainText("No podrá reservar por el enlace público. Podés asignarle turnos manualmente.");
  await expectAdminNotice(page);
  await page.screenshot({ path: info.outputPath("customer-blocked-detail.png"), fullPage: true });
  await page.getByRole("button", { name: "Archivar", exact: true }).click(); await confirm(page).click();
  await expect(page.getByText("Archivado", { exact: true })).toBeVisible();
  await expect(page.getByText("Reservas bloqueadas", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Restaurar", exact: true }).click(); await confirm(page, "Restaurar").click();
  await expect(page.getByText("Archivado", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Reservas bloqueadas", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Archivar", exact: true }).click(); await confirm(page).click();
  await page.getByRole("button", { name: "Desbloquear reservas", exact: true }).click(); await confirm(page, "Desbloquear reservas").click();
  await expect(page.getByText("Archivado", { exact: true })).toBeVisible();
  await expect(page.getByText("Ausencias reiteradas\nConversado con el cliente.", { exact: true })).toHaveCount(0);
  await expect(page.getByTestId("floating-alert")).toContainText("Reservas públicas desbloqueadas");
  await expect(page.getByTestId("floating-alert")).toContainText("Puede volver a reservar por el enlace público.");
  await expectAdminNotice(page);
  expect(writes[0]).toEqual({ id: 1, method: "PATCH", body: { public_booking_blocked: true, public_booking_block_reason: "Ausencias reiteradas\nConversado con el cliente." } });
  expect(writes.at(-1)).toEqual({ id: 1, method: "PATCH", body: { public_booking_blocked: false } });
  await expect(page.getByText("Prefiere barba.\nSin perfume.", { exact: true })).toBeVisible();
});

test("keeps block drafts after failure, blocks duplicate submit and closing, then retries", async ({ page }) => {
  await page.goto("/clientes/1"); await page.getByRole("button", { name: "Bloquear reservas", exact: true }).click();
  const reason = confirmation(page).getByRole("textbox", { name: "Motivo interno", exact: true });
  await reason.fill("Motivo preservado"); writeStatus = 503; await confirm(page, "Bloquear reservas").click();
  await expect(confirmation(page).getByText("No pudimos bloquear las reservas", { exact: true })).toBeVisible();
  await expect(reason).toHaveValue("Motivo preservado");
  let release!: () => void; writeWait = new Promise<void>(resolve => { release = resolve; }); writeStatus = 200;
  await confirm(page, "Bloquear reservas").dblclick();
  await expect(confirmation(page).getByRole("button", { name: "Bloqueando…", exact: true })).toBeDisabled();
  await expect(confirmation(page).getByRole("button", { name: "Cancelar", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape"); await expect(confirmation(page)).toBeVisible();
  expect(writes).toHaveLength(2); release();
  await expect(confirmation(page)).toHaveCount(0);
  await expect(page.getByText("Motivo preservado", { exact: true })).toBeVisible();
});

test("combines provisional archive and booking filters and removes their pills independently", async ({ page }, info) => {
  rows[0].public_booking_blocked = true; rows[0].public_booking_block_reason = "Motivo privado";
  rows[1].status = "INACTIVE"; rows[1].public_booking_blocked = true; rows[1].public_booking_block_reason = "Otro motivo";
  await page.goto("/clientes");
  await expect(page.getByRole("heading", { name: "Bruno Gómez", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: /^Filtros/ }).click();
  const dialog = page.getByRole("dialog", { name: "Filtrar clientes", exact: true });
  const reads = listReads;
  await dialog.getByRole("radio", { name: "Archivados", exact: true }).check();
  await dialog.getByRole("radio", { name: "Bloqueadas", exact: true }).check();
  expect(listReads).toBe(reads);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: /^Filtros/ }).click();
  await expect(dialog.getByRole("radio", { name: "Sin archivar", exact: true })).toBeChecked();
  await expect(dialog.getByRole("radio", { name: "Todas", exact: true })).toBeChecked();
  await dialog.getByRole("radio", { name: "Archivados", exact: true }).check();
  await dialog.getByRole("radio", { name: "Bloqueadas", exact: true }).check();
  await dialog.getByRole("button", { name: "Aplicar filtros", exact: true }).click();
  await expect(page).toHaveURL(/status=INACTIVE&public_booking_blocked=true$/);
  await expect(page.getByText("1 cliente", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Bruno Gómez", exact: true })).toBeVisible();
  await expect(page.getByText("Otro motivo", { exact: true })).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("customer-archive-block-filters.png"), fullPage: false });
  await page.getByRole("button", { name: "Quitar filtro de archivo", exact: true }).click();
  await expect(page).toHaveURL(/clientes\?public_booking_blocked=true$/);
  await expect(page.getByRole("heading", { name: "Ana Pérez", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Quitar filtro de reservas públicas", exact: true }).click();
  await expect(page).toHaveURL(/clientes$/);
});

test("preserves both filters through detail and removes a blocked row from an allowed-only page", async ({ page }) => {
  await page.goto("/clientes?status=ALL&public_booking_blocked=false");
  await action(page, "Ana Pérez", "Ver detalle");
  await expect(page.getByRole("link", { name: "Volver a clientes", exact: true })).toHaveAttribute("href", "/clientes?status=ALL&public_booking_blocked=false");
  await page.getByRole("link", { name: "Volver a clientes", exact: true }).click();
  await action(page, "Ana Pérez", "Bloquear reservas");
  await confirmation(page).getByRole("textbox", { name: "Motivo interno", exact: true }).fill("Motivo");
  await confirm(page, "Bloquear reservas").click();
  await expect(page.getByRole("heading", { name: "Ana Pérez", exact: true })).toHaveCount(0);
  await expect(page.getByRole("searchbox")).toBeFocused();
  await expect(page).toHaveURL(/status=ALL&public_booking_blocked=false$/);
});

test("recovers a confirmed block with read-only retry without losing reason or notes", async ({ page }) => {
  await page.goto("/clientes/1"); malformedPatch = true; failDetailAfterWrite = true;
  await page.getByRole("button", { name: "Bloquear reservas", exact: true }).click();
  await confirmation(page).getByRole("textbox", { name: "Motivo interno", exact: true }).fill("Motivo confirmado");
  await confirm(page, "Bloquear reservas").click();
  await expect(page.getByRole("button", { name: "Reintentar actualización", exact: true })).toBeVisible();
  await expect(page.getByText("Motivo confirmado", { exact: true })).toBeVisible();
  await expect(page.getByText("Prefiere barba.\nSin perfume.", { exact: true })).toBeVisible();
  readStatus = 200; await page.getByRole("button", { name: "Reintentar actualización", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reintentar actualización", exact: true })).toHaveCount(0);
  expect(writes).toHaveLength(1);
});

test("keeps clients without usable contact editable and explains why blocking is unavailable", async ({ page }) => {
  rows[0].email = null; rows[0].phone_number = null;
  await page.goto("/clientes/1"); await page.getByRole("button", { name: "Bloquear reservas", exact: true }).click();
  await expect(confirmation(page).getByText("Falta un contacto", { exact: true })).toBeVisible();
  await expect(confirm(page, "Bloquear reservas")).toBeDisabled();
  await confirmation(page).getByRole("button", { name: "Cancelar", exact: true }).click();
  await page.getByRole("button", { name: "Editar datos", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Editar cliente", exact: true })).toBeVisible();
  expect(writes).toHaveLength(0);
});
