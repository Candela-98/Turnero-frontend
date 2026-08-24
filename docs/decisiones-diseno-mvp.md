# Turnero Frontend - Decisiones de Diseño MVP

Fecha: 2026-04-27

## Propósito

Este documento registra decisiones de producto y diseño para guiar la futura implementación del frontend de Turnero.

La sesión actual se enfoca en decisiones visuales y de experiencia. La implementación tecnica queda para otra sesión.

## Sintesis ejecutiva del MVP

Turnero MVP se define como una experiencia SaaS premium y operativa para gestionar turnos y permitir reservas cliente sin fricción.

La dirección visual será Precision Concierge: clara, sobria, precisa y profesional. El producto debe sentirse más cercano a una agenda premium de servicio que a un CRUD administrativo.

### Experiencias incluidas en MVP

- Admin/negocio.
- Booking cliente sin login obligatorio.
- Login/acceso para usuarios internos.

### Experiencias post-MVP

- Portal cliente logueado.
- Agenda profesional dedicada.
- Mis turnos.
- Analytics avanzado.
- Editor avanzado de horarios.
- Multi-business / marketplace.

### Pantallas MVP

- Login.
- Dashboard admin.
- Agenda.
- Crear / editar turno.
- Clientes.
- Perfil de cliente.
- Servicios.
- Profesionales.
- Configuración del negocio.
- Unified Single-Page Booking Flow.

### Decisiones cerradas

1. Usar el proyecto actual de Stitch como fuente visual del MVP.
2. Mantener layouts separados para admin, login y booking.
3. Agenda como pantalla central del producto.
4. Crear/editar turno admin con drawer desktop y bottom sheet mobile.
5. Booking cliente como single-page mobile-first, separado del flujo admin.
6. Dashboard admin operativo, no analytics avanzado.
7. Clientes y perfil como experiencia de relación, no solo CRUD.
8. Servicios como configuración operativa de la oferta.
9. Profesionales como gestión operativa del equipo y disponibilidad.
10. Configuración modular para identidad, horarios básicos y reglas de reserva.
11. Sistema visual basado en tokens, superficies tonales y componentes reútilizables.
12. Login con Google/proveedor externo; no auth propia desde cero.
13. Booking cliente sin login obligatorio.
14. No crear detalle de notificación para MVP; las notificaciones deben llevar al contexto operativo correspondiente.

### Prioridad de diseño

Orden recomendado para bajar a pantallas finales:

1. Tokens y componentes globales.
2. Layout base.
3. Agenda desktop día.
4. Crear / editar turno.
5. Booking mobile.
6. Dashboard.
7. Clientes + perfil.
8. Servicios.
9. Profesionales.
10. Configuración.
11. Login.

### Principios que no se deben perder

- No convertir pantallas operativas en landing pages.
- No usar tablas densas como primera solucion visual.
- No replicar desktop completo en mobile.
- No mezclar booking cliente con formulario administrativo.
- No hacer autenticación propia desde cero.
- No usar bordes fuertes como principal separador visual.
- No obligar login al cliente para reservar en MVP.

## Cierre de alcance MVP visual

Estado:

El MVP visual principal queda cerrado a nivel de pantallas core.

Incluye:

- Admin/negocio con Login, Layout base, Dashboard, Agenda, Crear / editar turno, Clientes, Perfil de cliente, Servicios, Profesionales y Configuración del negocio.
- Booking cliente mobile-first sin login obligatorio.
- Sistema visual base: Precision Concierge, tokens, shell admin, header público de booking, badges/pills y CTAs principales.

No incluye en MVP:

- Vista dedicada de profesional.
- Login propio para profesionales.
- Portal cliente logueado o Mis turnos.
- Vista mes de agenda.
- Analytics avanzado.
- Multi-negocio, multi-sucursal o marketplace.
- Editor avanzado de disponibilidad por profesional.
- Registro público self-service.

Pendientes de diseño antes de implementar:

- QA final de tokens, shell, badges, botónes, navegación, responsive y densidad.
- Handoff de componentes y reglas visuales para implementación.

Regla:

No reabrir pantallas core salvo que haya una inconsistencia visual clara. Las próximas decisiones deben enfocarse en estados, responsive mínimo y preparacion para implementación.

## Guia breve para implementación visual futura

Usar como base:

- `stitch/progreso-stitch.md` como fuente de IDs finales.
- `decisiones-diseno-mvp.md` como fuente de reglas de producto y diseño.
- `stitch/workflow-drift-stitch.md` como checklist para verificar y corregir drift de Stitch antes de aprobar pantallas.
- `handoff-implementacion-mvp.md` como guia de componentes, orden de implementación y Definition of Done visual.

Reglas de implementación visual:

- Mantener el shell admin aprobado: sidebar `w-64`, marca `Barber Studio`, subtítulo `Agenda premium`, topbar con búsqueda global, notificaciones, ayuda y avatar.
- Mantener booking separado del admin: sin sidebar, sin topbar administrativa y sin login obligatorio.
- Usar tokens del sistema, no colores genéricos `slate`, `indigo`, `bg-white`, `text-white` ni clases `dark:` en pantallas MVP.
- Usar `text-primary` para la marca `Barber Studio` y gradiente `from-primary to-primary-container` para el logo `BS`.
- Mantener badges en sentence case, sin uppercase ni tracking forzado.
- Usar verde positivo para `Activo`, `Disponible`, `Confirmado`, `Abierto` y `Activado`.
- Usar primary suave para `Pendiente`.
- Usar neutro apagado para `Inactivo`, `Cerrado` u ocupado sin error.
- Reservar error/rojo para fallos reales, cancelaciones críticas o bloqueos semánticos.
- Mantener `Nuevo turno` como acción global persistente en sidebar por ahora.
- No mostrar `Logout` como item visible en la sidebar del MVP. La salida/cuenta debe resolverse desde perfil, menu de usuario o configuración.
- Evitar cards dentro de cards y evitar formularios densos cuando una composicion por secciones sea más clara.
- No crear una pantalla dedicada de detalle de notificación en MVP. Las acciones de notificaciones deben resolver o derivar al turno, cliente, agenda o configuración correspondiente.

## QA visual final

Estado:

QA de consistencia en curso con decisión de no reabrir pantallas core salvo inconsistencias visibles fuertes.

Decisión:

Las pantallas core aprobadas se mantienen como referencia visual vigente. Las diferencias menores detectadas en HTML, como micro-labels con `uppercase`, `tracking-wider` o `text-[10px]`, no obligan a regenerar pantallas si visualmente no molestán. Para implementación, deben resolverse como reglas de componentes, no como rediseños pantalla por pantalla.

### Reglas para implementar componentes

Filtros mobile:

- Usar Agenda mobile como referencia principal.
- Pills con `rounded-full`.
- Activo: `bg-primary-fixed text-on-primary-fixed`.
- Inactivo: `bg-surface-container-low text-on-surface-variant`.
- Tipografia: `font-label text-sm font-medium`.
- Agrupar por contexto cuando ayude: `Profesionales`, `Estados`, `Tipo`.

Bottom nav mobile:

- Items MVP: `Agenda`, `Clientes`, `Servicios`, `Más`.
- Iconos: `calendar_today`, `group`, `content_cut`, `more_horiz`.
- Activo: `bg-surface-container-low text-primary rounded-xl`.
- Labels en sentence case, sin uppercase ni tracking.

Labels secundarios:

- Preferir sentence case.
- Evitar `uppercase` y `tracking-wider` como default.
- Usar `text-xs` como mínimo habitual; reservar tamanos menores solo para metadatos no crítica y si no afecta legibilidad.

Badges:

- Mantener reglas de estado ya definidas: positivo en verde suave, pendiente en primary suave, inactivo/neutro sin rojo.
- No usar badges como decoración; deben comunicar estado o categoría útil.

Shell desktop:

- Layout Base sigue siendo la fuente de verdad.
- Si una pantalla aprobada conserva diferencias menores de shell, la implementación debe normalizar contra Layout Base y no copiar esas variaciones.

Notificaciones mobile:

- Usar la version con filtros alineados a Agenda mobile como referencia.
- No requiere pantalla dedicada de detalle para MVP; las acciones derivan al contexto operativo correspondiente.

## Estados vacíos MVP

Decisión:

Los empty states del MVP deben ser calmos, accionables y especificos del contexto. No deben parecer errores ni pantallas de marketing.

Reglas:

- Usar una sola acción principal.
- Agregar una acción secundaria solo si ayuda a destrabar el flujo.
- Mantener el texto breve.
- Evitar ilustraciones grandes o decorativas.
- Usar superficies tonales del sistema.
- No usar rojo/error para estados vacíos.

### Agenda sin turnos

Mensaje:

`No hay turnos para este día`

Apoyo:

`Podes crear un turno manual o revisar otra fecha.`

Acciones:

- `Nuevo turno`.
- `Cambiar fecha`.

### Clientes sin clientes

Mensaje:

`Todavía no hay clientes`

Apoyo:

`Los clientes apareceran cuando crees turnos o los agregues manualmente.`

Acción:

- `Nuevo cliente`.

### Servicios sin servicios

Mensaje:

`Agrega tu primer servicio`

Apoyo:

`Defini nombre, duración y precio para empezar a tomar reservas.`

Acción:

- `Nuevo servicio`.

### Profesionales sin profesionales

Mensaje:

`Agrega tu primer profesional`

Apoyo:

`Los profesionales permiten organizar agenda, servicios y disponibilidad.`

Acción:

- `Nuevo profesional`.

### Booking sin horarios

Mensaje:

`No hay horarios disponibles`

Apoyo:

`Proba con otra fecha o elegi otro profesional.`

Acciones:

- `Cambiar fecha`.
- `Cualquiera disponible`.

### Booking sin profesionales disponibles

Mensaje:

`No hay profesionales disponibles`

Apoyo:

`Proba con otra fecha o elegi la opcion cualquiera disponible.`

Acciones:

- `Cambiar fecha`.
- `Cualquiera disponible`.

## Errores y validaciones MVP

Decisión:

Los errores del MVP deben ser especificos, accionables y sin dramatismo visual. Usar rojo/error solo cuando hay bloqueo real. Para avisos preventivos o conflictos recuperables, usar un tratamiento sobrio con texto claro y acciones concretas.

Reglas:

- Explicar qué pasó.
- Decir qué hacer después.
- Mostrar el error cerca del lugar donde ocurre.
- Usar validación inline en campos cuando aplique.
- Evitar mensajes técnicos.
- No usar modales para todo; preferir banners compactos, inline errors o paneles contextuales.

### Crear / editar turno

#### Campos incompletos

Mensaje:

`Completá los datos obligatorios`

Apoyo:

`Necesitamos cliente, servicio, profesional y horario para crear el turno.`

Ubicación:

- Aviso compacto arriba del drawer.
- Error inline en campos obligatorios.

#### Horario ocupado

Mensaje:

`Ese horario ya no está disponible`

Apoyo:

`Elegí otro horario para continuar.`

Acción:

- `Ver horarios disponibles`.

#### Cliente inexistente

Mensaje:

`No encontramos ese cliente`

Apoyo:

`Podés crear un cliente nuevo o revisar la búsqueda.`

Acción:

- `Crear cliente`.

#### Profesional no disponible

Mensaje:

`El profesional no está disponible en ese horario`

Apoyo:

`Probá con otro horario o seleccióná otro profesional.`

### Booking cliente

#### Horario tomado mientras reservaba

Mensaje:

`Ese horario acába de ocuparse`

Apoyo:

`Elegí otro horario disponible para confirmar tu reserva.`

Acción:

- `Cambiar horario`.

#### Datos invalidos

Mensaje:

`Revisá tus datos`

Apoyo:

`Necesitamos un nombre y un teléfono válidos para confirmar la reserva.`

Ubicación:

- Aviso compacto en la sección de datos.
- Error inline en los campos.

#### Error al confirmar

Mensaje:

`No pudimos confirmar la reserva`

Apoyo:

`Intentá nuevamente en unos segundos.`

Acción:

- `Reintentar`.

#### Sin conexion

Mensaje:

`No hay conexión`

Apoyo:

`Revisá internet e intentá nuevamente.`

Acción:

- `Reintentar`.

## Loading states MVP

Decisión:

Los loading states del MVP deben usar skeletons sobrios como patron principal. Evitar spinners como solucion dominante. La pantalla debe conservar su estructura para reducir saltos visuales y mantener contexto.

Reglas:

- Mantener shell, navegación y topbar visibles.
- Mostrar skeletons donde va a aparecer contenido real.
- Deshabilitar acciones que no se puedan usar durante la carga.
- Mantener el resumen visible cuando una acción crítica se está confirmando.
- Usar microcopy clara en botónes de acción.
- No reemplazar toda la pantalla por un loader genérico salvo que no haya contexto cargado.

### Dashboard

Patron:

- Skeleton en metricas superiores.
- Skeleton en próximos turnos.
- Skeleton en resumen visual de agenda.
- Shell/topbar visibles.

### Agenda

Patron:

- Mantener columnas y grilla base.
- Skeleton en cards de turnos.
- Filtros deshabilitados mientras carga.
- Evitar pantalla completamente vacia.

### Listas admin

Aplica a:

- Clientes.
- Servicios.
- Profesionales.

Patron:

- Header y CTA visibles.
- Skeleton en metricas superiores.
- Skeleton en filas/cards.
- Panel lateral con placeholder si depende de selección.

### Crear / editar turno

Patron:

- Drawer permanece abierto.
- Campos deshabilitados mientras guarda.
- Botón principal en loading.
- Texto del botón: `Creando turno...` o `Guardando cambios...` segun contexto.
- Si falla, usar los errores definidos en `Errores y validaciones MVP`.

### Booking cliente

Patron:

- Al confirmar reserva, sticky CTA pasa a loading.
- Texto del CTA: `Confirmando...`.
- Deshabilitar cambios de horario/datos mientras confirma.
- Mantener resumen visible.
- Si falla, usar errores de booking definidos.

### Login

Patron:

- CTA principal pasa a loading.
- Texto del CTA: `Ingresando...`.
- Deshabilitar `Continuar con Google`.
- Mantener la pantalla estáble.
- Si falla, mostrar error claro sin exponer información sensible.

## Post-confirmación booking MVP

Decisión:

El booking cliente debe tener un estado/pantalla separada de confirmación posterior a tocar `Confirmar reserva`.

Motivo:

El bloque `Reserva lista para confirmar` sirve para revisar antes de enviar, pero después de confirmar el cliente necesita una respuestá clara, final y confiable. No debe quedar en la misma pantalla como si todavía pudiera editar el flujo.

### Contenido

Mensaje principal:

`Reserva confirmada`

Apoyo:

`Te esperamos en Barber Studio. Guardamos el turno con los datos selecciónados.`

Resumen visible:

- Servicio.
- Profesional.
- Fecha.
- Hora.
- Dirección.
- Nombre del cliente.

Datos demo:

- Servicio: `Corte + barba`.
- Profesional: `Mateo Ruiz`.
- Fecha y hora: `Martes 28 de abril, 15:30 hs`.
- Dirección: `Av. Palermo 1842, Buenos Aires`.
- Cliente: `Santiago Moreno`.

Política breve:

`Podés cancelar o reprogramar hasta 3 horas antes del turno.`

Acciones MVP:

- `Agregar al calendario`.
- `Hacer otra reserva`.

Acciones post-MVP:

- Compartir por WhatsApp.
- Enviar comprobante.
- Ver mis turnos.
- Reprogramar desde link seguro.

### Visualidad

Reglas:

- Mantener header público de booking.
- No pedir login.
- No mostrar shell admin.
- Usar el logo `BS` y marca `Barber Studio` con los tokens aprobados.
- Usar estado positivo sobrio, sin celebración excesiva.
- Mantener resumen compacto y escaneable.
- No convertir la confirmación en landing page.

## Fuente visual

Proyecto de Stitch:

https://stitch.withgoogle.com/projects/10594197106398501653

Nombre del proyecto:

Agenda Pro SaaS

El proyecto de Stitch se usara como base visual para el MVP. No es necesario que contenga toda la evolucion futura del producto. Cuando una iteración cambie mucho el foco, se podran crear nuevos proyectos de Stitch separados.

## Dirección visual

La dirección elegida es la definida en Stitch como Precision Concierge.

Interpretacion para Turnero:

- La app debe sentirse premium, precisa y profesional.
- Debe evitar parecer un CRUD genérico o una planilla administrativa.
- La experiencia debe priorizar claridad operativa, buena jerarquía visual y una sensacion de servicio cuidado.
- La agenda debe ser el centro de la experiencia.
- El diseño debe cubrir tanto al negocio que administra turnos como al cliente que reserva.

Principios visuales:

- Usar superficies tonales para separar secciones, no muchas lineas o bordes.
- Usar una base clara con tonos slate/azulados.
- Usar blanco para tarjetas o piezas de contenido importantes.
- Reservar el indigo para acciones principales y estados activos.
- Usar CTAs principales con gradiente sútil.
- Mantener la UI funcional, escaneable y premium.
- Evitar una estetica de landing page para vistas operativas.

## Decisión sobre proyectos de Stitch

Decisión:

Usar el proyecto actual de Stitch como fuente visual del MVP.

Motivo:

- Ya contiene una dirección visual clara.
- Tiene varias vistas exploradas.
- Incluye un design system coherente.
- Permite cerrar la primera version sin dispersar decisiones.

Regla:

- Mantener en este proyecto las pantallas del MVP y exploraciones cercanas.
- Crear nuevos proyectos solo para iteraciones grandes, por ejemplo booking avanzado, multi-business o analytics avanzado.
- No dividir demasiado temprano para no perder coherencia visual.

## MVP visual

Estas pantallas forman el nucleo de la primera experiencia de producto.

| Vista | Estado | Observacion |
| --- | --- | --- |
| Login Screen | MVP | Entrada visual al producto. Debe transmitir una experiencia profesional desde el primer contacto. |
| Admin Dashboard | MVP | Vista principal del negocio. Debe mostrar salud operativa: turnos, ingresos, clientes, ocupacion y próximos eventos. |
| Agenda View | MVP | Pantalla central del producto. Debe ser la más cuidada para lectura rápida, creacion y gestión diaria de turnos. |
| Crear / editar turno | MVP | Flujo clave. Puede resolverse como modal, drawer o pantalla dedicada, pero debe estar completamente diseñado. |
| Client List | MVP | Gestión de clientes con búsqueda, filtros y acceso rápido al historial. |
| Client Profile | MVP | Hace que el producto se sienta completo, no solo CRUD. Debe mostrar próximos turnos, historial, datos y notas. |
| Service Management | MVP | Configuración de la oferta del negocio: precio, duración, categoría y estado. |
| Staff Management | MVP | Gestión operativa de profesionales: disponibilidad, rol/especialidad y carga de agenda. |
| Business Configuration | MVP | Configuración de identidad, horarios, ubicación, reglas de reserva y preferencias básicas. |
| Unified Booking Flow | MVP | Experiencia cliente principal. Debe ser simple, mobile-first y muy pulida. |

## Post-MVP cercano

Estas pantallas son valiosas, pero conviene cerrarlas después de estábilizar la experiencia base.

| Vista | Motivo |
| --- | --- |
| Professional Daily Agenda | Vista especifica para profesionales. Requiere definir con más detalle el trabajo diario de ese rol. |
| Professional Weekly Agenda | Complementa la diaria y sirve para planificacion semanal más avanzada. |
| Business Profile | Importante para experiencia publica del negocio, pero puede evolucionar después del booking flow. |
| My Appointments | Buena experiencia para cliente recurrente. Puede venir después de cerrar reserva y perfil cliente. |
| Admin Analytics | Potente para negocios más maduros. Primero conviene cerrar dashboard operativo. |
| Edición de Horarios de Atencion | Muy importante, pero compleja. Conviene tratarla como módulo propio de configuración/disponibilidad. |

## Futuro / exploracion

Estas pantallas pertenecen a una vision más grande del producto.

| Vista | Motivo |
| --- | --- |
| Explore / Multi-Business View | Cambia el producto hacia marketplace o directorio de negocios. No debe mezclarse con el MVP base. |
| Arquitectura Multi-Tenant Explore | Más estrategia que pantalla final. Sirve para pensar evolucion. |
| Estrategia de Acceso y Dominios | Define arquitectura, roles y accesos, no experiencia core inicial. |
| Estrategia de Coherencia Visual | Sirve como documentacion interna del sistema visual. |

## Recorte ideal del MVP de diseño

Para que el diseño se sienta completo y defendible, se debe cerrar primero:

1. Login.
2. Layout base: navegación, sidebar/topbar y responsive.
3. Dashboard admin.
4. Agenda.
5. Crear y editar turno.
6. Clientes.
7. Perfil de cliente.
8. Servicios.
9. Profesionales.
10. Configuración del negocio.
11. Booking flow mobile.

Este MVP cubre las dos experiencias principales:

- El negocio que administra turnos.
- El cliente que reserva.

## Revisión pendiente por pantalla

### Login

Falta definir:

- Estado normal.
- Estado loading.
- Estado error.
- Recuperar contraseña.
- Validación visual de email y password.
- Version mobile.
- Si el ingreso diferencia admin, profesional o cliente.

### Layout base

Falta cerrar:

- Sidebar desktop.
- Topbar con búsqueda, notificaciones, usuario y negocio activo.
- Navegación mobile.
- Estado activo de cada sección.
- Comportamiento cuando hay muchas opciones.
- Si el producto usa un solo layout o layouts separados para admin y cliente.

### Dashboard admin

Falta definir:

- Estados vacíos cuando todavía no hay turnos o clientes.
- Metricas principales.
- Filtros por día, semana y mes.
- Acciones rápidas.
- Como se ve con pocos datos.
- Como se ve con muchos datos.
- Alertas: turnos cancelados, pagos pendientes o agenda llena.

### Agenda

Falta revisar:

- Vista día.
- Vista semana.
- Si hace falta vista mes.
- Crear turno desde un slot vacio.
- Editar turno existente.
- Cancelar y reprogramar.
- Estados del turno: pendiente, confirmado, cancelado, completado y no asistió.
- Colores por estado sin romper el estilo premium.
- Filtros por profesional, servicio y estado.
- Empty state de día sin turnos.
- Vista mobile de agenda.

### Crear / editar turno

Falta diseñar:

- Modal, drawer o pantalla dedicada.
- Selección de cliente.
- Selección de servicio.
- Selección de profesional.
- Fecha y horario.
- Duración y precio visibles.
- Confirmación final.
- Error por horario ocupado.
- Error por datos incompletos.
- Error por cliente inexistente.
- Diferencia visual entre crear, editar, cancelar y reprogramar.

### Clientes

Falta definir:

- Tabla/lista desktop.
- Lista mobile.
- Búsqueda y filtros.
- Estado vacio.
- Crear cliente.
- Editar cliente.
- Eliminar o desactivar cliente.
- Indicadores útiles: ultimo turno, próximo turno, cantidad de visitas y notas.

### Perfil de cliente

Falta cerrar:

- Datos personales.
- Próximo turno.
- Historial de turnos.
- Notas internas.
- Acciones rápidas: nuevo turno, editar datos y contactar.
- Estados sin historial.
- Diferencia entre vista admin y vista cliente, si ambas existen.

### Servicios

Falta definir:

- Lista de servicios.
- Crear y editar servicio.
- Precio, duración, categoría y estado.
- Activar y desactivar servicio.
- Empty state.
- Como mostrar servicios populares o más reservados.

### Profesionales

Falta revisar:

- Lista de profesionales.
- Perfil o resumen por profesional.
- Especialidades o servicios que realiza.
- Estado activo/inactivo.
- Carga de agenda.
- Disponibilidad resumida.
- Crear y editar profesional.
- Empty state.

### Configuración del negocio

Falta decidir alcance visual:

- Datos del negocio.
- Logo, nombre y marca.
- Ubicación.
- Horarios básicos.
- Reglas de reserva.
- Duración mínima de anticipacion.
- Cancelaciones.
- Notificaciones.
- Preferencias visuales, moneda o idioma si aplica.

### Booking mobile

Falta pulir como flujo completo:

- Selección de servicio.
- Selección de profesional o cualquiera.
- Selección de fecha y hora.
- Datos del cliente.
- Confirmación.
- Pantalla de éxito.
- Error si el horario ya no está disponible.
- Volver atras sin perder selección.
- Resumen persistente de la reserva.

## Componentes globales pendientes

Antes de implementar, conviene diseñar o documentar:

- Botónes: primary, secondary, destructive e icon buttons.
- Inputs.
- Selects.
- Date/time pickers.
- Cards de turno.
- Badges de estado.
- Tablas/listas.
- Modales/drawers.
- Empty states.
- Loading states.
- Error states.
- Toasts/notificaciones.
- Confirm díalogs.
- Navegación mobile.
- Breakpoints responsive.

## Prioridad de revisión de diseño

Orden recomendado:

1. Layout base.
2. Agenda.
3. Crear / editar turno.
4. Dashboard.
5. Booking mobile.
6. Clientes + perfil.
7. Servicios.
8. Profesionales.
9. Configuración.
10. Estados globales y componentes compartidos.

Motivo:

Si agenda, turno y navegación quedan bien, el resto del producto se acomoda con mayor coherencia visual.

## Decisión 1: Layout base

Estado: decidido para MVP.

El producto tendra layouts separados por tipo de experiencia. No se intentara resolver admin, cliente, login y booking con una única estructura visual.

### Layouts definidos

| Layout | Uso | Estado |
| --- | --- | --- |
| Layout público / login | Login y pantallas de acceso | MVP |
| Layout administrativo | Dashboard, agenda, clientes, servicios, profesionales y configuración | MVP |
| Layout de booking cliente | Flujo mobile-first para reservar turno | MVP |
| Layout cliente logueado | Mis turnos, perfil cliente y experiencia recurrente | Post-MVP |
| Layout profesional | Agenda diaria/semanal del profesional | Post-MVP |

### Layout administrativo desktop

Decisión:

Usar sidebar fija + topbar.

Estructura:

- Sidebar fija a la izquierda.
- Topbar superior con búsqueda, negocio activo, notificaciones y usuario.
- Contenido principal amplio, con superficies tonales.
- CTA global visible para crear un nuevo turno.

Secciones principales:

- Dashboard.
- Agenda.
- Clientes.
- Servicios.
- Profesionales.
- Configuración.

Reglas visuales:

- La sidebar no debe sentirse pesada ni encerrada por bordes fuertes.
- El estado activo debe resolverse con cambio de superficie y color indigo.
- La topbar puede usar efecto glass sútil.
- El CTA principal debe usar el gradiente indigo definido por el sistema visual.
- La agenda debe tener prioridad visual sobre las vistas administrativas secundarias.

### Layout administrativo mobile

Decisión:

Usar navegación inferior para accesos principales y acciones contextuales dentro de cada pantalla.

Accesos recomendados:

- Dashboard.
- Agenda.
- Clientes.
- Más.

Notas:

- Servicios, profesionales y configuración pueden entrar dentro de "Más" para evitar saturar la navegación inferior.
- La acción "Nuevo turno" debe estar muy disponible desde Agenda y Dashboard.
- Evitar replicar la sidebar desktop como menu principal mobile salvo como panel secundario.

### Layout de booking cliente

Decisión:

Usar un layout propio, mobile-first, sin sidebar ni topbar administrativa.

Motivo:

El cliente que reserva necesita una experiencia enfocada, lineal y sin ruido administrativo.

Estructura esperada:

- Header compacto con identidad del negocio.
- Flujo por pasos o secciones progresivas.
- Resumen persistente de la reserva.
- CTA principal claro para avanzar o confirmar.
- Navegación hacia atras sin perder selección.

### Layout público / login

Decisión:

Usar un layout propio, más editorial y limpio.

Objetivo:

Transmitir una primera impresion profesional sin convertirlo en landing page.

Debe incluir:

- Marca o nombre del producto/negocio.
- Formulario de acceso.
- Estados de error y loading.
- Recuperación de contraseña.
- Variante responsive.

### Layout profesional

Decisión:

Queda para post-MVP.

Cuando se disene, puede reutilizar parte del shell administrativo, pero debe simplificarse para la operación diaria del profesional.

Principio:

El profesional necesita menos configuración y más foco en su agenda, próximo turno y acciones rápidas sobre atencion.

### Layout cliente logueado

Decisión:

Queda para post-MVP.

Debe ser mobile-first y estar separado visualmente del admin.

Principio:

El cliente recurrente debe poder ver próximos turnos, historial, datos personales y volver a reservar sin entrar en una experiencia administrativa.

## Decisión 2: Agenda

Estado: decidido para MVP.

La agenda será la pantalla central del producto. Debe ser la vista más cuidada del administrador porque concentra la operación diaria: ver turnos, detectar disponibilidad, crear reservas, reprogramar y resolver cambios.

### Objetivo de la vista

La agenda debe permitir responder rápidamente:

- Qué turnos hay hoy.
- Quien atiende cada turno.
- Qué profesional está disponible.
- Qué horarios están libres.
- Qué turnos requieren acción.
- Como crear, editar, cancelar o reprogramar un turno.

### Vistas de agenda

Decisión:

El MVP debe contemplar vista día y vista semana.

| Vista | Estado | Uso |
| --- | --- | --- |
| Día | MVP | Operación diaria, foco en el presente y gestión inmedíata. |
| Semana | MVP | Planificacion, carga de profesionales y deteccion de disponibilidad. |
| Mes | Post-MVP | Útil para lectura macro, pero no necesaria para operar turnos con precision. |

La vista día debe ser la vista principal por defecto.

### Agenda desktop

Decisión:

Usar una grilla horaria amplia, con columnas por profesional cuando haya más de uno.

Estructura recomendada:

- Header de agenda con fecha, selector de vista y acciones principales.
- Controles para navegar día anterior, hoy y día siguiente.
- Filtros visibles pero livianos.
- Grilla principal con horas en el eje vertical.
- Columnas por profesional o agrupacion equivalente.
- Panel lateral o drawer para detalle del turno selecciónado.

Reglas visuales:

- La grilla debe ser funcional y escaneable, no decorativa.
- Evitar bordes pesados; usar cambios de superficie y lineas muy sútiles cuando sean necesarias.
- Los slots disponibles deben sentirse claros sin competir con los turnos existentes.
- Los turnos confirmados deben destacárse con una franja/acento, no con bloques de color demasiado fuertes.
- El espacio vacio debe ayudar a entender disponibilidad.

### Agenda mobile admin

Decisión:

No intentar replicar la grilla desktop completa en mobile.

El admin mobile no debe tratarse como una adaptacion secundaria. Para el perfil de barberias y negocios iniciales del MVP, el celular puede ser el canal principal de gestión porque muchos trabajan sin monitor y hoy resuelven turnos por WhatsApp. La experiencia mobile debe reducir tiempo operativo, no solo permitir consultar información.

Estructura recomendada:

- Header compacto con fecha.
- Selector día/semana simplificado.
- Filtros accesibles desde bottom sheet o botón.
- Lista cronológica del día agrupada por bloques horarios.
- Dentro de cada bloque horario, mostrar uno o más eventos/disponibilidades por profesional.
- CTA persistente para nuevo turno.
- Acciones rápidas por turno: contactar, confirmar, reprogramar y cancelar.

Motivo:

En mobile, la prioridad es operar rápido: ver próximos turnos, crear uno nuevo, llamar/contactar, cancelar o reprogramar. Una grilla compleja por profesional pierde legibilidad en pantallas chicas.

Regla:

La agenda mobile debe sentirse como una herramienta diaria para reemplazar coordinacion manual por WhatsApp. Priorizar lectura cronológica, acciones tactiles claras y bajo esfuerzo de carga.

Regla multi-profesional:

No usar `Hueco libre` como estado genérico de la barberia. La disponibilidad debe estar atada a un profesional o a una cantidad explícita de profesionales disponibles.

Ejemplos validos:

- `Lucas Ferrer disponible · 45 min`.
- `Mateo Ruiz disponible · 30 min`.
- `2 profesionales disponibles · 45 min`.

Si dos profesionales tienen actividad a la misma hora, ambos deben aparecer dentro del mismo bloque horario. La hora es el grupo; el profesional se explícita en cada fila.

Regla de filtro por profesional:

Cuando el admin filtra por un profesional especifico, la agenda debe simplificarse:

- El chip del profesional queda activo.
- Mostrar un bloque de contexto con el nombre del profesional y resumen del día.
- No repetir el nombre del profesional en cada turno, porque ya está dado por el filtro.
- Las disponibilidades pueden decir solo `Disponible · 30 min` o `Disponible · 45 min`.
- El CTA `Nuevo turno` debe asumir ese profesional preseleccionado.

Ejemplo:

- Contexto: `Mateo Ruiz · 4 turnos · 2 disponibles`.
- Turno: `Santiago Moreno · Corte + barba · Confirmado`.
- Disponibilidad: `Disponible · 30 min · Crear turno`.

### Mobile Admin Shell

Decisión:

Definir un shell mobile admin fijo para evitar que cada pantalla mobile genere su propia navegación.

Este shell aplica a pantallas principales del admin mobile. No aplica al booking cliente ni necesariamente a flujos de creacion/edición cuando funcionen como pantalla completa focalizada o bottom sheet.

Estructura fija:

- Header superior:
  - Logo `BS` de 40x40, `rounded-xl`, gradiente `primary` a `primary-container`.
  - Marca `Barber Studio` en `text-primary`.
  - Subtítulo contextual breve, por ejemplo `Agenda de hoy`.
  - Acciones a la derecha: notificaciones con punto rojo, ayuda y avatar.
- Area de contenido:
  - Scroll vertical.
  - Padding inferior suficiente para no quedar tapada por acciones sticky o bottom nav.
- Acción sticky opcional:
  - Una acción primaria contextual arriba del bottom nav.
  - Ejemplos: `Nuevo turno`, `Guardar cambios`, `Confirmar`.
  - No duplicar iconos ni texto.
- Bottom nav fija:
  - `Agenda`.
  - `Clientes`.
  - `Servicios`.
  - `Más`.

Reglas visuales:

- Bottom nav siempre fija abajo, con safe-area/padding inferior.
- Fondo `surface-container-low` o `surface` con blur suave si flota sobre contenido.
- Active state consistente: superficie `secondary-container` o `primary-fixed`, icono/texto en `primary` o token equivalente legible.
- Inactive state: `text-on-surface-variant`, sin fondos fuertes.
- Labels siempre visibles y en sentence case.
- Iconos consistentes por item:
  - Agenda: `calendar_today`.
  - Clientes: `group`.
  - Servicios: `content_cut`.
  - Más: `more_horiz`.
- No usar bottom nav en booking cliente.
- No usar sidebar desktop en mobile admin.

### Headers mobile admin

Decisión:

Usar dos patrones de header mobile segun el tipo de pantalla.

Pantallas de sección:

- Usan header de marca.
- Incluyen logo `BS`, marca `Barber Studio`, subtítulo contextual y acciones de notificaciones/ayuda/avatar.
- Aplica a Agenda, Clientes, Servicios, Más y pantallas equivalentes de navegación principal.

Pantallas transaccionales o de tarea:

- Usan task header.
- No necesitan mostrar logo `BS`.
- Incluyen acción de volver/cerrar, título de la tarea y contexto corto.
- Aplica a `Crear turno`, `Editar turno`, `Detalle de turno`, `Confirmar pendiente` y flujos similares.

Motivo:

En mobile, las pantallas transaccionales necesitan foco y velocidad. Repetir la marca en cada formulario agrega ruido y compite con el objetivo principal. La marca queda representada por el contexto de origen y por los tokens visuales del sistema.

Reglas:

- No mezclar ambos patrones en una misma pantalla.
- El task header debe mantener tipografía, colores y superficies del sistema.
- El contexto corto debe reemplazar información repetitiva, por ejemplo `Martes 28 de abril · 10:15 · Mateo Ruiz`.
- Las pantallas de sección vuelven siempre al header de marca.

### Estados de turno

Decisión:

Definir estados visuales desde el MVP para evitar inconsistencias futuras.

Estados principales:

| Estado | Uso visual recomendado |
| --- | --- |
| Pendiente | Superficie clara con acento indigo suave o badge pendiente. |
| Confirmado | Card blanca con franja vertical verde/tertiary. |
| Cancelado | Texto atenuado, superficie neutra y badge de cancelacion. |
| Completado | Estado sobrio, con check o acento neutro/verde suave. |
| No asistió | Badge de alerta, sin usar rojo dominante salvo casos criticos. |

Regla:

Los colores de estado no deben dominar la pantalla. La agenda debe seguir sintiendose premium y clara. Usar acentos, badges y franjas antes que fondos saturados.

### Acciones principales

Acciones MVP:

- Crear turno desde CTA global.
- Crear turno desde slot vacio.
- Ver detalle del turno.
- Editar turno.
- Reprogramar turno.
- Cancelar turno.
- Confirmar turno pendiente.

Acciones post-MVP:

- Marcar completado.
- Marcar no asistió.
- Contactar cliente desde integracion real.
- Registrar pago.
- Ver historial del cliente dentro del turno.

### Filtros y búsqueda

Filtros MVP:

- Profesional.
- Servicio.
- Estado.
- Fecha.

Búsqueda:

- Cliente.
- Teléfono/email si aplica.
- Servicio.

Regla:

Los filtros no deben ocupar más protagonismo que la grilla. En desktop pueden estar en una barra compacta; en mobile deben ir en bottom sheet o panel secundario.

### Detalle de turno

Decisión:

El detalle de un turno debe abrirse como drawer lateral en desktop y bottom sheet en mobile.

Contenido mínimo:

- Cliente.
- Servicio.
- Profesional.
- Fecha y hora.
- Duración.
- Estado.
- Notas.
- Acciones principales.

Motivo:

El usuario debe poder inspeccionar y actuar sobre un turno sin perder el contexto de la agenda.

### Empty states

La agenda necesita empty states especificos:

- Día sin turnos.
- Profesional sin turnos.
- Filtro sin resultados.
- Sin profesionales configurados.
- Sin servicios configurados.

Regla:

Cada empty state debe incluir una acción clara, por ejemplo crear turno, limpiar filtros, crear profesional o crear servicio.

### Conflictos y disponibilidad

Decisión:

La vista debe contemplar estados visuales para conflictos aunque la lógica final se implemente después.

Casos a diseñar:

- Horario ocupado.
- Horario fuera de atencion.
- Profesional no disponible.
- Turno superpuesto.
- Cambio de horario que requiere confirmación.

Regla:

Los conflictos deben comunicarse de forma clara y calmada. Evitar mensajes alarmistas si el caso es recuperable.

### Prioridad de diseño dentro de Agenda

Orden de cierre:

1. Vista día desktop.
2. Crear turno desde slot vacio.
3. Detalle de turno en drawer.
4. Vista día mobile.
5. Vista semana desktop.
6. Estados vacíos y filtros.
7. Conflictos y disponibilidad.

Motivo:

La vista día desktop define el lenguaje principal de la agenda. Después se adapta a mobile y a la semana.

## Decisión 3: Crear / editar turno

Estado: decidido para MVP.

Crear y editar turno es el flujo operativo más importante después de la agenda. Debe sentirse rápido, claro y asistido, porque se usara muchas veces durante la jornada.

Alcance de está decisión:

Está decisión se enfoca principalmente en la creacion y edición administrativa de turnos desde la agenda. Toma en cuenta que existe un flujo cliente en Stitch, pero no define en detalle el Unified Single-Page Booking Flow. Ese flujo debe tratarse como una decisión propia porque responde a otra experiencia: cliente mobile-first, guiada y sin contexto administrativo.

### Objetivo del flujo

El usuario debe poder:

- Crear un turno nuevo desde la agenda o desde un CTA global.
- Crear un turno partiendo de un slot vacio.
- Editar datos de un turno existente.
- Reprogramar fecha, hora o profesional.
- Cancelar un turno con confirmación.
- Entender conflictos o datos faltantes sin perder el contexto.

### Patron de interfaz

Decisión:

Usar drawer lateral en desktop y bottom sheet en mobile.

| Contexto | Patron | Motivo |
| --- | --- | --- |
| Desktop | Drawer lateral | Permite mantener visible la agenda y editar sin perder contexto. |
| Mobile admin | Bottom sheet o pantalla completa segun complejidad | Evita formularios comprimidos y permite foco tactil. |
| Booking cliente | Flujo por pasos | El cliente necesita una experiencia guiada, no un formulario administrativo. |

Regla:

No usar modal centrado como patron principal para crear turnos desde agenda. El modal bloquea demasiado el contexto y se siente menos operativo.

### Modos del flujo

El mismo patron visual debe soportar distintos modos:

| Modo | Uso |
| --- | --- |
| Crear | Nuevo turno desde CTA o slot vacio. |
| Editar | Cambiar datos del turno sin necesariamente cambiar horario. |
| Reprogramar | Cambiar fecha, hora o profesional con foco en disponibilidad. |
| Cancelar | Confirmar cancelacion y motivo si aplica. |
| Ver detalle | Consultar datos sin editar inmedíatamente. |

La UI debe dejar claro en que modo está el usuario.

### Estructura del drawer desktop

Contenido recomendado:

1. Header con título y estado.
2. Resumen compacto del turno.
3. Cliente.
4. Servicio.
5. Profesional.
6. Fecha y hora.
7. Duración y precio.
8. Notas internas.
9. Alertas o conflictos.
10. Acciones principales.

Acciones:

- Crear turno.
- Guardar cambios.
- Reprogramar.
- Cancelar turno.
- Cerrar sin guardar.

Regla:

La acción principal debe estar visualmente destacáda. Acciones destructivas como cancelar deben estar separadas y no competir con guardar.

### Flujo recomendado para crear turno

Decisión:

El flujo de creacion debe ser asistido, pero no excesivamente largo.

Orden recomendado:

1. Elegir o confirmar horario.
2. Elegir cliente.
3. Elegir servicio.
4. Elegir profesional.
5. Revisar duración/precio.
6. Agregar notas si hace falta.
7. Confirmar.

Si el turno se crea desde un slot de agenda, fecha, hora y profesional deben venir precargados.

### Selección de cliente

Decisión:

La selección de cliente debe permitir buscar cliente existente y crear cliente rápido.

Estados a diseñar:

- Búsqueda sin texto.
- Resultados de búsqueda.
- Sin resultados.
- Crear cliente rápido.
- Cliente selecciónado.
- Cliente con datos incompletos.

Regla:

No obligar al usuario a salir del flujo de turno para crear un cliente básico.

### Selección de servicio

Decisión:

La selección de servicio debe mostrar nombre, duración y precio.

Estados a diseñar:

- Servicio selecciónado.
- Servicio no disponible.
- Sin servicios configurados.
- Búsqueda o filtrado por categoría si hay muchos servicios.

Regla:

Duración y precio deben quedar visibles antes de confirmar el turno.

### Selección de profesional

Decisión:

La selección de profesional debe estar conectada visualmente con disponibilidad.

Estados a diseñar:

- Profesional disponible.
- Profesional ocupado.
- Profesional fuera de horario.
- Opcion "cualquiera" para booking cliente.
- Profesional recomendado si aplica.

Regla:

En admin se puede elegir profesional de forma directa. En booking cliente, la opcion "cualquiera" debe estar disponible para reducir fricción.

### Fecha y hora

Decisión:

El selector de fecha/hora debe priorizar disponibilidad.

Estados a diseñar:

- Horario disponible.
- Horario ocupado.
- Fuera de horario.
- Horario selecciónado.
- Cambio que genera conflicto.

Regla:

No mostrar solo inputs libres de fecha y hora cuando el contexto requiere disponibilidad. La UI debe orientar al usuario hacia horarios validos.

### Reprogramar turno

Decisión:

Reprogramar debe ser un modo propio, no solo editar campos.

Motivo:

Cambiar horario o profesional tiene más riesgo operativo que editar una nota. Debe mostrar disponibilidad y confirmar el cambio.

Debe incluir:

- Turno actual.
- Nuevo horario/profesional.
- Diferencia visible.
- Confirmación final.
- Mensaje si hay conflicto.

### Cancelar turno

Decisión:

Cancelar debe requerir confirmación.

Debe incluir:

- Resumen del turno a cancelar.
- Motivo opcional.
- Aviso claro de consecuencia.
- Acción destructiva visualmente separada.

Regla:

No usar rojo dominante en toda la pantalla. Usar rojo solo para la acción destructiva y mensajes criticos.

### Errores y validaciones

Estados a diseñar:

- Datos obligatorios faltantes.
- Horario ocupado.
- Profesional no disponible.
- Servicio no selecciónado.
- Cliente no selecciónado.
- Error al guardar.
- Cambios sin guardar.

Regla:

Los errores deben aparecer cerca del campo o decisión que los causa. Evitar mensajes genéricos arriba del formulario como única comunicación.

### Confirmación y feedback

Decisión:

Después de crear, editar, reprogramar o cancelar, mostrar feedback breve y volver al contexto de agenda.

Patrones posibles:

- Toast de confirmación.
- Actualizacion visual inmedíata del turno en agenda.
- Drawer cerrado automaticamente en acciones simples.
- Drawer permanece abierto si hay datos que revisar.

Regla:

El usuario no debe quedar en una pantalla muerta después de guardar. Siempre debe volver al flujo operativo.

### Prioridad de diseño del flujo

Orden de cierre:

1. Crear turno desde slot vacio en desktop.
2. Ver detalle de turno en drawer.
3. Editar turno existente.
4. Reprogramar turno.
5. Cancelar turno.
6. Crear cliente rápido dentro del flujo.
7. Variante mobile admin.
8. Decisión separada para Unified Single-Page Booking Flow.

Motivo:

Crear desde slot y ver detalle cubren el uso diario principal. Luego se agregan variaciones de mayor complejidad.

### Relación con Unified Single-Page Booking Flow

Decisión:

El Unified Single-Page Booking Flow de Stitch no debe implementarse como una copia del formulario administrativo de crear turno.

Diferencias clave:

- El admin parte de agenda, disponibilidad y operación interna.
- El cliente parte de una intencion de reserva y necesita guia progresiva.
- El admin puede usar drawer/bottom sheet porque ya conoce el contexto.
- El cliente necesita un flujo mobile-first con resumen persistente, pasos claros y confirmación final.
- El admin puede editar datos operativos; el cliente solo debe ver y elegir lo necesario para reservar.

Regla:

Ambos flujos comparten conceptos de negocio, pero no comparten la misma estructura visual. El booking cliente se definira como una decisión propia.

## Decisión 4: Unified Single-Page Booking Flow

Estado: decidido para MVP.

El Unified Single-Page Booking Flow será la experiencia principal del cliente para reservar un turno. Debe ser mobile-first, guiado y claro, sin heredar la complejidad visual del administrador.

### Objetivo del flujo

El cliente debe poder reservar un turno sin entender la estructura interna del negocio.

El flujo debe responder:

- Qué servicio quiero.
- Con quien quiero atenderme, o si me da igual.
- Qué día y horario están disponibles.
- Qué datos necesito dejar.
- Qué estoy confirmando.
- Qué pasa después de confirmar.

### Patron de interfaz

Decisión:

Usar una experiencia single-page con secciones progresivas y resumen persistente.

Motivo:

El flujo de Stitch apunta a una reserva fluida en una sola pantalla, no a un wizard pesado con pantallas completamente aisladas. La experiencia debe permitir avanzar paso a paso, pero manteniendo contexto.

Estructura recomendada:

1. Header compacto con identidad del negocio.
2. Selección de servicio.
3. Selección de profesional.
4. Selección de fecha y hora.
5. Datos del cliente.
6. Resumen de reserva.
7. Confirmación.
8. Pantalla/estado de éxito.

### Mobile-first

Decisión:

El diseño principal del booking debe pensarse primero para mobile.

Reglas:

- Una columna principal.
- Secciones claras y escaneables.
- CTAs grandes y faciles de tocar.
- Resumen persistente o facilmente accesible.
- Navegación hacia atras sin perder datos.
- Evitar tablas, grillas densas o controles administrativos.

Desktop puede existir, pero debe sentirse como una adaptacion amplia del flujo mobile, no como un dashboard.

### Single-page vs wizard

Decisión:

Usar single-page progresiva, no wizard rigido.

Comportamiento:

- El cliente ve el progreso del flujo.
- Las secciones futuras pueden estar colapsadas o bloqueadas hasta completar pasos previos.
- Al selecciónar una opcion, el flujo avanza suavemente a la siguiente sección.
- El resumen se actualiza en tiempo real.

Regla:

No esconder tanto contexto que el cliente pierda claridad sobre lo elegido. La reserva debe sentirse guiada, pero no fragmentada.

### Selección de servicio

Decisión:

El servicio debe ser el primer paso fuerte del flujo.

Cada servicio debe mostrar:

- Nombre.
- Duración.
- Precio.
- Descripción corta si aporta valor.
- Categoría si hay muchos servicios.

Estados:

- Servicio selecciónado.
- Servicio no disponible.
- Sin servicios.
- Cargando servicios.

Regla:

El cliente debe entender rápidamente que incluye cada servicio y cuanto dura antes de elegir horario.

### Selección de profesional

Decisión:

Permitir elegir profesional especifico o la opcion "cualquiera disponible".

Motivo:

La opcion "cualquiera" reduce fricción y ayuda a encontrar disponibilidad más rápido.

Cada profesional debe mostrar:

- Nombre.
- Rol/especialidad.
- Foto o avatar si existe.
- Proxima disponibilidad si aplica.

Estados:

- Profesional selecciónado.
- Profesional no disponible para el servicio.
- Cualquiera disponible selecciónado.

Regla:

La elección de profesional no debe bloquear innecesariamente la reserva si el cliente no tiene preferencia.

### Selección de fecha y hora

Decisión:

Mostrar disponibilidad real como slots selecciónables.

Estructura recomendada:

- Selector de fecha simple.
- Slots agrupados por momento del día si hay muchos horarios.
- Estado claro para horario selecciónado.
- Mensaje calmo cuando no hay horarios.

Estados:

- Horario disponible.
- Horario selecciónado.
- Sin horarios para la fecha.
- Horario ya no disponible.
- Cargando disponibilidad.

Regla:

Evitar inputs manuales de hora para el cliente. El cliente debe elegir entre opciones disponibles.

### Datos del cliente

Decisión:

Pedir solo los datos necesarios para confirmar la reserva.

Campos base:

- Nombre.
- Teléfono.
- Email, si se requiere confirmación o recordatorio.
- Nota opcional.

Regla:

No sobrecargar el flujo con datos administrativos. Si el cliente ya existe o está logueado, reutilizar datos y permitir edición mínima.

### Resumen persistente

Decisión:

El flujo debe tener un resumen persistente o siempre accesible.

Debe mostrar:

- Servicio.
- Profesional o "cualquiera disponible".
- Fecha.
- Hora.
- Duración.
- Precio.
- Datos principales del cliente antes de confirmar.

Mobile:

- Puede ser una barra inferior compacta o una sección sticky antes del CTA.

Desktop:

- Puede ser una columna lateral fija.

Regla:

El cliente nunca debe confirmar sin ver claramente que está reservando.

### Confirmación

Decisión:

Antes de confirmar, mostrar una revisión final clara.

Debe incluir:

- Detalle completo de la reserva.
- Política breve de cancelacion si aplica.
- CTA principal de confirmar.
- Opcion de volver a editar.

Regla:

Confirmar debe sentirse definitivo, pero no intimidante.

### Éxito

Decisión:

Después de confirmar, mostrar un estado de éxito propio.

Debe incluir:

- Mensaje claro de reserva confirmada o pendiente.
- Fecha y hora.
- Servicio.
- Profesional si aplica.
- Próximos pasos.
- Acción para agregar al calendario si se decide incluir.
- Acción para hacer otra reserva o volver al perfil del negocio.

Regla:

No dejar al cliente en el formulario después de confirmar.

### Errores y casos limite

Estados a diseñar:

- Horario tomado mientras se reservaba.
- Servicio ya no disponible.
- Profesional sin horarios.
- Datos obligatorios faltantes.
- Error de confirmación.
- Sin conexion o error temporal.

Regla:

Los errores deben permitir recuperación. Siempre que sea posible, ofrecer elegir otro horario, cambiar profesional o reintentar.

### Relación con el admin

Decisión:

El booking cliente no debe mostrar lenguaje ni controles administrativos.

Evitar:

- Estados internos complejos.
- Edición avanzada.
- Grillas densas.
- Filtros administrativos.
- Acciones como cancelar/reprogramar desde este flujo inicial.

Compartir:

- Sistema visual.
- Tokens de color.
- Cards.
- Botónes.
- Badges simples.
- Estados de disponibilidad.

### Prioridad de diseño del booking

Orden de cierre:

1. Mobile booking completo.
2. Selección de servicio.
3. Selección de profesional con opcion cualquiera.
4. Selección de fecha/hora.
5. Resumen persistente.
6. Confirmación.
7. Estado de éxito.
8. Errores recuperables.
9. Adaptacion desktop.

Motivo:

El valor del flujo está en que el cliente pueda completar una reserva en mobile sin fricción. Desktop debe venir después como adaptacion, no como origen.

## Decisión 5: Dashboard admin

Estado: decidido para MVP.

El Dashboard admin será la entrada operativa del negocio después del login. Debe mostrar una lectura rápida del día y ayudar a tomar acción, no ser una pantalla decorativa ni un panel analítico avanzado.

### Objetivo de la vista

El dashboard debe responder rápidamente:

- Como viene el día.
- Cuantos turnos hay.
- Qué turnos son próximos.
- Si hay huecos o alertas.
- Como está rindiendo el negocio de forma básica.
- Qué acciones conviene tomar ahora.

### Rol dentro del producto

Decisión:

El dashboard debe ser operativo, no analítico profundo.

Motivo:

Para el MVP, el administrador necesita orientacion diaria y acceso rápido a acciones. Los reportes avanzados quedan para Admin Analytics post-MVP.

Regla:

No llenar el dashboard con gráficos complejos si no ayudan a operar el día.

### Estructura recomendada

Secciones MVP:

1. Header con saludo/contexto del día.
2. KPIs principales.
3. Próximos turnos.
4. Resumen de agenda del día.
5. Acciones rápidas.
6. Alertas operativas.
7. Mini resumen de clientes o servicios si aporta valor.

### KPIs principales

Decisión:

Usar pocos indicadores, muy claros.

KPIs recomendados:

- Turnos de hoy.
- Próximo turno.
- Ocupacion del día.
- Ingresos estimados del día.
- Clientes nuevos o recurrentes.

Regla:

Cada KPI debe tener un significado operativo. Evitar metricas vanidosas o dificiles de interpretar.

### Próximos turnos

Decisión:

La lista de próximos turnos debe ser una de las piezas principales del dashboard.

Debe mostrar:

- Hora.
- Cliente.
- Servicio.
- Profesional.
- Estado.
- Acción rápida.

Acciones posibles:

- Ver detalle.
- Confirmar.
- Reprogramar.
- Cancelar.

Regla:

La lista no debe competir con la agenda completa. Debe mostrar lo inmedíato y llevar a Agenda para operación detallada.

### Resumen de agenda del día

Decisión:

Incluir una lectura compacta de la agenda del día.

Opciones visuales:

- Timeline compacto.
- Bloques por profesional.
- Resumen por franjas horarias.

Regla:

El resumen debe ayudar a detectar carga y huecos, no reemplazar la vista Agenda.

### Acciones rápidas

Acciones MVP:

- Nuevo turno.
- Nuevo cliente.
- Ver agenda.
- Crear servicio.
- Agregar profesional.

Regla:

"Nuevo turno" debe ser la acción primaria. El resto debe tener menor peso visual.

### Alertas operativas

Casos a contemplar:

- Turnos pendientes de confirmación.
- Cancelaciones recientes.
- Día con alta ocupacion.
- Profesional sin turnos.
- Servicio sin disponibilidad.
- Configuración incompleta.

Regla:

Las alertas deben ser útiles y accionables. Evitar bloques alarmistas o exceso de rojo.

### Estados vacíos

El dashboard necesita estados vacíos para:

- Negocio sin turnos.
- Sin clientes.
- Sin servicios.
- Sin profesionales.
- Primer uso del producto.

Decisión:

El primer uso debe guiar configuración mínima sin sentirse como onboarding largo.

Acciones sugeridas:

- Crear servicio.
- Agregar profesional.
- Crear primer turno.

### Filtros temporales

Decisión:

El dashboard MVP debe enfocarse en "hoy", con opciones simples para cambiar periodo.

Periodos:

- Hoy.
- Semana.
- Mes.

Regla:

El periodo por defecto debe ser Hoy. Semana y Mes pueden ajustar KPIs, pero no transformar el dashboard en analytics avanzado.

### Visualidad

Reglas visuales:

- Usar layout asímetrico: area principal amplia + columna lateral de detalles o acciones.
- Usar cards blancas sobre superficies azuladas suaves.
- Evitar muchas tablas en la primera pantalla.
- Priorizar jerarquía clara y respiracion visual.
- Mantener el CTA principal con gradiente indigo.
- Usar acentos de estado con moderacion.

### Mobile admin

Decisión:

El dashboard mobile debe ser una version operativa compacta.

Prioridad mobile:

1. Próximo turno.
2. CTA nuevo turno.
3. KPIs principales.
4. Próximos turnos.
5. Alertas.

Regla:

No intentar replicar todo el dashboard desktop en mobile. El mobile debe ayudar a actuar rápido.

### Relación con Agenda

Decisión:

El dashboard debe llevar naturalmente a Agenda.

Regla:

Agenda es la fuente de operación detallada. Dashboard es la vista de orientacion y acción rápida.

Patrones:

- Click en turno abre detalle o lleva a agenda con turno selecciónado.
- Click en hueco o resumen puede llevar a agenda filtrada.
- CTA "Ver agenda" siempre disponible.

### Prioridad de diseño del dashboard

Orden de cierre:

1. Dashboard desktop con KPIs y próximos turnos.
2. Acciones rápidas.
3. Alertas operativas.
4. Estado vacio de primer uso.
5. Resumen compacto de agenda del día.
6. Dashboard mobile.
7. Variantes por periodo.

Motivo:

Primero debe quedar clara la lectura diaria y las acciones inmediatas. Después se ajustan estados y variantes.

## Decisión 6: Clientes + Perfil de cliente

Estado: decidido para MVP.

Clientes y perfil de cliente deben diseñar una experiencia de relación, no solo una tabla CRUD. El objetivo es que el negocio pueda reconocer, buscar y atender mejor a cada cliente.

### Objetivo de la vista Clientes

La vista de clientes debe permitir:

- Buscar clientes rápidamente.
- Ver información básica sin entrar al detalle.
- Identificar clientes frecuentes o recientes.
- Crear un cliente nuevo.
- Acceder al perfil completo.
- Iniciar un nuevo turno para un cliente.

### Rol dentro del producto

Decisión:

Clientes será una vista administrativa de relación y operación.

Motivo:

El cliente es parte del flujo de turnos, historial y fidelizacion. Si la vista se limita a una tabla fria, el producto pierde valor percibido.

### Lista de clientes desktop

Decisión:

Usar una lista/table hibrida, no una tabla densa tradicional.

Estructura recomendada:

- Header con título y acción "Nuevo cliente".
- Búsqueda prominente.
- Filtros compactos.
- Lista con filas amplias o cards horizontales.
- Acciones rápidas por cliente.

Datos visibles:

- Nombre.
- Teléfono.
- Email si existe.
- Ultimo turno.
- Próximo turno.
- Cantidad de visitas.
- Estado o etiqueta si aplica.

Acciones rápidas:

- Ver perfil.
- Crear turno.
- Editar.
- Contactar, si aplica.

Regla:

La vista debe ser escaneable. Evitar mostrar demasiados datos administrativos por fila.

### Lista de clientes mobile

Decisión:

Usar cards/lista vertical.

Cada item debe mostrar:

- Nombre.
- Teléfono o dato de contacto principal.
- Próximo turno o ultimo turno.
- Acción rápida.

Regla:

No intentar adaptar una tabla desktop a mobile. Mobile debe priorizar búsqueda y acción.

### Búsqueda y filtros

Búsqueda MVP:

- Nombre.
- Teléfono.
- Email.

Filtros MVP:

- Con próximo turno.
- Sin turnos próximos.
- Clientes recientes.
- Clientes frecuentes.

Post-MVP:

- Etiquetas.
- Segmentos.
- Fecha de ultima visita.
- Servicio favorito.

Regla:

La búsqueda debe ser más importante que los filtros. En un negocio chico/medíano, encontrar rápido a una persona suele ser la tarea principal.

### Crear / editar cliente

Decisión:

Crear cliente debe ser un flujo liviano.

Campos base:

- Nombre.
- Teléfono.
- Email opcional o requerido segun regla futura.
- Notas internas opcionales.

Regla:

El alta rápida de cliente debe poder ocurrir desde:

- Vista Clientes.
- Crear turno admin.
- Booking cliente, si corresponde.

No obligar a completar campos no esenciales para poder reservar.

### Perfil de cliente

Decisión:

El perfil de cliente es parte del MVP.

Motivo:

Hace que el producto se sienta completo y permite entender la relación con el cliente: próximos turnos, historial, notas y acciones.

### Estructura del perfil

Secciones recomendadas:

1. Header con identidad del cliente.
2. Próximo turno.
3. Acciones rápidas.
4. Datos de contacto.
5. Historial de turnos.
6. Notas internas.
7. Preferencias o etiquetas, si aplica.

Acciones principales:

- Nuevo turno.
- Editar datos.
- Contactar.
- Ver historial completo.

Regla:

"Nuevo turno" debe ser la acción primaria del perfil.

### Próximo turno

Decisión:

El próximo turno debe ser una pieza destacáda del perfil.

Debe mostrar:

- Fecha y hora.
- Servicio.
- Profesional.
- Estado.
- Acciones: ver, reprogramar o cancelar.

Regla:

Si no hay próximo turno, mostrar una invitación clara a crear uno.

### Historial de turnos

Decisión:

Mostrar historial como timeline/lista, no como tabla pesada.

Cada item debe mostrar:

- Fecha.
- Servicio.
- Profesional.
- Estado.
- Precio si aplica.

Estados:

- Completado.
- Cancelado.
- No asistió.
- Reprogramado, si aplica.

Regla:

El historial debe ayudar a entender relación y recurrencia, no convertirse en una pantalla contable.

### Notas internas

Decisión:

Incluir notas internas en el perfil.

Motivo:

En servicios personales, recordar preferencias o detalles del cliente mejora la experiencia y refuerza el valor del producto.

Regla:

Las notas deben verse como información interna del negocio, no como contenido público para el cliente.

### Empty states

Estados a diseñar:

- Sin clientes.
- Búsqueda sin resultados.
- Cliente sin turnos.
- Cliente sin próximo turno.
- Cliente sin historial.

Acciones sugeridas:

- Crear cliente.
- Limpiar búsqueda.
- Crear turno.

### Visualidad

Reglas visuales:

- Evitar tablas densas como primera impresion.
- Usar cards o filas amplias con buena jerarquía.
- Usar avatar/iniciales si no hay foto.
- Mantener datos secundarios en `on_surface_variant`.
- No abusar de badges.
- Priorizar nombre, próximo turno y acción principal.

### Relación con Booking cliente

Decisión:

El perfil admin y la experiencia cliente no son la misma vista.

El perfil admin puede tener:

- Notas internas.
- Historial operativo.
- Acciones administrativas.

La experiencia cliente futura debe tener:

- Mis turnos.
- Datos personales editables.
- Nueva reserva.
- Sin notas internas ni información administrativa.

### Prioridad de diseño de clientes

Orden de cierre:

1. Lista desktop de clientes.
2. Búsqueda.
3. Perfil de cliente desktop.
4. Crear cliente rápido.
5. Nuevo turno desde cliente.
6. Estados vacíos.
7. Lista mobile.
8. Perfil mobile.

Motivo:

La lista y el perfil cubren la gestión diaria. Crear cliente rápido conecta está vista con Agenda y crear turno.

## Decisión 7: Servicios

Estado: decidido para MVP.

Servicios define la oferta del negocio. Debe ser una vista clara, editable y facil de entender porque impacta directamente en booking, agenda, duración de turnos, precio e ingresos.

### Objetivo de la vista

La vista de servicios debe permitir:

- Ver la oferta actual del negocio.
- Crear un servicio.
- Editar precio, duración, descripción y estado.
- Activar o desactivar servicios.
- Entender rápidamente que servicios están disponibles para reserva.
- Detectar servicios incompletos o mal configurados.

### Rol dentro del producto

Decisión:

Servicios será una vista de configuración operativa, no una pantalla de catalogo público.

Motivo:

El administrador necesita mantener la oferta del negocio. La presentacion publica de servicios para clientes se define dentro del Booking Flow o Business Profile.

### Estructura desktop

Decisión:

Usar una lista de cards o filas amplias agrupables por categoría.

Estructura recomendada:

- Header con acción "Nuevo servicio".
- Búsqueda o filtro si hay muchos servicios.
- Agrupacion por categoría si aplica.
- Cards/filas con jerarquía clara.
- Acciones rápidas por servicio.

Datos visibles:

- Nombre.
- Categoría.
- Duración.
- Precio.
- Estado activo/inactivo.
- Breve descripción, si aporta.
- Indicador de popularidad o uso, post-MVP.

Acciones:

- Editar.
- Activar/desactivar.
- Duplicar, post-MVP.
- Ver reservas asociadas, post-MVP.

Regla:

Precio y duración deben estar siempre visibles. Son datos centrales para agenda y reserva.

### Mobile

Decisión:

Usar cards verticales simples.

Cada card debe mostrar:

- Nombre.
- Duración.
- Precio.
- Estado.
- Acción principal.

Regla:

Mobile debe priorizar edición rápida y lectura de la oferta, no gestión avanzada.

### Crear / editar servicio

Decisión:

Crear y editar servicio debe ser un flujo simple.

Campos MVP:

- Nombre.
- Descripción corta.
- Categoría.
- Duración.
- Precio.
- Estado activo/inactivo.

Campos post-MVP:

- Imagen.
- Servicios relaciónados.
- Recursos necesarios.
- Profesionales habilitados.
- Reglas especiales.
- Precio promocional.

Regla:

No pedir información avanzada en el MVP si no se usa en agenda o booking.

### Categorías

Decisión:

Soportar categorías visualmente desde el diseño, aunque sean simples.

Motivo:

Ayudan a ordenar la oferta cuando el negocio crece y hacen más claro el booking cliente.

Ejemplos:

- Corte.
- Barba.
- Color.
- Tratamiento.
- Combo.

Regla:

La categoría no debe ser más importante que el servicio. Debe ayudar a agrupar, no dominar la vista.

### Estado activo / inactivo

Decisión:

Los servicios deben poder verse como activos o inactivos.

Uso:

- Activo: disponible para agenda y booking.
- Inactivo: oculto o no disponible para nuevas reservas, pero preservado para historial.

Visualidad:

- Activo con badge sobrio.
- Inactivo con texto atenuado y superficie más neutra.

Regla:

No usar eliminacion como acción principal. Para servicios, desactivar es más seguro visual y conceptualmente.

### Precio y duración

Decisión:

Precio y duración son atributos de primer nivel.

Reglas:

- Deben estar visibles en listado.
- Deben estar visibles en booking.
- Deben estar visibles al crear/editar turno.
- La duración debe influir visualmente en agenda.

Nota:

Si en el futuro se define precio variable o duración variable por profesional, debe tratarse como una iteración separada.

### Empty states

Estados a diseñar:

- Sin servicios.
- Búsqueda sin resultados.
- Categoría vacia.
- Servicio inactivo.

Acciones sugeridas:

- Crear primer servicio.
- Limpiar búsqueda.
- Activar servicio.

### Relación con Booking

Decisión:

Los servicios del admin alimentan la selección de servicio del booking cliente, pero no se muestran igual.

Admin:

- Enfocado en configuración.
- Muestra estado, precio, duración y acciones.

Booking:

- Enfocado en elección.
- Muestra nombre, duración, precio y descripción clara.
- No muestra controles administrativos.

### Relación con Agenda

Decisión:

El servicio debe aportar duración y contexto visual al turno.

Regla:

En agenda y detalle de turno, el servicio debe verse como información primaria junto con cliente, profesional y hora.

### Visualidad

Reglas visuales:

- Evitar tabla densa como única vista.
- Usar cards o filas con buen espacio.
- Mantener precio y duración alineados para comparacion rápida.
- Usar badges de estado con bajo peso visual.
- No saturar con iconos por cada servicio.
- Mantener consistencia con cards de cliente y turno.

### Prioridad de diseño de servicios

Orden de cierre:

1. Lista desktop de servicios.
2. Crear/editar servicio.
3. Estado activo/inactivo.
4. Empty state sin servicios.
5. Adaptacion mobile.
6. Variante de servicio dentro del booking.
7. Variantes con categorías.

Motivo:

Primero debe quedar clara la gestión de la oferta. Luego se adapta la representacion para booking y mobile.

## Decisión 8: Profesionales

Estado: decidido para MVP.

Profesionales define quien presta los servicios y como se distribuye la carga de agenda. Debe ser una vista operativa, clara y conectada con disponibilidad, servicios y turnos.

### Objetivo de la vista

La vista de profesionales debe permitir:

- Ver el equipo activo.
- Crear un profesional.
- Editar datos básicos.
- Ver especialidad o servicios que realiza.
- Ver estado activo/inactivo.
- Entender carga de agenda.
- Acceder a disponibilidad resumida.

### Rol dentro del producto

Decisión:

Profesionales será una vista de gestión operativa del equipo.

Motivo:

La agenda depende directamente de profesionales. La vista debe ayudar a entender capacidad, disponibilidad y asignación de turnos, no solo datos personales.

### Estructura desktop

Decisión:

Usar cards o filas amplias con lectura de equipo.

Estructura recomendada:

- Header con acción "Nuevo profesional".
- Búsqueda/filtro liviano.
- Lista de profesionales activos.
- Separacion visual para inactivos si existen.
- Resumen de carga o disponibilidad.

Datos visibles:

- Nombre.
- Rol o especialidad.
- Servicios asociados.
- Estado activo/inactivo.
- Próximos turnos o carga del día.
- Disponibilidad resumida.

Acciones:

- Ver detalle.
- Editar.
- Ver agenda.
- Activar/desactivar.

Regla:

La vista debe ayudar a responder quien está disponible y quien está cargado, no solo quien existe.

### Mobile

Decisión:

Usar cards verticales orientadas a acción.

Cada card debe mostrar:

- Nombre.
- Rol/especialidad.
- Estado.
- Próximo turno o disponibilidad.
- Acción principal.

Regla:

Mobile debe priorizar acceso rápido a agenda o edición básica.

### Crear / editar profesional

Decisión:

Crear y editar profesional debe ser simple en MVP.

### Relación usuario / profesional

Decisión:

Usar un modelo flexible: una misma persona puede ser `Admin`, `Profesional` o ambas cosas.

Regla MVP:

Si el administrador también atiende turnos, debe poder figurar como profesional sin duplicar identidad. En diseño, esto debe expresarse de forma simple con una opción como `También atiende turnos` o `Este usuario atiende servicios`, según el contexto de la pantalla.

Implicancias:

- Puede tener servicios asociados.
- Puede tener agenda, disponibilidad y turnos.
- Puede administrar el negocio si también tiene rol admin.
- No implica crear portal profesional ni login propio en el MVP.
- No duplicar a la misma persona como admin por un lado y barbero por otro.

Campos MVP:

- Nombre.
- Teléfono, si aplica.
- Email, si aplica.
- Rol/especialidad.
- Servicios que realiza.
- Estado activo/inactivo.
- Opción para indicar si esa persona también atiende turnos, cuando aplique.

Campos post-MVP:

- Foto.
- Bio publica.
- Horarios detallados.
- Días no disponibles.
- Comisiones.
- Permisos detallados y acciones avanzadas por rol.

Regla:

No mezclar en el MVP configuración avanzada de disponibilidad con alta básica del profesional. La disponibilidad detallada puede tener un módulo propio.

### Servicios asociados

Decisión:

El profesional debe poder visualizarse conectado a servicios.

Motivo:

Esto impacta booking, agenda y asignación de turnos.

Visualidad:

- Mostrar servicios como chips/badges livianos.
- Si hay muchos, mostrar algunos y contador.

Regla:

Los chips de servicios deben ayudar a entender capacidad, no llenar la card de ruido visual.

### Disponibilidad resumida

Decisión:

Mostrar disponibilidad resumida desde el MVP, aunque el editor avanzado quede para después.

Ejemplos:

- Disponible hoy.
- Sin disponibilidad hoy.
- Próximo horario libre.
- 80% ocupado.
- Fuera de horario.

Regla:

La disponibilidad resumida debe ser fácil de entender y accionable. Si el usuario necesita detalle, debe ir a Agenda o al módulo de horarios.

### Estado activo / inactivo

Decisión:

Los profesionales deben tener estado activo/inactivo.

Uso:

- Activo: aparece en agenda y booking.
- Inactivo: se conserva por historial, pero no se ofrece para nuevas reservas.

Regla:

Desactivar debe ser la acción principal para retirar un profesional de la operación sin perder historial.

### Perfil o detalle de profesional

Decisión:

Para MVP, el detalle puede ser simple.

Debe incluir:

- Datos básicos.
- Servicios que realiza.
- Próximos turnos.
- Resumen de disponibilidad.
- Acciones: editar, ver agenda, activar/desactivar.

Post-MVP:

- Agenda diaria/semanal propia.
- Métricas de rendimiento.
- Horarios avanzados.
- Perfil público.

Regla:

No convertir el detalle de profesional en dashboard avanzado dentro del MVP.

### Relación con Agenda

Decisión:

Profesionales debe conectar directamente con Agenda.

Patrones:

- Acción "Ver agenda" desde cada profesional.
- Filtro de agenda por profesional.
- Columnas por profesional en vista día desktop.
- Indicadores de carga o disponibilidad coherentes entre ambas vistas.

Regla:

La información de profesional en Agenda y en Profesionales debe sentirse parte del mismo sistema.

### Vista dedicada de profesional

Decisión:

No incluir una vista dedicada de profesional en el MVP.

Motivo:

El MVP ya cubre dos experiencias principales: admin/negocio y booking cliente. Una experiencia propia para profesionales agrega un tercer rol con decisiones específicas: login del profesional, permisos, agenda personal, datos visibles de clientes, confirmación/cancelación de turnos, bloqueos de disponibilidad y notificaciones.

Cobertura MVP:

- El profesional se gestiona desde la vista administrativa `Profesionales`.
- La agenda de un profesional se consulta desde Agenda usando filtros o columnas por profesional.
- La acción `Ver agenda` desde Profesionales debe llevar a Agenda filtrada por ese profesional.

Post-MVP:

- Agenda diaria/semanal del profesional.
- Login propio para profesional.
- Permisos y acciones según rol.
- Vista mobile operativa para que cada profesional consulte su día.

Regla:

No bloquear el MVP por una vista profesional dedicada. Diseñarla cuando el producto necesite que cada profesional opere con cuenta propia.

### Relación con Booking

Decisión:

El booking cliente debe mostrar profesionales de forma simple y elegible, pero no administrativa.

Booking puede mostrar:

- Nombre.
- Foto/avatar.
- Especialidad.
- Próxima disponibilidad.
- Opción "cualquiera disponible".

No debe mostrar:

- Estado administrativo.
- Carga interna.
- Datos privados.
- Acciones de gestión.

### Empty states

Estados a diseñar:

- Sin profesionales.
- Búsqueda sin resultados.
- Profesional sin servicios asociados.
- Profesional sin disponibilidad.
- Profesional inactivo.

Acciones sugeridas:

- Agregar profesional.
- Limpiar búsqueda.
- Asociar servicios.
- Ver agenda.

### Visualidad

Reglas visuales:

- Usar avatar o iniciales.
- Dar prioridad a nombre, rol y disponibilidad.
- Mantener servicios asociados como chips sobrios.
- Evitar cards saturadas de metricas.
- Usar estado activo/inactivo con bajo peso visual.
- Mantener coherencia con Clientes y Servicios.

### Prioridad de diseño de profesionales

Orden de cierre:

1. Lista desktop de profesionales.
2. Crear/editar profesional.
3. Servicios asociados.
4. Estado activo/inactivo.
5. Disponibilidad resumida.
6. Conexion con Agenda.
7. Adaptacion mobile.
8. Detalle simple de profesional.

Motivo:

Primero debe quedar clara la gestión del equipo y su impacto en la agenda. El perfil profesional avanzado queda para post-MVP.

## Decisión 9: Configuración del negocio

Estado: decidido para MVP.

Configuración del negocio debe permitir ajustar la identidad y reglas básicas que afectan agenda, booking y comunicación. Debe ser clara y modular, sin convertirse en un panel técnico complejo.

### Objetivo de la vista

La configuración debe permitir:

- Definir datos básicos del negocio.
- Ajustar identidad visual mínima.
- Configurar ubicación y datos de contacto.
- Definir horarios básicos.
- Definir reglas simples de reserva.
- Revisar preferencias generales.

### Rol dentro del producto

Decisión:

Configuración será una vista modular de ajustes operativos.

Motivo:

Debe sostener el funcionamiento diario y la experiencia del cliente, pero sin absorber módulos complejos como analytics, permisos avanzados o disponibilidad detallada.

### Estructura

Decisión:

Usar secciones o tabs dentro de la vista.

Secciones MVP:

1. Datos del negocio.
2. Marca básica.
3. Ubicación y contacto.
4. Horarios básicos.
5. Reglas de reserva.
6. Notificaciones básicas.
7. Preferencias generales.

Regla:

La configuración debe sentirse ordenada. Evitar una única página larguisima con todos los campos mezclados.

### Datos del negocio

Campos MVP:

- Nombre del negocio.
- Rubro o categoría.
- Descripción corta.
- Teléfono principal.
- Email de contacto.

Regla:

Estos datos pueden alimentar login, booking, business profile y comunicaciones.

### Marca básica

Campos MVP:

- Logo o avatar del negocio.
- Nombre visible.
- Color principal, si se decide permitir personalizacion.

Decisión:

La personalizacion visual debe ser limitada en MVP.

Motivo:

El producto ya tiene una dirección visual fuerte. Permitir demásiada personalizacion puede romper coherencia.

Regla:

No permitir que la marca del negocio destruya legibilidad o contraste del sistema.

### Ubicación y contacto

Campos MVP:

- Dirección.
- Ciudad.
- Link o referencia de mapa, si aplica.
- Teléfono.
- WhatsApp, si aplica.
- Redes sociales, post-MVP o opcional.

Regla:

La ubicación debe ser facil de reutilizar en booking y perfil público.

### Horarios básicos

Decisión:

Incluir horarios básicos en Configuración, pero dejar el editor avanzado de disponibilidad como módulo separado/post-MVP.

MVP:

- Días de atencion configurables por día.
- Hora de apertura por día.
- Hora de cierre por día.
- Días cerrados por día.
- Excepciones y feriados simples para bloquear un día o definir horario especial.

Post-MVP:

- Horarios por profesional.
- Pausas.
- Vacáciones.
- Bloqueos manuales.

Regla:

No mezclar horarios generales del negocio con disponibilidad detallada de cada profesional en una misma pantalla si eso vuelve confuso el producto.

Decisión de MVP:

Los horarios del negocio no deben asumir lunes a viernes. La configuración debe soportar casos comunes de barberia, por ejemplo trabajar de martes a sabado y cerrar lunes/domingo.

Las excepciones y feriados entran en MVP como gestión simple y compacta, no como calendario avanzado. Deben permitir bloquear fechas puntuales o cargar horarios especiales sin convertir Configuración en una segunda agenda.

### Reglas de reserva

Campos MVP:

- Anticipacion mínima para reservar.
- Anticipacion maxima para reservar.
- Ventana de reserva recomendada para MVP: 7 días como máximo.
- Intervalo de agenda.
- Permitir elegir profesional o no.
- Permitir opcion "cualquiera disponible".
- Requiere confirmación manual o reserva directa.
- Política breve de cancelacion.

Regla:

Las reglas deben expresarse en lenguaje de negocio, no técnico.

Decisión de MVP:

La ventana de reserva inicial debe ser corta. Para el MVP se usa 7 días como máximo para evitar exponer demásiada disponibilidad futura y reducir cambios/reprogramaciones.

### Notificaciones básicas

Decisión:

Diseñar la sección, aunque la implementación real pueda venir después.

Opciones MVP visuales:

- Confirmación de reserva.
- Recordatorio de turno.
- Aviso de cancelacion.
- Canal preferido: email/WhatsApp/SMS, segun alcance futuro.

Regla:

Mostrar estás opciones como configuración conceptual sin sobrediseñar integraciones que todavía no están definidas.

### Preferencias generales

Campos posibles:

- Moneda.
- Zona horaria.
- Idioma.
- Formato de fecha/hora.

Decisión:

Mantener está sección chica en MVP.

Regla:

No convertir preferencias generales en una pantalla de configuración tecnica.

### Estados incompletos

Decisión:

La configuración debe poder indicar setup incompleto.

Casos:

- Sin servicios creados.
- Sin profesionales.
- Sin horarios.
- Sin datos de contacto.
- Sin reglas de reserva.

Regla:

Los avisos deben ser accionables y calmos. No bloquear toda la app salvo que el dato sea critico para operar.

### Visualidad

Reglas visuales:

- Usar secciones claras con superficies tonales.
- Evitar formularios interminables.
- Usar inputs amplios y legibles.
- Agrupar campos relaciónados.
- Mantener acciones primarias por sección.
- Evitar exceso de bordes y divisores.

### Relación con Booking

Decisión:

Configuración alimenta el booking cliente.

Datos que impactan booking:

- Nombre del negocio.
- Logo/avatar.
- Ubicación.
- Servicios activos.
- Profesionales activos.
- Horarios.
- Reglas de reserva.
- Política de cancelacion.

Regla:

Todo dato que el cliente vea en booking debe tener una fuente clara en configuración o en los módulos correspondientes.

### Relación con Agenda

Decisión:

Configuración debe afectar disponibilidad y reglas base de agenda, pero la operación diaria sucede en Agenda.

Regla:

No convertir Configuración en una segunda agenda.

### Creacion rápida desde agenda

Decisión:

Mantener `Nuevo turno` como acción global persistente en la sidebar por ahora. No moverlo al header de Agenda ni al topbar global en el MVP visual actual.

Motivo:

El header de Agenda ya concentra fecha, vista, filtros y controles operativos. Agregar el CTA primario ahí cargo visualmente la pantalla. El topbar global queda reservado para búsqueda, notificaciones, ayuda y perfil.

Idea futura:

Explorar una creacion rápida contextual desde la grilla de agenda: al pasar por un slot libre, mostrar una señal o acción inline para crear turno en ese horario. Está interacción puede ser más natural que mover el CTA global.

### Fuera de alcance del MVP

Queda para post-MVP:

- Multi-sucursal.
- Multi-negocio.
- Roles y permisos avanzados.
- Dominios personalizados.
- Integraciones de pago.
- Integraciones reales de mensajeria.
- Analytics avanzado.
- Editor avanzado de disponibilidad.

### Prioridad de diseño de configuración

Orden de cierre:

1. Estructura por secciones/tabs.
2. Datos del negocio.
3. Ubicación/contacto.
4. Horarios básicos.
5. Reglas de reserva.
6. Setup incompleto.
7. Notificaciones básicas.
8. Marca básica.
9. Preferencias generales.

Motivo:

Primero se deben cerrar los datos que alimentan agenda y booking. La personalizacion y preferencias pueden ajustarse después.

## Decisión 10: Sistema visual y componentes globales

Estado: decidido para MVP.

El sistema visual debe convertir la dirección Precision Concierge en reglas reútilizables para todas las pantallas. El objetivo es que el producto se sienta coherente, premium y operativo, sin depender de decisiones visuales aisladas en cada vista.

### Principio general

Decisión:

Usar un sistema visual sobrio, claro y funcional, con sensacion premium.

Reglas:

- Priorizar legibilidad y jerarquía.
- Usar superficies tonales antes que bordes fuertes.
- Reservar el color primario para acciones importantes y estados activos.
- Evitar decoración innecesaria.
- Mantener los componentes consistentes entre admin y booking, adaptando complejidad segun contexto.

### Paleta

Decisión:

Adoptar la paleta de Stitch como base visual del MVP.

Colores principales:

- Base/surface: `#f8f9ff`.
- Surface low: `#eff4ff`.
- Surface lowest/card: `#ffffff`.
- Surface high: `#dce9ff`.
- Primary: `#223999`.
- Primary container: `#3d52b2`.
- Text principal: `#0b1c30`.
- Text secundario: `#454652`.
- Tertiary/acento positivo: `#004e33` / `#4edea3`.
- Error: `#ba1a1a`.

Regla:

No usar negro puro para texto. Usar el color de texto principal del sistema.

### Tipografia

Decisión:

Usar Manrope para titulares y momentos editoriales, Inter para UI, labels, formularios y cuerpo.

Reglas:

- Titulares de página: Manrope.
- Card headers: Inter semibold o Manrope segun jerarquía.
- Body, labels, inputs y tablas/listas: Inter.
- Evitar escalar tipografía por viewport.
- Mantener letter spacing neutro.

### Superficies y separacion

Decisión:

Separar por cambios de superficie antes que por bordes.

Jerarquía:

1. Canvas: surface.
2. Paneles estructurales: surface low.
3. Cards/contenido: surface lowest.
4. Estados activos/hover: surface high.

Reglas:

- Evitar divisores de 1px como patron dominante.
- Si hace falta borde, usar "ghost border" de muy bajo contraste.
- No anidar cards dentro de cards.
- Usar espacio y tono para ordenar.

### Bordes, radios y sombras

Decisión:

Usar radios moderados y sombras muy sútiles.

Reglas:

- Cards comunes: radio 8px.
- Contenedores grandes: 16px o 24px si la vista lo justifica.
- Botónes principales: 12px.
- Sombras solo para elementos flotantes como drawers, modales o navs glass.
- Evitar sombras pesadas.

### Botónes

Tipos MVP:

- Primary.
- Secondary.
- Tertiary/text.
- Destructive.
- Icon button.

Reglas:

- Primary usa gradiente sútil de primary a primary container.
- Secondary usa superficie suave o fondo transparente con hover tonal.
- Destructive usa rojo solo para acción destructiva, no para toda la sección.
- Icon buttons deben usar iconos reconocibles y tooltip si el significado no es obvio.
- No usar botónes grandes de texto para acciones que se entienden mejor con icono, salvo que sean CTAs principales.

### Formularios

Componentes MVP:

- Input.
- Textarea.
- Select/combobox.
- Date picker.
- Time/slot picker.
- Checkbox/toggle.
- Segmented control.

Reglas:

- Inputs con superficie clara y foco visible.
- Labels siempre visibles.
- Errores cerca del campo.
- Ayudas breves cuando el campo pueda confundirse.
- No usar placeholders como único label.
- Agrupar campos relaciónados.

### Cards

Tipos de cards:

- Turno.
- Cliente.
- Servicio.
- Profesional.
- KPI.
- Alerta.
- Empty state.

Reglas:

- Cada card debe tener una jerarquía clara: título, metadatos, acción.
- Evitar meter demásiadas metricas dentro de una card.
- No usar cards como decoración.
- Cards repetidas deben ser comparables entre si.

### Badges y estados

Estados principales:

- Pendiente.
- Confirmado.
- Cancelado.
- Completado.
- No asistió.
- Activo.
- Inactivo.
- Disponible.
- Nuevo.
- Bloqueado.

Reglas:

- Los badges deben ser sobrios.
- Evitar colores saturados como fondo principal.
- No definir badges por pantalla de forma aislada; deben respetar una regla global para todo el MVP.
- No depender solo del color: el texto del badge debe comunicar el estado.
- Usar texto corto, una sola linea y padding compacto.
- Evitar mayusculas forzadas si hacen que el badge pese demasiado visualmente.
- Reservar rojo/error para problemás reales, cancelaciones, bloqueos o acciones destructivas.

Mapa visual recomendado:

| Estado | Tratamiento visual |
| --- | --- |
| Activo / Disponible / Confirmado | Verde claro del sistema: `bg-tertiary-fixed/20` con texto `text-on-tertiary-fixed-variant`. Referencia vigente: pill `Activo` de Servicios admin. |
| Pendiente | Superficie primary suave o neutra, por ejemplo `bg-primary-fixed/40 text-primary`; no verde. |
| Nuevo | Neutro o primary suave, por ejemplo `bg-primary-fixed/40 text-primary` si se quiere destacár, o `bg-surface-container-high text-on-surface-variant` si debe ser secundario. |
| Inactivo | Neutro apagado, por ejemplo `bg-surface-container-high text-on-surface-variant`; no rojo salvo que implique bloqueo o error. |
| Cancelado / Error / Bloqueado | Error semántico: `bg-error-container/50 text-error`, usado con moderacion. |
| Completado | Neutro positivo o verde muy suave si necesita destacárse, evitando competir con Confirmado. |
| No asistió | Neutro con texto atenuado o error suave si afecta la operación. |
| Servicios / categorías / especialidades | Chips informativos, no semánticos: `bg-surface-container-high text-on-surface-variant` o `bg-primary-fixed/40 text-primary`. |

Decisión:

Unificar pills/badges entre Agenda, Dashboard, Clientes, Perfil de cliente, Servicios y Profesionales antes de hacer ajustes aislados. `Activo`, `Disponible` y `Confirmado` deben sentirse parte de la misma familia visual. `Inactivo` no debe verse como error. `Nuevo` y `Pendiente` no deben usar verde.

Nota para Clientes admin:

`Nuevo` no debe usarse como pill de estado de fila en el MVP. Un cliente puede ser nuevo y activo al mismo tiempo, por lo que el estado principal debe ser `Activo` o `Inactivo`. La condicion de cliente nuevo se expresa como segmento/filtro/metrica (`Nuevos`, `Nuevos este mes`) y como metadatos (`Primera visita` o `Sin historial`).

### Tablas y listas

Decisión:

Evitar tablas densas como patron principal del MVP.

Uso recomendado:

- Filas amplias o card-list para clientes, servicios y profesionales.
- Tablas solo si hay comparacion densa real.

Reglas:

- En mobile, usar listas/cards verticales.
- Acciones por fila deben ser claras pero no dominar.
- La búsqueda debe tener prioridad en listas operativas.

### Drawers, bottom sheets y díalogs

Decisión:

Usar:

- Drawer lateral para detalles/edición contextual en desktop.
- Bottom sheet para acciones contextuales mobile.
- Díalog solo para confirmaciones puntuales.

Reglas:

- No usar díalog centrado como patron principal de edición compleja.
- Confirmaciones destructivas deben ser claras y cortas.
- El usuario debe poder volver al contexto original.

### Empty states

Decisión:

Todos los módulos MVP deben tener empty states accionables.

Reglas:

- Explicar brevemente que falta.
- Ofrecer una acción clara.
- Mantener tono calmo.
- No usar ilustraciones grandes si compiten con la operación.

### Loading states

Decisión:

Diseñar loading states por tipo de contenido.

Patrones:

- Skeleton para listas/cards.
- Spinner solo para acciones puntuales.
- Estado de botón loading para submits.

Regla:

Evitar pantallas completamente vacias mientras carga una vista operativa.

### Error states

Decisión:

Los errores deben ser recuperables y especificos.

Reglas:

- Error de campo junto al campo.
- Error de acción cerca del CTA o en toast.
- Error de carga con acción reintentar.
- Evitar lenguaje técnico.
- No usar rojo dominante salvo error critico.

### Toasts y feedback

Decisión:

Usar toasts para feedback breve de acciones completadas.

Casos:

- Turno creado.
- Turno editado.
- Turno cancelado.
- Cliente creado.
- Servicio actualizado.
- Profesional actualizado.

Regla:

El toast no debe ser el único lugar donde se comunica un error importante.

### Iconografia

Decisión:

Usar iconos funcionales, no decorativos.

Reglas:

- Preferir iconos reconocibles para navegación y acciones.
- No saturar cards con iconos.
- Iconos solos requieren tooltip o contexto claro.
- Mantener grosor y estilo consistente.

### Responsive

Decisión:

El sistema debe definir patrones mobile propios, no solo comprimir desktop.

Reglas:

- Admin desktop: sidebar + topbar.
- Admin mobile: bottom nav + acciones contextuales.
- Booking: mobile-first.
- Tablas desktop pasan a cards/listas mobile.
- Drawers desktop pasan a bottom sheets o pantallas completas mobile.

### Accesibilidad visual

Reglas:

- Mantener buen contraste.
- No depender solo del color para estados.
- Targets tactiles comodos en mobile.
- Foco visible en inputs y botónes.
- Textos no deben quedar truncados en acciones críticas.

### Prioridad de componentes

Orden de cierre:

1. Tokens visuales: color, tipografía, radios y superficies.
2. Botónes.
3. Inputs/selects/date-time controls.
4. Cards de turno.
5. Badges de estado.
6. Lists/cards para clientes, servicios y profesionales.
7. Drawer desktop.
8. Bottom sheet mobile.
9. Empty/loading/error states.
10. Toasts y confirm díalogs.

Motivo:

Estos componentes sostienen todas las pantallas MVP. Definirlos antes de implementar reduce inconsistencias visuales.

## Decisión 11: Login y acceso

Estado: decidido para MVP.

El login debe ser simple, seguro y coherente con una experiencia SaaS profesional. No se construira un sistema de autenticación propio desde cero para el MVP.

### Decisión principal

Decisión:

Usar Google como metodo principal de acceso para admin/profesional y apoyarse en un proveedor externo de autenticación.

Motivo:

Implementar email/password propio implica riesgos de seguridad y mantenimiento: hashing, reset de contraseña, sesiones, expiración, protección contra fuerza bruta, tokens, verificación de email y recuperación de acceso. Para el MVP no conviene asumir esa complejidad de forma casera.

Regla:

No diseñar ni implementar autenticación propia desde cero.

### Metodos de acceso MVP

Admin / negocio:

- Continuar con Google como acción principal.
- Email/password solo si lo gestiona un proveedor externo de auth.

Profesional:

- Puede usar el mismo acceso que admin si tiene permisos.
- Invitaciones y permisos detallados quedan para una iteración posterior.

Cliente:

- Booking sin login obligatorio.
- Pedir solo datos necesarios para reservar.
- Cuenta cliente o "Mis turnos" queda para post-MVP.

### Proveedor externo

Decisión:

La implementación futura debe usar un proveedor o librería confiable.

Opciones posibles:

- Auth0.
- Clerk.
- Supabase Auth.
- Firebase Auth.
- Cognito.
- Auth.js/NextAuth con proveedores externos.

Nota:

La elección tecnica final queda para la etapa de implementación. Está decisión define la dirección de producto y seguridad: no auth casera.

### Pantalla de login

Estructura recomendada:

1. Identidad del producto o negocio.
2. Mensaje breve de acceso.
3. CTA principal: Continuar con Google.
4. Opcion secundaria de email/password solo si existe proveedor externo.
5. Recuperar acceso solo si existe email/password.
6. Estado de loading.
7. Estado de error.

Regla:

El login no debe convertirse en landing page. Debe ser una entrada limpia, premium y directa.

### Visualidad

Reglas visuales:

- Mantener estilo Precision Concierge.
- Usar una composicion limpia y editorial.
- Evitar exceso de texto comercial.
- El CTA principal debe tener jerarquía clara.
- Google debe verse como acción segura y reconocible.
- No usar muchas opciones sociales que ensucien la pantalla.

### Estados

Estados a diseñar:

- Normal.
- Loading.
- Error de acceso.
- Usuario sin permisos.
- Sesión expirada.
- Cuenta/invitación pendiente, post-MVP.

Regla:

Los errores deben explicar qué hacer sin exponer información sensible.

### Registro

Decisión:

No incluir registro público abierto en MVP.

Motivo:

El producto todavía está enfocado en definir experiencia y operación. Un registro self-service implica onboarding, billing, multi-negocio y permisos más complejos.

Alternativa MVP:

- Acceso por usuarios previamente habilitados o invitados.

### Cliente sin login

Decisión:

El cliente no necesita cuenta para reservar en el MVP.

Motivo:

Obligar login en booking aumenta fricción y puede reducir conversion.

El booking debe pedir:

- Nombre.
- Teléfono.
- Email si hace falta confirmación o recordatorio.

Post-MVP:

- Mis turnos.
- Link magico.
- OTP.
- Cuenta cliente.

Regla:

Si se agrega acceso cliente más adelante, preferir link magico u OTP antes que contraseña tradicional.

### Prioridad de diseño del login

Orden de cierre:

1. Login desktop.
2. Login mobile.
3. Estado loading.
4. Estado error.
5. Usuario sin permisos.
6. Sesión expirada.
7. Recuperar acceso, solo si hay email/password gestionado por proveedor.

Motivo:

El login debe ser confiable y directo. La complejidad de cuentas y permisos puede evolucionar después.
