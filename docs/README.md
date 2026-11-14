# Documentación de implantación

Este conjunto adapta los entregables aplicables del bootcamp al proyecto Billetera
Financiera. Las evidencias de configuración y pruebas se separan de los resultados
operativos: tener un script o un procedimiento no acredita que se haya ejecutado en un
servidor ni que haya sido aceptado.

| Documento | Propósito |
|---|---|
| [Matriz de cumplimiento](MATRIZ_CUMPLIMIENTO_BOOTCAMP.md) | Estado inicial/final, cambios, validaciones y pendientes de las semanas 1–10. |
| [Operación y despliegue](OPERACION_Y_DESPLIEGUE.md) | Configuración local, migraciones, health checks, respaldos, recuperación y límites de despliegue. |
| [Aceptación y entrega](ACEPTACION_Y_ENTREGA.md) | Casos para completar, acta y registro de simulacro; sin aceptación ficticia. |
| [Manual de usuario](MANUAL_USUARIO.md) | Acceso y funciones expuestas por las rutas activas del frontend. |

La documentación de arquitectura, modelos, requisitos y migraciones se conserva en
[Backend/docs](../Backend/docs/README.md). El proyecto actualmente declara React,
FastAPI y MySQL en [compose.yml](../compose.yml); no se ha contratado ni configurado
un dominio o proveedor de hosting.
