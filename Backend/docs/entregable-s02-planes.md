# Entregable S02 â€” Planes de MigraciÃ³n, Respaldo e InstalaciÃ³n (v0)

> **Estado:** diseÃ±o documental v0. Los comandos de este documento son procedimientos
> propuestos; no se ejecutaron en esta entrega. No hay evidencia de migraciÃ³n ni de una
> restauraciÃ³n real de la base de datos.

| Campo | Valor |
|---|---|
| Proyecto | Billetera Financiera |
| Equipo | Pendiente de confirmar |
| Fecha | 2026-10-20 |
| VersiÃ³n del plan | v0 â€” Semana 02 |

## Contexto tÃ©cnico comprobado

El repositorio contiene una aplicaciÃ³n con frontend React, API FastAPI y base de datos
MySQL. La configuraciÃ³n Docker Compose declara los servicios `db`, `backend` y `frontend`;
el volumen persistente de MySQL se llama `mysql_data`. La configuraciÃ³n observada estÃ¡
orientada al desarrollo local, no acredita un despliegue productivo.

| Componente | Evidencia de versiÃ³n/configuraciÃ³n | ObservaciÃ³n |
|---|---|---|
| API | `Backend/Dockerfile`: imagen `python:3.12-slim`; copia `uv` 0.8.22. `Backend/requirements.txt` incluye FastAPI, Uvicorn, SQLAlchemy y PyMySQL sin fijar versiones. | El Dockerfile tambiÃ©n requiere `pyproject.toml`, `uv.lock` y `.python-version` en la raÃ­z; esos archivos no estÃ¡n presentes. |
| API | `Backend/Dockerfile`: imagen `python:3.12-slim`; copia `uv` 0.8.22 e instala `Backend/requirements.txt`. El archivo incluye FastAPI, Uvicorn, SQLAlchemy y PyMySQL sin fijar versiones. | Las dependencias no estÃ¡n fijadas mediante un lockfile; el resultado de instalaciÃ³n puede variar. |
| Frontend | `Frontend/Dockerfile`: `node:22`. `Frontend/package.json` declara React 19.3.1 y `react-scripts` 5.0.1, entre otras dependencias; `Frontend/package-lock.json` estÃ¡ presente. | Se usa Create React App. Ejecutar `npm ci` desde `Frontend` para respetar el lockfile. |
| Base de datos | `compose.yml`: imagen `mysql:8.4`, puerto local publicado `3307` hacia el puerto interno `3306`. | Persistencia en `mysql_data`; no se observÃ³ un sistema externo de migraciones versionadas. |
| Pruebas | Hay seis archivos bajo `Backend/tests/`; el frontend declara `test` y `build` en `Frontend/package.json`. | No se ejecutaron pruebas como parte de este entregable. `pytest` no aparece en `Backend/requirements.txt`. |
| Integraciones | El backend lee variables para correo, OpenAI y registro de asesores. | La disponibilidad de SMTP/OpenAI y sus secretos depende de la configuraciÃ³n del ambiente. |

**Bloqueo de instalaciÃ³n Docker:** el `Backend/Dockerfile` copia manifiestos de `uv` desde la
raÃ­z del repositorio que no existen en el Ã¡rbol local. Por ello, `docker compose up -d
--build` no debe considerarse un procedimiento verificado y probablemente falla al construir
el backend. El plan propone abajo un arranque de desarrollo con MySQL en Compose y API y
frontend ejecutados desde sus carpetas. Corregir/alinear el Dockerfile y los manifiestos es
un pendiente del proyecto, no una modificaciÃ³n incluida en esta entrega.
**InstalaciÃ³n Docker:** el `Backend/Dockerfile` instala dependencias desde
`Backend/requirements.txt`, que sÃ­ existe en el contexto de construcciÃ³n del repositorio.
El archivo no fija versiones exactas, por lo que la instalaciÃ³n no es reproducible por
versiÃ³n. El flujo Docker debe validarse en el ambiente antes de considerarlo aceptado.

**Seguridad de configuraciÃ³n:** `compose.yml` contiene credenciales de desarrollo escritas
directamente en el archivo, y `Backend/.env.example` contiene valores que tienen formato de
credencial. No se reproducen aquÃ­. Antes de compartir el repositorio o desplegarlo, verificar
si son vÃ¡lidos, reemplazarlos por referencias a un gestor de secretos y rotarlos si
corresponde. No reutilizar valores locales en producciÃ³n. `Frontend/src/services/api.js`
apunta a una direcciÃ³n local fija y no lee una variable de configuraciÃ³n del frontend.

---

## 2. Plan de migraciÃ³n de datos

### 2.1 Objetivo medible

Migrar, en una ventana que aprobarÃ¡n el responsable del negocio y el responsable tÃ©cnico,
los registros vÃ¡lidos del origen legado que se identifique a las tablas correspondientes
del esquema MySQL del proyecto, sin modificar los registros preexistentes del destino. La
migraciÃ³n se acepta cuando se concilie el 100 % de las filas de origen como migradas o
rechazadas con causa registrada y aprobada, no queden errores de integridad referencial, y
los conteos y controles de negocio acordados coincidan. El umbral de filas rechazadas debe
ser aprobado por el responsable del negocio antes de la ventana.

Como presupuesto inicial de planificaciÃ³n, se propone reservar hasta **2 horas** para el
corte; este valor no es una mediciÃ³n ni un compromiso acordado y debe ajustarse al volumen
real y a las pruebas de ensayo. No se deben modificar cuentas, saldos ni movimientos
preexistentes fuera del alcance aprobado.

### 2.2 Inventario de origen y destino

| Origen/destino | Formato | Volumen | Responsable de entrega | Calidad/estado |
|---|---|---:|---|---|
| Sistema legado que contiene usuarios/clientes | No identificado; confirmar exportaciÃ³n, motor, codificaciÃ³n y esquema | Pendiente de medir | Rol pendiente: custodio del sistema legado | No evaluada; solicitar perfilado de nulos, duplicados, formatos y relaciones |
| Datos locales del proyecto | MySQL 8.4 declarado en `compose.yml` | No medido; consultar la instancia del ambiente autorizado | Rol pendiente: responsable de base de datos | No se verificÃ³ el estado de una instancia ni se inspeccionaron datos |
| `mysql_billetera.session.sql` del repositorio | Archivo de sentencias SQL manuales | No representa un conteo de origen | Repositorio del proyecto | No es un volcado integral ni evidencia de la base legado; no usarlo como respaldo o fuente completa |
| Destino | Base `billetera` del servicio Compose `db` | Pendiente de medir | Rol pendiente: responsable de base de datos | Esquema definido principalmente por modelos de `Backend/models.py`; el arranque ejecuta `Base.metadata.create_all()` y contiene cambios condicionales de esquema |

El repositorio no identifica el sistema anterior, dueÃ±o de los datos, archivo de exportaciÃ³n,
volumen o reglas aprobadas de rechazo. Por tanto, no se afirma que exista una migraciÃ³n
ejecutada ni se inventan columnas de origen. Antes del corte se debe recibir una copia
controlada del origen, inventariar sus columnas y conservar un original inmutable para
conciliaciÃ³n.

### 2.3 Estrategia y etapas

- **Estrategia propuesta:** corte Ãºnico (*big bang*) despuÃ©s de un ensayo completo en un
  ambiente aislado. Es la opciÃ³n mÃ¡s sencilla para el estado actual, que no tiene sincronizaciÃ³n
  entre sistemas documentada. Si el perfilado descubre alto volumen, indisponibilidad
  inadmisible o necesidad de operaciÃ³n paralela, detener el plan y evaluar migraciÃ³n por
  fases.
- **Ventana:** propuesta de hasta 2 horas, sujeta a mediciÃ³n de ensayo y aprobaciÃ³n del
  negocio. Durante la ventana se congelan escrituras en el origen y en el destino.
- **Staging:** cargar primero el archivo legado a tablas temporales de staging con campos
  de entrada como texto, conservando el registro original y un identificador de fila. Las
  tablas y el script de staging aÃºn no existen en el repositorio.
- **Etapas:** inventario y perfilado; aprobaciÃ³n de mapeo/rechazos; respaldo verificado del
  destino; ensayo y conteos; congelamiento de escrituras; carga a staging; transformaciÃ³n;
  validaciones; carga transaccional al destino; conciliaciÃ³n; aprobaciÃ³n y reapertura.
- **AprobaciÃ³n:** el responsable del negocio aprueba reglas de rechazo y excepciones; el
  responsable tÃ©cnico ejecuta y valida; el responsable de base de datos conserva el respaldo
  y los registros de ejecuciÃ³n.

### 2.4 Tabla de mapeo propuesta

Los nombres del destino proceden de `Backend/models.py`. Los nombres de origen son
descripciones semÃ¡nticas, no columnas observadas: deben reemplazarse por los nombres reales
tras recibir el inventario del legado. No cargar contraseÃ±as en texto plano ni datos de
tarjeta/cÃ³digo de seguridad sin autorizaciÃ³n, base legal y diseÃ±o de seguridad aprobado.

| Dato semÃ¡ntico de origen (por confirmar) | Destino del proyecto | TransformaciÃ³n propuesta | Regla de rechazo / control |
|---|---|---|---|
| Identificador de persona | `usuario.id_usuario` | Preservar solo si el negocio lo requiere y no colisiona; en otro caso asignar clave destino y mantener tabla de correspondencia | Rechazar duplicados o referencias ambiguas; no sobrescribir un usuario existente |
| Nombre | `usuario.nombre` | Recortar espacios, normalizar espacios consecutivos; conservar caracteres y acentos | Rechazar vacÃ­o o longitud superior a 100 |
| Correo electrÃ³nico | `usuario.email` | Recortar espacios y normalizar mayÃºsculas/minÃºsculas conforme a regla aprobada | Rechazar vacÃ­o, formato invÃ¡lido o duplicado contra origen/destino |
| Documento y tipo de documento | `usuario.documento`, `usuario.id_tipo_doc`; catÃ¡logo destino `tipo_documento` | Normalizar formato solo con regla aprobada; mapear el tipo al catÃ¡logo | Rechazar identificador duplicado, tipo desconocido o referencia inexistente |
| TelÃ©fono/direcciÃ³n y ubicaciÃ³n | `usuario.telefono`, `usuario.direccion`, `usuario.codigo_postal`, `usuario.ciudad`, `usuario.localidad`, `usuario.barrio` | Recortar espacios; validar longitudes de destino y conservar nulos segÃºn contrato | Rechazar valores fuera de longitud o truncamientos; no descartar silenciosamente |
| Rol y topes | `usuario.rol`, `usuario.tope_ahorros`, `usuario.tope_corriente` | Mapear roles permitidos; convertir importes a decimal con separador y escala explÃ­citos | Rechazar rol desconocido, importe no numÃ©rico o negativo no permitido; valores por defecto requieren aprobaciÃ³n |
| Cuenta, tipo, saldo y estado | `cuentas.id_cuenta`, `cuentas.id_usuario`, `cuentas.numero_cuenta`, `cuentas.tipo_cuenta`, `cuentas.saldo`, `cuentas.estado` | Resolver titular mediante correspondencia; decimal exacto; normalizar catÃ¡logo de tipo/estado | Rechazar titular inexistente, tipo/estado desconocido, saldo invÃ¡lido o nÃºmero duplicado; conciliar saldo total por moneda |
| Movimiento/transacciÃ³n | `transacciones.id_transaccion`, `transacciones.id_cuenta`, `transacciones.monto`, `transacciones.tipo`, `transacciones.fecha`, `transacciones.descripcion` | Resolver cuenta y fecha con zona horaria/formato acordados; conservar precisiÃ³n monetaria | Rechazar cuenta inexistente, fecha ilegible o tipo/monto invÃ¡lido; no inferir moneda si el origen no la especifica |
| Tarjeta y datos asociados | Tabla destino `tarjetas` | Pendiente de revisiÃ³n de seguridad; transferir solo los atributos autorizados y necesarios | No migrar cÃ³digo de seguridad/CVV; bloquear el alcance hasta definir tratamiento de PAN, cifrado y requisitos aplicables |
| NotificaciÃ³n, llave/transferencia BRE-B y topes | `notificaciones`, `llaves_breb`, `transferencias_breb`, `control_topes_breb` | Migrar solo si el sistema origen realmente contiene datos equivalentes y existe correspondencia aprobada | Rechazar relaciones huÃ©rfanas o estados desconocidos; no inventar equivalencias de una integraciÃ³n externa |

### 2.5 Validaciones de integridad y conciliaciÃ³n

| ValidaciÃ³n | Consulta o mÃ©todo propuesto | Resultado esperado |
|---|---|---|
| ConciliaciÃ³n por entidad | Contar filas leÃ­das, migradas y rechazadas en staging y en el informe firmado | Para cada entidad: `origen = migradas + rechazadas`; diferencia cero |
| Rechazos | Revisar fila de origen, causa codificada y aprobaciÃ³n del responsable del negocio | 100 % de rechazos explicados; cero rechazos no aprobados |
| Duplicados/Ãºnicos | Comparar correo/documento/nÃºmero de cuenta en origen y destino antes de insertar | Sin colisiones no resueltas; no actualizar registros existentes de forma implÃ­cita |
| Integridad referencial | Consultas anti-join entre IDs de cuenta/usuario/transacciÃ³n y tablas destino | Cero referencias huÃ©rfanas |
| Importes | Comparar conteos y sumas decimales agrupadas por tipo de cuenta/movimiento y moneda, si el origen dispone de moneda | Igualdad exacta dentro de cada grupo acordado |
| Checksum | SHA-256 del archivo de origen inmutable y checksum de registros normalizados por lote, con algoritmo y codificaciÃ³n registrados | El hash del archivo se conserva para probar que se procesÃ³ la misma entrada; por sÃ­ solo no sustituye conteos ni validaciones semÃ¡nticas |
| Muestra funcional | Consultar usuarios/cuentas elegidos por el responsable y validar relaciones, estados y saldos | Muestra aprobada y reproducible; ningÃºn dato sensible en el informe acadÃ©mico |

Las consultas de control para conteos finales se prepararÃ¡n despuÃ©s de confirmar el esquema
real de la base y el origen. No se ejecutarÃ¡n consultas de modificaciÃ³n sobre producciÃ³n
durante la etapa de validaciÃ³n.

### 2.6 Rollback

- **Criterio:** detener y revertir si falla cualquier conciliaciÃ³n obligatoria, aparecen
  referencias huÃ©rfanas, hay cambios no autorizados a datos preexistentes, el porcentaje de
  rechazo supera el umbral aprobado o se excede la ventana sin autorizaciÃ³n para continuar.
- **Antes de abrir el sistema nuevo:** detener API/escrituras, conservar staging y logs,
  descartar el lote de destino solo mediante un procedimiento revisado y recuperar desde el
  respaldo previo Ãºnicamente si se requiere. El mÃ©todo concreto depende de la transacciÃ³n y
  del esquema que se aprueben en el ensayo; no ejecutar `DROP`, `DELETE` o restauraciones
  sobre producciÃ³n como parte de este documento.
- **DespuÃ©s de abrir escrituras:** no volver al sistema anterior sin un plan de conciliaciÃ³n
  de las operaciones nuevas. Congelar escrituras, respaldar el estado actual, decidir con
  el negocio si se corrige hacia adelante o se restaura y recuperan por separado las
  operaciones posteriores al respaldo.
- **Decide:** responsable del negocio junto con responsable tÃ©cnico/operacional; ambos roles
  estÃ¡n pendientes de asignaciÃ³n.
- **Punto de no retorno:** primera escritura de usuarios en el sistema nuevo despuÃ©s de la
  aceptaciÃ³n de corte.

### 2.7 Matriz de riesgos

| Riesgo | Probabilidad inicial | Impacto | MitigaciÃ³n |
|---|---|---|---|
| Origen, formato o volumen distintos a lo supuesto | Alta (inventario pendiente) | Alto | Solicitar exportaciÃ³n y diccionario; perfilar y ensayar con copia antes de fijar ventana |
| Duplicados o datos invÃ¡lidos | Media, sin perfilado | Alto | Staging, reglas aprobadas, reporte de rechazos y conciliaciÃ³n por entidad |
| ColisiÃ³n con registros destino | Media, sin conteos | Alto | Respaldo verificado, comparar claves Ãºnicas y bloquear sobreescrituras |
| PÃ©rdida o corrupciÃ³n durante la carga | Baja tras controles, por verificar | CrÃ­tico | Respaldo previo, transacciÃ³n por lote, verificaciÃ³n de conteos y rollback ensayado |
| ExposiciÃ³n de datos personales/financieros | Media | CrÃ­tico | Datos sintÃ©ticos en pruebas; cifrado, acceso mÃ­nimo, transferencia segura y eliminaciÃ³n controlada de copias temporales |
| Cambio de esquema por arranque de la aplicaciÃ³n | Media | Alto | Revisar `Base.metadata.create_all()` y cambios condicionales del inicio; no usar arranque como sustituto de una migraciÃ³n revisada |
| AprobaciÃ³n de rechazo no disponible durante el corte | Media | Alto | Nombrar aprobador y dejar reglas/umbral firmados antes de iniciar |

---

## 3. Plan de respaldo (v0)

### 3.1 QuÃ© se respalda

| Elemento | UbicaciÃ³n observada/propuesta | MÃ©todo propuesto | Â¿Datos personales o secretos? |
|---|---|---|---|
| Base MySQL `billetera` | Servicio Compose `db`; volumen `mysql_data` | Volcado lÃ³gico completo con `mysqldump`; validar lectura y restaurar en base aparte | SÃ­: usuarios, cuentas, movimientos y potencialmente datos de tarjeta |
| ConfiguraciÃ³n de despliegue | `compose.yml`, Dockerfiles y manifiestos/versiones del repositorio | Git mÃ¡s copia de configuraciÃ³n aprobada; excluir valores secretos | Puede referenciar nombres de variables y estructura |
| Variables y secretos de ejecuciÃ³n | Gestor de secretos externo aÃºn no definido | Respaldo separado y cifrado de claves/configuraciÃ³n estrictamente necesaria; nunca incluir secretos en Git ni en el mismo archivo del volcado | SÃ­, altamente sensibles |
| CÃ³digo fuente y dependencias | Repositorio Git, `Frontend/package-lock.json`, archivos de requisitos | Clon/revisiÃ³n controlada y respaldos del repositorio segÃºn polÃ­tica institucional | No deberÃ­a contener secretos; revisar antes de copiar |
| Archivos subidos por usuarios | No se identificÃ³ directorio de cargas persistentes en el inventario | Confirmar con el equipo; incluir cualquier volumen/directorio persistente que se descubra | Puede contener datos personales |
| ImÃ¡genes Docker | Se reconstruyen desde Dockerfiles e imÃ¡genes base | No se prioriza su respaldo; registrar versiones/digests cuando se defina despliegue | No normalmente |

`mysql_data` es persistencia operativa, no una copia de seguridad independiente. El archivo
`mysql_billetera.session.sql` contiene sentencias de ejemplo, no sustituye un volcado
completo. La lista definitiva de archivos/volÃºmenes persistentes queda pendiente de revisiÃ³n
del equipo.

### 3.2 Objetivos de recuperaciÃ³n propuestos

| RPO | RTO | JustificaciÃ³n y aprobaciÃ³n |
|---|---|---|
| 24 horas como objetivo inicial propuesto | 4 horas como objetivo inicial propuesto | Un respaldo diario limitarÃ­a la pÃ©rdida potencial al intervalo desde el Ãºltimo respaldo; 4 horas es un objetivo por validar mediante simulacro. No hay acuerdo del cliente ni mediciÃ³n de recuperaciÃ³n: ambos valores requieren aprobaciÃ³n y ensayo. |

### 3.3 PolÃ­tica de respaldo propuesta

| Aspecto | DecisiÃ³n v0 |
|---|---|
| Tipo | Completo lÃ³gico diario para la base MySQL; respaldos de configuraciÃ³n separados. No se propone incremental mientras no exista herramienta/operaciÃ³n que gestione y pruebe su cadena. |
| Herramienta | `mysqldump` del contenedor MySQL 8.4; comprobar compatibilidad de la herramienta y motor en el ensayo. |
| Frecuencia | Diario antes del periodo de mayor actividad, hora por acordar. El intervalo deberÃ¡ ser menor o igual al RPO aprobado. |
| RetenciÃ³n | Propuesta GFS: 7 diarios, 4 semanales y 12 mensuales, sujeta a capacidad, privacidad y aprobaciÃ³n. AutomatizaciÃ³n aÃºn no implementada. |
| Copia 1 | Archivo de respaldo en volumen/disco dedicado y con permisos restringidos, separado del volumen de datos `mysql_data`. |
| Copia 2 | Copia cifrada en un segundo medio bajo control administrativo distinto; ubicaciÃ³n por seleccionar. |
| Copia 3 fuera del sitio | Almacenamiento remoto cifrado e independiente del servidor; proveedor y regiÃ³n pendientes de selecciÃ³n/aprobaciÃ³n. |
| Regla 3-2-1 | DiseÃ±o objetivo: original mÃ¡s dos copias, en dos medios distintos y una copia fuera del sitio. No se cumple todavÃ­a con la configuraciÃ³n observada. |
| Cifrado | Cifrar en trÃ¡nsito y reposo antes de copiar fuera del ambiente; herramienta, gestiÃ³n/rotaciÃ³n de claves y custodia pendientes. No guardar la clave junto al archivo. |
| Acceso | Acceso mÃ­nimo; quien administre producciÃ³n no debe poder borrar por sÃ­ solo todas las copias. Habilitar MFA/inmutabilidad cuando el medio elegido lo permita. |
| Responsable | Rol pendiente: administrador de base de datos/operaciones; un segundo rol debe verificar restauraciones y retenciÃ³n. |
| Registro | Registrar fecha, archivo, tamaÃ±o, resultado de validaciÃ³n, hash, versiÃ³n del cliente/servidor y responsable, sin registrar secretos ni datos de clientes. |

### 3.4 Procedimiento de respaldo

Se agregÃ³ `scripts/respaldar.sh`, adaptado para el servicio MySQL de este proyecto. Desde
Bash o WSL2 y la raÃ­z del repositorio puede ejecutarse asÃ­:

```bash
DESTINO="$HOME/backups-billetera" bash scripts/respaldar.sh
```

El script crea un volcado SQL, aplica permisos restrictivos al nuevo directorio y al
archivo, informa el SHA-256 y avisa cuando se supera `MAX_RESPALDOS` (por defecto 7). No
cifra, no copia fuera del sitio y deliberadamente no elimina respaldos; el umbral es una
alerta, no una retenciÃ³n automatizada. Ejecutarlo solo en un ambiente autorizado; el
archivo debe protegerse como datos personales. El script se creÃ³ pero no se ejecutÃ³ en esta
entrega.

El usuario de base configurado para `db` debe tener permisos de lectura y exportaciÃ³n de los
objetos incluidos. El script transmite el volcado directamente a un archivo desde Bash,
evitando que una consola PowerShell convierta la codificaciÃ³n del flujo binario. Antes de
dar el respaldo por vÃ¡lido, comprobar cÃ³digo de salida, tamaÃ±o, SHA-256 y realizar una
restauraciÃ³n de prueba en una base separada. `--single-transaction` ofrece una captura
consistente para tablas transaccionales InnoDB; confirmar el motor de todas las tablas y
acordar cÃ³mo respaldar objetos no transaccionales. No almacenar el volcado en Git, en
`Frontend/build` ni junto a las credenciales.

### 3.5 Procedimiento de restauraciÃ³n â€” ocho pasos

El ejemplo restaura en una base de prueba nueva llamada `billetera_restore`; no elimina ni
sobrescribe la base `billetera`. Requiere un archivo de respaldo revisado y acceso
autorizado. No ejecutar en producciÃ³n sin aprobaciÃ³n de incidente y respaldo del estado
actual.

1. **Detectar y decidir.** El responsable de operaciÃ³n registra incidente y alcance; el
   responsable del negocio autoriza restaurar si la integridad o disponibilidad no se puede
   recuperar de forma segura. Iniciar cronÃ³metro RTO.
2. **Contener.** Suspender escrituras y aislar el servicio afectado. En pruebas, no detener
   servicios compartidos ni afectar usuarios: ejecutar el ensayo en un ambiente aislado.
3. **Elegir el respaldo.** Seleccionar el Ãºltimo archivo anterior al incidente que tenga
   hash registrado y validaciÃ³n/restauraciÃ³n satisfactoria. Definir `BACKUP_FILE` en la
   misma sesiÃ³n Bash/WSL2:

   ```bash
   BACKUP_FILE="$HOME/backups-billetera/<ARCHIVO_RESPALDO_VALIDADO>.sql"
   test -s "$BACKUP_FILE" || { echo "No se encontrÃ³ un respaldo no vacÃ­o" >&2; exit 1; }
   sha256sum -- "$BACKUP_FILE"
   ```

4. **Respaldar el estado actual.** Antes de cambiar una base afectada, crear y validar un
   volcado separado con el procedimiento de 3.4. No sobrescribir ni borrar el original.
5. **Restaurar.** Ensayo no destructivo en una base aparte; la creaciÃ³n falla si el nombre
   ya existe. Antes de importar, un administrador de base de datos debe crear
   `billetera_restore` y conceder temporalmente al usuario configurado para el servicio
   `db` permisos solo sobre esa base. Ejecutar esta preparaciÃ³n mediante el canal
   administrativo aprobado, sin incluir credenciales en el repositorio:

   ```sql
   CREATE DATABASE billetera_restore CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
   GRANT ALL PRIVILEGES ON billetera_restore.* TO '<USUARIO_DB>'@'<HOST_AUTORIZADO>';
   ```

   Si la base de prueba ya existe, detenerse y solicitar un nombre de prueba nuevo; no
   eliminarla. Sustituir el nombre de forma consistente en los comandos de creaciÃ³n,
   concesiÃ³n e importaciÃ³n.
   DespuÃ©s, copiar el archivo al contenedor MySQL e importarlo desde Bash/WSL2:

   ```bash
   docker cp "$BACKUP_FILE" mysql_billetera:/tmp/billetera_restore_test.sql

   docker compose exec -T db sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" billetera_restore < /tmp/billetera_restore_test.sql'
   ```

   Si el comando devuelve un error, detenerse y no considerar restaurada la base. El usuario
   debe tener permisos sobre la base aislada; no colocar su contraseÃ±a en el comando:
   `MYSQL_USER` y `MYSQL_PASSWORD` son variables internas del servicio Compose.

   Este ejemplo deja intactas las bases fuente y conserva la base de ensayo para comparar.
   Confirmar primero que `billetera_restore` no exista. No usar `docker compose down -v`.
6. **Verificar.** Comparar hash del archivo, conteos por tabla, relaciones y consultas de
   negocio acordadas entre el origen capturado y la base restaurada; ejecutar el smoke test
   de lectura y registrar tiempo. Una base restaurada no se acepta solo porque el comando
   terminÃ³ con cÃ³digo cero.
7. **Reabrir y comunicar.** Solo el responsable autorizado reabre el servicio tras validar
   la aplicaciÃ³n. Informar ventana, alcance y pÃ©rdida potencial conforme al RPO. Para un
   ensayo, no reabrir trÃ¡fico productivo ni declarar recuperaciÃ³n real.
8. **Registrar.** Anotar inicio/fin, RTO medido, nombre/hash del respaldo, errores,
   diferencias, aprobadores y acciones de seguimiento. Revocar los permisos temporales de
   la base de prueba. Proteger el informe y no adjuntar datos personales.

### 3.6 Evidencia de restauraciÃ³n

| Tabla del esquema | Filas en origen al ejecutar la prueba | Filas en base restaurada | Estado |
|---|---:|---:|---|
| `usuario` | No medido | No medido | Pendiente: ensayo real |
| `cuentas` | No medido | No medido | Pendiente: ensayo real |
| `transacciones` | No medido | No medido | Pendiente: ensayo real |
| `notificaciones` | No medido | No medido | Pendiente: ensayo real |
| Otras tablas (`Backend/models.py`) | No medido | No medido | Pendiente: inventariar y comparar todas |

**Tiempo de restauraciÃ³n medido:** no medido; no se ejecutÃ³ una restauraciÃ³n en esta
entrega. No presentar el procedimiento de 3.5 como evidencia de ejecuciÃ³n.

Para obtener conteos durante el ensayo autorizado, usar consultas de solo lectura en ambas
bases, adaptando la lista a las tablas realmente creadas:

```sql
SELECT COUNT(*) FROM usuario;
SELECT COUNT(*) FROM cuentas;
SELECT COUNT(*) FROM transacciones;
SELECT COUNT(*) FROM notificaciones;
```

### 3.7 Calendario de pruebas

| Prueba | Frecuencia propuesta | Responsable |
|---|---|---|
| ValidaciÃ³n de archivo, cÃ³digo de salida, tamaÃ±o y hash | En cada respaldo diario | Operador de respaldo |
| RestauraciÃ³n completa en base aparte y conciliaciÃ³n de conteos | Semanal durante la puesta a punto; mensual cuando la operaciÃ³n estÃ© estable | Operador distinto del responsable de producciÃ³n |
| Simulacro en ambiente limpio y mediciÃ³n del RTO | Trimestral y antes de una entrega importante | Equipo tÃ©cnico y responsable del negocio |
| RevisiÃ³n de retenciÃ³n, permisos y copia fuera del sitio | Mensual | Responsable de operaciones/seguridad |

Las frecuencias son una propuesta; el calendario y RPO/RTO deben aprobarse con el negocio.

---

## 5. Plan de instalaciÃ³n (v0)

| # | SecciÃ³n | Contenido |
|---:|---|---|
| 1 | Alcance | Instalar para desarrollo local la API FastAPI, el frontend React y MySQL 8.4 de `compose.yml`. No incluye publicaciÃ³n productiva, dominio, HTTPS, correo/OpenAI ni operaciÃ³n financiera real. Versiones liberadas y despliegue en nube quedan fuera de esta v0. |
| 2 | Ambientes | Desarrollo local: servicio `db` en Compose; API en `Backend.main:app`; frontend desde `Frontend`. No se encontrÃ³ configuraciÃ³n desplegada de pruebas/producciÃ³n ni separaciÃ³n formal de ambientes. Crear ambientes aislados antes de usar datos reales. |
| 3 | Roles | Ejecutor: desarrollador/operador autorizado. Aprobador de datos y cambios: responsable del negocio. Validador: otro integrante/equipo. Administrador de secretos/base: rol de operaciones. AsignaciÃ³n nominal pendiente; este plan usa solo roles. |
| 4 | Prerrequisitos | Docker Engine y plugin Compose; Python 3.12 para alinearse con el Dockerfile; Node.js 22 para alinearse con el Dockerfile frontend; npm compatible; Git; PowerShell. Requiere puertos locales 3307, 8000 y 3000 disponibles, conectividad a paquetes y espacio para imÃ¡genes, dependencias y datos. EstimaciÃ³n inicial de desarrollo: 2 CPU, 8 GB RAM y 20 GB libres; no medida ni validada. La ficha tÃ©cnica de Semana 1 no estÃ¡ en este repositorio: confirmar versiones, capacidad y accesos antes de aceptaciÃ³n. |
| 5 | PreparaciÃ³n | Confirmar rama/versiÃ³n, ventana y responsable; leer configuraciÃ³n sin publicar valores; revisar secretos y rotarlos si fueran vigentes; confirmar respaldo probado antes de migrar; verificar origen, volumen y disponibilidad de base. No ejecutar `down -v`, comandos de limpieza ni migraciones sobre datos que deban conservarse. |
| 6 | Procedimiento | Pasos locales reproducibles abajo. El arranque integral por Docker queda bloqueado por manifiestos `uv` ausentes que exige `Backend/Dockerfile`; registrar la correcciÃ³n del Dockerfile/manifiestos como pendiente. |
| 6 | Procedimiento | Pasos locales reproducibles abajo. El Dockerfile instala las dependencias desde `Backend/requirements.txt`; el build y el arranque integral deben verificarse en el ambiente antes de aceptarlos. |
| 7 | MigraciÃ³n de datos | Seguir exclusivamente la secciÃ³n 2. No hay dataset de origen ni script de migraciÃ³n identificado; no se ejecutarÃ¡ migraciÃ³n hasta completar inventario, mapeo aprobado y respaldo verificado. |
| 8 | VerificaciÃ³n | Confirmar estado `healthy` de MySQL, respuesta de `/test-db`, documentaciÃ³n OpenAPI, carga frontend, pruebas backend disponibles y build frontend. La ruta API configurada en `Frontend/src/services/api.js` tiene un prefijo `/api` que debe contrastarse con las rutas observadas en `Backend/main.py`; no asumir integraciÃ³n end-to-end aceptada. |
| 9 | Rollback | Antes de datos nuevos, detener procesos y volver al artefacto previo preservando volumen. DespuÃ©s de escrituras, congelar, respaldar estado actual y seguir rollback/conciliaciÃ³n de 2.6 y restauraciÃ³n de 3.5. No borrar el volumen `mysql_data`. |
| 10 | Cronograma | EstimaciÃ³n inicial para desarrollo: prerequisitos 20 min; iniciar MySQL 10 min; instalar API 30â€“60 min segÃºn descarga; instalar frontend 15â€“30 min; smoke tests 20 min. Total estimado 1 h 35 minâ€“2 h 20 min, no medido. La ventana de migraciÃ³n/corte tiene estimaciÃ³n independiente en 2.3. |

### Procedimiento local de instalaciÃ³n

Los pasos siguientes se documentan para Windows/PowerShell, acorde al entorno de trabajo.
Los valores entre `<...>` son marcadores: obtenerlos de un canal seguro; no guardar
contraseÃ±as en el historial, documentos ni repositorio.

| # | AcciÃ³n | Comando | Resultado esperado / manejo de fallo |
|---:|---|---|---|
| 1 | Confirmar requisitos de herramientas | `docker --version`<br>`docker compose version`<br>`py -3.12 --version`<br>`node --version`<br>`npm --version` | Versiones disponibles; Docker Compose funcional, Python 3.12 y Node 22. Si falta una herramienta, instalarla desde fuente oficial y repetir antes de continuar. |
| 2 | Iniciar solo MySQL sin reconstruir ni borrar volÃºmenes | `docker compose up -d db` | Termina sin error y crea/inicia `db`; no ejecuta la construcciÃ³n defectuosa del backend ni elimina `mysql_data`. |
| 3 | Verificar salud de MySQL | `docker compose ps db` | El servicio debe mostrar `healthy`. Si no, revisar `docker compose logs --tail 100 db`; no borrar el volumen como intento de soluciÃ³n. |
| 4 | Crear entorno virtual e instalar dependencias backend | Desde la raÃ­z:<br>`py -3.12 -m venv .venv-backend`<br>`.\\.venv-backend\\Scripts\\Activate.ps1`<br>`python -m pip install --upgrade pip`<br>`python -m pip install -r Backend\\requirements.txt` | InstalaciÃ³n finaliza sin errores. Si falta un paquete, registrar el error y actualizar/manifiesto aprobado; `requirements.txt` no fija versiones, por lo que esta instalaciÃ³n aÃºn no es reproducible por versiÃ³n. |
| 5 | Configurar conexiÃ³n del backend al MySQL local | En la misma sesiÃ³n PowerShell, cargar desde un gestor seguro los valores:<br>`$env:DB_HOST = "localhost"`<br>`$env:DB_PORT = "3307"`<br>`$env:DB_NAME = "billetera"`<br>`$env:DB_USER = "<USUARIO_DB>"`<br>`$env:DB_PASSWORD = "<SECRETO_DB>"` | Variables presentes solo en la sesiÃ³n actual. Usar credenciales autorizadas compatibles con el servicio local; no imprimirlas ni sustituir los marcadores por valores reales en este documento. La aplicaciÃ³n usa SQLite si no recibe una URL o el conjunto completo de variables, por lo que confirmar que se conectÃ³ al motor esperado. |
| 6 | Ejecutar API en ventana PowerShell dedicada | Desde la raÃ­z, con el entorno virtual activo:<br>`python -m uvicorn Backend.main:app --host 127.0.0.1 --port 8000 --reload` | Uvicorn informa que escucha localmente en el puerto 8000. En el inicio, `Backend/main.py` ejecuta `Base.metadata.create_all()` y cambios condicionales de esquema; usar solo una base de desarrollo respaldada y no iniciar sobre producciÃ³n sin revisiÃ³n. |
| 7 | Instalar frontend segÃºn lockfile | En otra ventana:<br>`Set-Location Frontend`<br>`npm ci` | InstalaciÃ³n termina usando `Frontend/package-lock.json`. Si el lockfile no concuerda con `package.json`, detenerse y reconciliar manifiestos en una tarea separada. |
| 8 | Iniciar frontend | Desde `Frontend`:<br>`npm start` | Create React App inicia en el puerto 3000. La API usa URL local fija; si la interfaz no conecta, revisar consola de navegador, CORS y la diferencia del prefijo `/api` antes de declarar correcto el flujo. |
| 9 | Verificar API y base | En PowerShell:<br>`Invoke-RestMethod http://127.0.0.1:8000/test-db`<br>`Invoke-WebRequest http://127.0.0.1:8000/docs -UseBasicParsing` | `/test-db` responde la comprobaciÃ³n `SELECT 1`; `/docs` devuelve HTTP exitoso. Si falla, revisar logs de Uvicorn y credenciales de base sin copiarlas a tickets. |
| 10 | Ejecutar verificaciones de calidad disponibles | Desde la raÃ­z, si `pytest` estÃ¡ instalado:<br>`python -m pytest Backend\\tests -q`<br><br>En otra sesiÃ³n desde `Frontend`:<br>`npm run build` | Registrar comando, fecha y resultado. `pytest` no figura en `Backend/requirements.txt`; instalarlo en entorno de desarrollo de forma aprobada si falta. El build no prueba integraciÃ³n API. Ninguna de estas pruebas se ejecutÃ³ al elaborar este documento. |

### Procedimiento Docker pendiente de habilitaciÃ³n

Una vez que el equipo alinee `Backend/Dockerfile` con manifiestos que existan y estÃ©n
versionados, el flujo objetivo puede ser:
### Procedimiento Docker (requiere verificaciÃ³n)

El Dockerfile instala las dependencias declaradas en `Backend/requirements.txt`. Para
construir e iniciar los servicios:

```powershell
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

No ejecutar como criterio de aceptaciÃ³n todavÃ­a: `pyproject.toml`, `uv.lock` y
`.python-version` requeridos por el Dockerfile no estÃ¡n presentes en la raÃ­z. No se cambiÃ³
esa configuraciÃ³n en este entregable.
Registrar el resultado del build, el estado `healthy` de MySQL y las verificaciones de API
antes de considerar aceptado el procedimiento. Las dependencias de `requirements.txt` no
estÃ¡n fijadas exactamente.

### Cronograma de una ventana de migraciÃ³n/puesta en marcha

| Fase | DuraciÃ³n estimada inicial | Acumulado | Estado |
|---|---:|---:|---|
| Aviso, autorizaciÃ³n y congelamiento de escrituras | 15 min | 0:15 | Propuesto; responsables pendientes |
| Respaldo previo y lectura/hash | 20 min | 0:35 | No ejecutado; duraciÃ³n por medir |
| PreparaciÃ³n/validaciÃ³n de servicios | 30 min | 1:05 | No ejecutado; Compose backend bloqueado |
| Carga, transformaciones y conciliaciÃ³n | 40 min | 1:45 | No estimable sin volumen/origen; presupuesto provisional |
| Pruebas de verificaciÃ³n y decisiÃ³n de corte | 20 min | 2:05 | Propuesto |
| Margen para imprevistos | 55 min | 3:00 | Reserva propuesta, no aprobada |

**Punto de no retorno:** primera escritura de usuarios en el sistema nuevo despuÃ©s de la
aceptaciÃ³n formal. Antes de ese punto, detener el corte y conservar el origen; despuÃ©s,
requerir conciliaciÃ³n de las nuevas operaciones y procedimiento de 2.6.

---

## Anexo â€” Plan de validaciÃ³n, evidencias y pendientes

### Lista de comprobaciÃ³n del entregable

- [x] Secciones 2, 3 y 5 con la estructura y numeraciÃ³n de la plantilla S02.
- [x] Plan de migraciÃ³n: objetivo medible, inventario, estrategia, mapeo, validaciones,
      rollback y riesgos; los datos que no existen en el repositorio quedan seÃ±alados.
- [x] Plan de respaldo: inventario mÃ¡s allÃ¡ de la base, RPO/RTO propuestos, retenciÃ³n,
      diseÃ±o 3-2-1, cifrado, comandos de respaldo/restauraciÃ³n en ocho pasos y calendario.
- [x] Plan de instalaciÃ³n con las diez secciones, pasos con acciÃ³n/comando/resultado y
      cronograma con punto de no retorno.
- [x] Comandos alineados a PowerShell, MySQL, Docker Compose, Python y npm observados.
- [x] No se incluyeron contraseÃ±as, tokens, direcciones de producciÃ³n ni valores secretos.
- [ ] Incorporar ficha tÃ©cnica de Semana 1 aprobada; no existe en el repositorio abierto.
- [ ] Identificar y perfilar sistema origen, volumen, reglas de calidad y responsable.
- [ ] Obtener aprobaciÃ³n de reglas de rechazo, ventana, RPO/RTO y retenciÃ³n del negocio.
- [x] Crear `scripts/respaldar.sh` para MySQL, con validaciÃ³n de salida y alerta de umbral de
      retenciÃ³n sin borrado automÃ¡tico.
- [ ] Ejecutar y evidenciar respaldo y restauraciÃ³n de la base del proyecto en una base
      aparte; no se ejecutÃ³ ni midiÃ³ en esta entrega.
- [ ] Resolver el Dockerfile/manifiestos de backend y comprobar despliegue integral.
- [ ] Comprobar build Docker y despliegue integral en el ambiente autorizado.
- [ ] Definir el tratamiento seguro de tarjetas, secretos, archivos persistentes y copias
      fuera del sitio.
- [ ] Confirmar que rutas API y URL base del frontend son compatibles mediante prueba
      integrada.

### Evidencias que se deben recopilar en la siguiente ejecuciÃ³n

| Evidencia | Comando/medio | Resultado que debe registrarse |
|---|---|---|
| Versiones y configuraciÃ³n del ambiente | Comandos de paso 1 y `docker compose config --quiet` | Versiones exactas, configuraciÃ³n sin secretos y resultado de salida |
| Salud de MySQL | `docker compose ps db`; logs acotados si falla | Estado `healthy`, hora y versiÃ³n de imagen |
| Archivo de respaldo | Procedimiento 3.4 | Ruta protegida, tamaÃ±o, SHA-256 y cÃ³digo de salida |
| RestauraciÃ³n aislada | Procedimiento 3.5 | Conteos por tabla antes/despuÃ©s, integridad referencial y tiempo RTO medido |
| Pruebas de backend/frontend | `python -m pytest Backend\\tests -q`; `npm run build` | Resultado real, fallas y versiones ejecutadas |
| MigraciÃ³n | Acta de corte, conteos origen/migrados/rechazados y reglas aprobadas | Diferencias cero o excepciones aprobadas y firma de responsables |

La existencia de este plan y los comandos escritos no constituyen evidencia de que la
instalaciÃ³n, el respaldo, la restauraciÃ³n, las pruebas o una migraciÃ³n hayan sido ejecutados.

