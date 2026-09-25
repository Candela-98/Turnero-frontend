# Guía de trabajo frontend

Este archivo aplica al repositorio `turnero-frontend`. Antes de crear una pantalla o un patrón visual, consultá `docs/patrones-mobile.md` y las decisiones vigentes de Stitch.

## Plan para cada pantalla

1. Revisar flujos, estados y componentes existentes en `components/ui`, `components/layouts` y la sección relacionada. Reutilizar el componente existente si su semántica coincide; extenderlo con props cuando el nuevo caso conserve el mismo contrato.
2. Definir primero los estados de UX: carga, datos, vacío, edición sin cambios, cambios pendientes, guardando, éxito, validación y error recuperable. No extraer una abstracción solo porque dos elementos se parecen visualmente; compartir comportamiento cuando también sea igual.
3. Mantener DTOs y adapters en `lib/`; no acoplar la UI a nombres `snake_case`. Comparar formularios contra la última respuesta cargada o guardada, no contra valores iniciales fijos. En formularios de edición, deshabilitar «Guardar cambios» sin cambios o durante el guardado, tanto en desktop como en mobile; permitirlo de nuevo al editar y deshabilitarlo si se revierte o se guarda correctamente.
4. Usar los componentes compartidos para acciones y feedback: `SaveChangesButton`, `FloatingAlert`, `InlineAlert` y `AdminMobileStickyAction` donde corresponda. Los éxitos pueden cerrarse solos y manualmente; los errores que requieren acción permanecen visibles. En validación, mostrar el mensaje específico junto a cada campo y llevar el foco suavemente al primero inválido (respetando movimiento reducido). No duplicar errores de campos en un aviso flotante; reservar `FloatingAlert` para resultados de guardado y ubicarlo sin tapar la acción primaria.
5. Verificar accesibilidad y responsive: labels, foco, `aria-invalid`/`aria-describedby`, contraste, targets táctiles, safe areas y viewport mobile de `390×844` y `412×915`. Cubrir con pruebas el estado inicial, edición, reversión, guardado, error y reintento; ejecutar `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` y los E2E afectados.

## Criterio de revisión

- Señalar duplicación de comportamiento ya resuelto por un componente compartido y estados inconsistentes entre páginas equivalentes.
- No forzar una abstracción genérica que oculte reglas de dominio distintas; por ejemplo, un día cerrado no compara horas ocultas.
- Mantener las instrucciones de este archivo breves y actualizarlas solo cuando una decisión se convierta en patrón estable del producto.
