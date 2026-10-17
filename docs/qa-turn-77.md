# TURN-77 — Pruebas locales de Profesionales

## Preparación

1. Ejecutar API y frontend con la configuración local habitual (ver README de cada repositorio). El BFF usa `TURNERO_API_BASE_URL`; iniciar sesión con un negocio con onboarding completo.
2. El backend TURN-77 debe estar ejecutándose: `GET /api/v1/staff-members` devuelve `{ data, page }`. No hay migraciones nuevas. Reiniciar la API si todavía devuelve un array.
3. Abrir `/profesionales`. Preparar al menos 21 profesionales del mismo negocio usando el endpoint existente o datos locales; incluir activos/inactivos, nombres repetidos, roles/especialidades nulos, textos largos y un avatar con URL inválida. No hay creación/edición en esta pantalla (TURN-99).

## Recorrido manual

- Revisar en 1440×900, 390×844 y 412×915: ancho compartido con Servicios, filas legibles, sin scroll horizontal; llegar al último resultado y paginación por encima de navegación mobile.
- Confirmar nombre, rol, especialidad y estado; campos opcionales vacíos se omiten. Avatar ausente o fallido muestra iniciales.
- Buscar fragmentos de nombre, rol y especialidad con mayúsculas/minúsculas. La consulta espera 300 ms, oculta el conjunto anterior y reinicia la página a 1. Máximo 100 caracteres.
- Pasar a página 2. Abrir Filtros, elegir Activos y cerrar con Escape/× sin aplicar: conservar el estado aplicado. Volver a abrir, aplicar Inactivos: página 1, pill visible y resultados filtrados.
- Combinar búsqueda y estado. Quitar pill. Probar Limpiar provisional y aplicar. Confirmar total y anterior/siguiente.
- Probar negocio sin profesionales y búsqueda sin coincidencias: mensajes diferentes.
- Desconectar API: error recuperable; reconectar y Reintentar. Con red lenta, cambiar filtros: no debe aparecer la respuesta anterior.
- Teclado: foco visible, apertura con Enter, radios, tabulación dentro del diálogo, Escape y retorno al botón Filtros.
- Cerrar sesión y entrar con otro negocio: ningún resultado del negocio anterior.

## Automatización

Backend: `make test` configura Colima y ejecuta la suite completa; alternativa documentada en `Turnero-api/docs/referencias/entorno-local.md`.

Frontend:

```sh
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Para repetir solo TURN-77: `npm run test:e2e -- tests/e2e/staff-members.spec.ts`. Capturas `staff-list.png` y `staff-filters.png` quedan bajo `test-results/`; incluye los tres viewports y verificaciones Axe.

## Entrega

Implementación en ramas independientes `feature/TURN-77-staff-list` de ambos repositorios, basadas en los trabajos TURN-98 existentes. QA manual aprobada por el usuario; paginación cubierta por automatización al contar con menos de 20 profesionales. Integración pendiente. Crear PRs separados únicamente después de aprobar las pruebas manuales; ajustar las bases según las dependencias abiertas e integrar backend antes que frontend por el cambio de formato HTTP.

## Resultado de verificación local

- Backend: 484 pruebas, 0 fallos, 0 omisiones; incluye PostgreSQL/Testcontainers con Colima.
- Frontend: lint, TypeScript, 76 unitarios y build aprobados.
- Suite E2E completa: 202 aprobadas, 14 omisiones previstas por viewport en pruebas existentes. Tras agregar el chequeo final de 20 filas, recorrido TURN-77: 15/15 aprobadas en desktop y ambos móviles.
- Capturas de listado y diálogo revisadas contra Stitch y composición aprobada de Servicios; sin scroll horizontal y con paginación accesible sobre navegación mobile. Axe sin infracciones básicas en listado y filtros.
- Los E2E usan respuestas controladas; la aceptación manual con sesión/API reales fue aprobada por el usuario; la paginación queda validada por automatización.
