# Semana 06 — Flujos funcionales e integraciones

**Estado:** recorridos deducidos de rutas, módulos y pantallas presentes; pruebas de extremo a extremo pendientes.

> No se encontraron las instrucciones de la semana 06. Los flujos siguientes describen puntos de entrada observables, no aseguran que cada recorrido esté conectado de principio a fin.

## Flujos principales identificados

### Acceso y perfil

1. El cliente envía registro o credenciales a rutas de autenticación.
2. La API valida el payload y genera una respuesta de autenticación según sus esquemas.
3. La interfaz utiliza las credenciales de sesión para solicitar recursos privados.
4. Deben probarse credenciales inválidas, token vencido, recuperación y autorización por rol.

Rutas de referencia en el código: `/register`, `/login`, `/perfil` y rutas de recuperación en `Backend/main.py`.

### Consulta y gestión de cuenta

La API contiene rutas para cuentas propias, consultas administrativas y cambios por asesor/administrador. La aplicación debe aplicar autorización del lado servidor y verificar que una cuenta pertenezca al usuario esperado antes de responder o modificarla.

### Transferencia entre cuentas

La ruta `/transferencias/entre-cuentas` indica una operación interna. La aceptación exige comprobar cuenta origen/destino, saldo, permisos, commit/rollback, reintentos e historial. La mera existencia de la ruta no confirma esas propiedades.

### BRE-B

El backend expone rutas para consultar llaves y solicitar transferencias BRE-B, tanto en `main.py` como en un router especializado. No se encontró evidencia que permita afirmar que exista conexión a una red de pagos real, certificación o liquidación externa. Precisar si el comportamiento actual es interno, simulado o integrado antes de presentarlo como servicio operativo.

### Asistente conversacional

Los documentos y módulos `Backend/ai/` describen el endpoint `/ia/chat`, autenticación, historial local y uso de proveedor LLM externo. La disponibilidad depende de configuración externa. Confirmar límites, timeout, manejo de datos personales, roles admitidos y respuesta ante indisponibilidad.

### Correo

Hay un módulo de correo y pruebas de flujo asociadas a registro y login. Su operación depende de credenciales de entorno; el envío efectivo no se valida únicamente por encontrar las pruebas o el módulo.

## Contratos de integración pendientes

| Integración | Datos a acordar/verificar |
|---|---|
| Frontend ↔ API | URL por entorno, prefijos, contratos de petición/respuesta, expiración de sesión y errores. |
| API ↔ MySQL | Transacciones, timeouts, disponibilidad, migraciones y política de reintentos. |
| API ↔ correo | Proveedor, credenciales fuera del repositorio, errores, límites y privacidad. |
| API ↔ proveedor IA | Modelo habilitado, clave externa, límites, datos enviados, timeout y fallbacks. |
| BRE-B ↔ red/proveedor | Especificación, ambiente, autenticación, idempotencia, liquidación y certificaciones. |

## Casos negativos mínimos

- Actor sin rol o titularidad intenta leer/modificar recursos ajenos.
- Saldo insuficiente, cuenta inactiva, destino inexistente o error durante transferencia.
- Proveedor de correo o IA no configurado, responde con error o agota el tiempo.
- Solicitud duplicada y reintento tras una respuesta de red incierta.
- Frontend recibe `401`, `403`, error de validación o servicio no disponible.

**Referencias:** [API](../Backend/main.py), [router BRE-B](../Backend/routers/breb.py), [router IA](../Backend/ai/router.py), [chatbot bancario](../Backend/docs/chatbot-bancario.md).
