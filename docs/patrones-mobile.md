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
- La bottom nav mide `calc(4.75rem + env(safe-area-inset-bottom))`, incluye la zona segura y permanece fija.
- Todo contenido de una sección admin debe reservar padding inferior al menos igual a esa navegación.
- Formularios con una acción primaria usan `AdminMobileStickyAction`: queda inmediatamente arriba de la bottom nav y el contenido reserva también su altura.
- Solo una acción primaria contextual por pantalla. La acción fija debe indicar carga/deshabilitado y no duplicarse como CTA visible en mobile.
- Header y navegación usan z-index separados: header `z-20`, acción contextual `z-30`, bottom nav `z-40`.

## Densidad, tipografía y controles

- Mobile usa una columna para formularios; mantener controles de al menos `44px` de alto y labels siempre visibles.
- Títulos de sección, descripción y márgenes superiores deben ser más compactos que desktop, sin quitar contexto útil.
- Mantener padding horizontal de `16–20px` para contenido; cards pueden ocupar todo el ancho si preservan padding interno.
- Nombres de negocio se truncan en header antes de desplazar acciones.
- Fechas/horas largas tienen variante compacta en mobile; la versión completa puede mantenerse desde `md`.
- Mensajes de éxito/error se descartan o dejan una acción clara; nunca deben tapar controles críticos.

## QA obligatorio

Antes de cerrar una pantalla mobile:

1. Revisar en `390×844` y `412×915`.
2. Confirmar que el último campo y la acción primaria quedan completamente por encima de la bottom nav y de la safe area.
3. Probar scroll hasta el final, validación, loading, éxito, error y reintento.
4. Verificar targets táctiles, foco visible, labels, truncado y textos sin corte horizontal.
5. Comparar contra la referencia Stitch vigente y ejecutar los E2E mobile correspondientes.

## Referencias de implementación

- `AdminAppShell` y Agenda mobile: shell administrativo y CTA contextual.
- Configuración del negocio: formulario con `AdminMobileStickyAction`.
- `TaskMobileHeader`: flujos de crear/editar.
- `BookingPublicShell`: reserva cliente mobile-first.
