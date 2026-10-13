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
