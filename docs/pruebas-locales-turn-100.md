# Pruebas locales — TURN-100

## Preparación

Usar `feature/TURN-100-customer-form` en ambos repos. La rama incluye TURN-80, independientemente de que sus PRs sigan abiertos. Reiniciar el backend para cargar el nuevo contrato de alta; no requiere migraciones. Levantar el frontend e ingresar con una cuenta OWNER.

Los clientes ficticios cargados previamente en la DB local sirven para probar edición, incluidos registros sin teléfono e inactivos. Las pruebas automáticas usan fixtures y bases descartables; no modifican esa DB.

## 1. Alta y validación

1. Abrir `/clientes` y pulsar **Nuevo cliente**. Debe abrir el mismo modal desktop/panel inferior mobile que los otros formularios. El encabezado tiene descripción y el footer mantiene Cancelar/Crear cliente accesibles.
2. Enviar vacío: se muestran errores de nombre y teléfono, con foco en el primero. No se envía POST. Probar email inválido: error junto al campo.
3. Completar nombre y teléfono, dejar email vacío y agregar notas internas con varios renglones. Guardar: se cierra el formulario y aparece **Cliente creado** / **El cliente quedó registrado en tu negocio.**
4. Buscar el nombre creado si no aparece en la página o el filtro actual. Los filtros y la página no se reinician al guardar; un alta ACTIVE puede no aparecer dentro de Inactivos.
5. Reabrir Editar y verificar teléfono y notas guardadas. El listado no expone notas internas. El alta no crea una cuenta de usuario.

## 2. Edición y descarte

1. Pulsar Editar: primero carga el detalle real. Guardar cambios está deshabilitado sin cambios. Modificar un campo habilita el botón; revertirlo lo vuelve a deshabilitar.
2. Cambiar nombre, teléfono o notas y guardar. Debe aparecer **Cliente actualizado** / **Se guardaron los cambios en sus datos.** Reabrir: datos actualizados y Guardar deshabilitado.
3. Vaciar email y notas: guardar los elimina. No se permite quitar un teléfono existente. En registros antiguos que no tienen teléfono, se pueden editar otros datos sin completarlo; aparece una aclaración.
4. Editar un inactivo desde el filtro Inactivos: permanece inactivo. No hay control de estado en este formulario.
5. Con cambios pendientes, cerrar mediante Cancelar, ×, Escape o fondo: pide confirmación de descarte. Seguir editando conserva el borrador. Descartar cierra y devuelve foco al disparador; si la fila desapareció, al buscador. Sin cambios, cierra directamente.
6. En Network verificar POST/PATCH a través del BFF; usan phone_number e internal_notes y solo campos editables. PATCH incluye solo los que cambiaron. GET de detalle devuelve notas; GET listado no las devuelve.

## 3. Errores y responsive

1. Simular fallo de POST/PATCH en DevTools: el formulario conserva los valores, muestra título y descripción del error y permite reintentar. Mientras envía, bloquea doble submit y cierre.
2. Simular fallo del GET de detalle: error con reintento. Un 404 muestra **El cliente ya no está disponible**, sin formulario editable.
3. Los E2E cubren escritura exitosa con refresco fallido: muestra éxito y una advertencia aparte; **Reintentar actualización** repite solo GET, nunca POST/PATCH.
4. Revisar 1440×900, 390×844 y 412×915: teclado, foco visible, scroll de campos, textos largos y footer accesible, sin scroll horizontal. Las confirmaciones de éxito incluyen descripción, cierre manual y cierre automático a los 6 segundos.

## Automatización

Backend, con Colima local (adaptar socket si se usa otro entorno):

```sh
DOCKER_HOST=unix:///Users/xavimeen/.colima/default/docker.sock TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock ./gradlew test
```

Frontend completo:

```sh
NEXT_DIST_DIR=.next-e2e npm run check
```

Solo Clientes:

```sh
npm run test -- lib/customers lib/api/bff.test.ts
npx playwright test tests/e2e/customer-form.spec.ts tests/e2e/customers.spec.ts
```

QA manual aprobada por el usuario. TURN-80 y TURN-101 integrados: preparar PRs separados backend/frontend contra develop/dev. Integración de TURN-100 pendiente. Integrar backend primero. Sin consultar CI ni mergear automáticamente.

## Resultado automático

Backend: 572 pruebas aprobadas, sin fallos ni omisiones (24 nuevos casos PostgreSQL de escritura). Frontend: lint final sin advertencias, TypeScript, 156 unitarios y build aprobados. Suite E2E completa: 376 aprobados y 14 omisiones preexistentes; después de añadir dos casos y reforzar la espera de respuestas tardías, los 39 recorridos finales del formulario aprobaron en los tres viewports. Los 27 casos del listado también aprobaron en la suite completa. Capturas de alta, edición, éxito, error y textos largos revisadas en los tres tamaños.
