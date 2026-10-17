# TURN-99 — Crear y editar profesionales

## Estado y preparación

Implementación local en `feature/TURN-99-staff-form` de frontend y backend, basadas en TURN-77. QA manual aprobada por el usuario el 2026-10-17; integración pendiente; no hay migraciones. Reiniciar la API para activar el límite de rol de 80 caracteres y el conflicto `STAFF_USER_ALREADY_LINKED`. El frontend debe usar esta API antes de validar el flujo de vinculación.

Usar la sesión del negocio habitual y abrir `/profesionales`. Tener horarios del negocio configurados: se copian al crear cada profesional. La vinculación solo existe durante el alta; no modifica permisos ni permite elegir otros usuarios.

## Recorrido de aceptación

1. Abrir **Nuevo profesional**. Comprobar el aviso sobre los horarios iniciales y la opción **Este profesional soy yo** desactivada. Enviar vacío: nombre y especialidad muestran errores; el foco va al primer campo inválido.
2. Crear con nombre y especialidad; rol opcional. Dejar desactivada la vinculación. Se cierra el formulario, aparece **Profesional creado**, el total se actualiza y el profesional aparece si cumple búsqueda/filtros. Confirmar persistencia recargando la página.
3. Abrir **Editar**: comprobar datos actuales y Guardar deshabilitado. Cambiar el nombre: se habilita. Revertir: vuelve a deshabilitarse. Vaciar el rol y guardar: se elimina del listado y persiste al reabrir. Editar también un profesional inactivo; su estado permanece intacto.
4. Cambiar un campo y cerrar con ×, Cancelar o Escape. **Seguir editando** conserva el borrador; **Descartar** lo elimina. Reabrir carga datos guardados.
5. Crear otro profesional con **Este profesional soy yo** activado. No debe sobrescribir automáticamente el nombre. Si tu usuario ya está vinculado, la opción debe aparecer desactivada y deshabilitada, con el nombre del profesional vinculado; se puede crear otro profesional sin vincularlo. La consulta debe funcionar aunque el profesional vinculado sea inactivo o esté fuera de la página/filtros visibles. Durante la comprobación o si falla, la opción permanece bloqueada y se ofrece reintentar la comprobación. Si otra pestaña vincula al usuario entre la comprobación y el guardado, conservar el error 409, actualizar la comprobación y quitar la selección. Una segunda alta vinculada al mismo usuario debe fallar sin crear otro profesional; la restricción incluye profesionales inactivos. El profesional vinculado debe mostrar la etiqueta **Vos** en su fila y el aviso **Tu perfil profesional** al editarlo. La edición no permite cambiar la vinculación.
6. Revisar límites: nombre 100, rol 80, especialidad 150. Nombre y especialidad no admiten solo espacios al crear. Si un profesional heredado no tiene especialidad, se permite editar otro campo sin obligar a completarla; no se permite vaciar una especialidad existente.
7. Con filtros/búsqueda activos, guardar una edición que deje de coincidir: desaparece de esos resultados, mantiene filtros y ajusta la página si queda fuera de rango. No borra el profesional ni lo inserta forzadamente en otra página.
8. Interrumpir la API antes de guardar: conservar valores y permitir reintento manual. Con conexión lenta, Guardar, Cancelar y × se bloquean durante el envío. No se deben crear duplicados al hacer doble clic. Si el guardado se confirma y falla solo el refresco, **Reintentar actualización** vuelve a leer sin repetir la escritura (cubierto también por E2E controlado).
9. Repetir creación/edición en **1440×900**, **390×844** y **412×915**. Desktop usa modal; mobile panel inferior. Sin scroll horizontal, footer de acciones accesible y contenido desplazable; probar teclado, Escape, foco de validación y retorno al trigger. Los éxitos flotan y se pueden cerrar; se ocultan a los 6 segundos.

No se incluyen avatar editable, estado, baja, servicios ni edición de horarios. Los avatares existentes se conservan. Para comprobar la copia inicial de horarios, consultar el endpoint existente `GET /api/v1/staff-members/{id}/working-hours` desde un cliente autenticado del mismo negocio; no se añadió una pantalla de horarios.

## Verificación automatizada

Backend: `make test` (configura Colima según la guía local). La suite cubre POST/PATCH con roles de 80/81 caracteres, conflicto HTTP estructurado, PostgreSQL con esquema real, creación con/sin vínculo, usuario ajeno, vinculación a profesional inactivo, dos altas concurrentes (una creación y un conflicto), copia semanal y rollback si falla esa copia.

Frontend: `npm run check` ejecuta lint, TypeScript, unitarios, build y E2E completos. Para los recorridos afectados: `npm run test:e2e -- tests/e2e/staff-form.spec.ts tests/e2e/staff-members.spec.ts`. Incluye body exacto de POST/PATCH, cookie y errores en el handler BFF real; invalidación por negocio; escenarios de formulario, filtros, paginación, carga y errores; Axe y capturas de alta/edición en `test-results/`.

Resultados locales: **495 pruebas backend** aprobadas sin omisiones; **92 unitarios frontend**, lint, TypeScript y build aprobados; suite E2E completa **244 aprobadas / 14 omisiones previstas por viewport**. Capturas del formulario revisadas en los tres tamaños contra los patrones compartidos de Servicios; Axe sin infracciones básicas. Incluye identificación del profesional propio y bloqueo preventivo de una segunda vinculación, incluso si está inactivo o fuera de la página/filtros.

## Entrega

Aceptación manual aprobada por el usuario el 2026-10-17, incluyendo identificación del profesional propio y bloqueo de vinculación tras reiniciar la API. Creación de PRs autorizada: un PR backend previo y un PR frontend TURN-99, separados. Integrar backend primero y ajustar bases al integrar TURN-77. No se revisa CI ni se hace merge automático.
