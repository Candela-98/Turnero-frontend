# Turnero Frontend

Frontend web de Turnero, construido con Next.js. El MVP visual usa Stitch como fuente de diseño para admin, agenda, booking publico y estados principales.

## Desarrollo

Instalar dependencias y levantar el servidor:

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Documentacion

La documentacion frontend vive en `docs/`:

- `docs/README.md` - indice de documentacion frontend.
- `docs/roadmap.md` - roadmap de producto frontend.
- `docs/integracion-api-mvp.md` - arquitectura de integracion con Turnero API.
- `docs/decisiones-diseno-mvp.md` - decisiones de producto y diseño.
- `docs/handoff-implementacion-mvp.md` - guia para implementar UI.
- `docs/stitch/progreso-stitch.md` - IDs vigentes y estado de pantallas en Stitch.
- `docs/stitch/workflow-drift-stitch.md` - checklist para detectar drift visual.
- `docs/referencias/datos-demo.md` - datos demo para pantallas.

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run start
npm run test:e2e
npm run check
```

## Fuente visual

Proyecto Stitch:

https://stitch.withgoogle.com/projects/10594197106398501653

Las pantallas vigentes estan registradas en `docs/stitch/progreso-stitch.md`.
