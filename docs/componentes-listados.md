# Componentes para listados y filtros

Los componentes genéricos se exportan desde `@/components/ui`. No realizan consultas ni conocen DTOs o reglas de una pantalla.

| Componente | Contrato |
| --- | --- |
| `ResponsiveDialog` | `open`, `onOpenChange`, `trigger`, `title`, `description`, `closeLabel`, `children`, `footer`. Radix gestiona foco, Escape y bloqueo del fondo. Desktop centrado, mobile panel inferior con scroll y safe area. |
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
