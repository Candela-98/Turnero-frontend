# Tracking de Implementacion Frontend MVP

Actualizado: 2026-08-31

## Proposito

Este documento es la fuente única del avance operativo del frontend MVP: estado real, prioridades vigentes, dependencias y bloqueos.

No reemplaza `roadmap.md` (hitos de producto), `decisiones-diseno-mvp.md` (decisiones UX), `handoff-implementacion-mvp.md` (reglas de implementación) ni `stitch/progreso-stitch.md` (referencias visuales).

Los demás documentos deben enlazar este archivo cuando necesiten mencionar qué sigue; no deben duplicar su cola de trabajo.

## Estado general

El frontend ya tiene una base limpia de Next.js, agenda/admin con mocks y flujo de crear turno alineados a las referencias principales de Stitch.

Todavia no hay booking cliente, gestion admin restante ni integracion real con backend. La app solo renderiza la agenda mock en `/`; las rutas declaradas en la navegacion admin todavia no tienen pantallas.

El backend ya dispone de recursos admin para configuracion, servicios, profesionales, clientes y horarios. La integracion real debe empezar por una capa HTTP/adapters y por Configuracion, sin acoplar todavia agenda o crear turno a contratos de appointments que siguen incompletos.

La prioridad actual es integrar primero los recursos administrativos cuyo contrato backend ya está disponible. Booking público sigue siendo una referencia visual y queda bloqueado para integración hasta que existan sus endpoints.

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
- Implementar auth, guards y sesión cuando exista el flujo backend real.
- Implementar booking cliente real cuando estén disponibles sus endpoints públicos.

## Prioridades vigentes

Actualizar esta sección al cerrar cada PR. La prioridad y sus dependencias se registran aquí, no en el roadmap, handoff, decisiones ni documentos Stitch.

### Ahora — I1: base HTTP e integración de configuración

- Crear cliente HTTP centralizado, base URL por ambiente, credenciales/proxy o CORS y normalización del formato de error backend.
- Incorporar adapters entre DTOs `snake_case` y modelos TypeScript de UI.
- Implementar la ruta de Configuración conectada a `business`, `booking-settings` y `business-hours`.
- Cubrir carga, error, guardado y reemplazo transaccional de horarios semanales.

Condición de cierre: configuración usable contra API real, sin acoplar agenda ni el formulario de turnos a contratos incompletos.

### Siguiente — I2: catálogos administrativos reales

- Crear rutas y flujos para servicios, profesionales y clientes sobre los endpoints admin disponibles.
- Incorporar formularios, validación y server state cuando aporten valor al flujo real.
- Mantener fuera de la UI los campos relacionales o métricas que el backend aún no expone.

Condición de cierre: cada catálogo posee lectura, mutaciones soportadas por backend y estados loading/error/empty.

### Siguiente — I3: agenda y turnos con contratos confirmados

- Conectar agenda y disponibilidad sólo cuando sus respuestas, filtros y reglas estén validadas contra el contrato final.
- Integrar creación, edición y acciones de turno cuando el backend cubra cliente rápido, relación staff-service, cálculos y solapamientos.

Condición de cierre: la agenda y el flujo de turnos comparten adapters y no duplican validaciones de negocio.

### Después — I4: autenticación y navegación protegida

Implementar sesión, guards y login administrativo cuando el backend entregue los endpoints de auth y el contrato de cookie/tokens.

### Bloqueado por backend — I5: booking público

Mantener booking cliente como referencia/mock visual. Integrarlo cuando existan endpoints públicos de perfil, servicios, disponibilidad, reserva y cancelación.

## Dependencias concretas con backend

Fuente de verdad backend:

- Avance real: `../Turnero-api/docs/mvp/tracking-implementacion-mvp.md`.
- Contratos: `../Turnero-api/docs/mvp/api-contracts-mvp.md`.

Estado backend relevante:

- PR A1-A4 completados.
- PR 1-4 completados.
- PRs 8-15 implementados en codigo; Availability y parte de su contrato aun requieren validacion.
- PR 16 (`business`), PR 17 (`booking-settings`) y PR 18 (`business-hours`/TURN-55) completados y mergeados.
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
| Agenda diaria | Si | Puede hacer un piloto de solo lectura, pero la integracion final espera PR 5: filtros/rango, response enriquecido y reglas completas. |
| Crear turno admin | Si | PR 5 completo para contrato final de create, cliente rapido, staff-service, calculos backend y solapamiento correcto. |
| Editar turno | Si visualmente | Endpoint existe, pero queda sujeto a validacion del alcance MVP junto con PR 5/6. |
| Confirmar/cancelar | Si visualmente | Endpoints existen; integrar cuando la agenda real use el mismo adapter de appointments. |
| Completar/no-show | Si visualmente | Endpoints existen; integrar cuando la agenda real use el mismo adapter de appointments. |
| Slots reales admin | Si con mocks visuales | Endpoint existe, pero la respuesta actual es plana y requiere adapter/validacion contra contrato. |
| Service offerings admin | Si | Endpoints admin v1 disponibles para integracion progresiva. |
| Staff members admin | Si | CRUD, asociaciones y horarios disponibles para integracion progresiva. |
| Staff-service offerings | Si | Endpoints v1 ya disponibles para integracion progresiva. |
| Customers admin | Si | Endpoints admin v1 ya disponibles para integracion progresiva. |
| Business/configuracion | Si | Endpoints de business, booking settings y business hours disponibles; primer candidato de integracion real. |
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

- Cliente HTTP, adapters DTO/UI y configuracion CORS/proxy.
- Auth/session real.
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
- No asumir auth Google disponible en frontend hasta PRs 19-20.
- No asumir que los links de navegacion representan rutas implementadas: por ahora solo existe la agenda en `/`.
- No asumir que booking publico puede conectarse: faltan sus endpoints backend.
- No asumir booking publico real hasta PRs 21-24.
- No crear reglas de negocio duplicadas en frontend si el backend debe validarlas.
- No mezclar booking cliente con admin.
- No implementar portal cliente, portal profesional, multi-business, vista mes ni analytics avanzado en MVP.
