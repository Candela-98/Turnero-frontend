# Tracking de Implementacion Frontend MVP

Actualizado: 2026-10-16

## Proposito

Este documento es la fuente única del avance operativo del frontend MVP: estado real, prioridades vigentes, dependencias y bloqueos.

No reemplaza `roadmap.md` (hitos de producto), `decisiones-diseno-mvp.md` (decisiones UX), `handoff-implementacion-mvp.md` (reglas de implementación) ni `stitch/progreso-stitch.md` (referencias visuales).

Los demás documentos deben enlazar este archivo cuando necesiten mencionar qué sigue; no deben duplicar su cola de trabajo.

## Estado general

El frontend ya tiene una base limpia de Next.js, agenda/admin con mocks, flujo de crear turno alineado a Stitch y autenticación administrativa real mediante el BFF same-origin.

El listado de servicios ya consume la API real por TURN-76 (PR #9). Todavía no hay booking cliente ni integración real de agenda, clientes, profesionales o dashboard; las mutaciones de servicios quedan pendientes. La agenda en `/agenda` sigue usando mocks; TURN-94 agregó las rutas administrativas y sus estados de transición, que se reemplazarán progresivamente por pantallas funcionales. TURN-85 quedó completada: Configuración integra datos del negocio, reglas de reserva y horarios semanales contra la API real.

El backend ya dispone de auth Google/sesión convergente con el contrato canónico y de recursos admin para configuración, servicios, profesionales, clientes y horarios. La autenticación real quedó validada con la cookie HTTP-only local.

La prioridad actual es integrar primero los recursos administrativos cuyo contrato backend ya está disponible. Booking público ya dispone de perfil y servicios, pero sigue bloqueado para un flujo completo hasta que existan availability, creación y cancelación.

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
- Autenticación administrativa real completada mediante TURN-97, TURN-88 y TURN-69:
  - BFF same-origin y cliente HTTP tipado para auth;
  - login Google con `id_token`, cookie HTTP-only y restauración de sesión;
  - acceso protegido, estado de acceso denegado, logout y menú de cuenta;
  - validación manual local de login, recarga, acceso protegido y logout;
  - E2E desktop/mobile de login limpio, errores explícitos y flujo de sesión.
- TURN-94 mergeado en PR #4: rutas públicas y administrativas separadas, navegación desktop/mobile consistente y estados transitorios para Dashboard, Clientes, Servicios, Profesionales y Configuración.
- TURN-81 mergeado en PR #5: configuración de identidad, contacto y zona horaria del negocio mediante `business`.
- TURN-83 mergeado en PR #6: reglas de reserva mediante `booking-settings`, con validación, estados recuperables y acción sticky mobile.
- TURN-82 mergeado en PR #8: editor semanal de `business-hours` con carga y guardado reales, validación por día, feedback y acción sticky mobile. TURN-81, TURN-82 y TURN-83 completan TURN-85 en Jira.
- El PR #8 también unificó los componentes de guardado y feedback de los formularios de Configuración; la verificación final pasó lint, tipos, 35 tests unitarios, build y 109 E2E (14 omitidos).

- TURN-76 integrado en [PR #9](https://github.com/Candela-98/Turnero-frontend/pull/9): `/servicios` con catálogo real, filtros responsive, pills removibles, paginación y estados recuperables. Depende del backend [PR #72](https://github.com/Candela-98/Turnero-api/pull/72), también integrado.
- Componentes reutilizables de diálogo, filtros, búsqueda y paginación documentados en `componentes-listados.md`; `AdminPageHeader` compartido con Configuración.

## Pendiente

- Integrar los listados reales de profesionales y clientes.
- Implementar creación, edición, detalle y baja de servicios mediante TURN-96/98.
- Completar las pantallas funcionales de dashboard, clientes y profesionales.
- Cerrar contratos pendientes de agenda y appointments antes de conectarlos como fuente final.
- Implementar booking cliente real cuando estén disponibles sus endpoints públicos.

## Prioridades vigentes

Actualizar esta sección al cerrar cada PR. La prioridad y sus dependencias se registran aquí, no en el roadmap, handoff, decisiones ni documentos Stitch.

### Entregado — I1: integración de configuración

- `business`, `booking-settings` y `business-hours` están integrados por TURN-81, TURN-83 y TURN-82 (PRs #5, #6 y #8).
- El editor envía la semana completa al backend; este actualiza en el lugar los días existentes y crea solo los faltantes, sin alterar horarios de profesionales.
- Excepciones, feriados, pausas y horarios especiales quedan para una tarea posterior: `availability_exceptions` existe en backend, pero todavía no expone CRUD administrativo.

Condición de cierre cumplida: configuración usable contra API real, sin acoplar agenda ni el formulario de turnos a contratos incompletos.

### Ahora — I2: catálogos administrativos reales

- Entregado TURN-76: listado real de servicios, búsqueda, filtros y paginación; backend PR #72 y frontend PR #9 integrados.
- Continuar con los listados reales de profesionales/clientes y las mutaciones de servicios de TURN-96/98 sobre los endpoints admin disponibles.
- Incorporar formularios, validación y server state cuando aporten valor al flujo real.
- Mantener fuera de la UI los campos relacionales o métricas que el backend aún no expone.

Condición de cierre: cada catálogo posee lectura, mutaciones soportadas por backend y estados loading/error/empty.

### Siguiente — I3: agenda y turnos con contratos confirmados

- Conectar agenda y disponibilidad sólo cuando sus respuestas, filtros y reglas estén validadas contra el contrato final.
- Integrar creación, edición y acciones de turno cuando el backend cubra cliente rápido, relación staff-service, cálculos y solapamientos.

Condición de cierre: la agenda y el flujo de turnos comparten adapters y no duplican validaciones de negocio.

### Entregado — I4: autenticación y navegación protegida

TURN-69 quedó mergeado en [PR #1](https://github.com/Candela-98/Turnero-frontend/pull/1) y validado contra TURN-88: login Google, cookie HTTP-only, restauración de sesión, acceso protegido y logout. TURN-94 quedó mergeado en [PR #4](https://github.com/Candela-98/Turnero-frontend/pull/4): segregó layouts/rutas y dejó la navegación administrativa operativa.

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
- El reemplazo semanal de `business-hours` fue corregido en backend PR #69 para actualizar días existentes sin chocar con la restricción única por negocio y día.
- TURN-88 alineó auth/sesión/protección admin al contrato canónico; TURN-69 quedó validado contra backend local.
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
| Service offerings admin | Lectura real | TURN-76 integrado en PR #9 y backend PR #72: listado paginado, búsqueda, filtros y categorías reales. Creación, edición, detalle y baja pendientes de TURN-96/98. |
| Staff members admin | Si | CRUD, asociaciones y horarios disponibles para integracion progresiva. |
| Staff-service offerings | Si | Endpoints v1 ya disponibles para integracion progresiva. |
| Customers admin | Si | Endpoints admin v1 ya disponibles para integracion progresiva. |
| Business/configuracion | No requiere mocks | `business`, `booking-settings` y `business-hours` integrados en PRs #5/#6/#8. TURN-89 protege horarios y backend PR #69 corrigió su actualización. Excepciones y feriados requieren un contrato CRUD posterior. |
| Auth Google admin | No requiere mocks | TURN-97 + TURN-88 + TURN-69 entregados: BFF, contrato canónico y aprovisionamiento local. |
| Booking publico | Si | TURN-58 ya expone perfil y servicios; TURN-59 a TURN-61 deben completar availability, reserva y cancelación. |

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
- Flujos pendientes de creación, edición y detalle de servicios.
- Profesionales.
- Configuracion.
- Empty states.
- Loading states.
- Errores y validaciones visuales.
- Notificaciones mobile como referencia visual.

## Que debe esperar endpoints reales

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
- No asumir que los estados de transición de TURN-94 equivalen a pantallas funcionales; las rutas existen, pero cada flujo conserva su ticket de implementación.
- No asumir que booking público está completo: faltan availability, creación y cancelación en TURN-59 a TURN-61.
- No crear reglas de negocio duplicadas en frontend si el backend debe validarlas.
- No mezclar booking cliente con admin.
- No implementar portal cliente, portal profesional, multi-business, vista mes ni analytics avanzado en MVP.

## TURN-76 integrada — listado real de servicios

Integrada el 2026-10-02 en `dev` mediante [PR #9](https://github.com/Candela-98/Turnero-frontend/pull/9), merge `70df540`. Dependencia backend integrada previamente en `develop` mediante [PR #72](https://github.com/Candela-98/Turnero-api/pull/72), merge `a734b63`.

- `/servicios` consume el listado paginado y las categorías reales mediante BFF, cliente compartido y TanStack Query.
- Búsqueda con debounce, modal responsive con filtros provisionales y acción Aplicar, pills removibles y paginación.
- Estados de carga, negocio vacío, búsqueda sin resultados y error con reintento; aislamiento del cache por negocio, cancelación de respuestas obsoletas y limpieza al salir.
- Layout alineado con Configuración y componentes de listado/filtros reutilizables documentados en `componentes-listados.md`.
- QA local aprobado por el usuario en desktop y mobile; cobertura E2E y accesibilidad en `1440×900`, `390×844` y `412×915`.
- Verificación: lint, TypeScript, build y 37 tests unitarios correctos; suite completa E2E con 127 aprobados y 14 omisiones previstas por viewport. CI del PR #9 completado correctamente antes del merge.
- Crear, editar, detalle y baja de servicios quedan para TURN-96/98; la agenda demo conserva su alcance actual. La fase I2 continúa para el resto de catálogos y mutaciones.
- Entrega técnica completada. El usuario realiza el cierre de TURN-76 en Jira.

## TURN-96 — implementación local pendiente de integración

Preparada el 2026-10-09 en `feature/TURN-96-service-form`. Pruebas manuales aprobadas por el usuario en desktop y mobile el 2026-10-12; PR frontend [#10](https://github.com/Candela-98/Turnero-frontend/pull/10) abierto hacia `dev` y backend [#75](https://github.com/Candela-98/Turnero-api/pull/75) hacia `develop`. Integrar primero backend; ambos pendientes de merge. Este apartado no modifica el estado mergeado de las secciones anteriores.

- Alta y edición mediante el formulario reutilizable de nombre, categoría opcional, duración y precio ARS. Modal en desktop, panel inferior en mobile y acciones fijas.
- Operaciones GET por ID, POST y PATCH mediante BFF; campos editables exclusivamente y PATCH parcial. Categorías libres con sugerencias y limpieza mediante cadena vacía.
- Validación local y errores de campo del backend, comparación contra la respuesta hidratada, conservación de borradores y confirmación de descarte. Bloqueo de doble envío y cierre durante el guardado.
- Refresco de listado, categorías y detalle por negocio; recuperación de fallos de lectura posteriores al guardado sin repetir la escritura.
- Tests unitarios y E2E de alta, edición, errores, descarte, categorías, hidratación, filtros y accesibilidad. QA en desktop y mobile; la verificación no sustituye las pruebas locales del usuario contra su backend.
- Verificación final: lint, TypeScript, build y 56 tests unitarios correctos. Suite completa E2E: 160 aprobados y 14 omisiones previstas por viewport; los 33 casos del formulario pasan sin omisiones. Guía manual en `pruebas-locales-turn-96.md`.
- Revisión local del 2026-10-12: confirmaciones de servicios flotantes con `FloatingAlert placement="viewport"`, sin desplazar el listado, con cierre manual y automático a los 6 segundos. E2E afectados: 36 aprobados sin omisiones, incluyendo posición estable al hacer scroll y ambos cierres en desktop y los dos viewports mobile.
- Avisos unificados también en Configuración, reglas de reserva y horarios: flotantes a la derecha en desktop, acompañan el scroll y reservan espacio sobre Guardar; éxitos temporizados y errores persistentes con reintento. E2E de Configuración: 71 aprobados y 7 omisiones previstas por viewport.
- Patrones reforzados entre sesiones: guía `patrones-pantallas.md` y reglas de composición en `AGENTS.md`; `AdminPageSection` y `AdminFormActions` utilizados en pantallas existentes; `FloatingAlert` flotante por defecto y separación automática sobre Guardar. Helpers E2E compartidos, comando `test:patterns` y CI también en pushes a `dev`, con reporte de fallos. Verificación local completa: lint, TypeScript, build y 56 unitarios correctos; 163 E2E aprobados y 14 omisiones previstas por viewport.
- QA real detectó un defecto previo del backend: alta de servicios sin `created_at`/`updated_at`, rechazado por PostgreSQL. Corrección local en `ServOfferingServiceImpl`: fechas al crear y actualización de `updated_at` al editar/desactivar; prueba de persistencia con timestamps NOT NULL. Suite backend completa correcta mediante `make test`, que configura Docker/Colima para las pruebas PostgreSQL. Pendiente de integración backend; reiniciar la API local para probar. Sin migraciones.
- Estado activo/inactivo, baja, detalle informativo y profesionales asociados permanecen fuera del frontend de TURN-96.
- Segundo defecto del seed local: V1000 asignaba IDs explícitos sin avanzar secuencias. Nueva migración exclusivamente local `V1001__sync_seed_sequences.sql` sincroniza negocios, usuarios, profesionales y servicios sin retroceder contadores ni modificar filas. Reparación aplicada en la base local de esta sesión; regresión PostgreSQL para bases nuevas y existentes. Suite backend completa: 440 aprobados sin omisiones mediante `make test`. Pendiente de integración.
- Avisos mobile según contexto: `FloatingAlert` deja 16 px sobre la navegación en páginas sin acción fija y reserva espacio sobre Guardar automáticamente dentro de `AdminFormActions`/`SaveActionFeedback`. Patrón aplicado a todos sus usos; guía persistente y helper E2E actualizados. Recorridos afectados: 107 aprobados y 7 omisiones previstas por viewport.

## TURN-98 — implementación local pendiente de validación manual

Preparada el 2026-10-13 en `feature/TURN-98-service-detail`, sobre la entrega de TURN-96. Pruebas manuales aprobadas por el usuario el 2026-10-16. Preparada para PR sobre `feature/TURN-96-service-form` mientras #10 siga abierto; cambiar la base a `dev` después de integrar TURN-96. Pendiente de integración.

- Alcance ajustado por el usuario: desactivar, restaurar y eliminar desde las tarjetas, sin panel de detalle. Eliminar requiere estado inactivo y usa borrado lógico sin restauración desde la app. El catálogo mantiene su ancho completo en desktop y mobile; antiguas URLs de detalle redirigen a `/servicios`.
- Desactivar usa DELETE lógico; Restaurar usa PATCH solo con `status: "ACTIVE"`, ya soportado por la API. Ambos requieren confirmación accesible con bloqueo de doble envío y cierre durante la escritura, y errores recuperables.
- Cache por negocio: cancelación de lecturas anteriores, estado confirmado antes del refresco e invalidación del catálogo, categorías y detalle usado por edición. Reintentar un refresco fallido solo repite lecturas. Se conservan filtros y búsqueda; se vuelve a una página válida si desaparece el último resultado.
- Confirmación reutilizable `ConfirmActionDialog` y `ServiceStatusConfirmation`, avisos flotantes compartidos y formulario de edición de TURN-96. Eliminar depende del backend local TURN-98 y de V1002 (`deleted_at`); desactivar/restaurar mantienen sus endpoints existentes.
- Guía de validación en `pruebas-locales-turn-98.md` y componentes documentados en `componentes-listados.md`. Pruebas automatizadas actualizadas al nuevo alcance; pendiente de QA manual contra la API local.
- Verificación del alcance ajustado: lint y build de producción con TypeScript correctos; 62 unitarios aprobados. E2E afectados: 21 de estado, 36 de alta/edición y 18 de listado/filtros aprobados en desktop y ambos tamaños mobile, sin omisiones. Los casos anteriores del panel de detalle fueron reemplazados por el nuevo flujo; no se volvió a ejecutar la suite completa de pantallas ajenas a servicios.

- Extensión aprobada: Eliminar solo para servicios inactivos, con confirmación irreversible desde la app, conservación del historial y exclusión del catálogo/categorías. Frontend utiliza DELETE `/{id}/catalog`; backend en rama separada `feature/TURN-98-service-removal`. Pendiente de reiniciar API y QA manual antes de PR.
- Verificación de esta extensión: lint, TypeScript y build correctos; 64 unitarios y 81 E2E de servicios aprobados en desktop y ambos tamaños mobile, sin omisiones. Cobertura de eliminación, cancelación, rechazo de backend y actualización de categorías, además de regresión de estado, filtros y formulario.

- Corrección de QA local (2026-10-16): el BFF no permitía DELETE `service-offerings/{id}/catalog` y rechazaba la eliminación con 404 sin llegar a la API. Ruta habilitada exclusivamente para DELETE con ID numérico. Regresión sobre el handler real del BFF: reenvío de ruta y cookie, conservación de 204/404/409, métodos e IDs inválidos bloqueados. Verificación: 68 unitarios, lint y TypeScript correctos. Pendiente de repetir eliminación manual.

- QA manual final aprobado por el usuario el 2026-10-16, incluyendo eliminación tras corregir el BFF y avisos específicos por acción. Avisos tipados centralizados; lint, TypeScript y 12 E2E de los flujos afectados aprobados en desktop y ambos tamaños mobile. Entrega autorizada para revisión por PR, sin merge automático.

- PR frontend [#11](https://github.com/Candela-98/Turnero-frontend/pull/11) creado el 2026-10-16 sobre la rama de #10; backend relacionado [#76](https://github.com/Candela-98/Turnero-api/pull/76), sobre #75. Ambos abiertos para revisión del usuario; sin merge. Tras integrar TURN-96, cambiar bases a `dev`/`develop` e integrar TURN-98 backend antes que frontend.

## TURN-77 — Listado real de profesionales

- Implementación local: rama `feature/TURN-77-staff-list`, basada en TURN-98; `/profesionales` consume API real mediante BFF/apiFetch y TanStack Query, con keys por negocio/parámetros, cancelación, debounce 300 ms y páginas de 20.
- Componentes separados de consulta, listado, tarjeta y filtros; controles, shell y estados compartidos con Servicios. Campos opcionales omitidos e iniciales ante imagen ausente/fallida. No incluye acciones reservadas para TURN-99/78/79/101 ni modifica agenda demo.
- QA automatizado: adapter/parámetros y handler real BFF; E2E en los tres viewports con filtros provisionales, debounce, paginación, carga, vacíos, error/reintento, respuesta tardía, avatar fallido, textos largos y Axe. Guía y resultados: `docs/qa-turn-77.md`.
- QA manual aprobada por el usuario; paginación sin prueba manual por tener menos de 20 profesionales, cubierta por automatización. PRs autorizados; integración pendiente, ajustar bases por TURN-98 e integrar backend primero. Requiere API con respuesta `{ data, page }`, sin nuevas migraciones.
- Verificación final: lint, TypeScript, build y 76 unitarios aprobados; suite E2E completa 202 aprobadas/14 omisiones previstas, recorrido final TURN-77 15/15. Capturas revisadas en 1440×900, 390×844 y 412×915; sin infracciones Axe básicas. QA manual con API real aprobada; paginación cubierta por automatización.

- PRs TURN-77 creados: [backend #77](https://github.com/Candela-98/Turnero-api/pull/77) sobre TURN-98 y [frontend #12](https://github.com/Candela-98/Turnero-frontend/pull/12) sobre TURN-98. Sin revisión de CI ni merge por instrucción del usuario. Ajustar bases al integrar dependencias; backend primero.

## TURN-99 — Crear y editar profesionales

- Implementación local en `feature/TURN-99-staff-form`, sobre TURN-77. Header/vacío con alta y filas con edición; modal desktop/panel inferior mobile con formulario reutilizable, descarte, validación, errores recuperables, guardado sin cambios deshabilitado y protección de doble envío.
- Campos: nombre, rol opcional y especialidad; vinculación opcional al usuario actual solo en alta. API/adapters con campos editables, PATCH solo de cambios y soporte de especialidad heredada nula. Avatar, estado y vinculación existente se conservan en edición.
- Cache por negocio: detalle confirmado, cancelación de lecturas anteriores e invalidación de listado/detalle; filtros y búsqueda conservados, página ajustada si deja de ser válida. Reintento de refresco posterior a éxito solo repite lecturas.
- Prerrequisito backend acordado: rol máximo 80, creación/vinculación transaccional con copia de horarios y conflicto `409 STAFF_USER_ALREADY_LINKED`, incluso ante altas concurrentes o profesional inactivo. Sin migraciones; entregar backend primero, en PR separado.
- Verificación local: 90 unitarios, lint, TypeScript y build correctos; E2E completa 235 aprobadas y 14 omisiones previstas. Formularios con Axe y capturas revisadas en desktop y ambos tamaños mobile. Guía manual: `pruebas-locales-turn-99.md`.
- QA manual aprobada por el usuario el 2026-10-17. Creación de PRs autorizada; integración pendiente, ajustar bases según TURN-77 e integrar backend primero. Sin revisión de CI ni merge automático.

- Verificación final tras ajustar la densidad desktop: 45/45 E2E de listado y formulario aprobados en los tres viewports, sin omisiones.

- Corrección de QA manual: faltaba identificar qué profesional pertenece al usuario actual. Se agrega **Vos** en el listado según `user_id` y sesión, aviso **Tu perfil profesional** en edición y mensaje de conflicto que señala esa etiqueta. Se conserva la vinculación única y no se reasignan datos. QA manual repetida y aprobada por el usuario.

- Verificación del indicador de identidad: lint, TypeScript, build, 90 unitarios y 48/48 E2E de Profesionales correctos. Capturas revisadas en desktop y mobile; se comprueba por ID que el usuario ajeno o sin vínculo no recibe la etiqueta Vos.

- QA manual de prevención: **Este profesional soy yo** queda desactivado y bloqueado si el usuario ya tiene profesional vinculado, mostrando su nombre. Se comprueba mediante un endpoint de sesión independiente de filtros/paginación, también para inactivos. Carga/error bloquean la opción con reintento; crear otros profesionales sin vínculo sigue permitido. Consulta fresca al abrir y refresco tras guardar/conflicto. QA manual aprobada tras reiniciar la API.

- Verificación de bloqueo preventivo: lint, TypeScript, build y 92 unitarios aprobados; suite E2E completa 244 aprobadas / 14 omisiones previstas, con comprobación de carga/error/reintento, vínculo fuera de página y filtros, inactivos y alta sin usuario. Capturas revisadas en desktop y mobile. QA manual aprobada por el usuario el 2026-10-17.

- PRs TURN-99 creados el 2026-10-17: [backend #78](https://github.com/Candela-98/Turnero-api/pull/78) y [frontend #13](https://github.com/Candela-98/Turnero-frontend/pull/13), ambos sobre sus ramas de TURN-77. QA manual aprobada. Sin revisión de CI ni merge; ajustar bases al integrar dependencias y entregar backend primero.

## TURN-78 — Asignar servicios a profesionales (2026-10-17)

- Implementación local en `feature/TURN-78-staff-services`, basada en TURN-99: acción Servicios por fila (también inactivos), modal desktop/panel inferior mobile con `ResponsiveDialog`, editor persistente durante refrescos, formulario y fila de selección separados. Reutiliza búsqueda, grupo de opciones, paginación, estados, avisos, Guardar y confirmación de descarte.
- Catálogo activo por negocio, búsqueda nombre/categoría con debounce de 300 ms, páginas de 20. Seleccionados conserva modelos entre páginas/búsquedas, busca/pagina localmente e incluye inactivos existentes. Quitar todos/Restablecer selección; comparación de conjuntos, sin cambios no guarda. Carga fresca de asociaciones y primer catálogo antes de habilitar; refetches no pisan borrador.
- GET/PUT reales por apiFetch/BFF con adapter compartido de servicios, AbortSignal y keys por negocio/profesional/parámetros. PUT envía conjunto completo único y ordenado, bloquea doble envío/cierre, conserva borrador ante errores y confirma con “Servicios actualizados”. Cancela lecturas obsoletas, conserva selección confirmada e invalida asociaciones/profesional/catálogo/detalles de la unión de servicios anteriores y nuevos. Reintentar refresco hace lecturas, nunca otra escritura; también vuelve a consultar asociaciones tras cerrar el diálogo.
- QA automática: verificación completa `NEXT_DIST_DIR=.next-e2e npm run check` aprobada: lint, TypeScript, 106 unitarios, build y 274 E2E aprobados (14 omisiones preexistentes de la suite). Los 30 recorridos nuevos de TURN-78 pasan en los tres proyectos; backend final: 510 pruebas sin fallos ni omisiones. Cobertura añadida del handler real del BFF GET/PUT/cookie/cuerpo/204/errores y de caché/cancelación. E2E en los tres viewports: selección entre páginas y vistas, varios/uno/ninguno, inactivos, debounce/respuesta tardía, carga/vacíos, errores/reintentos, descarte, teclado/foco, doble envío, textos largos y axe.
- Capturas finales desktop 1440×900 y mobile 390×844 / 412×915 revisadas frente a los patrones compartidos y la referencia aprobada de Profesionales; también revisados textos largos sin espacios. La densidad y el footer compartidos conservan navegación y scroll de contenido.
- QA manual aprobada por el usuario el 2026-10-17, incluidos contador, vista inicial y etiquetas Rol/Especialidad; guía `docs/pruebas-locales-turn-78.md`. Creación de PRs separados autorizada; integración pendiente, backend primero, bases TURN-99 mientras esas dependencias sigan abiertas. Sin revisar CI ni integrar automáticamente.
- Por decisión del usuario, `lib/demo`, agenda y formularios de turnos siguen demo. El criterio Jira de refrescarlos se difiere hasta su conexión real; no se añadieron keys ficticias ni datos de API a esos flujos.

- Mejora UX aprobada durante QA: fila con **Especialidad: …**, acción **Servicios (N)** o **Asignar servicios** cuando N=0. El contador viene agregado por página desde la API, sin consultas por fila; se actualiza en caché al guardar y se invalida al eliminar un servicio del catálogo. Se conserva desconocido si una API anterior no informa el campo, sin confundirlo con cero. La lectura fresca de asociaciones decide abrir Seleccionados o Catálogo.
- Verificación de la mejora: backend 513 pruebas; frontend lint, TypeScript, 108 unitarios y build aprobados. Pasaron 54 recorridos de listado/formulario de profesionales y la ejecución final de 63 E2E de asignaciones/estado de servicios (tres proyectos); sin fallos pendientes. Capturas de fila con cantidad y sin asignaciones revisadas en 1440×900, 390×844 y 412×915. QA manual de esta mejora aprobada por el usuario tras reiniciar backend; integración pendiente.

- Ajuste visual final aprobado: etiquetas **Rol:** y **Especialidad:** con el mismo tamaño/color y peso medio; campos vacíos omitidos. ESLint del componente y `git diff --check` correctos.

- PRs TURN-78 creados el 2026-10-17: [backend #79](https://github.com/Candela-98/Turnero-api/pull/79) y [frontend #14](https://github.com/Candela-98/Turnero-frontend/pull/14), ambos sobre `feature/TURN-99-staff-form`. QA manual aprobada. Sin revisión de CI ni merge; ajustar bases al integrar TURN-99 y entregar backend primero.

- Integración de dependencias autorizada por el usuario el 2026-10-17 sin esperar approvals: TURN-98 [#11](https://github.com/Candela-98/Turnero-frontend/pull/11), TURN-77 [#12](https://github.com/Candela-98/Turnero-frontend/pull/12) y TURN-99 [#13](https://github.com/Candela-98/Turnero-frontend/pull/13) mergeados, en ese orden, a `dev`, después de sus backends. TURN-78 [#14](https://github.com/Candela-98/Turnero-frontend/pull/14) queda abierto sobre `dev`, sin conflictos; backend [#79](https://github.com/Candela-98/Turnero-api/pull/79) sobre `develop`. Sin consultar CI. Integrar TURN-78 backend antes del frontend.


## TURN-79 — Horarios semanales por profesional (2026-10-17)

- Implementación local en `feature/TURN-79-staff-hours`, basada en TURN-78. Servicios permanece visible en las filas; Más acciones reúne Editar datos y Horarios. Editor persistente con modal desktop/panel inferior mobile, semana completa y acciones fijas. Controles de día/hora extraídos y compartidos con Configuración sin cambiar su dominio.
- Lectura fresca por negocio/profesional y cancelable; baseline independiente de refetches. Disponibilidad por día, horas requeridas y orden estricto, comparación normalizada, reversión, descarte y foco de errores. PUT completo con bloqueo inmediato de doble envío/cierre y errores que conservan borrador. Cache actualizada desde 200; recuperación de respuesta inválida solo por lectura.
- QA automática: 119 unitarios y 27 E2E nuevos aprobados en los tres viewports. Capturas 1440×900, 390×844 y 412×915 revisadas, footer accesible, sin scroll horizontal ni infracciones axe básicas. Verificación completa registrada al finalizar.
- QA manual pendiente: guía `docs/pruebas-locales-turn-79.md`. Reiniciar backend. La disponibilidad efectiva sigue limitada por los horarios del negocio; turnos existentes intactos, agenda/formularios de turnos siguen demo.
- Integración pendiente: PRs separados después de aprobación manual; backend primero. Dependencias TURN-78 backend #79 / frontend #14 todavía abiertas. Sin revisión de CI ni merge automático.

- Verificación completa final: `NEXT_DIST_DIR=.next-e2e npm run check` aprobada (lint, TypeScript, 119 unitarios, build y 307 E2E aprobados / 14 omisiones preexistentes). Los 27 recorridos nuevos de horarios pasan en los tres proyectos. Regresiones de Configuración, edición de profesionales y asignación de servicios incluidas. Sin fallos pendientes de frontend.

- Backend final: 527 pruebas aprobadas, sin fallos ni omisiones; contrato normalizado y horas estrictas verificados. QA manual e integración continúan pendientes.

- Mejora de QA solicitada: avisos informativos junto a los campos cuando el rango excede los horarios del negocio; contempla días cerrados y rangos sin intersección. Lectura real por BFF/apiFetch, key por negocio y AbortSignal, recuperación sin perder borrador y guardado permitido. Guía local ampliada; QA manual de esta mejora pendiente.

- Verificación de los avisos: lint, TypeScript, 122 unitarios y build aprobados. E2E afectados: 61 aprobados y cinco omisiones preexistentes de Configuración, en los tres proyectos. Incluye persistir 19:00 con cierre 18:00, reversión, accesibilidad de ayudas, días cerrados, rangos sin intersección y error/reintento de comparación conservando borrador. Capturas de avisos revisadas en 1440×900, 390×844 y 412×915; sin scroll horizontal ni infracciones axe básicas. No se repitió la suite completa ajena a horarios para esta mejora.

- QA manual final aprobada por el usuario el 2026-10-17, incluidos avisos de horarios del negocio y consultas canceladas en desarrollo. Creación de PRs separados autorizada. Bases TURN-78 mientras backend #79 / frontend #14 sigan abiertos; ajustar a develop/dev al integrar esas dependencias. Integrar backend primero, sin revisión de CI ni merge automático.

- PRs TURN-79 creados el 2026-10-17: [backend #80](https://github.com/Candela-98/Turnero-api/pull/80) y [frontend #15](https://github.com/Candela-98/Turnero-frontend/pull/15), ambos sobre feature/TURN-78-staff-services. QA manual aprobada; abiertos para revisión. Sin consultar CI ni mergear. Tras integrar TURN-78, ajustar bases a develop/dev e integrar TURN-79 backend primero.


## TURN-101 — Detalle y estado de profesionales (2026-10-17)

- Implementación local en `feature/TURN-101-staff-status`, sobre TURN-79. Ampliación aprobada: reactivar, además de desactivar; conservar búsqueda, filtro y página mediante URL. `/profesionales/[id]` admite enlace directo/recarga; Ver detalle y Desactivar/Reactivar se incorporan al menú sin modificar alta/edición/servicios/horarios.
- Detalle comparte shell, tarjeta, avatar, badges y estados. Confirmación reutilizada entre ambas pantallas, bloqueo de doble envío/cierre, conflicto específico por turnos futuros, 404 y errores recuperables. Cache por negocio actualizada desde escritura confirmada, consultas antiguas canceladas, contador preservado y refresco separado de la mutación. Agenda y flujos frontend de turnos siguen demo.
- QA automática: 138 unitarios y 81 E2E afectados aprobados; suite completa en curso. QA manual pendiente; guía `docs/pruebas-locales-turn-101.md`.
- Integración pendiente: PRs separados después de aprobación manual, backend primero. Base TURN-79 mientras #80/#15 sigan abiertos; ajustar a develop/dev al integrar dependencias. No revisar CI ni mergear automáticamente.

- Verificación final: backend 544 pruebas sin fallos ni omisiones. Frontend lint, TypeScript, 138 unitarios y build aprobados; suite E2E completa 346 aprobados / 14 omisiones preexistentes. Tras corregir conservación de búsqueda pendiente al filtrar y cancelación ante 404, se repitieron lint/tipos/unitarios/build y 87 E2E de listado/formulario/detalle/estado, todos aprobados, incluidos los 33 recorridos de TURN-101 en los tres proyectos. Capturas de detalle, confirmación y conflicto revisadas en 1440×900, 390×844 y 412×915, sin scroll horizontal ni infracciones axe básicas. QA manual e integración pendientes.

### Extensión TURN-101 — Eliminar profesionales inactivos (2026-10-17)

- Detalle y cambios de estado aprobados manualmente por el usuario. Nueva solicitud: ocultar definitivamente del listado los profesionales previamente desactivados mediante borrado lógico.
- Implementación local: DELETE `staff-members/{id}/catalog`, solo INACTIVE, scoping por negocio y bloqueo compartido con reactivación/reservas. Conserva historial y relaciones; excluye eliminados de listados y operaciones, sin restauración desde la app. Libera el vínculo operativo de cuenta para otro perfil, conservando `user_id` histórico y la cuenta.
- Nueva migración Flyway V1003: `deleted_at`, índice único parcial de usuario no eliminado y restricción de eliminado inactivo. Reiniciar backend antes de probar frontend.
- UI reutiliza menú/confirmación/avisos; eliminación desde listado o detalle, filtros y página conservados, caché limpiada tras éxito y reintento solo de lecturas. BFF probado mediante handler real, errores y cookie.
- QA manual de esta extensión e integración pendientes. Guía local `docs/pruebas-locales-turn-101.md` en frontend. PRs separados después de aprobación manual; backend primero. Sin revisar CI ni mergear automáticamente.

- QA final de la extensión: backend 550 pruebas aprobadas, sin fallos ni omisiones; frontend lint/TypeScript, 145 unitarios, build y suite E2E completa correctos (361 aprobados / 14 omisiones preexistentes). Los 45 recorridos de detalle/estado/eliminación pasan en desktop 1440×900 y mobile 390×844 / 412×915. Capturas de eliminación revisadas y axe básico sin infracciones en los recorridos cubiertos. QA manual de eliminación e integración pendientes.

- Ajuste UX de avisos aprobado por el usuario: Profesionales comparte un catálogo de mensajes por acción entre listado y detalle, siguiendo Servicios. Se elimina el texto genérico repetido; las siete acciones incluyen descripciones específicas sobre el resultado, próximos pasos o datos conservados. Verificación de la versión inicial: lint, TypeScript, 145 unitarios, build y 156 E2E afectados aprobados en los tres viewports; capturas de avisos revisadas. Descripciones ampliadas según copy aprobado por el usuario.
- Ajuste de copy en Servicios aprobado por el usuario: actualización informa que el catálogo ya muestra los datos nuevos; restauración informa que el servicio vuelve a aparecer entre los activos.

### Integración de dependencias TURN-101 (2026-10-19)

- Por instrucción del usuario, TURN-78 [#14](https://github.com/Candela-98/Turnero-frontend/pull/14) y TURN-79 [#15](https://github.com/Candela-98/Turnero-frontend/pull/15) se integraron a `dev`, sin esperar approvals y sin consultar CI. Commits de merge: `c76e08b` y `6eaa04d`.
- Backends relacionados: TURN-78 #79 y TURN-79 #80 integrados a `develop`, antes de sus respectivos frontends.
- Solo permanece abierto TURN-101 frontend [#16](https://github.com/Candela-98/Turnero-frontend/pull/16), con base `dev`. Backend [#81](https://github.com/Candela-98/Turnero-api/pull/81) permanece abierto sobre `develop`; integrar backend antes que frontend. El usuario aprobó la entrega y pidió conservar estos últimos PRs abiertos.

## TURN-100 — Crear y editar clientes (2026-10-19)

- Implementación local en `feature/TURN-100-customer-form`, sobre TURN-80, independiente de TURN-101. Alta y edición mediante BFF/apiFetch, detalle fresco y adapters en lib/customers. Nombre/teléfono obligatorios, email/notas opcionales; compatibilidad con registros antiguos sin teléfono.
- CustomerEditor/CustomerForm reutilizan ResponsiveDialog, controles, footer, confirmación de descarte, validación con foco y avisos. Diálogo controlado fuera de resultados; PATCH solo campos modificados, baseline estable, bloqueo inmediato de doble submit y cierre durante envío.
- Keys y refresco por negocio, cancelación de lecturas antiguas y detalle confirmado en caché. Fallo posterior de refresco reintenta solo lecturas. Catálogo de éxitos con título y descripción específicos; no se modifica la agenda demo ni se agregan acciones de TURN-102.
- QA automática completada: lint sin advertencias, TypeScript, 156 unitarios y build aprobados. Suite E2E completa: 376 aprobados y 14 omisiones preexistentes. Después se agregaron dos casos de edición/paginación y se reforzó la espera de respuestas tardías; los 39 recorridos finales de formulario aprobaron en los tres viewports. Backend: 572 aprobados sin omisiones, incluidos 24 nuevos casos PostgreSQL. Capturas de alta, edición, éxito, errores y textos largos revisadas en 1440×900, 390×844 y 412×915. QA manual e integración pendientes. Guía: docs/pruebas-locales-turn-100.md. Crear PRs separados después de aprobación manual; bases en TURN-80 si sigue abierto y luego develop/dev, backend primero. Sin consultar CI ni mergear automáticamente.

- QA manual TURN-100 aprobada por el usuario el 2026-10-19. Autorizada la integración de los PRs anteriores y la creación de los PRs de esta entrega contra develop/dev. Sin consultar CI.

### Integración previa a TURN-100 (2026-10-19)

- Por autorización del usuario, TURN-101 backend [#81](https://github.com/Candela-98/Turnero-api/pull/81) y frontend [#16](https://github.com/Candela-98/Turnero-frontend/pull/16) se integraron a develop/dev, seguidos de TURN-80 backend [#82](https://github.com/Candela-98/Turnero-api/pull/82) y frontend [#17](https://github.com/Candela-98/Turnero-frontend/pull/17). Backend antes que frontend en cada entrega, sin esperar approvals ni consultar CI.
- Conflictos de documentación resueltos conservando las dos entregas; en el BFF se conservaron las pruebas de Clientes y Profesionales (53 pruebas locales aprobadas). TURN-100 actualizado sobre las bases integradas develop/dev. QA manual aprobada; abrir ambos PRs y mantenerlos sin mergear.

- PRs TURN-100 creados y abiertos: [backend #83](https://github.com/Candela-98/Turnero-api/pull/83), base `develop`, y [frontend #18](https://github.com/Candela-98/Turnero-frontend/pull/18), base `dev`. Integrar backend primero. Comprobación local tras integrar dependencias: 24 casos PostgreSQL de escritura aprobados, 179 unitarios frontend, lint y TypeScript aprobados. Sin consultar CI.

## TURN-102 — Detalle y estado de clientes (2026-10-19)

- Implementación local en feature/TURN-102-customer-status sobre TURN-100. Ampliación aprobada: reactivar además de desactivar; significado administrativo, sin bloqueo de nuevas reservas. Se conserva todo el historial y no se agrega eliminación.
- Ruta /clientes/[id] con enlace directo/recarga, CustomerCard, contacto/notas reales y edición reutilizada. Menú de acciones con Ver detalle y estado, conserva Editar y contexto q/status/page. Confirmación accesible compartida, bloqueo de doble envío/cierre y errores recuperables con manejo de 404.
- Usa GET/DELETE/PATCH existentes y BFF. Cambios de caché cancelan lecturas obsoletas, conservan notas y aíslan negocio; refresco fallido reintenta solo lecturas. Workspace comparte avisos con título/descripcion entre listado y detalle. Editor espera datos frescos sin perder borradores en refetch.
- La suite completa detectó y se corrigió una carrera de foco al cerrar la confirmación cuando desaparece una fila; Cancelar conserva el foco en el disparador y una escritura confirmada lo lleva al buscador. También se corrigió que Profesionales perdía el texto pendiente del debounce al aplicar estado. Los recorridos afectados aprobaron 36 ejecuciones repetidas en los tres viewports.
- Sin modificaciones backend ni migraciones. Verificación final: lint, TypeScript, 207 unitarios y build aprobados; suite E2E completa con 472 aprobados y 14 omisiones preexistentes, incluidos los 45 casos nuevos de detalle/estado. Backend: 99 pruebas existentes de Clientes aprobadas, incluidas las de PostgreSQL. Capturas revisadas en 1440×900, 390×844 y 412×915. QA manual e integración pendientes; no hubo navegador conectado para comprobar la sesión local del usuario. Guía docs/pruebas-locales-turn-102.md. Un PR frontend después de aprobación manual, base TURN-100 mientras #18 siga abierto y luego dev; TURN-100 backend #83 debe integrarse primero. Sin consultar CI ni mergear automáticamente.

### Revisión de producto TURN-102 — archivo y bloqueo (2026-10-19)

- Sustituye el alcance administrativo de desactivar/reactivar: Archivo/Restauración y Bloqueo/Desbloqueo público independientes. Por defecto Sin archivar; filtros combinados, pills y URL. Motivo interno obligatorio, conservación de datos y cuatro éxitos específicos con descripción.
- Backend en feature/TURN-102-customer-archive-block con V1004, índices, contacto por email o teléfono, restauración transaccional y errores públicos sin motivo. Reservas administrativas permitidas, agenda demo sin conexión nueva. La futura agenda real debe advertir al seleccionar un bloqueado.
- Jira TURN-102 actualizado a Fullstack y dos PRs. QA automática final: lint, TypeScript, build, 222 unitarios y 490 E2E aprobados; 14 omisiones preexistentes. Incluye 63 recorridos de detalle/archivo/bloqueo y capturas revisadas en 1440×900, 390×844 y 412×915. Backend completo con 609 aprobados sin errores/omisiones. QA manual e integración pendientes. Guía docs/pruebas-locales-turn-102.md. Crear PRs después de aprobación manual, backend primero y bases dependientes de TURN-100 hasta integración. Sin consultar CI.

- QA manual TURN-102 aprobada por el usuario y creación de ambos PRs autorizada el 2026-10-20. TURN-100 continúa abierto (#83 API / #18 frontend): base inmediata feature/TURN-100-customer-form en ambos repos; retarget a develop/dev tras integrar la dependencia. Integración pendiente, backend primero. Sin consultar CI.

- PRs TURN-102 creados: [backend #84](https://github.com/Candela-98/Turnero-api/pull/84) y [frontend #19](https://github.com/Candela-98/Turnero-frontend/pull/19), ambos con base feature/TURN-100-customer-form mientras #83/#18 sigan abiertos. Retarget a develop/dev al integrar TURN-100. QA manual aprobada; integración pendiente y backend primero. Sin consultar CI.

## TURN-90 + TURN-70 — Agenda administrativa real (2026-10-20)

- Implementación local en `feature/TURN-90-agenda-read` (backend, base `develop` 75fdcbc) y `feature/TURN-70-real-agenda` (frontend, base `dev` 87cbb44). PR #85 fuera de alcance.
- Backend: DTO de lectura común a GET colección/detalle, envelope `{data,page}`, validación fuera del controller, día/rango con offsets y hasta 31 días calendario, filtros combinados, orden estable, referencias históricas con joins limitados al negocio, 404 y referencias inconsistentes sin exposición cruzada. Horarios locales históricos conservados; política de primer offset/reparación de huecos documentada y aplicada también a rangos. Escrituras, transiciones, disponibilidad y esquema permanecen en sus tareas.
- Frontend: adapter/modelo/queries independientes de demo, zona de GET business, fecha y filtros exclusivos de URL, catálogo completo con búsqueda/inactivos y referencias históricas, lectura de todas las páginas, rechazo de colecciones parciales/inconsistentes, grilla sin recorte horario ni pérdida de turnos por hora, lista mobile cronológica y estados recuperables. 401 recupera auth; 403 conserva sesión. Retiro temporal de crear/editar/confirmar/mensajería/detalle, Nuevo turno del shell/dashboard, Semana, disponibilidad ficticia y paneles demo.
- QA automática: suite backend completa con 630 aprobados, cero errores/omisiones; verificación final focalizada de appointments tras añadir 7 casos HTTP 400 y documentación OpenAPI aprobada; 5 casos PostgreSQL de lectura/benchmark/fixture aprobados al cierre. Frontend: lint, TypeScript, 236 unitarios y build aprobados. E2E completo: 506 aprobados y 7 omisiones preexistentes; agenda final: 30/30 en 1440×900, 390×844 y 412×915, incluido axe con contraste, teclado, textos largos y navegación mobile.
- Performance: PostgreSQL 16 descartable, 100.000 turnos en 2 negocios y 365 fechas; EXPLAIN ANALYZE BUFFERS del SQL exacto para día, rango filtrado y descendente. Dos statements JDBC por página a tamaños 1/50/100, más una lectura fija de zona en servicio. Índices existentes, sin migraciones. Informe `Turnero-api/docs/qa/turn-90/agenda-performance.txt`. No se usó la DB local del usuario.
- Revisión visual del agente con capturas contra Stitch, conservadas en `turnero-frontend/docs/qa/turn-70/`. Browser sin navegadores disponibles; sesión local autenticada contra ambos procesos y aprobación manual del usuario pendientes. Guía frontend `docs/pruebas-locales-turn-70.md`; guía backend `docs/referencias/agenda-lectura.md`. Fixture de 106 turnos fechado validado únicamente en PostgreSQL descartable, no cargado en DB del usuario.
- Entrega: PRs pendientes de aprobación manual, uno contra `develop` y otro contra `dev`; integrar TURN-90 antes de TURN-70. No se consultó CI ni se creó/mergeó ningún PR.

- Preparación de QA manual (2026-10-20): a raíz de la agenda vacía observada por el usuario, se ejecutó `scripts/seed-local-agenda.sql` una vez en el contenedor local `turnero-postgres`, DB `turnero_dev`, negocio 1 (Barber Studio San Miguel), fecha 2026-10-20. Se verificaron 106 turnos: 22 PENDING y 21 por cada otro estado; final máximo 2026-10-21 00:30. No se cargó el benchmark. Aprobación manual y PRs siguen pendientes.

- Ajuste de QA manual (2026-10-20): por pedido del usuario, los 106 fixtures del 20/10 se reasignaron al catálogo existente del negocio local 1: 31 clientes, Mateo Ruiz/Lucas Fernández/Can Legui/Xavi y Xavier como referencia eliminada. Servicios asignados con precio/duración reales; solo se modificaron fixtures identificados por customer_notes. Profesional QA sintético sin turnos retirado lógicamente del catálogo. Script reproducible `scripts/reuse-local-agenda-catalog.sql`, ejecutado y verificado en PostgreSQL local.

- Normalización de QA manual (2026-10-20): por pedido del usuario, los 106 fixtures locales se reprogramaron con `scripts/schedule-local-agenda.sql`, manteniendo catálogo existente, horarios de negocio/profesional, asociaciones, duración/precio y excepciones. Cero solapamientos por profesional o cliente de cualquier estado; pendientes/confirmados futuros en profesionales activos; estados terminales en pasado. Distribución: 13/10=4, 17/10=13, 20/10=53, 21/10=32, 22/10=4. La lectura conserva historial. Se constató que admin valida cruces contra todos los estados y reserva pública solo PENDING/CONFIRMED; escrituras sin modificaciones.

### Refinamiento de producto — agenda temporal (2026-10-20)

- Implementadas las seis mejoras aprobadas por el usuario: escala de 30 minutos con alturas proporcionales y carriles para cruces, cabeceras profesionales/eje horario fijos dentro del scroll, condición Inactivo/Eliminado/No disponible, fecha legible con día de semana y Hoy, orden alfabético estable y línea de hora actual reactiva solo en el día del negocio. Desktop omite profesional redundante en tarjetas; mobile conserva nombre/condición y marcador Ahora.
- Backend agrega únicamente `staff_member.deleted_at` al DTO enriquecido de GET colección/detalle y su proyección SQL, incluyendo aislamiento de ese campo; escrituras sin cambios. Permite distinguir eliminados de inactivos sin inferencias por catálogo. Contrato y OpenAPI actualizados y campo comprobado en el servidor local.
- QA: suite backend completa 638/638, cero omisiones; frontend lint, TypeScript, 241 unitarios y build aprobados. Agenda E2E 33/33 en los tres tamaños, más 6 verificaciones finales de geometría/scroll/textos largos con la densidad final. Cobertura de proporcionalidad, adyacencia/solapamientos, orden/condiciones, reloj por minuto, cambios estacionales y medianoche; axe incluye contraste. Capturas vigentes actualizadas en docs/qa/turn-70 del frontend.
- Backend local reiniciado con make run en 8080; frontend conserva hot reload. Sin cambios en datos de turnos durante este refinamiento. QA manual del usuario y creación de los dos PRs siguen pendientes; sin consultar CI ni mergear.

### Intervalo de agenda desde configuración (2026-10-22)

- Reemplazadas las divisiones fijas de 30 minutos por `slot_interval_minutes` de GET booking-settings vía BFF. Opciones compartidas con Reglas de reserva: 15/30/45/60. Solo cambia las marcas y límites del eje; posiciones/duraciones mantienen su minuto exacto y escala proporcional.
- Consulta cancelable, key por negocio, carga/error/reintento sin fallback a 30 y recuperación 401/403 existentes. Lectura fresca al volver/foco. El guardado confirmado en Configuración cancela lecturas anteriores y publica el intervalo del servidor en la caché del mismo negocio. No cambió el contrato backend ni se modificaron datos locales.
- QA final: lint, TypeScript, 260 unitarios y build aprobados; agenda y Reglas de reserva E2E: 86 aprobados / 1 omisión preexistente en 1440×900, 390×844 y 412×915. Incluye intervalos permitidos, inicio fuera de marcas, duración proporcional, carga pendiente, errores/valor inválido/reintento, permisos, aislamiento de caché/cancelación y cambio Configuración → Agenda sin recarga. Dos fallos de validación coincidieron con una recarga de desarrollo durante la primera ejecución; la repetición con archivos estables aprobó todos los casos sin cambios adicionales de comportamiento.
- Capturas revisadas de 15 y 45 minutos guardadas en docs/qa/turn-70/slot-*.png. Guía manual actualizada. QA manual final y PRs siguen pendientes según el plan original; sin consultar CI ni mergear.

### Contexto del horario de atención — TURN-70 (2026-10-22)

- La agenda consulta GET business-hours y elige el día de la fecha seleccionada en la zona del negocio. Eje con al menos una hora antes/después de apertura/cierre, redondeado al intervalo; fondo gris rotulado fuera del horario. Conserva turnos atípicos y marcador actual, días cerrados con historial y vacío explicativo en días cerrados sin turnos. Mobile presenta horario/cierre junto a la lista, sin espacios artificiales.
- Caché por negocio, AbortSignal, lectura fresca al volver/foco y error/reintento sin horarios provisionales. Guardar en Horarios de atención cancela lecturas anteriores y publica la semana confirmada. Usa la semana actual de configuración, sin reconstrucción histórica ni excepciones por profesional. Backend, escrituras y datos locales sin cambios.
- QA automática: lint, TypeScript, 268 unitarios y build aprobados; Agenda/Horarios E2E 97 aprobados y 5 omisiones preexistentes. Seis recorridos finales aprobados para el ajuste del texto de las franjas, incluyendo axe y geometría. Capturas revisadas en 1440×900, 390×844 y 412×915, conservadas como hours-*.png en docs/qa/turn-70. Guía y patrones actualizados. Revisión manual y PRs pendientes; sin consultar CI ni integrar.

### Margen compacto y cierre grisado — TURN-70 (2026-10-22)

- Ajuste solicitado durante QA: el contexto de apertura/cierre usa un solo `slot_interval_minutes` por extremo, en lugar de una hora fija. Para 09–18 con intervalo 30, la grilla abarca 08:30–18:30. Mantiene alineación de marcas y expansión para turnos históricos/indicador actual fuera de ese rango.
- El gris cubre también el espacio de la última etiqueta y el borde inferior, tanto en columnas de profesionales como en eje horario: elimina la franja blanca que parecía disponible. Cobertura de límites con los cuatro intervalos y verificación geométrica del fondo hasta el borde. Backend y datos sin cambios. Patrones y guía manual actualizados; reemplaza el margen de una hora anterior.

Corrección final del margen (2026-10-22): un intervalo por extremo y gris hasta el borde de la última etiqueta. Lint, TypeScript, 271 unitarios, build y los 72 E2E de agenda aprobados en 1440×900, 390×844 y 412×915. Capturas hours-*.png y slot-*.png actualizadas. Aprobación manual final y PRs pendientes.

### Posición inicial en apertura — TURN-70 (2026-10-23)

- La grilla desktop abre posicionada en la apertura de la fecha seleccionada, con encabezados fijos. El margen gris anterior y cualquier historial temprano siguen accesibles al subir. El cálculo usa el instante de apertura en la zona del negocio y respeta el intervalo configurado; días cerrados con historial comienzan al inicio del rango. No reinicia el scroll manual al actualizarse el reloj. Mobile conserva su lista.
- QA: lint, TypeScript, 271 unitarios, build y 72 E2E de agenda aprobados en los tres tamaños. Incluye geometría de apertura bajo el encabezado, recuperación del margen al subir, conservación del scroll al avanzar el reloj y día cerrado. Captura desktop revisada en docs/qa/turn-70/opening-desktop.png; mobile sin cambios visuales. Guía y patrones actualizados. Sin cambios backend/DB, PRs y aprobación manual final pendientes.

### Botón Hoy seleccionado — TURN-70 (2026-10-23)

- Hoy usa el botón compartido subtle con texto primary cuando la fecha seleccionada coincide con hoy del negocio, mantiene acción habilitada y badge junto a la fecha. `aria-current="date"` comunica el estado; otras fechas usan outline sin aria-current. Responde a botón Hoy, anterior/siguiente y selector; sin cambios en consultas, zona o datos.
- QA: lint, TypeScript, 271 unitarios y build aprobados; 9 E2E de navegación/filtros/accesibilidad aprobados en 1440×900, 390×844 y 412×915. Incluye fecha de navegador distinta al negocio, activación/desactivación del resaltado y botón habilitado. Capturas revisadas today-selected-*.png, guía y patrones actualizados. Revisión manual final y PRs pendientes.

### Script reutilizable de agenda local (2026-10-23)

- Agregado `Turnero-api/scripts/seed-local-appointments.py`, complemento opcional del aprovisionamiento: objetivo 106 turnos totales entre hoy del negocio y dos días más, catálogo existente activo, servicios asignados con duración/precio reales, disponibilidad del backend y altas mediante POST administrativo. Solo PENDING/CONFIRMED futuros; sin modificar backend, reglas ni históricos.
- Simulación por defecto, perfil dev/URL local/negocio esperado, paginación completa, protección contra cruces de cualquier estado por profesional y cliente (incluido día anterior), revalidación antes de POST, verificación final, lote por fecha para reanudación sin duplicar. Si no alcanza capacidad completa, falla antes de altas; no abre días ni reactiva personas ni extiende fechas.
- Targets `make seed-local-appointments` / `make test-local-appointments`; guía `docs/referencias/seed-agenda-local.md`. Cookie local del OWNER por prompt oculto o entorno; no se guardan credenciales. 15 pruebas Python aprobadas sobre API simulada, CLI/help y diff-check verificados. Ejecución autenticada real/QA manual pendiente: no se cargaron turnos ni se tocó la DB local en esta mejora. Sin PR ni integración.

### Aprobación y preparación de PRs (2026-10-23)

- El usuario confirmó «Veo todo ok, armá el PR»: aprobación manual de la agenda y autorización de publicación de los dos PRs acordados. Bases remotas verificadas: backend develop 75fdcbc; frontend dev 87cbb44, ambas sin avances adicionales. Mantener orden de integración TURN-90 → TURN-70; PR #85 excluido.
- QA acumulada: backend 638 tests y benchmark PostgreSQL descartable de 100.000 filas; frontend lint/TypeScript/271 unitarios/build, suite completa previa 506 aprobados/7 omisiones y recorridos afectados finales 72 de agenda + 9 de navegación/Hoy, en los tres tamaños. Script reutilizable: 15 tests Python con API simulada; su ejecución autenticada contra DB local sigue pendiente y no se presenta como aprobada. No se consultó CI ni se integró automáticamente.

### PRs publicados (2026-10-23)

- Backend TURN-90: [PR #87](https://github.com/Candela-98/Turnero-api/pull/87), `feature/TURN-90-agenda-read` → `develop`.
- Frontend TURN-70: [PR #20](https://github.com/Candela-98/Turnero-frontend/pull/20), `feature/TURN-70-real-agenda` → `dev`.
- Aprobación manual y publicación autorizadas por el usuario. Integrar backend #87 antes de frontend #20. El script local conserva pendiente su ejecución autenticada real; 15 pruebas simuladas aprobadas. PR #85 excluido. Sin consultar CI ni realizar merge automático.
