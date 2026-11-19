# Calidad, ISO 25010 y mediciones

## Estándar adoptado

Se adopta ISO/IEC 25010 para priorizar características medibles. Las decisiones de implementación
se basan en las siguientes metas:

| Característica | Métrica | Meta | Verificación |
| --- | --- | --- | --- |
| Fiabilidad | Pruebas backend exitosas | >= 95% sin fallos | `pytest` en CI |
| Seguridad | Accesos no autorizados rechazados | 100% de casos negativos | Pruebas de autorización |
| Rendimiento | p95 de `/health/ready` | <= 300 ms local | Medición durante smoke test |
| Mantenibilidad | Cobertura backend | >= 60% | `pytest --cov --cov-fail-under=60` |
| Usabilidad | Flujo crítico sin bloqueos | 100% en 5 pruebas de aceptación | Acta de aceptación |

## Controles automatizados

- Backend: pytest, pytest-cov y umbral mínimo de cobertura.
- Frontend: Jest y build de producción en cada push/PR.
- Migraciones: prueba de grafo con una sola cabeza.
- Operación: healthchecks de contenedor y smoke test local.
- Seguridad: configuración CORS, cabeceras HTTP y pruebas de acceso.

## Plan de mejora

1. Reducir el acoplamiento de `Backend/main.py` mediante extracción gradual de routers.
2. Añadir pruebas E2E a los flujos de registro, login y transferencia.
3. Medir p95 con carga controlada y documentar el resultado reproducible.
4. Completar pruebas de autorización y titularidad sobre cuentas y tarjetas.

Las acciones 3 y 4 se verifican en CI y en `docs/ACEPTACION_Y_ENTREGA.md`.
