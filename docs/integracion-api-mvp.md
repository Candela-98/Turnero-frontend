# Integración API Frontend MVP

Actualizado: 2026-09-08

## Propósito

Este documento es la fuente técnica para conectar el frontend con Turnero API. Define transporte, BFF, sesión, errores y límites entre DTOs y modelos de UI.

No registra prioridades ni avance: eso vive en `tracking-implementacion-mvp.md`. Los payloads backend canónicos viven en `../../Turnero-api/docs/mvp/api-contracts-mvp.md`.

## Arquitectura decidida

```text
Browser -> /api/backend/* en Next.js -> /api/v1/* en Turnero API
```

El MVP usa un BFF/proxy same-origin de Next. La URL real del backend es server-only y nunca se expone como variable `NEXT_PUBLIC_*`.

```text
TURNERO_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<client-id-web-compartido-con-backend>
```

El proxy acepta únicamente rutas conocidas bajo `/api/v1`; no recibe hosts o URLs arbitrarias desde el cliente.

## Responsabilidades del BFF

- Mapear `/api/backend/*` a la ruta backend correspondiente.
- Reenviar método, query params, body, `Content-Type`, `Accept` y `Cookie`.
- Reenviar `Set-Cookie` desde login y logout hacia el navegador.
- Preservar status y body de errores.
- No cachear auth ni mutaciones.
- Aplicar timeouts y convertir fallos de red a un error frontend normalizado.
- No registrar cookies, ID tokens ni bodies sensibles.

Implementacion base de TURN-97:

- El BFF vive bajo `/api/backend/[...path]` y solo permite rutas y metodos registrados del contrato `/api/v1`; nunca acepta un host, URL o destino elegido por el navegador.
- Reenvia `Accept`, `Content-Type`, `Cookie` y `User-Agent`; conserva `Content-Type`, `Cache-Control`, `X-Request-Id` y cada `Set-Cookie` de la respuesta upstream.
- Toda request upstream usa `cache: "no-store"` y un timeout de 10 segundos.
- Si el upstream no esta configurado o no responde, el BFF devuelve errores JSON comunes `UPSTREAM_UNAVAILABLE` (`502`) o `UPSTREAM_TIMEOUT` (`504`) sin exponer configuracion interna.

## Cliente HTTP frontend

La UI consume un unico cliente tipado sobre `/api/backend`, no usa `fetch` directo en cada pantalla. El cliente solo acepta endpoints relativos bajo `/api/v1/`, por lo que no puede recibir una URL externa ni acceder al backend sin pasar por el BFF.

El cliente debe:

- parsear respuestas exitosas y vacías;
- mapear el formato común de error backend;
- diferenciar errores de validación, autorización, conflicto y red;
- usar adapters entre DTOs `snake_case` y modelos de UI;
- evitar replicar reglas de negocio que valida el backend.

## Auth y sesión

1. Google Identity Services entrega un ID token.
2. El frontend lo intercambia según el contrato canónico de auth.
3. El BFF reenvía `Set-Cookie`; JavaScript nunca lee la sesión.
4. Al iniciar o recargar la app, `/auth/me` hidrata usuario y business.
5. Las rutas admin esperan esa resolución antes de renderizar contenido protegido.
6. `401` limpia estado local y redirige a login.
7. `403` conserva la sesión y muestra acceso denegado.
8. Logout limpia el estado frontend incluso si la sesión backend ya no era válida.

Para el MVP, la superficie administrativa admite `OWNER`. No se guardan ID tokens ni tokens Turnero en `localStorage`, `sessionStorage` o cookies creadas desde JavaScript.

## Server state

- Centralizar keys por recurso y parámetros.
- Invalidar y refetchear después de mutaciones; evitar optimistic updates inicialmente.
- No reutilizar datos de un business después de cambiar o perder sesión.
- Tratar formularios locales por separado del server state.
- Evitar requests duplicadas durante hidratación y navegación.

La librería concreta puede incorporarse cuando empiece la primera integración real; la decisión de comportamiento anterior no depende de ella.

## Fechas, horarios y dinero

- La zona horaria del negocio es la fuente para agenda y fechas operativas; no asumir la zona del navegador.
- Mantener instantes ISO-8601 con offset en la frontera API.
- Mantener horas semanales como `HH:mm` y fechas de agenda como `YYYY-MM-DD`.
- Mantener precios como enteros en centavos; formatear moneda sólo para presentación.

## Validación y pruebas

- Unit tests para cliente, adapters y normalización de errores.
- Tests de Route Handlers para forwarding de cookies, status y bodies.
- Tests de UI con red mockeada para loading, empty, validación, `401`, `403`, `404` y `409`.
- E2E de login, restauración de sesión, ruta protegida y logout.
- Nunca usar credenciales o ID tokens reales en fixtures versionados.

## Definition of Ready para una integración

- Endpoint mergeado y protegido según corresponda.
- Wire contract confirmado contra `api-contracts-mvp.md` y código real.
- Dependencias backend vinculadas y resueltas o explícitamente simuladas.
- Estados loading, empty, error y éxito definidos.
- Estrategia de invalidación posterior a mutaciones definida.

Si contrato y código difieren, no se implementa un workaround silencioso: se registra la discrepancia y se resuelve en el repositorio propietario.
