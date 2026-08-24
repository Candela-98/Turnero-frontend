# Turnero Frontend - Proximos Pasos MVP

## Proposito

Este documento define el roadmap alto nivel para implementar el frontend MVP desde las pantallas aprobadas en Stitch y la documentacion visual existente.

No es el tracking de avance real. El estado operativo actualizado vive en `tracking-implementacion-mvp.md`.

La meta es evitar empezar a codear pantallas sobre una base experimental o generada que no represente el sistema visual aprobado.

## Fuentes antes de implementar

- Estado real frontend: `tracking-implementacion-mvp.md`.
- Reglas visuales: `handoff-implementacion-mvp.md`.
- Decisiones de producto y diseno: `decisiones-diseno-mvp.md`.
- Pantallas e IDs vigentes: `stitch/progreso-stitch.md`.
- Datos demo: `referencias/datos-demo.md`.
- Contratos backend: `../Turnero-api/docs/mvp/api-contracts-mvp.md`.
- Tracking backend: `../Turnero-api/docs/mvp/tracking-implementacion-mvp.md`.

## Paso 0 - Limpieza Controlada del Repo

Estado: hecho. El detalle queda en `tracking-implementacion-mvp.md`.

Objetivo:

Arrancar la implementacion del MVP sobre una base limpia, conservando configuracion y documentacion utiles.

Conservar:

- `docs/`
- `README.md`
- `package.json`
- `package-lock.json`
- `next.config.*` si existe.
- `tsconfig.json`
- `eslint.config.*`
- `postcss.config.*`
- `tailwind.config.*` si existe.
- Configuracion necesaria de Next.js.

Borrar o recrear:

- `app/` si contiene pantallas experimentales o generadas.
- `components/` si contiene componentes de prueba.
- `lib/` si solo contiene helpers generados/no usados.
- CSS actual si no refleja el sistema visual aprobado.
- Assets demo que no formen parte del MVP.
- `components.json` generado si apunta a componentes/helpers eliminados.

Resultado esperado:

- App minima que compile.
- `app/layout.tsx`.
- `app/page.tsx`.
- `app/globals.css`.
- Sin pantallas experimentales.
- Sin componentes no alineados al handoff.

## Roadmap de Implementacion

### 1. Fundacion visual

Fuente: `handoff-implementacion-mvp.md`.

Crear:

- Tokens de color.
- Tipografias.
- Radios.
- Espaciados base.
- Superficies.
- Sombras suaves.
- Estilos globales.

Criterio:

- No depender de colores genericos como `slate`, `indigo`, `bg-white`, `text-white` ni clases `dark:`.
- La base debe servir para admin, mobile admin y booking.
- No bloquear este paso por endpoints backend.

### 2. Componentes base

Crear:

- `Button`.
- `IconButton`.
- `Badge`.
- `FilterPill`.
- `Card`.
- `Input`.
- `Select`.
- `Textarea`.
- `Avatar`.
- `EmptyState`.
- `Skeleton`.
- `InlineAlert`.

Criterio:

- Badges, filtros, botones y cards no se definen pantalla por pantalla.
- Los estados visuales siguen las reglas del handoff.
- No depender de datos reales.

### 3. Layouts

Crear:

- `AdminShellDesktop`.
- `AdminMobileHeader`.
- `AdminMobileBottomNav`.
- `TaskMobileHeader`.
- `BookingPublicShell`.

Criterio:

- Admin, booking y login no mezclan shells.
- `Logout` no aparece como item visible en sidebar.
- Booking publico no hereda navegacion admin.

### 4. Datos mock y contratos frontend temporales

Crear:

- Tipos TypeScript temporales para entidades visibles.
- Datos mock centralizados.
- Helpers/adapters para alimentar pantallas sin hardcodear datos en componentes.

Entidades iniciales:

- `Appointment`.
- `Customer`.
- `StaffMember`.
- `ServiceOffering`.
- `Business`.
- `BookingSettings`.

Criterio:

- Los mocks deben alinearse a `referencias/datos-demo.md`.
- Los tipos deben ser faciles de ajustar contra `../Turnero-api/docs/mvp/api-contracts-mvp.md`.
- Las pantallas no deben depender de fetch real todavia.
- El detalle de dependencias backend vive en `tracking-implementacion-mvp.md`.

### 5. Agenda

Implementar primero:

- Agenda desktop dia.
- Agenda mobile `Todos`.
- Agenda mobile por profesional.

Motivo:

Agenda valida la mayoria de componentes criticos: turnos, pendientes, disponibilidad, filtros, CTA, acciones y navegacion.

### 5.5. Resiliencia base

Fuente: `tracking-implementacion-mvp.md`.

Agregar antes de multiplicar pantallas:

- Typecheck separado.
- Unit tests para helpers puros.
- Smoke tests desktop/mobile con Playwright.
- Accesibilidad automatizada basica.
- Error boundary y not found.
- CI minimo.

Criterio:

- Cada nueva pantalla debe pasar lint, typecheck, unit tests, build y smoke e2e relevante.
- Los tests e2e validan flujos criticos, no detalles fragiles de implementacion.
- La resiliencia no bloquea la fundacion visual por falta de endpoints backend.

### 6. Crear / editar turno

Implementar:

- Drawer desktop.
- Flujo mobile full-screen.

Criterio:

- Sin `Guardar borrador`.
- Desktop usa drawer.
- Mobile usa pantalla transaccional.

### 6.5. Correccion de drift Stitch

Estado: hecho. El detalle queda en `tracking-implementacion-mvp.md` y `stitch/referencias-implementacion/drift-implementacion-actual.md`.

Criterio:

- Antes de avanzar a nuevas pantallas, validar estructura, paleta, shell y patrones principales contra las referencias locales de Stitch.
- Corregir drift P0/P1 en layout base, agenda y crear turno.
- No bloquear esta correccion por endpoints backend.

### 7. Booking cliente

Implementar:

- Booking mobile single-page.
- Confirmacion post-reserva.

Criterio:

- Sin login obligatorio.
- Sin elementos admin.
- Header publico con marca.
- Sticky inferior con resumen y CTA.

### 8. Gestion admin

Implementar:

- Dashboard.
- Clientes.
- Perfil de cliente.
- Servicios.
- Profesionales.
- Configuracion.

Criterio:

- Usar componentes compartidos.
- No copiar variaciones accidentales de shell.
- Mantener consistencia con Stitch y handoff.

### 9. Estados y referencias

Implementar:

- Empty states.
- Loading states.
- Errores y validaciones.
- Notificaciones mobile.

Criterio:

- Estados vacios accionables.
- Loading con skeleton contextual.
- Errores claros y cercanos al lugar donde ocurren.

### 10. Integracion API

Estado: progresivo por endpoint backend disponible.

Implementar:

- Cliente HTTP.
- Auth/session.
- Endpoints admin.
- Endpoints publicos de booking.
- Manejo de errores reales.
- Reemplazo progresivo de mocks.

Criterio:

- Usar `api-contracts-mvp.md` del backend como fuente de verdad.
- No duplicar reglas de negocio en frontend si backend ya las valida.
- Mantener los tipos frontend alineados a DTOs reales.
- Consultar `../Turnero-api/docs/mvp/tracking-implementacion-mvp.md` antes de reemplazar mocks por llamadas reales.

## Definition of Ready para Codear

Antes de codear frontend:

- Repo limpio y app minima compilando.
- Docs frontend organizados.
- Handoff de implementacion aprobado.
- IDs vigentes de Stitch confirmados.
- Datos demo disponibles.
- Decidir librerias base: iconos, componentes, forms y fetch/client API.
- Para integracion real, contratos API backend aprobados.
- Revisar `tracking-implementacion-mvp.md` para confirmar el estado real y dependencias backend.

## Notas

- No implementar pantallas sobre codigo experimental si contradice el sistema aprobado.
- No convertir vistas operativas en landing pages.
- No reabrir pantallas core salvo inconsistencia visual fuerte.
- El backend API ya tiene contratos aprobados, pero la implementacion sera incremental.
- Inicialmente el frontend puede usar datos mock alineados a `referencias/datos-demo.md`.
- Mantener `tracking-implementacion-mvp.md` como fuente unica de avance real frontend.
