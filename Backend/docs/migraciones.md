# Migraciones de base de datos

<<<<<<< HEAD
Alembic es la unica via para cambiar el esquema. FastAPI no crea ni modifica tablas por su cuenta. En Compose, el comando del servicio `backend` aplica las migraciones antes de iniciar Uvicorn; por eso `docker compose up` puede modificar el esquema. Realiza y valida un respaldo antes de actualizar una base con datos.

La revision `91d8b15c4a22` copia a `asesores_banco` los datos que antes se obtenian mediante `id_usuario` y luego elimina esa columna.

## Configuracion

Compose lee el archivo `.env` de la raiz, junto a `compose.yml`; usa `.env.example` como plantilla. Se requieren `MYSQL_ROOT_PASSWORD`, `DB_PASSWORD` y `JWT_SECRET_KEY` (minimo 32 bytes). `DB_PASSWORD` debe coincidir con la contraseña del usuario de aplicacion. Para el volumen MySQL existente, conserva las credenciales con las que se inicializo; cambiar las variables no actualiza las contraseñas almacenadas en el volumen.

Para ejecutar el backend fuera de Docker, configura `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`. En Compose, el host es `db` y el puerto `3306`. No copies secretos a este documento ni a `alembic.ini`.
=======
Alembic es la unica via para cambiar el esquema. FastAPI no crea ni modifica tablas al iniciar. Las migraciones no se ejecutan con `docker compose up`; se ejecutan como un paso operativo explicito para que una actualizacion no aplique DDL sin respaldo o revision.

<<<<<<< HEAD
La revisión `91d8b15c4a22` copia a `asesores_banco` los datos que antes se obtenían mediante `id_usuario` y luego elimina esa columna. Aplique el cambio con `uv run alembic -c Backend/alembic.ini upgrade head` (o el comando equivalente de Docker Compose descrito abajo).

## Configuración

Para ejecutar el backend fuera de Docker, configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME` en el entorno. En Compose, el host es `db` y el puerto `3306`. Compose lee el archivo `.env` de la raíz, junto a `compose.yml`; use `.env.example` como plantilla. Se requieren `MYSQL_ROOT_PASSWORD`, `DB_PASSWORD` y `JWT_SECRET_KEY` (mínimo 32 caracteres). `DB_PASSWORD` debe coincidir con la contraseña del usuario de aplicación. Para el volumen MySQL existente, conserve las credenciales que lo inicializaron; cambiar las variables no cambia automáticamente las contraseñas almacenadas en el volumen. No copie secretos a este documento ni a `alembic.ini`.
=======
## Configuracion

Compose lee las variables del archivo `.env` en la raiz del repositorio. Usa las credenciales de MySQL que ya correspondan al volumen persistente:

- `MYSQL_ROOT_PASSWORD`
- `MYSQL_APP_USER` (opcional; por defecto `app_user`)
- `MYSQL_APP_PASSWORD`
- `MYSQL_DATABASE` (opcional; por defecto `billetera`)
>>>>>>> 37fa596c1605a4d561e0ff704b1b6cba5c5ab799
>>>>>>> develop

El backend tambien usa `APP_ENV`, `SECRET_KEY` y `CORS_ALLOWED_ORIGINS`. En desarrollo, si `SECRET_KEY` esta vacia, el backend genera una clave temporal para ese proceso; los tokens dejan de ser validos al reiniciarlo. Fuera de desarrollo se requiere una clave aleatoria de al menos 32 bytes. No pongas secretos reales en plantillas ni en el control de versiones.

## Aplicar migraciones con Compose

<<<<<<< HEAD
Revisa que el volumen y la base seleccionados sean los esperados. Inicia MySQL, crea y valida un respaldo antes de actualizar, y luego inicia el backend. Compose aplica las migraciones al arrancar el backend:
=======
Revisa que el volumen/base seleccionados sean los esperados. Inicia MySQL, crea un respaldo, ejecuta el servicio del perfil `maintenance` (espera el healthcheck y aplica `upgrade head`) y luego inicia los servicios de la aplicacion:
>>>>>>> develop

```powershell
docker compose up -d db
python scripts\database_backup.py backup
<<<<<<< HEAD
docker compose up -d --build backend
docker compose logs -f backend
```

Comprueba en los logs que Alembic termine correctamente antes de iniciar o exponer el frontend. Para consultar el estado desde el contenedor backend activo:
=======
docker compose --profile maintenance run --rm migrate
docker compose up -d --build
```

El servicio `migrate` no participa en el arranque normal y el backend no queda esperando una migracion automatica. Para consultar el estado desde el contenedor backend activo:
>>>>>>> develop

```powershell
docker compose exec backend alembic -c Backend/alembic.ini current
docker compose exec backend alembic -c Backend/alembic.ini history
```

<<<<<<< HEAD
Para generar una revision, configura una conexion a la base, actualiza primero el codigo/modelos y revisa cada cambio autogenerado antes de aplicarlo:

```powershell
alembic -c Backend/alembic.ini revision --autogenerate -m "descripcion-del-cambio"
=======
Para generar una revision, actualiza primero el codigo/modelos y revisa cada cambio autogenerado antes de aplicarlo:

```powershell
docker compose --profile maintenance run --rm migrate alembic -c Backend/alembic.ini revision --autogenerate -m "descripcion-del-cambio"
>>>>>>> develop
```

No uses `downgrade` como mecanismo de recuperacion de datos. Una migracion hacia atras solo es segura si su codigo restaura correctamente estructura y datos.

## Grafo y datos preexistentes

La revision de conciliacion `a8c139d27e4f` y la revision de asesores `91d8b15c4a22` se crearon como ramas paralelas desde `c4c18e9fa82b`. La revision de merge `d3a6f1c890ab` unifica ambas ramas; por eso `alembic upgrade head` tiene un unico destino. La conciliacion tolera que la columna heredada `asesores_banco.id_usuario` ya haya sido retirada por la otra rama.

El entorno Alembic detiene una actualizacion si encuentra tablas sin historial de migraciones. No se ejecuta `stamp` automaticamente. Para una base existente:

1. Haz y valida un respaldo.
2. Comprueba que las tablas/columnas correspondan a esta aplicacion y que las validaciones de las revisiones puedan cumplirse.
3. Solo si el esquema corresponde al baseline esperado, marca la revision inicial y aplica las restantes:

```powershell
docker compose --profile maintenance run --rm migrate alembic -c Backend/alembic.ini stamp e8698959a1e4
docker compose --profile maintenance run --rm migrate
```

No marques `head` directamente: se omitirian las normalizaciones de datos y la adopcion del esquema. Si cualquier comprobacion falla, detente y revisa el esquema; no elimines ni recrees el volumen para forzar el arranque.

Para una base vacia, omite `stamp` y ejecuta el flujo normal de migracion indicado arriba.

## Instalacion local

Desde la raiz del repositorio, con las dependencias de `Backend/requirements.txt` instaladas:

```powershell
alembic -c Backend/alembic.ini upgrade head
alembic -c Backend/alembic.ini current
alembic -c Backend/alembic.ini history
```

En local, configura `DATABASE_URL` o `DB_HOST=127.0.0.1`, `DB_PORT=3307`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`. No ejecutes estas ordenes contra una base con datos importantes sin respaldo y revision del SQL de cada migracion.
