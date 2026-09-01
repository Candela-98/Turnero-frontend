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
2. `roadmap.md`
3. `handoff-implementacion-mvp.md`
4. `decisiones-diseno-mvp.md`
5. `stitch/progreso-stitch.md`
6. `../Turnero-api/docs/mvp/tracking-implementacion-mvp.md` para saber que endpoints backend ya estan disponibles.

### Para trabajar con Stitch

1. `stitch/progreso-stitch.md`
2. `stitch/workflow-drift-stitch.md`
3. `stitch/referencias-implementacion/drift-implementacion-actual.md`
4. `decisiones-diseno-mvp.md`

## Propiedad de cada documento

La información se mantiene en una única fuente. Cuando un documento necesite contexto de otro, debe enlazarlo sin repetirlo.

### `decisiones-diseno-mvp.md`

Fuente para decisiones de producto y diseño:

- Alcance MVP visual.
- Principios de experiencia.
- Layouts separados.
- Agenda como pantalla central.
- Booking cliente sin login obligatorio.
- Decisiones de producto y UX.

### `handoff-implementacion-mvp.md`

Fuente para implementar UI:

- Tokens y componentes.
- Shell desktop.
- Headers y bottom nav mobile.
- Badges, filtros, cards y estados.
- Definition of Done visual.

### `roadmap.md`

Fuente para hitos estables del producto:

- Base de experiencia.
- Operacion administrativa.
- Reserva publica.
- Integracion con el producto real.
- Evolucion post-MVP.

### `tracking-implementacion-mvp.md`

Fuente para avance real frontend:

- Estado actual.
- Cola priorizada de proximos pasos.
- Dependencias concretas con backend.
- Que puede hacerse con mocks.
- Que debe esperar endpoints reales.

### `stitch/progreso-stitch.md`

Fuente para seguimiento de pantallas:

- IDs vigentes de Stitch.
- Estado de pantallas.
- Pantallas de referencia.
- Cobertura y QA visual.

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
