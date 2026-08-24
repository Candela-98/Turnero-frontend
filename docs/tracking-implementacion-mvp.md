# Tracking de Implementacion Frontend MVP

Actualizado: 2026-07-11

## Proposito

Este documento resume el avance real del frontend MVP.

No reemplaza:

- `proximos-pasos-mvp.md`
- `decisiones-diseno-mvp.md`
- `handoff-implementacion-mvp.md`
- `stitch/progreso-stitch.md`

Sirve para saber rapidamente que ya esta listo, que sigue, que puede avanzar con mocks y que debe esperar endpoints reales del backend.

## Estado general

El frontend ya tiene una base limpia de Next.js, agenda/admin con mocks y flujo de crear turno alineados a las referencias principales de Stitch.

Todavia no hay booking cliente, gestion admin restante ni integracion real con backend.

El siguiente foco recomendado es implementar booking cliente con mocks.

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

## Pendiente

- Implementar booking cliente con mocks.
- Implementar gestion admin restante con mocks.
- Agregar integracion API progresiva cuando los endpoints backend esten completos.
- Agregar formularios, validaciones, server state y cliente HTTP cuando existan flujos que los justifiquen.

## Proximo foco recomendado

### FE 7 - Booking cliente con mocks

Implementar booking cliente mobile-first usando mocks y componentes/layouts compartidos.

Alcance inicial:

- Booking mobile single-page.
- Confirmacion post-reserva.
- Seleccion de servicio.
- Seleccion de profesional o cualquiera disponible.
- Seleccion de dia y horario.
- Datos del cliente sin login.
- Sticky inferior con resumen y CTA.

Criterio:

- Usar tokens de `app/globals.css`.
- Usar componentes de `components/ui`.
- Usar layouts de `components/layouts`.
- Usar datos de `lib/demo`.
- No depender de API real.
- No mezclar booking cliente con navegacion admin.
- No introducir cuenta cliente en MVP.

## Orden sugerido de PRs frontend chicos

| PR | Foco | Resultado esperado |
| --- | --- | --- |
| FE 0 | Tracking y docs | `tracking-implementacion-mvp.md` creado; README y roadmap apuntan al tracking sin duplicarlo. |
| FE 1 | Fundacion visual | Completado: tokens, estilos globales y base responsive inicial listos, sin pantallas MVP. |
| FE 2 | Tipos y mocks | Completado: entidades temporales, datos demo normalizados y helpers para alimentar pantallas. |
| FE 3 | Componentes base | Completado: `Button`, `IconButton`, `Badge`, `FilterPill`, `Card`, `Input`, `Select`, `Textarea`, `Avatar`, `EmptyState`, `Skeleton`, `InlineAlert`. |
| FE 4 | Layouts | Completado: `AdminShellDesktop`, `AdminMobileHeader`, `AdminMobileBottomNav`, `TaskMobileHeader`, `BookingPublicShell`. |
| FE 5 | Agenda con mocks | Completado: agenda desktop dia, agenda mobile `Todos` y agenda mobile por profesional. |
| FE 5.5 | Resiliencia base frontend | Completado: typecheck, Vitest, Playwright desktop/mobile, axe, error boundary, not-found y CI minimo. |
| FE 6 | Crear/editar turno con mocks | Completado: drawer desktop y flujo mobile full-screen, sin integracion real. |
| FE 6.5 | Correccion drift Stitch | Completado: paleta, shell, agenda diaria y crear turno realineados con referencias `layout-base`, agenda y crear-turno. |
| FE 7 | Booking cliente con mocks | Booking mobile single-page y confirmacion post-reserva. |
| FE 8 | Gestion admin con mocks | Dashboard, clientes, perfil, servicios, profesionales y configuracion. |
| FE 9 | Estados y QA visual | Empty states, loading, errores, validaciones y notificaciones mobile. |
| FE 10+ | Integracion API progresiva | Reemplazo de mocks por API real segun endpoints backend completos. |

## Dependencias concretas con backend

Fuente de verdad backend:

- Avance real: `../Turnero-api/docs/mvp/tracking-implementacion-mvp.md`.
- Contratos: `../Turnero-api/docs/mvp/api-contracts-mvp.md`.

Estado backend relevante:

- PR A1-A4 completados.
- PR 1-4 completados.
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
| Agenda diaria | Si | Cierre de PR 5 / `TURN-41`: filtros/rango, response enriquecido y reglas completas. |
| Crear turno admin | Si | PR 5 completo para contrato final de create, cliente rapido, staff-service, calculos backend y solapamiento correcto. |
| Editar turno | Si visualmente | PR 6. |
| Confirmar/cancelar turno | Si visualmente | PR 7. |
| Completar/no-show | Si visualmente | PR 7b. |
| Slots reales admin | Si con mocks visuales | PR 8 availability admin. |
| Service offerings admin | Si | Endpoints admin v1 ya disponibles para integracion progresiva. |
| Staff members admin | Si | Endpoints admin v1 ya disponibles para integracion progresiva. |
| Staff-service offerings | Si | Endpoints v1 ya disponibles para integracion progresiva. |
| Customers admin | Si | Endpoints admin v1 ya disponibles para integracion progresiva. |
| Auth Google admin | Si con estado mock | PRs 19-20. |
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

## Que debe esperar endpoints reales

- Cliente HTTP definitivo.
- Auth/session real.
- Lectura real de agenda diaria.
- Persistencia real de crear/editar turno.
- Confirmar, cancelar, completar y no-show.
- Availability calculada por backend.
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
- No asumir auth Google disponible en frontend hasta PRs 19-20.
- No asumir booking publico real hasta PRs 21-24.
- No crear reglas de negocio duplicadas en frontend si el backend debe validarlas.
- No mezclar booking cliente con admin.
- No implementar portal cliente, portal profesional, multi-business, vista mes ni analytics avanzado en MVP.
