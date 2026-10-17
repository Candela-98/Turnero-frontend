# Pruebas locales — TURN-79

## Preparación

Ambos repos deben estar en `feature/TURN-79-staff-hours`, basada en TURN-78. Reiniciar el backend y abrir `/profesionales` con sesión de administrador. No hay migraciones nuevas. Se puede usar un profesional activo o inactivo; anotar sus horarios iniciales para restaurarlos al terminar.

## 1. Abrir, editar y persistir

1. La fila conserva **Servicios (N)** / **Asignar servicios** y agrega **Más acciones** (…). El menú ofrece **Editar datos** y **Horarios**. Verificar que Editar datos mantiene su formulario habitual.
2. Abrir Horarios. Deben aparecer siete días de lunes a domingo, con disponibilidad e Inicio/Fin solo en días disponibles. Guardar comienza deshabilitado.
3. Cambiar el fin de un día, guardar y comprobar **Horarios actualizados**. Reabrir: se ve el horario guardado y Guardar vuelve a estar deshabilitado. Con búsqueda/filtro aplicado, ambos deben conservarse.
4. Desactivar un día y volver a activarlo antes de guardar: conserva las horas del borrador; si queda igual que al abrir, Guardar se deshabilita.
5. Activar un día que no tenía horas: exige inicio y fin. Probar campos vacíos, horas iguales y fin anterior al inicio; muestra errores junto al campo y enfoca el primero inválido.
6. Desactivar todos los días: aparece **No hay días disponibles**; se puede guardar y reabrir la semana completa sin disponibilidad. Restaurar los horarios de prueba al terminar.

### Avisos sobre horarios del negocio

- Si el martes el negocio cierra a las 18:00, poner Fin 19:00: aparece junto a Fin «El negocio cierra a las 18:00; solo se podrán reservar turnos hasta esa hora». Guardar sigue habilitado; reabrir conserva 19:00 y el aviso. Volver a 18:00 elimina el aviso.
- Un inicio anterior a la apertura avisa junto a Inicio. Un rango sin coincidencia con el negocio explica que no tendrá reservas; un día disponible con negocio cerrado también lo indica. Desactivar el día oculta esos avisos.
- Si falla la lectura de horarios del negocio, se puede seguir editando y guardar. Reintentar comparación carga los avisos sin perder el borrador.

## 2. Descarte, errores y teclado

1. Con cambios, probar Cancelar, × y Escape: elegir Seguir editando conserva el borrador; Descartar cierra sin escribir. Sin cambios, cierra directamente.
2. Abrir Más acciones con teclado, recorrer las opciones con flechas y Enter. Recorrer los campos con Tab y cambiar disponibilidad con Space. Al cerrar, vuelve el foco a la acción de la fila (o al buscador si desapareció).
3. En DevTools/Network, provocar error al GET de `staff-members/{id}/working-hours`: mostrar carga/error y Reintentar carga, sin habilitar una semana incompleta o vieja.
4. Provocar error al PUT: el borrador se conserva con reintento. Durante el envío, campos, cierre y Guardar se bloquean; doble clic no duplica el PUT.
5. Si el servidor confirma 200 pero la respuesta es inválida, indica que ya se guardó. Reintentar actualización hace solo GET; nunca vuelve a escribir automáticamente.
6. Cerrar y reabrir: espera una lectura fresca. Una respuesta tardía de una apertura anterior no debe pisar el borrador.

## 3. Responsive y alcance

- Desktop 1440×900: modal; mobile 390×844 y 412×915: panel inferior compartido. Sin scroll horizontal; contenido desplazable, encabezado y Cancelar/Guardar accesibles.
- La disponibilidad real del backend combina horarios del negocio y del profesional. Si el negocio abre 09:00–18:00 y el profesional 07:00–21:00, la ventana efectiva queda limitada a 09:00–18:00, además de las otras reglas de reserva.
- Los turnos futuros e históricos existentes no cambian. Agenda y formulario de turnos siguen usando demo; no sirven para verificar estos horarios reales. La intersección y conservación de turnos están cubiertas por pruebas PostgreSQL.
- Una semana heredada incompleta se muestra con los días faltantes no disponibles; GET no crea filas. El siguiente guardado persiste los siete días.

## Automatización

Backend, desde `Turnero-api` con Docker/Colima:

```sh
DOCKER_HOST=unix:///Users/xavimeen/.colima/default/docker.sock TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock ./gradlew test
```

Frontend, desde `turnero-frontend`:

```sh
NEXT_DIST_DIR=.next-e2e npm run check
# Solo el flujo nuevo:
npx playwright test tests/e2e/staff-hours.spec.ts
```

Los E2E usan fixtures aislados y servidor 3100; no modifican la DB local. Incluyen los tres viewports, axe y capturas. PostgreSQL cubre aislamiento, concurrencia, IDs estables, rollback, horarios parciales y turnos intactos.

## Resultados automatizados

Backend: 527 pruebas aprobadas, sin fallos ni omisiones, incluidas las de PostgreSQL.

Frontend: lint, TypeScript, 119 unitarios y build aprobados; suite completa con 307 E2E aprobados y 14 omisiones preexistentes, incluidos los 27 nuevos recorridos de horarios. Capturas revisadas en los tres viewports; axe básico sin violaciones en el editor probado.

La mejora posterior de avisos pasó lint, TypeScript, 122 unitarios y build; 61 E2E afectados aprobados con cinco omisiones preexistentes de Configuración. Capturas y axe de los avisos revisados en los tres tamaños.

## Entrega

Implementación local y QA automática registradas en `tracking-implementacion-mvp.md`. QA manual final aprobada por el usuario el 2026-10-17, incluidos los avisos sobre horarios del negocio. Creación de PRs separados autorizada; integrar backend primero y considerar TURN-78 backend #79 / frontend #14 como dependencias. Sin revisión de CI ni merge automático.
