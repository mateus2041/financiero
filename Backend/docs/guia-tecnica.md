# Guía técnica y de ejecución

**Propósito:** referencia inicial de desarrollo local. No es una guía de producción ni certifica que la instalación se haya ejecutado correctamente.

## Stack observado

- Frontend: React/JavaScript con Create React App (`react-scripts`), React Router y Axios.
- Backend: FastAPI/Python, SQLAlchemy y Uvicorn.
- Base de datos: MySQL 8.4 declarada en Compose, con PyMySQL.
- Contenedores: `db`, `migrate`, `backend` y `frontend` definidos en `compose.yml`.
- Pruebas backend: pytest en `Backend/tests/`; frontend usa Create React App y aún no tiene casos de prueba propios.

## Ejecución con Docker Compose

1. Instalar Docker Desktop y Compose.
2. Copiar `.env.example` a `.env` y sustituir todos los valores de ejemplo; configura `JWT_SECRET_KEY` de al menos 32 caracteres.
3. Inspeccionar la configuración efectiva sin imprimir ni compartir valores sensibles.
4. Ejecutar desde la raíz:

```powershell
docker compose config --quiet
docker compose up --build -d
```

5. Comprobar frontend (`http://127.0.0.1:3000`), API (`http://127.0.0.1:8000/health/live`) y estado integrado (`http://127.0.0.1:8000/health/ready`).

Compose ejecuta `alembic upgrade head` en `migrate` antes de iniciar la API. Una base preexistente sin historial Alembic puede detener el arranque; revisar [migraciones](migraciones.md) y respaldar antes de adoptarla. No borrar el volumen MySQL para resolver un error.

## Ejecución por componentes

Los comandos exactos requieren validar versiones y entorno local. El backend declara dependencias en `Backend/requirements.txt`; el frontend declara scripts en `Frontend/package.json` y contiene un lockfile npm. Usar el lockfile correspondiente y evitar mezclar gestores. Los procedimientos heredados no son enteramente coherentes; revisar [operación y entrega](semana-09-operacion-y-entrega.md) antes de seguirlos.

Frontend:

```powershell
Set-Location Frontend
npm ci
npm start
```

Backend: crear un entorno Python aislado, instalar `Backend/requirements.txt`, configurar la conexión de base de datos y `JWT_SECRET_KEY`, y ejecutar `uvicorn Backend.main:app --reload` desde la raíz. No conectar un ambiente de producción durante desarrollo.

## Configuración y secretos

- No copiar contenido de `.env` a documentos, terminales compartidos, logs ni commits.
- Las plantillas raíz y de cada componente contienen marcadores, nunca credenciales de despliegue.
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

Validación local del 14-11-2026: `python -m pytest Backend\tests -q -p no:cacheprovider` dio `44 passed` con SQLite aislado y clave JWT exclusiva de test (Python 3.14.3); `npm test -- --watchAll=false --passWithNoTests` terminó correctamente, pero no encontró pruebas frontend; `npm run build` compiló con advertencias de source map/dependencia desactualizada. Estos resultados no sustituyen CI remota, pruebas con MySQL ni aceptación.

## Bloqueos de documentación y configuración

1. Resolver editorialmente los conflictos heredados de `Backend/docs/entregable-s02-planes.md`.
2. Probar Compose/migraciones en base limpia y en copia autorizada del esquema existente.
3. Ensayar el ciclo backup/restore cifrado y acordar custodia/retención.
4. Definir hosting, dominio, TLS, monitoreo y condiciones de operación antes de producción.
