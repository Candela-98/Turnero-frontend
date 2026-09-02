# Workflow de Drift Stitch - Turnero Frontend

## Propósito

Este documento define el proceso para detectar y corregir drift visual generado por Stitch al crear o refinar pantallas.

Usarlo en sesiones futuras antes de aprobar cualquier pantalla nueva o variante.

## Contexto

Stitch suele generar buen contenido, pero puede desviarse del sistema aprobado en detalles de shell, tokens, textos y estructura. El objetivo no es rediseñar cada pantalla, sino sincronizarla con las decisiones del MVP visual.

Fuente de verdad:

- `progreso-stitch.md`: IDs vigentes, pantallas aprobadas y referencias.
- `../decisiones-diseno-mvp.md`: reglas de producto, alcance y sistema visual.
- Layout base aprobado: `11bad5a952e2442eabb9b67ac558a116`.

## Regla principal

No aprobar una pantalla de Stitch solo por verse bien.

Primero:

1. Descargar el HTML.
2. Buscar drift con `rg`.
3. Corregir con un prompt estricto si hace falta.
4. Descargar y verificar de nuevo.
5. Actualizar los `.md` con el ID vigente.

## Drift comun detectado

### Shell admin

Problemás frecuentes:

- Usa `asíde` en lugar de `nav`.
- Usa `ml-64` en lugar de `md:ml-64`.
- Cambia `w-64` por `w-72`.
- Cambia `Agenda premium` por textos como `Premium Management` o `SaaS Pro`.
- Cambia `Barber Studio` por `BarberSaaS`.
- Cambia `Nuevo turno` por `New Appointment`, `Agendar Cita` o lo mueve arriba.
- Cambia `Configuración` por `Ajustes`.
- Agrega `Workspace`.
- Agrega texto `Admin` junto al avatar.
- Duplica o elimina iconos del topbar.

Shell admin correcto:

- Sidebar como `nav`.
- Sidebar con `bg-surface-container-low fixed left-0 top-0 h-full flex flex-col p-4 w-64 border-r-0 z-50 -translate-x-full md:translate-x-0 transition-transform duration-300`.
- Main wrapper con `md:ml-64 flex flex-col min-h-screen`.
- Logo `BS`: 40x40, `rounded-xl`, gradiente `from-primary to-primary-container`, `text-on-primary`, `text-xl`.
- Marca `Barber Studio`: `text-primary text-xl font-black`.
- Subtítulo `Agenda premium`.
- Navegación: Dashboard, Agenda, Clientes, Servicios, Profesionales, Configuración.
- CTA `Nuevo turno` abajo en la sidebar, separado de la navegación.
- Topbar: buscador global, notificaciones con punto rojo, `help_outline`, avatar circular con imagen.

### Tokens

Problemás frecuentes:

- Reaparecen `dark:`.
- Reaparecen `slate-`.
- Reaparecen `indigo-`.
- Reaparecen `bg-white`.
- Reaparecen `text-white`.
- Aparecen sombras o colores genéricos no tokenizados.

Regla:

Usar tokens del sistema:

- `surface`.
- `surface-container-low`.
- `surface-container-lowest`.
- `surface-container-high`.
- `primary`.
- `primary-container`.
- `primary-fixed`.
- `on-surface`.
- `on-surface-variant`.
- `outline-variant`.
- `tertiary-fixed`.
- `on-tertiary-fixed-variant`.
- `error`, `error-container`, `on-error-container` solo para errores reales.

### Badges y texto

Problemás frecuentes:

- Vuelven `uppercase`, `tracking-wide` o `tracking-wider`.
- Estados quedan en mayusculas.
- `Pendiente` usa rojo.
- `Inactivo` usa rojo.
- Chips informativos se ven como estados.

Reglas:

- Badges en sentence case.
- Sin uppercase forzado.
- Sin letter spacing forzado.
- `Activo`, `Disponible`, `Confirmado`, `Abierto`, `Activado`: verde positivo.
- `Pendiente`: primary suave.
- `Inactivo`, `Cerrado`, `Ocupado` sin error: neutro apagado.
- Rojo/error solo para bloqueo real, cancelacion crítica o error semántico.

### Selects

Problemás frecuentes:

- Stitch duplica flechas de selects.
- Agrega `expand_more` y mantiene flecha nativa.
- Usa `appearance-none` y luego agrega otro icono.

Regla aprobada para Agenda:

- Usar select nativo.
- No usar `expand_more`.
- No usar `appearance-none`.

### Booking cliente

Problemás frecuentes:

- Hereda tokens admin o clases genericas.
- Agrega elementos de admin.
- Pide login.
- Usa header sin marca consistente.
- Mezcla profesional con horario en una misma pill.

Reglas:

- Booking va separado del admin.
- Sin sidebar.
- Sin topbar admin.
- Sin login obligatorio.
- Header público con logo `BS` en gradiente y `Barber Studio` en `text-primary`.
- La pill del profesional debe ser clara, por ejemplo `Disponible hoy`; el horario elegido vive en `Día y horario`, resumen y sticky.

## Checklist de verificación por HTML

Después de generar o editar una pantalla, descargar el HTML y correr búsquedas.

Ejemplo:

```bash
curl -L "<downloadUrl>" -o /tmp/stitch-screen.html
```

### Shell admin

```bash
rg -n "<nav|<asíde|md:ml-64|[^d-]ml-64|w-64|w-72|Barber Studio|Agenda premium|Nuevo turno|Configuración|Ajustes|Workspace|BarberSaaS|Agendar Cita|New Appointment|Premium Management|Admin Console" /tmp/stitch-screen.html
```

Esperado:

- Aparece `nav`.
- No aparece `asíde`.
- Aparece `md:ml-64`.
- No aparece `ml-64` plano como wrapper principal.
- Aparece `w-64`.
- No aparece `w-72`.
- Aparecen `Barber Studio`, `Agenda premium`, `Nuevo turno`.
- No aparecen `Workspace`, `Ajustes`, `BarberSaaS`, `Agendar Cita`, `New Appointment`, `Premium Management`, `Admin Console`.

### Topbar

```bash
rg -n "Buscar turnos, clientes o servicios|notifications|help_outline|Admin" /tmp/stitch-screen.html
```

Esperado:

- Aparece el buscador global.
- Aparecen `notifications` y `help_outline`.
- No aparece texto `Admin` junto al avatar.

### Tokens prohibidos

```bash
rg -n "dark:|slate-|indigo-|bg-white|text-white" /tmp/stitch-screen.html
```

Esperado:

- Sin resultados.

### Badges y casíng

```bash
rg -n "uppercase|tracking-wider|tracking-wide|CONFIRMADO|PENDIENTE|text-error|bg-error|decoration-error" /tmp/stitch-screen.html
```

Esperado:

- Sin `uppercase` ni tracking en badges/chips.
- Sin estados en mayusculas.
- Error rojo solo si la pantalla es de errores/validaciones o hay bloqueo real.

### Agenda selects

```bash
rg -n "expand_more|appearance-none" /tmp/stitch-screen.html
```

Esperado para Agenda:

- Sin resultados.

### Booking

```bash
rg -n "Dashboard|Agenda|Clientes|Servicios|Profesionales|Configuración|Nuevo turno|Admin|login|password|dark:|slate-|indigo-|bg-white|text-white|uppercase|tracking-wider|tracking-wide" /tmp/stitch-booking.html
```

Esperado:

- Sin elementos admin.
- Sin login/password.
- Sin tokens genéricos ni uppercase/tracking.

## Prompt base para corregir drift de shell admin

Usar este prompt como base en `edit_screens` cuando una pantalla admin sale con drift:

```text
Refine this screen to strictly match the approved MVP Layout Base admin shell. Keep the content and layout intent, but fix shell and token drift.

Crítical shell fixes:
- Sidebar must be <nav>, not asíde.
- Sidebar classes equivalent to: bg-surface-container-low fixed left-0 top-0 h-full flex flex-col p-4 w-64 border-r-0 z-50 -translate-x-full md:translate-x-0 transition-transform duration-300.
- Main wrapper must be md:ml-64 flex flex-col min-h-screen.
- Logo must be 40x40 rounded-xl gradient from-primary to-primary-container, text-on-primary, text-xl, initials BS.
- Brand must be Barber Studio in text-primary text-xl font-black.
- Subtitle must be exactly Agenda premium.
- Sidebar nav labels exactly: Dashboard, Agenda, Clientes, Servicios, Profesionales, Configuración.
- Sidebar bottom CTA must be exactly Nuevo turno and placed at the bottom, separated from navigation.
- Topbar must include global search placeholder exactly Buscar turnos, clientes o servicios..., then notifications with red dot, help_outline, circular avatar image. Do not show text Admin.

Token/style fixes:
- Remove all dark:, slate-, indigo-, bg-white, text-white classes.
- Remove uppercase, tracking-wider and tracking-wide unless it is not visible UI text and cannot affect badges/chips.
- Use system tokens only.

Do not redesign the screen concept. This is a strict shell/token synchronization pass.
```

## Prompt base para corregir booking

```text
Refine this mobile booking screen as a public booking flow, not an admin screen.

Keep the flow and content, but fix token and brand drift:
- No admin shell, no sidebar, no admin nav.
- No login required.
- Remove dark:, slate-, indigo-, bg-white, text-white, uppercase, tracking-wide/wider.
- Header public brand: BS logo 40x40 rounded-xl gradient from-primary to-primary-container, text-on-primary; Barber Studio in text-primary; subtitle in text-on-surface-variant.
- Use system tokens only.
- Keep progress compact and in sentence case.
- Keep sticky CTA visible and do not cover content.
```

## Cuando actualizar los documentos

Actualizar `progreso-stitch.md` cuando:

- Se crea una pantalla nueva.
- Se reemplaza el ID vigente de una pantalla.
- Se descarta una variante.
- Se crea una pantalla de referencia.
- Se verifica una correccion de drift.

Actualizar `../decisiones-diseno-mvp.md` cuando:

- Cambia una regla del sistema visual.
- Se decide incluir/excluir algo del MVP.
- Se define una regla reusable: badges, empty states, errores, loading, responsive, etc.

## Criterio final

Una pantalla queda aprobada solo si:

- El usuario la valida visualmente.
- El HTML no muestra drift relevante.
- El ID vigente queda documentado.
- Las decisiones nuevas quedan registradas.
