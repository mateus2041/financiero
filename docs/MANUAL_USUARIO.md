# Manual básico de usuario

Este manual describe las rutas que el frontend monta actualmente desde `Frontend/src/App.js`.
Las operaciones dependen del backend disponible y de los permisos de la cuenta. Las pantallas
no implican que un servicio externo de pagos esté conectado.

## Acceso

1. Abra la dirección local indicada en [Operación y despliegue](OPERACION_Y_DESPLIEGUE.md) o la
   URL aprobada por el administrador.
2. Desde el inicio, use **Registro** para crear una cuenta o **Login** para ingresar.
3. Use **Recuperación** si olvidó sus credenciales. Las notificaciones por correo requieren
   configuración válida del servicio de correo.
4. Cierre sesión al terminar y no comparta el token de sesión, códigos de recuperación ni
   capturas que muestren información personal.

## Funciones visibles

La interfaz contiene rutas para cuenta, historial, transferencias, cuenta corriente, certificado,
ajustes, reporte, verificación de identidad, asesoría, asistente IA, administración, cuentas,
usuarios, transferencias SCR/BRE-B, notificaciones, mensajes, desbloqueo de tarjeta y tarjetas.
La visibilidad y resultado de cada acción depende de las credenciales, rol, datos disponibles y
servicios opcionales configurados.

Antes de ejecutar movimientos, confirme los datos y la operación con la entidad responsable.
Este proyecto no acredita conexión a una red bancaria real ni certificación regulatoria. No use
cuentas, tarjetas, claves o datos reales salvo que exista autorización y un ambiente seguro.

## Si una pantalla no carga

- Compruebe que API y base de datos estén disponibles mediante `/health/ready`.
- Verifique que la URL de API corresponda al entorno y que la sesión no haya vencido.
- No reintente una transferencia cuando no sepa si se registró; confirme el historial o consulte
  al soporte para evitar duplicados.
- Para errores persistentes, reporte ruta, hora y mensaje saneado; nunca envíe contraseña,
  token, código de seguridad de tarjeta o número completo de cuenta.

## Guías por rol

### Cliente

1. Cree una cuenta desde **Registro** y complete la verificación indicada.
2. Entre desde **Login** y abra **Cuenta** para consultar saldo y datos.
3. Abra **Historial** para revisar movimientos y **Tarjetas** para gestionar la tarjeta propia.
4. Use **Transferencias** únicamente después de verificar cuenta destino y monto.
5. Si el movimiento no aparece confirmado, no repita la operación: revise historial y soporte.

### Asesor bancario

1. Inicie sesión desde el flujo de asesor y espere el código de verificación.
2. Use las pantallas de asesoría solo para consultas y operaciones permitidas por su rol.
3. Verifique la titularidad antes de informar o modificar datos de terceros.
4. Nunca registre contraseñas, CVV o tokens completos en notas o capturas.

### Administrador

1. Acceda por la ruta autorizada de administración.
2. Desde **Administradores** y **Usuarios** gestione solo las funciones asignadas.
3. Revise cuentas, asesores y estadísticas; confirme cambios críticos antes de aplicarlos.
4. Preserve registros saneados de auditoría y no exporte datos sensibles.

## Preguntas frecuentes

**¿La aplicación mueve dinero real?**  
No. BRE-B y otras operaciones se deben considerar simuladas hasta que exista integración y
certificación explícita del proveedor autorizado.

**¿Por qué una sesión caduca?**  
<<<<<<< HEAD
Los tokens expiran tras 30 minutos. Vuelva a iniciar sesión; no reutilice tokens ni los comparta.
=======
Los tokens tienen expiración. Vuelva a iniciar sesión; no reutilice tokens ni los comparta.
>>>>>>> develop

**¿Qué hago ante un error de transferencia?**  
No reintente hasta confirmar que la operación no quedó registrada en el historial.

**¿Qué datos debo reportar a soporte?**  
Ruta, hora, resultado observado y mensaje sanitizado. No envíe contraseñas, tokens, CVV ni
números completos de cuenta o tarjeta.
