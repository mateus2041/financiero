# Guía técnica y de ejecución

**Propósito:** referencia inicial de desarrollo local. No es una guía de producción ni certifica que la instalación se haya ejecutado correctamente.

## Stack observado

- Frontend: React/JavaScript con Create React App (`react-scripts`), React Router y Axios.
- Backend: FastAPI/Python, SQLAlchemy y Uvicorn.
- Base de datos: MySQL 8.4 declarada en Compose, con PyMySQL.
<<<<<<< HEAD
- Contenedores: `db`, `migrate`, `backend` y `frontend` definidos en `compose.yml`.
- Pruebas backend: pytest en `Backend/tests/`; frontend usa Create React App y aún no tiene casos de prueba propios.
=======
- Contenedores: `db`, `backend` y `frontend`; la tarea puntual `migrate` está en el perfil Compose `maintenance`.
- Pruebas backend: pruebas unitarias y de integración bajo `Backend/tests/`.
>>>>>>> 37fa596c1605a4d561e0ff704b1b6cba5c5ab799

## Ejecución con Docker Compose

1. Instalar Docker Desktop y Compose.
2. Copiar `.env.example` a `.env` y sustituir todos los valores de ejemplo; configura `JWT_SECRET_KEY` de al menos 32 caracteres.
3. Inspeccionar la configuración efectiva sin imprimir ni compartir valores sensibles.
4. Iniciar MySQL, respaldar, migrar y luego iniciar la aplicación desde la raíz:

```powershell
docker compose config --quiet
<<<<<<< HEAD
docker compose up --build -d
```

5. Comprobar frontend (`http://127.0.0.1:3000`), API (`http://127.0.0.1:8000/health/live`) y estado integrado (`http://127.0.0.1:8000/health/ready`).

Compose ejecuta `alembic upgrade head` en `migrate` antes de iniciar la API. Una base preexistente sin historial Alembic puede detener el arranque; revisar [migraciones](migraciones.md) y respaldar antes de adoptarla. No borrar el volumen MySQL para resolver un error.
=======
docker compose up -d db
python scripts\database_backup.py backup
docker compose --profile maintenance run --rm migrate
docker compose up --build
```

5. Comprobar frontend (`http://localhost:3000`), API (`http://localhost:8000/health`) y disponibilidad de la base mediante `http://localhost:8000/ready`.

Las migraciones no se aplican durante el arranque normal. Antes de iniciar la aplicación, crea un respaldo, inicia la base y ejecuta `docker compose --profile maintenance run --rm migrate`. Revisa [la guía de migraciones](migraciones.md), especialmente si la base ya contiene datos.
>>>>>>> 37fa596c1605a4d561e0ff704b1b6cba5c5ab799

## Ejecución por componentes

Los comandos exactos requieren validar versiones y entorno local. El backend declara dependencias en `Backend/requirements.txt`; el frontend declara scripts en `Frontend/package.json` y contiene un lockfile npm. Usar el lockfile correspondiente y evitar mezclar gestores. Los procedimientos heredados no son enteramente coherentes; revisar [operación y entrega](semana-09-operacion-y-entrega.md) antes de seguirlos.

Frontend:

```powershell
Set-Location Frontend
npm ci
npm start
```

<<<<<<< HEAD
Backend: crear un entorno Python aislado, instalar `Backend/requirements.txt`, configurar la conexión de base de datos y `JWT_SECRET_KEY`, y ejecutar `uvicorn Backend.main:app --reload` desde la raíz. No conectar un ambiente de producción durante desarrollo.
=======
Backend: crear un entorno Python aislado, instalar `Backend/requirements.txt`, configurar la conexión de base de datos, `APP_ENV`, `SECRET_KEY` y `CORS_ALLOWED_ORIGINS`, y ejecutar `uvicorn Backend.main:app --reload` desde la raíz. En desarrollo una clave JWT temporal se genera si `SECRET_KEY` está vacía; no usar ese comportamiento en producción.
>>>>>>> 37fa596c1605a4d561e0ff704b1b6cba5c5ab799

## Configuración y secretos

- No copiar contenido de `.env` a documentos, terminales compartidos, logs ni commits.
<<<<<<< HEAD
- Las plantillas raíz y de cada componente contienen marcadores, nunca credenciales de despliegue.
=======
- Usar `Backend/.env.example` como referencia y mantener los valores reales únicamente en el entorno local/gestor de secretos.
>>>>>>> 37fa596c1605a4d561e0ff704b1b6cba5c5ab799
- Usar valores ficticios únicamente en plantillas y mantenerlas sin secretos válidos.
- Si una credencial expuesta en una copia previa fue válida, su propietario debe revocarla/rotarla fuera del repositorio.

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

<<<<<<< HEAD
Validación local del 14-11-2026: `python -m pytest Backend\tests -q -p no:cacheprovider` dio `44 passed` con SQLite aislado y clave JWT exclusiva de test (Python 3.14.3); `npm test -- --watchAll=false --passWithNoTests` terminó correctamente, pero no encontró pruebas frontend; `npm run build` compiló con advertencias de source map/dependencia desactualizada. Estos resultados no sustituyen CI remota, pruebas con MySQL ni aceptación.

## Bloqueos de documentación y configuración

1. Resolver editorialmente los conflictos heredados de `Backend/docs/entregable-s02-planes.md`.
2. Probar Compose/migraciones en base limpia y en copia autorizada del esquema existente.
3. Ensayar el ciclo backup/restore cifrado y acordar custodia/retención.
4. Definir hosting, dominio, TLS, monitoreo y condiciones de operación antes de producción.
=======
Registrar versiones, comando y resultado. La suite backend completa tiene fallos conocidos documentados en `DOCUMENTACION_IMPLEMENTACION_BOOTCAMP.md`.

## Bloqueos de documentación y configuración

1. Resolver los marcadores de conflicto que aún existen en `Backend/docs/entregable-s02-planes.md`.
2. Ensayar migraciones y restauración en bases aisladas.
3. Definir TLS, hosting, monitorización, alertas, soporte y objetivos de recuperación antes de producción.
>>>>>>> 37fa596c1605a4d561e0ff704b1b6cba5c5ab799
