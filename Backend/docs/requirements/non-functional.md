# Requisitos no funcionales

**Producto:** Financiero (Billetera)
**Última revisión:** 25 de noviembre de 2026

## Alcance y valoración

La clasificación toma como referencia las características de calidad de ISO/IEC 25010 (seguridad, eficiencia del desempeño, capacidad de interacción/usabilidad, fiabilidad, mantenibilidad, portabilidad y compatibilidad). Este documento describe evidencia del repositorio, no una certificación ISO ni una validación de despliegue productivo.

- **Implementado en código:** existe configuración o comportamiento directamente verificable.
- **Parcial:** existe una medida, pero hay una brecha explícita o cobertura insuficiente.
- **Pendiente de validación:** no hay evidencia medible suficiente en el repositorio para declarar cumplimiento.
- No se atribuyen al sistema objetivos de latencia, disponibilidad, concurrencia, capacidad o cobertura que no estén definidos y medidos.

## Requisitos

### Seguridad y protección de datos

#### RNF-001 — Almacenamiento de contraseñas
- **Característica ISO/IEC 25010:** Seguridad — confidencialidad y autenticidad.
- **Descripción:** las contraseñas nuevas se procesan con Argon2 o bcrypt a través de Passlib; la verificación contempla hashes existentes.
- **Criterio de aceptación:** al registrar o cambiar contraseña, el valor almacenado no coincide con el texto recibido y puede verificarse mediante el verificador configurado; los registros heredados en texto plano no deben persistir tras su autenticación.
- **Método de verificación:** prueba de registro/cambio contra base aislada; inspección del valor persistido y prueba de login; ejecutar `Backend/tests/test_security_configuration.py` y casos de registro.
- **Estado de cumplimiento:** Parcial; el login conserva compatibilidad con contraseñas heredadas en texto plano y las convierte al autenticarse. No hay evidencia de inventario/eliminación de todos los registros históricos.

#### RNF-002 — Gestión de secretos y ciclo de vida JWT
- **Característica ISO/IEC 25010:** Seguridad — autenticidad y responsabilidad.
- **Descripción:** fuera de desarrollo la clave JWT es obligatoria y debe tener al menos 32 bytes; los tokens se firman con HS256. La función que emite token solo incluye `sub` y no define expiración.
- **Criterio de aceptación:** verificar rechazo al iniciar la app con clave ausente o menor de 32 bytes; en una especificación de producción debe existir expiración y una prueba que demuestre el rechazo de token vencido.
- **Método de verificación:** `Backend/tests/test_security_configuration.py`; inspección de claims de un token emitido y solicitud con token vencido.
- **Estado de cumplimiento:** Parcial; longitud/configuración de secreto comprobada por pruebas, pero no se establece expiración JWT ni revocación en el código observado.

#### RNF-003 — Autenticación, autorización y titularidad
- **Característica ISO/IEC 25010:** Seguridad — autenticidad, autorización y no repudio.
- **Descripción:** endpoints protegidos usan JWT y ciertas operaciones consultan rol o titularidad. La cobertura de dependencias no es uniforme en todos los flujos y routers auxiliares.
- **Criterio de aceptación:** para cada operación protegida, una solicitud sin token o con usuario/rol ajeno debe ser rechazada y no producir cambios en datos; solo las rutas autorizadas deben completar la operación.
- **Método de verificación:** matriz endpoint-rol con pruebas positivas y negativas, incluyendo cambio de estado, lectura de saldos, cuentas, tarjetas y datos de usuario.
- **Estado de cumplimiento:** Parcial; hay pruebas de seguridad y de tarjetas/administración, pero no existe evidencia de una matriz completa. La autenticación por código de correo no se valida antes de emitir/usar token.

#### RNF-004 — Protección de datos de tarjeta
- **Característica ISO/IEC 25010:** Seguridad — confidencialidad.
- **Descripción:** la base almacena número de tarjeta, expiración y código de seguridad; algunos endpoints devuelven el número completo y el CVV. No se encontró cifrado de estos campos ni tokenización.
- **Criterio de aceptación:** respuestas de API y logs no deben revelar PAN/CVV completos; los secretos de tarjeta persistidos deben estar protegidos de acuerdo con un diseño aprobado para el entorno y la regulación aplicable.
- **Método de verificación:** inspección de esquemas y datos de prueba; pruebas de respuesta para todas las rutas `/tarjeta*` y `/tarjetas*`; inspección controlada de logs.
- **Estado de cumplimiento:** No cumple según la evidencia actual; hay campos sensibles en claro y respuestas que exponen datos. No usar datos de tarjetas reales.

#### RNF-005 — Seguridad HTTP, CORS y transporte
- **Característica ISO/IEC 25010:** Seguridad — confidencialidad e integridad.
- **Descripción:** FastAPI configura CORS a partir de orígenes explícitos y rechaza una lista vacía o comodín; añade cabeceras anti-sniffing, anti-frame, Referrer-Policy, CSP y Permissions-Policy. Compose publica puertos enlazados a loopback; no configura TLS.
- **Criterio de aceptación:** en despliegue, solo orígenes autorizados deben obtener acceso CORS; las respuestas deben contener las cabeceras configuradas y el tráfico externo debe usar HTTPS.
- **Método de verificación:** inspección de `Backend/main.py`, pruebas de CORS/headers, solicitudes con origen permitido/no permitido y verificación TLS del entorno desplegado.
- **Estado de cumplimiento:** Parcial; política CORS y cabeceras existen con pruebas de CORS, pero HTTPS depende de infraestructura externa y no se acredita configuración TLS.

#### RNF-006 — Minimización, privacidad y tratamiento de datos
- **Característica ISO/IEC 25010:** Seguridad — confidencialidad y responsabilidad.
- **Descripción:** el registro envía dirección a Nominatim; correo y preguntas de chat se envían a proveedores externos. No se encontró política de retención/consentimiento ni una evaluación documentada de privacidad para esos datos.
- **Criterio de aceptación:** documentar datos enviados, finalidad, proveedor, retención y base de autorización; probar que solo se transmiten los campos necesarios y que la eliminación/retención acordada es ejecutable.
- **Método de verificación:** revisión de solicitudes a integraciones, configuración y política de datos; pruebas con datos sintéticos.
- **Estado de cumplimiento:** Pendiente de validación; no hay evidencia suficiente de política o controles de ciclo de vida de datos.

### Integridad, fiabilidad y rendimiento

#### RNF-007 — Consistencia de cuentas y transferencias
- **Característica ISO/IEC 25010:** Fiabilidad — madurez y tolerancia a fallos; Seguridad — integridad.
- **Descripción:** transferencias internas modifican saldos y crean movimientos en la misma sesión de SQLAlchemy; los flujos usan bloqueo de filas en cuentas donde está implementado. No se encontró clave de idempotencia.
- **Criterio de aceptación:** ante éxito, saldos y movimientos deben quedar todos persistidos; ante excepción, ninguno de los cambios del intento debe permanecer; reintentos no deben debitar dos veces si se requiere semántica idempotente.
- **Método de verificación:** pruebas de integración concurrentes sobre MySQL, inyección de error antes/durante commit y comparación de saldos y movimientos antes/después.
- **Estado de cumplimiento:** Parcial; el flujo usa transacciones/rollback, pero no se encontró prueba de concurrencia, garantía de idempotencia ni prueba equivalente de locking sobre MySQL.

#### RNF-008 — Validación de entradas y reglas de dominio
- **Característica ISO/IEC 25010:** Seguridad — integridad; Mantenibilidad — modularidad.
- **Descripción:** esquemas Pydantic validan formatos, longitudes y límites para varias solicitudes; algunos endpoints aceptan diccionarios sin esquema específico.
- **Criterio de aceptación:** datos fuera de dominio deben ser rechazados antes de persistir; cada endpoint que modifica información debe tener esquema/reglas probadas y errores de validación reproducibles.
- **Método de verificación:** pruebas de límite y de datos inválidos para esquemas y endpoints; inspección de respuestas HTTP y estado de la base tras el rechazo.
- **Estado de cumplimiento:** Parcial; existen validadores y `test_pydantic_schemas.py`, pero algunas rutas usan cuerpos genéricos.

#### RNF-009 — Manejo explícito de fallos de integraciones
- **Característica ISO/IEC 25010:** Fiabilidad — tolerancia a fallos y capacidad de recuperación.
- **Descripción:** el chat convierte fallos del proveedor en respuestas de error; recuperación falla explícitamente si SMTP no puede enviar; otras notificaciones de correo se registran como advertencia y no detienen el login/registro.
- **Criterio de aceptación:** cada fallo de proveedor debe producir un estado/error observable, no una respuesta financiera de éxito falsa; una operación no dependiente de ese proveedor debe conservar su comportamiento definido.
- **Método de verificación:** pruebas con SMTP/LLM inaccesibles y comprobación del código HTTP, respuesta, log y cambios de base.
- **Estado de cumplimiento:** Parcial; hay tratamiento de error para IA/recuperación y pruebas de LLM; el envío de avisos de acceso puede fallar sin cambiar el éxito de login.

#### RNF-010 — Comprobación de salud del servicio y base de datos
- **Característica ISO/IEC 25010:** Fiabilidad — disponibilidad y capacidad de recuperación.
- **Descripción:** se exponen rutas de salud viva (`/health/live`) y readiness (`/ready` y `/health/ready`); `/ready` convierte fallo SQLAlchemy en 503, mientras `/health/ready` ejecuta la consulta directamente. Compose usa healthchecks para MySQL/backend y espera a que dependencias estén sanas.
- **Criterio de aceptación:** el healthcheck de proceso responde correctamente cuando el backend está activo; el de readiness devuelve estado no disponible si falla `SELECT 1` y éxito cuando la base responde.
- **Método de verificación:** `Backend/tests/test_operational_health.py`, `Backend/tests/test_health.py` y comprobación de estados de Compose.
- **Estado de cumplimiento:** Implementado en código y cubierto por pruebas; el estado del entorno desplegado no se verificó en esta revisión.

#### RNF-011 — Rendimiento medible
- **Característica ISO/IEC 25010:** Eficiencia del desempeño — comportamiento temporal y capacidad.
- **Descripción:** no se hallaron objetivos aprobados de latencia, concurrencia, volumen ni mediciones de carga. El listado de transacciones no pagina resultados en backend.
- **Criterio de aceptación:** registrar p50/p95/p99 y throughput de endpoints críticos bajo una carga acordada y comparar con un objetivo aprobado por el equipo; hasta definir ese objetivo no declarar cumplimiento.
- **Método de verificación:** prueba de carga reproducible contra ambiente y datos representativos, registrando versión, configuración, carga y resultados.
- **Estado de cumplimiento:** Pendiente de validación; no hay umbrales o resultados que permitan afirmar rendimiento.

#### RNF-012 — Uso eficiente de recursos
- **Característica ISO/IEC 25010:** Eficiencia del desempeño — utilización de recursos.
- **Descripción:** SQLAlchemy configura `pool_pre_ping` y parámetros de pool; hay límites/cursor en listados de usuarios y cuentas. No se hallaron métricas de CPU, memoria, conexiones ni tamaño máximo de historial.
- **Criterio de aceptación:** medir CPU, memoria, conexiones de base y tamaño de respuestas en una carga acordada; identificar consultas/listados que excedan los límites aprobados.
- **Método de verificación:** perfilado de API y MySQL en prueba de carga; inspección de planes de consulta y payloads.
- **Estado de cumplimiento:** Pendiente de validación; existe configuración básica, pero no telemetría ni resultados de medición.

### Interacción, usabilidad y compatibilidad

#### RNF-013 — Mensajes de validación y estado de operación
- **Característica ISO/IEC 25010:** Capacidad de interacción — reconocibilidad, aprendizaje y protección frente a errores.
- **Descripción:** las interfaces principales incluyen formularios, estados de carga y mensajes de error/resultado; algunas pantallas recurren a datos de `localStorage` cuando falla la API.
- **Criterio de aceptación:** en pruebas de los flujos principales, cada respuesta de éxito/error debe comunicarse al usuario; los datos locales de respaldo deben identificarse como locales y no presentarse como estado bancario confirmado.
- **Método de verificación:** pruebas manuales de registro, transferencia, perfil, tarjeta, historial y errores de red en React.
- **Estado de cumplimiento:** Parcial; hay estados y mensajes visibles, pero no se ha verificado consistentemente la distinción entre datos de API y datos locales.

#### RNF-014 — Accesibilidad y operación adaptable
- **Característica ISO/IEC 25010:** Capacidad de interacción — accesibilidad y experiencia de usuario.
- **Descripción:** se observan etiquetas y controles adaptables en varias páginas; no se encontró auditoría de accesibilidad ni pruebas completas con teclado/lector de pantalla.
- **Criterio de aceptación:** documentar pruebas de navegación por teclado, foco, nombres accesibles de controles, contraste y lectura de errores en las pantallas críticas; los defectos deben quedar registrados y resueltos antes de aceptación.
- **Método de verificación:** recorrido manual de pantallas con teclado y lector de pantalla más informe de herramienta de accesibilidad.
- **Estado de cumplimiento:** Pendiente de validación; la presencia de algunas etiquetas HTML no demuestra conformidad de toda la aplicación.

#### RNF-015 — Portabilidad de ejecución
- **Característica ISO/IEC 25010:** Portabilidad — adaptabilidad e instalabilidad.
- **Descripción:** el repositorio contiene Dockerfiles para Python 3.12 y Node 24, Compose con MySQL 8.4 y modo local alternativo SQLite si no se configura conexión.
- **Criterio de aceptación:** construir e iniciar los tres servicios en un entorno limpio con versiones compatibles documentadas; verificar API, frontend y persistencia sin cambios de código.
- **Método de verificación:** ejecutar `docker compose config --quiet`, `docker compose up --build` y smoke tests en un equipo limpio.
- **Estado de cumplimiento:** Parcial; los archivos/configuración están presentes, pero esta revisión documental no ejecutó la matriz de plataformas.

#### RNF-016 — Compatibilidad de navegadores y dependencias
- **Característica ISO/IEC 25010:** Compatibilidad — coexistencia e interoperabilidad.
- **Descripción:** `Frontend/package.json` declara objetivos Browserslist para producción y desarrollo; se fijan versiones de Python/Node en imágenes y se incluyen lockfiles de dependencias.
- **Criterio de aceptación:** compilar y completar los flujos críticos en los navegadores/versiones definidos por Browserslist y generar una instalación reproducible desde lockfiles.
- **Método de verificación:** build frontend, pruebas automatizadas y ejecución de flujos en la matriz de navegadores soportada.
- **Estado de cumplimiento:** Parcial; hay configuración y archivos de bloqueo, pero no resultados recientes de compatibilidad cruzada.

### Mantenibilidad, capacidad y operación

#### RNF-017 — Separación de responsabilidades y cambios de esquema
- **Característica ISO/IEC 25010:** Mantenibilidad — modularidad, analizabilidad y modificabilidad.
- **Descripción:** backend separa modelos, esquemas, autenticación, base de datos, servicios de correo, rutas IA y migraciones Alembic; frontend separa páginas, componentes, hooks y servicios.
- **Criterio de aceptación:** cambios de esquema deben tener migración versionada; el grafo Alembic debe tener una historia aplicable y el código debe poder probarse sin modificar archivos ajenos al cambio.
- **Método de verificación:** inspección de estructura y migraciones; ejecutar `Backend/tests/test_migration_graph.py` y pruebas de migración sobre una base temporal.
- **Estado de cumplimiento:** Implementado en estructura; se requiere validar la aplicación de migraciones en MySQL de entrega.

#### RNF-018 — Pruebas automatizadas reproducibles
- **Característica ISO/IEC 25010:** Mantenibilidad — testabilidad; Fiabilidad — madurez.
- **Descripción:** hay pruebas pytest para autenticación, configuración de seguridad, salud, cuentas, tarjetas, beneficios, esquemas, correo, IA y respaldos; el README describe comandos de pruebas de backend y frontend.
- **Criterio de aceptación:** ejecutar las suites indicadas y registrar comando, dependencias, entorno, fecha y resultado; no declarar cobertura mínima no definida en el repositorio.
- **Método de verificación:** `python -m pytest Backend/tests -q` y `npm test -- --watchAll=false` desde `Frontend`, además del reporte de cobertura si forma parte de la entrega.
- **Estado de cumplimiento:** Parcial; los casos existen, pero no se ejecutaron como parte de esta actualización documental y no se dispone aquí de resultados recientes.

#### RNF-019 — Capacidad de crecimiento de listados y sesiones
- **Característica ISO/IEC 25010:** Eficiencia del desempeño — capacidad; Fiabilidad — disponibilidad.
- **Descripción:** listados de usuarios/cuentas aceptan cursor y limitan cada respuesta a 100 registros; movimientos no se paginan y el estado de recuperación se mantiene en memoria de un proceso.
- **Criterio de aceptación:** demostrar mediante prueba que listados completos pueden recorrerse sin omisiones/duplicados; verificar comportamiento de recuperación con más de una instancia o definir y aprobar un límite de despliegue de instancia única.
- **Método de verificación:** prueba de paginación con más de 100 registros y prueba de recuperación reiniciando/replicando backend.
- **Estado de cumplimiento:** Parcial; hay paginación limitada en endpoints concretos, no en historial; sesiones de recuperación no son compartidas entre procesos.

#### RNF-020 — Disponibilidad operacional
- **Característica ISO/IEC 25010:** Fiabilidad — disponibilidad.
- **Descripción:** Compose define `restart: unless-stopped` y verificaciones de salud; no se encontró arquitectura redundante, objetivo de disponibilidad ni monitorización externa.
- **Criterio de aceptación:** definir objetivo de disponibilidad y ventana de medición aprobados; medir disponibilidad del servicio en el entorno acordado y conservar evidencia de incidentes.
- **Método de verificación:** monitorización del endpoint de readiness durante el periodo acordado y revisión del registro de despliegue/incidentes.
- **Estado de cumplimiento:** Pendiente de validación; configuración de reinicio no equivale a una garantía de disponibilidad.

#### RNF-021 — Respaldo y recuperación de datos
- **Característica ISO/IEC 25010:** Fiabilidad — capacidad de recuperación.
- **Descripción:** se incluyen scripts de backup y restauración MySQL y pruebas relacionadas; Compose conserva datos en volumen nombrado. No se encontró evidencia de una restauración exitosa reciente ni de objetivos RPO/RTO.
- **Criterio de aceptación:** crear respaldo, restaurarlo en una base aislada y comparar tablas/relaciones/conteos; definir RPO/RTO antes de afirmar capacidad operacional.
- **Método de verificación:** `Backend/tests/test_database_backup.py`, `scripts/backup-mysql.sh`, `scripts/restore-mysql.sh` y ejecución documentada de restore sobre datos sintéticos.
- **Estado de cumplimiento:** Parcial; scripts y prueba existen, pero la restauración, integridad posrecuperación y objetivos de recuperación no están acreditados.

#### RNF-022 — Contenedorización
- **Característica ISO/IEC 25010:** Portabilidad — instalabilidad y adaptabilidad; Mantenibilidad — reproducibilidad.
- **Descripción:** `compose.yml` define MySQL, API y React, dependencias por healthcheck, volúmenes y una red; los Dockerfiles crean imágenes de backend y frontend.
- **Criterio de aceptación:** `docker compose config --quiet` debe finalizar correctamente y los servicios deben alcanzar estado healthy/activo; API y frontend deben responder por los puertos configurados.
- **Método de verificación:** ejecutar configuración y arranque de Compose, `docker compose ps` y `scripts/smoke-test.sh`.
- **Estado de cumplimiento:** Implementado en configuración; el compose observado ejecuta Uvicorn/React en modo de desarrollo (`--reload`/`npm start`), por lo que su aptitud para producción está pendiente.

#### RNF-023 — Configuración por entorno
- **Característica ISO/IEC 25010:** Mantenibilidad — configurabilidad; Seguridad — confidencialidad.
- **Descripción:** `.env.example`, Compose y configuración de base/seguridad permiten parametrizar credenciales, puertos, CORS, correo y claves de IA; secretos obligatorios de base/JWT se interpolan como requeridos en Compose.
- **Criterio de aceptación:** con `.env` local válido, Compose debe resolver configuración; sin claves requeridas debe fallar la validación de configuración; los valores de ejemplo no deben utilizarse como secretos reales ni persistirse en el repositorio.
- **Método de verificación:** `docker compose config --quiet`, pruebas de `Backend/tests/test_security_configuration.py` e inspección de archivos versionados sin leer ni exponer secretos locales.
- **Estado de cumplimiento:** Parcial; existe plantilla/configuración, pero no se puede asumir rotación, separación de secretos por ambiente ni configuración correcta de cada despliegue.

#### RNF-024 — Documentación de API OpenAPI/Swagger
- **Característica ISO/IEC 25010:** Mantenibilidad — analizabilidad; Compatibilidad — interoperabilidad.
- **Descripción:** FastAPI genera esquema OpenAPI y Swagger UI de forma predeterminada; README indica el acceso local a `/docs`.
- **Criterio de aceptación:** con la API disponible, `/docs` y `/openapi.json` deben responder; las rutas públicas de negocio deben aparecer con método y esquema coherentes con las solicitudes implementadas.
- **Método de verificación:** consultar ambas rutas y comparar las rutas documentadas con las registradas en FastAPI.
- **Estado de cumplimiento:** Implementado por configuración FastAPI; no se comprobó disponibilidad pública ni cobertura/documentación de cada operación.

#### RNF-025 — Registro de errores y auditabilidad
- **Característica ISO/IEC 25010:** Seguridad — responsabilidad; Fiabilidad — capacidad de recuperación.
- **Descripción:** el backend usa logging para errores de IA, transferencias y eventos de reporte; no se encontró un registro de auditoría estructurado y uniforme para todas las operaciones financieras. El endpoint de transacción fallida incorpora el cuerpo recibido al log.
- **Criterio de aceptación:** cada cambio financiero debe generar evento correlacionable con actor, resultado y referencia sin incluir secretos ni datos sensibles; los logs deben permitir reconstruir errores conforme a una política de retención aprobada.
- **Método de verificación:** pruebas de logging para operaciones exitosas/fallidas, revisión de campos persistidos y búsqueda de datos sensibles con cargas sintéticas.
- **Estado de cumplimiento:** Parcial; existe logging puntual, pero no auditoría integral y el contenido de reporte requiere revisión para evitar registrar datos sensibles.

## Brechas que impiden declarar conformidad global

1. No hay mediciones de rendimiento, volumen, concurrencia o disponibilidad, ni umbrales aprobados.
2. No se encontró expiración del JWT; el código de correo de acceso no se valida antes de aceptar el token.
3. Las tarjetas conservan y exponen número/CVV en ciertas rutas; no hay evidencia de cifrado/tokenización de esos campos.
4. No se acreditan HTTPS, despliegue productivo, monitoreo, rotación de secretos, RPO/RTO ni pruebas recientes de restauración.
5. El estado de dependencias externas (SMTP, Nominatim y proveedor IA) depende de claves, conectividad y servicio de terceros.
6. La configuración de fallback LLM existe, pero no se demuestra que forme parte del flujo atendido por `/ia/chat`.
7. El frontend puede combinar movimientos de API con historiales locales, y varios requisitos funcionales permanecen parciales según `functional.md`.

## Evidencia de verificación

Los criterios de aceptación anteriores son verificables mediante las rutas, pruebas, comandos y herramientas especificados. No se ejecutaron pruebas, benchmarks, builds, escaneos de seguridad ni validaciones de despliegue al actualizar este documento; por tanto, el estado no debe interpretarse como resultado de una ejecución reciente. Las pruebas o mediciones futuras deben registrar versión, ambiente, datos sintéticos, fecha, comando y resultado, sin incluir secretos ni información financiera real.
