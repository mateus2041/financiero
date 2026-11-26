# Requisitos funcionales

**Producto:** Financiero (Billetera)
**Última revisión:** 25 de noviembre de 2026

## Alcance, fuentes y criterio de estado

Este inventario describe el comportamiento que puede atribuirse al código actual, no una certificación de operación productiva. Se contrastaron la aplicación FastAPI, los modelos SQLAlchemy y migraciones Alembic, las pantallas y solicitudes de React, `compose.yml`, los ejemplos de entorno y las pruebas de `Backend/tests`. Las rutas citadas son las registradas en `Backend/main.py` y el router IA; la presencia de una pantalla o de una ruta no demuestra por sí sola que el flujo completo de interfaz funcione.

- **Implementado:** existe un endpoint operativo que persiste o consulta el dominio pertinente; donde se indique, además hay prueba automatizada.
- **Parcial:** hay una ruta o pantalla, pero hay un límite de alcance, falta de integración, autorización, persistencia o verificación que impide afirmar el flujo completo.
- **Pendiente/no implementado:** no se encontró una ruta backend operativa para la capacidad solicitada.
- La aplicación inicia registro con cuentas corrientes inactivas. No se encontró una conexión con una red bancaria real; Bre-B es una simulación dentro de la base de datos de la aplicación.

## Actores

| Actor | Responsabilidad observada |
| --- | --- |
| Visitante | Registrar una cuenta, autenticarse o iniciar recuperación de contraseña. |
| Usuario | Consultar su perfil, cuentas, saldos, movimientos, tarjetas y notificaciones; realizar transferencias y configurar datos admitidos. |
| Asesor | Consultar usuarios y cuentas, gestionar estados y atributos de cuenta y tramitar beneficios, según endpoints que exigen token/rol. |
| Administrador | Administrar asesores y consultar/gestionar datos operativos en endpoints que reconocen el registro de administrador. |
| Servicios externos | SMTP para correo, Nominatim/OpenStreetMap para validar ubicación y proveedor LLM para el chat. No son actores financieros ni redes de liquidación. |

## Requisitos

### Acceso, registro y perfil

#### RF-001 — Registrar usuario y dejar su cuenta pendiente
- **Descripción:** registrar un usuario con identidad, correo, contraseña, teléfono y ubicación; asignar un código de registro y crear una cuenta corriente inactiva para aprobación.
- **Actor:** Visitante.
- **Precondiciones:** enviar los campos requeridos válidos; correo y documento no deben estar registrados; debe aceptarse la validación externa de ubicación.
- **Flujo principal:** enviar `POST /register`; el servidor valida el esquema y ubicación, crea usuario y cuenta corriente inactiva, genera notificación y trata de enviar correo de confirmación.
- **Alternativas/excepciones:** datos inválidos o ubicación no confirmada producen error; correo/documento duplicado produce conflicto; la falla de correo no revierte el alta.
- **Resultado esperado:** usuario persistido con rol `usuario`, código de registro y cuenta corriente en estado `inactiva`; login de usuario ordinario denegado mientras no haya cuenta activa.
- **Módulo/evidencia:** Registro; `Backend/main.py` (`/register`, `registrar_usuario`), `Backend/schemas.py`, modelos `Usuario`, `Cuenta`, `Notificacion`; prueba `test_registro_cuentas_pendientes.py`.
- **Estado:** Implementado; la verificación geográfica y el envío de correo dependen de servicios configurados/disponibles.

#### RF-002 — Autenticar usuario, asesor o administrador
- **Descripción:** validar credenciales o códigos de acceso por rol y entregar un JWT cuando las validaciones del endpoint se cumplen.
- **Actor:** Usuario, Asesor o Administrador.
- **Precondiciones:** identidad/código vigente en la base de datos; para usuario, contraseña válida y cuenta activa; los asesores deben estar activos y los administradores vinculados a un usuario con rol de administrador.
- **Flujo principal:** solicitar `POST /login`, `/asesor-login` o `/administrador-login`; el servidor verifica los datos, puede intentar enviar un código/notificación por correo y responde con token e identidad.
- **Alternativas/excepciones:** credenciales, rol, asesor o estado no válidos son rechazados; una falla de correo se registra, pero no impide emitir el token.
- **Resultado esperado:** respuesta con token y actor autenticado. No existe endpoint de consumo/verificación del código enviado; además, el login de administrador usa documento y código, sin contraseña.
- **Módulo/evidencia:** Autenticación; `Backend/main.py`, `Backend/security.py`, `Backend/email_service/email_service.py`; modelos `Usuario`, `AsesorBanco`, `Administrador`; pruebas de login y configuración de seguridad.
- **Estado:** Parcial; autenticación JWT disponible, pero el código por correo no es un segundo factor aplicado al acceso.

#### RF-003 — Recuperar contraseña mediante correo y datos de tarjeta
- **Descripción:** emitir y validar un código de recuperación, comprobar datos de una tarjeta asociada y permitir definir una nueva contraseña.
- **Actor:** Usuario que olvidó su contraseña.
- **Precondiciones:** proporcionar documento y correo coincidentes; correo SMTP operativo; cuenta con tarjeta cuyos datos coincidan.
- **Flujo principal:** `POST /recuperar-password` envía un código; `POST /verificar-codigo-recuperacion` valida el código; `POST /verificar-tarjeta-recuperacion` coteja últimos seis dígitos, expiración y CVV; `POST /restablecer-password` guarda la contraseña hasheada.
- **Alternativas/excepciones:** datos no coincidentes, código incorrecto/expirado, más de cinco intentos, falta de tarjeta o token de recuperación vencido son rechazados; si no se puede enviar el correo, se responde con error de servicio.
- **Resultado esperado:** nueva contraseña guardada y registro de recuperación eliminado en el proceso actual.
- **Módulo/evidencia:** Recuperación; `Backend/main.py`, `Backend/security.py`, modelos `Tarjeta` y `Usuario`; formularios en `Frontend/src/pages/recuperacion.jsx`.
- **Estado:** Parcial; los códigos y tokens de recuperación se mantienen en memoria del proceso, por lo que reinicios o varias instancias no conservan una sesión compartida.

#### RF-004 — Consultar y actualizar perfil y topes
- **Descripción:** consultar datos propios y modificar nombre, correo, teléfono, dirección y topes de ahorro/corriente con confirmación de contraseña.
- **Actor:** Usuario autenticado.
- **Precondiciones:** JWT válido; para actualizar, contraseña actual correcta y valores de tope no negativos.
- **Flujo principal:** consultar `GET /usuario` o `/perfil`; actualizar con `PUT /usuario/perfil`; la interfaz de ajustes carga el perfil y envía los cambios.
- **Alternativas/excepciones:** perfil inexistente, contraseña incorrecta o datos inválidos producen error.
- **Resultado esperado:** cambios permitidos persistidos para el usuario autenticado; los campos `tope_ahorros` y `tope_corriente` quedan almacenados.
- **Módulo/evidencia:** Perfil/Ajustes; `Backend/main.py`, `Backend/schemas.py`, modelo `Usuario`, `Frontend/src/pages/ajustes.jsx`.
- **Estado:** Parcial; el endpoint guarda topes, pero el endpoint general de transferencia entre cuentas no los valida; el tope se comprueba en el flujo Bre-B por operación.

#### RF-005 — Cargar ubicaciones y validar dirección de registro
- **Descripción:** entregar al frontend las ubicaciones disponibles y comprobar la existencia de una dirección al registrar.
- **Actor:** Visitante y servicio Nominatim.
- **Precondiciones:** tabla `ubicacionesPorCiudad` disponible para la consulta; conectividad de salida para validación geográfica.
- **Flujo principal:** frontend consulta `GET /ubicaciones`; `POST /register` valida la dirección contra Nominatim/OpenStreetMap.
- **Alternativas/excepciones:** consulta de tabla fallida no devuelve ubicaciones; una respuesta vacía o fallo de Nominatim hace que la ubicación no sea aceptada.
- **Resultado esperado:** catálogo de ciudad/localidad/barrios y alta condicionada a la validación de ubicación.
- **Módulo/evidencia:** Registro; `Backend/main.py` (`/ubicaciones`, `ubicacion_real`), `mysql_billetera.session.sql`.
- **Estado:** Parcial; el endpoint depende de datos de base y de un servicio externo no controlado por la aplicación.

### Usuarios, cuentas y movimientos

#### RF-006 — Consultar usuarios y datos de atención
- **Descripción:** permitir a asesores y administradores consultar listados de usuarios y, a asesores, localizar un usuario por documento o código de registro con sus cuentas.
- **Actor:** Asesor o Administrador autenticado.
- **Precondiciones:** token válido; endpoint exige el rol apropiado. Los listados admiten límite y cursor/identificador de continuación.
- **Flujo principal:** consultar `GET /usuarios` o `/asesor-bancario/usuarios`; el asesor puede consultar `GET /asesor-bancario/usuario/{documento}` y `/asesor-bancario/codigo/{codigo_registro}`.
- **Alternativas/excepciones:** acceso sin rol admitido se rechaza; documento/código no encontrado devuelve error.
- **Resultado esperado:** datos del usuario y/o cuentas según el alcance del endpoint.
- **Módulo/evidencia:** Atención y administración; `Backend/main.py`; `Frontend/src/pages/Listausuarios.jsx`, `AsesorBancario.jsx`.
- **Estado:** Parcial; hay endpoints con autorización de rol, pero no se identificó un módulo de administración general para editar/desactivar cuentas de usuario, ni una verificación integral de autorización en todas las rutas auxiliares.

#### RF-007 — Crear y consultar cuentas de ahorro y corriente
- **Descripción:** los roles administrativos/asesoría pueden crear cuentas con número, tipo, operación, saldo inicial y estado; una cuenta corriente existente puede configurarse como crédito mediante la opción admitida.
- **Actor:** Asesor o Administrador autenticado.
- **Precondiciones:** usuario de destino existente; tipo y saldo válidos; no existir ya una cuenta del mismo tipo, salvo la ruta de configuración de crédito.
- **Flujo principal:** enviar `POST /usuarios/{id_usuario}/cuentas`; consultar `GET /usuarios/{id_usuario}/cuentas` o `GET /administradores/cuentas`.
- **Alternativas/excepciones:** usuario inexistente, cuenta duplicada o saldo negativo se rechazan.
- **Resultado esperado:** cuenta guardada con tipo `ahorros` o `corriente`, operación débito/crédito, número único y saldo.
- **Módulo/evidencia:** Cuentas; `Backend/main.py`, `Backend/schemas.py`, modelos `Cuenta` y `Usuario`, migración `e8698959a1e4_initial_schema.py`; pruebas de administración de cuentas.
- **Estado:** Implementado; las acciones administrativas requieren validación de permisos en la ruta correspondiente.

#### RF-008 — Habilitar, deshabilitar y ajustar una cuenta
- **Descripción:** el asesor puede consultar cuentas y cambiar el estado, tipo, operación, saldo o últimos dígitos del número; algunas acciones de administrador validan código adicional.
- **Actor:** Asesor o Administrador autenticado, de acuerdo con la ruta.
- **Precondiciones:** JWT válido, cuenta existente y datos de ajuste válidos; algunas operaciones requieren código de asesor/administrador.
- **Flujo principal:** usar rutas `/asesor-bancario/cuenta/{id_cuenta}/...`, `/asesor-bancario/usuario/{documento}/habilitar-cuentas`, `/deshabilitar-cuentas` o rutas `/administradores/cuenta/{id_cuenta}/...`.
- **Alternativas/excepciones:** cuenta inexistente, saldo negativo, número duplicado, código inválido o rol no permitido produce error.
- **Resultado esperado:** modificación persistida y estado actualizado.
- **Módulo/evidencia:** Operación de cuentas; rutas de `Backend/main.py`, modelos `Cuenta`, pruebas `test_administradores_cuentas.py` y `test_tipo_operacion_cuenta.py`.
- **Estado:** Parcial; hay operaciones implementadas, pero las rutas no conforman una política uniforme de aprobación/auditoría; el router separado `Backend/routers/asesor_bancario.py` no se monta en `app`.

#### RF-009 — Consultar cuentas y saldos propios
- **Descripción:** devolver al titular los saldos, estado, tipo y número de sus cuentas.
- **Actor:** Usuario autenticado.
- **Precondiciones:** JWT válido.
- **Flujo principal:** solicitar `GET /cuentas/saldos` o `/cuentas/mis-cuentas`; la respuesta omite el saldo de cuentas inactivas y presenta cero como saldo predeterminado.
- **Alternativas/excepciones:** sin cuentas, se devuelve el conjunto vacío o valores iniciales según la ruta.
- **Resultado esperado:** resumen limitado a las cuentas del usuario autenticado.
- **Módulo/evidencia:** Inicio/Cuentas; `Backend/main.py`, modelo `Cuenta`; frontend `cuenta.jsx` y `certificado.jsx`.
- **Estado:** Implementado; existen pruebas operativas de salud y pruebas de dominio relacionadas, no una afirmación de rendimiento.

#### RF-010 — Transferir entre cuentas propias
- **Descripción:** trasladar fondos entre una cuenta corriente y una de ahorros del mismo usuario, registrando salida e ingreso.
- **Actor:** Usuario autenticado.
- **Precondiciones:** ambas cuentas existen y están activas; monto positivo; saldo suficiente.
- **Flujo principal:** enviar `POST /transferencias/entre-cuentas`; el servidor bloquea las filas consultadas, calcula saldos, agrega transacciones de salida/entrada y confirma la sesión.
- **Alternativas/excepciones:** origen/destino iguales, cuenta ausente, inactiva, saldo insuficiente o error de persistencia cancela el flujo.
- **Resultado esperado:** saldos y dos registros de transacción guardados conjuntamente o error con rollback del flujo.
- **Módulo/evidencia:** Transferencias; `Backend/main.py`, modelos `Cuenta` y `Transaccion`.
- **Estado:** Implementado en backend; no se encontró prueba automatizada específica de este endpoint.

#### RF-011 — Transferir a una cuenta local de otro usuario
- **Descripción:** debitar una cuenta propia y acreditar una cuenta activa de otro usuario, registrando ambas transacciones.
- **Actor:** Usuario autenticado.
- **Precondiciones:** cuenta de origen propia activa; destino activo existente; monto positivo y saldo suficiente.
- **Flujo principal:** consultar `GET /cuentas/destino` y enviar `POST /transferencias`; el endpoint valida que el destino no pertenezca al mismo usuario y registra los dos movimientos.
- **Alternativas/excepciones:** destino no disponible, titularidad propia o saldo insuficiente causa rechazo y rollback.
- **Resultado esperado:** saldos de origen/destino y transacciones actualizados dentro de la misma sesión de base de datos.
- **Módulo/evidencia:** Transferencias; `Backend/main.py`, esquemas `TransferenciaSchema` y modelo `Transaccion`, `Frontend/src/pages/transferencias.jsx`.
- **Estado:** Implementado en backend; liquidación fuera de la base local no está implementada.

#### RF-012 — Registrar o cambiar una llave Bre-B local
- **Descripción:** vincular una llave única a una cuenta propia activa; el backend admite tipo de llave en una ruta alternativa.
- **Actor:** Usuario autenticado.
- **Precondiciones:** token válido; llave de al menos cuatro caracteres; cuenta activa propia identificada.
- **Flujo principal:** endpoint montado `PUT /bre-b/llave` crea o actualiza una llave alfanumérica en `LlaveBreb`; también existe `POST /bre-b/registrar-llave` en un router que no se incluye en la aplicación.
- **Alternativas/excepciones:** cuenta no indicada/no propia/inactiva, llave no válida o conflicto de unicidad se rechazan.
- **Resultado esperado:** llave asociada a usuario y cuenta en la base local.
- **Módulo/evidencia:** Bre-B; `Backend/main.py`, modelos `LlaveBreb`, `Cuenta`, `Usuario`; ajustes `Frontend/src/pages/ajustes.jsx`.
- **Estado:** Parcial; ajustes envía la llave sin el `id_cuenta` que exige el endpoint montado, y no hay flujo completo observado de baja/consulta de las llaves propias.

#### RF-013 — Transferir mediante llave Bre-B simulada
- **Descripción:** resolver una llave local y mover fondos entre cuentas activas internas, con control del tope configurado por operación, registro de movimientos y referencia.
- **Actor:** Usuario autenticado.
- **Precondiciones:** llave destino activa de otro usuario; cuenta de origen activa y cuenta destino asociada existente; monto positivo, saldo suficiente y tope aplicable no excedido. La ruta montada no filtra explícitamente el estado de la cuenta destino.
- **Flujo principal:** consultar `GET /bre-b/consultar/{llave}` y enviar `POST /transferencias/bre-b`; el servidor cambia saldos, crea movimientos y una fila `TransferenciaBreb` en estado procesado.
- **Alternativas/excepciones:** llave propia/no encontrada, destinatario sin cuenta, saldo insuficiente o tope excedido son rechazados; errores de persistencia producen rollback. La ausencia de filtro por estado permite que una cuenta destino inactiva sea considerada; requiere validación funcional.
- **Resultado esperado:** transferencia registrada y saldos locales actualizados.
- **Módulo/evidencia:** Bre-B; `Backend/main.py`, modelos `LlaveBreb`, `TransferenciaBreb`, `ControlTopeBreb`, `Cuenta`, `Transaccion`; existe además un router alternativo `Backend/routers/breb.py` no montado.
- **Estado:** Parcial como producto Bre-B; la simulación local existe, pero no se comunica con la red Bre-B ni con otro banco y no valida explícitamente que la cuenta destino esté activa.

#### RF-014 — Consultar y filtrar historial de movimientos
- **Descripción:** listar movimientos propios ordenados por fecha y permitir que la interfaz filtre por ingreso/salida y busque por descripción.
- **Actor:** Usuario autenticado.
- **Precondiciones:** JWT válido.
- **Flujo principal:** `GET /transacciones` filtra por cuentas propias; interfaz Historial muestra resultados, filtros y búsqueda.
- **Alternativas/excepciones:** backend no disponible hace que la interfaz recurra a historiales guardados localmente; esos datos locales pueden estar desactualizados o repetidos.
- **Resultado esperado:** movimientos persistidos del titular presentados con fecha, monto, descripción y datos derivados de origen/destino.
- **Módulo/evidencia:** Historial; `Backend/main.py`, modelos `Transaccion` y `Cuenta`, `Frontend/src/pages/historial.jsx`.
- **Estado:** Parcial; consulta API operativa, pero no se implementan paginación/filtros en backend y el fallback del cliente no garantiza consistencia.

### Tarjetas, avisos y administración

#### RF-015 — Consultar y administrar tarjetas
- **Descripción:** asociar, consultar, modificar, eliminar, activar o desactivar tarjetas vinculadas a una cuenta; permitir vistas propias y administrativas.
- **Actor:** Usuario titular, Asesor o Administrador autenticado, según la ruta.
- **Precondiciones:** tarjeta/cuenta existentes; cuenta activa para crear tarjeta; operaciones sobre otra persona requieren rol permitido.
- **Flujo principal:** usar `/tarjetas/mias`, `/tarjeta`, `/usuarios/{id_usuario}/tarjetas`, `POST /usuarios/{id_usuario}/tarjetas`, `PATCH /tarjetas/{id_tarjeta}`, `/activar`, `/desactivar` o `DELETE /tarjetas/{id_tarjeta}`.
- **Alternativas/excepciones:** no tener cuenta activa, tarjeta ausente, datos de CVV/fecha inválidos o acceso no autorizado produce error.
- **Resultado esperado:** estado y datos de tarjeta asociados persistidos; algunas respuestas administrativas muestran solo últimos dígitos.
- **Módulo/evidencia:** Tarjetas; rutas de `Backend/main.py`, modelo `Tarjeta`, migración inicial; prueba `test_tarjetas_usuario.py`.
- **Estado:** Parcial; APIs de gestión existen, pero hay endpoints que devuelven el número completo y el CVV y el esquema conserva ambos valores sin cifrado visible.

#### RF-016 — Bloquear/desbloquear tarjeta y restablecer CVV
- **Descripción:** bloquear tarjeta tras validar identidad con contraseña/documento, desbloquear la tarjeta/cuenta corriente del usuario y generar una nueva clave de seguridad una sola vez.
- **Actor:** Usuario autenticado.
- **Precondiciones:** JWT válido; para bloquear una tarjeta concreta se aporta contraseña o documento; para CVV la tarjeta no debe haber sido restablecida antes.
- **Flujo principal:** llamar `PUT /tarjetas/{id_tarjeta}/bloquear`, `/tarjetas/{id_tarjeta}/restablecer-cvv`, `/tarjeta/bloquear`, `/tarjeta/desbloquear` o `/tarjeta/restablecer-cvv`.
- **Alternativas/excepciones:** identidad inválida, tarjeta/cuenta no existente o CVV ya restablecido son rechazados.
- **Resultado esperado:** tarjeta bloqueada/activa y/o CVV actualizado; las rutas singulares de bloqueo/desbloqueo también cambian el estado de la cuenta corriente.
- **Módulo/evidencia:** Seguridad de tarjetas; `Backend/main.py`, modelo `Tarjeta`; prueba `test_tarjetas_usuario.py`.
- **Estado:** Parcial; hay endpoints, pero desbloquear requiere solo JWT y el endpoint expone el nuevo CVV en su respuesta.

#### RF-017 — Consultar y administrar notificaciones
- **Descripción:** consultar las notificaciones propias, marcarlas como leídas o eliminarlas individualmente/en conjunto.
- **Actor:** Usuario autenticado.
- **Precondiciones:** JWT válido; las operaciones individuales deben identificar una notificación del propio usuario.
- **Flujo principal:** `GET /notificaciones`, `PUT /notificaciones/leer-todas`, `PUT /notificaciones/{id_notificacion}/leer`, `DELETE /notificaciones/{id_notificacion}` o `DELETE /notificaciones`.
- **Alternativas/excepciones:** notificación inexistente o perteneciente a otra persona no se entrega y responde no encontrada.
- **Resultado esperado:** lista y estado de lectura/eliminación persistidos; el código crea avisos locales en registro e inicio de sesión.
- **Módulo/evidencia:** Notificaciones; `Backend/main.py`, modelo `Notificacion`, `Frontend/src/pages/notificaiones.jsx`.
- **Estado:** Implementado en backend; el envío de correo es complementario y depende de SMTP.

#### RF-018 — Administrar asesores
- **Descripción:** crear, listar, editar, eliminar asesores y restablecer su código de acceso.
- **Actor:** Administrador autenticado.
- **Precondiciones:** token asociado a fila `Administrador`; datos requeridos válidos.
- **Flujo principal:** usar `POST/GET /administradores/asesores`, `PUT/DELETE /administradores/asesores/{id_asesor}` o `POST /administradores/asesores/{id_asesor}/restablecer-codigo`.
- **Alternativas/excepciones:** rol no administrador, datos inválidos, asesor ausente o código duplicado causan rechazo.
- **Resultado esperado:** registro de asesor persistido o actualizado con código único y estado activo/inactivo.
- **Módulo/evidencia:** Administración de asesores; `Backend/main.py`, modelos `Administrador` y `AsesorBanco`; pruebas `test_administradores_asesores.py`.
- **Estado:** Implementado; hay una prueba automatizada de las operaciones de administración.

#### RF-019 — Gestionar beneficio de usuario
- **Descripción:** un asesor puede consultar elegibilidad estimada por edad y habilitar/deshabilitar el indicador de beneficio con confirmación adicional para usuarios menores de 60 años.
- **Actor:** Asesor autenticado.
- **Precondiciones:** usuario existente con fecha de nacimiento para clasificación; mayor de edad para habilitar; confirmación de discapacidad cuando aplique.
- **Flujo principal:** el listado `/usuarios` expone datos de edad/tipo de beneficio al asesor; `PUT /usuarios/{id_usuario}/beneficio` persiste los indicadores.
- **Alternativas/excepciones:** menor de edad, falta de fecha o falta de confirmación requerida impide habilitar.
- **Resultado esperado:** `beneficio_habilitado` y `discapacidad_confirmada` guardados en usuario.
- **Módulo/evidencia:** Beneficios; `Backend/main.py`, `Backend/schemas.py`, modelo `Usuario`, prueba `test_beneficio_usuarios.py`.
- **Estado:** Implementado en la lógica del backend; no se acredita un cálculo monetario, pago o integración con un programa externo.

#### RF-020 — Consultar estadísticas y cuentas administrativas
- **Descripción:** mostrar a roles administrativos o asesores listados de cuentas y contadores de usuarios, cuentas y tarjetas activas.
- **Actor:** Administrador o Asesor autenticado.
- **Precondiciones:** JWT válido y rol admitido por las dependencias de las rutas.
- **Flujo principal:** consultar `GET /administradores/cuentas` y `GET /administradores/estadisticas`.
- **Alternativas/excepciones:** acceso no autorizado o error de consulta impide devolver resultados.
- **Resultado esperado:** conteos agregados y lista de hasta 100 cuentas por solicitud con cursor de continuación disponible.
- **Módulo/evidencia:** Panel administrativo; `Backend/main.py`, modelos `Usuario`, `Cuenta`, `Tarjeta`; pruebas de estadísticas/cuentas administrativas.
- **Estado:** Implementado en backend; no se verificó un SLA ni el comportamiento de paginación en cargas grandes.

### Reportes, certificados e IA

#### RF-021 — Consultar reporte y reportar una transacción fallida
- **Descripción:** la pantalla de reporte presenta movimientos actuales o copias locales; existe un endpoint protegido que recibe y registra en log un reporte de transacción fallida.
- **Actor:** Usuario autenticado.
- **Precondiciones:** token válido; para reporte de movimientos, endpoint `/transacciones` disponible o historial local.
- **Flujo principal:** frontend consulta `GET /transacciones` y renderiza filas; `POST /reportes/transaccion-fallida` registra el evento en log.
- **Alternativas/excepciones:** si falla la API, el frontend muestra datos locales; el endpoint de falla no crea una entidad ni un caso persistente.
- **Resultado esperado:** tabla visible o mensaje de error; para reporte fallido, respuesta de aceptación y registro en log, sin seguimiento en una bandeja.
- **Módulo/evidencia:** Reportes; `Backend/main.py`, `Frontend/src/pages/reporte.jsx`, modelo `Transaccion`.
- **Estado:** Parcial; no se encontró generación/exportación de un reporte financiero persistido ni gestión del ciclo de reporte de fallo.

#### RF-022 — Generar certificado descargable en el cliente
- **Descripción:** la interfaz compone un certificado visual y permite descargarlo como PDF local, utilizando perfil y saldos recuperados del backend junto con campos presentados/editables en la pantalla.
- **Actor:** Usuario autenticado.
- **Precondiciones:** aplicación React; para datos de cuenta, JWT y al menos una cuenta activa.
- **Flujo principal:** frontend consulta `/usuario` y `/cuentas/saldos`, renderiza el certificado y ejecuta html2pdf en el navegador.
- **Alternativas/excepciones:** falta de sesión, error API o datos ausentes produce error o valores por defecto en la interfaz.
- **Resultado esperado:** archivo PDF generado por el navegador; no se persiste ni se emite desde un servicio bancario backend.
- **Módulo/evidencia:** Certificados; `Frontend/src/pages/certificado.jsx`, paquete `html2pdf.js`, endpoints `/usuario` y `/cuentas/saldos`.
- **Estado:** Parcial; existe descarga cliente, pero la respuesta `/usuario` no contiene varios datos bancarios que la página intenta leer y no hay endpoint de certificación oficial.

#### RF-023 — Consultar asistente conversacional con IA
- **Descripción:** recibir una pregunta y hasta seis mensajes previos admitidos y devolver una respuesta generada por el proveedor configurado.
- **Actor:** Usuario autenticado y proveedor LLM.
- **Precondiciones:** token válido; mensaje no vacío, hasta 4000 caracteres; proveedor Groq y clave configurados.
- **Flujo principal:** el frontend envía `POST /ia/chat`; el servidor valida el cuerpo/historial, consulta el modelo y responde con la propiedad `respuesta`.
- **Alternativas/excepciones:** token ausente produce 401; validación incorrecta produce 400/422; falta de proveedor o error externo produce error de servicio.
- **Resultado esperado:** texto limitado en el módulo LLM a 300 caracteres; el asistente ofrece orientación, no ejecuta transferencias ni consulta datos privados mediante una herramienta bancaria.
- **Módulo/evidencia:** Chat IA; `Backend/ai/router.py`, `chains.py`, `llm.py`, `config.py`; `Frontend/src/pages/ChatIA.jsx`; pruebas `test_chatbot_bancario.py` y `test_llm.py`.
- **Estado:** Parcial; endpoint y pruebas existen, pero la operación depende de proveedor/credenciales. La configuración de respaldo está definida, aunque el flujo que atiende la ruta importa `consultar_modelo` de Groq.

## Funcionalidades solicitadas sin evidencia de operación completa

Estos elementos se consignan como hallazgos de alcance, no como requisitos implementados:

| Funcionalidad | Evidencia y conclusión |
| --- | --- |
| Verificación de identidad independiente | `Frontend/src/pages/VerificacionIdentidad.jsx` solicita `POST /verificacion-identidad`, pero no se encontró esa ruta en el backend. La comprobación de código en esa pantalla se realiza localmente; el endpoint no implementa solicitud ni aprobación. |
| Segundo factor en el inicio de sesión | El login devuelve el JWT aunque genere un código de correo; no hay ruta que verifique ese código antes de aceptar el token. |
| Red Bre-B/transferencia interbancaria real | Los movimientos Bre-B se liquidan entre cuentas internas de la misma base MySQL; no hay integración con una red bancaria. |
| Reportes exportables/analítica financiera | La página de reporte representa movimientos; no se encontró API dedicada a generar informes agregados o exportables. |
| Certificado oficial verificable | El PDF es elaborado en el navegador y no se firma, almacena ni valida desde backend. |
| Administración integral de usuarios | Hay consulta de usuarios, ajustes de perfil por asesor y acciones de cuenta; no se encontró un ciclo completo de alta/baja/edición administrativa general del usuario. |
| Topes globales o periódicos | El usuario puede guardar dos topes; la transferencia Bre-B valida el monto individual contra el tope de origen. No se observó aplicación del tope a transferencias normales ni una regla temporal agregada. |

## Modelo de datos y trazabilidad funcional

Los modelos y la migración inicial describen `usuario`, `tipo_documento`, `administradores`, `asesores_banco`, `cuentas`, `transacciones`, `notificaciones`, `tarjetas`, `llaves_breb`, `transferencias_breb` y `control_topes_breb`. Se observan claves foráneas entre usuarios/cuentas/movimientos/tarjetas/llaves/transferencias y restricciones únicas para correo, documento, número de cuenta, llave y referencias de transferencia. La tabla `ubicacionesPorCiudad` aparece en el SQL de sesión. Esto demuestra estructura persistente, no la correcta ejecución de todas las reglas de negocio.

## Criterio transversal de aceptación

Un requisito funcional solo debe cambiar a aceptado para una entrega cuando se ejecute un caso reproducible del endpoint y, si tiene interfaz, el flujo frontend correspondiente; se deben comprobar actor/propietario, datos de error y efecto persistido en base. Los flujos identificados como parciales requieren cerrar primero la brecha consignada en su estado. Los estados de este documento expresan evidencia del repositorio y no sustituyen una prueba de aceptación de usuario en el entorno de entrega.
