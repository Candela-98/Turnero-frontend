# Patrones mobile

## Propósito

Esta guía convierte las decisiones visuales del MVP en reglas implementables para pantallas mobile. Evita que una vista se limite a comprimir desktop y previene solapamientos con navegación, safe areas o acciones fijas.

No redefine producto ni Stitch: consultar `decisiones-diseno-mvp.md`, `handoff-implementacion-mvp.md` y `stitch/progreso-stitch.md` para esas fuentes.

## Elegir el shell

| Contexto | Shell | Navegación/acción |
| --- | --- | --- |
| Sección principal del admin | `AdminAppShell` | Header de marca y bottom nav fija. |
| Tarea o edición focalizada | `TaskMobileHeader` | Volver/cerrar; sin marca redundante. |
| Reserva pública | `BookingPublicShell` | Sin navegación admin; footer propio si tiene CTA. |

No mezclar shell administrativo con booking público. Las tablas desktop se convierten en listas o cards verticales en mobile.

## Contrato espacial del admin

- Breakpoint del shell: `< 768px` mobile; `>= 768px` desktop.
- El shell desktop ya aporta el landmark `main` y el padding exterior. Las secciones que renderiza usan `section`, sin repetir ese padding.
- Configuración y Servicios comparten `AdminPageHeader` y un contenedor `max-w-4xl`: título, descripción y margen superior mantienen la misma jerarquía; el contenido conserva la estructura propia del formulario o listado.
- La bottom nav mide `calc(4.75rem + env(safe-area-inset-bottom))`, incluye la zona segura y permanece fija.
- Todo contenido de una sección admin debe reservar padding inferior al menos igual a esa navegación.
- Formularios admin de página usan `AdminPageSection withSaveAction` y `AdminFormActions`: compone `AdminMobileStickyAction` inmediatamente arriba de la bottom nav y reserva su altura en el contenido.
- Solo una acción primaria contextual por pantalla. La acción fija debe indicar carga/deshabilitado y no duplicarse como CTA visible en mobile.
- Header y navegación usan z-index separados: header `z-20`, acción contextual `z-30`, bottom nav `z-40`.

## Densidad, tipografía y controles

- Mobile usa una columna para formularios; mantener controles de al menos `44px` de alto y labels siempre visibles.
- Títulos de sección, descripción y márgenes superiores deben ser más compactos que desktop, sin quitar contexto útil.
- Mantener padding horizontal de `16–20px` para contenido; cards pueden ocupar todo el ancho si preservan padding interno.
- Nombres de negocio se truncan en header antes de desplazar acciones.
- Fechas/horas largas tienen variante compacta en mobile; la versión completa puede mantenerse desde `md`.
- Para respuestas de guardado, usar `FloatingAlert` por encima de la acción fija y la navegación: éxito visible sin scroll, descartable y con cierre automático a los 6 s; error de guardado persistente con cierre y reintento. El aviso no debe tapar controles críticos. Para errores de validación, mostrar el mensaje específico junto a cada campo; después de guardar, desplazar suavemente y enfocar el primero inválido, respetando la preferencia de movimiento reducido. No repetir estos errores en un aviso flotante.
- `FloatingAlert` usa `placement="viewport"` por defecto y acompaña el scroll. Desktop lo ubica a la derecha; `AdminFormActions` reserva altura sobre Guardar automáticamente. Mobile mantiene la separación con la acción fija y la navegación. Ver composición y pruebas compartidas en `patrones-pantallas.md`.

## QA obligatorio

Antes de cerrar una pantalla mobile:

1. Revisar en `390×844` y `412×915`.
2. Confirmar que el último campo y la acción primaria quedan completamente por encima de la bottom nav y de la safe area.
3. Probar scroll hasta el final, validación, loading, éxito, error y reintento.
4. Verificar targets táctiles, foco visible, labels, truncado y textos sin corte horizontal.
5. Comparar contra la referencia Stitch vigente y ejecutar los E2E mobile correspondientes.

## Referencias de implementación

- `AdminAppShell` y Agenda mobile: shell administrativo y lista cronológica de lectura, sin CTA demo de crear turnos.
- Configuración del negocio: formulario con `AdminMobileStickyAction`.
- `TaskMobileHeader`: flujos de crear/editar.
- `BookingPublicShell`: reserva cliente mobile-first.

### Grilla temporal de agenda — mejora aprobada por el usuario

Escala continua con divisiones según `slot_interval_minutes` de `GET /booking-settings` (15, 30, 45 o 60), y altura proporcional a duración, cabeceras profesionales sticky y eje horario sticky dentro de una región con scroll y foco. Profesionales ordenados alfabéticamente; condición Inactivo/Eliminado/No disponible desde lectura explícita, sin inferir eliminación por ausencia en catálogo. Fecha completa y Hoy; reloj reactivo por minuto en la zona del negocio y marcador solo en el día actual. Tarjeta desktop compacta sin profesional redundante; mobile conserva profesional y condición. Solapamientos en carriles laterales; intervalos adyacentes reutilizan carril. La escala usa instantes para respetar duración real durante DST, con etiquetas de offset cuando se repiten horas. En turnos breves o textos largos, el contenido tiene scroll y foco, más descripción accesible completa.

La agenda consulta el intervalo con key aislada por negocio, cancelación y lectura fresca al volver/foco. No presenta una grilla provisional de 30 minutos durante carga o error; ofrece reintento. Configuración comparte los valores permitidos y publica en caché el intervalo confirmado por el servidor, cancelando lecturas anteriores. El intervalo solo cambia las marcas y límites del eje: nunca redondea ni mueve turnos o altera la escala por minuto.

La agenda muestra el horario del negocio de la fecha seleccionada o «Negocio cerrado en esta fecha» sobre la lista mobile. Los márgenes grisados son contexto de la grilla desktop: no agregar tarjetas vacías ni márgenes de la grilla a la lista.

El botón «Hoy» de Agenda usa `subtle` con texto primary y `aria-current="date"` cuando la fecha seleccionada coincide con la fecha actual del negocio; permanece habilitado y conserva su nombre. En otras fechas usa `outline` sin aria-current. El badge junto a la fecha se conserva; el estado también responde a anterior/siguiente y al selector de fecha.

### Agenda mobile — lectura compacta (2026-10-24)

Usar AdminPageHeader con compactOnMobile para conservar el título y omitir eyebrow/descripción en mobile sin alterar desktop. La barra de contexto de Agenda combina fecha corta visible (nombre accesible completo y año en selector), anterior/siguiente/Hoy, Filtros con contador y chips aplicados en una sola fila desplazable, y horario del negocio. Permanece sticky bajo el header del shell usando la variable compartida --admin-mobile-header-height; no agregar otro shell ni duplicar controles o consultas. Header del shell: «Agenda del negocio», independiente del día consultado.

La lista cronológica agrupa inicios simultáneos por instante con secciones y encabezados horarios. Horas locales repetidas en DST se mantienen en grupos distintos con offset. Conservar rango completo y cruce de medianoche en cada tarjeta, nombres completos, servicio, profesional con icono y condición histórica. Reducir padding/espaciado sin ocultar información ni targets de navegación/filtros; marcador Ahora queda entre grupos. Desktop mantiene grilla temporal y navegación existentes. Verificar sticky al scrollear, filtros/teclado/axe, textos largos y último turno sobre navegación inferior.

### Agenda mobile — profesionales directos (2026-10-24)

El título de Agenda permanece accesible y se oculta visualmente solo en mobile. Navegación en una fila con fecha abreviada sobre input date nativo accesible (año en selector y descripción completa), anterior/siguiente e «Ir a hoy»; este último cambia a «Hoy» resaltado si corresponde a la fecha del negocio. Mantener una sola instancia de cada control según viewport.

Segunda fila de profesionales con selección única nativa: Todos y catálogo completo paginado; un toque navega con el profesional, sin aplicar en otro diálogo. Catálogos grandes ofrecen búsqueda en ResponsiveDialog con selección inmediata. Identificar inactivos/eliminados/no disponibles y conservar referencias históricas de consultas del negocio en la caché de sesión, sin mezclar negocios. Todos elimina solo profesional y conserva estado/fecha. No repetir pill profesional ni Limpiar filtros en mobile. Estado tiene su propio diálogo provisional, contador y etiqueta aplicada; Limpiar de ese diálogo solo restablece estado.

Barra sticky con fecha, profesionales y acceso al estado. Horario del negocio queda fuera de la barra. «Ahora» aparece solo en Hoy con resultados y desplaza/focaliza el marcador por debajo de la barra, respetando movimiento reducido. Las tarjetas mobile siempre muestran icono, profesional y servicio en una fila que admite salto de línea, incluyendo el profesional seleccionado y su condición histórica. Desktop conserva la grilla y ofrece controles directos de profesional y estado; el texto Ir a hoy/Hoy es consistente en ambos tamaños.

### Señales de desplazamiento en profesionales (2026-10-25)

La fila mobile muestra degradados decorativos de 16 px solo donde hay opciones ocultas: derecha al inicio, ambos en el medio e izquierda al final. Si todo entra, no muestra ninguno. Recalcular ante scroll, cambios de catálogo, fuentes o ancho del contenedor; los degradados no capturan puntero ni afectan teclado/swipe. La selección se revela moviendo solo la fila, con margen para no quedar cubierta por los degradados. Recalcular al cambiar valor/catálogo y al variar dimensiones, incluyendo URL, recarga, búsqueda y carga tardía. No reiniciar el desplazamiento manual en actualizaciones del reloj. Si un nombre excepcional supera el ancho útil de la fila, alinear su inicio sin forzar el ancho o scroll de la página; la búsqueda mantiene disponible el nombre completo.

### Profesional y servicio en la tarjeta mobile (2026-10-25)

Cada tarjeta mantiene horario, estado y cliente destacado; debajo muestra el icono UserRound, el nombre del profesional con peso medio, su condición histórica cuando corresponde, un separador y el servicio en texto secundario. Es una sola fila de texto con salto natural, nombres completos y sin truncado ni ancho fijo. Mismo comportamiento en Todos y con profesional filtrado. La descripción accesible conserva todos los datos. Se retira el contexto externo «Turnos de {nombre}» y su acceso para revelar la opción; el contexto vive en cada tarjeta. La selección del profesional, degradados y revelado al cambiar de opción se mantienen, sin reiniciar el scroll manual posterior. Desktop conserva grilla y lectura por columna, con horario/estado sticky dentro de cada tarjeta desplazable.

En los selectores de profesionales de Agenda, Todos permanece primero, seguido por activos, inactivos, eliminados y no disponibles, en ese orden. Cada grupo se ordena alfabéticamente en español con ID como desempate. Se mantienen las referencias históricas y la selección existente; no cambiar el orden de los turnos ni de las columnas desktop.

### Agenda desktop compacta (2026-10-25)

AdminPageHeader admite compact: conserva título y descripción accesible, omite eyebrow y descripción visual y reduce margen/tamaño de título. Es opt-in de Agenda. Fecha legible, anterior/siguiente, date nativo e Ir a hoy/Hoy comparten fila con wrap en anchos intermedios. Debajo, profesional abre un Popover accesible con catálogo completo, búsqueda y selección inmediata; estado usa Select nativo de cinco estados más Todos, también inmediato. Ambos mantienen URL, fecha y el otro filtro; pills y Limpiar permiten deshacer. No hay diálogo general de Filtros en desktop. Errores del catálogo mantienen agenda y reintento.

Leyenda compacta de horario y muestra gris decorativa con texto Fuera de horario. Grilla comienza más arriba y conserva desplazamiento interno, cabeceras sticky y eje horario fijo. Tarjetas desktop siguen sin repetir profesional (lo aporta la columna); el contenedor es desplazable por mouse/teclado y su cabecera de horario/estado queda sticky durante ese desplazamiento. Título nativo y descripción accesible conservan datos completos; no abre un detalle de turno. Mobile mantiene filas y filtros aprobados.

En tarjetas desktop, el cliente ocupa una sola línea con puntos suspensivos para reservar espacio al servicio. Se conserva el texto completo en el DOM, la descripción accesible y el título nativo de hover. El profesional lo aporta la columna. Mobile mantiene el cliente completo con salto de línea.
