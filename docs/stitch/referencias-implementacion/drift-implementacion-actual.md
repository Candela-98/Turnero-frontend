# Drift de Implementacion Actual

Actualizado: 2026-07-11

## Alcance revisado

Comparacion entre implementacion frontend actual y referencias locales de Stitch en:

- `layout-base`
- `agenda-desktop-dia`
- `agenda-mobile-todos`
- `agenda-mobile-profesional`
- `crear-turno-desktop`
- `crear-turno-mobile`

## Drift P0 corregido en FE 6.5

| Area | Drift detectado | Correccion aplicada |
| --- | --- | --- |
| Sistema visual | Paleta marron/calida no alineada con Stitch. | Tokens base migrados a azul operacional y superficies frias en `app/globals.css`. |
| Layout desktop | Sidebar mas angosto y con ritmo distinto al layout base. | `AdminShellDesktop` ajustado a sidebar ancho, nav mas grande, header alto y search similar a Stitch. |
| Agenda desktop | Vista por cards/columnas de profesional, no grilla diaria por hora. | Agenda reemplazada por grilla hora x profesional con rail derecho operativo. |
| Rail desktop | Metricas sueltas y alerta mock visible, no paneles operativos. | Agregados paneles `Proximo turno`, `Carga del dia` y `Pendientes`. |
| Agenda mobile | Lista sin columna horaria ni CTA flotante persistente. | Mobile convertido a timeline con hora izquierda, chips, resumen y CTA fijo. |
| Crear turno | Formulario administrativo largo, lejos de cards selectivas Stitch. | Drawer/pantalla mobile convertidos a seleccion visual de cliente, servicio, profesional y horario. |

## Drift P1 reducido

| Area | Ajuste |
| --- | --- |
| Marca | `BrandMark` ajustado a logo azul `BS` y jerarquia responsive. |
| Estados | Confirmado usa verde suave; pendiente usa acento primario suave. |
| Acciones | Botones principales vuelven a azul primario y acciones secundarias a superficies azules claras. |
| Mobile por profesional | Se agrega card resumen cuando se filtra por profesional. |

## Pendiente aceptado para FE 7+

- Imagen/avatar realista en perfil admin; hoy se conserva avatar por iniciales.
- Posicionamiento exacto de turnos por duracion dentro de la grilla; hoy se agrupan por hora de inicio.
- Filtros desktop funcionales de profesional/servicio/estado; hoy son visuales.
- Drawer desktop con scroll y footer mas refinado para pantallas bajas.
- Capturas de regresion visual persistidas como artefactos de Playwright.
- Comparacion automatica pixel/screenshot contra referencias de Stitch.

## Criterio aplicado

- No se integro backend.
- No se crearon rutas nuevas.
- No se implemento booking cliente.
- Se priorizo corregir estructura, paleta, jerarquia y patrones de interaccion antes de avanzar a FE 7.
