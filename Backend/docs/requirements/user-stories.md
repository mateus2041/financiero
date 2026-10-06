# Historias de usuario

**Producto:** Billetera Financiera
**Revisión:** 6 de octubre de 2026

## Actores

| Actor | Necesidad |
| --- | --- |
| Visitante | Crear una cuenta o recuperar el acceso. |
| Usuario | Consultar y administrar sus propias cuentas, tarjetas, movimientos y datos. |
| Asesor | Ayudar a usuarios mediante operaciones permitidas por su rol. |
| Administrador | Administrar asesores y realizar tareas de supervisión autorizadas. |

## Convención de estado

**Código presente** identifica rutas/pantallas relacionadas, no una aceptación de producto. **Por validar** requiere ejecutar el flujo completo y comprobar criterios. No se trasladan estimaciones, fechas ni responsables del material anterior porque no se pudieron verificar.

## Acceso y perfil

### HU-01 — Crear mi cuenta

Como visitante, quiero registrarme con mis datos, para acceder a la billetera.

- El formulario valida los campos requeridos y formatos.
- La API rechaza identificadores duplicados y no devuelve secretos.
- La interfaz presenta confirmación o errores accionables.
- **Estado:** código presente; reglas y flujo integral por validar.

### HU-02 — Acceder a mi cuenta

Como usuario, quiero iniciar sesión, para consultar mis cuentas de forma protegida.

- Las credenciales inválidas no permiten acceso.
- La sesión se valida en rutas privadas y termina al vencer o cerrar sesión.
- Roles de usuario, asesor y administrador no se intercambian.
- **Estado:** rutas de login y seguridad presentes; expiración y autorización por validar.

### HU-03 — Recuperar el acceso

Como usuario, quiero verificar mi identidad y cambiar mi contraseña, para recuperar el acceso.

- El código/token expira y no puede reutilizarse.
- El sistema comunica el resultado sin revelar innecesariamente si el usuario existe.
- La nueva contraseña se almacena usando hash seguro.
- **Estado:** rutas de recuperación presentes; envío, expiración y casos negativos por validar.

### HU-04 — Mantener mis datos actualizados

Como usuario, quiero consultar y modificar los datos permitidos de mi perfil, para mantenerlos correctos.

- Solo puedo consultar/editar mi propio perfil, salvo permiso administrativo explícito.
- La API valida campos y la interfaz confirma el resultado.
- **Estado:** rutas de perfil presentes; autorización e integración por validar.

## Cuentas, tarjetas y movimientos

### HU-05 — Consultar mis cuentas

Como usuario, quiero ver mis cuentas, estado y saldo, para conocer mi dinero disponible.

- Solo aparecen cuentas a las que tengo acceso.
- El saldo mostrado coincide con los movimientos confirmados.
- Los errores de carga se comunican sin mostrar datos incorrectos como actuales.
- **Estado:** modelo y rutas presentes; consistencia y experiencia completa por validar.

### HU-06 — Administrar una tarjeta

Como usuario, quiero consultar y bloquear o desbloquear mi tarjeta, para controlar su uso.

- Solo el titular o un rol autorizado puede operar la tarjeta.
- Los datos sensibles no se muestran ni registran sin necesidad.
- El estado actualizado se comunica claramente.
- **Estado:** rutas de gestión presentes; revisión de seguridad obligatoria.

### HU-07 — Revisar mis movimientos

Como usuario, quiero consultar las transacciones de mis cuentas, para entender cambios en mi saldo.

- Cada movimiento corresponde a una cuenta autorizada.
- Fecha, tipo, monto y descripción se presentan con formato consistente.
- Filtros/paginación se ofrecen si están disponibles en el contrato final.
- **Estado:** modelo y endpoint presentes; filtros, paginación y UI por validar.

### HU-08 — Transferir entre cuentas

Como usuario, quiero transferir dinero a una cuenta permitida, para mover fondos.

- Se valida titularidad/permisos, cuenta activa y fondos disponibles.
- Débito y crédito se confirman juntos o se revierten juntos.
- La operación confirmada aparece en el historial; un fallo no descuenta saldo.
- **Estado:** endpoint presente; atomicidad, errores e integración por validar.

### HU-09 — Usar una llave BRE-B

Como usuario, quiero registrar o consultar una llave y solicitar una transferencia, para operar mediante ese identificador.

- La llave se valida y se asocia al titular/cuenta correctos.
- Antes de confirmar, se muestra información suficiente del destino sin exponer datos innecesarios.
- Se informa claramente si la operación solo es simulada o no alcanza una red bancaria real.
- **Estado:** rutas BRE-B presentes; integración real y alcance por confirmar.

## Atención y administración

### HU-10 — Recibir y gestionar notificaciones

Como usuario, quiero consultar y marcar notificaciones, para conocer eventos de mi cuenta.

- Solo puedo acceder a mis notificaciones.
- Puedo marcar como leídas y eliminar según las acciones disponibles.
- **Estado:** endpoints presentes; aislamiento e interfaz por validar.

### HU-11 — Obtener ayuda del asistente

Como usuario, quiero enviar una consulta al asistente, para recibir orientación dentro de la aplicación.

- El fallo o indisponibilidad del proveedor se comunica y no bloquea otros servicios.
- No se envían secretos ni datos financieros innecesarios al proveedor.
- **Estado:** endpoint presente; privacidad, límites y fallback por validar.

### HU-12 — Gestionar operaciones por rol

Como asesor o administrador, quiero realizar solo las operaciones que me corresponden, para dar soporte sin acceso excesivo.

- Cada acción verifica rol y autorización en el servidor.
- Las acciones sensibles dejan evidencia auditable sin incluir secretos.
- Se prueban explícitamente accesos denegados.
- **Estado:** rutas de asesoría/administración presentes; matriz de permisos y auditoría por validar.

## Criterio común de aceptación

Una historia queda aceptada cuando cumple todos sus criterios en una prueba reproducible de API y, cuando tenga interfaz, en el flujo frontend. Adjuntar evidencia y registrar limitaciones; no marcarla como terminada solo por encontrar código relacionado.
