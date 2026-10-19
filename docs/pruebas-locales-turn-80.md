# Pruebas locales — TURN-80

## Preparación

Usar `feature/TURN-80-customer-list` en ambos repos, basada en `develop` backend y `dev` frontend. Reiniciar la API para cargar el nuevo contrato; no requiere migraciones. Levantar frontend e ingresar con una cuenta OWNER del negocio. Se usan los clientes existentes: esta entrega no incorpora alta, edición ni detalle.

## 1. Listado y búsqueda

1. Abrir `/clientes`: encabezado compartido, total, iniciales, nombre, badge de estado y teléfono/email cuando existan. Las notas internas no aparecen. No hay botones de operaciones todavía pendientes.
2. Buscar una parte del nombre o email, alternando mayúsculas. Tras 300 ms deben llegar resultados del backend; no deben quedar visibles filas de la búsqueda anterior durante la espera.
3. Buscar un teléfono existente con y sin espacios, guiones o paréntesis. Por ejemplo, `55551234` y `5555-1234` deben encontrar el mismo número guardado como `+54 (11) 5555-1234`. El formato mostrado se conserva; no se agregan códigos de país automáticamente.
4. En Network verificar GET al BFF `/api/backend/api/v1/customers` con q/status/page/size/sort. La API responde `{ data, page }`, con resúmenes sin notas ni fechas.

## 2. Filtros y paginación

1. Abrir Filtros: modal desktop/panel inferior mobile compartido con los otros listados. Seleccionar Activos sin aplicar: no cambia la consulta. Cancelar con Escape o cerrar; al reabrir conserva el filtro aplicado anteriormente.
2. Aplicar Inactivos: se ven únicamente esos clientes y una pill removible. Quitar la pill vuelve a Todos.
3. Limpiar solo modifica la selección provisional; Aplicar confirma Todos. Verificar el foco al cerrar el panel.
4. Si hay más de 20 clientes, recorrer páginas y observar el total. Buscar o cambiar estado vuelve a página 0. Si hay menos, la paginación queda cubierta por los E2E.
5. Escribir una búsqueda y aplicar un estado antes del debounce: el texto escrito se conserva y el resultado combina ambos parámetros.

## 3. URL, estados y navegación

1. Copiar una URL filtrada, recargar y abrirla directamente: conserva búsqueda, estado y página. Atrás/adelante del navegador restaura el contexto de URLs previas.
2. Abrir `/clientes?page=999`: la pantalla corrige a una página válida. No debe mostrar fugazmente resultados anteriores como si pertenecieran a esa página.
3. En un negocio sin clientes: «Todavía no hay clientes». Con búsqueda o filtro sin coincidencias: «No encontramos clientes». Ambos muestran total cero.
4. Para comprobar error/reintento, bloquear solo la ruta GET de clientes en DevTools y recargar. Debe aparecer «No pudimos cargar los clientes»; desbloquear y pulsar Reintentar recupera el listado.
5. Los E2E cubren carga y respuestas tardías con fixtures de red aisladas; no modifican tu base. La consulta anterior no debe reemplazar una búsqueda nueva.

## 4. Responsive y accesibilidad

Revisar 1440×900, 390×844 y 412×915: sin scroll horizontal, contactos largos contenidos, teclado/foco visible y paginación alcanzable al final de la lista, por encima de la navegación mobile. Los campos de contacto ausentes no muestran placeholders ni líneas vacías.

## Automatización

Backend con Docker/Colima:

```sh
DOCKER_HOST=unix:///Users/xavimeen/.colima/default/docker.sock TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock ./gradlew test
```

Frontend:

```sh
NEXT_DIST_DIR=.next-e2e npm run check
# Solo Clientes:
npx playwright test tests/e2e/customers.spec.ts
```

Resultados: backend 548 aprobadas sin omisiones; frontend lint/TypeScript, 138 unitarios, build y 343 E2E aprobados con 14 omisiones preexistentes. Los 27 recorridos de Clientes pasan en los tres viewports; 3 casos de respuesta tardía reforzados y repetidos. QA manual pendiente; después de aprobarla, crear PRs separados contra `develop` y `dev`, integrar backend primero y mantener los PRs TURN-101 independientes. Sin consultar CI ni mergear automáticamente.
