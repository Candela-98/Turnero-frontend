# Turnero Frontend - Handoff de Implementación MVP

Fecha: 2026-05-11

## Propósito

Este documento resume las reglas de diseño y componentes para implementar el frontend desde cero usando Stitch como fuente visual del MVP.

No reemplaza a:

- `decisiones-diseno-mvp.md`: decisiones de producto y diseño.
- `stitch/progreso-stitch.md`: IDs vigentes de pantallas.
- `stitch/workflow-drift-stitch.md`: checklist para detectar drift en Stitch.

## Fuente visual

Proyecto Stitch:

https://stitch.withgoogle.com/projects/10594197106398501653

Pantallas base vigentes:

| Uso | Stitch ID |
| --- | --- |
| Layout base desktop | `11bad5a952e2442eabb9b67ac558a116` |
| Dashboard admin | `d41eaa1b8e464533bfb4289ddb04099d` |
| Agenda desktop día | `1f39597d9d5a4021b9187eebd032376d` |
| Crear / editar turno desktop | `981daaf97ed74431822d136230438573` |
| Agenda mobile Todos | `bc526a68e8784ac2b1968fb199d7d101` |
| Agenda mobile profesional | `d0658516cb484d1c91bd02907d0a175a` |
| Crear turno mobile | `a1e231c2f4594b90a1e98e2076fbbb5b` |
| Booking mobile | `0769a64ce26a4a48860682085f16f15c` |
| Booking confirmación | `d14ce2d21be44722b8f03586422fab39` |
| Notificaciones mobile | `6190510a5407468d9bd2a8246b11f4e3` |

## Principios

- Admin, login y booking son layouts separados.
- Agenda es la pantalla central del producto.
- Booking cliente no usa login obligatorio en MVP.
- No copiar variaciones accidentales de Stitch: normalizar contra los componentes definidos acá.
- Usar tokens del sistema, no colores genéricos `slate`, `indigo`, `bg-white`, `text-white` ni clases `dark:`.
- Evitar `uppercase` y `tracking` como default visual.
- No mostrar `Logout` como item visible en sidebar; resolver cuenta/salida desde perfil, menu de usuario o configuración.

## Shell Desktop

Referencia principal: Layout base `11bad5a952e2442eabb9b67ac558a116`.

Estructura:

- Sidebar fija `w-64`.
- Fondo sidebar `surface-container-low`.
- Main con offset `md:ml-64`.
- Marca:
  - Logo `BS`, 40x40, `rounded-xl`.
  - Gradiente `from-primary to-primary-container`.
  - Texto `text-on-primary`.
  - Nombre `Barber Studio` en `text-primary`.
  - Subtítulo `Agenda premium`.
- Navegación:
  - Dashboard.
  - Agenda.
  - Clientes.
  - Servicios.
  - Profesionales.
  - Configuración.
- CTA global:
  - `Nuevo turno`.
  - Persistente al pie de sidebar.
- Topbar:
  - Buscador global `Buscar turnos, clientes o servicios...`.
  - Notificaciones.
  - Ayuda `help_outline`.
  - Avatar.

Reglas:

- No usar `Ajustes` si la navegación principal dice `Configuración`.
- No agregar `Workspace`, `Admin Console`, `SaaS Pro`, `BarberSaaS` ni labels internos.
- Si una pantalla de Stitch aprobada difiere levemente del shell base, implementar el shell base.

## Header Mobile Admin

Usar para pantallas sección:

- Agenda mobile.
- Notificaciones.
- Futuras vistas mobile de Clientes, Servicios o Más.

Estructura:

- Logo `BS` igual al desktop.
- Marca `Barber Studio` en `text-primary`.
- Subtítulo contextual: `Agenda de hoy`, `Notificaciones`, etc.
- Acciones derechas:
  - Notificaciones.
  - Ayuda.
  - Avatar.

Pantallas transaccionales:

- Crear turno mobile puede usar task header sin logo.
- El header debe priorizar volver/cerrar, título y contexto corto.

## Bottom Nav Mobile

Items MVP:

- `Agenda`.
- `Clientes`.
- `Servicios`.
- `Más`.

Iconos:

- `calendar_today`.
- `group`.
- `content_cut`.
- `more_horiz`.

Activo:

- `bg-surface-container-low`.
- `text-primary`.
- `rounded-xl`.

Labels:

- `font-label text-xs font-medium`.
- Sentence case.
- Sin uppercase ni tracking.

## Filtros y Pills

Referencia principal: Agenda mobile.

Pills mobile:

- `rounded-full`.
- `px-4 py-1.5`.
- `font-label text-sm font-medium`.

Activo:

- `bg-primary-fixed`.
- `text-on-primary-fixed`.

Inactivo:

- `bg-surface-container-low`.
- `text-on-surface-variant`.
- Hover: `surface-container-high`.

Agrupacion:

- Usar labels chicos cuando haya más de un eje:
  - `Profesionales`.
  - `Estados`.
  - `Tipo`.

No hacer:

- No usar `rounded-xl` para filtros mobile.
- No hacer que el filtro activo parezca CTA.
- No usar `bg-primary-container text-on-primary-container` para filtros.

## Badges de Estado

Regla general:

- Badges en sentence case.
- Sin uppercase ni tracking.
- No usar badges como decoración.

Positivos:

- Estados: `Activo`, `Disponible`, `Confirmado`, `Abierto`, `Activado`.
- Color: `bg-tertiary-fixed/20 text-on-tertiary-fixed-variant`.
- Acento lateral confirmado: `bg-tertiary-fixed-dim`.

Pendientes:

- Estado: `Pendiente`.
- Color: `bg-primary-fixed/40 text-primary`.
- Acento lateral: `bg-primary-fixed-dim`.

Neutros:

- Estados: `Inactivo`, `Cerrado`, `Ocupado` sin error.
- Usar superficie neutra apagada.
- No usar rojo.

Errores:

- Reservar `error` para fallos reales, cancelaciones críticas o bloqueos semánticos.

## Cards de Turno

Desktop:

- Priorizar lectura de hora, cliente, servicio y profesional.
- Usar superficies tonales y acentos laterales.
- Evitar bordes fuertes.

Mobile:

- Card con fondo `surface-container-lowest`.
- Acento lateral absoluto.
- Acciones tactiles:
  - Chat/WhatsApp: `chat_bubble`.
  - Editar: `edit`.
  - Confirmar: `check_circle`.
- Botónes de icono:
  - `w-9 h-9`.
  - `rounded-lg`.
  - `bg-surface-container-low`.

Pendiente mobile:

- Debe mostrar acción `Confirmar`.
- Puede incluir nota breve tipo `Confirmar por WhatsApp`.

## Slots Disponibles

Referencia: Agenda mobile.

Reglas:

- Mostrar `Disponible`.
- Mostrar duración como metadatos secundaria.
- Acción inline: `add_circle` + `Crear turno`.
- En vista `Todos`, indicar profesional disponible o cantidad explícita.
- En vista filtrada por profesional, no repetir el nombre del profesional.

No usar:

- `Hueco libre`.
- Disponibilidad ambigua sin profesional o cantidad.

## Formularios y Drawer

Desktop:

- Crear/editar turno usa drawer lateral.
- Fondo de agenda puede quedar visible pero no debe competir.
- Sin `Guardar borrador`.
- Footer con total y acciones principales.

Mobile:

- Crear turno usa pantalla full-screen transacciónal.
- Header de tarea sin logo permitido.
- CTA principal sticky.
- Campos compactos, agrupados por secciones claras.

## Booking Cliente

Reglas:

- Separado del admin.
- Sin sidebar.
- Sin topbar administrativa.
- Sin login obligatorio.
- Header público con `BS` y `Barber Studio`.
- Progreso compacto.
- Sticky inferior con resumen y CTA.

Profesional:

- Puede mostrar `Disponible hoy`.
- No poner horario dentro del estado del profesional.
- El horario elegido vive en `Día y horario`, resumen y sticky.

Confirmación:

- Pantalla separada aprobada.
- Mostrar detalle del turno, política breve y acciones posteriores.
- No introducir cuenta cliente en MVP.

## Estados

Empty states:

- Calmos, especificos y accionables.
- Una acción principal.
- Acción secundaria solo si ayuda.
- Sin rojo/error.

Loading:

- Usar skeletons por contexto.
- Evitar loader genérico si ya hay estructura de pantalla.

Errores y validaciones:

- Explicar qué pasó.
- Decir qué hacer después.
- Mostrar cerca del lugar donde ocurre.
- Rojo solo si bloquea.
- Evitar mensajes técnicos.

Notificaciones:

- Lista mobile aprobada como referencia.
- No crear detalle de notificación para MVP.
- Acciones derivan al turno, cliente, agenda o configuración correspondiente.

## Usuarios y Profesionales

Modelo:

- Una misma persona puede ser `Admin`, `Profesional` o ambas cosas.
- El perfil de profesional puede estar vinculado a una cuenta de usuario.
- No duplicar a la misma persona como admin por un lado y barbero por otro.

Regla MVP:

- Si el administrador también atiende turnos, debe poder aparecer en `Profesionales`.
- Ese profesional puede tener servicios, agenda, disponibilidad y turnos.
- En UI, expresar la relación con una opción simple como `También atiende turnos` o `Este usuario atiende servicios`, según el contexto.
- Esto no habilita un portal profesional ni login propio en MVP.

Post-MVP:

- Permisos detallados por rol.
- Acciones específicas por rol.
- Portal o vista dedicada para profesionales.

## Backlog Post-MVP

No entra en el MVP:

- Vista dedicada de profesional.
- Portal cliente logueado / Mis turnos.
- Vista mes de agenda.
- Analytics avanzado.
- Multi-negocio.
- Multi-sucursal.
- Marketplace.
- Editor avanzado de disponibilidad por profesional.
- Registro público self-service.

## Checklist Antes de Implementar

- Confirmar que se usan solo IDs vigentes de `stitch/progreso-stitch.md`.
- Implementar tokens/componentes antes de pantallas.
- Normalizar shell desktop contra Layout Base.
- Normalizar mobile admin contra Agenda mobile.
- Mantener booking separado.
- No copiar `Logout` en sidebar.
- No copiar micro-labels con uppercase/tracking como default.
- Revisar contraste y targets tactiles en mobile.

## Relación con el tracking

Este documento define cómo implementar una pantalla, no cuál implementar primero. Consultar `tracking-implementacion-mvp.md` para la prioridad vigente y `roadmap.md` para los hitos del producto.

## Definition of Done Visual

Antes de considerar terminada una pantalla:

- Usa layout correcto: admin desktop, admin mobile, task mobile o booking público.
- No mezcla admin con booking.
- Usa componentes compartidos para badges, filtros, botónes y cards.
- No introduce `dark:`, `slate-`, `indigo-`, `bg-white`, `text-white`, `uppercase` o `tracking` como defaults.
- Textos caben en mobile y desktop.
- Acciones tactiles mobile tienen tamano comodo.
- Estados usan semantica correcta de color.
- La pantalla se compara contra el ID vigente de Stitch correspondiente.
