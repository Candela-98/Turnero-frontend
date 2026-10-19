# Pruebas locales — TURN-78

## Preparación

Ambos repos deben estar en `feature/TURN-78-staff-services`. TURN-98/77/99 ya están integrados; los PRs de TURN-78 apuntan a `develop` (backend #79) y `dev` (frontend #14). Reiniciar el backend para cargar la transacción y las reglas nuevas; reiniciar el frontend si fuera necesario. Usar la sesión habitual de administrador y abrir `/profesionales`. No hay migraciones nuevas ni cambios en la agenda demo.

Preparar dos servicios activos y un profesional; se puede usar uno existente o inactivo. Para probar varias páginas hacen falta más de 20 servicios activos: los E2E ya incluyen 42, sin alterar la base local.

## 1. Asignar, guardar y volver a abrir

1. La fila debe identificar **Especialidad: …** como texto del perfil. El botón indica **Servicios (N)** cuando tiene asignaciones o **Asignar servicios** si no tiene ninguna. Abrirlo: después de ambas lecturas iniciales debe verse **Seleccionados** si tiene servicios, o **Catálogo** si no tiene. Guardar empieza deshabilitado.
2. Seleccionar dos servicios; buscar por nombre o categoría. La búsqueda espera 300 ms y vuelve a página 1. La selección debe conservarse al buscar y paginar.
3. Abrir **Seleccionados (N)**: debe incluir todo el borrador, no solo lo visible en la página del catálogo. Su búsqueda y paginación son locales.
4. Guardar: un PUT con todos los IDs, respuesta 204, diálogo cerrado y aviso **Servicios actualizados**. Reabrir y comprobar persistencia, vista Seleccionados y Guardar deshabilitado. El contador de la fila debe reflejar el nuevo total.
5. Dejar solo uno y guardar. Reabrir, **Quitar todos**, guardar y reabrir: el botón de la fila debe cambiar a **Asignar servicios** y el editor abrir Catálogo; **Seleccionados (0)** debe mostrar su vacío.

## 2. Cambios pendientes y servicios inactivos

1. Cambiar una selección y revertirla: Guardar vuelve a deshabilitarse. **Restablecer selección** recupera el conjunto cargado al abrir, incluso luego de Quitar todos.
2. Con cambios, probar Cancelar, × y Escape: confirmar descarte o seguir editando. No debe guardarse al cancelar.
3. Asignar y guardar un servicio activo; desactivarlo desde Servicios. Reabrir el profesional: en Seleccionados aparece con badge **Inactivo**, fuera del catálogo activo. Se puede conservar al guardar otros cambios o quitarlo.
4. Después de quitar y guardar un inactivo, no puede agregarse nuevamente mientras siga inactivo. El backend rechaza nuevas asociaciones inactivas con 409.
5. Eliminar del catálogo un servicio inactivo y volver a Profesionales: el contador debe disminuir. Desactivar sin eliminar conserva el contador.
6. Los turnos existentes conservan servicio, duración, precio y estado cuando se quita una asociación.

## 3. Errores y responsive

1. Abrir en desktop 1440×900 y mobile 390×844 / 412×915: modal o panel inferior compartido, sin scroll horizontal. La lista hace scroll; Cancelar/Guardar quedan accesibles en el footer.
2. Probar teclado: Tab, Space para seleccionar, radios con flechas, Escape, confirmación y retorno del foco.
3. Simular error de red en carga: no habilitar selección hasta tener asociaciones y primer catálogo; **Reintentar carga** recupera el flujo.
4. Con un borrador, provocar error al buscar otra página: debe conservarse el borrador y permitir **Reintentar catálogo**.
5. Simular PUT 409/404/503: conservar selección y mostrar revisión/reintento. Mientras guarda, bloquear doble envío y cierre.
6. Si el PUT responde 204 y falla una lectura posterior, mostrar que ya se guardó. **Reintentar actualización** ejecuta lecturas, nunca otro PUT.

## Automatización

Backend (desde `Turnero-api`, requiere Docker/Colima):

```sh
DOCKER_HOST=unix:///Users/xavimeen/.colima/default/docker.sock TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock ./gradlew test
```

Frontend (desde `turnero-frontend`):

```sh
npm run check
# Solo el flujo nuevo, en los tres proyectos:
npx playwright test tests/e2e/staff-services.spec.ts
```

Los E2E usan fixtures de red aislados y servidor en 3100; no crean servicios ni profesionales en tu DB. Incluyen accesibilidad con axe, textos largos, respuestas tardías, 42 servicios, selección local paginada, errores y capturas. Los tests PostgreSQL comprueban transacción, aislamiento, filas conservadas, inactivos, rollback, concurrencia y turnos intactos.

## Resultado automatizado (2026-10-17)

- Backend: suite Gradle completa, 513 pruebas aprobadas, sin fallos ni omisiones, incluidas las de PostgreSQL.
- Frontend: lint, TypeScript, 108 unitarios y build aprobados. Para la mejora del contador pasaron 54 E2E de listado/formulario de profesionales y la ejecución final de 63 E2E de asignaciones/estado de servicios. Se cubren los tres tamaños, cantidad/cero, vista inicial y contador desactualizado. La suite completa previa a esta mejora había pasado con 274 E2E y 14 omisiones preexistentes.
- Capturas de 1440×900, 390×844 y 412×915 revisadas, incluidos nombres/categorías largos. Sin scroll horizontal, footer accesible, axe sin violaciones en el flujo probado.

## Alcance y entrega

Implementación y QA automática se registran por separado en `tracking-implementacion-mvp.md`; la QA manual del usuario fue aprobada el 2026-10-17, incluidos los ajustes de contador y etiquetas Rol/Especialidad. Creación de PRs separados autorizada; integrar backend primero. No revisar CI ni integrar automáticamente.

El criterio Jira de refrescar formularios de turnos se difiere hasta su conexión real a la API. La agenda y los formularios de turnos siguen demo por decisión del usuario; no se agregaron invalidaciones ficticias.
