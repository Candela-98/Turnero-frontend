import { AxeBuilder } from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { expectAdminViewport } from "./helpers/admin-patterns";

const statuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"] as const;
const appointments = Array.from({ length: 106 }, (_, index) => ({
  id: index + 1, customer_id: index + 1, staff_member_id: index === 105 ? 999 : index % 3 + 1, service_offering_id: 1,
  starts_at: `2026-10-20T${index === 105 ? "23:30" : index < 2 ? "07:15" : "14:00"}:00-03:00`,
  ends_at: index === 105 ? "2026-10-21T00:30:00-03:00" : `2026-10-20T${index < 2 ? "08:15" : "15:00"}:00-03:00`,
  duration_minutes: 60, price_cents: 5000, status: statuses[index % 5], source: "ADMIN", customer_notes: null, internal_notes: null, cancellation_reason: null,
  customer: { id: index + 1, name: `Cliente ${index + 1}`, available: true, status: "ACTIVE" },
  staff_member: { id: index === 105 ? 999 : index % 3 + 1, name: index === 105 ? "Profesional histórico eliminado" : `Profesional ${index % 3 + 1}`, available: true, status: index === 105 ? "INACTIVE" : "ACTIVE", deleted_at: index === 105 ? "2026-10-19T10:00:00-03:00" : null },
  service_offering: { id: 1, name: "Corte y cuidado", available: true, status: "INACTIVE" },
}));
function filterTrigger(page: Page) { return page.getByRole("button",{name:page.viewportSize()!.width<768 ? /^Estado/ : /^Profesional:/}); }
function list(page: Page) { return page.getByTestId(page.viewportSize()!.width < 768 ? "mobile-agenda-list" : "desktop-agenda-board"); }
async function session(page: Page, expired = false) {
  await page.route("**/api/backend/api/v1/auth/me", route => route.fulfill({ status: expired ? 401 : 200, json: expired ? { code: "UNAUTHORIZED" } : {
    business: { id: 10, name: "Barber Studio", onboarding_status: "READY", slug: "barber-studio" },
    user: { avatar_url: null, email: "owner@example.com", id: 1, name: "Owner", role: "OWNER" },
  } }));
}
test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-10-21T01:00:00Z") });
  await session(page);
  await page.route("**/api/backend/api/v1/business-hours",route=>route.fulfill({json:{data:["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"].map((day,index)=>({id:index+1,day_of_week:day,is_closed:false,opens_at:"09:00",closes_at:"18:00"}))}}));
  await page.route("**/api/backend/api/v1/booking-settings", route => route.fulfill({ json: { slot_interval_minutes: 30 } }));
  await page.route("**/api/backend/api/v1/business", route => route.fulfill({ json: { id: 10, name: "Barber Studio", timezone: "America/Argentina/Buenos_Aires" } }));
  await page.route("**/api/backend/api/v1/staff-members?*", route => {
    const params = new URL(route.request().url()).searchParams; const number = Number(params.get("page"));
    const all = Array.from({ length: 102 }, (_, i) => ({ id: i + 1, name: `Profesional ${i + 1}`, status: i > 2 ? "INACTIVE" : "ACTIVE" }));
    return route.fulfill({ json: { data: all.slice(number * 100, (number + 1) * 100), page: { number, size: 100, total_elements: 102, total_pages: 2 } } });
  });
  await page.route("**/api/backend/api/v1/appointments?*", route => {
    const params = new URL(route.request().url()).searchParams; const number = Number(params.get("page"));
    const data = params.get("date") === "2026-10-20" ? appointments.filter(a => (!params.has("status") || a.status === params.get("status")) && (!params.has("staff_member_id") || String(a.staff_member_id) === params.get("staff_member_id"))) : [];
    return route.fulfill({ json: { data: data.slice(number * 100, (number + 1) * 100), page: { number, size: 100, total_elements: data.length, total_pages: Math.ceil(data.length / 100) } } });
  });
});
test("loads every page, all statuses, overlapping slots and historical professionals", async ({ page }, info) => {
  await page.goto("/agenda"); const results = list(page);
  await expect(results.getByTestId("agenda-appointment")).toHaveCount(106);
  for (const label of ["Pendiente", "Confirmado", "Cancelado", "Completado", "Ausente"]) await expect(results.getByText(label, { exact: true }).first()).toBeVisible();
  await expect(results.getByText("Cliente 1", { exact: true })).toBeVisible();
  await expect(results.getByText("Cliente 2", { exact: true })).toBeVisible();
  await expect(results.getByText("(+1 día)", { exact: false }).first()).toHaveText(/23:30.*00:30.*\(\+1 día\)/);
  await expect(page.getByRole("button", { name: "Nuevo turno" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Semana", exact: true })).toHaveCount(0);
  await expectAdminViewport(page);
  await page.screenshot({ path: info.outputPath("agenda-real.png"), fullPage: false });
});
test("applies desktop filters immediately, keeps mobile drafts and searches the full catalog", async ({ page }) => {
  if(page.viewportSize()!.width<768){
    await page.goto("/agenda?date=2026-10-20");await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(106);
    await filterTrigger(page).click();const dialog=page.getByRole("dialog");
    await dialog.getByRole("radio",{name:"Pendiente",exact:true}).check();await dialog.getByRole("button",{name:"Cerrar filtros"}).click();
    await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(106);
    await page.getByRole("button",{name:"Buscar profesional",exact:true}).click();
    await dialog.getByRole("searchbox",{name:"Buscar profesional"}).fill("102");
    await expect(dialog.getByRole("radio",{name:/Profesional 102/})).toBeVisible();
    await dialog.getByRole("searchbox",{name:"Buscar profesional"}).fill("histórico");
    await dialog.getByRole("radio",{name:/Profesional histórico eliminado/}).click();
    await expect(page).toHaveURL(/staff=999/);await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(1);
    await page.getByTestId("agenda-professionals").getByRole("radio",{name:"Todos",exact:true}).click();
    await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(106);
    await filterTrigger(page).click();await dialog.getByRole("radio",{name:"Ausente",exact:true}).check();await dialog.getByRole("button",{name:"Aplicar filtros"}).click();
    await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(21);
    await page.getByRole("button",{name:"Día siguiente"}).click();await expect(page).toHaveURL(/date=2026-10-21.*status=NO_SHOW/);
    await expect(page.getByText("No hay coincidencias",{exact:true})).toBeVisible();
    await page.getByRole("button",{name:"Ir a hoy",exact:true}).click();
    await expect(page.getByLabel("Fecha",{exact:true})).toHaveValue("2026-10-20");
    await filterTrigger(page).click();await dialog.getByRole("button",{name:"Limpiar",exact:true}).click();await dialog.getByRole("button",{name:"Aplicar filtros"}).click();
    await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(106);return;
  }

  await page.goto("/agenda?date=2026-10-20"); await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(106);
  await filterTrigger(page).click();const dialog=page.getByRole("dialog",{name:"Elegir profesional"});
  await dialog.getByRole("searchbox",{name:"Buscar profesional"}).fill("102");
  await expect(dialog.getByRole("radio",{name:"Profesional 102 · Inactivo",exact:true})).toBeVisible();
  await page.keyboard.press("Escape");await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(106);
  await filterTrigger(page).click();await dialog.getByRole("searchbox",{name:"Buscar profesional"}).fill("histórico");
  await dialog.getByRole("radio",{name:"Profesional histórico eliminado · Eliminado",exact:true}).click();
  await expect(dialog).toHaveCount(0);await expect(page).toHaveURL(/staff=999/);await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(1);
  await page.getByRole("button",{name:"Quitar filtro de profesional"}).click();await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(106);
  await page.getByRole("combobox",{name:"Estado",exact:true}).selectOption("NO_SHOW");
  await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(21);
  await page.getByRole("button",{name:"Día siguiente"}).click();await expect(page).toHaveURL(/date=2026-10-21.*status=NO_SHOW/);
  await expect(page.getByText("No hay coincidencias",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:/^(Ir a hoy|Hoy)$/}).click();await expect(page.getByLabel("Fecha",{exact:true})).toHaveValue("2026-10-20");
  await page.getByRole("button",{name:"Limpiar filtros",exact:true}).click();await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(106);
});
test("navigates month/year boundaries, uses date picker and preserves empty state shell", async ({ page }, info) => {
  await page.goto("/agenda?date=2026-12-31");
  const today=page.getByRole("button",{name: /^(Ir a hoy|Hoy)$/});
  await expect(today).not.toHaveAttribute("aria-current");
  await expect(page.getByText("No hay turnos este día", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Día siguiente" }).click(); await expect(page.getByLabel("Fecha", { exact: true })).toHaveValue("2027-01-01");
  await page.getByRole("button", { name: "Día anterior" }).click(); await expect(page.getByLabel("Fecha", { exact: true })).toHaveValue("2026-12-31");
  await page.getByLabel("Fecha", { exact: true }).fill("2026-11-01"); await expect(page).toHaveURL(/date=2026-11-01/);
  await expect(page.getByRole("heading", { name: "Agenda", exact: true })).toBeVisible();
  await today.click();await expect(page.getByLabel("Fecha",{exact:true})).toHaveValue("2026-10-20");
  await expect(today).toHaveAttribute("aria-current","date");await expect(today).toBeEnabled();
  await expect(today).toHaveClass(/bg-primary-fixed/);await expect(today).toHaveClass(/text-primary/);
  await page.getByRole("button",{name:"Día siguiente"}).click();await expect(today).not.toHaveAttribute("aria-current");
  await expect(today).toHaveClass(/border-outline/);
  await page.getByLabel("Fecha",{exact:true}).fill("2026-10-20");await expect(today).toHaveAttribute("aria-current","date");
  await page.screenshot({path:info.outputPath("agenda-today-selected.png"),fullPage:false});
  await expectAdminViewport(page);
});
test("hides partial results on intermediate failure and retries the whole day", async ({ page }) => {
  let fail = true;
  await page.route("**/api/backend/api/v1/appointments?*", async route => {
    const number = Number(new URL(route.request().url()).searchParams.get("page"));
    if (number === 1 && fail) return route.fulfill({ status: 503, json: { message: "Unavailable" } });
    return route.fallback();
  });
  await page.goto("/agenda"); await expect(page.getByText("No pudimos cargar la agenda completa.", { exact: false })).toBeVisible();
  await expect(list(page)).toHaveCount(0); fail = false;
  await page.getByRole("button", { name: "Reintentar agenda" }).click(); await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(106);
});
test("shows loading and ignores late responses from an older date", async ({ page }) => {
  let release!: () => void; const delayed = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/backend/api/v1/appointments?*", async route => {
    if (new URL(route.request().url()).searchParams.get("date") === "2026-10-19") await delayed;
    await route.fallback();
  });
  await page.goto("/agenda?date=2026-10-19"); await expect(page.getByRole("status", { name: "Cargando agenda completa" })).toBeVisible();
  await page.getByRole("button", { name: "Día siguiente" }).click();
  await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(106); release();
  await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(106);
});
test("retains agenda when the staff selector fails and offers retry", async ({ page }) => {
  let fail = true;
  await page.route("**/api/backend/api/v1/staff-members?*", route => fail ? route.fulfill({ status: 503, json: {} }) : route.fallback());
  await page.goto("/agenda"); await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(106);
  await expect(page.getByRole("button", { name: "Reintentar selector" })).toBeVisible(); fail = false;
  await page.getByRole("button", { name: "Reintentar selector" }).click(); await expect(page.getByRole("button", { name: "Reintentar selector" })).toHaveCount(0);
});
test("403 preserves the valid session and shell", async ({ page }) => {
  await page.route("**/api/backend/api/v1/appointments?*", route => route.fulfill({ status: 403, json: { code: "FORBIDDEN" } }));
  await page.goto("/agenda"); await expect(page.getByText("No tenés acceso a la agenda.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Agenda", exact: true })).toBeVisible(); await expect(page).toHaveURL(/agenda/);
});
test("401 recovers the session through auth me and redirects when expired", async ({ page }) => {
  await page.route("**/api/backend/api/v1/appointments?*", async route => { await session(page, true); await route.fulfill({ status: 401, json: { code: "UNAUTHORIZED" } }); });
  await page.goto("/agenda"); await expect(page).toHaveURL(/login/);
});
test("keyboard filters and accessibility", async ({ page }) => {
  await page.goto("/agenda?date=2026-10-21"); await expect(page.getByText("No hay turnos este día", { exact: true })).toBeVisible();
  await filterTrigger(page).focus(); await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible(); await page.keyboard.press("Escape");
  await expect(filterTrigger(page)).toBeFocused();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze(); expect(results.violations).toEqual([]);
});

test("contains wide grids, wraps long names and keeps the last mobile card above navigation", async ({ page }, info) => {
  const longName = "Profesional con nombre y apellido muy extensos ".repeat(3);
  await page.route("**/api/backend/api/v1/appointments?*", route => {
    const data = appointments.slice(0, 8).map((a, i) => ({ ...a, staff_member_id: i + 1000, customer: { ...a.customer, name: "Cliente con un nombre muy extenso ".repeat(4) }, staff_member: { ...a.staff_member, id: i + 1000, name: `${longName} ${i}` } }));
    return route.fulfill({ json: { data, page: { number: 0, size: 100, total_elements: 8, total_pages: 1 } } });
  });
  await page.goto("/agenda"); const results = list(page);
  await expect(results.getByTestId("agenda-appointment")).toHaveCount(8);
  await expectAdminViewport(page);
  if (page.viewportSize()!.width >= 768) {
    expect(await results.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
    const axis=results.getByTestId("agenda-time-axis"); const axisX=(await axis.boundingBox())!.x;
    await results.evaluate(element=>{element.scrollLeft=300;});
    expect(await results.evaluate(element=>element.scrollLeft)).toBeGreaterThan(0);
    expect((await axis.boundingBox())!.x).toBeCloseTo(axisX,0);
  } else {
    const last = results.getByTestId("agenda-appointment").last(); await last.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const card = (await last.boundingBox())!;
    const nav = (await page.getByRole("navigation", { name: "Navegación principal" }).boundingBox())!;
    expect(card.y + card.height).toBeLessThanOrEqual(nav.y);
  }
  await page.screenshot({ path: info.outputPath("agenda-long-names.png"), fullPage: false });
});

test("uses a proportional timeline, stable columns, historical badges and a live now marker", async ({ page }, info) => {
  const data = [
    { ...appointments[0], id: 800, starts_at:"2026-10-20T09:00:00-03:00",ends_at:"2026-10-20T10:00:00-03:00",staff_member_id:8,staff_member:{...appointments[0].staff_member,id:8,name:"Zoe",status:"INACTIVE",deleted_at:null}},
    { ...appointments[1], id: 801, starts_at:"2026-10-20T09:00:00-03:00",ends_at:"2026-10-20T09:30:00-03:00",staff_member_id:9,staff_member:{...appointments[1].staff_member,id:9,name:"Ana",status:"ACTIVE",deleted_at:null}},
    { ...appointments[2], id: 802, starts_at:"2026-10-20T09:30:00-03:00",ends_at:"2026-10-20T10:00:00-03:00",staff_member_id:9,staff_member:{...appointments[2].staff_member,id:9,name:"Ana",status:"ACTIVE",deleted_at:null}},
    { ...appointments[3], id: 803, starts_at:"2026-10-20T16:00:00-03:00",ends_at:"2026-10-20T16:30:00-03:00",staff_member_id:10,staff_member:{...appointments[3].staff_member,id:10,name:"Lucas",status:"INACTIVE",deleted_at:"2026-10-19T12:00:00-03:00"}},
  ];
  await page.clock.setFixedTime(new Date("2026-10-20T12:15:00Z"));
  await page.route("**/api/backend/api/v1/appointments?*", route => route.fulfill({ json: { data, page:{number:0,size:100,total_elements:4,total_pages:1} } }));
  await page.goto("/agenda"); await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(4);
  await expect(page.getByRole("heading", {name:/martes, 20 de octubre de 2026/i})).toBeVisible();
  await expect(list(page).getByText("Inactivo",{exact:true})).toBeVisible(); await expect(list(page).getByText("Eliminado",{exact:true})).toBeVisible();
  if(page.viewportSize()!.width>=768) {
    const board=list(page);
    await expect(board.getByTestId("agenda-professional-header")).toHaveText(["Ana","LucasEliminado","ZoeInactivo"]);
    const hour=board.locator('[data-testid="agenda-positioned-appointment"]').filter({has:page.locator('[data-appointment-id="800"]')});
    const half=board.locator('[data-testid="agenda-positioned-appointment"]').filter({has:page.locator('[data-appointment-id="801"]')});
    expect((await hour.boundingBox())!.height).toBeCloseTo((await half.boundingBox())!.height*2,0);
    expect((await hour.boundingBox())!.y).toBeCloseTo((await half.boundingBox())!.y,0);
    await expect(board.locator('[data-appointment-id="800"]').getByText("Zoe",{exact:true})).toHaveCount(0);
    const header=board.getByTestId("agenda-professional-headers"); const before=(await header.boundingBox())!.y;
    await board.evaluate(element => {element.scrollTop=120;element.scrollLeft=120;});
    expect(await board.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);
    expect((await header.boundingBox())!.y).toBeCloseTo(before,0);
    expect(await board.getByTestId("agenda-time-axis").evaluate(element=>getComputedStyle(element).position)).toBe("sticky");
    await expect(board.getByTestId("agenda-now-line")).toHaveAttribute("aria-label","Hora actual 09:15");
  } else await expect(list(page).getByRole("note",{name:"Hora actual 09:15"})).toBeVisible();
  if(page.viewportSize()!.width>=768) await list(page).evaluate(element=>{element.scrollTop=0;element.scrollLeft=0;});
  await page.screenshot({path:info.outputPath("agenda-timeline.png"),fullPage:false});
  const results=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa"]).analyze();expect(results.violations).toEqual([]);
  await page.clock.setFixedTime(new Date("2026-10-20T12:16:00Z"));
  await page.clock.runFor(1000);
  await expect(list(page).getByRole("note",{name:"Hora actual 09:16"})).toHaveCount(1);
  await page.getByRole("button",{name:"Día siguiente"}).click();
  await expect(list(page).getByRole("note",{name:/Hora actual/})).toHaveCount(0);
});

for (const interval of [15,30,45,60]) {
  test(`renders the configured ${interval} minute interval without snapping appointments`, async ({page},info) => {
    await page.route("**/api/backend/api/v1/booking-settings",route=>route.fulfill({json:{slot_interval_minutes:interval}}));
    const data=[
      {...appointments[0],id:901,starts_at:"2026-10-20T09:10:00-03:00",ends_at:"2026-10-20T09:40:00-03:00"},
      {...appointments[0],id:902,starts_at:"2026-10-20T09:45:00-03:00",ends_at:"2026-10-20T10:45:00-03:00"},
    ];
    await page.route("**/api/backend/api/v1/appointments?*",route=>route.fulfill({json:{data,page:{number:0,size:100,total_elements:2,total_pages:1}}}));
    await page.goto("/agenda"); await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(2);
    const axis=page.getByTestId("agenda-time-axis"); await expect(axis).toHaveAttribute("data-slot-interval",String(interval));
    const ticks=axis.getByTestId("agenda-time-tick"); await expect(ticks.first()).toHaveText({15:"08:45",30:"08:30",45:"08:15",60:"08:00"}[interval]!);
    await expect(ticks.nth(1)).toHaveText({15:"09:00",30:"09:00",45:"09:00",60:"09:00"}[interval]!);
    await expect(list(page).getByText("09:10 – 09:40")).toBeVisible();
    if(page.viewportSize()!.width>=768) {
      const first=page.getByTestId("agenda-positioned-appointment").filter({has:page.locator('[data-appointment-id="901"]')});
      const second=page.getByTestId("agenda-positioned-appointment").filter({has:page.locator('[data-appointment-id="902"]')});
      const firstBox=(await first.boundingBox())!;const secondBox=(await second.boundingBox())!;
      expect(firstBox.height).toBeCloseTo(120,0);expect(secondBox.height).toBeCloseTo(240,0);
      expect(firstBox.y-(await ticks.first().boundingBox())!.y).toBeCloseTo((interval+10)*4,0);
      expect(secondBox.y-firstBox.y).toBeCloseTo(140,0);
    }
    await expectAdminViewport(page); await page.screenshot({path:info.outputPath(`agenda-slot-${interval}.png`),fullPage:false});
  });
}

test("waits for the configured interval instead of displaying a provisional grid",async ({page})=>{
  let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve;});
  await page.route("**/api/backend/api/v1/booking-settings",async route=>{await pending;await route.fulfill({json:{slot_interval_minutes:45}});});
  await page.goto("/agenda");await expect(page.getByRole("status",{name:"Cargando agenda completa"})).toBeVisible();
  await expect(list(page)).toHaveCount(0);release();
  await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(106);
  await expect(page.getByTestId("agenda-time-axis")).toHaveAttribute("data-slot-interval","45");
});

for(const invalid of [false,true]) {
  test(`retries ${invalid?"an invalid":"a failed"} interval read without falling back to 30`,async ({page})=>{
    let fail=true;
    await page.route("**/api/backend/api/v1/booking-settings",route=>fail?route.fulfill({status:invalid?200:503,json:invalid?{slot_interval_minutes:0}: {message:"Unavailable"}}):route.fulfill({json:{slot_interval_minutes:15}}));
    await page.goto("/agenda");await expect(page.getByText("No pudimos cargar el intervalo de agenda.",{exact:false})).toBeVisible();
    await expect(list(page)).toHaveCount(0);fail=false;
    await page.getByRole("button",{name:"Reintentar intervalo"}).click();
    await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(106);
    await expect(page.getByTestId("agenda-time-axis")).toHaveAttribute("data-slot-interval","15");
  });
}

test("interval permission errors preserve the shell and valid session",async ({page})=>{
  await page.route("**/api/backend/api/v1/booking-settings",route=>route.fulfill({status:403,json:{code:"FORBIDDEN"}}));
  await page.goto("/agenda");await expect(page.getByText("No tenés acceso a la agenda.")).toBeVisible();
  await expect(page.getByRole("heading",{name:"Agenda",exact:true})).toBeVisible();await expect(page).toHaveURL(/agenda/);
});

test("changing the admin interval updates the agenda on return without a full reload",async ({page})=>{
  let interval=30;let reads=0;
  const settings=()=>({slot_interval_minutes:interval,public_booking_enabled:true,requires_customer_login:false,
    booking_window_days:30,min_notice_hours:0,cancellation_notice_hours:0,manual_confirmation_enabled:true,
    whatsapp_reminders_enabled:false,created_at:"2026-10-20T12:00:00Z",updated_at:"2026-10-20T12:00:00Z"});
  await page.route("**/api/backend/api/v1/booking-settings",async route=>{
    if(route.request().method()==="PATCH") interval=route.request().postDataJSON().slot_interval_minutes;
    else reads++;
    await route.fulfill({json:settings()});
  });
  await page.goto("/agenda");await expect(page.getByTestId("agenda-time-axis")).toHaveAttribute("data-slot-interval","30");
  if(page.viewportSize()!.width<768) {
    await page.getByRole("link",{name:"Más",exact:true}).click();
    await page.getByRole("link",{name:"Configuración Ajustá los datos y reglas del negocio."}).click();
  } else await page.getByRole("link",{name:"Configuración",exact:true}).click();
  await page.getByRole("link",{name:"Configurar reglas de reserva"}).click();
  await page.getByLabel("Intervalo de agenda",{exact:true}).selectOption("45");
  await page.getByRole("button",{name:"Guardar cambios",exact:true}).click();
  await expect(page.getByRole("button",{name:"Guardar cambios",exact:true})).toBeDisabled();
  await expect(page.getByText("Las reglas de reserva están actualizadas.")).toBeVisible();
  await page.getByRole("link",{name:"Agenda",exact:true}).click();
  await expect(page.getByTestId("agenda-time-axis")).toHaveAttribute("data-slot-interval","45");
  await expect.poll(()=>reads).toBeGreaterThanOrEqual(3);
  await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(106);
});

test("shows one configured slot of gray context on each side and uses the selected weekday schedule",async({page},info)=>{
  await page.clock.setFixedTime(new Date("2026-10-20T12:15:00Z"));
  await page.route("**/api/backend/api/v1/business-hours",route=>route.fulfill({json:{data:["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"].map((day,index)=>({id:index+1,day_of_week:day,is_closed:day==="WEDNESDAY",opens_at:day==="WEDNESDAY"?null:"09:00",closes_at:day==="WEDNESDAY"?null:"18:00"}))}}));
  await page.route("**/api/backend/api/v1/appointments?*",route=>{
    const date=new URL(route.request().url()).searchParams.get("date");
    const data=[{...appointments[0],starts_at:`${date}T09:00:00-03:00`,ends_at:`${date}T09:30:00-03:00`}];
    return route.fulfill({json:{data,page:{number:0,size:100,total_elements:1,total_pages:1}}});
  });
  await page.goto("/agenda");await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(1);
  await expect(page.getByTestId("agenda-business-hours")).toContainText("09:00–18:00");
  const ticks=page.getByTestId("agenda-time-tick");await expect(ticks.first()).toHaveText("08:30");await expect(ticks.last()).toHaveText("18:30");
  const bands=page.getByTestId("agenda-outside-hours");await expect(bands).toHaveCount(2);
  await expect(bands.first()).toHaveAttribute("data-start-minute","510");await expect(bands.first()).toHaveAttribute("data-end-minute","540");
  await expect(bands.last()).toHaveAttribute("data-start-minute","1080");await expect(bands.last()).toHaveAttribute("data-end-minute","1110");
  if(page.viewportSize()!.width>=768) {
    const board=list(page);const headers=board.getByTestId("agenda-professional-headers");
    await expect.poll(()=>board.evaluate(element=>element.scrollTop)).toBe(120);
    const opening=ticks.filter({hasText:"09:00"});
    expect((await opening.boundingBox())!.y).toBeCloseTo((await headers.boundingBox())!.y+(await headers.boundingBox())!.height,0);
    expect((await bands.first().boundingBox())!.y+(await bands.first().boundingBox())!.height).toBeLessThanOrEqual((await headers.boundingBox())!.y+(await headers.boundingBox())!.height);
    await page.screenshot({path:info.outputPath("agenda-opening.png"),fullPage:false});
    await board.evaluate(element=>{element.scrollTop=0;});
    await expect(bands.first()).toBeInViewport();
    // A clock update must not reset a user's scroll position.
    await page.clock.setFixedTime(new Date("2026-10-20T12:16:00Z"));await page.clock.runFor(1000);
    await expect.poll(()=>board.evaluate(element=>element.scrollTop)).toBe(0);
  }
  await expectAdminViewport(page);await page.screenshot({path:info.outputPath("agenda-hours-context.png"),fullPage:false});
  if(page.viewportSize()!.width>=768){
    const board=list(page);await board.scrollIntoViewIfNeeded();await board.evaluate(element=>{element.scrollTop=element.scrollHeight;});
    await expect(bands.last()).toBeInViewport();await expect(board.getByTestId("agenda-professional-headers")).toBeInViewport();
    // The label at the terminal boundary belongs to the gray context too.
    expect(await bands.last().evaluate(element => (element as HTMLElement).offsetTop + (element as HTMLElement).offsetHeight)).toBe(await board.getByTestId("agenda-professional-column").first().evaluate(element => element.clientHeight));
    const axis=board.getByTestId("agenda-time-axis");
    expect(await axis.locator('[aria-hidden="true"]').last().evaluate(element=>(element as HTMLElement).offsetTop+(element as HTMLElement).offsetHeight)).toBe(await axis.evaluate(element=>element.clientHeight));
    await page.screenshot({path:info.outputPath("agenda-hours-bottom.png"),fullPage:false});
  }
  await page.getByRole("button",{name:"Día siguiente"}).click();
  await expect(page.getByTestId("agenda-business-hours")).toContainText("Negocio cerrado en esta fecha");
  await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(1);
  await expect(page.getByTestId("agenda-outside-hours")).toHaveCount(1);
  if(page.viewportSize()!.width>=768) expect(await list(page).evaluate(element=>element.scrollTop)).toBe(0);
});

test("retries failed hours without rendering a guessed opening window",async({page})=>{
  let fail=true;
  await page.route("**/api/backend/api/v1/business-hours",route=>fail?route.fulfill({status:503,json:{}}):route.fallback());
  await page.goto("/agenda");await expect(page.getByText("No pudimos cargar los horarios del negocio.",{exact:false})).toBeVisible();
  await expect(list(page)).toHaveCount(0);fail=false;await page.getByRole("button",{name:"Reintentar horarios"}).click();
  await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(106);
});

test("explains an empty closed date",async({page})=>{
  await page.route("**/api/backend/api/v1/business-hours",route=>route.fulfill({json:{data:["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"].map((day,index)=>({id:index+1,day_of_week:day,is_closed:true,opens_at:null,closes_at:null}))}}));
  await page.goto("/agenda?date=2026-10-21");await expect(page.getByText("El negocio está cerrado en esta fecha.")).toBeVisible();
  await expect(page.getByRole("heading",{name:"Agenda",exact:true})).toBeVisible();
});

test("saved business hours update the agenda when returning from settings",async({page})=>{
  let opening="09:00";
  await page.clock.setFixedTime(new Date("2026-10-20T12:15:00Z"));
  await page.route("**/api/backend/api/v1/business-hours",async route=>{
    if(route.request().method()==="PUT") opening=route.request().postDataJSON().hours.find((day:{day_of_week:string})=>day.day_of_week==="TUESDAY").opens_at;
    await route.fulfill({json:{data:["MONDAY","TUESDAY","WEDNESDAY","THURSDAY","FRIDAY","SATURDAY","SUNDAY"].map((day,index)=>({id:index+1,day_of_week:day,is_closed:false,opens_at:day==="TUESDAY"?opening:"09:00",closes_at:"18:00"}))}});
  });
  await page.goto("/agenda");await expect(page.getByTestId("agenda-business-hours")).toContainText("09:00–18:00");
  if(page.viewportSize()!.width<768){
    await page.getByRole("link",{name:"Más",exact:true}).click();
    await page.getByRole("link",{name:"Configuración Ajustá los datos y reglas del negocio."}).click();
  }else await page.getByRole("link",{name:"Configuración",exact:true}).click();
  await page.locator('a[href="/configuracion/horarios"]').click();
  await page.getByLabel("Martes: apertura").fill("10:00");
  await page.getByRole("button",{name:"Guardar cambios",exact:true}).click();
  await expect(page.getByText("Los horarios del negocio están actualizados.")).toBeVisible();
  await page.getByRole("link",{name:"Agenda",exact:true}).click();
  await expect(page.getByTestId("agenda-business-hours")).toContainText("10:00–18:00");
});

test("mobile keeps compact date and filters in view and groups simultaneous appointments",async({page},info)=>{
  const data=[
    {...appointments[0],id:1001,starts_at:"2026-10-20T09:00:00-03:00",ends_at:"2026-10-20T09:30:00-03:00"},
    {...appointments[1],id:1002,starts_at:"2026-10-20T09:00:00-03:00",ends_at:"2026-10-20T10:00:00-03:00",customer:{...appointments[1].customer,name:"María de los Ángeles Fernández de la Torre"}},
    ...Array.from({length:12},(_,index)=>({...appointments[0],id:1100+index,starts_at:`2026-10-20T${String(10+index).padStart(2,"0")}:00:00-03:00`,ends_at:`2026-10-20T${String(10+index).padStart(2,"0")}:30:00-03:00`})),
  ];
  await page.route("**/api/backend/api/v1/appointments?*",route=>route.fulfill({json:{data,page:{number:0,size:100,total_elements:data.length,total_pages:1}}}));
  await page.goto("/agenda?date=2026-10-20");
  await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(14);
  if(page.viewportSize()!.width>=768){await expect(page.getByTestId("agenda-context-bar")).toHaveCSS("position","static");await expectAdminViewport(page);await page.screenshot({path:info.outputPath("agenda-desktop-regression.png"),fullPage:false});return;}
  await expect(page.getByText("Agenda del negocio",{exact:true})).toBeVisible();
  await expect(page.getByText("Agenda de hoy",{exact:true})).toHaveCount(0);
  const results=list(page),bar=page.getByTestId("agenda-context-bar");
  const groups=results.getByTestId("agenda-time-group");await expect(groups).toHaveCount(13);
  await expect(groups.first().getByTestId("agenda-appointment")).toHaveCount(2);
  expect((await results.getByTestId("agenda-appointment").first().boundingBox())!.y).toBeLessThan(370);
  await expect(results.getByText("María de los Ángeles Fernández de la Torre",{exact:true})).toBeVisible();
  await expectAdminViewport(page);await page.screenshot({path:info.outputPath("agenda-mobile-compact.png"),fullPage:false});
  await page.evaluate(()=>window.scrollTo(0,650));
  await expect(page.getByRole("button",{name: /^(Ir a hoy|Hoy)$/})).toBeInViewport();
  await expect(filterTrigger(page)).toBeInViewport();
  const header=page.locator('header').filter({hasText:"Agenda del negocio"});
  expect((await bar.boundingBox())!.y).toBeCloseTo((await header.boundingBox())!.y+(await header.boundingBox())!.height,0);
  await page.getByRole("button",{name:"Abrir menú de cuenta"}).click();
  await page.getByRole("menuitem",{name:"Cerrar sesión"}).click({trial:true});
  await page.getByRole("button",{name:"Abrir menú de cuenta"}).click();
  await filterTrigger(page).click();
  const dialog=page.getByRole("dialog");await dialog.getByRole("radio",{name:"Pendiente",exact:true}).check();
  await dialog.getByRole("button",{name:"Aplicar filtros"}).click();
  await expect(filterTrigger(page)).toBeInViewport();
  await expect(filterTrigger(page)).toHaveText(/Estado: Pendiente1/);
  expect((await bar.boundingBox())!.height).toBeLessThan(210);
  await page.screenshot({path:info.outputPath("agenda-mobile-sticky.png"),fullPage:false});
  await filterTrigger(page).click();await dialog.getByRole("button",{name:"Limpiar",exact:true}).click();await dialog.getByRole("button",{name:"Aplicar filtros"}).click();
  const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa"]).analyze();expect(axe.violations).toEqual([]);
  const last=results.getByTestId("agenda-appointment").last();await last.scrollIntoViewIfNeeded();
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  const card=(await last.boundingBox())!,nav=(await page.getByRole("navigation",{name:"Navegación principal"}).boundingBox())!;
  expect(card.y+card.height).toBeLessThanOrEqual(nav.y);
});


test("mobile professional selection is immediate, independent of state and preserved across dates",async({page},info)=>{
 if(page.viewportSize()!.width>=768)return;
 await page.goto("/agenda?date=2026-10-20");await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(106);
 const strip=page.getByTestId("agenda-professionals");
 await strip.getByRole("radio",{name:"Profesional 1",exact:true}).click();
 await expect(page).toHaveURL(/staff=1/);await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(35);
 await expect(page.getByRole("dialog")).toHaveCount(0);
 await expect(list(page).getByText("Profesional 1",{exact:true}).first()).toBeVisible();
 await filterTrigger(page).click();const dialog=page.getByRole("dialog");
 await expect(dialog.getByRole("group",{name:"Profesional",exact:true})).toHaveCount(0);
 await dialog.getByRole("radio",{name:"Confirmado",exact:true}).check();await dialog.getByRole("button",{name:"Aplicar filtros"}).click();
 await expect(page).toHaveURL(/staff=1.*status=CONFIRMED/);await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(7);
 await strip.getByRole("radio",{name:"Todos",exact:true}).click();
 await expect(page).not.toHaveURL(/staff=/);await expect(page).toHaveURL(/status=CONFIRMED/);
 await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(21);
 await expect(list(page).getByText("Profesional 1",{exact:true}).first()).toBeVisible();
 await strip.getByRole("radio",{name:/^Profesional 4 · Inactivo$/}).click();
 await expect(page.getByText("No hay coincidencias",{exact:true})).toBeVisible();
 await page.getByRole("button",{name:"Día siguiente"}).click();await expect(page).toHaveURL(/date=2026-10-21.*staff=4.*status=CONFIRMED/);
 await expect(strip.getByRole("radio",{name:/^Profesional 4 · Inactivo$/})).toBeChecked();
 await page.screenshot({path:info.outputPath("agenda-direct-empty.png"),fullPage:false});
});

test("mobile can return to the current marker without resetting professional or state",async({page},info)=>{
 if(page.viewportSize()!.width>=768)return;
 await page.emulateMedia({reducedMotion:"reduce"});
 await page.clock.setFixedTime(new Date("2026-10-20T12:15:00Z"));
 await page.goto("/agenda?date=2026-10-21&staff=1");await expect(page.getByRole("button",{name:"Ir a hoy",exact:true})).toBeVisible();
 await expect(page.getByRole("button",{name:"Ahora",exact:true})).toHaveCount(0);
 await page.getByRole("button",{name:"Ir a hoy",exact:true}).click();
 await expect(page.getByRole("button",{name:"Hoy",exact:true})).toHaveAttribute("aria-current","date");
 await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(35);
 await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
 await page.getByRole("button",{name:"Ahora",exact:true}).click();
 const marker=list(page).getByRole("note",{name:"Hora actual 09:15"});await expect(marker).toBeInViewport();await expect(marker).toBeFocused();
 expect((await marker.boundingBox())!.y).toBeGreaterThanOrEqual((await page.getByTestId("agenda-context-bar").boundingBox())!.y+(await page.getByTestId("agenda-context-bar").boundingBox())!.height);
 await expect(page).toHaveURL(/staff=1/);
 await page.screenshot({path:info.outputPath("agenda-now-shortcut.png"),fullPage:false});
});

test("professional edge fades follow overflow, scroll position and viewport changes",async({page},info)=>{
 if(page.viewportSize()!.width>=768){await page.goto("/agenda?date=2026-10-21");await expect(page.getByTestId("agenda-professionals")).toHaveCount(0);return;}
 await page.goto("/agenda?date=2026-10-20");await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(106);
 const strip=page.getByTestId("agenda-professionals"),row=strip.locator("[data-filter-options]");
 const left=strip.locator('[data-filter-fade="start"]'),right=strip.locator('[data-filter-fade="end"]');
 await expect(left).toHaveCount(0);await expect(right).toBeVisible();await expect(right).toHaveCSS("pointer-events","none");
 const position=await page.evaluate(()=>({x:window.scrollX,y:window.scrollY}));
 await row.evaluate(element=>{element.scrollLeft=(element.scrollWidth-element.clientWidth)/2;});
 await expect(left).toBeVisible();await expect(right).toBeVisible();
 await page.screenshot({path:info.outputPath("agenda-fades-middle.png"),fullPage:false});
 await row.evaluate(element=>{element.scrollLeft=element.scrollWidth;});await expect(right).toHaveCount(0);await expect(left).toBeVisible();
 await page.screenshot({path:info.outputPath("agenda-fades-end.png"),fullPage:false});
 await row.evaluate(element=>{element.scrollLeft=0;});await expect(left).toHaveCount(0);await expect(right).toBeVisible();
 expect(await page.evaluate(()=>({x:window.scrollX,y:window.scrollY}))).toEqual(position);
 await expectAdminViewport(page);
 // No overflow initially; resizing the same mounted row must recalculate the fades.
 await page.route("**/api/backend/api/v1/staff-members?*",route=>route.fulfill({json:{data:[{id:1,name:"Mateo Ruiz",status:"ACTIVE"},{id:2,name:"Lucas Fernández",status:"ACTIVE"}],page:{number:0,size:100,total_elements:2,total_pages:1}}}));
 await page.goto("/agenda?date=2026-10-21");await expect(page.getByText("No hay turnos este día",{exact:true})).toBeVisible();
 await expect(strip.getByRole("radio")).toHaveCount(3);await expect(left).toHaveCount(0);await expect(right).toHaveCount(0);
 const size=page.viewportSize()!;await page.setViewportSize({width:300,height:size.height});await expect(right).toBeVisible();
 await page.setViewportSize(size);await expect(left).toHaveCount(0);await expect(right).toHaveCount(0);
 await page.screenshot({path:info.outputPath("agenda-fades-fit.png"),fullPage:false});
});

test("professional selection is revealed after delayed catalog, search, reload and keyboard navigation",async({page},info)=>{
 if(page.viewportSize()!.width>=768)return;
 let release!:()=>void;const pending=new Promise<void>(resolve=>{release=resolve;});
 await page.route("**/api/backend/api/v1/staff-members?*",async route=>{await pending;await route.fallback();});
 await page.goto("/agenda?date=2026-10-20&staff=102");
 try{await expect(page.getByTestId("agenda-professionals").getByRole("radio",{name:/Profesional #102/})).toBeChecked();}finally{release();}
 const strip=page.getByTestId("agenda-professionals"),row=strip.locator("[data-filter-options]");
 const selected=strip.getByRole("radio",{name:/^Profesional 102 · Inactivo$/});
 const assertRevealed=async()=>{
   await expect(selected).toBeChecked();
   await expect.poll(async()=>{
     const item=(await selected.boundingBox())!,box=(await row.boundingBox())!;
     const left=await strip.locator('[data-filter-fade="start"]').count()?16:0,right=await strip.locator('[data-filter-fade="end"]').count()?16:0;
     return item.x>=box.x+left-1&&item.x+item.width<=box.x+box.width-right+1;
   }).toBe(true);
   expect(await page.evaluate(()=>window.scrollX)).toBe(0);
 };
 await assertRevealed();const y=await page.evaluate(()=>window.scrollY);
 const checkedColor=await selected.locator('..').locator('span').evaluate(element=>getComputedStyle(element).backgroundColor);
 const otherColor=await strip.getByRole("radio",{name:"Todos",exact:true}).locator('..').locator('span').evaluate(element=>getComputedStyle(element).backgroundColor);
 expect(checkedColor).not.toBe(otherColor);
 await page.reload();await assertRevealed();
 await row.evaluate(element=>{element.scrollLeft=0;});
 await page.clock.setFixedTime(new Date("2026-10-21T01:01:00Z"));await page.clock.runFor(1000);
 expect(await row.evaluate(element=>element.scrollLeft)).toBe(0);
 await strip.getByRole("radio",{name:"Todos",exact:true}).click();await expect(page).not.toHaveURL(/staff=/);
 await page.getByRole("button",{name:"Buscar profesional",exact:true}).click();
 const dialog=page.getByRole("dialog");await dialog.getByRole("searchbox",{name:"Buscar profesional"}).fill("102");
 await dialog.getByRole("radio",{name:/^Profesional 102 · Inactivo$/}).click();await assertRevealed();
 expect(await page.evaluate(()=>window.scrollY)).toBe(y);
 await selected.focus();await page.keyboard.press("ArrowLeft");await expect(page).toHaveURL(/staff=101/);
 await page.keyboard.press("ArrowRight");await expect(page).toHaveURL(/staff=102/);await assertRevealed();
 await page.screenshot({path:info.outputPath("agenda-selection-revealed.png"),fullPage:false});
 await page.getByRole("button",{name:"Día siguiente"}).click();await expect(page).toHaveURL(/date=2026-10-21.*staff=102/);await assertRevealed();
 await expectAdminViewport(page);
 const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa"]).analyze();expect(axe.violations).toEqual([]);
});

test("mobile cards show professional then service in one wrapping row for all and filtered results",async({page},info)=>{
 const longProfessional="María de los Ángeles Fernández de la Torre";
 const longService="Corte clásico con cuidado de barba y tratamiento completo";
 const rows=[
  {name:"Mateo Ruiz",customer:"Karina Díaz",service:"Corte clásico",id:1,status:"ACTIVE",deleted_at:null},
  {name:"Xavi",customer:longProfessional,service:"Barbitaa",id:2,status:"ACTIVE",deleted_at:null},
  {name:longProfessional,customer:"Olivia Suárez",service:longService,id:3,status:"INACTIVE",deleted_at:null},
  {name:"Profesional histórico",customer:"Walter Sosa",service:"Barbitaa",id:999,status:"INACTIVE",deleted_at:"2026-10-19T10:00:00-03:00"},
 ].map((member,index)=>({...appointments[index],id:index+1,staff_member_id:member.id,
  starts_at:`2026-10-20T${index<2?"09:00":index===2?"09:30":"10:00"}:00-03:00`,ends_at:`2026-10-20T${index<2?"09:30":index===2?"10:00":"10:30"}:00-03:00`,duration_minutes:30,
  customer:{...appointments[index].customer,name:member.customer},staff_member:{id:member.id,name:member.name,available:true,status:member.status,deleted_at:member.deleted_at},service_offering:{...appointments[index].service_offering,name:member.service}}));
 await page.route("**/api/backend/api/v1/staff-members?*",route=>route.fulfill({json:{data:rows.slice(0,3).map(row=>row.staff_member),page:{number:0,size:100,total_elements:3,total_pages:1}}}));
 await page.route("**/api/backend/api/v1/appointments?*",route=>{
  const staff=new URL(route.request().url()).searchParams.get("staff_member_id"),data=rows.filter(row=>!staff||String(row.staff_member_id)===staff);
  return route.fulfill({json:{data,page:{number:0,size:100,total_elements:data.length,total_pages:1}}});
 });
 await page.goto("/agenda?date=2026-10-20");
 await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(4);
 if(page.viewportSize()!.width>=768){
  await expect(list(page).getByTestId("agenda-appointment-details")).toHaveCount(0);await expect(list(page).getByText("Corte clásico",{exact:true})).toBeVisible();
  await filterTrigger(page).click();
  await expect.poll(()=>page.getByRole("dialog").getByRole("group",{name:"Profesional",exact:true}).getByRole("radio").evaluateAll(inputs=>inputs.map(input=>(input as HTMLInputElement).value))).toEqual(["","1","2","3","999"]);
  await page.keyboard.press("Escape");
  await page.screenshot({path:info.outputPath("agenda-desktop-overview.png"),fullPage:false});
  return;
 }
 await expect.poll(()=>page.getByTestId("agenda-professionals").getByRole("radio").evaluateAll(inputs=>inputs.map(input=>(input as HTMLInputElement).value))).toEqual(["","1","2","3","999"]);
 const first=list(page).getByTestId("agenda-appointment").first(),details=first.getByTestId("agenda-appointment-details");
 await expect(details).toContainText(/Mateo Ruiz.*Corte clásico/);
 const staffBox=(await details.getByText("Mateo Ruiz",{exact:true}).boundingBox())!,serviceBox=(await details.getByText("Corte clásico",{exact:true}).boundingBox())!;
 expect(staffBox.x).toBeLessThan(serviceBox.x);expect(Math.abs(staffBox.y-serviceBox.y)).toBeLessThan(2);
 await expect(page.getByRole("button",{name:/^Mostrar .* en profesionales$/})).toHaveCount(0);
 await page.screenshot({path:info.outputPath("agenda-card-metadata-all.png"),fullPage:false});
 const strip=page.getByTestId("agenda-professionals"),row=strip.locator("[data-filter-options]");
 await strip.getByRole("radio",{name:"Xavi",exact:true}).click();await expect(page).toHaveURL(/staff=2/);
 await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(1);
 await expect(list(page).getByTestId("agenda-appointment-details")).toContainText(/Xavi.*Barbitaa/);
 await expect(page.getByText("Turnos de Xavi",{exact:true})).toHaveCount(0);
 await row.evaluate(element=>{element.scrollLeft=0;});
 await page.clock.runFor(1000);expect(await row.evaluate(element=>element.scrollLeft)).toBe(0);
 await expect(strip.getByRole("radio",{name:"Xavi",exact:true})).toBeChecked();
 await expect(strip.getByRole("radio",{name:"Todos",exact:true})).not.toBeChecked();
 await expect(list(page).getByTestId("agenda-appointment-details")).toContainText("Xavi");
 await page.screenshot({path:info.outputPath("agenda-card-metadata-filtered.png"),fullPage:false});
 await strip.getByRole("radio",{name:`${longProfessional} · Inactivo`,exact:true}).click();
 const longDetails=list(page).getByTestId("agenda-appointment-details");
 await expect(longDetails).toContainText(longProfessional);await expect(longDetails).toContainText(longService);await expect(longDetails.getByText("Inactivo",{exact:true})).toBeVisible();
 expect((await longDetails.boundingBox())!.height).toBeGreaterThan(40);
 await expectAdminViewport(page);
 await page.screenshot({path:info.outputPath("agenda-card-metadata-long.png"),fullPage:false});
 await strip.getByRole("radio",{name:"Profesional histórico · Eliminado",exact:true}).click();
 await expect(list(page).getByTestId("agenda-appointment-details").getByText("Eliminado",{exact:true})).toBeVisible();
 const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa"]).analyze();expect(axe.violations).toEqual([]);
});

test("desktop compact controls leave room for the grid and preserve date and filters",async({page},info)=>{
 if(page.viewportSize()!.width<768)return;
 await page.goto("/agenda?date=2026-10-20");await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(106);
 await expect(page.getByText("Administración",{exact:true})).toHaveCount(0);
 await expect(page.getByRole("button",{name:"Filtros",exact:true})).toHaveCount(0);
 const board=page.getByTestId("desktop-agenda-board");expect((await board.boundingBox())!.y).toBeLessThan(420);
 const heading=page.getByRole("heading",{name:"Martes, 20 de octubre de 2026",exact:true}),date=page.getByLabel("Fecha",{exact:true});
 expect(Math.abs((await heading.boundingBox())!.y-(await date.boundingBox())!.y)).toBeLessThan(20);
 await expect(page.getByTestId("agenda-business-hours")).toHaveText(/Horario: 09:00–18:00.*Fuera de horario/);
 await page.getByRole("combobox",{name:"Estado",exact:true}).selectOption("CONFIRMED");
 await expect(page).toHaveURL(/status=CONFIRMED/);
 await filterTrigger(page).click();const chooser=page.getByRole("dialog",{name:"Elegir profesional"});
 await chooser.getByRole("searchbox",{name:"Buscar profesional"}).fill("Profesional 1");
 await chooser.getByRole("radio",{name:"Profesional 1",exact:true}).click();
 await expect(page).toHaveURL(/staff=1.*status=CONFIRMED/);await expect(chooser).toHaveCount(0);
 await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(7);
 await page.getByRole("button",{name:"Día siguiente"}).click();await expect(page).toHaveURL(/date=2026-10-21.*staff=1.*status=CONFIRMED/);
 await expect(filterTrigger(page)).toHaveAccessibleName("Profesional: Profesional 1");
 await expect(page.getByRole("combobox",{name:"Estado",exact:true})).toHaveValue("CONFIRMED");
 await page.getByRole("button",{name:"Día anterior"}).click();await expect(list(page).getByTestId("agenda-appointment")).toHaveCount(7);
 await page.screenshot({path:info.outputPath("agenda-desktop-compact.png"),fullPage:false});
 await expectAdminViewport(page);
});

test("desktop long card content scrolls with keyboard while time and status stay visible",async({page},info)=>{
 if(page.viewportSize()!.width<768)return;
 const row={...appointments[1],starts_at:"2026-10-20T09:00:00-03:00",ends_at:"2026-10-20T09:30:00-03:00",duration_minutes:30,customer:{...appointments[1].customer,name:"María de los Ángeles Fernández de la Torre ".repeat(5)},service_offering:{...appointments[1].service_offering,name:"Corte y cuidado completo de barba con tratamiento ".repeat(4)}};
 await page.route("**/api/backend/api/v1/appointments?*",route=>route.fulfill({json:{data:[row],page:{number:0,size:100,total_elements:1,total_pages:1}}}));
 await page.goto("/agenda?date=2026-10-20");const card=list(page).getByTestId("agenda-appointment");
 await expect(card).toHaveCount(1);
 const customer=card.getByText(row.customer.name,{exact:true});
 await expect(customer).toHaveCSS("text-overflow","ellipsis");await expect(customer).toHaveCSS("white-space","nowrap");
 expect(await customer.evaluate(element=>element.scrollWidth>element.clientWidth)).toBe(true);
 await expect(card).toHaveAccessibleName(/María de los Ángeles.*Corte y cuidado completo/);
 await page.screenshot({path:info.outputPath("agenda-desktop-customer-ellipsis.png"),fullPage:false});
 await card.focus();await page.keyboard.press("End");
 await expect.poll(()=>card.evaluate(element=>element.scrollTop)).toBeGreaterThan(0);
 const header=card.getByTestId("agenda-card-time-status");await expect(header.getByText("Confirmado",{exact:true})).toBeVisible();
 const headerBox=(await header.boundingBox())!,cardBox=(await card.boundingBox())!;
 expect(headerBox.y).toBeGreaterThanOrEqual(cardBox.y-1);expect(headerBox.y+headerBox.height).toBeLessThanOrEqual(cardBox.y+cardBox.height);
 await expect(card).toHaveAttribute("title",/María de los Ángeles.*Corte y cuidado completo/);
 await page.screenshot({path:info.outputPath("agenda-desktop-card-scroll.png"),fullPage:false});
 const axe=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa"]).analyze();expect(axe.violations).toEqual([]);
});
