# Entregable S02 — Planes de Migración, Respaldo e Instalación (v0)

> **Estado:** diseño documental v0. Los comandos de este documento son procedimientos
> propuestos; no se ejecutaron en esta entrega. No hay evidencia de migración ni de una
> restauración real de la base de datos.

| Campo | Valor |
|---|---|
| Proyecto | Billetera Financiera |
| Equipo | Pendiente de confirmar |
| Fecha | 2026-10-20 |
| Versión del plan | v0 — Semana 02 |

## Contexto técnico comprobado

El repositorio contiene una aplicación con frontend React, API FastAPI y base de datos
MySQL. La configuración Docker Compose declara los servicios `db`, `backend` y `frontend`;
el volumen persistente de MySQL se llama `mysql_data`. La configuración observada está
orientada al desarrollo local, no acredita un despliegue productivo.

| Componente | Evidencia de versión/configuración | Observación |
|---|---|---|
<<<<<<< HEAD
| API | `Backend/Dockerfile`: imagen `python:3.12-slim`; copia `uv` 0.8.22. `Backend/requirements.txt` incluye FastAPI, Uvicorn, SQLAlchemy y PyMySQL sin fijar versiones. | El Dockerfile también requiere `pyproject.toml`, `uv.lock` y `.python-version` en la raíz; esos archivos no están presentes. |
=======
| API | `Backend/Dockerfile`: imagen `python:3.12-slim`; copia `uv` 0.8.22 e instala `Backend/requirements.txt`. El archivo incluye FastAPI, Uvicorn, SQLAlchemy y PyMySQL sin fijar versiones. | Las dependencias no están fijadas mediante un lockfile; el resultado de instalación puede variar. |
>>>>>>> origin/feat/administrator-management-and-code-corrections
| Frontend | `Frontend/Dockerfile`: `node:22`. `Frontend/package.json` declara React 19.3.1 y `react-scripts` 5.0.1, entre otras dependencias; `Frontend/package-lock.json` está presente. | Se usa Create React App. Ejecutar `npm ci` desde `Frontend` para respetar el lockfile. |
| Base de datos | `compose.yml`: imagen `mysql:8.4`, puerto local publicado `3307` hacia el puerto interno `3306`. | Persistencia en `mysql_data`; no se observó un sistema externo de migraciones versionadas. |
| Pruebas | Hay seis archivos bajo `Backend/tests/`; el frontend declara `test` y `build` en `Frontend/package.json`. | No se ejecutaron pruebas como parte de este entregable. `pytest` no aparece en `Backend/requirements.txt`. |
| Integraciones | El backend lee variables para correo, OpenAI y registro de asesores. | La disponibilidad de SMTP/OpenAI y sus secretos depende de la configuración del ambiente. |

<<<<<<< HEAD
**Bloqueo de instalación Docker:** el `Backend/Dockerfile` copia manifiestos de `uv` desde la
raíz del repositorio que no existen en el árbol local. Por ello, `docker compose up -d
--build` no debe considerarse un procedimiento verificado y probablemente falla al construir
el backend. El plan propone abajo un arranque de desarrollo con MySQL en Compose y API y
frontend ejecutados desde sus carpetas. Corregir/alinear el Dockerfile y los manifiestos es
un pendiente del proyecto, no una modificación incluida en esta entrega.
=======
**Instalación Docker:** el `Backend/Dockerfile` instala dependencias desde
`Backend/requirements.txt`, que sí existe en el contexto de construcción del repositorio.
El archivo no fija versiones exactas, por lo que la instalación no es reproducible por
versión. El flujo Docker debe validarse en el ambiente antes de considerarlo aceptado.
>>>>>>> origin/feat/administrator-management-and-code-corrections

**Seguridad de configuración:** `compose.yml` contiene credenciales de desarrollo escritas
directamente en el archivo, y `Backend/.env.example` contiene valores que tienen formato de
credencial. No se reproducen aquí. Antes de compartir el repositorio o desplegarlo, verificar
si son válidos, reemplazarlos por referencias a un gestor de secretos y rotarlos si
corresponde. No reutilizar valores locales en producción. `Frontend/src/services/api.js`
apunta a una dirección local fija y no lee una variable de configuración del frontend.

---

## 2. Plan de migración de datos

### 2.1 Objetivo medible

Migrar, en una ventana que aprobarán el responsable del negocio y el responsable técnico,
los registros válidos del origen legado que se identifique a las tablas correspondientes
del esquema MySQL del proyecto, sin modificar los registros preexistentes del destino. La
migración se acepta cuando se concilie el 100 % de las filas de origen como migradas o
rechazadas con causa registrada y aprobada, no queden errores de integridad referencial, y
los conteos y controles de negocio acordados coincidan. El umbral de filas rechazadas debe
ser aprobado por el responsable del negocio antes de la ventana.

Como presupuesto inicial de planificación, se propone reservar hasta **2 horas** para el
corte; este valor no es una medición ni un compromiso acordado y debe ajustarse al volumen
real y a las pruebas de ensayo. No se deben modificar cuentas, saldos ni movimientos
preexistentes fuera del alcance aprobado.

### 2.2 Inventario de origen y destino

| Origen/destino | Formato | Volumen | Responsable de entrega | Calidad/estado |
|---|---|---:|---|---|
| Sistema legado que contiene usuarios/clientes | No identificado; confirmar exportación, motor, codificación y esquema | Pendiente de medir | Rol pendiente: custodio del sistema legado | No evaluada; solicitar perfilado de nulos, duplicados, formatos y relaciones |
| Datos locales del proyecto | MySQL 8.4 declarado en `compose.yml` | No medido; consultar la instancia del ambiente autorizado | Rol pendiente: responsable de base de datos | No se verificó el estado de una instancia ni se inspeccionaron datos |
| `mysql_billetera.session.sql` del repositorio | Archivo de sentencias SQL manuales | No representa un conteo de origen | Repositorio del proyecto | No es un volcado integral ni evidencia de la base legado; no usarlo como respaldo o fuente completa |
| Destino | Base `billetera` del servicio Compose `db` | Pendiente de medir | Rol pendiente: responsable de base de datos | Esquema definido principalmente por modelos de `Backend/models.py`; el arranque ejecuta `Base.metadata.create_all()` y contiene cambios condicionales de esquema |

El repositorio no identifica el sistema anterior, dueño de los datos, archivo de exportación,
volumen o reglas aprobadas de rechazo. Por tanto, no se afirma que exista una migración
ejecutada ni se inventan columnas de origen. Antes del corte se debe recibir una copia
controlada del origen, inventariar sus columnas y conservar un original inmutable para
conciliación.

### 2.3 Estrategia y etapas

- **Estrategia propuesta:** corte único (*big bang*) después de un ensayo completo en un
  ambiente aislado. Es la opción más sencilla para el estado actual, que no tiene sincronización
  entre sistemas documentada. Si el perfilado descubre alto volumen, indisponibilidad
  inadmisible o necesidad de operación paralela, detener el plan y evaluar migración por
  fases.
- **Ventana:** propuesta de hasta 2 horas, sujeta a medición de ensayo y aprobación del
  negocio. Durante la ventana se congelan escrituras en el origen y en el destino.
- **Staging:** cargar primero el archivo legado a tablas temporales de staging con campos
  de entrada como texto, conservando el registro original y un identificador de fila. Las
  tablas y el script de staging aún no existen en el repositorio.
- **Etapas:** inventario y perfilado; aprobación de mapeo/rechazos; respaldo verificado del
  destino; ensayo y conteos; congelamiento de escrituras; carga a staging; transformación;
  validaciones; carga transaccional al destino; conciliación; aprobación y reapertura.
- **Aprobación:** el responsable del negocio aprueba reglas de rechazo y excepciones; el
  responsable técnico ejecuta y valida; el responsable de base de datos conserva el respaldo
  y los registros de ejecución.

### 2.4 Tabla de mapeo propuesta

Los nombres del destino proceden de `Backend/models.py`. Los nombres de origen son
descripciones semánticas, no columnas observadas: deben reemplazarse por los nombres reales
tras recibir el inventario del legado. No cargar contraseñas en texto plano ni datos de
tarjeta/código de seguridad sin autorización, base legal y diseño de seguridad aprobado.

| Dato semántico de origen (por confirmar) | Destino del proyecto | Transformación propuesta | Regla de rechazo / control |
|---|---|---|---|
| Identificador de persona | `usuario.id_usuario` | Preservar solo si el negocio lo requiere y no colisiona; en otro caso asignar clave destino y mantener tabla de correspondencia | Rechazar duplicados o referencias ambiguas; no sobrescribir un usuario existente |
| Nombre | `usuario.nombre` | Recortar espacios, normalizar espacios consecutivos; conservar caracteres y acentos | Rechazar vacío o longitud superior a 100 |
| Correo electrónico | `usuario.email` | Recortar espacios y normalizar mayúsculas/minúsculas conforme a regla aprobada | Rechazar vacío, formato inválido o duplicado contra origen/destino |
| Documento y tipo de documento | `usuario.documento`, `usuario.id_tipo_doc`; catálogo destino `tipo_documento` | Normalizar formato solo con regla aprobada; mapear el tipo al catálogo | Rechazar identificador duplicado, tipo desconocido o referencia inexistente |
| Teléfono/dirección y ubicación | `usuario.telefono`, `usuario.direccion`, `usuario.codigo_postal`, `usuario.ciudad`, `usuario.localidad`, `usuario.barrio` | Recortar espacios; validar longitudes de destino y conservar nulos según contrato | Rechazar valores fuera de longitud o truncamientos; no descartar silenciosamente |
| Rol y topes | `usuario.rol`, `usuario.tope_ahorros`, `usuario.tope_corriente` | Mapear roles permitidos; convertir importes a decimal con separador y escala explícitos | Rechazar rol desconocido, importe no numérico o negativo no permitido; valores por defecto requieren aprobación |
| Cuenta, tipo, saldo y estado | `cuentas.id_cuenta`, `cuentas.id_usuario`, `cuentas.numero_cuenta`, `cuentas.tipo_cuenta`, `cuentas.saldo`, `cuentas.estado` | Resolver titular mediante correspondencia; decimal exacto; normalizar catálogo de tipo/estado | Rechazar titular inexistente, tipo/estado desconocido, saldo inválido o número duplicado; conciliar saldo total por moneda |
| Movimiento/transacción | `transacciones.id_transaccion`, `transacciones.id_cuenta`, `transacciones.monto`, `transacciones.tipo`, `transacciones.fecha`, `transacciones.descripcion` | Resolver cuenta y fecha con zona horaria/formato acordados; conservar precisión monetaria | Rechazar cuenta inexistente, fecha ilegible o tipo/monto inválido; no inferir moneda si el origen no la especifica |
| Tarjeta y datos asociados | Tabla destino `tarjetas` | Pendiente de revisión de seguridad; transferir solo los atributos autorizados y necesarios | No migrar código de seguridad/CVV; bloquear el alcance hasta definir tratamiento de PAN, cifrado y requisitos aplicables |
| Notificación, llave/transferencia BRE-B y topes | `notificaciones`, `llaves_breb`, `transferencias_breb`, `control_topes_breb` | Migrar solo si el sistema origen realmente contiene datos equivalentes y existe correspondencia aprobada | Rechazar relaciones huérfanas o estados desconocidos; no inventar equivalencias de una integración externa |

### 2.5 Validaciones de integridad y conciliación

| Validación | Consulta o método propuesto | Resultado esperado |
|---|---|---|
| Conciliación por entidad | Contar filas leídas, migradas y rechazadas en staging y en el informe firmado | Para cada entidad: `origen = migradas + rechazadas`; diferencia cero |
| Rechazos | Revisar fila de origen, causa codificada y aprobación del responsable del negocio | 100 % de rechazos explicados; cero rechazos no aprobados |
| Duplicados/únicos | Comparar correo/documento/número de cuenta en origen y destino antes de insertar | Sin colisiones no resueltas; no actualizar registros existentes de forma implícita |
| Integridad referencial | Consultas anti-join entre IDs de cuenta/usuario/transacción y tablas destino | Cero referencias huérfanas |
| Importes | Comparar conteos y sumas decimales agrupadas por tipo de cuenta/movimiento y moneda, si el origen dispone de moneda | Igualdad exacta dentro de cada grupo acordado |
| Checksum | SHA-256 del archivo de origen inmutable y checksum de registros normalizados por lote, con algoritmo y codificación registrados | El hash del archivo se conserva para probar que se procesó la misma entrada; por sí solo no sustituye conteos ni validaciones semánticas |
| Muestra funcional | Consultar usuarios/cuentas elegidos por el responsable y validar relaciones, estados y saldos | Muestra aprobada y reproducible; ningún dato sensible en el informe académico |

Las consultas de control para conteos finales se prepararán después de confirmar el esquema
real de la base y el origen. No se ejecutarán consultas de modificación sobre producción
durante la etapa de validación.

### 2.6 Rollback

- **Criterio:** detener y revertir si falla cualquier conciliación obligatoria, aparecen
  referencias huérfanas, hay cambios no autorizados a datos preexistentes, el porcentaje de
  rechazo supera el umbral aprobado o se excede la ventana sin autorización para continuar.
- **Antes de abrir el sistema nuevo:** detener API/escrituras, conservar staging y logs,
  descartar el lote de destino solo mediante un procedimiento revisado y recuperar desde el
  respaldo previo únicamente si se requiere. El método concreto depende de la transacción y
  del esquema que se aprueben en el ensayo; no ejecutar `DROP`, `DELETE` o restauraciones
  sobre producción como parte de este documento.
- **Después de abrir escrituras:** no volver al sistema anterior sin un plan de conciliación
  de las operaciones nuevas. Congelar escrituras, respaldar el estado actual, decidir con
  el negocio si se corrige hacia adelante o se restaura y recuperan por separado las
  operaciones posteriores al respaldo.
- **Decide:** responsable del negocio junto con responsable técnico/operacional; ambos roles
  están pendientes de asignación.
- **Punto de no retorno:** primera escritura de usuarios en el sistema nuevo después de la
  aceptación de corte.

### 2.7 Matriz de riesgos

| Riesgo | Probabilidad inicial | Impacto | Mitigación |
|---|---|---|---|
| Origen, formato o volumen distintos a lo supuesto | Alta (inventario pendiente) | Alto | Solicitar exportación y diccionario; perfilar y ensayar con copia antes de fijar ventana |
| Duplicados o datos inválidos | Media, sin perfilado | Alto | Staging, reglas aprobadas, reporte de rechazos y conciliación por entidad |
| Colisión con registros destino | Media, sin conteos | Alto | Respaldo verificado, comparar claves únicas y bloquear sobreescrituras |
| Pérdida o corrupción durante la carga | Baja tras controles, por verificar | Crítico | Respaldo previo, transacción por lote, verificación de conteos y rollback ensayado |
| Exposición de datos personales/financieros | Media | Crítico | Datos sintéticos en pruebas; cifrado, acceso mínimo, transferencia segura y eliminación controlada de copias temporales |
| Cambio de esquema por arranque de la aplicación | Media | Alto | Revisar `Base.metadata.create_all()` y cambios condicionales del inicio; no usar arranque como sustituto de una migración revisada |
| Aprobación de rechazo no disponible durante el corte | Media | Alto | Nombrar aprobador y dejar reglas/umbral firmados antes de iniciar |

---

## 3. Plan de respaldo (v0)

### 3.1 Qué se respalda

| Elemento | Ubicación observada/propuesta | Método propuesto | ¿Datos personales o secretos? |
|---|---|---|---|
| Base MySQL `billetera` | Servicio Compose `db`; volumen `mysql_data` | Volcado lógico completo con `mysqldump`; validar lectura y restaurar en base aparte | Sí: usuarios, cuentas, movimientos y potencialmente datos de tarjeta |
| Configuración de despliegue | `compose.yml`, Dockerfiles y manifiestos/versiones del repositorio | Git más copia de configuración aprobada; excluir valores secretos | Puede referenciar nombres de variables y estructura |
| Variables y secretos de ejecución | Gestor de secretos externo aún no definido | Respaldo separado y cifrado de claves/configuración estrictamente necesaria; nunca incluir secretos en Git ni en el mismo archivo del volcado | Sí, altamente sensibles |
| Código fuente y dependencias | Repositorio Git, `Frontend/package-lock.json`, archivos de requisitos | Clon/revisión controlada y respaldos del repositorio según política institucional | No debería contener secretos; revisar antes de copiar |
| Archivos subidos por usuarios | No se identificó directorio de cargas persistentes en el inventario | Confirmar con el equipo; incluir cualquier volumen/directorio persistente que se descubra | Puede contener datos personales |
| Imágenes Docker | Se reconstruyen desde Dockerfiles e imágenes base | No se prioriza su respaldo; registrar versiones/digests cuando se defina despliegue | No normalmente |

`mysql_data` es persistencia operativa, no una copia de seguridad independiente. El archivo
`mysql_billetera.session.sql` contiene sentencias de ejemplo, no sustituye un volcado
completo. La lista definitiva de archivos/volúmenes persistentes queda pendiente de revisión
del equipo.

### 3.2 Objetivos de recuperación propuestos

| RPO | RTO | Justificación y aprobación |
|---|---|---|
| 24 horas como objetivo inicial propuesto | 4 horas como objetivo inicial propuesto | Un respaldo diario limitaría la pérdida potencial al intervalo desde el último respaldo; 4 horas es un objetivo por validar mediante simulacro. No hay acuerdo del cliente ni medición de recuperación: ambos valores requieren aprobación y ensayo. |

### 3.3 Política de respaldo propuesta

| Aspecto | Decisión v0 |
|---|---|
| Tipo | Completo lógico diario para la base MySQL; respaldos de configuración separados. No se propone incremental mientras no exista herramienta/operación que gestione y pruebe su cadena. |
| Herramienta | `mysqldump` del contenedor MySQL 8.4; comprobar compatibilidad de la herramienta y motor en el ensayo. |
| Frecuencia | Diario antes del periodo de mayor actividad, hora por acordar. El intervalo deberá ser menor o igual al RPO aprobado. |
| Retención | Propuesta GFS: 7 diarios, 4 semanales y 12 mensuales, sujeta a capacidad, privacidad y aprobación. Automatización aún no implementada. |
| Copia 1 | Archivo de respaldo en volumen/disco dedicado y con permisos restringidos, separado del volumen de datos `mysql_data`. |
| Copia 2 | Copia cifrada en un segundo medio bajo control administrativo distinto; ubicación por seleccionar. |
| Copia 3 fuera del sitio | Almacenamiento remoto cifrado e independiente del servidor; proveedor y región pendientes de selección/aprobación. |
| Regla 3-2-1 | Diseño objetivo: original más dos copias, en dos medios distintos y una copia fuera del sitio. No se cumple todavía con la configuración observada. |
| Cifrado | Cifrar en tránsito y reposo antes de copiar fuera del ambiente; herramienta, gestión/rotación de claves y custodia pendientes. No guardar la clave junto al archivo. |
| Acceso | Acceso mínimo; quien administre producción no debe poder borrar por sí solo todas las copias. Habilitar MFA/inmutabilidad cuando el medio elegido lo permita. |
| Responsable | Rol pendiente: administrador de base de datos/operaciones; un segundo rol debe verificar restauraciones y retención. |
| Registro | Registrar fecha, archivo, tamaño, resultado de validación, hash, versión del cliente/servidor y responsable, sin registrar secretos ni datos de clientes. |

### 3.4 Procedimiento de respaldo

Se agregó `scripts/respaldar.sh`, adaptado para el servicio MySQL de este proyecto. Desde
Bash o WSL2 y la raíz del repositorio puede ejecutarse así:

```bash
DESTINO="$HOME/backups-billetera" bash scripts/respaldar.sh
```

El script crea un volcado SQL, aplica permisos restrictivos al nuevo directorio y al
archivo, informa el SHA-256 y avisa cuando se supera `MAX_RESPALDOS` (por defecto 7). No
cifra, no copia fuera del sitio y deliberadamente no elimina respaldos; el umbral es una
alerta, no una retención automatizada. Ejecutarlo solo en un ambiente autorizado; el
archivo debe protegerse como datos personales. El script se creó pero no se ejecutó en esta
entrega.

El usuario de base configurado para `db` debe tener permisos de lectura y exportación de los
objetos incluidos. El script transmite el volcado directamente a un archivo desde Bash,
evitando que una consola PowerShell convierta la codificación del flujo binario. Antes de
dar el respaldo por válido, comprobar código de salida, tamaño, SHA-256 y realizar una
restauración de prueba en una base separada. `--single-transaction` ofrece una captura
consistente para tablas transaccionales InnoDB; confirmar el motor de todas las tablas y
acordar cómo respaldar objetos no transaccionales. No almacenar el volcado en Git, en
`Frontend/build` ni junto a las credenciales.

### 3.5 Procedimiento de restauración — ocho pasos

El ejemplo restaura en una base de prueba nueva llamada `billetera_restore`; no elimina ni
sobrescribe la base `billetera`. Requiere un archivo de respaldo revisado y acceso
autorizado. No ejecutar en producción sin aprobación de incidente y respaldo del estado
actual.

1. **Detectar y decidir.** El responsable de operación registra incidente y alcance; el
   responsable del negocio autoriza restaurar si la integridad o disponibilidad no se puede
   recuperar de forma segura. Iniciar cronómetro RTO.
2. **Contener.** Suspender escrituras y aislar el servicio afectado. En pruebas, no detener
   servicios compartidos ni afectar usuarios: ejecutar el ensayo en un ambiente aislado.
3. **Elegir el respaldo.** Seleccionar el último archivo anterior al incidente que tenga
   hash registrado y validación/restauración satisfactoria. Definir `BACKUP_FILE` en la
   misma sesión Bash/WSL2:

   ```bash
   BACKUP_FILE="$HOME/backups-billetera/<ARCHIVO_RESPALDO_VALIDADO>.sql"
   test -s "$BACKUP_FILE" || { echo "No se encontró un respaldo no vacío" >&2; exit 1; }
   sha256sum -- "$BACKUP_FILE"
   ```

4. **Respaldar el estado actual.** Antes de cambiar una base afectada, crear y validar un
   volcado separado con el procedimiento de 3.4. No sobrescribir ni borrar el original.
5. **Restaurar.** Ensayo no destructivo en una base aparte; la creación falla si el nombre
   ya existe. Antes de importar, un administrador de base de datos debe crear
   `billetera_restore` y conceder temporalmente al usuario configurado para el servicio
   `db` permisos solo sobre esa base. Ejecutar esta preparación mediante el canal
   administrativo aprobado, sin incluir credenciales en el repositorio:

   ```sql
   CREATE DATABASE billetera_restore CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
   GRANT ALL PRIVILEGES ON billetera_restore.* TO '<USUARIO_DB>'@'<HOST_AUTORIZADO>';
   ```

   Si la base de prueba ya existe, detenerse y solicitar un nombre de prueba nuevo; no
   eliminarla. Sustituir el nombre de forma consistente en los comandos de creación,
   concesión e importación.
   Después, copiar el archivo al contenedor MySQL e importarlo desde Bash/WSL2:

   ```bash
   docker cp "$BACKUP_FILE" mysql_billetera:/tmp/billetera_restore_test.sql

   docker compose exec -T db sh -c 'exec mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" billetera_restore < /tmp/billetera_restore_test.sql'
   ```

   Si el comando devuelve un error, detenerse y no considerar restaurada la base. El usuario
   debe tener permisos sobre la base aislada; no colocar su contraseña en el comando:
   `MYSQL_USER` y `MYSQL_PASSWORD` son variables internas del servicio Compose.

   Este ejemplo deja intactas las bases fuente y conserva la base de ensayo para comparar.
   Confirmar primero que `billetera_restore` no exista. No usar `docker compose down -v`.
6. **Verificar.** Comparar hash del archivo, conteos por tabla, relaciones y consultas de
   negocio acordadas entre el origen capturado y la base restaurada; ejecutar el smoke test
   de lectura y registrar tiempo. Una base restaurada no se acepta solo porque el comando
   terminó con código cero.
7. **Reabrir y comunicar.** Solo el responsable autorizado reabre el servicio tras validar
   la aplicación. Informar ventana, alcance y pérdida potencial conforme al RPO. Para un
   ensayo, no reabrir tráfico productivo ni declarar recuperación real.
8. **Registrar.** Anotar inicio/fin, RTO medido, nombre/hash del respaldo, errores,
   diferencias, aprobadores y acciones de seguimiento. Revocar los permisos temporales de
   la base de prueba. Proteger el informe y no adjuntar datos personales.

### 3.6 Evidencia de restauración

| Tabla del esquema | Filas en origen al ejecutar la prueba | Filas en base restaurada | Estado |
|---|---:|---:|---|
| `usuario` | No medido | No medido | Pendiente: ensayo real |
| `cuentas` | No medido | No medido | Pendiente: ensayo real |
| `transacciones` | No medido | No medido | Pendiente: ensayo real |
| `notificaciones` | No medido | No medido | Pendiente: ensayo real |
| Otras tablas (`Backend/models.py`) | No medido | No medido | Pendiente: inventariar y comparar todas |

**Tiempo de restauración medido:** no medido; no se ejecutó una restauración en esta
entrega. No presentar el procedimiento de 3.5 como evidencia de ejecución.

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
| Validación de archivo, código de salida, tamaño y hash | En cada respaldo diario | Operador de respaldo |
| Restauración completa en base aparte y conciliación de conteos | Semanal durante la puesta a punto; mensual cuando la operación esté estable | Operador distinto del responsable de producción |
| Simulacro en ambiente limpio y medición del RTO | Trimestral y antes de una entrega importante | Equipo técnico y responsable del negocio |
| Revisión de retención, permisos y copia fuera del sitio | Mensual | Responsable de operaciones/seguridad |

Las frecuencias son una propuesta; el calendario y RPO/RTO deben aprobarse con el negocio.

---

## 5. Plan de instalación (v0)

| # | Sección | Contenido |
|---:|---|---|
| 1 | Alcance | Instalar para desarrollo local la API FastAPI, el frontend React y MySQL 8.4 de `compose.yml`. No incluye publicación productiva, dominio, HTTPS, correo/OpenAI ni operación financiera real. Versiones liberadas y despliegue en nube quedan fuera de esta v0. |
| 2 | Ambientes | Desarrollo local: servicio `db` en Compose; API en `Backend.main:app`; frontend desde `Frontend`. No se encontró configuración desplegada de pruebas/producción ni separación formal de ambientes. Crear ambientes aislados antes de usar datos reales. |
| 3 | Roles | Ejecutor: desarrollador/operador autorizado. Aprobador de datos y cambios: responsable del negocio. Validador: otro integrante/equipo. Administrador de secretos/base: rol de operaciones. Asignación nominal pendiente; este plan usa solo roles. |
| 4 | Prerrequisitos | Docker Engine y plugin Compose; Python 3.12 para alinearse con el Dockerfile; Node.js 22 para alinearse con el Dockerfile frontend; npm compatible; Git; PowerShell. Requiere puertos locales 3307, 8000 y 3000 disponibles, conectividad a paquetes y espacio para imágenes, dependencias y datos. Estimación inicial de desarrollo: 2 CPU, 8 GB RAM y 20 GB libres; no medida ni validada. La ficha técnica de Semana 1 no está en este repositorio: confirmar versiones, capacidad y accesos antes de aceptación. |
| 5 | Preparación | Confirmar rama/versión, ventana y responsable; leer configuración sin publicar valores; revisar secretos y rotarlos si fueran vigentes; confirmar respaldo probado antes de migrar; verificar origen, volumen y disponibilidad de base. No ejecutar `down -v`, comandos de limpieza ni migraciones sobre datos que deban conservarse. |
<<<<<<< HEAD
| 6 | Procedimiento | Pasos locales reproducibles abajo. El arranque integral por Docker queda bloqueado por manifiestos `uv` ausentes que exige `Backend/Dockerfile`; registrar la corrección del Dockerfile/manifiestos como pendiente. |
=======
| 6 | Procedimiento | Pasos locales reproducibles abajo. El Dockerfile instala las dependencias desde `Backend/requirements.txt`; el build y el arranque integral deben verificarse en el ambiente antes de aceptarlos. |
>>>>>>> origin/feat/administrator-management-and-code-corrections
| 7 | Migración de datos | Seguir exclusivamente la sección 2. No hay dataset de origen ni script de migración identificado; no se ejecutará migración hasta completar inventario, mapeo aprobado y respaldo verificado. |
| 8 | Verificación | Confirmar estado `healthy` de MySQL, respuesta de `/test-db`, documentación OpenAPI, carga frontend, pruebas backend disponibles y build frontend. La ruta API configurada en `Frontend/src/services/api.js` tiene un prefijo `/api` que debe contrastarse con las rutas observadas en `Backend/main.py`; no asumir integración end-to-end aceptada. |
| 9 | Rollback | Antes de datos nuevos, detener procesos y volver al artefacto previo preservando volumen. Después de escrituras, congelar, respaldar estado actual y seguir rollback/conciliación de 2.6 y restauración de 3.5. No borrar el volumen `mysql_data`. |
| 10 | Cronograma | Estimación inicial para desarrollo: prerequisitos 20 min; iniciar MySQL 10 min; instalar API 30–60 min según descarga; instalar frontend 15–30 min; smoke tests 20 min. Total estimado 1 h 35 min–2 h 20 min, no medido. La ventana de migración/corte tiene estimación independiente en 2.3. |

### Procedimiento local de instalación

Los pasos siguientes se documentan para Windows/PowerShell, acorde al entorno de trabajo.
Los valores entre `<...>` son marcadores: obtenerlos de un canal seguro; no guardar
contraseñas en el historial, documentos ni repositorio.

| # | Acción | Comando | Resultado esperado / manejo de fallo |
|---:|---|---|---|
| 1 | Confirmar requisitos de herramientas | `docker --version`<br>`docker compose version`<br>`py -3.12 --version`<br>`node --version`<br>`npm --version` | Versiones disponibles; Docker Compose funcional, Python 3.12 y Node 22. Si falta una herramienta, instalarla desde fuente oficial y repetir antes de continuar. |
| 2 | Iniciar solo MySQL sin reconstruir ni borrar volúmenes | `docker compose up -d db` | Termina sin error y crea/inicia `db`; no ejecuta la construcción defectuosa del backend ni elimina `mysql_data`. |
| 3 | Verificar salud de MySQL | `docker compose ps db` | El servicio debe mostrar `healthy`. Si no, revisar `docker compose logs --tail 100 db`; no borrar el volumen como intento de solución. |
| 4 | Crear entorno virtual e instalar dependencias backend | Desde la raíz:<br>`py -3.12 -m venv .venv-backend`<br>`.\\.venv-backend\\Scripts\\Activate.ps1`<br>`python -m pip install --upgrade pip`<br>`python -m pip install -r Backend\\requirements.txt` | Instalación finaliza sin errores. Si falta un paquete, registrar el error y actualizar/manifiesto aprobado; `requirements.txt` no fija versiones, por lo que esta instalación aún no es reproducible por versión. |
| 5 | Configurar conexión del backend al MySQL local | En la misma sesión PowerShell, cargar desde un gestor seguro los valores:<br>`$env:DB_HOST = "localhost"`<br>`$env:DB_PORT = "3307"`<br>`$env:DB_NAME = "billetera"`<br>`$env:DB_USER = "<USUARIO_DB>"`<br>`$env:DB_PASSWORD = "<SECRETO_DB>"` | Variables presentes solo en la sesión actual. Usar credenciales autorizadas compatibles con el servicio local; no imprimirlas ni sustituir los marcadores por valores reales en este documento. La aplicación usa SQLite si no recibe una URL o el conjunto completo de variables, por lo que confirmar que se conectó al motor esperado. |
| 6 | Ejecutar API en ventana PowerShell dedicada | Desde la raíz, con el entorno virtual activo:<br>`python -m uvicorn Backend.main:app --host 127.0.0.1 --port 8000 --reload` | Uvicorn informa que escucha localmente en el puerto 8000. En el inicio, `Backend/main.py` ejecuta `Base.metadata.create_all()` y cambios condicionales de esquema; usar solo una base de desarrollo respaldada y no iniciar sobre producción sin revisión. |
| 7 | Instalar frontend según lockfile | En otra ventana:<br>`Set-Location Frontend`<br>`npm ci` | Instalación termina usando `Frontend/package-lock.json`. Si el lockfile no concuerda con `package.json`, detenerse y reconciliar manifiestos en una tarea separada. |
| 8 | Iniciar frontend | Desde `Frontend`:<br>`npm start` | Create React App inicia en el puerto 3000. La API usa URL local fija; si la interfaz no conecta, revisar consola de navegador, CORS y la diferencia del prefijo `/api` antes de declarar correcto el flujo. |
| 9 | Verificar API y base | En PowerShell:<br>`Invoke-RestMethod http://127.0.0.1:8000/test-db`<br>`Invoke-WebRequest http://127.0.0.1:8000/docs -UseBasicParsing` | `/test-db` responde la comprobación `SELECT 1`; `/docs` devuelve HTTP exitoso. Si falla, revisar logs de Uvicorn y credenciales de base sin copiarlas a tickets. |
| 10 | Ejecutar verificaciones de calidad disponibles | Desde la raíz, si `pytest` está instalado:<br>`python -m pytest Backend\\tests -q`<br><br>En otra sesión desde `Frontend`:<br>`npm run build` | Registrar comando, fecha y resultado. `pytest` no figura en `Backend/requirements.txt`; instalarlo en entorno de desarrollo de forma aprobada si falta. El build no prueba integración API. Ninguna de estas pruebas se ejecutó al elaborar este documento. |

<<<<<<< HEAD
### Procedimiento Docker pendiente de habilitación

Una vez que el equipo alinee `Backend/Dockerfile` con manifiestos que existan y estén
versionados, el flujo objetivo puede ser:
=======
### Procedimiento Docker (requiere verificación)

El Dockerfile instala las dependencias declaradas en `Backend/requirements.txt`. Para
construir e iniciar los servicios:
>>>>>>> origin/feat/administrator-management-and-code-corrections

```powershell
docker compose config --quiet
docker compose up -d --build
docker compose ps
```

<<<<<<< HEAD
No ejecutar como criterio de aceptación todavía: `pyproject.toml`, `uv.lock` y
`.python-version` requeridos por el Dockerfile no están presentes en la raíz. No se cambió
esa configuración en este entregable.
=======
Registrar el resultado del build, el estado `healthy` de MySQL y las verificaciones de API
antes de considerar aceptado el procedimiento. Las dependencias de `requirements.txt` no
están fijadas exactamente.
>>>>>>> origin/feat/administrator-management-and-code-corrections

### Cronograma de una ventana de migración/puesta en marcha

| Fase | Duración estimada inicial | Acumulado | Estado |
|---|---:|---:|---|
| Aviso, autorización y congelamiento de escrituras | 15 min | 0:15 | Propuesto; responsables pendientes |
| Respaldo previo y lectura/hash | 20 min | 0:35 | No ejecutado; duración por medir |
| Preparación/validación de servicios | 30 min | 1:05 | No ejecutado; Compose backend bloqueado |
| Carga, transformaciones y conciliación | 40 min | 1:45 | No estimable sin volumen/origen; presupuesto provisional |
| Pruebas de verificación y decisión de corte | 20 min | 2:05 | Propuesto |
| Margen para imprevistos | 55 min | 3:00 | Reserva propuesta, no aprobada |

**Punto de no retorno:** primera escritura de usuarios en el sistema nuevo después de la
aceptación formal. Antes de ese punto, detener el corte y conservar el origen; después,
requerir conciliación de las nuevas operaciones y procedimiento de 2.6.

---

## Anexo — Plan de validación, evidencias y pendientes

### Lista de comprobación del entregable

- [x] Secciones 2, 3 y 5 con la estructura y numeración de la plantilla S02.
- [x] Plan de migración: objetivo medible, inventario, estrategia, mapeo, validaciones,
      rollback y riesgos; los datos que no existen en el repositorio quedan señalados.
- [x] Plan de respaldo: inventario más allá de la base, RPO/RTO propuestos, retención,
      diseño 3-2-1, cifrado, comandos de respaldo/restauración en ocho pasos y calendario.
- [x] Plan de instalación con las diez secciones, pasos con acción/comando/resultado y
      cronograma con punto de no retorno.
- [x] Comandos alineados a PowerShell, MySQL, Docker Compose, Python y npm observados.
- [x] No se incluyeron contraseñas, tokens, direcciones de producción ni valores secretos.
- [ ] Incorporar ficha técnica de Semana 1 aprobada; no existe en el repositorio abierto.
- [ ] Identificar y perfilar sistema origen, volumen, reglas de calidad y responsable.
- [ ] Obtener aprobación de reglas de rechazo, ventana, RPO/RTO y retención del negocio.
- [x] Crear `scripts/respaldar.sh` para MySQL, con validación de salida y alerta de umbral de
      retención sin borrado automático.
- [ ] Ejecutar y evidenciar respaldo y restauración de la base del proyecto en una base
      aparte; no se ejecutó ni midió en esta entrega.
<<<<<<< HEAD
- [ ] Resolver el Dockerfile/manifiestos de backend y comprobar despliegue integral.
=======
- [ ] Comprobar build Docker y despliegue integral en el ambiente autorizado.
>>>>>>> origin/feat/administrator-management-and-code-corrections
- [ ] Definir el tratamiento seguro de tarjetas, secretos, archivos persistentes y copias
      fuera del sitio.
- [ ] Confirmar que rutas API y URL base del frontend son compatibles mediante prueba
      integrada.

### Evidencias que se deben recopilar en la siguiente ejecución

| Evidencia | Comando/medio | Resultado que debe registrarse |
|---|---|---|
| Versiones y configuración del ambiente | Comandos de paso 1 y `docker compose config --quiet` | Versiones exactas, configuración sin secretos y resultado de salida |
| Salud de MySQL | `docker compose ps db`; logs acotados si falla | Estado `healthy`, hora y versión de imagen |
| Archivo de respaldo | Procedimiento 3.4 | Ruta protegida, tamaño, SHA-256 y código de salida |
| Restauración aislada | Procedimiento 3.5 | Conteos por tabla antes/después, integridad referencial y tiempo RTO medido |
| Pruebas de backend/frontend | `python -m pytest Backend\\tests -q`; `npm run build` | Resultado real, fallas y versiones ejecutadas |
| Migración | Acta de corte, conteos origen/migrados/rechazados y reglas aprobadas | Diferencias cero o excepciones aprobadas y firma de responsables |

La existencia de este plan y los comandos escritos no constituyen evidencia de que la
instalación, el respaldo, la restauración, las pruebas o una migración hayan sido ejecutados.
