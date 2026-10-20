# Perfil de cliente

Stitch ID: `12c8c03979e54112b39266b5079bc3a4`

Disponible:

- `stitch.html` descargado desde Stitch MCP.
- `stitch.png` subido como screenshot de referencia.

Pendiente:
- Registrar observaciones de drift visual.

## Alcance implementado — TURN-102

La ficha usa datos reales disponibles en GET Customer: identidad, contacto, estado y notas internas. Comparte shell, ancho y tarjeta aprobados de Clientes/Profesionales; incluye edición de TURN-100 y archivo/restauración y bloqueo/desbloqueo público con confirmación. No reproduce secciones de Stitch sin datos reales: historial, próximo turno, métricas o acciones de agenda quedan fuera de esta tarea. Notas con saltos de línea, contactos ausentes y contenido largo tienen estados explícitos. Revisar desktop 1440×900 y mobile 390×844 / 412×915.

Decisión de producto TURN-102: Reservas públicas es una sección real de la ficha con estado y motivo privado del bloqueo. Archivado y reservas bloqueadas tienen badges independientes; se omite el badge positivo rutinario. No se agregan métricas ni historial sin contrato.
