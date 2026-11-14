# Operación y despliegue

## Alcance del entorno

La configuración actual es de desarrollo local: React sirve la interfaz, FastAPI expone la
API y MySQL mantiene los datos. Compose publica los servicios solo en `127.0.0.1`; el backend
usa `--reload` y el frontend el servidor de desarrollo. No usar esta topología como producción
ni exponer sus puertos directamente a Internet.

## Preparación local

Requisitos: Docker Desktop/Compose, Python 3.12 y Node.js 22 para ejecutar los componentes
fuera de contenedores. En la raíz del repositorio:

```powershell
Copy-Item .env.example .env
```

Reemplace los valores marcador por credenciales aleatorias de desarrollo. Configure una clave
`JWT_SECRET_KEY` de al menos 32 caracteres. No copie secretos a tickets, capturas, terminales
compartidos ni commits. Las variables de correo, IA y registro de asesor son opcionales para
los servicios que las usan. El archivo `.env` está excluido de Git.

Valide la configuración sin imprimir sus valores y arranque:

```powershell
docker compose config --quiet
docker compose up --build -d
docker compose ps
```

La interfaz local queda en `http://127.0.0.1:3000`; la API en
`http://127.0.0.1:8000`. Los endpoints `/health/live` y `/health/ready` permiten comprobar,
respectivamente, el proceso y la conexión a la base. El puerto host de MySQL es 3307 por
defecto. La URL para el navegador se configura mediante `REACT_APP_API_URL`.

## Esquema y migraciones

Compose ejecuta `alembic upgrade head` en el servicio de una sola ejecución `migrate` después
de que MySQL esté saludable y antes de iniciar la API. Si la base está vacía, Alembic crea el
esquema. El backend no debe crear ni alterar tablas al iniciar.

Una base preexistente sin historial Alembic puede detener el servicio de migración. No fuerce
`stamp head` ni borre el volumen: primero respalde la base, compare el esquema y siga el
procedimiento de adopción revisado en [migraciones](../Backend/docs/migraciones.md). No ejecute
`downgrade` contra datos que necesite conservar.

## Respaldo cifrado y restauración de ensayo

Se requiere Docker Compose, `age` y un destinatario público de age. Proteja la clave privada
fuera del repositorio y fuera del servidor que recibe el respaldo; no guarde la clave privada
junto a los archivos cifrados.

```bash
BACKUP_AGE_RECIPIENT='age1...' ./scripts/backup-mysql.sh
```

El script genera un volcado consistente, lo comprime y cifra antes de escribir en `backups/`,
directorio excluido de Git. No hay programación, destino remoto ni política de retención
configurados. El equipo debe definirlos y custodiarlos antes de operar con datos reales.

Para un ensayo, el descifrado usa la identidad age disponible para el usuario que ejecuta
`age`. La restauración exige un nombre nuevo y rechaza bases que ya existan:

```bash
RESTORE_DATABASE=billetera_restore ./scripts/restore-mysql.sh backups/archivo.sql.gz.age
```

Compruebe manualmente las tablas y conteos de la base restaurada, registre el resultado y
elimínela solo mediante el proceso aprobado para datos de prueba. El script no elimina bases
ni modifica una existente; si falla a mitad de camino, la base nueva puede quedar incompleta
y debe investigarse antes de repetir.

## Verificación de requisitos

En un servidor Linux, ejecute `bash scripts/verificar-requisitos.sh`. Los umbrales por defecto
son valores iniciales para esta topología (2 CPU, 4 GiB RAM, 20 GiB libres, Docker 24 y puertos
3307/8000/3000); no son mediciones de carga ni especificación de producción. Ajuste `MIN_CPU`,
`MIN_RAM_MB`, `MIN_DISK_GB` y `PORTS` a una ficha basada en mediciones del ambiente objetivo.
Código de salida 0 significa que pasan los chequeos; 1, que hay requisitos que no cumplen; 2,
que falta un medio para inspeccionar o hay un parámetro inválido. El script no inventa la
salida real del servidor.

## CI, mantenimiento y controles pendientes

`.github/workflows/ci.yml` ejecuta pruebas backend, pruebas frontend y build de producción en
GitHub Actions. No construye ni publica imágenes, no despliega a un hosting y no crea alertas.
Los cambios de dependencias deben pasar por revisión de los manifiestos y lockfiles existentes.

Antes de un despliegue real se requiere, como mínimo: proveedor/servidor y dominio aprobados;
TLS y reverse proxy; secretos del ambiente; CORS con orígenes reales; MySQL aislado de Internet;
migración ensayada; backup cifrado con retención y restauración medida; monitoreo/alertas;
pruebas de autorización y aceptación; y plan de rollback. Ningún costo, RPO/RTO, nivel de
disponibilidad o resultado de aceptación se considera medido o acordado en este repositorio.
