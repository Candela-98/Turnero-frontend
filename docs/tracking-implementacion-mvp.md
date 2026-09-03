# Tracking de Implementacion Frontend MVP

Actualizado: 2026-09-03

## Proposito

Este documento es la fuente única del avance operativo del frontend MVP: estado real, prioridades vigentes, dependencias y bloqueos.

No reemplaza `roadmap.md` (hitos de producto), `integracion-api-mvp.md` (arquitectura de integración), `decisiones-diseno-mvp.md` (decisiones UX), `handoff-implementacion-mvp.md` (reglas de implementación) ni `stitch/progreso-stitch.md` (referencias visuales).

Los demás documentos deben enlazar este archivo cuando necesiten mencionar qué sigue; no deben duplicar su cola de trabajo.

## Estado general

El frontend ya tiene una base limpia de Next.js, agenda/admin con mocks y flujo de crear turno alineados a las referencias principales de Stitch.

Todavia no hay booking cliente, gestion admin restante ni integracion real con backend. La app solo renderiza la agenda mock en `/`; las rutas declaradas en la navegacion admin todavia no tienen pantallas.

El backend ya dispone de auth Google/sesion y recursos admin para configuracion, servicios, profesionales, clientes y horarios. Antes de integrar pantallas debe converger su implementación de auth con el contrato canónico y corregir la protección de `business-hours`.

En Jira, TURN-68 fue acotada a acceso e infraestructura administrativa. TURN-97 separa el BFF y cliente HTTP base de TURN-69, cuyo PR frontend #1 continúa `In Progress`; TURN-70 también está en curso bajo la historia de agenda TURN-84 y su conexión final sigue condicionada por TURN-90.

La gestión administrativa quedó dividida por resultado: TURN-84 agenda/turnos, TURN-85 configuración, TURN-86 catálogo operativo y TURN-87 dashboard. Booking público continúa bloqueado hasta que existan sus endpoints.

## Listo

- Proyecto Next.js creado en `turnero-frontend`.
- App minima conservada:
  - `app/layout.tsx`
  - `app/page.tsx`
  - `app/globals.css`
- Pagina default de Next eliminada.
- Componentes generados de prueba eliminados:
  - `components/`
  - `lib/`
  - `components.json`
- MVP visual principal cerrado y aprobado en Stitch.
- IDs vigentes de pantallas documentados en `stitch/progreso-stitch.md`.
- Decisiones de producto y diseno documentadas en `decisiones-diseno-mvp.md`.
- Handoff de implementacion documentado en `handoff-implementacion-mvp.md`.
- Datos demo separados en `referencias/datos-demo.md`.
- Workflow para detectar drift de Stitch documentado en `stitch/workflow-drift-stitch.md`.
- Stack base decidido:
  - Next.js App Router.
  - React.
  - TypeScript.
  - Tailwind CSS v4 con tokens propios.
  - Componentes propios.
  - Radix primitives solo para comportamiento accesible.
  - `lucide-react` para iconos.
  - `date-fns` para fechas.
  - `zod`, React Hook Form y TanStack Query solo cuando el flujo los necesite.
- Fundacion visual inicial definida en `app/globals.css`:
  - tokens de color y superficies;
  - estados primary, secondary, tertiary y error;
  - radios, sombras y target tactil base;
  - defaults globales de tipografia, foco, seleccion, formularios y reduced motion.
- Tipos y mocks iniciales creados en `lib/demo`:
  - entidades temporales para negocio, settings, profesionales, servicios, clientes, turnos y slots;
  - datos demo alineados a `referencias/datos-demo.md`;
  - helpers puros para agenda diaria, agrupacion por profesional, slots, estados y formato.
- Componentes base compartidos creados en `components/ui`:
  - `Button`, `IconButton`, `Badge`, `FilterPill`, `Card`, `Input`, `Select`, `Textarea`, `Avatar`, `EmptyState`, `Skeleton` e `InlineAlert`;
  - variantes basadas en tokens propios;
  - sin pantallas, layouts ni integracion real.
- Layouts base creados en `components/layouts`:
  - `AdminShellDesktop`;
  - `AdminMobileHeader`;
  - `AdminMobileBottomNav`;
  - `TaskMobileHeader`;
  - `BookingPublicShell`;
  - shells separados para admin, mobile transaccional y booking publico.
- Agenda diaria con mocks implementada:
  - desktop dia usando `AdminShellDesktop`;
  - mobile `Todos` y por profesional usando header/bottom nav mobile;
  - filtros visuales por profesional y estado;
  - turnos confirmados, pendientes y slots disponibles;
  - datos consumidos desde `lib/demo`;
  - sin fetch, persistencia ni acciones reales.
- Resiliencia base frontend agregada:
  - `typecheck` con `tsc --noEmit`;
  - Vitest para helpers puros de `lib/demo`;
  - Playwright con proyectos desktop y mobile;
  - smoke tests de agenda desktop/mobile;
  - axe via `@axe-core/playwright` para accesibilidad critica;
  - `app/error.tsx` y `app/not-found.tsx`;
  - workflow CI frontend minimo;
  - artefactos Playwright ignorados en `.gitignore`.
- Crear/editar turno con mocks implementado:
  - drawer desktop;
  - pantalla mobile full-screen con `TaskMobileHeader`;
  - cliente existente o cliente rapido visual;
  - seleccion de servicio, profesional, fecha/hora y estado inicial;
  - notas cliente e internas;
  - resumen sticky con precio, duracion, profesional y horario;
  - confirmacion visual local sin persistencia real.
- Drift visual FE 6.5 corregido contra referencias locales de Stitch:
  - tokens base migrados a paleta azul operacional;
  - shell desktop ajustado a layout base;
  - agenda desktop reemplazada por grilla diaria hora x profesional;
  - rail derecho con proximo turno, carga del dia y pendientes;
  - agenda mobile convertida a timeline con horas y CTA flotante;
  - crear turno desktop/mobile convertido a seleccion visual por cards;
  - auditoria registrada en `stitch/referencias-implementacion/drift-implementacion-actual.md`.
- `npm run lint` pasa segun el estado reportado.
- `npm run typecheck` pasa segun el estado reportado.
- `npm run test` pasa segun el estado reportado.
- `npm run test:e2e` pasa segun el estado reportado; localmente requiere browsers de Playwright instalados y levantar Next fuera del sandbox si el bind del puerto esta restringido.
- `npm run build` pasa fuera del sandbox segun el estado reportado; dentro del sandbox puede fallar por restriccion de Turbopack al bindear un puerto interno.
- Se verifico que no existe todavia integracion HTTP:
  - no hay `fetch`, cliente API, URL de backend, proxy Next ni manejo de `credentials`;
  - no estan instalados ni usados TanStack Query, React Hook Form o Zod;
  - no hay rutas admin adicionales, auth, guards o sesion real.

## Pendiente

- Integrar la configuracion administrativa y los catalogos que el backend ya expone.
- Implementar las rutas/pantallas de dashboard, clientes, servicios, profesionales y configuracion.
- Cerrar contratos pendientes de agenda y appointments antes de conectarlos como fuente final.
- Implementar TURN-97 y cerrar TURN-69 sobre el BFF same-origin después de resolver TURN-88.
- Implementar booking cliente real cuando estén disponibles sus endpoints públicos.

## Cola priorizada autogestionada

Esta es la única lista ordenada de próximos PRs del frontend. Jira conserva el detalle, estado y asignación de cada ticket; el roadmap sólo conserva hitos de producto.

Convención de uso:

- `[ ]`: tarea todavía no tomada.
- `[x]`: tarea tomada. Al marcarla, pasarla a `In Progress` en Jira y agregar responsable y PR; si el PR todavía no existe, indicar `PR pendiente`.
- Cuando el PR se mergea, quitar la tarea de esta cola y registrar el resultado en `Listo`.
- Tomar la primera tarea sin marcar cuyos bloqueos estén resueltos. Dentro de una misma ola pueden avanzar varias personas en paralelo.
- Cada subtarea corresponde, en lo posible, a un PR. Si el alcance real excede el ticket, dividirlo antes de implementar.
- Los tickets backend nombrados entre paréntesis son bloqueos; su avance se consulta en Jira y en el tracking backend.

### I0 — acceso e infraestructura administrativa

- [ ] [TURN-97](https://turnero-app.atlassian.net/browse/TURN-97) — implementar BFF y cliente HTTP base.
- [x] [TURN-69](https://turnero-app.atlassian.net/browse/TURN-69) — integrar autenticación de administrador — Candela — [PR #1](https://github.com/Candela-98/Turnero-frontend/pull/1) — no cerrar hasta TURN-97 y TURN-88.
- [ ] [TURN-94](https://turnero-app.atlassian.net/browse/TURN-94) — estructurar rutas y navegación administrativa — después de TURN-69.

Condición de cierre de la ola: login, recarga, acceso protegido, navegación y logout funcionan sin exponer tokens ni la URL backend a JavaScript.

### I1 — configuración y recursos independientes

Después de I0, tomar de arriba hacia abajo; las líneas sin dependencia entre sí pueden hacerse en paralelo.

- [ ] [TURN-81](https://turnero-app.atlassian.net/browse/TURN-81) — gestionar datos del negocio.
- [ ] [TURN-83](https://turnero-app.atlassian.net/browse/TURN-83) — gestionar reglas de reserva.
- [ ] [TURN-82](https://turnero-app.atlassian.net/browse/TURN-82) — gestionar horarios del negocio — bloqueada por TURN-89.
- [ ] [TURN-76](https://turnero-app.atlassian.net/browse/TURN-76) — listar servicios.
- [ ] [TURN-96](https://turnero-app.atlassian.net/browse/TURN-96) — crear y editar servicios — después de TURN-76.
- [ ] [TURN-98](https://turnero-app.atlassian.net/browse/TURN-98) — ver detalle y desactivar servicios — después de TURN-76.
- [ ] [TURN-77](https://turnero-app.atlassian.net/browse/TURN-77) — listar profesionales.
- [ ] [TURN-99](https://turnero-app.atlassian.net/browse/TURN-99) — crear y editar profesionales — después de TURN-77.
- [ ] [TURN-101](https://turnero-app.atlassian.net/browse/TURN-101) — ver detalle y desactivar profesionales — después de TURN-77.
- [ ] [TURN-80](https://turnero-app.atlassian.net/browse/TURN-80) — listar clientes.
- [ ] [TURN-100](https://turnero-app.atlassian.net/browse/TURN-100) — crear y editar clientes — después de TURN-80.
- [ ] [TURN-102](https://turnero-app.atlassian.net/browse/TURN-102) — ver detalle y desactivar clientes — después de TURN-80.
- [ ] [TURN-78](https://turnero-app.atlassian.net/browse/TURN-78) — gestionar servicios por profesional — después de TURN-76 y TURN-77.
- [ ] [TURN-79](https://turnero-app.atlassian.net/browse/TURN-79) — gestionar horarios de profesionales — después de TURN-77.

Condición de cierre de la ola: configuración y catálogos usan API real, adapters y server state compartidos, con mutaciones e invalidaciones verificadas.

### I2 — agenda y turnos

- [x] [TURN-70](https://turnero-app.atlassian.net/browse/TURN-70) — integrar agenda con turnos reales — Candela — PR pendiente — no cerrar hasta TURN-90.
- [ ] [TURN-73](https://turnero-app.atlassian.net/browse/TURN-73) — ver detalle de un turno — después de TURN-70.
- [ ] [TURN-75](https://turnero-app.atlassian.net/browse/TURN-75) — gestionar estados — después de TURN-73.
- [ ] [TURN-71](https://turnero-app.atlassian.net/browse/TURN-71) — integrar disponibilidad real — bloqueada por TURN-92.
- [ ] [TURN-72](https://turnero-app.atlassian.net/browse/TURN-72) — crear turnos — después de TURN-71; bloqueada por TURN-105 y TURN-92.
- [ ] [TURN-74](https://turnero-app.atlassian.net/browse/TURN-74) — editar turnos — después de TURN-73 y TURN-71; bloqueada por TURN-109 y TURN-92.

TURN-70 puede adelantarse con estructura, mocks y tests de red, pero no debe acoplarse al shape transitorio del backend ni declararse integrado antes de TURN-90.

Condición de cierre de la ola: agenda, detalle, estados, disponibilidad y escrituras comparten adapters e invalidaciones sin duplicar reglas de negocio.

### I3 — dashboard operativo

- [ ] [TURN-95](https://turnero-app.atlassian.net/browse/TURN-95) — implementar dashboard base del período Hoy — después de TURN-94 y TURN-73; bloqueada por TURN-108 y TURN-107.
- [ ] [TURN-104](https://turnero-app.atlassian.net/browse/TURN-104) — agregar períodos — después de TURN-95.
- [ ] [TURN-103](https://turnero-app.atlassian.net/browse/TURN-103) — integrar secciones operativas y acciones — después de TURN-95 y de los flujos destino correspondientes.

Condición de cierre de la ola: dashboard responsive con datos reales, sin recalcular ocupación o ingresos en el navegador.

### I4 — booking público bloqueado por backend

Mantener booking cliente como referencia/mock visual. Integrarlo cuando existan endpoints públicos de perfil, servicios, disponibilidad, reserva y cancelación.

Un ticket puede adelantarse visualmente con mocks sin declarar resuelta su integración real.

## Dependencias concretas con backend

Fuente de verdad backend:

- Avance real: `../../Turnero-api/docs/mvp/tracking-implementacion-mvp.md`.
- Contratos: `../../Turnero-api/docs/mvp/api-contracts-mvp.md`.

Estado backend relevante:

- PR A1-A4 completados.
- PR 1-4 completados.
- PRs 8-15 implementados en codigo; Availability y parte de su contrato aun requieren validacion.
- PR 16 (`business`), PR 17 (`booking-settings`) y PR 18 (`business-hours`/TURN-55) completados y mergeados.
- PR 19 y PR 20 de auth/sesion/proteccion admin mergeados en PRs backend #61 y #62; pendientes de converger con el contrato canonico antes de cerrar TURN-69.
- TURN-88 a TURN-93 registran las dependencias backend detectadas durante la división de la gestión administrativa; TURN-91 se entrega mediante TURN-105/109 y TURN-93 mediante TURN-106/108/107.
- PR 5 / `TURN-41` parcial:
  - ya existe `/api/v1/appointments`;
  - creacion/listado base de appointments admin ya existe;
  - falta cerrar agenda diaria con filtros, response enriquecido y reglas completas.

Dependencias por flujo frontend:

| Flujo frontend | Puede avanzar con mocks | Para integrar real necesita |
| --- | --- | --- |
| Fundacion visual | Si | No depende de backend. |
| Componentes base | Si | No depende de backend. |
| Layouts | Si | No depende de backend. |
| Agenda diaria | Si | TURN-90: filtros/rango, timezone y response enriquecido. |
| Crear turno admin | Si | TURN-105 y TURN-92: invariantes de creación y availability estable. |
| Editar turno | Si visualmente | TURN-109 y TURN-92; reutiliza detalle y availability con exclusión. |
| Confirmar/cancelar | Si visualmente | Endpoints existen; integrar cuando la agenda real use el mismo adapter de appointments. |
| Completar/no-show | Si visualmente | Endpoints existen; integrar cuando la agenda real use el mismo adapter de appointments. |
| Slots reales admin | Si con mocks visuales | TURN-92: respuesta diaria/rango canónica. |
| Service offerings admin | Si | Endpoints admin v1 disponibles para integracion progresiva. |
| Staff members admin | Si | CRUD, asociaciones y horarios disponibles para integracion progresiva. |
| Staff-service offerings | Si | Endpoints v1 ya disponibles para integracion progresiva. |
| Customers admin | Si | Endpoints admin v1 ya disponibles para integracion progresiva. |
| Business/configuracion | Si | Business y booking settings disponibles; TURN-89 bloquea business hours. |
| Auth Google admin | Si con estado mock | TURN-97 + TURN-88 + TURN-69: BFF, convergencia contractual y aprovisionamiento local. |
| Dashboard | Si | TURN-106/108/107 deben cerrar contrato, resumen y métricas antes de TURN-95. |
| Booking publico | Si | PRs 21-24: profile, services, availability, public appointments y cancelacion. |

## Que se puede hacer con mocks

- Tokens y estilos globales.
- Componentes base compartidos.
- Shell admin desktop.
- Header y bottom nav mobile.
- Task header mobile.
- Booking public shell.
- Agenda desktop dia.
- Agenda mobile `Todos`.
- Agenda mobile por profesional.
- Crear/editar turno desktop y mobile.
- Booking cliente y confirmacion.
- Dashboard.
- Clientes y perfil.
- Servicios.
- Profesionales.
- Configuracion.
- Empty states.
- Loading states.
- Errores y validaciones visuales.
- Notificaciones mobile como referencia visual.

## Que debe esperar contratos o endpoints reales

- Auth frontend debe esperar la convergencia del wire contract backend; la sesion ya esta implementada.
- Business hours debe esperar la correccion de su proteccion admin.
- Lectura real de agenda diaria.
- Persistencia real de crear/editar turno.
- Contrato final de confirmacion, cancelacion, complete/no-show integrado en agenda.
- Contrato final de Availability calculada por backend.
- Reglas reales de staff-service.
- Reglas reales de solapamiento.
- Public booking real.
- Cancelacion publica real.
- Manejo definitivo de errores API.
- Reemplazo de tipos temporales por DTOs finales.

## Stack decidido

- Mantener Next.js App Router, React y TypeScript.
- Usar Tailwind CSS v4 con tokens propios en `app/globals.css`.
- Crear componentes propios; no usar shadcn como generador base.
- Usar Radix primitives solo cuando haga falta comportamiento accesible.
- Usar `lucide-react` para iconos.
- Usar `date-fns` para fechas y horarios.
- Usar `zod` para validacion de DTOs/formularios cuando empiece a aportar valor.
- Agregar React Hook Form y `@hookform/resolvers` al implementar formularios reales.
- Agregar TanStack Query al reemplazar mocks por server state real.

## Instrumentos de resiliencia

- `npm run lint`: reglas ESLint/Next.
- `npm run typecheck`: chequeo TypeScript sin emitir.
- `npm run test`: unit tests con Vitest.
- `npm run build`: build productivo de Next.
- `npm run test:e2e`: smoke tests con Playwright.
- `npm run check`: cadena completa local/CI.
- Playwright valida desktop `1440x900` y mobile `390x844`.
- Axe corre en smoke tests para evitar violaciones criticas de accesibilidad.
- `app/error.tsx` y `app/not-found.tsx` cubren fallos y rutas inexistentes con UI alineada al sistema.

## Criterio de validacion

Para cambios de documentacion:

- Revisar `git status --short` y `git diff -- docs`; si `docs/` sigue sin trackear, revisar los archivos directamente antes de commitear.

Para cambios futuros de codigo:

- `npm run lint`.
- `npm run typecheck`.
- `npm run test`.
- `npm run build` fuera del sandbox si Turbopack falla por restricciones internas.
- `npm run test:e2e` fuera del sandbox si Playwright necesita bindear un puerto local.
- QA visual contra los IDs vigentes de `stitch/progreso-stitch.md`.
- Validacion responsive desktop/mobile antes de cerrar pantallas.

## No asumir todavia

- No asumir que agenda diaria real esta lista hasta que PR 5 / `TURN-41` este cerrado.
- No asumir auth disponible en frontend hasta que TURN-97 y TURN-69 estén mergeados; los PRs backend 19-20 ya existen y TURN-88 debe converger su contrato.
- No asumir que los links de navegacion representan rutas implementadas: por ahora solo existe la agenda en `/`.
- No asumir que booking publico puede conectarse: faltan sus endpoints backend.
- No asumir booking publico real hasta PRs 21-24.
- No crear reglas de negocio duplicadas en frontend si el backend debe validarlas.
- No mezclar booking cliente con admin.
- No implementar portal cliente, portal profesional, multi-business, vista mes ni analytics avanzado en MVP.
