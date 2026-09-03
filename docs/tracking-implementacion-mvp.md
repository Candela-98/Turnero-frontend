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

En Jira, TURN-68 fue acotada a acceso e infraestructura administrativa. TURN-69 volvió a `In Progress` porque el PR frontend #1 todavía usa acceso cross-origin y el contrato backend transitorio; TURN-70 continúa en curso bajo la nueva historia de agenda TURN-84. Su conexión final sigue condicionada por TURN-90.

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
- Cerrar TURN-69 e integrar auth, guards y sesión sobre el flujo backend ya mergeado, después de resolver sus diferencias contractuales.
- Implementar booking cliente real cuando estén disponibles sus endpoints públicos.

## Prioridades vigentes

Actualizar esta sección al cerrar cada PR. La prioridad y sus dependencias se registran aquí, no en el roadmap, handoff, decisiones ni documentos Stitch.

### Ahora — I0: TURN-68, acceso e infraestructura admin

- Implementar el BFF same-origin definido en `integracion-api-mvp.md`, cliente HTTP y normalización de errores.
- Integrar Google Identity Services, login, `/auth/me` y logout.
- Crear `/login`, restauración de sesión, guards y protección de la superficie administrativa.
- Diferenciar `401` de `403` y validar el recorrido con un OWNER aprovisionado.
- Completar TURN-94 con route group, shell y navegación administrativa compartida.

Dependencia backend: TURN-88.

Condición de cierre: login, recarga, acceso protegido, navegación y logout funcionan sin exponer tokens ni la URL backend a JavaScript.

TURN-70 ya está en curso en Jira. Hasta cerrar sus dependencias backend, limitar ese trabajo a estructura de UI, estados, DTOs/adapters descartables sólo si el contrato está confirmado y pruebas con red mockeada. No acoplar la agenda al shape actual de una respuesta que todavía debe converger.

### Siguiente — I1: TURN-85 configuración y TURN-86 catálogo

- Incorporar adapters entre DTOs `snake_case` y modelos TypeScript de UI.
- Implementar Configuración mediante TURN-81/83; TURN-82 espera la protección backend de TURN-89.
- Implementar servicios, profesionales y clientes mediante TURN-76/77/80.
- Completar TURN-78 después de servicios + profesionales y TURN-79 después de profesionales.
- Cubrir carga, error, guardado y reemplazo transaccional de horarios semanales.

Condición de cierre: configuración y catálogos usan API real, adapters y server state compartidos, con mutaciones e invalidaciones verificadas.

### Siguiente — I2: TURN-84 agenda y turnos

- Cerrar primero TURN-70/73/75 sobre el contrato de lectura de TURN-90.
- Cerrar TURN-71 sobre el contrato de availability de TURN-92.
- Integrar TURN-72/74 cuando TURN-91 y TURN-92 estén resueltos.

Condición de cierre: agenda, detalle, estados, disponibilidad y escrituras comparten adapters e invalidaciones sin duplicar reglas de negocio.

### Siguiente — I3: TURN-87 dashboard operativo

- Implementar TURN-95 contra el resumen backend de TURN-93.
- Mantener foco operativo en hoy, próximos turnos, acciones rápidas y estados de primer uso.

Condición de cierre: dashboard responsive con datos reales, sin recalcular ocupación o ingresos en el navegador.

### Bloqueado por backend — I4: booking público

Mantener booking cliente como referencia/mock visual. Integrarlo cuando existan endpoints públicos de perfil, servicios, disponibilidad, reserva y cancelación.

## Orden técnico de las historias administrativas

Jira conserva descripción, criterios y estado de cada ticket. Esta tabla registra sólo precedencias técnicas; no obliga a desarrollar en serie los tickets que pueden avanzar en paralelo.

| Ola | Tickets | Precedencia y condición |
| --- | --- | --- |
| 0 — plataforma protegida | TURN-68: TURN-69, TURN-94 | TURN-88 bloquea auth. BFF, sesión y rutas compartidas son base de toda integración admin. |
| 1 — recursos independientes | TURN-85: TURN-81/83; TURN-86: TURN-76/77/80 | Pueden avanzar en paralelo después de TURN-68. |
| 2 — relaciones y horarios | TURN-86: TURN-78/79; TURN-85: TURN-82 | TURN-78 depende de TURN-76/77; TURN-79 de TURN-77; TURN-82 de TURN-89. |
| 3 — lectura operativa | TURN-84: TURN-70/73/75 | TURN-90 bloquea agenda/detalle; TURN-70 precede TURN-73 y TURN-73 precede acciones. |
| 4 — disponibilidad y escritura | TURN-84: TURN-71/72/74 | TURN-92 bloquea availability; TURN-91 bloquea alta/edición. |
| 5 — dashboard | TURN-87: TURN-95 | TURN-93 entrega el resumen; requiere navegación y detalle disponibles. |

Reglas de secuencia:

- TURN-76 y TURN-77 deben cerrar antes de TURN-78; TURN-77 antes de TURN-79.
- TURN-81 y TURN-83 pueden avanzar sin esperar TURN-82.
- TURN-70 puede seguir en curso, pero no considerarse integrado hasta cerrar su contrato backend.
- TURN-73 debe fijar el adapter compartido antes de TURN-74 y TURN-75.
- TURN-71 debe estar estable antes de cerrar TURN-72 o TURN-74.
- TURN-95 espera TURN-93, TURN-94 y TURN-73.
- Un ticket puede adelantarse visualmente con mocks sin declarar resuelta su integración real.

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
- TURN-88 a TURN-93 registran las dependencias backend detectadas durante la división de la gestión administrativa.
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
| Crear turno admin | Si | TURN-91 y TURN-92: invariantes de escritura y availability estable. |
| Editar turno | Si visualmente | TURN-91 y TURN-92; reutiliza detalle y availability con exclusión. |
| Confirmar/cancelar | Si visualmente | Endpoints existen; integrar cuando la agenda real use el mismo adapter de appointments. |
| Completar/no-show | Si visualmente | Endpoints existen; integrar cuando la agenda real use el mismo adapter de appointments. |
| Slots reales admin | Si con mocks visuales | TURN-92: respuesta diaria/rango canónica. |
| Service offerings admin | Si | Endpoints admin v1 disponibles para integracion progresiva. |
| Staff members admin | Si | CRUD, asociaciones y horarios disponibles para integracion progresiva. |
| Staff-service offerings | Si | Endpoints v1 ya disponibles para integracion progresiva. |
| Customers admin | Si | Endpoints admin v1 ya disponibles para integracion progresiva. |
| Business/configuracion | Si | Business y booking settings disponibles; TURN-89 bloquea business hours. |
| Auth Google admin | Si con estado mock | TURN-88 + TURN-69: convergencia contractual, BFF y aprovisionamiento local. |
| Dashboard | Si | TURN-93 debe exponer el resumen operativo antes de TURN-95. |
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
- No asumir auth disponible en frontend hasta que TURN-69 esté mergeado; los PRs backend 19-20 ya existen.
- No asumir que los links de navegacion representan rutas implementadas: por ahora solo existe la agenda en `/`.
- No asumir que booking publico puede conectarse: faltan sus endpoints backend.
- No asumir booking publico real hasta PRs 21-24.
- No crear reglas de negocio duplicadas en frontend si el backend debe validarlas.
- No mezclar booking cliente con admin.
- No implementar portal cliente, portal profesional, multi-business, vista mes ni analytics avanzado en MVP.
