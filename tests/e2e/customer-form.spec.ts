import { expect, test, type Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { expectAdminNotice, expectAdminViewport } from "./helpers/admin-patterns";

type Customer = { id: number; name: string; email: string | null; phone_number: string | null; internal_notes: string | null; status: "ACTIVE" | "INACTIVE" };
const session = { business: { id: 10, name: "Barber Studio", onboarding_status: "COMPLETED", slug: "barber-studio" },
  user: { avatar_url: null, email: "juan@example.com", id: 1, name: "Juan Perez", role: "OWNER" } };
let rows: Customer[];
let writes: { method: string; body: Record<string, string> }[];
let reads: number;
let writeStatus: number;
let detailStatus: number;
let listFailed: boolean;
let failListAfterWrite: boolean;
let writeWait: Promise<void> | undefined;
let detailWait: Promise<void> | undefined;
let detailWaiting: boolean;
let detailDelivered: number;
let detailStarted: number;

test.beforeEach(async ({ page }) => {
  writes = []; reads = 0; writeStatus = 200; detailStatus = 200; listFailed = false; failListAfterWrite = false; writeWait = undefined; detailWait = undefined; detailWaiting = false; detailDelivered = 0; detailStarted = 0;
  rows = Array.from({ length: 26 }, (_, i) => ({ id: i + 1, name: i === 0 ? "Ana Pérez" : i === 1 ? "Bruno Gómez" : "Cliente " + String(i + 1).padStart(3, "0"),
    email: i === 0 ? "ana@example.com" : null, phone_number: i === 0 ? "+54 (11) 5555-1234" : null, internal_notes: i === 0 ? "Prefiere barba" : null,
    status: i === 1 ? "INACTIVE" : "ACTIVE" }));
  await page.route("**/api/backend/api/v1/auth/me", route => route.fulfill({ json: session }));
  await page.route("**/api/backend/api/v1/customers**", async route => {
    const url = new URL(route.request().url()); const method = route.request().method();
    const id = Number(url.pathname.split("/").at(-1));
    if (method === "GET" && !id) {
      reads++;
      if (listFailed) return route.fulfill({ status: 503, json: { message: "Unavailable" } });
      const q = (url.searchParams.get("q") ?? "").toLowerCase(), status = url.searchParams.get("status");
      const found = rows.filter(row => (!status || row.status === status) && (!q || row.name.toLowerCase().includes(q)))
        .sort((a, b) => a.name.localeCompare(b.name, "es") || a.id - b.id);
      const number = Number(url.searchParams.get("page")), size = Number(url.searchParams.get("size"));
      return route.fulfill({ json: { data: found.slice(number * size, (number + 1) * size).map(customer => ({ id: customer.id, name: customer.name, email: customer.email, phone_number: customer.phone_number, status: customer.status })),
        page: { number, size, total_elements: found.length, total_pages: Math.ceil(found.length / size) } } });
    }
    if (method === "GET") {
      detailWaiting = true; detailStarted++; if (detailWait) await detailWait;
      if (detailStatus !== 200) return route.fulfill({ status: detailStatus, json: { message: "Unavailable" } });
      const customer = rows.find(row => row.id === id);
      await route.fulfill({ status: customer ? 200 : 404, json: customer ?? { message: "Not found" } });
      detailDelivered++;
      return;
    }
    const body = route.request().postDataJSON(); writes.push({ method, body });
    if (writeWait) await writeWait;
    if (writeStatus !== 200) return route.fulfill({ status: writeStatus, json: { code: writeStatus === 400 ? "VALIDATION_ERROR" : "INTERNAL_ERROR",
      details: writeStatus === 400 ? [{ field: "phoneNumber", message: "Invalid phone" }] : undefined } });
    let customer = rows.find(row => row.id === id);
    if (method === "POST") {
      customer = { id: 50, status: "ACTIVE", ...body }; rows.push(customer!);
    } else if (customer) Object.assign(customer, body);
    if (failListAfterWrite) listFailed = true;
    return route.fulfill({ status: method === "POST" ? 201 : 200, json: customer });
  });
});

async function openCreate(page: Page) {
  await page.goto("/clientes");
  await page.getByRole("button", { name: "Nuevo cliente", exact: true }).first().click();
  return page.getByRole("dialog", { name: "Nuevo cliente", exact: true });
}
async function fillCreate(page: Page) {
  const dialog = await openCreate(page);
  await dialog.getByRole("textbox", { name: "Nombre", exact: true }).fill("Zoe nueva");
  await dialog.getByRole("textbox", { name: "Teléfono", exact: true }).fill("+54 (11) 1234-5678");
  return dialog;
}
function row(page: Page, name = "Ana Pérez") { return page.getByRole("article").filter({ has: page.getByRole("heading", { name, exact: true }) }); }

async function expectDialogFooter(page: Page) {
  const dialog = page.getByRole("dialog", { name: /^(Nuevo cliente|Editar cliente)$/ });
  const save = dialog.getByRole("button", { name: /^(Crear cliente|Guardar cambios|Guardando\.\.\.|Creando\.\.\.)$/ });
  await expect(save).toHaveCount(1); await expect(save).toBeInViewport();
  const box = (await save.boundingBox())!, bounds = (await dialog.boundingBox())!;
  expect(box.height).toBeGreaterThanOrEqual(44);
  expect(box.y + box.height).toBeLessThanOrEqual(bounds.y + bounds.height);
  await expectAdminViewport(page);
}

test("validates and creates a client without email, shows the exact success notice and keeps the header action", async ({ page }, info) => {
  const dialog = await openCreate(page);
  await expect(dialog.getByText("Completá sus datos de contacto y las notas internas del negocio.")).toBeVisible();
  await dialog.getByRole("button", { name: "Crear cliente", exact: true }).click();
  await expect(dialog.getByRole("textbox", { name: "Nombre", exact: true })).toBeFocused();
  await expect(dialog.getByText("Ingresá el teléfono del cliente.")).toBeVisible();
  expect(writes).toHaveLength(0);
  await dialog.getByRole("textbox", { name: "Nombre", exact: true }).fill(" Zoe nueva ");
  await dialog.getByRole("textbox", { name: "Teléfono", exact: true }).fill(" +54 (11) 1234-5678 ");
  await dialog.getByRole("textbox", { name: "Notas internas (opcional)", exact: true }).fill(" Prefiere silencio.\nSin perfume. ");
  await expectDialogFooter(page);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations).toEqual([]);
  await page.screenshot({ path: info.outputPath("customer-create.png"), fullPage: false });
  await dialog.getByRole("button", { name: "Crear cliente", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(writes).toEqual([{ method: "POST", body: { name: "Zoe nueva", phone_number: "+54 (11) 1234-5678", email: "", internal_notes: "Prefiere silencio.\nSin perfume." } }]);
  await expect(page.getByText("27 clientes", { exact: true })).toBeVisible();
  await expect(page.getByText("Cliente creado", { exact: true })).toBeVisible();
  await expect(page.getByText("El cliente quedó registrado en tu negocio.", { exact: true })).toBeVisible();
  await expectAdminNotice(page);
  await expect(page.getByRole("button", { name: "Nuevo cliente", exact: true })).toBeFocused();
  await page.screenshot({ path: info.outputPath("customer-created.png"), fullPage: false });
});

test("loads fresh detail, detects edits and reversions, and patches only editable changes", async ({ page }, info) => {
  let release!: () => void; detailWait = new Promise<void>(resolve => { release = resolve; });
  await page.goto("/clientes"); await row(page).getByRole("button", { name: "Editar", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Editar cliente", exact: true });
  await expect(dialog.getByLabel("Cargando cliente", { exact: true })).toBeVisible();
  release();
  const name = dialog.getByRole("textbox", { name: "Nombre", exact: true });
  const save = dialog.getByRole("button", { name: "Guardar cambios", exact: true });
  await expect(name).toHaveValue("Ana Pérez");
  await expect(dialog.getByRole("textbox", { name: "Notas internas (opcional)", exact: true })).toHaveValue("Prefiere barba");
  await expect(save).toBeDisabled();
  await name.fill("Ana nueva"); await expect(save).toBeEnabled();
  await name.fill("Ana Pérez"); await expect(save).toBeDisabled();
  await dialog.getByRole("textbox", { name: "Email (opcional)", exact: true }).fill("");
  await dialog.getByRole("textbox", { name: "Notas internas (opcional)", exact: true }).fill("");
  await expectDialogFooter(page);
  await page.screenshot({ path: info.outputPath("customer-edit.png"), fullPage: false });
  await save.click(); await expect(dialog).toHaveCount(0);
  expect(writes).toEqual([{ method: "PATCH", body: { email: "", internal_notes: "" } }]);
  await expect(page.getByText("Cliente actualizado", { exact: true })).toBeVisible();
  await expect(page.getByText("Se guardaron los cambios en sus datos.", { exact: true })).toBeVisible();
  await expectAdminNotice(page);
  await expect(row(page).getByText("ana@example.com", { exact: true })).toHaveCount(0);
  await row(page).getByRole("button", { name: "Editar", exact: true }).click();
  await expect(save).toBeDisabled();
  await expect(dialog.getByRole("textbox", { name: "Notas internas (opcional)", exact: true })).toHaveValue("");
});

test("edits an inactive legacy client without adding a phone and preserves list URL and status", async ({ page }) => {
  await page.goto("/clientes?status=INACTIVE&q=Bruno");
  await row(page, "Bruno Gómez").getByRole("button", { name: "Editar", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Editar cliente", exact: true });
  await expect(dialog.getByText(/Este cliente todavía no tiene teléfono/)).toBeVisible();
  await dialog.getByRole("textbox", { name: "Notas internas (opcional)", exact: true }).fill("Nueva nota");
  await dialog.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(writes).toEqual([{ method: "PATCH", body: { internal_notes: "Nueva nota" } }]);
  await expect(page).toHaveURL(/status=INACTIVE&q=Bruno/);
  await expect(row(page, "Bruno Gómez").getByText("Inactivo", { exact: true })).toBeVisible();
});

test("confirms dirty dismissal and restores focus while clean cancellation closes immediately", async ({ page }) => {
  const dialog = await openCreate(page);
  await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0);
  const trigger = page.getByRole("button", { name: "Nuevo cliente", exact: true });
  await expect(trigger).toBeFocused(); await trigger.click();
  await dialog.getByRole("textbox", { name: "Nombre", exact: true }).fill("Borrador");
  await page.keyboard.press("Escape");
  const confirm = page.getByRole("alertdialog", { name: "¿Descartar los cambios?" });
  await expect(confirm).toBeVisible();
  await confirm.getByRole("button", { name: "Seguir editando", exact: true }).click();
  await expect(dialog.getByRole("textbox", { name: "Nombre", exact: true })).toHaveValue("Borrador");
  await dialog.getByRole("button", { name: "Cancelar", exact: true }).click();
  await confirm.getByRole("button", { name: "Descartar", exact: true }).click();
  await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused();
  expect(writes).toHaveLength(0);
});

test("blocks double submit and all closing actions during creation", async ({ page }) => {
  let release!: () => void; writeWait = new Promise<void>(resolve => { release = resolve; });
  const dialog = await fillCreate(page);
  await dialog.locator("form").evaluate((form: HTMLFormElement) => { form.requestSubmit(); form.requestSubmit(); });
  await expect.poll(() => writes.length).toBe(1);
  await expect(dialog.getByRole("button", { name: "Creando...", exact: true })).toBeDisabled();
  await expect(dialog.getByRole("button", { name: "Cancelar", exact: true })).toBeDisabled();
  await expect(dialog.getByRole("button", { name: "Cerrar formulario", exact: true })).toBeDisabled();
  await page.keyboard.press("Escape"); await expect(dialog).toBeVisible();
  release(); await expect(dialog).toHaveCount(0); expect(writes).toHaveLength(1);
});

test("maps API field errors to Spanish, retains values and validates optional email locally", async ({ page }) => {
  const dialog = await fillCreate(page);
  const email = dialog.getByRole("textbox", { name: "Email (opcional)", exact: true });
  await email.fill("invalid"); await dialog.getByRole("button", { name: "Crear cliente", exact: true }).click();
  await expect(email).toBeFocused(); expect(writes).toHaveLength(0);
  await email.fill(""); writeStatus = 400;
  await dialog.getByRole("button", { name: "Crear cliente", exact: true }).click();
  const phone = dialog.getByRole("textbox", { name: "Teléfono", exact: true });
  await expect(phone).toBeFocused();
  await expect(dialog.getByText("Revisá el teléfono ingresado (hasta 30 caracteres).", { exact: true })).toBeVisible();
  await expect(dialog.getByTestId("floating-alert")).toHaveCount(0);
  await expect(dialog.getByRole("textbox", { name: "Nombre", exact: true })).toHaveValue("Zoe nueva");
  await phone.fill("123"); writeStatus = 200;
  await dialog.getByRole("button", { name: "Crear cliente", exact: true }).click(); await expect(dialog).toHaveCount(0);
});

test("keeps a failed write recoverable in the dialog and retries the preserved draft", async ({ page }, info) => {
  const dialog = await fillCreate(page); writeStatus = 503;
  await dialog.getByRole("button", { name: "Crear cliente", exact: true }).click();
  await expect(dialog.getByText("No pudimos crear el cliente", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Revisá tu conexión e intentá nuevamente. Los datos que completaste se conservan.", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("textbox", { name: "Nombre", exact: true })).toHaveValue("Zoe nueva");
  await expectDialogFooter(page);
  await page.screenshot({ path: info.outputPath("customer-write-error.png"), fullPage: false });
  writeStatus = 200; await dialog.getByRole("button", { name: "Reintentar", exact: true }).click();
  await expect(dialog).toHaveCount(0); expect(writes).toHaveLength(2);
  expect(writes[1].body).toEqual(writes[0].body);
});

test("retries only reads after a successful write and failed list refresh", async ({ page }) => {
  const dialog = await fillCreate(page); failListAfterWrite = true;
  await dialog.getByRole("button", { name: "Crear cliente", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText("Cliente creado", { exact: true })).toBeVisible();
  await expect(page.getByText("El cliente se guardó, pero no pudimos actualizar los datos", { exact: true })).toBeVisible();
  expect(writes).toHaveLength(1); const before = reads;
  listFailed = false;
  await page.getByRole("button", { name: "Reintentar actualización", exact: true }).click();
  await expect(page.getByText("27 clientes", { exact: true })).toBeVisible();
  expect(reads).toBeGreaterThan(before); expect(writes).toHaveLength(1);
  await expect(page.getByRole("button", { name: "Reintentar actualización", exact: true })).toHaveCount(0);
});

test("recovers a failed detail and handles a missing customer without editable fields", async ({ page }) => {
  await page.goto("/clientes"); detailStatus = 503;
  await row(page).getByRole("button", { name: "Editar", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Editar cliente", exact: true });
  await expect(dialog.getByText("No pudimos cargar el cliente", { exact: true })).toBeVisible();
  detailStatus = 200; await dialog.getByRole("button", { name: "Reintentar", exact: true }).click();
  await expect(dialog.getByRole("textbox", { name: "Nombre", exact: true })).toHaveValue("Ana Pérez");
  await dialog.getByRole("button", { name: "Cerrar formulario", exact: true }).click();
  detailStatus = 404; await row(page).getByRole("button", { name: "Editar", exact: true }).click();
  await expect(dialog.getByText("El cliente ya no está disponible", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Guardar cambios", exact: true })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Volver al listado", exact: true }).click(); await expect(dialog).toHaveCount(0);
});

test("ignores a late detail response after cancellation and keeps the next editor isolated", async ({ page }) => {
  let release!: () => void; detailWait = new Promise<void>(resolve => { release = resolve; });
  await page.goto("/clientes"); await row(page).getByRole("button", { name: "Editar", exact: true }).click();
  await expect.poll(() => detailWaiting).toBe(true);
  await page.getByRole("button", { name: "Cerrar formulario", exact: true }).click();
  detailWait = undefined;
  await page.getByRole("button", { name: "Nuevo cliente", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Nuevo cliente", exact: true });
  await dialog.getByRole("textbox", { name: "Nombre", exact: true }).fill("Borrador nuevo");
  const pendingDetails = detailStarted;
  release();
  await expect.poll(() => detailDelivered).toBe(pendingDetails);
  await expect(dialog.getByRole("textbox", { name: "Nombre", exact: true })).toHaveValue("Borrador nuevo");
  expect(writes).toHaveLength(0);
});

test("creates from the empty state and keeps long drafts within the viewport", async ({ page }, info) => {
  rows = []; await page.goto("/clientes");
  await expect(page.getByText("Todavía no hay clientes", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Nuevo cliente", exact: true }).last().click();
  const dialog = page.getByRole("dialog", { name: "Nuevo cliente", exact: true });
  await dialog.getByRole("textbox", { name: "Nombre", exact: true }).fill("Nombre".repeat(16));
  await dialog.getByRole("textbox", { name: "Teléfono", exact: true }).fill("123");
  await dialog.getByRole("textbox", { name: "Email (opcional)", exact: true }).fill("l".repeat(60) + "@example.com");
  await dialog.getByRole("textbox", { name: "Notas internas (opcional)", exact: true }).fill("Notas internas extensas.\n".repeat(50));
  await expectDialogFooter(page);
  await page.screenshot({ path: info.outputPath("customer-long-draft.png"), fullPage: false });
});


test("clamps the last filtered page after renaming its final match and restores search focus", async ({ page }) => {
  rows = Array.from({ length: 21 }, (_, i) => ({ id: i + 1, name: "Cliente " + String(i + 1).padStart(3, "0"), email: null, phone_number: "123", internal_notes: null, status: "ACTIVE" }));
  await page.goto("/clientes?q=Cliente&page=1");
  await expect(page.getByText("Página 2 de 2", { exact: true })).toBeVisible();
  await row(page, "Cliente 021").getByRole("button", { name: "Editar", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Editar cliente", exact: true });
  await dialog.getByRole("textbox", { name: "Nombre", exact: true }).fill("Persona renombrada");
  await dialog.getByRole("button", { name: "Guardar cambios", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/clientes\?q=Cliente$/);
  await expect(page.getByText("20 clientes", { exact: true })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Buscar por nombre, teléfono o email", exact: true })).toBeFocused();
  expect(writes).toEqual([{ method: "PATCH", body: { name: "Persona renombrada" } }]);
});

test("prevents clearing an existing phone and preserves the edit draft after a failed PATCH", async ({ page }) => {
  await page.goto("/clientes"); await row(page).getByRole("button", { name: "Editar", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Editar cliente", exact: true });
  const phone = dialog.getByRole("textbox", { name: "Teléfono", exact: true });
  const save = dialog.getByRole("button", { name: "Guardar cambios", exact: true });
  await phone.fill(""); await save.click();
  await expect(dialog.getByText("Ingresá el teléfono del cliente.", { exact: true })).toBeVisible();
  await expect(phone).toBeFocused(); expect(writes).toHaveLength(0);
  await phone.fill("+54 (11) 5555-1234"); await expect(save).toBeDisabled();
  await dialog.getByRole("textbox", { name: "Notas internas (opcional)", exact: true }).fill("Nota actualizada");
  writeStatus = 503; await save.click();
  await expect(dialog.getByText("No pudimos guardar los cambios", { exact: true })).toBeVisible();
  await expect(dialog.getByRole("textbox", { name: "Notas internas (opcional)", exact: true })).toHaveValue("Nota actualizada");
  await expect(save).toBeEnabled();
  writeStatus = 200; await dialog.getByRole("button", { name: "Reintentar", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(writes).toHaveLength(2);
  expect(writes[1]).toEqual({ method: "PATCH", body: { internal_notes: "Nota actualizada" } });
  expect(writes[0]).toEqual(writes[1]);
});
