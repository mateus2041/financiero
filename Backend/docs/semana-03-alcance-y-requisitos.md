# Semana 03 — Alcance y requisitos

**Estado:** síntesis documental basada en evidencia del repositorio; aceptación funcional pendiente.

> El contenido oficial de la semana 03 no fue proporcionado ni se encontró en las ubicaciones inspeccionadas. Este documento organiza requisitos existentes y no pretende sustituir una rúbrica académica.

## Propósito del producto

El proyecto es una aplicación web de billetera financiera con interfaz React, API FastAPI y persistencia MySQL. El código contempla usuarios, cuentas, tarjetas, transacciones, asesoría, administración, notificaciones y asistencia conversacional. La presencia de código asociado no acredita que cada flujo esté completo, integrado o autorizado para uso financiero real.

## Actores identificados

| Actor | Necesidad observada en los requisitos |
|---|---|
| Visitante | Registrarse, iniciar sesión o solicitar recuperación de acceso. |
| Usuario | Consultar su perfil, cuentas, tarjetas, movimientos, llaves y notificaciones. |
| Asesor bancario | Consultar información y realizar acciones permitidas por su rol. |
| Administrador | Administrar asesores y ejecutar operaciones administrativas autorizadas. |

Los roles y permisos efectivos deben aprobarse mediante una matriz y comprobarse en la API; ocultar opciones en la interfaz no concede ni revoca permisos de servidor.

## Capacidades y estado de evidencia

| Área | Evidencia observada | Criterio necesario para aceptación |
|---|---|---|
| Registro, autenticación y recuperación | Rutas relacionadas en `Backend/main.py` y utilidades de seguridad | Probar entradas inválidas, expiración, respuestas, sesión y separación de roles. |
| Perfil y cuentas | Rutas y modelos en backend | Probar acceso por titular, validación y consistencia del saldo. |
| Tarjetas | Modelo y rutas de consulta/administración | Confirmar titularidad y que datos sensibles no queden expuestos. |
| Movimientos y transferencias internas | Modelo `Transaccion` y endpoints en backend | Probar fondos, autorización, atomicidad, rollback e historial. |
| BRE-B | Rutas y modelo relacionados | Determinar si es simulación o integración real; no afirmar liquidación bancaria. |
| Administración y asesoría | Rutas en `main.py` y router de asesoría | Aprobar matriz de permisos y pruebas negativas/auditoría. |
| Notificaciones | Endpoints de consulta y gestión | Probar aislamiento del usuario y experiencia de interfaz. |
| Asistente IA | Router `/ia/chat` y módulos `Backend/ai/` | Validar autenticación, configuración, fallos y privacidad del proveedor. |

## Fuera de alcance confirmado

No hay evidencia suficiente para declarar como aceptados: conexión a una red bancaria real, cumplimiento normativo, operación productiva, datos en tiempo real, cobertura de reportes/certificados/QR/retiro sin tarjeta, ni objetivos de rendimiento. La inclusión de pantallas o rutas no basta para confirmar esas capacidades.

## Criterios transversales

1. Validar entradas en el servidor.
2. Autenticar y autorizar cada operación protegida, comprobando la propiedad de cada recurso.
3. Mantener consistencia transaccional de saldos y movimientos.
4. Comunicar resultados y fallos sin exponer datos sensibles.
5. Aceptar una historia solo con evidencia reproducible de API y, cuando aplique, interfaz.

## Preguntas que requieren confirmación del equipo

- Alcance funcional oficial de la entrega y definición de terminado.
- Reglas de negocio de cuentas, límites, tarjetas, transferencias y recuperación.
- Si BRE-B debe ser demostrativo o integrarse con un proveedor/red real.
- Formatos y alcance de reportes, certificados, QR y retiro sin tarjeta.
- Requisitos legales, de privacidad y jurisdicción aplicables.

**Referencia:** [Requisitos funcionales](../Backend/docs/requirements/functional.md), [Historias de usuario](../Backend/docs/requirements/user-stories.md), [Backlog](../Backend/docs/requirements/SprintBacklog.md).
