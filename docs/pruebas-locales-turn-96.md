# Pruebas locales — TURN-96

## Preparación

Usar el backend local de `develop` con la corrección local de timestamps de servicios y el frontend de `feature/TURN-96-service-form`. Iniciar ambos como habitualmente (`make run` en backend y `npm run dev` en frontend), entrar con el OWNER del negocio y abrir `/servicios`. Si el backend estaba iniciado antes de la corrección, reiniciarlo para cargarla: la creación debe asignar `created_at` y `updated_at` sin recibirlos del frontend. El perfil `dev` aplica además `V1001__sync_seed_sequences.sql` para sincronizar los IDs explícitos del seed local con sus secuencias; conserva los datos y no cambia el esquema de producción. La base local de esta sesión ya recibió esa reparación.

Los E2E usan respuestas controladas. Estas pruebas manuales comprueban la integración con tu API y tus datos locales.

## Recorrido

1. **Crear**: abrir Nuevo servicio; ingresar nombre `Prueba TURN-96`, categoría `Pruebas`, duración `45` y precio `6000,50`. Guardar. Confirmar el cierre del formulario, la confirmación y el servicio en el listado cuando coincide con los filtros actuales. La API recibe `price_cents: 600050`; no se envían estado ni ID del negocio.
2. **Editar**: abrir Editar. Verificar datos actuales y Guardar cambios deshabilitado. Cambiar duración, revertirla y comprobar que vuelve a deshabilitarse. Cambiar precio y guardar; recargar y comprobar persistencia. La confirmación flota abajo a la derecha del contenido en desktop sin desplazar el listado, acompaña el scroll y desaparece a los 6 segundos (se pausa al interactuar con ella); también se puede cerrar con ×.
3. **Categorías**: crear una categoría nueva, comprobar que aparece en los filtros y luego borrarla desde edición. La categoría es opcional y se limpia enviando una cadena vacía.
4. **Validar**: probar nombre vacío, duración `0` o `1,5`, precio negativo y precio con tres decimales. No debe enviarse una escritura; el primer campo inválido recibe foco y cada error aparece junto al campo. Precio cero sí es válido.
5. **Descartar**: modificar un campo y cerrar con Cancelar, × o Escape. Seguir editando mantiene el borrador; Descartar cierra y la siguiente apertura trae los datos guardados.
6. **Errores**: con el formulario ya abierto, simular conexión offline desde DevTools e intentar guardar. Debe conservar los valores y permitir reintentar al restaurar conexión. La confirmación de escritura exitosa seguida de fallo de refresco se cubre también en E2E: el reintento actualiza el catálogo sin repetir POST/PATCH.
7. **Filtros**: editar desde un listado filtrado. Búsqueda y filtros deben mantenerse. La página se conserva si sigue siendo válida; si el resultado pierde su última página, vuelve a una página existente.
8. **Responsive**: repetir alta/edición en desktop, `390×844` y `412×915`. Verificar scroll interno, teclado, foco, mensajes y acciones de guardar/cancelar siempre accesibles. La baja, el detalle informativo y la gestión de profesionales quedan fuera de esta tarea.
