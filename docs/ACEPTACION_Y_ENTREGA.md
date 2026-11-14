# Aceptación y entrega

Este archivo prepara el cierre técnico; no representa aprobación de usuarios ni certifica una
operación productiva. Complete responsables, fecha, entorno y evidencias durante una ejecución
real. No registre datos personales ni secretos en capturas o logs.

## Lista de aceptación por ejecutar

| Área | Comprobación | Resultado/evidencia |
|---|---|---|
| Construcción | `docker compose config --quiet` y `docker compose up --build -d` en ambiente limpio | Pendiente |
| Salud | API viva y lista; MySQL accesible desde API | Pendiente |
| Migración | Upgrade en base vacía y adopción controlada de copia de base existente | Pendiente |
| Respaldo | Crear respaldo cifrado y restaurarlo a una base nueva; conciliar conteos | Pendiente |
| Funcional | Registro, autenticación, cuenta, historial y operación acordada de transferencia | Pendiente |
| Seguridad | Rechazo de roles/titularidades no autorizados y ausencia de datos sensibles en respuestas/logs | Pendiente |
| Calidad | Suite backend, pruebas frontend y build de producción | Pendiente |
| Interfaz | Flujos completos, errores de red/sesión, escritorio/móvil y accesibilidad básica | Pendiente |
| Operación | Incidente simulado, recuperación, backup y rollback | Pendiente |

Para cada prueba registre comando o pasos, versión del software, ambiente no sensible, fecha,
resultado esperado, resultado observado, referencia a evidencia saneada e incidencias. No
marque aceptación por la sola presencia de código.

## Acta de entrega (plantilla)

- Proyecto/versión entregada:
- Ambiente y URL (si existe y está autorizado):
- Fecha:
- Representante que entrega:
- Representante que recibe:
- Funcionalidades aceptadas:
- Pruebas ejecutadas y evidencias:
- Limitaciones y riesgos conocidos:
- Pendientes y responsable acordado:
- Procedimiento de soporte y escalamiento:
- Aceptación/rechazo y observaciones:

## Registro de simulacro (plantilla)

| Campo | Registro |
|---|---|
| Escenario | |
| Fecha y ambiente | |
| Participantes/roles | |
| Pasos ejecutados | |
| Resultado esperado y observado | |
| Tiempo medido | |
| Datos recuperados/verificados | |
| Incidentes y acciones correctivas | |
| Evidencia saneada | |

No se han asignado personas, fechas, metas de recuperación ni resultados en esta plantilla.
