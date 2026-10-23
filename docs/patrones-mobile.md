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
