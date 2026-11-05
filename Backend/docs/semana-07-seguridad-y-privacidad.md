# Semana 07 — Seguridad y privacidad

**Estado:** controles y riesgos documentales; no constituye una auditoría ni certificación de seguridad.

> No se encontró material oficial de la semana 07. Esta entrega consolida requisitos de seguridad existentes y observaciones de arquitectura. No reproduce valores de credenciales.

## Activos y datos que requieren protección

- Contraseñas, tokens de sesión y códigos de recuperación.
- Identificadores, documentos, teléfonos, direcciones y correos.
- Saldos, cuentas, transacciones y llaves de pago.
- Datos de tarjeta; el modelo incluye número, expiración y código de seguridad.
- Credenciales de MySQL, correo y proveedor de IA.

## Controles requeridos

| Control | Requisito verificable |
|---|---|
| Autenticación | Validar firma, expiración y propósito del token en todas las rutas protegidas. |
| Autorización | Comprobar rol y titularidad en cada operación del servidor; rechazar acceso cruzado. |
| Contraseñas | Usar hash adaptativo apropiado; nunca guardar ni registrar texto plano. |
| Recuperación | Códigos de un solo uso, expiración, límites y respuestas que no enumeren usuarios. |
| Tarjetas | Minimizar datos; no exponer ni registrar CVV o números completos. Revisar necesidad de almacenar estos campos. |
| Secretos | Inyectar desde un gestor/entorno seguro; rotar secretos comprometidos y excluirlos del control de versiones. |
| Transporte | HTTPS en despliegues y CORS restringido a orígenes necesarios. |
| Integridad | Transferencias atómicas, control de concurrencia e idempotencia según el contrato. |
| IA/correo | Reducir datos enviados a terceros, documentar proveedor/retención y comunicar fallos explícitamente. |
| Auditoría | Registrar operaciones sensibles sin incluir secretos ni datos completos de medios de pago. |

## Observaciones que requieren atención

1. El modelo `Tarjeta` incluye `codigo_seguridad`; confirmar si se persiste y eliminar su almacenamiento si no es estrictamente necesario y legalmente permitido.
2. El plan de trabajo y los requisitos identifican permisos, transferencias y datos de tarjetas como pendientes de validación.
3. Varias páginas del frontend usan direcciones locales; revisar configuración por entorno y evitar transmitir datos sensibles por canales no cifrados fuera de desarrollo.
4. La configuración de Compose debe tratarse como local. No publicar puertos ni usar credenciales de desarrollo fuera de un entorno aislado.
5. La cobertura de las medidas depende de revisión y pruebas; no se ha realizado una prueba de penetración ni una evaluación normativa como parte de esta entrega.

## Pruebas de seguridad priorizadas

- Usuario A no puede leer, modificar o transferir desde cuentas de usuario B.
- Usuario, asesor y administrador no pueden intercambiar capacidades.
- Tokens vencidos, alterados o ausentes son rechazados.
- Respuestas y logs no contienen contraseñas, tokens, códigos, CVV ni números completos de tarjeta.
- Recuperación no permite reutilizar códigos ni confirmar indiscriminadamente la existencia de una cuenta.
- Una transferencia fallida no deja un débito parcial y una repetición no duplica el efecto.
- CORS, cookies/tokens, límites de tasa y manejo de errores se comprueban en el entorno acordado.

**Referencias:** [Requisitos no funcionales](../Backend/docs/requirements/non-functional.md), [Restricciones](../Backend/docs/requirements/constraints.md), [modelos](../Backend/models.py).
