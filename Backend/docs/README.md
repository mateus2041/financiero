# Documentación del proyecto Billetera Financiera

**Fecha de elaboración:** 27 de octubre de 2026  
**Base documental:** inspección estática del repositorio `financiero`.

## Alcance y límites de esta entrega

Este índice organiza siete entregas documentales (semanas 03 a 09) a partir del código y de los documentos existentes en el proyecto. No se encontraron en el repositorio ni en las carpetas vecinas inspeccionadas los directorios de referencia `3-proyecto` y `starter`, ni guías o rúbricas de las semanas 03–09. Por eso, los títulos temáticos de esta serie son una organización documental propuesta, no una afirmación sobre el contenido oficial de esas clases. Se debe contrastar esta entrega con el material académico cuando esté disponible.

Los estados **observado** y **presente** indican evidencia en archivos; no prueban que un flujo haya sido aceptado, desplegado o medido. **Pendiente de validar** identifica algo que requiere ejecución, decisión o confirmación. No se inventan responsables, resultados de pruebas, metas operativas ni acuerdos.

## Entregas por semana

| Semana | Documento | Contenido |
|---|---|---|
| 03 | [Alcance y requisitos](semana-03-alcance-y-requisitos.md) | Actores, capacidades identificadas, criterios y límites del alcance. |
| 04 | [Arquitectura y componentes](semana-04-arquitectura-y-componentes.md) | Componentes, tecnologías, comunicación y puntos de integración. |
| 05 | [Modelo de datos y persistencia](semana-05-modelo-de-datos-y-persistencia.md) | Entidades observadas, relaciones conceptuales y situación de migraciones. |
| 06 | [Flujos funcionales e integraciones](semana-06-flujos-e-integraciones.md) | Recorridos de API, BRE-B, correo y asistente IA; aspectos por verificar. |
| 07 | [Seguridad y privacidad](semana-07-seguridad-y-privacidad.md) | Límites de confianza, controles esperados y riesgos pendientes. |
| 08 | [Calidad y pruebas](semana-08-calidad-y-pruebas.md) | Inventario de pruebas, validación propuesta y evidencia todavía ausente. |
| 09 | [Operación y entrega](semana-09-operacion-y-entrega.md) | Ejecución local/Compose, datos, recuperación y condiciones de entrega. |

## Documentación técnica complementaria

- [Guía técnica y de ejecución](guia-tecnica.md): stack real observado, configuración necesaria y comandos con límites explícitos.
- [Matriz de trazabilidad y pendientes](matriz-trazabilidad.md): relación entre capacidades, evidencia y validación requerida.

## Fuentes del repositorio

- [Plan de trabajo](../PLAN_TRABAJO.md)
- [Requisitos funcionales](../Backend/docs/requirements/functional.md)
- [Requisitos no funcionales](../Backend/docs/requirements/non-functional.md)
- [Restricciones](../Backend/docs/requirements/constraints.md)
- [Historias de usuario](../Backend/docs/requirements/user-stories.md)
- [Backlog](../Backend/docs/requirements/SprintBacklog.md)
- [Plan de sprints](../Backend/docs/requirements/sprints.md)
- [Modelos de datos](../Backend/models.py)
- [API FastAPI](../Backend/main.py)
- [Configuración de Compose](../compose.yml)

## Pendientes para cerrar la documentación

1. Obtener y comparar la guía/rúbrica oficial de `3-proyecto`, `starter` y semanas 03–09.
2. Resolver los marcadores de conflicto presentes en `Backend/docs/entregable-s02-planes.md` y `Backend/docs/migraciones.md`.
3. Alinear la guía heredada de migraciones con `compose.yml`: el Compose actual no declara un servicio `migrate`.
4. Ejecutar y registrar las pruebas y procedimientos operativos antes de afirmar aceptación.

## Enlaces y coherencia

Los enlaces internos de este conjunto apuntan a rutas relativas desde `docs/`. La verificación que acompaña a esta entrega confirma existencia de los destinos locales enlazados dentro del nuevo conjunto; no valida contenido de referencias externas ni reemplaza la revisión del material académico ausente.
