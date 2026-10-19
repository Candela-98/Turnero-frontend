# Guía de trabajo frontend

Este archivo aplica al repositorio `turnero-frontend` en todas las sesiones. Antes de crear o modificar una pantalla, consultá `docs/patrones-pantallas.md`, `docs/patrones-mobile.md`, `docs/componentes-listados.md` y las decisiones vigentes de Stitch. Estos patrones aprobados aplican a desktop y mobile; documentar cualquier nuevo patrón compartido en estos archivos.

## Plan para cada pantalla

1. Revisar flujos, estados y componentes existentes en `components/ui`, `components/layouts` y la sección relacionada. Reutilizar el componente existente si su semántica coincide; extenderlo con props cuando el nuevo caso conserve el mismo contrato.
2. Definir primero los estados de UX: carga, datos, vacío, edición sin cambios, cambios pendientes, guardando, éxito, validación y error recuperable. No extraer una abstracción solo porque dos elementos se parecen visualmente; compartir comportamiento cuando también sea igual.
3. Mantener DTOs y adapters en `lib/`; no acoplar la UI a nombres `snake_case`. Comparar formularios contra la última respuesta cargada o guardada, no contra valores iniciales fijos. En formularios de edición, deshabilitar «Guardar cambios» sin cambios o durante el guardado, tanto en desktop como en mobile; permitirlo de nuevo al editar y deshabilitarlo si se revierte o se guarda correctamente.
4. Usar los componentes compartidos para acciones y feedback: `SaveChangesButton`, `FloatingAlert`, `InlineAlert` y `AdminMobileStickyAction` donde corresponda. Los éxitos pueden cerrarse solos y manualmente; los errores que requieren acción permanecen visibles. En validación, mostrar el mensaje específico junto a cada campo y llevar el foco suavemente al primero inválido (respetando movimiento reducido). No duplicar errores de campos en un aviso flotante; reservar `FloatingAlert` para resultados de guardado y ubicarlo sin tapar la acción primaria.
5. Verificar accesibilidad y responsive: labels, foco, `aria-invalid`/`aria-describedby`, contraste, targets táctiles, safe areas y viewport mobile de `390×844` y `412×915`. Cubrir con pruebas el estado inicial, edición, reversión, guardado, error y reintento; ejecutar `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` y los E2E afectados.

## Criterio de revisión

- Señalar duplicación de comportamiento ya resuelto por un componente compartido y estados inconsistentes entre páginas equivalentes.
- Antes de entregar una acción con feedback, revisar su mensaje de éxito: título específico del resultado y descripción solo si aporta una consecuencia o siguiente paso útil. Evitar frases genéricas repetidas como «Los datos se guardaron correctamente». Reutilizar el catálogo de mensajes del dominio en listado y detalle; tomar Servicios y `staff-feedback.ts` como referencia. En los E2E afectados comprobar el mensaje correspondiente a cada acción y revisar su presentación desktop/mobile con `expectAdminNotice`.
- No forzar una abstracción genérica que oculte reglas de dominio distintas; por ejemplo, un día cerrado no compara horas ocultas.
- Mantener las instrucciones de este archivo breves y actualizarlas solo cuando una decisión se convierta en patrón estable del producto.

## Composición obligatoria de nuevas pantallas admin

- El layout de ruta aporta `AdminAppShell`: no duplicar shell, landmark `main` ni padding exterior. Usar `AdminPageSection` y `AdminPageHeader` en secciones principales; las tareas focalizadas mantienen su encabezado de volver/cerrar.
- Formularios de página: `AdminPageSection withSaveAction` y `AdminFormActions` dentro del formulario. Colocar los avisos de guardado como hijos de `AdminFormActions`; este componente gestiona Guardar en ambos viewports y la separación del aviso. No copiar offsets, z-index ni acciones mobile desde otra pantalla.
- `FloatingAlert` flota por defecto a la derecha en desktop y acompaña el scroll. En mobile queda 16 px sobre la navegación; solo dentro de `AdminFormActions`/`SaveActionFeedback` reserva además espacio sobre Guardar. Éxitos: 6 segundos, cierre manual, pausa por hover/foco. Errores recuperables: persistentes con reintento. `placement="dialog"` se usa explícitamente solo dentro del footer de un diálogo; para carga y validación usar `InlineAlert` o mensajes de campo.
- Listados: componer `ListToolbar`, `SearchInput`, filtros con `ResponsiveDialog`, `AppliedFilterChip`, estados compartidos y `Pagination`. Diálogos de edición: `ResponsiveDialog`, acciones en su footer y `ConfirmDiscardDialog` cuando existan cambios pendientes.
- Incorporar `expectAdminViewport`, `expectAdminSaveAction` y `expectAdminNotice` de `tests/e2e/helpers/admin-patterns.ts` a los E2E de cada pantalla nueva según sus estados. Verificar los tres proyectos de Playwright sin omitir desktop o mobile para estos contratos. CI ejecuta todos los E2E mediante `npm run check`.
