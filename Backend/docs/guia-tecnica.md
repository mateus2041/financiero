# Guía técnica y de ejecución

**Propósito:** referencia inicial de desarrollo local. No es una guía de producción ni certifica que la instalación se haya ejecutado correctamente.

## Stack observado

- Frontend: React/JavaScript con Create React App (`react-scripts`), React Router y Axios.
- Backend: FastAPI/Python, SQLAlchemy y Uvicorn.
- Base de datos: MySQL 8.4 declarada en Compose, con PyMySQL.
- Contenedores: `db`, `backend` y `frontend`; la tarea puntual `migrate` está en el perfil Compose `maintenance`.
- Pruebas backend: pruebas unitarias y de integración bajo `Backend/tests/`.

## Ejecución con Docker Compose

1. Instalar Docker Desktop y Compose en versiones compatibles con el equipo.
2. Configurar las variables requeridas para MySQL y los servicios opcionales mediante un archivo local no versionado.
3. Inspeccionar la configuración efectiva sin imprimir ni compartir valores sensibles.
4. Iniciar MySQL, respaldar, migrar y luego iniciar la aplicación desde la raíz:

```powershell
docker compose config --quiet
docker compose up -d db
python scripts\database_backup.py backup
docker compose --profile maintenance run --rm migrate
docker compose up --build
```

5. Comprobar frontend (`http://localhost:3000`), API (`http://localhost:8000/health`) y disponibilidad de la base mediante `http://localhost:8000/ready`.

Las migraciones no se aplican durante el arranque normal. Antes de iniciar la aplicación, crea un respaldo, inicia la base y ejecuta `docker compose --profile maintenance run --rm migrate`. Revisa [la guía de migraciones](migraciones.md), especialmente si la base ya contiene datos.

## Ejecución por componentes

Los comandos exactos requieren validar versiones y entorno local. El backend declara dependencias en `Backend/requirements.txt`; el frontend declara scripts en `Frontend/package.json` y contiene un lockfile npm. Usar el lockfile correspondiente y evitar mezclar gestores. Los procedimientos heredados no son enteramente coherentes; revisar [operación y entrega](semana-09-operacion-y-entrega.md) antes de seguirlos.

Frontend:

```powershell
Set-Location Frontend
npm ci
npm start
```

Backend: crear un entorno Python aislado, instalar `Backend/requirements.txt`, configurar la conexión de base de datos, `APP_ENV`, `SECRET_KEY` y `CORS_ALLOWED_ORIGINS`, y ejecutar `uvicorn Backend.main:app --reload` desde la raíz. En desarrollo una clave JWT temporal se genera si `SECRET_KEY` está vacía; no usar ese comportamiento en producción.

## Configuración y secretos

- No copiar contenido de `.env` a documentos, terminales compartidos, logs ni commits.
- Usar `Backend/.env.example` como referencia y mantener los valores reales únicamente en el entorno local/gestor de secretos.
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

Registrar versiones, comando y resultado. La suite backend completa tiene fallos conocidos documentados en `DOCUMENTACION_IMPLEMENTACION_BOOTCAMP.md`.

## Bloqueos de documentación y configuración

1. Resolver los marcadores de conflicto que aún existen en `Backend/docs/entregable-s02-planes.md`.
2. Ensayar migraciones y restauración en bases aisladas.
3. Definir TLS, hosting, monitorización, alertas, soporte y objetivos de recuperación antes de producción.
