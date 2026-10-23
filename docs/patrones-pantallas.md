# Patrones compartidos de pantallas

Esta guía y `AGENTS.md` conservan las decisiones aprobadas entre sesiones. Los componentes aportan el comportamiento por defecto y los E2E comprueban el resultado en el navegador. Una pantalla nueva debe incorporar estas comprobaciones: CI no puede verificar una pantalla que todavía no tenga recorrido de prueba.

## Estructura admin

El layout de ruta ya renderiza `AdminAppShell`: aporta navegación, `main` y padding exterior desktop. Dentro de él usar `AdminPageSection` para ancho y espacio inferior, y `AdminPageHeader` para el título de una sección principal. Las tareas focalizadas conservan el encabezado de volver/cerrar. Mantener los modelos y adapters en `lib/`.

## Formulario de página

```tsx
<AdminPageSection withSaveAction>
  <AdminPageHeader title="Mi pantalla" description="Descripción de la tarea." />
  <form id={formId} noValidate onSubmit={handleSubmit}>
    {/* Campos con labels, validación local y foco en el primero inválido. */}
    <AdminFormActions formId={formId} hasChanges={hasChanges} isSaving={isSaving}>
      {hasSaved && (
        <FloatingAlert title="Cambios guardados" tone="positive"
          dismissLabel="Cerrar confirmación" onDismiss={() => setHasSaved(false)}>
          {null}
        </FloatingAlert>
      )}
      {saveError && (
        <FloatingAlert title="No pudimos guardar" tone="error"
          dismissLabel="Cerrar error" onDismiss={() => setSaveError(null)}>
          <p>{saveError}</p>
          <Button disabled={isSaving} onClick={retry}>Reintentar</Button>
        </FloatingAlert>
      )}
    </AdminFormActions>
  </form>
</AdminPageSection>
```

`AdminFormActions` comparte el estado de Guardar entre desktop y mobile y reserva espacio sobre la acción para los avisos. No colocar un segundo botón ni copiar clases de posición en cada pantalla. Comparar campos con los últimos datos guardados; deshabilitar Guardar sin cambios o durante el envío. Los errores de campo se muestran junto al campo, sin repetirlos en el aviso de guardado.

## Avisos y diálogos

- `FloatingAlert` usa `placement="viewport"` por defecto: fijo a la derecha en desktop y 16 px sobre la navegación mobile, incluida su safe area. Dentro de `AdminFormActions` o `SaveActionFeedback` deja espacio sobre Guardar automáticamente en ambos viewports; un listado sin acción fija no reserva esa altura adicional.
- Éxitos: cierre manual y automático a los 6 segundos; hover y foco pausan el temporizador. Al salir del aviso comienza un nuevo período de 6 segundos. Los renders y los cambios de identidad del callback no reinician el temporizador.
- Copy de éxito: título específico de la acción confirmada, como «Profesional creado», «Horarios actualizados» o «Servicio eliminado». Omitir la descripción si solo repite el título o informa genéricamente que se guardaron datos; en el ejemplo anterior `{null}` deja el aviso con título solamente. Agregar descripción cuando explica una consecuencia o siguiente paso: cómo reactivar un recurso o que se conserva el historial tras eliminarlo. No afirmar efectos que la operación no garantiza.
- Mantener los mensajes por acción en el catálogo del dominio y compartirlos entre listado y detalle, siguiendo `serviceNotices` y `staffNotices`. Al revisar una tarea, recorrer sus acciones con éxito, comprobar el copy de cada resultado en los E2E afectados y verificar posición, cierre y legibilidad con `expectAdminNotice` y capturas en los tres viewports. Esta revisión de significado forma parte del trabajo del agente; lint y TypeScript no validan la calidad del texto.
- Errores recuperables: sin cierre automático; conservan el contexto y ofrecen reintento. Si la escritura funcionó pero falló el refresco, reintentar solo la lectura.
- Formularios en modal: `ResponsiveDialog` aporta foco, Escape, bloqueo del fondo, panel inferior mobile y footer separado del scroll. Para un error de guardado en ese footer se elige explícitamente `FloatingAlert placement="dialog"`. `closeDisabled` bloquea el cierre mientras se guarda; `ConfirmDiscardDialog` confirma el descarte de cambios.

## Listados

Usar `AdminPageSection`, `AdminPageHeader`, `ListToolbar`, filtros con `ResponsiveDialog`, `AppliedFilterChip`, `Pagination`, `Skeleton`, `EmptyState` e `InlineAlert`. Aplicar selección provisional al confirmar el diálogo; restablecer página al cambiar filtros y mantenerla válida tras editar. Ver contratos en `componentes-listados.md`.

## Verificación y CI

En los E2E de cada pantalla nueva importar los helpers de `tests/e2e/helpers/admin-patterns.ts`:

```ts
await expectAdminViewport(page); // Sin scroll horizontal.
await expectAdminSaveAction(page); // Una acción visible, target de 44px y sobre la navegación mobile.
await expectAdminNotice(page, { withSaveAction: true }); // Posición fija, derecha desktop, scroll y sin tapar Guardar.
```

Playwright ejecuta desktop `1440×900`, mobile `390×844` y mobile `412×915`. Además, probar carga, vacío, validación, edición, reversión, envío, éxito, error/reintento, teclado, descarte y accesibilidad según corresponda. Para listados sin Guardar omitir `withSaveAction`.

`npm run test:patterns` ejecuta los recorridos de referencia de Configuración y Servicios. `npm run check` añade lint, TypeScript, unitarios, build y todos los E2E; CI lo ejecuta en PRs y pushes a `dev`, `develop` y `main`, y conserva el reporte del navegador si falla. Antes de entregar, revisar visualmente los cambios de UI contra Stitch y las pantallas aprobadas.


### Acciones secundarias en filas

Cuando una fila de Profesionales ofrece Servicios, Editar datos y Horarios, conservar Servicios visible con su cantidad y agrupar las otras acciones en `ActionMenu` (Más acciones). Mantener los diálogos controlados en la pantalla, fuera del árbol de resultados que se desmonta al consultar. Abrirlos después del cierre del menú y devolver foco a la fila o al buscador si desapareció. Los horarios reutilizan `WeeklyDayRow`, con reglas y etiquetas por dominio, dentro de ResponsiveDialog con footer fijo.

### Detalles navegables y acciones de estado

Profesionales usa `/profesionales/[id]` con el shell admin existente, encabezado y tarjeta compartidos, más enlace explícito de regreso. q/status/page conservan el contexto entre detalle y listado; las acciones por menú admiten enlaces nativos. Desactivar/Reactivar comparten una confirmación persistente fuera del árbol de resultados, con Cancelar como foco inicial, bloqueo durante envío y reintentos de lectura tras cambios ya confirmados.

Clientes reutiliza el patrón de detalle navegable en `/clientes/[id]`: contacto y notas reales, edición existente y confirmación compartida de estado. El layout del dominio conserva los avisos entre listado/detalle; la actualización de caché preserva datos de detalle que no existen en el resumen. La edición debe esperar una primera lectura fresca también cuando otro observador mantiene el detalle activo.

En Clientes el archivo organiza el listado, mientras el bloqueo restringe solo reservas públicas. Son estados independientes con acciones explícitas, confirmaciones y filtros combinados; el motivo del bloqueo se presenta como información interna en el detalle. La agenda demo permanece separada de estas reglas reales.

## Agenda de lectura (TURN-70)

`AgendaPage` mantiene consulta, negocio/zona y parámetros exclusivos de `/agenda`; `AgendaDateNav`, `AgendaFiltersDialog`, `AgendaResults` y `AgendaAppointmentCard` presentan navegación, filtros provisionales y resultados. `lib/appointments` concentra DTO, adapter, fechas, lectura de todas las páginas y keys por negocio/zona/día/filtros. No presentar días parciales ni datos de una selección anterior mientras carga otra. Profesionales reutiliza el catálogo completo paginado, incluye inactivos y suma referencias históricas de los resultados. La grilla agrupa todos los turnos de cada hora por profesional, amplía el eje y contiene su propio scroll horizontal; mobile conserva orden cronológico. Diferenciar loading, vacío, sin coincidencias, denegado y error recuperable. No cerrar una sesión válida ante 403; 401 usa recuperación de auth.

### Grilla temporal de agenda — mejora aprobada por el usuario

Escala continua con divisiones según `slot_interval_minutes` de `GET /booking-settings` (15, 30, 45 o 60), y altura proporcional a duración, cabeceras profesionales sticky y eje horario sticky dentro de una región con scroll y foco. Profesionales ordenados alfabéticamente; condición Inactivo/Eliminado/No disponible desde lectura explícita, sin inferir eliminación por ausencia en catálogo. Fecha completa y Hoy; reloj reactivo por minuto en la zona del negocio y marcador solo en el día actual. Tarjeta desktop compacta sin profesional redundante; mobile conserva profesional y condición. Solapamientos en carriles laterales; intervalos adyacentes reutilizan carril. La escala usa instantes para respetar duración real durante DST, con etiquetas de offset cuando se repiten horas. En turnos breves o textos largos, el contenido tiene scroll y foco, más descripción accesible completa.

La agenda consulta el intervalo con key aislada por negocio, cancelación y lectura fresca al volver/foco. No presenta una grilla provisional de 30 minutos durante carga o error; ofrece reintento. Configuración comparte los valores permitidos y publica en caché el intervalo confirmado por el servidor, cancelando lecturas anteriores. El intervalo solo cambia las marcas y límites del eje: nunca redondea ni mueve turnos o altera la escala por minuto.

La grilla consulta la semana de `GET /business-hours` y elige el día de la fecha seleccionada en la zona del negocio. Incluye un intervalo configurado antes de abrir y después de cerrar, alineando límites a las marcas de la grilla. El gris se extiende hasta el borde inferior, incluida la etiqueta del límite final. Fuera del horario usa fondo gris y texto explicativo; conserva los turnos históricos fuera del rango y el marcador actual. Un día cerrado con historial se grisa por completo, sin inventar una ventana de apertura. Mobile mantiene su lista y muestra el horario o cierre del día. La consulta tiene cancelación, aislamiento por negocio, reintento y actualización de caché tras guardar los horarios confirmados.

La posición inicial de la grilla desktop al cargar una selección es la apertura del día (09:00 si abre a las 9). El margen gris anterior permanece disponible mediante scroll hacia arriba. Se conservan las cabeceras fijas y no se fuerza de nuevo la posición al actualizar el reloj. Días cerrados con historial comienzan al inicio del rango obtenido; la lista mobile mantiene su orden.

El botón «Hoy» de Agenda usa `subtle` con texto primary y `aria-current="date"` cuando la fecha seleccionada coincide con la fecha actual del negocio; permanece habilitado y conserva su nombre. En otras fechas usa `outline` sin aria-current. El badge junto a la fecha se conserva; el estado también responde a anterior/siguiente y al selector de fecha.
