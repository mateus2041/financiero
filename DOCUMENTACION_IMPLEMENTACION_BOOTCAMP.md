# Adaptación de prácticas de implantación

## Alcance

Se examinó la carpeta `bootcamp` del repositorio de referencia en la rama `main`: diez módulos semanales, 259 archivos en total, con teoría, rúbricas, recursos, diagramas, prácticas de shell/SQL, Compose, muestras de infraestructura como código y plantillas de entrega.

El repositorio de referencia es principalmente material educativo, no una aplicación instalable que pueda integrarse literalmente en la billetera. Se adaptaron de forma original las prácticas operativas pertinentes al stack existente. No se copiaron los textos, rúbricas, diagramas ni proyectos de ejemplo del curso. Los servidores físicos, DNS, proveedores cloud, cuentas de terceros, despliegue en producción, IaC y monitorización externa requieren infraestructura y decisiones que no existen en este repositorio; no se simulan.

## Comparación y estado de adaptación

| Módulo de referencia | Componentes observados | Adaptación en este proyecto |
|---|---|---|
| 01. Plataforma y hardware | Teoría de hardware, RAID, dimensionamiento, contenedores y un script de inspección | Se conserva Docker/Compose como plataforma local existente; la compra o inspección de hardware no aplica al código. |
| 02. Instalación, migración y respaldo | Planes, prácticas SQL, Compose de laboratorio y respaldo/restauración | Se agrega respaldo MySQL comprimido, validación integral del archivo, restauración interactiva con respaldo preventivo y una tarea manual de migración. No se aplican migraciones automáticamente al arrancar. |
| 03. Hosting, dominio y transferencia | DNS, reverse proxy, SFTP y ejercicios de publicación | No se agrega dominio, proxy ni servidor SFTP: no hay un dominio ni entorno de hosting configurado. |
| 04. Despliegue local y nube | Liberaciones, servidor, proveedores cloud y costos | Se mantienen los tres servicios Docker existentes; despliegue cloud y costos quedan pendientes de proveedor y presupuesto. |
| 05. Configuración y pruebas de servidor | Configuración por ambiente, healthchecks y verificación | Se agregan `/health` y `/ready`, healthchecks de Compose, tarea Alembic manual y validación de configuración en CI. |
| 06. Seguridad, usuarios y permisos | Secretos, permisos, roles, respaldo cifrado | Compose exige credenciales MySQL externas; CORS usa orígenes explícitos y JWT usa una clave por ambiente. Se retiraron valores de credenciales de la plantilla frontend. Los respaldos no se cifran automáticamente. |
| 07. CI/CD y monitoreo | Automatización de pruebas, publicación de imágenes, despliegue y monitoreo | CI ejecuta pruebas backend, build frontend y validación Compose. No publica imágenes ni despliega: faltan destino, credenciales y proceso de aprobación. |
| 08. Mantenimiento y soporte | Actualización de dependencias, runbooks y soporte | Se fija la instalación reproducible con `npm ci` y se añade Dependabot para Python, npm y GitHub Actions; el plan operativo requiere responsables y objetivos del negocio. |
| 09. Aceptación y entrega | Pruebas de aceptación, actas y preparación de entrega | Hay pruebas automatizadas y esta documentación de adaptación; aceptación formal depende de criterios y responsables del producto. |
| 10. IaC y automatización (opcional) | Cloud-init, Ansible, OpenTofu y laboratorio | No se añade IaC de un proveedor no seleccionado ni recursos de laboratorio ajenos al sistema financiero. |

## Cambios realizados

### Archivos nuevos

- `.github/workflows/ci.yml`: CI para suite backend, build frontend y sintaxis/variables de Compose.
- `.github/dependabot.yml`: actualización semanal de dependencias Python, npm y GitHub Actions.
- `scripts/database_backup.py`: subcomandos de respaldo gzip, verificación y restauración interactiva. La restauración crea primero una copia preventiva y no continúa si no se escribe la confirmación requerida.
- `Backend/tests/test_operational_health.py`: pruebas de liveness y de indisponibilidad de la base en readiness.
- `Backend/tests/test_database_backup.py`: pruebas de aceptación y rechazo de archivos de respaldo gzip.
- `Backend/tests/test_migration_graph.py`: comprueba que Alembic tenga una sola revisión de destino.
- `Backend/alembic/versions/d3a6f1c890ab_merge_migration_heads.py`: unifica las ramas históricas de migraciones.
- `DOCUMENTACION_IMPLEMENTACION_BOOTCAMP.md`: esta comparación y guía de uso.

### Archivos modificados

- `Backend/main.py`: endpoints no documentados públicamente `/health` (proceso activo) y `/ready` (consulta real a la base; responde 503 si falla).
- `Backend/security.py`: elimina la clave JWT fija; usa secreto configurable y falla en entornos no desarrollados si falta.
- `Backend/alembic/versions/a8c139d27e4f_adopt_existing_schema.py`: tolera que la columna heredada de asesor ya haya sido retirada por la otra rama.
- `compose.yml`: contraseñas parametrizadas, healthchecks, CORS configurable y un perfil explícito de mantenimiento para migraciones.
- `Frontend/.env.example`: ejemplo reducido a la URL pública de API; ya no contiene credenciales de correo/base de datos.
- `Backend/.env.example`: documenta configuración de ambiente, clave JWT y orígenes CORS.
- `Frontend/Dockerfile`: instalación de dependencias reproducible con el lockfile (`npm ci`).
- `.gitignore`: excluye los respaldos generados en `/backups/`.

No se modificaron el `.env` local, la base de datos, los volúmenes existentes ni el cambio previo en `Frontend/src/pages/ListaCuentas.jsx`.

## Configuración

1. Mantén en el `.env` de la raíz las variables locales `MYSQL_ROOT_PASSWORD` y `MYSQL_APP_PASSWORD`; Compose falla explícitamente si faltan. Opcionalmente define `MYSQL_APP_USER` y `MYSQL_DATABASE` (por defecto `app_user` y `billetera`).
2. En producción, configura `APP_ENV=production`, un `SECRET_KEY` aleatorio de al menos 32 bytes y `CORS_ALLOWED_ORIGINS` con orígenes reales.
3. No uses valores del ejemplo en un entorno compartido y no agregues `.env` ni respaldos al control de versiones.
4. La aplicación frontend consume `REACT_APP_API_URL`; copia `Frontend/.env.example` a `Frontend/.env` y ajusta la URL para el entorno. En Docker Compose, el navegador local usa normalmente `http://localhost:8000`.
5. No guardes respaldos sin cifrar en una carpeta compartida. El cifrado en reposo y su custodia dependen de la infraestructura donde se almacenen.

## Ejecución y operación

Desde la raíz, con Docker Desktop/Compose instalado y variables configuradas:

```powershell
docker compose config --quiet
docker compose up --build
```

La API comprueba su proceso en `http://localhost:8000/health` y API más base en `http://localhost:8000/ready`. La interfaz queda en `http://localhost:3000`. Para migrar, crea primero un respaldo e inicia `db`; luego ejecuta `docker compose --profile maintenance run --rm migrate` antes de iniciar la aplicación.

Comandos de respaldo (Python 3.12 o posterior y Docker Compose disponible):

```powershell
python scripts\database_backup.py backup
python scripts\database_backup.py verify backups\<archivo>.sql.gz
python scripts\database_backup.py restore backups\<archivo>.sql.gz
```

El respaldo se escribe como `backups/billetera-<UTC>.sql.gz`. La restauración requiere confirmación literal y crea una copia `antes-de-restaurar-<UTC>.sql.gz` del estado actual antes de importar. Solo restaura archivos confiables y realiza primero un ensayo en una base desechable; un fallo de importación puede dejar cambios parciales. El archivo temporal se elimina si falla la generación del respaldo.

## Pruebas

Localmente:

```powershell
python -m pip install -r Backend\requirements.txt pytest
python -m pytest Backend\tests -q
Set-Location Frontend
npm ci
npm run build
```

La CI ejecuta la suite backend completa en Python 3.12 y Node 22, además de `docker compose config --quiet` con valores ficticios exclusivos del job. `PYTHON_DOTENV_DISABLED` evita cargar secretos locales durante las pruebas. No necesita secretos reales.

### Resultados observados durante esta implementación

- Sintaxis Python y `git diff --check`: correctos.
- Suite backend completa en Python 3.14: **54 pasaron, 0 fallaron** (49 avisos de deprecación de dependencias/código heredado).
- Build de React: correcto; reportó avisos del mapa de fuentes de `html2pdf.js` y de datos Browserslist desactualizados.
- `docker compose config --quiet`: correcto.
- Migración Alembic completa probada en un contenedor MySQL 8.4 y base efímeros: todas las revisiones aplicaron y `current` quedó en `d3a6f1c890ab (head)`. No se usó ni modificó el volumen del proyecto.
- La restauración del respaldo solo se comprobó con pruebas unitarias; no se ejecutó sobre una base de datos.
- La CI configurada usa Python 3.12; no se ejecutó el workflow remoto desde esta sesión.

## Límites pendientes

- Probar los tres healthchecks con el stack de aplicación levantado.
- Ensayar restauración con datos en una base aislada antes de usarla sobre datos que se quieran conservar.
- Ensayar la ruta de adopción `stamp` únicamente sobre una copia real del esquema existente.
- Definir dominio/TLS, despliegue, monitorización, alertas, cifrado/custodia de respaldos y objetivos RPO/RTO con el operador correspondiente.
- La plantilla `Frontend/.env.example` contenía valores que parecían credenciales reales; fueron retirados. Revisar el historial Git y rotar cualquier secreto válido asociado, porque editar el archivo no invalida credenciales emitidas ni las elimina del historial.

La carpeta `bootcamp` de referencia no se replica íntegramente: los documentos del curso y sus ejercicios educativos no forman parte del runtime financiero. La tabla anterior distingue explícitamente las adaptaciones funcionales de los componentes no aplicables o dependientes de infraestructura.
