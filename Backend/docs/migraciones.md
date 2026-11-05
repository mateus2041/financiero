# Migraciones de base de datos

Alembic es la Ãºnica vÃ­a para cambiar el esquema. Los modelos en `Backend/models.py` usan la misma `Base` y conexiÃ³n definidas en `Backend/database/database.py`. FastAPI ya no crea ni altera tablas durante su inicio.

## ConfiguraciÃ³n

Para ejecutar el backend fuera de Docker, configure en `.env` `DB_HOST=127.0.0.1`, `DB_PORT=3307`, `DB_USER`, `DB_PASSWORD` y `DB_NAME=billetera` (o una `DATABASE_URL` equivalente). Dentro de Compose, el host es `db` y el puerto `3306`; las credenciales Docker se suministran mediante `MYSQL_ROOT_PASSWORD`, `MYSQL_APP_USER` y `MYSQL_APP_PASSWORD`. Compose lee el archivo `.env` de la raÃ­z, junto a `compose.yml`; el ejemplo estÃ¡ en `Backend/.env.example`. AÃ±ada allÃ­ las variables Docker que falten sin reemplazar el `.env` real. `MYSQL_ROOT_PASSWORD` debe coincidir con la contraseÃ±a root del volumen MySQL existente; `MYSQL_APP_PASSWORD` debe coincidir con la contraseÃ±a de `MYSQL_APP_USER` (por defecto `app_user`). No copie contraseÃ±as reales a este documento ni a `alembic.ini`.

## Desarrollo local en PowerShell

Desde la raÃ­z del repositorio:

```powershell
uv sync
uv run alembic -c Backend/alembic.ini revision --autogenerate -m "descripcion del cambio"
uv run alembic -c Backend/alembic.ini upgrade head
uv run alembic -c Backend/alembic.ini current
uv run alembic -c Backend/alembic.ini history
uv run alembic -c Backend/alembic.ini downgrade -1
```

Revise siempre el archivo generado antes de aplicar `upgrade`; investigue cualquier `drop_table`, `drop_column`, cambio de tipo o restricciÃ³n. El downgrade solo es seguro si la revisiÃ³n define operaciones inversas adecuadas; no recupera datos eliminados.

El downgrade de la revisiÃ³n inicial elimina las tablas creadas por esa revisiÃ³n y, por tanto, sus datos. No lo ejecute contra una base con datos que quiera conservar. La revisiÃ³n de normalizaciÃ³n tampoco puede restaurar los nÃºmeros de cuenta que genere.

## Docker Compose

El servicio `migrate` espera a que `db` pase su healthcheck. El backend depende de que `migrate` finalice exitosamente, por lo que no hay dos procesos del backend migrando simultÃ¡neamente. Para crear una revisiÃ³n usando la conexiÃ³n de Docker:

```powershell
docker compose run --rm migrate uv run alembic -c Backend/alembic.ini revision --autogenerate -m "descripcion del cambio"
```

Para consultar desde el backend activo:

```powershell
docker compose exec backend uv run alembic -c Backend/alembic.ini current
docker compose exec backend uv run alembic -c Backend/alembic.ini history
```

El arranque normal aplica `upgrade head` en el job `migrate`. TambiÃ©n se puede ejecutar explÃ­citamente:

```powershell
docker compose run --rm migrate uv run alembic -c Backend/alembic.ini upgrade head
docker compose exec backend uv run alembic -c Backend/alembic.ini downgrade -1
```

Reconstruya y arranque sin borrar volÃºmenes:

```powershell
docker compose up -d --build
```

No use `docker compose down -v`: el volumen `mysql_data` contiene la base persistente.

## Base de datos preexistente

No se ejecuta `stamp` automÃ¡ticamente. Para la base Docker existente se compararon tablas, columnas, tipos, nulabilidad, Ã­ndices, valores por defecto y claves forÃ¡neas contra `Backend/models.py`; Alembic reportÃ³ cero diferencias. Tras verificar esa coincidencia se marcÃ³ el baseline `e8698959a1e4` y se aplicÃ³ `head` (`f7c2d5b184a0`). El backfill no encontrÃ³ filas pendientes.

Si la base estÃ¡ vacÃ­a, `docker compose up -d --build` ejecuta ambas revisiones. Si ya contiene tablas sin historial Alembic, el preflight detiene `upgrade` antes de ejecutar DDL; el backend no arrancarÃ¡. Solo si el esquema coincide exactamente con la revisiÃ³n inicial, mÃ¡rquela como aplicada con:

```powershell
docker compose run --rm migrate uv run alembic -c Backend/alembic.ini stamp e8698959a1e4
docker compose run --rm migrate uv run alembic -c Backend/alembic.ini upgrade head
```

La revisiÃ³n posterior normaliza algunos datos heredados; por eso se marca especÃ­ficamente la revisiÃ³n inicial y luego se ejecuta `upgrade head`, en vez de marcar `head`. Si hay diferencias de esquema, cree y revise una revisiÃ³n de adopciÃ³n especÃ­fica; no las oculte con `stamp head`.
La revisiÃ³n posterior normaliza algunos datos heredados; por eso se marca especÃ­ficamente la revisiÃ³n inicial y luego se ejecuta `upgrade head`, en vez de marcar `head`. Si hay diferencias de esquema, cree y revise una revisiÃ³n de adopciÃ³n especÃ­fica; no las oculte con `stamp head`.

