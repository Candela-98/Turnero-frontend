# Pruebas locales — TURN-102: detalle, archivo y bloqueo

## Preparación

Frontend: feature/TURN-102-customer-status. Backend: feature/TURN-102-customer-archive-block. Ambas entregas dependen de TURN-100 (#83 API y #18 frontend). Reiniciar el backend con esta rama: Flyway aplica V1004, que agrega el flag/motivo de bloqueo y los índices. No necesita cargar nuevamente los datos. El frontend consume este backend actualizado.

Ingresar como OWNER. Usar clientes ficticios y devolverlos a su estado inicial al terminar. Las pruebas automáticas usan fixtures y PostgreSQL descartable; no cambian tu DB local.

## 1. Listado, detalle y edición

- Abrir Clientes: muestra Sin archivar por defecto, incluidos los bloqueados. Más acciones ofrece Ver detalle, Archivar/Restaurar y Bloquear/Desbloquear reservas; Editar sigue visible.
- Abrir detalle y recargar: conserva URL, contactos, notas y los dos estados. Notas con saltos de línea; ausencia de notas explícita. URL inválida/ajena: Cliente no encontrado. Error de lectura: reintento.
- Editar desde el detalle: espera lectura fresca; Guardar sin cambios está deshabilitado. Cambiar/revertir, descartar y guardar mantienen TURN-100. Refrescos posteriores no reemplazan borradores.
- Volver al listado conserva búsqueda, archivo, filtro de reservas y página válida. Probar atrás/adelante.

## 2. Archivar y restaurar

- Archivar pide confirmación con Cancelar enfocado. Cancelar/Escape no escribe y devuelve el foco al disparador.
- Confirmar: aparece Archivado y desaparece del listado habitual; datos, notas y turnos se conservan. Desde el detalle permanece visible y ofrece Restaurar.
- Aviso: **Cliente archivado** / **Ya no aparece en la lista habitual. Sus datos y turnos se conservan.**
- Restaurar: vuelve a la lista habitual. Aviso: **Cliente restaurado** / **Vuelve a aparecer en la lista habitual.**
- Repetir con un cliente bloqueado: archivar/restaurar NO cambia el bloqueo ni su motivo. Los INACTIVE anteriores se interpretan como archivados.

## 3. Bloquear y desbloquear reservas

- Bloquear abre confirmación con motivo interno obligatorio. Intentar vacío: error junto al campo y foco en él, sin escritura. Probar hasta 500 caracteres y saltos de línea.
- La ayuda explica alcance por email o teléfono, contactos compartidos y límite de identidad. Una ficha sin contacto utilizable pide editarlo antes de bloquear.
- Confirmar: muestra Reservas bloqueadas y motivo solo en el detalle administrativo. **Reservas públicas bloqueadas** / **No podrá reservar por el enlace público. Podés asignarle turnos manualmente.**
- Desbloquear exige confirmación, limpia el motivo y conserva el archivo. **Reservas públicas desbloqueadas** / **Puede volver a reservar por el enlace público.**
- Repetir desde Más acciones del listado. Error de escritura mantiene el motivo y permite reintento; durante envío se bloquean Cancelar, Escape y envíos duplicados.
- Escritura confirmada + refresco fallido conserva el cambio y ofrece Reintentar actualización: solo GET, nunca repite PATCH/DELETE.

## 4. Filtros y responsive

- Archivo: Sin archivar / Archivados / Todos. Reservas públicas: Todas / Permitidas / Bloqueadas. Selección provisional, Escape/cancelación y Limpiar a defaults.
- Aplicar ambos filtros: URL incluye parámetros, página vuelve a 0 y aparecen pills removibles independientes. Cambiar estado desde una página final ajusta a una válida.
- 1440×900, 390×844 y 412×915: teclado, foco, títulos y descripciones de avisos, diálogos, contactos/motivos/notas largos, sin scroll horizontal y último contenido sobre la navegación mobile.

## 5. Reserva pública real (API)

La agenda y la creación de turnos del frontend todavía son demo; no simulan esta integración. El bloqueo se aplica en POST /api/v1/public/businesses/{slug}/appointments, con un horario disponible del negocio y su payload actual.

- Ficha bloqueada: email con trim/case distinto o teléfono con separadores distintos devuelve 403 CUSTOMER_BOOKING_BLOCKED; no crea turno ni revela motivo.
- Puede reconocer por cualquiera de los contactos, incluso otra ficha no bloqueada que los comparta. Se limita al mismo negocio.
- Email único tiene prioridad para reutilizar ficha; si no existe, teléfono único. Coincidencia ambigua: 409 CUSTOMER_IDENTITY_AMBIGUOUS, sin fusionar.
- Archivado no bloqueado: una reserva pública exitosa restaura la misma ficha y conserva nombre, contactos, notas y turnos. Si la transacción falla, sigue archivado.
- Reserva administrativa sigue permitida; no cancela turnos existentes. La futura integración de agenda real debe mostrar advertencia al seleccionar un bloqueado.
- El teléfono compara dígitos exactos sin inferir país. Cambiar contactos puede eludir el bloqueo; contactos compartidos pueden alcanzar a otra persona. No hay OTP ni bloqueo de cuenta.

## Automatización y entrega

Desde frontend:

```sh
NEXT_DIST_DIR=.next-e2e npm run check
```

Desde Turnero-api, adaptando el socket si corresponde:

```sh
DOCKER_HOST=unix:///Users/xavimeen/.colima/default/docker.sock TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock ./gradlew test
```

QA automática aprobada: 609 pruebas backend, lint, TypeScript, build, 222 unitarios y 490 E2E frontend; 14 omisiones preexistentes. Los 63 recorridos de detalle/archivo/bloqueo pasaron en los tres viewports y se revisaron las capturas. QA manual aprobada por el usuario el 2026-10-20 y creación de ambos PRs autorizada. Integración pendiente, backend primero; bases en TURN-100 mientras #83/#18 sigan abiertos, luego develop/dev. Sin consultar CI ni mergear automáticamente.
