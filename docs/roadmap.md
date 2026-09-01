# Roadmap de producto — Turnero Frontend

## Propósito

Este documento describe los hitos estables del frontend MVP y su evolución posterior. No registra el avance diario, dependencias técnicas ni el orden de los próximos PRs: esa información vive únicamente en `tracking-implementacion-mvp.md`.

## Cómo usarlo

- Consultar el tracking antes de iniciar trabajo para conocer la prioridad vigente y los bloqueos backend.
- Consultar el handoff para implementar patrones visuales.
- Consultar las decisiones de diseño y Stitch para alcance y referencias de cada pantalla.

## Hitos del MVP

### Base de experiencia

Sistema visual compartido, componentes reutilizables, shells diferenciados para administración y booking, y resiliencia mínima de la aplicación.

### Operación administrativa

Agenda, creación y gestión de turnos, clientes, servicios, profesionales y configuración del negocio como experiencia operativa consistente en desktop y mobile.

### Reserva pública

Flujo de booking mobile-first sin login obligatorio y confirmación posterior a la reserva, separado de la navegación administrativa.

### Conexión con el producto real

Integración progresiva de las pantallas con contratos backend confirmados, sin duplicar reglas de negocio que correspondan a la API.

### Acceso y navegación protegida

Autenticación administrativa, sesión y protección de rutas cuando el backend entregue el flujo de auth definitivo.

## Evolución posterior al MVP

- Portal de clientes y profesionales.
- Vista mensual y analítica avanzada.
- Multi-negocio y multi-sucursal.
- Excepciones de disponibilidad y configuración avanzada.

## Límites del roadmap

Este roadmap no sustituye decisiones de UX, especificaciones visuales ni contratos de API. Para saber qué implementar ahora, consultar `tracking-implementacion-mvp.md`.
