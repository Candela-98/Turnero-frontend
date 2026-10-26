# TURN-70 — Agenda real

Rama `feature/TURN-70-real-agenda`, base `dev`. Requiere TURN-90 del backend; detalle visual de un turno sigue en TURN-73. El PR #85 no forma parte de esta entrega.

## Estado actual de los datos locales

Los 106 fixtures del negocio local 1 (Barber Studio San Miguel) ya usan clientes, profesionales y servicios existentes. A pedido del usuario se reprogramaron respetando horarios de negocio/profesional y asociaciones, sin solapamientos por profesional ni cliente, de ningún estado. Pendientes/confirmados tienen inicio futuro y profesional activo; cancelados/completados/ausentes están en pasado. Los registros pasados forman parte del historial: no deben desaparecer de la agenda.

Distribución verificada el 20/10/2026: 4 turnos el 13/10, 13 el 17/10, 53 el 20/10 (los cinco estados), 32 el 21/10 y 4 el 22/10. Abrir `/agenda?date=2026-10-20` y navegar entre días. No ejecutar el seed otra vez. Ya no se esperan 106 turnos en un único día ni un cruce de medianoche en esta muestra; esos casos siguen cubiertos por los tests automatizados de lectura.

Scripts backend locales:

- `scripts/seed-local-agenda.sql`: crea el conjunto artificial de estrés de lectura (incluye cruces intencionales).
- `scripts/reuse-local-agenda-catalog.sql`: reasigna los fixtures al catálogo existente del negocio.
- `scripts/schedule-local-agenda.sql`: reprograma todos los fixtures marcados `Fixture local TURN-90/70`, alrededor de la fecha/hora actual del negocio. Respeta los horarios y excepciones, evita cruces incluso con turnos ajenos al fixture, usa profesionales activos para reservas futuras y conserva referencias históricas en turnos pasados. Ejecutar con `psql "$DATABASE_URL" -v business_id=1 -f scripts/schedule-local-agenda.sql` solo en DB local. Cambiar el reloj o ejecutar otro día cambia la distribución.

La prohibición de fecha pasada aplica a crear un turno o enviar una nueva fecha en una edición; no a consultar historial. La validación administrativa actual comprueba solapamientos contra todos los estados, mientras disponibilidad/reserva pública solo bloquea PENDING/CONFIRMED. Esta diferencia se observó al preparar datos; no se modificaron escrituras en TURN-90/70.

## Ejecutar

Usar Java 21/Docker y `make run` en `Turnero-api`; frontend con `TURNERO_API_BASE_URL=http://localhost:8080`, Google configurado y `npm run dev`. Iniciar sesión como OWNER. La carga completa usa la zona de `GET /business`, no la del navegador.

El backend incluye `scripts/seed-local-agenda.sql`: ejecutar solo en la DB local con `psql "$DATABASE_URL" -v business_id=ID_DEL_NEGOCIO -v agenda_date=2026-10-20 -f scripts/seed-local-agenda.sql`. Crea 106 turnos ficticios del día, cinco estados, cliente archivado y profesional/servicio histórico; no usa el volumen del benchmark. Ejecutarlo una vez: una segunda ejecución agrega datos adicionales. Ver guía `Turnero-api/docs/referencias/agenda-lectura.md`.

Abrir `/agenda?date=2026-10-20`. Con la muestra local ya normalizada, comprobar los turnos repartidos dentro de los horarios laborales, búsqueda de profesional histórico, todos los estados por defecto, filtros directos desktop, estado provisional mobile, pills/Limpiar, selector de fecha, anterior/siguiente/Hoy. Navegar a otra sección y comprobar que sus filtros no se mezclan; recargar la URL conserva los de agenda.

Revisar 1440×900, 390×844 y 412×915; teclado/foco, nombres largos, scroll horizontal interno de columnas y último elemento sobre la navegación mobile. No hay acciones demo ni disponibilidad. La referencia Stitch conserva colores, shell, cards y badges; los controles usan los patrones compartidos vigentes. Paneles laterales, Semana y CTA de escritura se retiran por alcance.

## Verificación automática

`npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run test:e2e`. Solo agenda: `npm run test:e2e -- tests/e2e/agenda.spec.ts`. El handler real BFF tiene pruebas de parámetros, cookie, cancelación y errores. Los E2E simulan API; backend comprueba contrato y DB con PostgreSQL descartable.

Cobertura de agenda: páginas múltiples y fallos intermedios, estados, referencias históricas, selección provisional, catálogo con más de 100 profesionales, fecha/Hoy, cambio de año, loading, vacío/no coincidencias, 401/403, reintento, selector fallido y respuestas tardías. También texto largo, scroll, navegación mobile y axe con contraste habilitado.

Capturas revisadas por el agente: [desktop](qa/turn-70/desktop.png), [390×844](qa/turn-70/mobile.png), [412×915](qa/turn-70/mobile-large.png). Se regeneran con E2E en `test-results`. Browser no encontró navegadores conectados para revisión interactiva de la sesión del usuario; esta revisión sigue pendiente.

## Aprobación e integración

La QA automática no constituye aprobación manual. Revisar ambos procesos autenticados antes de crear dos PRs: TURN-90 contra `develop` y TURN-70 contra `dev`. Integrar backend primero. No consultar CI ni mergear automáticamente.

Resultado 2026-10-20: lint, TypeScript, 236 unitarios y build aprobados; suite completa E2E 506 aprobados / 7 omitidos preexistentes; agenda final 30/30. Backend: suite completa 630 aprobados más cobertura focalizada final; benchmark y fixture local verificados en PostgreSQL descartable. Aprobación manual pendiente.

## Mejoras de lectura aprobadas durante QA

- Desktop usa una escala continua con divisiones según el intervalo configurado por el admin; un turno de 60 minutos ocupa el doble de altura que uno de 30. Inicio y final se alinean entre profesionales. La duración visual sigue tiempo transcurrido real; los cambios estacionales saltan o repiten etiquetas con offset para distinguir horas ambiguas.
- Encabezados de profesionales fijos al bajar dentro de la grilla y columna de horas fija al desplazarse horizontalmente. El scroll de ambos ejes queda dentro de la grilla; foco y teclado permiten recorrerla.
- Columnas en orden alfabético español, con ID como desempate. «Inactivo», «Eliminado» o «No disponible» se presentan solo cuando corresponde. El backend entrega deleted_at para distinguir eliminados de inactivos sin depender del catálogo.
- Fecha legible con día de semana, mes y año, e indicador Hoy. La línea de hora actual aparece solo para el día actual del negocio y se actualiza por minuto. El eje incluye esa hora aunque quede fuera de los turnos cargados. Mobile presenta un separador «Ahora» en la lista.
- Las tarjetas desktop omiten el profesional repetido; mobile lo mantiene junto a su condición. Turnos cortos/textos extensos permiten scroll interior y tienen foco y nombre accesible completo. Los solapamientos reales o artificiales se muestran en carriles laterales, sin perder turnos ni modificar datos.

Para revisar: usar el 20/10 y el 21/10, comparar tarjetas de 30/60 minutos, desplazar la grilla en ambos ejes, comprobar las etiquetas de profesionales históricos y verificar que «Ahora» desaparezca al consultar otro día. No se habilitaron acciones de escritura.

Verificación del refinamiento: backend 638/638; frontend lint, TypeScript, 241 unitarios y build; agenda E2E 33/33 en los tres tamaños, más 6 verificaciones finales de geometría y scroll. Capturas enlazadas actualizadas a la grilla temporal. Backend local reiniciado; recargar la agenda para revisar.

## Intervalo configurado por el admin

La agenda lee `slot_interval_minutes` desde `GET /booking-settings` vía BFF. Usa los valores de 15, 30, 45 y 60 minutos compartidos con el formulario de Reglas de reserva. No existe un fallback silencioso a 30: durante carga se muestra el estado de carga y ante error/valor inválido, reintento. 401 recupera sesión; 403 conserva la sesión válida y muestra acceso denegado.

Para probar sin cambiar datos de turnos:

1. Ir a Configuración → Configurar reglas de reserva y guardar 15 minutos.
2. Volver a Agenda mediante la navegación: las marcas avanzan cada 15 minutos. No hace falta recargar toda la aplicación.
3. Repetir con 45 y 60; comprobar que los turnos siguen en sus inicios exactos y mantienen alturas proporcionales a su duración real. Un turno a las 09:10 sigue a las 09:10 aunque no coincida con una marca.
4. Restaurar el intervalo que use el negocio (30 minutos si corresponde).

La configuración se consulta de nuevo al entrar o volver a enfocar la pestaña; guardar desde Configuración actualiza también la caché del mismo negocio y cancela lecturas anteriores. La lista mobile conserva su orden y horarios: la preferencia cambia las divisiones de la grilla desktop, no la duración ni disponibilidad de los turnos. Los E2E cubren carga, error/reintento, valor inválido, permisos, los cuatro intervalos y navegación Configuración → Agenda sin recarga.

Verificación del intervalo (2026-10-22): lint, TypeScript, 260 unitarios y build aprobados; 86 E2E de agenda/reglas aprobados y 1 omisión preexistente en los tres tamaños. Capturas: [15 minutos desktop](qa/turn-70/slot-15-desktop.png), [45 minutos desktop](qa/turn-70/slot-45-desktop.png), [390×844](qa/turn-70/slot-45-mobile.png), [412×915](qa/turn-70/slot-45-mobile-large.png).

## Contexto del horario de atención

La agenda usa los horarios semanales actuales de Configuración → Horarios de atención (`GET /business-hours`), correspondientes al día seleccionado, además del intervalo de Reglas de reserva. No reconstruye horarios históricos ni aplica excepciones individuales de profesionales.

1. Con apertura 09:00 y cierre 18:00, con intervalo de 30 minutos comprobar en desktop las marcas 08:30–18:30 y los márgenes grisados 08:30–09:00 / 18:00–18:30, incluida la última etiqueta y el borde inferior. Bajar al final: el encabezado permanece fijo y queda espacio después del último turno. Los márgenes usan un solo intervalo elegido: 15 → 08:45–18:15, 45 → 08:15–18:45 y 60 → 08:00–19:00; límites alineados hacia afuera cuando apertura/cierre no coinciden con las marcas.
2. Cambiar a una fecha con otro horario semanal: debe usar ese día, no el día actual. Si está cerrado y tiene historial, los turnos siguen visibles sobre fondo gris; si no tiene turnos, el vacío explica que está cerrado.
3. Guardar otro horario de apertura/cierre en Configuración y regresar por navegación a Agenda: el resumen y los márgenes se actualizan sin recarga completa.
4. Los turnos anteriores a la apertura, posteriores al cierre o que terminan al día siguiente siguen visibles. Las marcas que cruzan medianoche indican −1/+1 día. El gris expresa horario del negocio, no disponibilidad de un profesional.
5. Mobile conserva la lista cronológica y presenta el horario/cierre sobre ella; no agrega espacios vacíos. Si falla la lectura de horarios aparece «Reintentar horarios», sin una ventana provisional inventada.

Verificación del contexto horario (2026-10-22): lint, TypeScript, 268 unitarios y build aprobados; E2E de Agenda y Horarios: 97 aprobados / 5 omisiones preexistentes. Seis recorridos finales de geometría, accesibilidad y capturas también aprobados tras ajustar la posición del texto grisado. Capturas revisadas en [1440×900](qa/turn-70/hours-context-desktop.png), [final de la grilla](qa/turn-70/hours-bottom-desktop.png), [390×844](qa/turn-70/hours-context-mobile.png) y [412×915](qa/turn-70/hours-context-mobile-large.png). Revisión manual del usuario y PRs pendientes.

Corrección final del margen (2026-10-22): un intervalo por extremo y gris hasta el borde de la última etiqueta. Lint, TypeScript, 271 unitarios, build y los 72 E2E de agenda aprobados en 1440×900, 390×844 y 412×915. Capturas hours-*.png y slot-*.png actualizadas. Aprobación manual final y PRs pendientes.

## Posición inicial en la apertura

Con apertura 09:00 e intervalo 30, al entrar a una fecha con turnos la grilla desktop muestra primero 09:00 debajo de los encabezados. Desplazarse hacia arriba revela el margen gris 08:30–09:00; bajar conserva el margen de cierre. Comprobar que el reloj no cambia la posición elegida por el usuario, que otra fecha toma su propia apertura y que los días cerrados con historial empiezan en el primer horario del rango. Mobile conserva la lista cronológica.

Verificación de posición inicial (2026-10-23): lint, TypeScript, 271 unitarios, build y 72 E2E de agenda aprobados en los tres tamaños. Captura: [inicio en apertura](qa/turn-70/opening-desktop.png).

## Botón Hoy seleccionado

Al consultar hoy, el botón «Hoy» tiene fondo azul suave y texto azul y permanece habilitado; lectores de pantalla lo identifican como fecha actual. El badge junto a la fecha permanece. Al avanzar o retroceder a otra fecha vuelve a neutro; al volver mediante el botón o el selector recupera el resaltado. Se calcula con la fecha del negocio, incluso si el navegador ya está en otro día.

Verificación (2026-10-23): lint, TypeScript, 271 unitarios, build y 9 E2E de navegación/filtros/accesibilidad aprobados en los tres tamaños. Capturas today-selected-*.png conservadas en docs/qa/turn-70.

## Nueva carga reutilizable desde hoy

Usar `Turnero-api/scripts/seed-local-appointments.py` mediante `make seed-local-appointments BUSINESS_ID=1` en el backend. Simula por defecto 106 turnos totales entre hoy y los dos días siguientes; `AGENDA_APPLY=1` crea si hay capacidad. Reutiliza catálogo, disponibilidad y POST reales; no reprograma el historial. Guía completa: `Turnero-api/docs/referencias/seed-agenda-local.md`. Si no alcanza la capacidad en esos tres días, reducir el objetivo explícitamente; no se fuerza la DB.

Entrega autorizada el 2026-10-23: el usuario aprobó la agenda y solicitó los PRs backend/frontend. La carga autenticada del nuevo script local sigue pendiente; su cobertura automática usa una API simulada. Integración manual, backend primero.

## Lectura mobile compacta

En 390×844 y 412×915 abrir /agenda?date=2026-10-27: el primer turno debe aparecer antes y los inicios simultáneos comparten un encabezado horario. Las tarjetas conservan nombres completos y muestran el profesional junto a un icono. Al bajar, fecha/Hoy/Filtros y horario siguen accesibles debajo del header; aplicar/quitar filtros conserva su contador y pills visibles. El header debe decir «Agenda del negocio» incluso cuando se consulta otra fecha. Probar navegación, vacío, error/reintento, teclado y último turno por encima del menú inferior. Desktop conserva su grilla y fecha completa.

Verificación mobile (2026-10-24): lint, TypeScript, 272 unitarios y build aprobados; 75 recorridos de agenda y 27 de autenticación aprobados. Capturas: [390×844](qa/turn-70/compact-mobile.png), [412×915](qa/turn-70/compact-mobile-large.png), [barra al bajar](qa/turn-70/sticky-mobile-large.png), [desktop](qa/turn-70/mobile-refinement-desktop.png). Comprobar también el menú de cuenta mientras la barra está fija. QA manual del usuario y publicación pendientes.

## Acceso directo a profesionales en mobile

1. Abrir /agenda?date=2026-10-27 en 390×844 y 412×915. No hay título visible extra; la fila de fecha abre el selector nativo y muestra Ir a hoy cuando corresponde. Fecha completa accesible y año disponible en el selector.
2. Elegir Xavi en la fila: una sola selección aplica sin diálogo ni pill adicional. Las tarjetas dejan de repetir Xavi. Elegir Todos conserva fecha/estado y vuelve a mostrar el profesional en las tarjetas. Catálogos grandes tienen búsqueda; inactivos/históricos se identifican y seleccionar uno sin resultados muestra el vacío conservando selección.
3. Abrir Estado: solo aparece ese filtro. Aplicar mantiene profesional; Limpiar dentro del diálogo restablece solo estado. El botón refleja el estado aplicado y contador. No hay Limpiar filtros global redundante en mobile.
4. Cambiar fecha conserva ambos filtros. Horario del negocio se desplaza con el contenido; fecha/profesionales/estado permanecen accesibles. El menú de cuenta sigue por encima de la barra.
5. En Hoy con turnos, bajar por la lista y tocar Ahora: el marcador queda visible debajo de la barra y recibe foco, sin perder filtros. Con movimiento reducido no anima. En otra fecha no aparece Ahora.
6. Desktop conserva grilla y ofrece profesional/estado directos; revisar también Ir a hoy/Hoy. No se modificaron datos del negocio.

Verificación final del acceso directo: lint, TypeScript, 272 unitarios, build y 108 E2E aprobados (Agenda/Auth en los tres tamaños). Capturas: [mobile](qa/turn-70/direct-mobile.png), [412×915](qa/turn-70/direct-mobile-large.png), [selección sin resultados](qa/turn-70/direct-empty-mobile-large.png), [Ahora](qa/turn-70/now-mobile-large.png), [desktop](qa/turn-70/direct-desktop.png). Revisión manual y publicación pendientes.

## Degradados y selección visible

En mobile, recorrer la fila profesional: inicio solo degradado derecho, medio ambos, final solo izquierdo. Con pocos profesionales y todo visible no debe haber degradados; redimensionar recalcula el estado. Elegir uno desde la búsqueda, recargar una URL con staff=ID o navegar con flechas del teclado: el elegido queda resaltado y visible fuera del degradado, sin mover la página. Desplazar la fila manualmente y dejar avanzar el reloj: no debe regresar automáticamente a la selección. La búsqueda conserva nombres completos; el scrollbar nativo mantiene su comportamiento. Verificar también que tocar opciones en los extremos sigue funcionando.

Verificación del 2026-10-25: lint, TypeScript, 272 unitarios, build y 114 E2E aprobados. Capturas: [inicio](qa/turn-70/fades-start-mobile.png), [ambos extremos](qa/turn-70/fades-middle-mobile.png), [final](qa/turn-70/fades-end-mobile.png), [todo visible](qa/turn-70/fades-fit-mobile-large.png), [selección revelada](qa/turn-70/selection-revealed-mobile-large.png). Revisión manual/publicación pendientes.

### Profesional y servicio en una fila mobile

En Todos, comprobar que cada tarjeta muestra horario/estado y cliente destacado, seguido de icono + profesional + separador + servicio. Con nombres cortos, profesional y servicio comparten línea; los nombres largos pueden ocupar varias líneas sin cortarse. Filtrar por un profesional: la fila sigue presente y no aparece «Turnos de {nombre}» sobre los resultados. Mover manualmente el selector hasta ocultar la selección: no debe regresar solo; el nombre sigue en las tarjetas. Comprobar inactivos y eliminados, teclado, ausencia de scroll horizontal de página y último turno visible sobre la navegación. Desktop conserva la grilla y sus tarjetas.

### Orden del selector de profesionales

Comprobar que Todos aparece primero y después los profesionales activos en orden alfabético, seguidos de inactivos, eliminados y no disponibles (cada grupo alfabético). Un inactivo cuyo nombre empiece antes que los activos debe permanecer al final del grupo activo. Su opción y sus turnos históricos siguen disponibles. Verificar también búsqueda, filtro seleccionado y el selector desktop.

### Agenda desktop compacta

En 1440×900, comprobar que Agenda no muestra eyebrow/introducción visual y que fecha/navegación comparten fila. Profesional abre directamente un selector con búsqueda de todo el catálogo; elegir aplica y cierra. Escape cierra sin cambios. Estado aplica inmediatamente. Cambiar fecha conserva ambos; pills y Limpiar permiten restablecer. Horario y leyenda gris son compactos; la grilla debe comenzar antes de los 420 px en este viewport. Verificar errores y reintento de catálogo.

En un turno corto con cliente/servicio largos, enfocar la tarjeta y usar flechas/Inicio/Fin para leer el contenido, o desplazar dentro con mouse; horario y estado permanecen visibles. Hover ofrece texto completo mediante título nativo. No repetir profesional dentro de la tarjeta desktop. Verificar cabeceras/eje sticky, columnas históricas, menú profesional con teclado/axe y que mobile mantenga su presentación.

Con un nombre de cliente largo en desktop, comprobar una sola línea con puntos suspensivos y el servicio debajo. Hover y descripción accesible mantienen el nombre completo; en mobile el nombre continúa completo con salto de línea.
