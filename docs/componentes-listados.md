# Componentes para listados y filtros

Los componentes genéricos se exportan desde `@/components/ui`. No realizan consultas ni conocen DTOs o reglas de una pantalla.

| Componente | Contrato |
| --- | --- |
| `ResponsiveDialog` | `open`, `onOpenChange`, `trigger`, `title`, `description`, `closeLabel`, `closeDisabled`, `children`, `footer`. Radix gestiona foco, Escape y bloqueo del fondo. Desktop centrado, mobile panel inferior con scroll y safe area. |
| `FilterButton` | `count` y `label`, además de props de Button. Muestra el contador solo cuando es mayor que cero. Puede usarse como trigger del diálogo. |
| `FilterOptionGroup` | `label`, `value`, `options`, `onValueChange`. Selección única con radios nativos; cada instancia tiene un nombre independiente. `disabled` deshabilita el grupo. |
| `AppliedFilterChip` | `label`, `onRemove`, `removeLabel`. Pill removible con etiqueta accesible; no es un toggle. |
| `SearchInput` | `label` y props de Input, salvo `type`. Incluye lupa, label accesible e ID automático cuando no se proporciona uno. El debounce queda en la pantalla. |
| `ListToolbar` | `label`, `search` (props de SearchInput), `filterAction`, `appliedFilters`, `appliedFiltersLabel`. Compone buscador, acción y filtros activos. |
| `Pagination` | `page` desde cero, `pageCount`, `onPageChange`, `label`, `disabled`. Se oculta si hay menos de dos páginas. |

## Selección y búsqueda de opciones

`FilterOptionGroup` recibe opciones `{ value, label, pinned? }`. Usar `pinned: true` para que la opción de quitar el filtro permanezca visible durante una búsqueda. La búsqueda local se habilita con `searchThreshold`; el umbral cuenta solo las opciones no fijadas. `searchLabel` y `emptySearchMessage` permiten adaptar los textos.

El grupo admite `children` para mostrar carga o error antes de las opciones. La búsqueda es interna y se reinicia al desmontar el componente; usar una nueva `key` cuando una acción de limpiar también deba vaciarla.

## Ejemplo de composición

```tsx
<ListToolbar
  label="Filtros de profesionales"
  search={{ label: "Buscar profesionales", placeholder: "Buscar profesionales", value: search, onChange: event => setSearch(event.target.value) }}
  filterAction={<FilterButton count={activeCount} onClick={() => setOpen(true)} />}
  appliedFilters={specialty ? <AppliedFilterChip label={specialty} onRemove={() => setSpecialty("")} /> : null}
/>
```

Para usar `ResponsiveDialog`, colocar el botón en su prop `trigger` y manejar la apertura con `open` y `onOpenChange`. Mantener las selecciones provisionales en el componente de la pantalla, copiarlas desde los filtros aplicados al abrir y confirmar únicamente desde la acción Aplicar. El diálogo no impone cómo se guarda ni se limpia un formulario.

## Componentes de Servicios

- `ServiceFiltersDialog`: compone los controles genéricos y mantiene las selecciones provisionales de estado/categoría, limpiar, cancelar y aplicar.
- `ServiceOfferingCard`: recibe un modelo `ServiceOffering`; muestra nombre, categoría, estado, duración y precio ARS. Se puede usar en otra vista que muestre servicios.
- `ServiceOfferingsList`: recibe servicios, total y paginación; no consulta la API.
- `ServicesPage`: conserva autenticación, consultas con TanStack Query, debounce, estados de resultados y reinicio de página al filtrar.

El encabezado `AdminPageHeader` y el shell `AdminAppShell` siguen compartidos desde `@/components/layouts`. Los estados reutilizan `EmptyState`, `InlineAlert` y `Skeleton`.

## Formulario de servicios (TURN-96)

- `ServiceOfferingEditor` recibe `trigger`, `id` opcional y `onSaved`. Sin ID abre alta; con ID consulta el detalle real. Usa `ResponsiveDialog`, confirmación de descarte y bloqueo de cierre durante el guardado.
- `ServiceOfferingForm` comparte campos y validaciones de alta/edición. Recibe negocio, servicio inicial opcional, categorías sugeridas y callbacks de guardar/cancelar. `footerTarget` opcional permite llevar sus acciones al footer fijo del diálogo; sin esa prop las renderiza dentro del formulario.
- `ConfirmDiscardDialog` presenta Seguir editando/Descartar con Radix AlertDialog.
- `FloatingAlert` flota por defecto abajo a la derecha en desktop, acompaña el scroll y respeta la navegación mobile. `placement="dialog"` coloca explícitamente el feedback en flujo dentro del footer de un diálogo. Los éxitos se cierran a los 6 segundos y admiten cierre manual; hover/foco pausan el temporizador.
- `AdminFormActions` reúne Guardar desktop/mobile y reserva automáticamente espacio para sus avisos, mediante `SaveActionFeedback`. Configuración, reglas de reserva y horarios lo usan sin copiar clases de posición. Los errores que requieren reintento permanecen visibles. `AdminPageSection withSaveAction` reserva el espacio inferior de los formularios.
- `ResponsiveDialog.closeDisabled` deshabilita la × y bloquea Escape/fondo; el formulario aporta además un bloqueo inmediato de doble envío.
- Los adapters de formulario, precio y errores están en `lib/service-offerings/form.ts`. El precio se edita en pesos y se convierte a centavos enteros.
- Las keys y el refresco de listado/categorías/detalle se centralizan en `lib/service-offerings/queries.ts`. Un fallo de refresco posterior a una escritura exitosa no repite la mutación.

La composición completa y los helpers de verificación están en `patrones-pantallas.md`.

## Estado de servicios (TURN-98)

- `ServicesWorkspace` centraliza avisos y reintento de lecturas del catálogo; `serviceNotices` define título y descripción específicos para crear, actualizar, desactivar, restaurar y eliminar, seleccionados mediante una clave tipada; el listado conserva su ancho completo.
- `ServiceStatusConfirmation` confirma Desactivar, Restaurar o Eliminar desde las tarjetas, bloquea doble envío y mantiene los errores en el diálogo para reintentar. Al cambiar de estado conserva búsqueda, filtros y página válida.
- `ConfirmActionDialog` comparte confirmación accesible con foco inicial en Cancelar, acción opcional de peligro, bloqueo durante envío y contenido de error. El propietario cierra al confirmar éxito; `ConfirmDiscardDialog` conserva su contrato como wrapper.
- `applyServiceStatus` actualiza detalle y resultados cacheados, excluye la fila de páginas cuyo estado ya no corresponde y cancela lecturas obsoletas antes de invalidar. La escritura no se repite al reintentar un refresco fallido.
- Restaurar usa PATCH exclusivamente con `status: "ACTIVE"`; Desactivar usa DELETE lógico. Eliminar solo está disponible para inactivos y usa DELETE `/{id}/catalog`: borrado lógico sin restauración desde la app. `applyServiceRemoval` quita resultados cacheados y el dato de edición antes del refresco. Las antiguas URLs de detalle redirigen al catálogo.

## Profesionales (TURN-77)

`StaffMembersPage` gestiona consulta por negocio, debounce y estados; `StaffMembersList` y `StaffMemberCard` solo presentan modelos de `lib/staff-members`. `StaffFiltersDialog` mantiene estado provisional hasta Aplicar, reutilizando los controles compartidos. El listado oculta resultados durante debounce y nuevas consultas, conserva el borrado de caché de sesión del proveedor de auth y propaga cancelación. `Avatar` muestra iniciales también ante errores de imagen. La base de lectura de TURN-77 se amplía con alta y edición en TURN-99; servicios, horarios y detalle operativo permanecen en sus tareas.


## Formulario de profesionales (TURN-99)

`StaffMemberEditor` compone `ResponsiveDialog`, carga de detalle y `ConfirmDiscardDialog`; `StaffMemberForm` comparte alta/edición, validación con foco, footer fijo y bloqueo inmediato de doble envío/cierre. Reutiliza `Input`, `Switch`, `SaveChangesButton` y `FloatingAlert`; no crea controles visuales alternativos. `lib/staff-members/form.ts` convierte valores, calcula PATCH y diferencia errores de campos y vinculación. La opción de vincular al usuario actual existe solo en alta; avatar y estado se conservan. El listado gestiona avisos de guardado e invalida sus consultas sin repetir la escritura cuando falla una lectura. Su tarjeta/listado reciben acciones por composición, sin consultar datos.

La fila de un profesional vinculado al usuario autenticado muestra **Vos**, comparando `user_id` con el ID de sesión, sin inferir identidad por nombre. En edición se identifica como **Tu perfil profesional**; el conflicto de alta indica buscar la etiqueta Vos.

El alta comprueba la vinculación mediante GET `staff-members/me`, con key por negocio/usuario, consulta fresca al abrir e invalidación tras guardar o recibir conflicto. La opción se bloquea durante carga/error y si ya existe un profesional (también inactivo o fuera del listado visible), indicando su nombre. Se puede crear sin vinculación mientras esa opción está bloqueada; el backend mantiene la restricción ante carreras.

## Servicios por profesional (TURN-78)

`StaffServicesEditor` abre un `ResponsiveDialog` controlado desde el listado, sin desmontarse cuando se refrescan las filas. `ResponsiveDialog.trigger` es opcional para permitir acciones externas; la pantalla devuelve el foco al botón o buscador. Primero carga asociaciones frescas y la primera página del catálogo. `StaffServicesForm` captura ese conjunto como baseline una sola vez; los refetches no reemplazan el borrador. `StaffServiceRow` es una selección múltiple con checkbox nativo, nombre/categoría/duración e indicación de inactivo.

El formulario comparte `SearchInput`, `FilterOptionGroup` para Catálogo/Seleccionados, `Pagination`, `SaveChangesButton`, estados/avisos y `ConfirmDiscardDialog`. Catálogo consulta solo activos, páginas de 20 y debounce de 300 ms; Seleccionados busca y pagina el borrador local, incluidos inactivos existentes. Guarda el conjunto completo de IDs únicos ordenados y compara conjuntos sin depender del orden. Quitar todos/Restablecer selección son acciones locales. Las mutaciones fallidas conservan el borrador; un fallo de refresco posterior a 204 reintenta solo lecturas. Los adapters y la cancelación/invalidation de asociaciones, profesionales y servicios afectados están en `lib/staff-members/services.ts` y `service-queries.ts`.

La fila distingue **Especialidad: …** (texto libre) de los servicios asignados. La acción muestra **Servicios (N)** o **Asignar servicios** si el contador es cero. `service_count` viene agregado en la respuesta del listado, sin peticiones por fila; incluye inactivos conservados y excluye eliminados. Si una versión anterior de la API no envía el contador, el adapter conserva `null` y la acción muestra Servicios, sin inferir cero. El editor abre Seleccionados si la lectura fresca contiene asignaciones y Catálogo si está vacía; un contador desactualizado no decide la vista inicial. Tras guardar se actualiza el contador cacheado antes del refresco.

Eliminar un servicio del catálogo cancela las lecturas pendientes del listado de profesionales y lo marca obsoleto, para recalcular sus contadores al volver a esa pantalla. Desactivar conserva el conteo porque la asociación inactiva sigue asignada.


## Horarios por profesional (TURN-79)

`ActionMenu` recibe un trigger y acciones con etiqueta/callback. Usa Radix DropdownMenu para flechas, Escape y foco; difiere la acción hasta cerrar el menú para abrir un diálogo sin conflictos. Profesionales mantiene Servicios visible y reúne Editar datos/Horarios en Más acciones. Los editores se controlan desde la pantalla, fuera de las filas que pueden desmontarse durante un refresco. `StaffMemberEditor` conserva su trigger en alta y admite `open`/`onOpenChange` para edición controlada.

`WeeklyDayRow` comparte la presentación pura de un día, switch, campos time y errores entre Configuración y Profesionales. Recibe etiquetas, IDs, valores y callbacks; no consulta datos ni impone reglas de negocio. `lib/weekly-hours.ts` centraliza días y nombres; cada dominio conserva sus adapters, validación y comparación de cambios.

`StaffHoursEditor` usa ResponsiveDialog, footer fijo, SaveChangesButton, ConfirmDiscardDialog y avisos compartidos. Consulta una semana fresca por negocio/profesional con AbortSignal; captura el baseline una sola vez y no reemplaza el borrador ante refetches. Horas ocultas de días no disponibles no cuentan como cambios; reactivar restaura el borrador. PUT envía siete días y normaliza horas no disponibles a null. La respuesta confirmada actualiza la caché y cierra con Horarios actualizados; si el 200 es inválido, la recuperación repite solo GET. El módulo `lib/staff-members/hours.ts` convierte el contrato de array directo a camelCase, valida y ordena la semana.

`WeeklyDayRow.hints` admite ayuda informativa junto a Inicio/Fin y por día, asociada mediante aria-describedby y separada de errores de validación. Profesionales consulta horarios del negocio por sesión con cancelación y lectura fresca al abrir; `staffHoursHints` explica límites de apertura/cierre, rangos sin intersección y días cerrados. Estos avisos no alteran el borrador ni bloquean el guardado. Si la comparación no puede cargarse, se ofrece reintento y se mantiene la edición; el backend sigue aplicando la disponibilidad efectiva.
