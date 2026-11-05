# Guía técnica y de ejecución

**Propósito:** referencia inicial de desarrollo local. No es una guía de producción ni certifica que la instalación se haya ejecutado correctamente.

## Stack observado

- Frontend: React/JavaScript con Create React App (`react-scripts`), React Router y Axios.
- Backend: FastAPI/Python, SQLAlchemy y Uvicorn.
- Base de datos: MySQL 8.4 declarada en Compose, con PyMySQL.
- Contenedores: `db`, `backend` y `frontend` definidos en `compose.yml`.
- Pruebas backend: nueve archivos bajo `Backend/tests/`.

## Ejecución con Docker Compose

1. Instalar Docker Desktop y Compose en versiones compatibles con el equipo.
2. Configurar las variables requeridas para MySQL y los servicios opcionales mediante un archivo local no versionado.
3. Inspeccionar la configuración efectiva sin imprimir ni compartir valores sensibles.
4. Ejecutar desde la raíz:

```powershell
docker compose config
docker compose up --build
```

5. Comprobar manualmente frontend (`http://localhost:3000`), API (`http://localhost:8000`) y salud de MySQL.

El Compose no contiene servicio de migración aunque algunos documentos heredados lo mencionan. No usar la ejecución anterior con datos importantes hasta definir cómo y cuándo se aplican revisiones Alembic.

## Ejecución por componentes

Los comandos exactos requieren validar versiones y entorno local. El backend declara dependencias en `Backend/requirements.txt`; el frontend declara scripts en `Frontend/package.json` y contiene un lockfile npm. Usar el lockfile correspondiente y evitar mezclar gestores. Los procedimientos heredados no son enteramente coherentes; revisar [operación y entrega](semana-09-operacion-y-entrega.md) antes de seguirlos.

Frontend:

```powershell
Set-Location Frontend
npm ci
npm start
```

Backend: crear un entorno Python aislado, instalar `Backend/requirements.txt`, configurar la conexión de base de datos, y ejecutar `uvicorn Backend.main:app --reload` desde la raíz. Confirmar primero la configuración de base y migraciones; no conectar un ambiente de producción durante desarrollo.

## Configuración y secretos

- No copiar contenido de `.env` a documentos, terminales compartidos, logs ni commits.
- Completar un inventario autoritativo de variables a partir del backend, Compose, correo, IA y Alembic.
- Usar valores ficticios únicamente en plantillas y mantenerlas sin secretos válidos.
- Cambiar credenciales de ejemplo antes de cualquier ambiente compartido.

## Calidad

Backend (desde la raíz; requiere pytest instalado en el entorno):

```powershell
python -m pytest Backend\tests -q
```

Frontend (desde `Frontend`):

```powershell
npm test -- --watchAll=false
npm run build
```

Registrar versiones, comando y resultado; no se afirma aquí que los comandos hayan sido ejecutados.

## Bloqueos de documentación y configuración

1. Revisar los marcadores de conflicto en `Backend/docs/entregable-s02-planes.md` y `Backend/docs/migraciones.md`.
2. Unificar instrucciones de instalación, versiones y gestor de paquetes.
3. Alinear Compose y ejecución de Alembic con una estrategia aprobada.
4. Centralizar URL de API del frontend y configurar por ambiente.
5. Definir guía de secretos, backup/restore, soporte y operación antes de despliegue.
