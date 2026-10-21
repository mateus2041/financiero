# Migraciones de base de datos

Alembic es la única vía para cambiar el esquema. Los modelos en `Backend/models.py` usan la misma `Base` y conexión definidas en `Backend/database/database.py`. FastAPI ya no crea ni altera tablas durante su inicio.

## Configuración

Para ejecutar el backend fuera de Docker, configure en `.env` `DB_HOST=127.0.0.1`, `DB_PORT=3307`, `DB_USER`, `DB_PASSWORD` y `DB_NAME=billetera` (o una `DATABASE_URL` equivalente). Dentro de Compose, el host es `db` y el puerto `3306`; las credenciales Docker se suministran mediante `MYSQL_ROOT_PASSWORD`, `MYSQL_APP_USER` y `MYSQL_APP_PASSWORD`. Compose lee el archivo `.env` de la raíz, junto a `compose.yml`; el ejemplo está en `Backend/.env.example`. Añada allí las variables Docker que falten sin reemplazar el `.env` real. `MYSQL_ROOT_PASSWORD` debe coincidir con la contraseña root del volumen MySQL existente; `MYSQL_APP_PASSWORD` debe coincidir con la contraseña de `MYSQL_APP_USER` (por defecto `app_user`). No copie contraseñas reales a este documento ni a `alembic.ini`.

## Desarrollo local en PowerShell

Desde la raíz del repositorio:

```powershell
uv sync
uv run alembic -c Backend/alembic.ini revision --autogenerate -m "descripcion del cambio"
uv run alembic -c Backend/alembic.ini upgrade head
uv run alembic -c Backend/alembic.ini current
uv run alembic -c Backend/alembic.ini history
uv run alembic -c Backend/alembic.ini downgrade -1
```

Revise siempre el archivo generado antes de aplicar `upgrade`; investigue cualquier `drop_table`, `drop_column`, cambio de tipo o restricción. El downgrade solo es seguro si la revisión define operaciones inversas adecuadas; no recupera datos eliminados.

El downgrade de la revisión inicial elimina las tablas creadas por esa revisión y, por tanto, sus datos. No lo ejecute contra una base con datos que quiera conservar. La revisión de normalización tampoco puede restaurar los números de cuenta que genere.

## Docker Compose

El servicio `migrate` espera a que `db` pase su healthcheck. El backend depende de que `migrate` finalice exitosamente, por lo que no hay dos procesos del backend migrando simultáneamente. Para crear una revisión usando la conexión de Docker:

```powershell
docker compose run --rm migrate uv run alembic -c Backend/alembic.ini revision --autogenerate -m "descripcion del cambio"
```

Para consultar desde el backend activo:

```powershell
docker compose exec backend uv run alembic -c Backend/alembic.ini current
docker compose exec backend uv run alembic -c Backend/alembic.ini history
```

El arranque normal aplica `upgrade head` en el job `migrate`. También se puede ejecutar explícitamente:

```powershell
docker compose run --rm migrate uv run alembic -c Backend/alembic.ini upgrade head
docker compose exec backend uv run alembic -c Backend/alembic.ini downgrade -1
```

Reconstruya y arranque sin borrar volúmenes:

```powershell
docker compose up -d --build
```

No use `docker compose down -v`: el volumen `mysql_data` contiene la base persistente.

## Base de datos preexistente

No se ejecuta `stamp` automáticamente. Para la base Docker existente se compararon tablas, columnas, tipos, nulabilidad, índices, valores por defecto y claves foráneas contra `Backend/models.py`; Alembic reportó cero diferencias. Tras verificar esa coincidencia se marcó el baseline `e8698959a1e4` y se aplicó `head` (`f7c2d5b184a0`). El backfill no encontró filas pendientes.

Si la base está vacía, `docker compose up -d --build` ejecuta ambas revisiones. Si ya contiene tablas sin historial Alembic, el preflight detiene `upgrade` antes de ejecutar DDL; el backend no arrancará. Solo si el esquema coincide exactamente con la revisión inicial, márquela como aplicada con:

```powershell
docker compose run --rm migrate uv run alembic -c Backend/alembic.ini stamp e8698959a1e4
docker compose run --rm migrate uv run alembic -c Backend/alembic.ini upgrade head
```

<<<<<<< HEAD
La revisión posterior normaliza algunos datos heredados; por eso se marca específicamente la revisión inicial y luego se ejecuta `upgrade head`, en vez de marcar `head`. Si hay diferencias de esquema, cree y revise una revisión de adopción específica; no las oculte con `stamp head`.
=======
La revisión posterior normaliza algunos datos heredados; por eso se marca específicamente la revisión inicial y luego se ejecuta `upgrade head`, en vez de marcar `head`. Si hay diferencias de esquema, cree y revise una revisión de adopción específica; no las oculte con `stamp head`.
>>>>>>> develop
