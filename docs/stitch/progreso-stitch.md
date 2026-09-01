# Progreso Stitch - Turnero Frontend

Fecha de inicio: 2026-04-28

## Propósito

Este documento registra el avance concreto de pantallas en Stitch para el MVP visual de Turnero.

Usar este archivo para seguimiento operativo de pantallas:

- Qué pantalla se está creando o refinando.
- Estado de revisión.
- ID o link de Stitch.
- Cambios realizados.
- Pendientes.
- Decisiones puntuales tomadas durante esa pantalla.

Las decisiones generales de producto y diseño viven en `../decisiones-diseno-mvp.md`.

El proceso para detectar y corregir drift generado por Stitch vive en `workflow-drift-stitch.md`.

El traspaso a implementación vive en `../handoff-implementacion-mvp.md`.

## Proyecto Stitch

Proyecto:

https://stitch.withgoogle.com/projects/10594197106398501653

Nombre:

Agenda Pro SaaS

Uso:

Fuente visual del MVP de Turnero.

## Estados posibles

- Pendiente.
- En progreso.
- Lista para revisar.
- Revisada.
- Aprobada.
- Post-MVP.

## Pantallas MVP

| Pantalla | Estado | Stitch ID / link | Notas |
| --- | --- | --- | --- |
| Layout base | Aprobada | `11bad5a952e2442eabb9b67ac558a116` | Pantalla generada: MVP Layout Base - Admin Shell. Shell admin aprobado como base para pantallas administrativas. |
| Login | Aprobada | `b0a126ddafe547e09bbe457c62d285a4` | Pantalla aprobada: Login admin - Barber Studio. Google como acceso principal; sin email/password propio; sin decoración diagonal. |
| Dashboard admin | Aprobada | `d41eaa1b8e464533bfb4289ddb04099d` | Pantalla aprobada: Dashboard admin - Synced Shell. Shell verificado técnicamente. |
| Agenda desktop día | Aprobada | `1f39597d9d5a4021b9187eebd032376d` | Pantalla aprobada: Agenda Diaria - Barber Studio (Synced Shell). Shell alineado; badges y filtros refinados. Versiones anteriores eliminadas. |
| Agenda admin mobile | Aprobada | `bc526a68e8784ac2b1968fb199d7d101` | Pantalla aprobada: mobile admin multi-profesional con layout igual a la vista Mateo, tipografía/espaciado sincronizados, fecha/cards/hora sincronizadas, caso de dos profesionales ocupados en el mismo horario, header/bottom nav sincronizados, filtros separados, slots disponibles, badges, acciones, CTA y pills sincronizadas. |
| Agenda admin mobile - profesional | Aprobada | `d0658516cb484d1c91bd02907d0a175a` | Variante aprobada: filtro `Mateo` activo con filtros separados por profesional/estado, slots disponibles compactos, ejemplo pendiente, badges, CTA, acciones de card, acento pendiente y bottom nav alineados al layout mobile base. |
| Crear / editar turno | Aprobada | `981daaf97ed74431822d136230438573` | Pantalla aprobada: drawer desktop creado, shell/topbar sincronizados, badges alineados y footer simplificado. |
| Crear / editar turno mobile | Aprobada | `a1e231c2f4594b90a1e98e2076fbbb5b` | Pantalla aprobada: flujo full-screen para crear turno desde slot disponible, task header sin logo, sin guardar borrador, con formulario compacto y footer sticky. |
| Booking mobile | Aprobada | `0769a64ce26a4a48860682085f16f15c` | Pantalla aprobada: Unified Single-Page Booking Flow mobile refinado con tokens, progreso, carrusel, header de marca y estado profesional corregidos. |
| Booking confirmación | Aprobada | `d14ce2d21be44722b8f03586422fab39` | Pantalla aprobada: post-confirmación del booking cliente con detalle del turno, acciones posteriores y tokens públicos verificados. |
| Clientes | Aprobada | `9ebb6dac94e94baca6700d97b5eb8fa9` | Pantalla aprobada: Clientes admin - Refined Shell & Tokens. Shell alineado al Layout Base; estados simplificados para MVP. |
| Perfil de cliente | Aprobada | `12c8c03979e54112b39266b5079bc3a4` | Pantalla aprobada: Perfil de cliente admin - Badge Refinement. Badges alineados a la regla global. |
| Servicios | Aprobada | `8fa44ef2a5c94ec68fb4670c9f381b99` | Pantalla aprobada: Servicios admin - Synced Shell & Tokens (Final). Shell y tokens verificados; disponibilidad de profesionales refinada. |
| Profesionales | Aprobada | `c1d751f330214f60a33f93c6b61b0163` | Pantalla aprobada: Profesionales admin - Synced Shell & Tokens (Final). Acciones por fila simplificadas; chips de servicios refinados. |
| Configuración del negocio | Aprobada | `8e9e601527d54bbe80d719eb516524ce` | Pantalla aprobada: Configuración - Synced Shell & Tokens. Horarios configurables, excepciones/feriados y reglas editables. |

## Cierre MVP visual

Estado general:

MVP visual principal cerrado y aprobado.

Pantallas core incluidas:

- Admin/negocio: Login, Layout base, Dashboard, Agenda día, Crear / editar turno, Clientes, Perfil de cliente, Servicios, Profesionales y Configuración.
- Admin mobile: Agenda mobile `Todos`, Agenda mobile por profesional y primera propuesta de Crear / editar turno mobile.
- Cliente: Booking mobile single-page y confirmación post-reserva.

Alcance cubierto:

- Operación diaria de agenda.
- Alta/edición de turno desde admin.
- Gestión de clientes y perfil.
- Gestión de servicios.
- Gestión de profesionales sin vista dedicada propia.
- Configuración base del negocio, horarios, excepciones/feriados y reglas de reserva.
- Booking cliente mobile-first sin login obligatorio.

Fuera del MVP visual principal:

- Vista dedicada de profesional.
- Portal cliente logueado / Mis turnos.
- Vista mes de agenda.
- Analytics avanzado.
- Multi-negocio, multi-sucursal y marketplace.
- Editor avanzado de disponibilidad por profesional.

Pendientes antes de implementación:

- Seguir el orden y la Definition of Done visual definidos en `../handoff-implementacion-mvp.md`.

## Pantallas de referencia

| Pantalla | Estado | Stitch ID / link | Notas |
| --- | --- | --- | --- |
| Empty states MVP | Referencia | `404a4f34e13248ae80240a31b374a96b` | Pantalla de referencia para estados vacíos MVP. Incluye Agenda, Clientes, Servicios, Profesionales y Booking. Shell/tokens verificados. |
| Errors & validations MVP | Referencia aprobada | `4df8880eac2c40d98c4bef3753f5ae4f` | Pantalla de referencia para errores y validaciones MVP. Incluye crear/editar turno y booking cliente. Shell/tokens y CTA de sidebar verificados. |
| Loading states MVP | Referencia aprobada | `b6235f4af54f41d8a6bfd18c23711949` | Pantalla de referencia para loading/skeleton states MVP. Incluye Dashboard, Agenda, listas admin, crear turno, booking y login. Shell/tokens verificados. |
| Notificaciones admin mobile | Referencia aprobada | `6190510a5407468d9bd2a8246b11f4e3` | Pantalla de referencia mobile para notificaciones operativas. Shell mobile, tokens, badges, acciones, filtros y bottom nav verificados. |

## Uso de las referencias

Las pantallas de este documento sirven para validar el diseño y localizar su Stitch ID vigente. No determinan la prioridad de desarrollo: consultar `../tracking-implementacion-mvp.md` antes de iniciar una pantalla.

## Registro de avances

Este registro queda compactado para reflejar solo pantallas vigentes en el proyecto de Stitch. Las variantes intermedias eliminadas del proyecto no se mantienen como referencia operativa.

### Preparación

- Idioma de UI: español.
- Negocio demo: Barber Studio.
- Proyecto Stitch vigente: `10594197106398501653`.
- Modelo preferido para nuevas pantallas/refinamientos: `GEMINI_3_1_PRO`.
- Decisión: usar el proyecto actual de Stitch como fuente visual del MVP y eliminar pantallas intermedias que generen ruido.

### Pantallas core vigentes

#### Layout base

- Stitch ID vigente: `11bad5a952e2442eabb9b67ac558a116`.
- Título en Stitch: MVP Layout Base - Admin Shell.
- Estado: aprobada.
- Uso: shell administrativo desktop base para pantallas internas.
- Decisión: mantener sidebar `w-64`, marca `Barber Studio`, subtítulo `Agenda premium`, topbar con buscador global, notificaciones, ayuda, avatar y CTA `Nuevo turno` al pie de la sidebar.

#### Login admin

- Stitch ID vigente: `b0a126ddafe547e09bbe457c62d285a4`.
- Título en Stitch: Login admin - Barber Studio.
- Estado: aprobada.
- Decisión: Google/proveedor externo como acceso principal; no email/password propio ni registro público en MVP.

#### Dashboard admin

- Stitch ID vigente: `d41eaa1b8e464533bfb4289ddb04099d`.
- Título en Stitch: Dashboard admin - Synced Shell.
- Estado: aprobada.
- Uso: resumen operativo diario con semana como lectura secundaria simple.
- QA: conserva una variante algo más antigua del shell en espaciado/clases y un icono `event_note`; visualmente está aprobada, pero conviene revisar si se busca paridad estricta antes de implementar.

#### Agenda desktop día

- Stitch ID vigente: `1f39597d9d5a4021b9187eebd032376d`.
- Título en Stitch: Agenda Diaria - Barber Studio (Synced Shell).
- Estado: aprobada.
- Uso: pantalla central de operación diaria desktop.
- Decisiones: vista día como foco MVP; filtros con selects nativos; `Nuevo turno` queda en sidebar; crear turno rápido desde slot queda como idea futura/post-MVP.

#### Crear / editar turno

- Stitch ID vigente: `981daaf97ed74431822d136230438573`.
- Título en Stitch: Crear / editar turno - Synced Shell & Topbar (Final).
- Estado: aprobada.
- Uso: drawer desktop para crear/editar turno desde agenda.
- Decisiones: sin `Guardar borrador`; footer con total y acciones `Cerrar` / `Crear turno`; estados disponibles en verde positivo y ocupado neutro.

#### Clientes admin

- Stitch ID vigente: `9ebb6dac94e94baca6700d97b5eb8fa9`.
- Título en Stitch: Clientes admin - Datos de visitas restaurados.
- Estado: aprobada.
- Uso: gestión operativa y relacional de clientes, no tabla CRUD pesada.
- Decisiones: badges como señal de estado; `Nuevo` no se usa como estado de fila en MVP; panel lateral con próximo turno y notas internas.

#### Perfil de cliente

- Stitch ID vigente: `12c8c03979e54112b39266b5079bc3a4`.
- Título en Stitch: Perfil de cliente admin - Badge Refinement.
- Estado: aprobada.
- Uso: detalle relacional de cliente con historial, próximo turno y acciones.

#### Servicios admin

- Stitch ID vigente: `8fa44ef2a5c94ec68fb4670c9f381b99`.
- Título en Stitch: Servicios admin - Synced Shell & Tokens (Final).
- Estado: aprobada.
- Uso: gestión operativa de oferta de servicios.
- Decisión: usar `Disponible con` en lugar de `Profesionales asignados` para evitar lenguaje técnico.

#### Profesionales admin

- Stitch ID vigente: `c1d751f330214f60a33f93c6b61b0163`.
- Título en Stitch: Profesionales admin - Synced Shell & Tokens (Final).
- Estado: aprobada.
- Uso: gestión operativa del equipo y disponibilidad.
- Decisiones: acciones visibles `Ver agenda` y `Editar`; sin menu de más acciones para MVP; servicios/especialidades son chips informativos, no estados; una misma persona puede ser admin, profesional o ambos sin duplicarse.

#### Configuración del negocio

- Stitch ID vigente: `8e9e601527d54bbe80d719eb516524ce`.
- Título en Stitch: Configuración - Synced Shell & Tokens.
- Estado: aprobada.
- Uso: identidad, horarios, excepciones/feriados y reglas de reserva.
- Decisiones: horarios configurables por día; demo martes a sabado 09:00-20:00; ventana de reserva de 7 días; excepciones/feriados visibles para bloquear o ajustar horarios.

### Pantallas mobile/admin vigentes

#### Agenda admin mobile - Todos

- Stitch ID vigente: `bc526a68e8784ac2b1968fb199d7d101`.
- Título en Stitch: Agenda móvil Todos - Refined Typography & Spacing.
- Estado: aprobada.
- Uso: referencia mobile multi-profesional para operar el día desde celular.
- Decisiones: mobile admin es canal principal para el público objetivo; conviven vista `Todos` y vista por profesional; filtros separados en `Profesionales` y `Estados`; CTA sticky `Nuevo turno`; bottom nav con `Agenda`, `Clientes`, `Servicios`, `Más`.

#### Agenda admin mobile - Profesional

- Stitch ID vigente: `d0658516cb484d1c91bd02907d0a175a`.
- Título en Stitch: Agenda Móvil Mateo - Refined Slots Consistency.
- Estado: aprobada.
- Uso: referencia mobile cuando el admin filtra por un profesional.
- Decisiones: el contexto superior define el profesional; las disponibilidades no repiten el nombre del profesional; CTA `Nuevo turno` implica profesional preseleccionado.

#### Crear / editar turno mobile

- Stitch ID vigente: `a1e231c2f4594b90a1e98e2076fbbb5b`.
- Título en Stitch: Crear turno mobile - Admin Flow.
- Estado: aprobada.
- Uso: flujo full-screen para crear turno desde slot disponible.
- Decisión: pantallas transaccionales mobile pueden usar task header sin logo `BS`; sin `Guardar borrador`.

### Booking cliente vigente

#### Booking mobile

- Stitch ID vigente: `0769a64ce26a4a48860682085f16f15c`.
- Título en Stitch: Booking mobile - Professional Status Copy.
- Estado: aprobada.
- Uso: Unified Single-Page Booking Flow mobile-first para cliente.
- Decisiones: separado del admin; sin login obligatorio; profesional puede mostrar `Disponible hoy`, pero el horario elegido vive en `Día y horario`, resumen y sticky.

#### Booking confirmación

- Stitch ID vigente: `d14ce2d21be44722b8f03586422fab39`.
- Título en Stitch: Booking mobile - Confirmation Success.
- Estado: aprobada.
- Uso: post-confirmación del booking cliente.
- Decisiones: mostrar detalle del turno, política breve y acciones posteriores sin introducir cuenta cliente.

### Pantallas de referencia vigentes

#### Empty states MVP

- Stitch ID vigente: `404a4f34e13248ae80240a31b374a96b`.
- Título en Stitch: Empty states MVP - Reference (Synced Shell).
- Estado: referencia.
- Uso: referencia visual para estados vacíos de Agenda, Clientes, Servicios, Profesionales y Booking.

#### Errors & validations MVP

- Stitch ID vigente: `4df8880eac2c40d98c4bef3753f5ae4f`.
- Título en Stitch: Errors & validations MVP - Reference.
- Estado: referencia aprobada.
- Uso: referencia visual para errores y validaciones de crear/editar turno y booking cliente.

#### Loading states MVP

- Stitch ID vigente: `b6235f4af54f41d8a6bfd18c23711949`.
- Título en Stitch: Loading states MVP - Reference.
- Estado: referencia aprobada.
- Uso: referencia visual para skeleton/loading states de Dashboard, Agenda, listas admin, crear turno, booking y login.

#### Notificaciones admin mobile

- Stitch ID vigente: `6190510a5407468d9bd2a8246b11f4e3`.
- Título en Stitch: Notificaciones admin mobile - Filter Refinement Final.
- Estado: lista para revisar.
- Uso: referencia mobile para notificaciones operativas.
- Ajuste aplicado: filtros/pills alineados con Agenda mobile: label `Tipo`, `rounded-full`, activo `bg-primary-fixed text-on-primary-fixed`, inactivos `bg-surface-container-low text-on-surface-variant`.
- Decisión: no se crea pantalla dedicada de detalle de notificación para MVP; las acciones derivan al turno, cliente, agenda o configuración correspondiente.

### QA visual final MVP

- Estado: documentado con backlog menor.
- Pantallas revisadas técnicamente: core desktop, mobile admin, booking cliente y referencias principales.
- Hallazgos sin bloqueo:
  - Booking se mantiene separado del admin.
  - Shell desktop aparece consistente en la mayoria de pantallas.
  - Agenda mobile mantiene bottom nav e iconos aprobados.
- Backlog de diseño:
  - Decidir si se corrigen micro-labels desktop con `uppercase`, `tracking-wider` o `text-[10px]` antes de implementar.
  - Revisar Dashboard si se quiere paridad estricta de shell con Layout Base.
  - No mostrar `Logout` en la sidebar; resolver salida/cuenta desde perfil o configuración durante implementación.
- Recomendacion:
  - No reabrir pantallas core por micro-labels salvo que visualmente molesten.
  - Antes de implementar, transformar estás diferencias en reglas de componentes: filtros mobile, badges, labels secundarios, bottom nav, shell desktop y header mobile.
  - El detalle de reglas para implementación queda registrado en `../decisiones-diseno-mvp.md`.

## Pendientes antes de editar pantallas

- Antes de seguir refinando pills/badges por pantalla, aplicar la regla global definida en `../decisiones-diseno-mvp.md`:
  - `Activo`, `Disponible` y `Confirmado`: verde claro del sistema, usando como referencia el pill `Activo` de Servicios admin.
  - `Pendiente` y `Nuevo`: neutro o primary suave.
  - `Inactivo`: neutro apagado, no rojo.
  - `Cancelado`, `Error` y `Bloqueado`: error semántico.
  - Chips de servicios/categorías/especialidades: informativos, no estados.

## Datos de ejemplo

Los datos demo para pantallas viven en `../referencias/datos-demo.md`.
