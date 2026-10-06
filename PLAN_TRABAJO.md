# Plan de trabajo — Billetera Financiera

**Estado del documento:** actualizado el 6 de octubre de 2026
**Producto:** aplicación web de billetera financiera
**Estado de avance:** inventario estático del repositorio; no equivale a aceptación funcional ni a despliegue productivo.

## Propósito

Este plan registra el alcance que se observa en el código y organiza el trabajo pendiente. Los elementos marcados como **Código presente** tienen una implementación identificable, pero requieren pruebas manuales/integrales antes de considerarse terminados. **Pendiente de validar** significa que la documentación o la interfaz sugiere la capacidad, pero la integración no se ha comprobado. No se asignan fechas de entrega ni responsables sin confirmación del equipo.

## Estado técnico observado

| Área | Evidencia en el repositorio | Observación |
| --- | --- | --- |
| Frontend | React y JavaScript; Create React App (`react-scripts`); React Router; Axios | No es una aplicación TypeScript/Vite. Los scripts disponibles están en `Frontend/package.json`. |
| API | FastAPI, SQLAlchemy y Uvicorn | Punto de entrada: `Backend/main.py`; también existen routers para BRE-B, asesoría y chat IA. |
| Persistencia | MySQL 8.4 en Docker Compose, acceso mediante SQLAlchemy/PyMySQL | No es PostgreSQL. El arranque crea tablas y aplica algunos cambios de esquema; no se encontró configuración de Alembic. |
| Ejecución local | Docker Compose para base de datos, backend y frontend | Puertos declarados: 3307, 8000 y 3000. Revisar credenciales de desarrollo antes de exponer servicios. |
| Pruebas | Seis archivos de pruebas backend bajo `Backend/tests/` | No hay evidencia de cobertura medida ni de una suite frontend configurada/ejecutada. |
| Integraciones | Servicio de correo y módulo de chat IA | Requieren configuración externa; confirmar variables y secretos en entorno local/despliegue. |

## Funcionalidades con código identificable

| Módulo | Evidencia principal | Estado documental |
| --- | --- | --- |
| Registro, login y recuperación | Rutas de registro/login, recuperación y restablecimiento en `Backend/main.py`; `Backend/security.py` | Código presente; verificar flujo completo, expiración y manejo de errores. |
| Usuarios y perfiles | Rutas de perfil/usuarios y modelos en `Backend/main.py` y `Backend/models.py` | Código presente; verificar autorización por rol y propiedad de los datos. |
| Cuentas | Creación/listado de cuentas, saldo, tipo, estado y gestión administrativa en `Backend/main.py` | Código presente; revisar consistencia de saldos y autorizaciones. |
| Tarjetas | Registro, consulta, activación, edición, bloqueo y desbloqueo en `Backend/main.py` | Código presente; revisar tratamiento de datos sensibles y pruebas. |
| Transacciones y transferencias | Historial, transferencias entre cuentas y reporte de transacción fallida | Código presente; verificar atomicidad, límites y casos de error. |
| Llaves y transferencias BRE-B | `Backend/routers/breb.py` y rutas BRE-B en `Backend/main.py` | Código presente; validar integración y reglas reales antes de anunciar operación bancaria. |
| Administración y asesoría | Gestión de asesores, consulta de usuarios y cambios autorizados de cuentas | Código presente; completar matriz de roles/permisos y pruebas negativas. |
| Notificaciones | Consulta, lectura y eliminación de notificaciones en `Backend/main.py` | Código presente; no se ha confirmado entrega en tiempo real ni preferencias. |
| Asistente IA | Endpoint `/chat` en `Backend/ai/router.py` | Código presente; validar configuración, límites, privacidad y fallbacks. |
| Interfaz | Páginas en `Frontend/src/pages/` y rutas en `Frontend/src/routes/AppRoutes.jsx` | Inventario e integración por ruta requieren revisión: algunas rutas importan módulos desde ubicaciones distintas. |

## Plan priorizado

### P0 — Hacer reproducible el entorno

- [ ] Documentar requisitos locales (Python, Node.js, pnpm/npm y Docker) según versiones que el equipo soporte.
- [ ] Revisar y documentar variables de entorno efectivamente usadas; crear `.env.example` sin secretos.
- [ ] Alinear los comandos de instalación con `pnpm-lock.yaml`, los manifiestos y `compose.yml`.
- [ ] Sustituir o parametrizar credenciales de ejemplo de Docker Compose; no reutilizarlas fuera de desarrollo.
- [ ] Confirmar el formato de `DATABASE_URL` y los valores predeterminados de conexión.
- [ ] Definir una estrategia de migraciones repetible; el arranque actual modifica el esquema directamente.

### P1 — Asegurar flujos críticos

- [ ] Ejecutar y corregir las pruebas existentes de registro, login, cuentas, administradores y notificaciones.
- [ ] Añadir pruebas de autorización: usuario, asesor y administrador; propietario frente a cuenta ajena.
- [ ] Verificar recuperación de contraseña, expiración de códigos/tokens y respuestas que no filtren si una cuenta existe.
- [ ] Verificar saldos y transferencias con transacciones de base de datos y rollback ante fallos.
- [ ] Revisar CORS, autenticación/autorización de todas las rutas y exposición de información de tarjetas.
- [ ] Confirmar que los datos de tarjeta/CVV no se almacenen ni registren de forma insegura.

### P2 — Cerrar la experiencia de usuario

- [ ] Contrastar todas las páginas con `AppRoutes.jsx`; corregir rutas/importaciones rotas y documentar las rutas accesibles.
- [ ] Probar flujos completos desde la interfaz, incluidos estados de error, carga y sesión expirada.
- [ ] Confirmar qué operaciones aparecen en historial y cómo se actualizan los saldos.
- [ ] Validar accesibilidad básica y comportamiento en escritorio y móvil.
- [ ] Decidir alcance real de reportes, certificado, QR, retiro sin tarjeta y preferencias; no anunciar capacidades no integradas.

### P3 — Operación y entrega

- [ ] Añadir comprobaciones de salud y guía de respaldo/restauración MySQL.
- [ ] Definir configuración segura para producción: secretos, HTTPS, CORS por origen y acceso a base de datos.
- [ ] Incorporar automatización de pruebas y build si el equipo la requiere.
- [ ] Registrar versiones de runtime y dependencias soportadas; resolver rangos/versiones contradictorios entre manifiestos.
- [ ] Ejecutar revisión final de seguridad, pruebas y documentación antes de una entrega.

## No se debe considerar terminado todavía

La presencia de páginas, rutas o modelos no demuestra que el flujo esté integrado ni que cumpla criterios de aceptación. En particular, este inventario no certifica transferencias bancarias reales, operación BRE-B contra una red financiera, despliegue productivo, cumplimiento normativo, cobertura mínima de pruebas ni rendimiento.

## Documentos relacionados

- [Requisitos funcionales](Backend/docs/requirements/functional.md)
- [Requisitos no funcionales](Backend/docs/requirements/non-functional.md)
- [Restricciones](Backend/docs/requirements/constraints.md)
- [Historias de usuario](Backend/docs/requirements/user-stories.md)
- [Backlog](Backend/docs/requirements/SprintBacklog.md)
- [Plan de sprints](Backend/docs/requirements/sprints.md)
