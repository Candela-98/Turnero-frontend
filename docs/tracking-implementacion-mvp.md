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
