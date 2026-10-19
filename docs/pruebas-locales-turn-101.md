# Pruebas locales — TURN-101

## Preparación

Ambos repos deben estar en `feature/TURN-101-staff-status`, basada en TURN-79. Reiniciar backend y frontend antes de probar. El backend aplica automáticamente la nueva migración Flyway V1003 al arrancar; incorpora el borrado lógico de profesionales. Usar una sesión de administrador y un profesional de prueba; anotar su estado para restaurarlo al terminar.

El alcance aprobado incluye reactivar, además del detalle y la desactivación de Jira. Agenda y formularios frontend de turnos continúan demo: los turnos que allí se muestran no sirven para provocar conflictos reales.

## 1. Detalle y navegación

1. En `/profesionales`, abrir Más acciones → Ver detalle. Debe navegar a `/profesionales/{id}` y mostrar nombre, avatar/iniciales, rol/especialidad cuando existan, estado y Vos si corresponde.
2. Copiar la URL, abrirla directamente y recargar. No debe depender de haber abierto el listado antes.
3. Buscar, aplicar filtro de estado y, si hay suficientes registros, cambiar de página. Cambiar el filtro mientras una búsqueda todavía espera su debounce no debe borrar lo escrito. Abrir detalle y volver: conserva contexto mediante `q`, `status` y `page`. Probar atrás/adelante del navegador y recarga del listado.
4. Un ID inexistente o de otro negocio muestra Profesional no encontrado y permite volver al listado; un ID inválido no consulta la API. Los errores transitorios ofrecen Reintentar carga.

## 2. Desactivar y reactivar

1. Abrir Desactivar desde el listado y cancelar con Cancelar/Escape: no debe escribir; el foco regresa a la acción de la fila.
2. Confirmar para un profesional sin turnos futuros activos: muestra Profesional desactivado. Con filtro Activos, desaparece la fila; la página se corrige si desapareció el último resultado de la última página.
3. Buscarlo en Inactivos y abrir detalle. Debe seguir existiendo con sus datos e identidad; servicios, horarios y vínculo de usuario se conservan.
4. Reactivar desde detalle y repetir desde el menú del listado. Muestra Profesional reactivado y conserva el perfil; vuelve a estar sujeto a los servicios, horarios y reglas del negocio.
5. Repetir con el profesional marcado Vos: la cuenta y la sesión permanecen activas. No se crea un vínculo nuevo ni se libera el existente.
6. En Network, desactivar usa DELETE → 204; reactivar usa PATCH con solo `status: ACTIVE` → 200. Durante el envío se bloquea confirmar dos veces y cerrar la confirmación.

## 3. Conflictos y errores

1. Con un turno **real en la DB** futuro PENDING o CONFIRMED, desactivar debe responder 409 `STAFF_HAS_FUTURE_APPOINTMENTS`. La confirmación permanece abierta y explica que hay que cancelar/reasignar esos turnos; no muestra éxito ni modifica el perfil.
2. Los turnos pasados y CANCELLED/COMPLETED/NO_SHOW no bloquean. No se cancelan ni reasignan turnos automáticamente. La comparación usa la zona horaria del negocio.
3. Simular un error de escritura: conserva pantalla y permite reintentar; no cambia el badge a inactivo/activo antes de confirmar la respuesta exitosa.
4. Si la escritura funcionó pero el GET posterior falla, el estado confirmado se mantiene. Reintentar actualización ejecuta solo lecturas, nunca otra baja/reactivación.
5. Si el profesional deja de existir antes de confirmar, informa que no está disponible y Actualizar datos permite recuperar la vista y volver al listado.

Los E2E usan fixtures aislados de red y cubren estos errores sin modificar tu DB. Las pruebas PostgreSQL verifican conflictos, rollback, relaciones intactas y carreras entre baja y reserva pública/administrativa en ambos órdenes. La API administrativa rechaza crear/reprogramar/reasignar para un inactivo; sigue permitiendo notas históricas.

## 4. Eliminar del listado (extensión)

1. Usar un profesional de prueba: la eliminación no se puede revertir desde la app. En activos no debe aparecer Eliminar. Desactivarlo y abrir Más acciones → Eliminar; también está disponible desde su detalle inactivo.
2. Cancelar o pulsar Escape: conserva la fila. Confirmar: muestra Profesional eliminado y desaparece tanto de Todos como de Inactivos. Buscar por su nombre o recargar no debe hacerlo reaparecer; el detalle directo muestra Profesional no encontrado.
3. Verificar total y paginación; si era el último de la última página, vuelve a una página válida. Al eliminar desde detalle regresa al listado con sus filtros y aviso de éxito.
4. El historial de turnos conserva la identidad y los datos del profesional. La cuenta vinculada sigue existiendo y su sesión permanece; al crear otro profesional, la opción Este profesional soy yo vuelve a estar disponible para esa cuenta. Desactivar por sí solo no libera el vínculo.
5. En Network: DELETE `/api/v1/staff-members/{id}/catalog` → 204. Un activo o reactivado en otra sesión devuelve 409; un eliminado/ajeno devuelve 404. Un error no elimina la fila; reintentar actualización tras un refresco fallido solo ejecuta lecturas. Durante el envío no admite doble confirmación ni cerrar el diálogo.

## 5. Responsive y teclado

Validar desktop 1440×900 y mobile 390×844 / 412×915: sin scroll horizontal, nombres largos contenidos y acciones visibles sobre la navegación. Recorrer Más acciones con flechas/Enter, confirmar con teclado y verificar foco inicial en Cancelar y retorno al cerrar. Los diálogos, tarjetas, avisos y shell son compartidos con las pantallas existentes.

## Automatización

Desde `Turnero-api`, con Docker/Colima:

```sh
DOCKER_HOST=unix:///Users/xavimeen/.colima/default/docker.sock TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock ./gradlew test
```

Desde `turnero-frontend`:

```sh
NEXT_DIST_DIR=.next-e2e npm run check
# Solo detalle y cambios de estado:
npx playwright test tests/e2e/staff-status.spec.ts
```

## Resultados automatizados

- Backend con la extensión de eliminación: 550 pruebas aprobadas, sin fallos ni omisiones, incluidos 19 casos PostgreSQL de estado/eliminación.
- Frontend con eliminación: lint, TypeScript, 145 unitarios y build aprobados. Suite E2E completa: 361 aprobados y 14 omisiones preexistentes; incluye 45 recorridos de detalle/estado/eliminación en los tres tamaños.
- Capturas de detalle, eliminación y confirmación/conflicto revisadas en los tres tamaños; sin scroll horizontal ni infracciones axe básicas en los recorridos probados.

## Entrega

Implementación local; QA automática registrada en tracking. Detalle/estado aprobados manualmente por el usuario; la extensión de eliminación está pendiente de QA manual. Crear PRs separados después de su aprobación, integrar backend primero y ajustar bases según TURN-79 backend #80/frontend #15. Sin revisar CI ni mergear automáticamente.
