# Pruebas locales TURN-98 — desactivar, restaurar y eliminar

Abrí `/servicios` con frontend y API locales iniciados. El backend existente admite DELETE lógico y PATCH con `status: "ACTIVE"`; Eliminar requiere el backend de `feature/TURN-98-service-removal`. Reiniciá la API (`make run` en Turnero-api) para aplicar automáticamente V1002, que agrega `deleted_at`; no hace falta recrear ni limpiar la base.

1. En Todos, confirmá que cada servicio activo ofrece Editar y Desactivar; los inactivos ofrecen Editar, Restaurar y Eliminar. Ya no hay panel ni acción de detalle.
2. Buscá un servicio de prueba. Abrí Desactivar, cancelá y verificá que conserva su estado. Confirmá luego: pasa a Inactivo y aparece la confirmación flotante, sin perder búsqueda.
3. Restaurá el servicio: confirmación, estado Activo y aviso de éxito. Recargá y verificá que persiste. Tanto baja como restauración conservan ID y datos.
4. Probá filtros Activos e Inactivos: al cambiar el estado, el servicio desaparece del filtro que dejó de cumplir y aparece en el correspondiente. Conservá categoría/búsqueda y revisá los contadores.
5. En un catálogo de más de 20 servicios, desactivá el último resultado de la última página de Activos; debe volver a una página válida. Repetí restaurando el último de Inactivos.
6. Simulá una falla de conexión antes de confirmar: el diálogo conserva el error y permite cancelar o reintentar. Durante el envío se bloquean confirmación, Cancelar y Escape.
7. Si falla el refresco después de guardar, Reintentar actualización solo repite lecturas; no vuelve a desactivar ni restaurar.
8. Revisá desktop 1440×900 y mobile 390×844 / 412×915: sin scroll horizontal, confirmaciones accesibles y aviso sobre la navegación. Alta y edición siguen funcionando.
9. `/servicios/2` redirige al catálogo; las antiguas URLs de detalle redirigen al catálogo.

10. Con un servicio inactivo de prueba, abrí Eliminar y cancelá: sigue visible. Confirmá después: desaparece del catálogo y no puede restaurarse desde la app. La categoría desaparece solo si ningún otro servicio visible la usa. Revisá filtros y recargá. Los turnos existentes deben conservar sus datos y permitir sus flujos habituales.

Validación manual aprobada por el usuario el 2026-10-16; entrega autorizada para revisión por PR.
