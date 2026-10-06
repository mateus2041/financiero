# Requisitos funcionales

**Producto:** Billetera Financiera
**Última revisión:** 6 de octubre de 2026

## Alcance y lectura

Este documento describe capacidades del producto a partir de los modelos, endpoints y pantallas encontrados. **Código presente** no significa flujo aceptado: la integración frontend/API, permisos, casos de error y comportamiento en ejecución deben probarse. Los requisitos futuros se indican como **Por confirmar**.

## Actores

| Actor | Responsabilidad |
| --- | --- |
| Visitante | Registrarse, iniciar sesión o solicitar recuperación de acceso. |
| Usuario | Consultar y administrar su perfil, cuentas, tarjetas, movimientos, llaves y notificaciones. |
| Asesor bancario | Consultar usuarios/cuentas y realizar las operaciones autorizadas para su rol. |
| Administrador | Administrar asesores y ejecutar acciones administrativas sobre cuentas. |

## Requisitos

### Acceso y perfil

| ID | Requisito | Estado observado |
| --- | --- | --- |
| RF-ACC-01 | El visitante puede crear una cuenta con los datos requeridos por el formulario/API. | Código presente (`/register`); validar reglas y duplicados. |
| RF-ACC-02 | El usuario puede iniciar sesión y obtener acceso autenticado. | Código presente (`/login`, login de administrador y asesor). |
| RF-ACC-03 | El usuario puede solicitar recuperación, verificar un código y restablecer la contraseña. | Rutas presentes; validar expiración, envío y uso único. |
| RF-ACC-04 | El usuario autenticado puede consultar y actualizar su perfil. | Rutas presentes; verificar autorización por propietario. |
| RF-ACC-05 | Las rutas privadas deben rechazar credenciales inválidas o vencidas. | Hay validación de token; inventario de cobertura pendiente. |

### Usuarios, cuentas y tarjetas

| ID | Requisito | Estado observado |
| --- | --- | --- |
| RF-CUE-01 | El usuario puede consultar sus cuentas y sus saldos. | Rutas de listado y saldo presentes. |
| RF-CUE-02 | Se pueden crear cuentas con tipo y datos iniciales válidos. | Ruta de creación presente; confirmar reglas de negocio. |
| RF-CUE-03 | Las operaciones autorizadas pueden cambiar tipo, operación, estado, saldo o datos parciales de una cuenta. | Rutas de asesoría/administración presentes; falta validar matriz de permisos. |
| RF-TAR-01 | El usuario puede consultar y administrar tarjetas asociadas a sus cuentas. | Rutas de registro, consulta, edición, activación, bloqueo y desbloqueo presentes. |
| RF-TAR-02 | Solo el titular o un rol autorizado puede operar una tarjeta. | Requisito; pruebas de autorización pendientes. |

### Movimientos y transferencias

| ID | Requisito | Estado observado |
| --- | --- | --- |
| RF-MOV-01 | El usuario puede consultar movimientos asociados a sus cuentas. | Ruta `/transacciones` presente; verificar filtros, paginación y permisos. |
| RF-MOV-02 | El sistema registra ingresos, gastos y transferencias con monto, tipo, fecha y descripción cuando corresponda. | Modelo `Transaccion` presente; verificar reglas y actualización de saldo. |
| RF-TRF-01 | Un usuario puede iniciar una transferencia entre cuentas desde la aplicación. | Rutas presentes; verificar titularidad, fondos, atomicidad y comprobante. |
| RF-TRF-02 | El sistema permite reportar una transferencia/transacción fallida. | Ruta de reporte presente; validar el ciclo de seguimiento. |
| RF-BREB-01 | El usuario puede registrar/consultar una llave BRE-B y solicitar una transferencia por llave. | Rutas presentes; no implica conexión o liquidación en una red bancaria real. |

### Administración, notificaciones y asistencia

| ID | Requisito | Estado observado |
| --- | --- | --- |
| RF-ADM-01 | El administrador puede iniciar sesión y administrar asesores. | Rutas presentes en `Backend/main.py`; validar rol y auditoría. |
| RF-ASE-01 | El asesor puede consultar usuarios/cuentas y realizar cambios permitidos. | Rutas presentes en `Backend/routers/asesor_bancario.py` y `Backend/main.py`. |
| RF-NOT-01 | El usuario puede consultar, marcar como leídas y eliminar sus notificaciones. | Rutas presentes; probar aislamiento por usuario. |
| RF-IA-01 | El cliente puede enviar una conversación al endpoint del asistente. | Endpoint `/chat` presente; disponibilidad depende de configuración externa. |

## Fuera de alcance confirmado o por confirmar

No se encontraron módulos dedicados que permitan afirmar gestión completa de presupuestos/categorías, exportación de reportes financieros PDF/Excel, analítica predictiva, recordatorios configurables o actualización financiera en tiempo real. Certificados, QR y retiro sin tarjeta aparecen como páginas/nombres en el frontend o en documentación anterior, pero su funcionamiento e integración deben confirmarse antes de incluirlos como requisitos entregados.

## Criterio de aceptación transversal

Cada operación debe validar datos en el servidor, autenticar y autorizar al actor, limitar el acceso a recursos del titular, devolver errores comprensibles y preservar la consistencia de la base de datos. Para marcar un requisito como aceptado, añadir una prueba automatizada o un caso de prueba manual reproducible y registrar su resultado.
