import { expect, test, type Page } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { openStaffAction } from "./helpers/staff-actions";
import { expectAdminNotice, expectAdminViewport } from "./helpers/admin-patterns";
const session = {business:{id:10,name:"Barber Studio",onboarding_status:"COMPLETED",slug:"barber-studio"},user:{id:1,name:"Juan",email:"juan@example.com",role:"OWNER",avatar_url:null}};
const initial = Array.from({length:21},(_,index)=>({id:index+5,business_id:10,user_id:index===0?1:null,name:index===0?"Ana Pérez":`Profesional ${String(index+5).padStart(3,"0")}`,role_label:index===0?"Barbera":null,specialty:index===0?"Cortes y barba":null,avatar_url:null,status:"ACTIVE",service_count:3}));
const confirmation=(page:Page)=>page.getByRole("alertdialog");
const confirm=(page:Page,name="Desactivar")=>confirmation(page).getByRole("button",{name,exact:true});

test.describe("professional details and status",()=>{
  let members: typeof initial; let writes:number; let mode:string; let listError:boolean; let detailReads:number[]; let removed:Set<number>;
  test.beforeEach(async({page})=>{
    members=structuredClone(initial); writes=0; mode="ok"; listError=false; detailReads=[]; removed=new Set();
    await page.route("**/api/backend/api/v1/auth/me",route=>route.fulfill({json:session}));
    await page.route("**/api/backend/api/v1/staff-members?*",route=>{
      if(listError) return route.fulfill({status:503,json:{}});
      const params=new URL(route.request().url()).searchParams, q=params.get("q")?.toLowerCase()??"",status=params.get("status"),number=Number(params.get("page")??0);
      const filtered=members.filter(member=>!removed.has(member.id)&&member.name.toLowerCase().includes(q)&&(!status||member.status===status));
      return route.fulfill({json:{data:filtered.slice(number*20,(number+1)*20),page:{number,size:20,total_elements:filtered.length,total_pages:Math.ceil(filtered.length/20)}}});
    });
    await page.route("**/api/backend/api/v1/staff-members/me",route=>route.fulfill({json:{staff_member:members.find(member=>member.user_id===1&&!removed.has(member.id))??null}}));
    await page.route(/\/api\/backend\/api\/v1\/staff-members\/\d+\/catalog$/,route=>{
      writes++;
      const id=Number(route.request().url().split("/").at(-2)),member=members.find(member=>member.id===id);
      if(mode==="write-error") return route.fulfill({status:503,json:{}});
      if(!member||removed.has(id)||mode==="missing") return route.fulfill({status:404,json:{}});
      if(member.status!=="INACTIVE") return route.fulfill({status:409,json:{code:"INVALID_STATE_TRANSITION"}});
      removed.add(id); return route.fulfill({status:204});
    });
    await page.route(/\/api\/backend\/api\/v1\/staff-members\/\d+$/,route=>{
      const id=Number(route.request().url().split("/").at(-1)),member=members.find(member=>member.id===id),method=route.request().method();
      if(method==="GET") {
        detailReads.push(id);
        if(!member||removed.has(id)||mode==="missing") return route.fulfill({status:404,json:{}});
        if(mode==="read-error") return route.fulfill({status:503,json:{}});
        const {service_count: count,...detail}=member; void count;
        return route.fulfill({json:detail});
      }
      writes++;
      if(mode==="conflict") return route.fulfill({status:409,json:{code:"STAFF_HAS_FUTURE_APPOINTMENTS"}});
      if(mode==="write-error") return route.fulfill({status:503,json:{}});
      if(mode==="missing") return route.fulfill({status:404,json:{}});
      if(!member) return route.fulfill({status:404,json:{}});
      member.status=method==="DELETE"?"INACTIVE":"ACTIVE";
      if(method==="PATCH") expect(route.request().postDataJSON()).toEqual({status:"ACTIVE"});
      return method==="DELETE"?route.fulfill({status:204}):route.fulfill({json:member});
    });
  });
  test("loads a deep link and reloads with identity, accessible state and responsive layout",async({page},info)=>{
    await page.goto("/profesionales/5");
    await expect(page.getByRole("heading",{name:"Ana Pérez",exact:true})).toBeVisible();
    await expect(page.getByText("Vos",{exact:true})).toBeVisible();
    await expect(page.getByText("Rol:",{exact:true})).toBeVisible();
    await expect(page.getByRole("button",{name:"Desactivar",exact:true})).toBeInViewport();
    await expectAdminViewport(page);
    await page.screenshot({path:info.outputPath("staff-detail.png"),fullPage:false});
    expect((await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa"]).analyze()).violations).toEqual([]);
    await page.reload(); await expect(page.getByRole("heading",{name:"Ana Pérez",exact:true})).toBeVisible();
    await page.getByRole("button",{name:"Desactivar",exact:true}).click();
    await expect(confirmation(page).getByRole("button",{name:"Cancelar"})).toBeFocused();
    await page.screenshot({path:info.outputPath("staff-deactivate.png"),fullPage:false});
    expect((await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa"]).analyze()).violations).toEqual([]);
    await page.keyboard.press("Escape"); await expect(confirmation(page)).toHaveCount(0); expect(writes).toBe(0);
    await expect(page.getByRole("button",{name:"Desactivar",exact:true})).toBeFocused();
  });
  test("deactivates and reactivates the own profile while keeping its detail open",async({page},info)=>{
    await page.goto("/profesionales/5"); await page.getByRole("button",{name:"Desactivar",exact:true}).click();
    await confirm(page).click();
    await expect(page.getByText("Inactivo",{exact:true})).toBeVisible(); await expectAdminNotice(page);
    await expect(page.getByTestId("floating-alert")).toContainText("Profesional desactivado");
    await page.screenshot({path:info.outputPath("staff-deactivated-notice.png"),fullPage:false});
    await expect(page).toHaveURL(/profesionales\/5$/);
    await page.getByRole("button",{name:"Reactivar",exact:true}).click(); await confirm(page,"Reactivar").click();
    await expect(page.getByText("Activo",{exact:true})).toBeVisible();
    await expect(page.getByTestId("floating-alert")).toContainText("Profesional reactivado");
    await page.screenshot({path:info.outputPath("staff-reactivated-notice.png"),fullPage:false});
    await expect(page.getByText("Vos",{exact:true})).toBeVisible(); expect(writes).toBe(2);
  });
  test("preserves list context through detail, reload, return and browser back/forward",async({page})=>{
    await page.goto("/profesionales?status=ACTIVE&page=1");
    await openStaffAction(page,"Profesional 025","Ver detalle");
    await expect(page).toHaveURL(/profesionales\/25\?status=ACTIVE&page=1$/);
    await expect(page.getByRole("heading",{name:"Profesional 025",exact:true})).toBeVisible();
    await page.reload(); await page.getByRole("link",{name:"Volver a profesionales",exact:true}).click();
    await expect(page).toHaveURL(/profesionales\?status=ACTIVE&page=1$/);
    await expect(page.getByRole("heading",{name:"Profesional 025",exact:true})).toBeVisible();
    await page.goBack(); await expect(page.getByRole("heading",{name:"Detalle del profesional"})).toBeVisible();
    await page.goForward(); await expect(page.getByRole("heading",{name:"Profesionales",exact:true})).toBeVisible();
    await page.getByRole("searchbox").fill("Ana");
    await expect(page).toHaveURL(/q=Ana&status=ACTIVE$/);
    await openStaffAction(page,"Ana Pérez","Ver detalle");
    await page.getByRole("link",{name:"Volver a profesionales",exact:true}).click();
    await expect(page.getByRole("searchbox")).toHaveValue("Ana");
    await expect(page.getByRole("button",{name:"Quitar filtro de estado"})).toBeVisible();
  });
  test("keeps a pending search when the status filter changes",async({page})=>{
    await page.goto("/profesionales");
    await page.getByRole("searchbox").fill("Ana");
    await page.getByRole("button",{name:"Filtros",exact:true}).click();
    await page.getByRole("radio",{name:"Activos",exact:true}).check();
    await page.getByRole("button",{name:"Aplicar filtros",exact:true}).click();
    await expect(page.getByRole("searchbox")).toHaveValue("Ana");
    await expect(page).toHaveURL(/q=Ana&status=ACTIVE$/);
    await expect(page.getByRole("heading",{name:"Ana Pérez",exact:true})).toBeVisible();
  });
  test("removes a filtered last row and corrects pagination after deactivating from the list",async({page})=>{
    await page.goto("/profesionales?status=ACTIVE&page=1");
    await openStaffAction(page,"Profesional 025","Desactivar"); await confirm(page).click();
    await expect(page).toHaveURL(/profesionales\?status=ACTIVE$/);
    await expect(page.getByRole("heading",{name:"Profesional 025",exact:true})).toHaveCount(0);
    await expect(page.getByText("20 profesionales",{exact:true})).toBeVisible(); await expectAdminNotice(page);
    await expect(page.getByRole("searchbox")).toBeFocused();
    await page.goto("/profesionales?status=INACTIVE");
    await openStaffAction(page,"Profesional 025","Reactivar"); await confirm(page,"Reactivar").click();
    await expect(page.getByText("No encontramos profesionales",{exact:true})).toBeVisible(); expect(writes).toBe(2);
  });
  test("keeps conflicts and write errors open without simulating success",async({page},info)=>{
    await page.goto("/profesionales/5"); mode="conflict";
    await page.getByRole("button",{name:"Desactivar",exact:true}).click(); await confirm(page).click();
    await expect(confirmation(page).getByText(/Tiene turnos futuros pendientes o confirmados/)).toBeVisible();
    await expect(page.getByText("Activo",{exact:true})).toBeVisible(); await expect(page.getByTestId("floating-alert")).toHaveCount(0);
    await page.screenshot({path:info.outputPath("staff-conflict.png"),fullPage:false});
    await expectAdminViewport(page);
    mode="write-error"; await confirm(page).click(); await expect(confirmation(page).getByText(/Intentá nuevamente/)).toBeVisible();
    mode="ok"; await confirm(page).click(); await expect(confirmation(page)).toHaveCount(0);
    await expect(page.getByText("Inactivo",{exact:true})).toBeVisible(); expect(writes).toBe(3);
  });
  test("blocks duplicate writes and closing while the request is pending",async({page})=>{
    let release!:()=>void; const pending=new Promise<void>(resolve=>{release=resolve;});
    await page.route("**/api/backend/api/v1/staff-members/5",async route=>{if(route.request().method()!=="DELETE") return route.fallback(); await pending; return route.fallback();});
    await page.goto("/profesionales/5"); await page.getByRole("button",{name:"Desactivar",exact:true}).click();
    await confirm(page).evaluate(button=>{(button as HTMLButtonElement).click();(button as HTMLButtonElement).click();});
    await expect(confirm(page,"Desactivando…")).toBeDisabled();
    await expect(confirmation(page).getByRole("button",{name:"Cancelar"})).toBeDisabled();
    await page.keyboard.press("Escape"); await expect(confirmation(page)).toBeVisible();
    release(); await expect(confirmation(page)).toHaveCount(0); expect(writes).toBe(1);
  });
  test("retries only reads after a confirmed write and a failed refresh",async({page})=>{
    let afterWrite=false;
    await page.route("**/api/backend/api/v1/staff-members/5",async route=>{
      if(route.request().method()==="DELETE") {afterWrite=true; return route.fallback();}
      return afterWrite?route.fulfill({status:503,json:{}}):route.fallback();
    });
    await page.goto("/profesionales/5"); await page.getByRole("button",{name:"Desactivar",exact:true}).click(); await confirm(page).click();
    await expect(page.getByText("Inactivo",{exact:true})).toBeVisible();
    await expect(page.getByText(/El cambio se guardó, pero no pudimos actualizar/)).toBeVisible();
    afterWrite=false;
    await page.getByRole("button",{name:"Reintentar actualización"}).click();
    await expect(page.getByText(/El cambio se guardó, pero no pudimos actualizar/)).toHaveCount(0); expect(writes).toBe(1);
  });
  test("handles detail loading, retry, missing IDs and foreign professionals",async({page})=>{
    let release!:()=>void; const pending=new Promise<void>(resolve=>{release=resolve;});
    await page.route("**/api/backend/api/v1/staff-members/5",async route=>{await pending;return route.fallback();});
    mode="read-error"; await page.goto("/profesionales/5");
    await expect(page.getByLabel("Cargando detalle del profesional")).toBeVisible(); release();
    await expect(page.getByText(/No pudimos cargar el profesional/)).toBeVisible();
    mode="ok"; await page.getByRole("button",{name:"Reintentar carga"}).click();
    await expect(page.getByRole("heading",{name:"Ana Pérez",exact:true})).toBeVisible();
    await page.goto("/profesionales/999"); await expect(page.getByText("Profesional no encontrado",{exact:true})).toBeVisible();
    mode="missing"; await page.goto("/profesionales/5"); await expect(page.getByText("Profesional no encontrado",{exact:true})).toBeVisible();
    const reads=detailReads.length; await page.goto("/profesionales/invalid");
    await expect(page.getByText("Profesional no encontrado",{exact:true})).toBeVisible(); expect(detailReads).toHaveLength(reads);
  });
  test("explains a missing professional during confirmation and allows refreshing",async({page})=>{
    await page.goto("/profesionales/5"); await page.getByRole("button",{name:"Desactivar",exact:true}).click(); mode="missing";
    await confirm(page).click(); await expect(confirmation(page).getByText("El profesional ya no está disponible",{exact:true})).toBeVisible();
    await expect(confirmation(page).getByRole("button",{name:"Cancelar"})).toBeEnabled();
    await expect(confirm(page)).toBeDisabled();
    await confirmation(page).getByRole("button",{name:"Actualizar datos"}).click();
    await expect(page.getByText("Profesional no encontrado",{exact:true})).toBeVisible();
    await expect(page.getByRole("link",{name:"Volver al listado",exact:true})).toBeVisible(); expect(writes).toBe(1);
  });
  test("ignores a late prior detail and displays long text and optional fields safely",async({page})=>{
    let release!:()=>void; const pending=new Promise<void>(resolve=>{release=resolve;});
    await page.route("**/api/backend/api/v1/staff-members/5",async route=>{await pending;return route.fallback();});
    await page.goto("/profesionales/5"); await expect(page.getByLabel("Cargando detalle del profesional")).toBeVisible();
    members[1].name="Profesional".repeat(20);
    await page.goto("/profesionales/6"); await expect(page.getByRole("heading",{name:members[1].name,exact:true})).toBeVisible();
    release(); await expect(page.getByText("Ana Pérez",{exact:true})).toHaveCount(0);
    await expect(page.getByText("Vos",{exact:true})).toHaveCount(0); await expect(page.getByText("Rol:",{exact:true})).toHaveCount(0);
    await expectAdminViewport(page);
  });
  test("offers removal only for inactive staff, confirms and hides it in every filter",async({page},info)=>{
    await page.goto("/profesionales?q=Ana");
    await page.getByRole("button",{name:"Más acciones de Ana Pérez"}).click();
    await expect(page.getByRole("menuitem",{name:"Eliminar",exact:true})).toHaveCount(0);
    await page.keyboard.press("Escape");
    members[0].status="INACTIVE"; await page.reload();
    await openStaffAction(page,"Ana Pérez","Eliminar");
    await expect(confirmation(page).getByRole("button",{name:"Cancelar"})).toBeFocused();
    await expect(confirmation(page).getByText(/no podrás restaurarlo desde la app/)).toBeVisible();
    await page.screenshot({path:info.outputPath("staff-remove.png"),fullPage:false});
    expect((await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa"]).analyze()).violations).toEqual([]);
    await page.keyboard.press("Escape"); expect(writes).toBe(0);
    await openStaffAction(page,"Ana Pérez","Eliminar"); await confirm(page,"Eliminar").click();
    await expect(page.getByText("No encontramos profesionales",{exact:true})).toBeVisible();
    await expect(page.getByTestId("floating-alert")).toContainText("Profesional eliminado"); await expectAdminNotice(page);
    await page.goto("/profesionales?q=Ana&status=INACTIVE"); await expect(page.getByText("No encontramos profesionales",{exact:true})).toBeVisible();
    await page.goto("/profesionales/5"); await expect(page.getByText("Profesional no encontrado",{exact:true})).toBeVisible();
    await page.goto("/profesionales"); await page.getByRole("button",{name:"Nuevo profesional",exact:true}).click();
    await expect(page.getByRole("switch",{name:"Este profesional soy yo",exact:true})).toBeEnabled();
    expect(writes).toBe(1);
  });
  test("removes from detail and returns to the filtered list with success feedback",async({page})=>{
    members[0].status="INACTIVE";
    await page.goto("/profesionales/5?q=Ana&status=INACTIVE");
    await page.getByRole("button",{name:"Eliminar",exact:true}).click(); await confirm(page,"Eliminar").click();
    await expect(page).toHaveURL(/profesionales\?q=Ana&status=INACTIVE$/);
    await expect(page.getByText("No encontramos profesionales",{exact:true})).toBeVisible();
    await expect(page.getByTestId("floating-alert")).toContainText("Profesional eliminado"); expect(writes).toBe(1);
  });
  test("preserves inactive staff on removal errors, handles reactivation conflict and blocks duplicates",async({page})=>{
    members[0].status="INACTIVE"; await page.goto("/profesionales?q=Ana");
    await openStaffAction(page,"Ana Pérez","Eliminar"); mode="write-error";
    await confirm(page,"Eliminar").click(); await expect(confirmation(page).getByText(/No pudimos eliminar/)).toBeVisible();
    await expect(page.getByRole("heading",{name:"Ana Pérez",exact:true,includeHidden:true})).toHaveCount(1); expect(removed.size).toBe(0);
    mode="ok"; members[0].status="ACTIVE";
    await confirm(page,"Eliminar").click(); await expect(confirmation(page).getByText(/debe estar inactivo/)).toBeVisible();
    members[0].status="INACTIVE";
    let release!:()=>void; const pending=new Promise<void>(resolve=>{release=resolve;});
    await page.route("**/api/backend/api/v1/staff-members/5/catalog",async route=>{await pending;return route.fallback();});
    await confirm(page,"Eliminar").evaluate(button=>{(button as HTMLButtonElement).click();(button as HTMLButtonElement).click();});
    await expect(confirm(page,"Eliminando…")).toBeDisabled(); await page.keyboard.press("Escape"); await expect(confirmation(page)).toBeVisible();
    release(); await expect(confirmation(page)).toHaveCount(0); expect(writes).toBe(3);
  });
  test("corrects the final inactive page after removal",async({page})=>{
    members.forEach(member=>{member.status="INACTIVE";});
    await page.goto("/profesionales?status=INACTIVE&page=1");
    await openStaffAction(page,"Profesional 025","Eliminar"); await confirm(page,"Eliminar").click();
    await expect(page).toHaveURL(/profesionales\?status=INACTIVE$/);
    await expect(page.getByText("20 profesionales",{exact:true})).toBeVisible();
    await expect(page.getByRole("heading",{name:"Profesional 025",exact:true})).toHaveCount(0);
  });

});
