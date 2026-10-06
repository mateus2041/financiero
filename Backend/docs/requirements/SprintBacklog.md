# Backlog del producto

**Producto:** Billetera Financiera
**Revisión:** 6 de octubre de 2026
**Fuente del estado:** inventario estático de endpoints, modelos, pantallas y pruebas. El estado debe confirmarse con el equipo y pruebas de aceptación.

## Convención de estado

- **Código presente:** hay rutas/modelos o pantallas asociados; integración y aceptación pendientes.
- **Parcial / validar:** parte del flujo está identificada; faltan comprobar reglas, permisos, integración o resultado.
- **Pendiente:** no se encontró evidencia suficiente para afirmar que la funcionalidad esté implementada.

## Prioridad inmediata

| ID | Trabajo | Criterio de salida | Prioridad | Estado |
| --- | --- | --- | --- | --- |
| BL-01 | Hacer reproducible instalación y configuración local | Guía probada, `.env.example` sin secretos y dependencias coherentes | Alta | Pendiente |
| BL-02 | Verificar autorización por rol y titularidad | Casos positivos/negativos para usuario, asesor y administrador | Crítica | Parcial / validar |
| BL-03 | Asegurar consistencia de transferencias | Pruebas de saldo insuficiente, rollback, error de destino y repetición | Crítica | Parcial / validar |
| BL-04 | Revisar datos de tarjetas | Confirmar almacenamiento, respuestas y logs; eliminar exposición de CVV/datos sensibles | Crítica | Parcial / validar |
| BL-05 | Alinear rutas e interfaz | Todas las rutas de la aplicación cargan y completan el flujo esperado | Alta | Parcial / validar |
| BL-06 | Crear migraciones y procedimiento de respaldo | Migración desde base limpia y existente; backup restaurado en prueba | Alta | Pendiente |
| BL-07 | Medir cobertura y automatizar pruebas | Reporte de cobertura reproducible y suite acordada en CI/local | Media | Pendiente |

## Capacidades de producto a aceptar

| ID | Trabajo | Evidencia actual | Criterio para cerrar | Estado |
| --- | --- | --- | --- | --- |
| BL-08 | Registro, autenticación y cierre/expiración de sesión | Rutas de registro/login y utilidades de seguridad | Flujo UI/API, validación y expiración comprobados | Parcial / validar |
| BL-09 | Recuperación de contraseña | Solicitud, verificación y restablecimiento en API | Código de un solo uso, expiración, correo y respuestas seguras probados | Parcial / validar |
| BL-10 | Perfil de usuario | Rutas de consulta/actualización y pantallas relacionadas | El usuario solo ve/edita sus datos permitidos | Parcial / validar |
| BL-11 | Cuentas y saldos | Modelo y rutas de consulta, creación y administración | Permisos, límites y consistencia de saldo probados | Parcial / validar |
| BL-12 | Tarjetas | Rutas de consulta, gestión, activación y bloqueo | Reglas de titularidad y protección de datos aceptadas | Parcial / validar |
| BL-13 | Historial de movimientos | Modelo y endpoint de transacciones | Filtros, orden, paginación y aislamiento por cuenta definidos | Parcial / validar |
| BL-14 | Transferencias entre cuentas | Rutas de transferencia en `Backend/main.py` | Operación atómica y comprobante visibles desde interfaz | Parcial / validar |
| BL-15 | BRE-B | Rutas de llaves y transferencia en router/API | Contrato, fallos, límites y entorno de integración documentados | Parcial / validar |
| BL-16 | Gestión administrativa de asesores/cuentas | Rutas administrativas y de asesoría | Permisos mínimos, auditoría y pruebas negativas | Parcial / validar |
| BL-17 | Notificaciones | Rutas de consulta/lectura/eliminación | Aislamiento por usuario y estados probados en interfaz | Parcial / validar |
| BL-18 | Asistente IA | Endpoint `/chat` y dependencias IA | Configuración, timeout, límite de uso, errores y privacidad documentados | Parcial / validar |

## Alcance por decidir

| ID | Capacidad | Decisión necesaria | Estado |
| --- | --- | --- | --- |
| BL-19 | Certificados y exportación de movimientos | Precisar formatos y si la pantalla ya está conectada a datos reales | Pendiente |
| BL-20 | Pagos QR y retiro sin tarjeta | Confirmar alcance funcional, dependencias y reglas de seguridad | Pendiente |
| BL-21 | Presupuestos, categorías y analítica | Confirmar si pertenecen al producto; no se encontró API dedicada suficiente | Pendiente |
| BL-22 | Notificaciones en tiempo real y preferencias | Definir canales, configuración y mecanismo de entrega | Pendiente |

## Regla de cierre

No marcar una tarea como completada solo porque exista un endpoint, componente o modelo. Vincularla a criterios de aceptación y evidencia de prueba; registrar defectos y decisiones de alcance junto a la tarea.
