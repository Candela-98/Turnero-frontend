# TURN-123: sesión desde la vista cliente

## Base y dependencia temporal

Rama `feat/customer-auth`, creada en la carpeta habitual del frontend desde
`feat/turn-119-public-booking`, commit `4b2f2aeeed47a662fa5943a543b07d7c41f6d202`.
`dev` sigue en `41c8f84443c9b8871dd2ca240a0f1e20b19cbaa2`.
Los PR #22 (TURN-118) y #23 (TURN-119) están abiertos y ninguno contiene al otro.
No se hicieron merges ni commits para armar esta base de trabajo.

Se aplicó temporalmente el diff de TURN-118 (`6ad40dd49891bf67a66ca11a38d17528e9b15339`)
respecto de su base común con dev, `41c8f84443c9b8871dd2ca240a0f1e20b19cbaa2`.
Se verificó que ese rango contiene exclusivamente el commit de TURN-118.
El parche original queda separado en `turn-123-dependency-turn-118.patch`, SHA-256:
`9f1a6364ade7e34bed6cc4a217a815edef5e390a12fa3deccff89361a564b7ae`.

Los cinco archivos de esa dependencia son `.env.example`, `docs/integracion-api-mvp.md`,
`docs/pruebas-locales-google-auth.md`, `lib/api/bff.test.ts` y `lib/api/bff.ts`.
Los primeros cuatro conservan exactamente la versión de TURN-118. En `bff.ts`, TURN-123 agrega
únicamente las rutas de auth cliente y no-store para sus respuestas; se puede aislar esa parte
con `git diff 6ad40dd -- lib/api/bff.ts` porque TURN-119 no modificó ese archivo.
El parche es evidencia de preparación local, no un segundo desarrollo de TURN-118.

Antes del commit debe resolverse la base para no volver a incluir TURN-118 en el PR final.
El destino final es `dev`; mientras las dependencias no estén integradas, la referencia temporal
es TURN-119 más el parche documentado de TURN-118. No presentar el diff actual contra dev
como si contuviera exclusivamente TURN-123. No eliminar ni modificar las ramas anteriores.

## Contrato y comportamiento

Se comprobó el PR backend #92, rama `feature/customer-google-session-v1`, commit `7c75d9a`:
`CustomerAuthController`, `CustomerAuthResponseDto` y `customer-google-session.md`.
El cliente usa `/api/v1/customer/businesses/{slug}/auth/google` (POST con `id_token`),
`auth/me` (GET) y `auth/logout` (POST). No usa la sesión administrativa ni espera el DTO admin.
La respuesta cliente contiene `customer` y `business`; no expone `user_id`.

La cuenta aparece dentro de `/reservar/{slug}` usando BookingPublicShell, InlineAlert y el botón
real GoogleLoginButton. Los estados son comprobación inicial, ingreso pendiente, cuenta válida,
ausencia de sesión, cierre pendiente y error recuperable. El negocio permanece en la URL.
La reserva existente sigue siendo invitada incluso con cuenta iniciada; no se agregaron listado
de turnos ni creación autenticada. TURN-124 y TURN-125 continúan fuera de alcance.

CustomerSessionStore tiene su propio QueryClient en memoria, separado del público y del admin.
Las keys privadas incluyen negocio y customer.id: esa ficha identifica la identidad vinculada
dentro del negocio según TURN-120. El adapter de lib/auth mantiene snake_case fuera de la UI.
No se guardan tokens ni credenciales en localStorage, sessionStorage ni la caché de queries.
Las cookies HttpOnly se propagan por el BFF, incluidos todos los Set-Cookie.

Una operación privada que responde 401 invalida la generación, aborta requests/queries pendientes,
retira su caché y elimina los datos privados, conservando slug. Las respuestas de una generación
previa no pueden aplicar estado ni repoblar la caché tras logout, expiración, cambio de cuenta
o desmontaje por cambio de negocio. 403 y 5xx son errores recuperables, no expiración.
Al recuperar foco o visibilidad se revalida la cuenta. La UI permite también una lectura manual.

Logout limpia primero el estado local y luego solicita la revocación. No muestra éxito si falla:
ofrece reintentar el cierre e impide un nuevo login en esa instancia hasta resolverlo.
Si se recarga tras un logout fallido, el servidor puede seguir teniendo una sesión válida;
no se afirma lo contrario. El logout no se aborta al desmontar la vista, para permitir completar
la revocación y la expiración de cookie. Las mutaciones Google/logout cliente se serializan
entre las vistas de un mismo documento: una vista nueva espera sus Set-Cookie antes de restaurar
la sesión o iniciar otro ingreso. Las escrituras iniciadas terminan aunque se desmonte la vista;
las generaciones siguen impidiendo que apliquen estado tardío. Esto evita que un logout anterior
borre con su cookie expirada un ingreso posterior. No afecta a auth admin. Entre pestañas se
revalida al recuperar foco; no se implementa sincronización instantánea entre documentos.
La sesión y la caché admin no son invalidadas.

BFF reutiliza Origin de TURN-118. Auth cliente fuerza Cache-Control no-store también en errores
locales o del backend; fetch al backend y las llamadas cliente tampoco usan caché HTTP.
No se agregan logs de tokens, cookies, cuerpos ni datos personales.

## Smoke con Google real — verificación manual del operador

**Completado manualmente según lo informado por el operador el 26/11/2026.**
La evidencia es su confirmación en esta conversación, no observación independiente del navegador
por el asistente. Los tests con mocks permanecen separados de este resultado real.

| Comprobación manual | Resultado informado |
| --- | --- |
| Ingreso con Google real con una cuenta que también es OWNER | Correcto; cuenta visible en la vista cliente |
| F5 después del ingreso | Conserva sesión cliente y negocio |
| Logout y posterior F5 | Vuelve al ingreso, sin los datos de la cuenta y conservando barber-studio |
| Conservación de sesión admin | **NO VERIFICADA MANUALMENTE** |

No se informaron bloqueos durante este recorrido. Que la cuenta sea OWNER no demuestra la
conservación de una sesión ADMIN separada. No se registraron tokens, cookies ni datos de cuenta.
El registro estructurado local está en `C:\Turnero\TURN-123-smoke-2026-11-26.json`.

Procedimiento utilizado y comprobaciones adicionales disponibles:

1. Levantar PostgreSQL y backend que incluya TURN-120 (o TURN-122, que lo contiene), con un
   negocio ACTIVE conocido. Usar el procedimiento local backend existente y anotar puerto/slug.
   Configurar en `.env.local` el mismo NEXT_PUBLIC_GOOGLE_CLIENT_ID del backend,
   TURNERO_API_BASE_URL con su origen y TURNERO_FRONTEND_ORIGIN exactamente igual al origen
   público del frontend (por ejemplo http://localhost:3000). Reiniciar Next tras cambiar entorno.
   El origen debe estar autorizado en Google Cloud. No copiar credenciales a logs o capturas.
2. Ejecutar `npm run dev`; abrir `/reservar/<slug>` con el mismo host configurado. Comprobar
   que auth/me devuelve 401 sin sesión y que el catálogo invitado conserva su comportamiento.
   Pulsar Continuar con Google y completar manualmente el selector/consentimiento de Google.
3. Verificar en Network POST a la ruta CUSTOMER, campo canónico id_token (sin copiar su valor),
   Origin correcto y respuesta 200 con customer/business. En cookies verificar la cookie cliente
   HttpOnly, Path=/ y los flags de ambiente; su nombre debe diferir del de admin. Las respuestas
   deben indicar Cache-Control no-store. No inferir esto a partir del DTO admin.
4. Recargar: auth/me 200, mismo negocio y ficha. Conservar una sesión admin en el mismo host
   y confirmar que el login cliente no la reemplaza. Si se prueba otro negocio con la cookie
   actual, un 403 debe mostrarse como acceso no disponible, no como expiración.
5. Cerrar sesión en una segunda pestaña del mismo negocio y volver a la primera: al recuperar
   foco, auth/me debe devolver 401, retirar identidad y permitir ingreso en el mismo slug.
   Volver a ingresar; cerrar sesión desde la cuenta: POST logout 204, cookie cliente expirada,
   identidad retirada y admin aún utilizable. Recargar y confirmar auth/me 401.
6. Registrar fecha, ambiente, origen frontend/backend, slug, estados HTTP observados y resultado.
   Si Google no permite completar el consentimiento o no está configurado, dejar ese paso pendiente.
   Ningún resultado con mocks debe registrarse como smoke real aprobado.

## Verificación automatizada y revisión visual (26/11/2026)

- `npm run lint`: aprobado.
- `npm run typecheck`: aprobado.
- `npm run test`: 325 pruebas aprobadas en 31 archivos (suite completa de Vitest).
- `npm run test:e2e -- tests/e2e/customer-auth.spec.ts tests/e2e/public-booking.spec.ts tests/e2e/auth.spec.ts --workers=2`:
  84 aprobadas, sin omisiones, en desktop 1440×900 y mobile 390×844 / 412×915.
- Capturas de ingreso y sesión restaurada revisadas en los tres viewports.
- `git diff --check`: sin errores.

La primera corrida E2E tuvo dos timeouts de navegación admin y la repetición aislada uno.
La traza mostró una solicitud RSC a /servicios sin completar dentro de 5 segundos.
Al precalentar /servicios, Next registró 9,4 segundos de compilación inicial; se precalentaron
las rutas con GET locales y se repitió la selección completa sobre ese servidor dev.
La corrida final de 84 casos pasó sin cambios en las pantallas ni en los tests admin.
Los tests usan mocks de Google/backend. El smoke real fue confirmado posteriormente por el operador, según la sección correspondiente; no incluye verificación manual de conservación de sesión admin.

Vitest requirió permiso para crear procesos auxiliares en este entorno Windows. Los comandos
usan las dependencias ya instaladas; no se modificaron package.json ni package-lock.json.
Los reportes de Playwright y los logs locales quedan bajo las carpetas ignoradas habituales.

`npm run build` final aprobado (compilación, TypeScript y generación de rutas).
Una corrida intermedia de lint recorrió los JavaScript generados por el visor de trazas de
Playwright. El reporte de la corrida E2E final se regeneró sin esos assets y se repitió lint
sobre el árbol final; no se alteraron las reglas de ESLint ni los tests admin para ocultar errores.

## Revisión y propuesta de publicación (sin ejecutar cambios de base)

Referencias remotas verificadas durante la revisión: dev `41c8f84`, TURN-118 `6ad40dd`,
TURN-119 `4b2f2ae`. PR #22 y #23 continúan abiertos contra dev; ninguno incluye al otro.
El PR backend #92 de TURN-120 también sigue abierto, en `7c75d9a`.
HEAD de `feat/customer-auth` permanece en TURN-119; no hay commits propios ni cambios de historial.

Se corrigió una carrera de cookies entre vistas: invalidar las respuestas por generación no
impedía que un Set-Cookie de logout anterior llegara después de un nuevo login. Ahora las
mutaciones auth cliente terminan en orden y una restauración nueva espera ese orden. Los tests
cubren logout viejo pendiente seguido de restauración/login en otro negocio, y login pendiente
seguido de logout en una vista nueva. El resto de los controles de cookies/no-store, 401 frente
a 403/5xx, cachés independientes y reserva invitada permanecen sin cambios.

Estrategia recomendada para publicar contra dev:

1. Integrar por su proceso habitual los PR #22 y #23 en dev, sin modificar sus ramas desde esta
   tarea. La conservación de TURN-119 debe comprobarse por contenido además de por hash, porque
   las dependencias podrían integrarse con squash. Actualizar las referencias remotas después.
2. Guardar un stash identificado del árbol actual completo, incluidos sus archivos nuevos.
   Mantener fuera del checkout el parche propio y su manifiesto recuperable en `C:\Turnero`.
   El stash es respaldo adicional, no se debe aplicar completo sobre dev porque incluye TURN-118.
3. Con autorización posterior, reubicar `feat/customer-auth` (que todavía no tiene commits propios)
   sobre el dev actualizado que ya contenga ambas dependencias. No se realiza ese cambio ahora.
4. Aplicar únicamente `TURN-123-own.patch`, primero con `git apply --check`, y resolver cualquier
   conflicto contra las versiones integradas. No reaplicar el parche temporal de TURN-118 ni el
   stash completo. Si alguna dependencia cambió, adaptar los hunks propios antes de continuar.
5. Confirmar que el diff contra dev contiene exclusivamente TURN-123, repetir las verificaciones
   afectadas y recién entonces crear su commit y PR contra dev. Las ramas anteriores se conservan.
   Para probar o desplegar auth cliente, el backend debe incluir TURN-120.

Mientras ambas dependencias sigan pendientes, no hay una base remota existente que permita un
PR contra dev con sólo TURN-123 y que a la vez conserve TURN-119. La estrategia anterior evita
simular una separación mediante revertir funcionalidad o duplicar TURN-118 dentro del PR.
El smoke con Google real fue completado y confirmado posteriormente por el operador; la conservación de sesión admin no se verificó manualmente.

### Validación posterior a la revisión

- Lint, TypeScript y build: aprobados sobre el código revisado.
- Vitest completo: 327 pruebas aprobadas, incluidos dos casos nuevos del orden de las cookies.
- Playwright: 84 aprobadas, sin omisiones, para cliente, admin e invitado en los tres viewports.
- El fixture de restauración tardía espera ahora que la lectura esté efectivamente en vuelo antes
  de desmontar la vista; una restauración descartada antes de empezar ya no consume una respuesta.

## Parche propio recuperable

La copia local fuera del checkout se entrega en `C:\Turnero\TURN-123-own.patch`, con manifiesto
`C:\Turnero\TURN-123-own-patch.json` y copia separada de la dependencia en
`C:\Turnero\TURN-123-dependency-TURN-118.patch`. El manifiesto registra SHA-256, modos y blobs
Git de los 13 archivos propios (7 nuevos), además de los árboles de base y destino.
El parche propio no incluye los cuatro archivos exclusivos de TURN-118 ni el archivo que guarda
su parche; en bff.ts incluye solamente las diferencias propias sobre la versión de TURN-118.

La verificación utiliza índices Git alternativos: construye la base TURN-119 más TURN-118,
aplica el parche propio, compara el árbol recuperado con el esperado y revierte para comprobar
que vuelve exactamente a la base. También comprueba la aplicación inversa contra el árbol de
trabajo actual. El índice real, HEAD y las referencias de ramas se conservan.

Para recuperación en un checkout limpio de la base original, aplicar primero la dependencia
separada si todavía falta y luego el parche propio, siempre con `git apply --check` antes.
Sobre un dev futuro que ya incluya ambas dependencias, aplicar **sólo el parche propio** tras
comprobar sus contextos. Las instrucciones completas y hashes quedan en el manifiesto.
Estos pasos son de recuperación/publicación futura; no se cambia ahora la base ni el historial.
El smoke con Google real quedó confirmado manualmente por el operador. La conservación de sesión admin continúa sin verificación manual.
