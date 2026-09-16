# Pruebas locales con Google Auth

Esta guía permite a cada desarrollador probar el acceso administrativo real en su propia máquina. No hace falta crear tokens de Google manualmente: el navegador los obtiene durante el inicio de sesión.

## Antes de empezar

Se necesitan ambos repositorios junto con sus servicios locales:

- `turnero-frontend` en `http://localhost:3000`.
- `Turnero-api` y su base de datos local en `http://localhost:8080`.
- Un cliente OAuth de tipo **Aplicación web** en Google Cloud compartido por frontend y backend.

En la configuración del cliente OAuth, agregar `http://localhost:3000` en **Orígenes de JavaScript autorizados**. No se requiere un client secret para este flujo.

## Configuración local

Usar el mismo Client ID web en los dos repositorios. Nunca versionar los archivos de entorno ni publicar el valor de un ID token.

En `turnero-frontend/.env.local`:

```dotenv
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<client-id-web>
TURNERO_API_BASE_URL=http://localhost:8080
```

En `Turnero-api/.env`:

```dotenv
GOOGLE_CLIENT_ID=<mismo-client-id-web>
```

Reiniciar frontend y backend después de cambiar variables de entorno.

## Aprovisionar una cuenta local como OWNER

Cada desarrollador tiene su propia base de datos local. Por eso, aunque una persona ya pueda ingresar, las demás deben aprovisionar su propia cuenta de Google como `OWNER` en su propia base.

1. Intentar iniciar sesión una vez desde `http://localhost:3000/login` con la cuenta Google que se va a usar. Es normal que todavía se rechace el acceso.
2. Obtener de forma temporal el `sub` y el email verificado de esa identidad. Para hacerlo, en las herramientas de desarrollo del navegador buscar la request `POST /api/backend/api/v1/auth/google`, copiar el `id_token` sólo localmente y decodificar su payload; los campos requeridos son `sub` y `email`.
3. Desde el repositorio `Turnero-api`, con la base local levantada, ejecutar:

```bash
GOOGLE_OWNER_SUB='<sub>' GOOGLE_OWNER_EMAIL='<email>' make provision-local-owner
```

El comando se niega a ejecutarse fuera del perfil `dev` o contra una base no local, y sólo actualiza el OWNER demo local. Si falta `psql`, instalar el cliente PostgreSQL antes de repetirlo.

No pegar el `id_token`, el `sub` ni el email de otra persona en commits, tickets, chats, logs o archivos versionados.

## Recorrido de validación

Con ambos servidores levantados:

1. Abrir `http://localhost:3000/login` e ingresar con Google.
2. Confirmar que se llega a la agenda administrativa.
3. Recargar la página: la sesión debe restaurarse sin volver a iniciar sesión.
4. Abrir el avatar: deben aparecer los datos de la cuenta y la acción **Cerrar sesión**.
5. Cerrar sesión: debe volver a `/login`.
6. Recargar `/login`: el panel no debe volver a abrirse automáticamente.

La sesión es una cookie HTTP-only emitida por el backend y reenviada por el BFF de Next.js. No se guarda ni se lee ningún token en JavaScript, `localStorage` o `sessionStorage`.

## Diagnóstico rápido

| Síntoma | Qué revisar |
| --- | --- |
| “Falta configurar el Client ID de Google” | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` en `.env.local` y reiniciar Next.js. |
| Google muestra error de origen | Que `http://localhost:3000` esté autorizado en el cliente OAuth usado. |
| Login correcto en Google, pero acceso denegado | Repetir el aprovisionamiento local con el `sub` de esa misma cuenta. |
| Error de conexión o 502/504 | Backend activo en el puerto 8080 y `TURNERO_API_BASE_URL=http://localhost:8080`. |
| `psql: command not found` | Instalar el cliente PostgreSQL y verificar `psql --version`. |

## Referencias

- [Arquitectura de integración API](integracion-api-mvp.md)
- [Contrato de auth del backend](../../Turnero-api/docs/mvp/api-contracts-mvp.md)
