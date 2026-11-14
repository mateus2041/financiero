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
