# Documentacion Turnero Frontend

## Proposito

Este archivo es el indice de documentacion frontend. No reemplaza a los documentos fuente: apunta a que leer segun el objetivo.

## Recorridos de lectura

### Para entender el MVP visual

1. `decisiones-diseno-mvp.md`
2. `stitch/progreso-stitch.md`
3. `handoff-implementacion-mvp.md`
4. `referencias/datos-demo.md`

### Para implementar pantallas

1. `tracking-implementacion-mvp.md`
2. `proximos-pasos-mvp.md`
3. `handoff-implementacion-mvp.md`
4. `decisiones-diseno-mvp.md`
5. `stitch/progreso-stitch.md`
6. `../Turnero-api/docs/mvp/tracking-implementacion-mvp.md` para saber que endpoints backend ya estan disponibles.

### Para trabajar con Stitch

1. `stitch/progreso-stitch.md`
2. `stitch/workflow-drift-stitch.md`
3. `stitch/referencias-implementacion/drift-implementacion-actual.md`
4. `decisiones-diseno-mvp.md`

## Fuentes de Verdad

### `decisiones-diseno-mvp.md`

Fuente para decisiones de producto y diseño:

- Alcance MVP visual.
- Principios de experiencia.
- Layouts separados.
- Agenda como pantalla central.
- Booking cliente sin login obligatorio.
- Backlog post-MVP.

### `handoff-implementacion-mvp.md`

Fuente para implementar UI:

- Tokens y componentes.
- Shell desktop.
- Headers y bottom nav mobile.
- Badges, filtros, cards y estados.
- Orden de implementacion.
- Definition of Done visual.

### `proximos-pasos-mvp.md`

Fuente para roadmap alto nivel de implementacion:

- Fundacion visual.
- Componentes base.
- Layouts y pantallas MVP.
- Orden conceptual de implementacion.
- Reglas generales para no empezar sobre codigo experimental.

### `tracking-implementacion-mvp.md`

Fuente para avance real frontend:

- Estado actual.
- Que esta listo.
- Que esta pendiente.
- Proximo foco recomendado.
- Orden sugerido de PRs chicos.
- Dependencias concretas con backend.
- Que puede hacerse con mocks.
- Que debe esperar endpoints reales.

### `stitch/progreso-stitch.md`

Fuente para seguimiento de pantallas:

- IDs vigentes de Stitch.
- Estado de pantallas.
- Pantallas de referencia.
- QA visual final.

### `stitch/workflow-drift-stitch.md`

Fuente para revisar y corregir drift de Stitch:

- Checklist de HTML.
- Tokens prohibidos.
- Reglas de shell.
- Prompts base para refinamiento.

### `stitch/referencias-implementacion/drift-implementacion-actual.md`

Fuente para la auditoria visual de implementacion:

- Drift detectado contra referencias locales.
- Correcciones FE 6.5 aplicadas.
- Pendientes visuales aceptados para FE 7+.

## Proyecto

- Framework: Next.js.
- Fuente visual MVP: proyecto Stitch documentado en `stitch/progreso-stitch.md`.
- Producto: Turnero para gestion de turnos, agenda admin y booking publico.
- Negocio demo: Barber Studio.

## Referencias

- `referencias/datos-demo.md` - datos demo para pantallas y estados visuales.
