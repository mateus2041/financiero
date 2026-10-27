# Semana 09 — Operación y entrega

**Estado:** inventario de configuración y lista de preparación; despliegue y recuperación no ejecutados.

> No se encontró la guía oficial de la semana 09. Los datos y comandos se limitan a lo observable en el repositorio. No desplegar ni publicar desde esta documentación.

## Topología declarada

`compose.yml` declara `db` (MySQL 8.4), `backend` (FastAPI) y `frontend` (React). Expone 3307, 8000 y 3000 en el host, respectivamente, y persiste MySQL en `mysql_data`. Esta es configuración del repositorio para desarrollo, no un diseño endurecido de producción.

## Configuración requerida

La aplicación depende de configuración de conexión MySQL y puede requerir credenciales de correo, código de registro de asesor y clave del proveedor LLM. Los nombres exactos deben inventariarse desde código/configuración del entorno. Mantener los valores fuera de esta guía y de los commits; no copiar archivos `.env` con secretos.

## Migraciones: discrepancia bloqueante

- Existen `Backend/alembic.ini` y dos revisiones Alembic.
- `Backend/docs/migraciones.md` describe un servicio Compose llamado `migrate`, y `Backend/docs/entregable-s02-planes.md` tiene secciones con marcadores de conflicto (`<<<<<<<`, `=======`, `>>>>>>>`).
- El `compose.yml` inspeccionado define solo `db`, `backend` y `frontend`; no hay servicio `migrate` ni comando `alembic upgrade` en el arranque declarado.
- Por tanto, los comandos Compose que dependen de `migrate` no se consideran verificados. El equipo debe decidir e implementar la ruta canónica de migración antes de usarla sobre una base persistente.

No ejecutar downgrade, `docker compose down -v`, borrado de volúmenes ni operaciones destructivas sobre datos que se quieran conservar.

## Procedimiento de arranque a validar

Antes de adoptarlo, configurar variables válidas en el entorno local y revisar los Dockerfiles y dependencias:

```powershell
docker compose config
docker compose up --build
```

Después verificar salud de MySQL, respuesta de API, carga del frontend y conectividad frontend/API. Este documento no certifica que los comandos terminen exitosamente ni que los servicios tengan configuración de producción.

## Preparación de operación

| Área | Evidencia necesaria antes de aceptar |
|---|---|
| Variables y secretos | Inventario, `.env.example` sin credenciales y separación por ambiente. |
| Migración | Flujo canónico probado en base limpia y existente, revisión de SQL y plan de reversión. |
| Respaldo | Frecuencia, retención, cifrado, custodia, restauración comprobada y responsables aprobados. |
| Observabilidad | Logs sin secretos, métricas, alertas, correlación y procedimientos de incidente. |
| Red y TLS | Orígenes CORS, HTTPS, exposición de puertos y controles de acceso revisados. |
| Dependencias | Versiones de Python/Node fijadas y builds reproducibles. |
| Recuperación | Objetivos RPO/RTO definidos por negocio y ensayo documentado. |
| Entrega | Suite de pruebas, revisión de seguridad, aceptación de producto y lista de limitaciones. |

No hay datos medidos para establecer RPO/RTO, capacidad, latencia, disponibilidad, costo ni consumo. Esos valores requieren decisión y medición, no estimación inventada.

**Referencias:** [compose.yml](../compose.yml), [Dockerfile backend](../Backend/Dockerfile), [migraciones heredadas](../Backend/docs/migraciones.md), [plan S02 heredado](../Backend/docs/entregable-s02-planes.md).
