# Requisitos Funcionales — FinanceWeb

**Proyecto:** FinanceWeb — Plataforma web de gestión financiera personal
**Versión:** 1.0
**Fecha:** Abril 2026
**Clasificación:** Académico

---

## Módulo 1 — Navegación y Dashboard (RF-NAV)

| ID        | Requisito                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------- |
| RF-NAV-01 | El sistema debe presentar una pantalla principal (Dashboard) con resumen financiero del usuario.      |
| RF-NAV-02 | El sistema debe implementar navegación mediante Sidebar para acceder a todos los módulos del sistema. |
| RF-NAV-03 | El sistema debe implementar rutas protegidas para módulos privados.                                   |
| RF-NAV-04 | El sistema debe soportar navegación responsive para escritorio, tablet y móvil.                       |
| RF-NAV-05 | El sistema debe soportar deep linking para acceder directamente a módulos específicos mediante URL.   |

---

## Módulo 2 — Gestión de usuarios (RF-USER)

| ID         | Requisito                                                                             |
| ---------- | ------------------------------------------------------------------------------------- |
| RF-USER-01 | El sistema debe permitir registro de usuarios mediante email y contraseña.            |
| RF-USER-02 | El sistema debe permitir inicio y cierre de sesión seguro mediante JWT.               |
| RF-USER-03 | El sistema debe permitir recuperación de contraseña mediante correo electrónico.      |
| RF-USER-04 | El sistema debe permitir edición del perfil del usuario autenticado.                  |
| RF-USER-05 | El sistema debe mantener la sesión activa hasta expiración del token o cierre manual. |

---

## Módulo 3 — Gestión de ingresos (RF-INCOME)

| ID           | Requisito                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------- |
| RF-INCOME-01 | El sistema debe permitir registrar ingresos financieros manualmente.                        |
| RF-INCOME-02 | El sistema debe permitir categorizar ingresos por tipo (salario, inversión, ventas, otros). |
| RF-INCOME-03 | El sistema debe validar que el monto ingresado sea mayor a cero.                            |
| RF-INCOME-04 | El sistema debe permitir editar y eliminar ingresos registrados.                            |
| RF-INCOME-05 | El sistema debe mostrar historial paginado de ingresos.                                     |

---

## Módulo 4 — Gestión de gastos (RF-EXP)

| ID        | Requisito                                                                                                         |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| RF-EXP-01 | El sistema debe permitir registrar gastos financieros manualmente.                                                |
| RF-EXP-02 | El sistema debe permitir categorizar gastos (alimentación, transporte, salud, entretenimiento, servicios, otros). |
| RF-EXP-03 | El sistema debe validar que el monto del gasto sea positivo.                                                      |
| RF-EXP-04 | El sistema debe permitir editar y eliminar gastos registrados.                                                    |
| RF-EXP-05 | El sistema debe mostrar historial filtrable por categoría y fecha.                                                |

---

## Módulo 5 — Presupuestos (RF-BUD)

| ID        | Requisito                                                                              |
| --------- | -------------------------------------------------------------------------------------- |
| RF-BUD-01 | El sistema debe permitir crear presupuestos mensuales por categoría.                   |
| RF-BUD-02 | El sistema debe calcular automáticamente el porcentaje utilizado del presupuesto.      |
| RF-BUD-03 | El sistema debe mostrar alertas visuales cuando el gasto supere el límite configurado. |
| RF-BUD-04 | El sistema debe permitir modificar y eliminar presupuestos existentes.                 |
| RF-BUD-05 | El sistema debe mostrar gráficos comparativos entre presupuesto y gasto real.          |

---

## Módulo 6 — Reportes y estadísticas (RF-REP)

| ID        | Requisito                                                        |
| --------- | ---------------------------------------------------------------- |
| RF-REP-01 | El sistema debe generar gráficos de ingresos y gastos mensuales. |
| RF-REP-02 | El sistema debe permitir filtrar reportes por rango de fechas.   |
| RF-REP-03 | El sistema debe mostrar balance total (ingresos - gastos).       |
| RF-REP-04 | El sistema debe exportar reportes en formato PDF.                |
| RF-REP-05 | El sistema debe exportar reportes en formato Excel (.xlsx).      |

---

## Módulo 7 — Categorías financieras (RF-CAT)

| ID        | Requisito                                                                              |
| --------- | -------------------------------------------------------------------------------------- |
| RF-CAT-01 | El sistema debe permitir crear categorías personalizadas de ingresos y gastos.         |
| RF-CAT-02 | El sistema debe validar que no existan categorías duplicadas para el mismo usuario.    |
| RF-CAT-03 | El sistema debe permitir editar categorías existentes.                                 |
| RF-CAT-04 | El sistema debe impedir eliminar categorías que estén asociadas a movimientos activos. |
| RF-CAT-05 | El sistema debe mostrar listado completo de categorías registradas.                    |

---

## Módulo 8 — Notificaciones y alertas (RF-NOTIF)

| ID          | Requisito                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------ |
| RF-NOTIF-01 | El sistema debe enviar alertas visuales cuando un presupuesto esté cerca del límite configurado. |
| RF-NOTIF-02 | El sistema debe mostrar recordatorios de pagos próximos configurados por el usuario.             |
| RF-NOTIF-03 | El sistema debe permitir activar o desactivar notificaciones desde configuración.                |
| RF-NOTIF-04 | El sistema debe mostrar mensajes de éxito o error después de operaciones importantes.            |

---

## Módulo 9 — Persistencia y almacenamiento (RF-STOR)

| ID         | Requisito                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------- |
| RF-STOR-01 | El sistema debe almacenar toda la información financiera en PostgreSQL.                        |
| RF-STOR-02 | El sistema debe realizar persistencia automática de cambios en tiempo real.                    |
| RF-STOR-03 | El sistema debe implementar respaldo lógico de la base de datos.                               |
| RF-STOR-04 | El sistema debe permitir mantener sesión persistente mediante almacenamiento seguro del token. |

---

## Módulo 10 — Seguridad y acceso (RF-SEC)

| ID        | Requisito                                                                              |
| --------- | -------------------------------------------------------------------------------------- |
| RF-SEC-01 | El sistema debe restringir el acceso a rutas privadas sin autenticación válida.        |
| RF-SEC-02 | El sistema debe cifrar contraseñas utilizando bcrypt o equivalente.                    |
| RF-SEC-03 | El sistema debe validar permisos antes de modificar o eliminar información financiera. |
| RF-SEC-04 | El sistema debe cerrar automáticamente sesiones expiradas.                             |
| RF-SEC-05 | El sistema debe registrar intentos fallidos de autenticación.                          |

---

## Módulo 11 — Dashboard en tiempo real (RF-REAL)

| ID         | Requisito                                                                                        |
| ---------- | ------------------------------------------------------------------------------------------------ |
| RF-REAL-01 | El sistema debe actualizar automáticamente el balance financiero al registrar ingresos o gastos. |
| RF-REAL-02 | El sistema debe actualizar gráficos y estadísticas sin necesidad de recargar la página.          |
| RF-REAL-03 | El sistema debe sincronizar cambios de información en tiempo real para la sesión activa.         |

---

## Módulo 12 — Responsividad y experiencia de usuario (RF-UX)

| ID       | Requisito                                                                                     |
| -------- | --------------------------------------------------------------------------------------------- |
| RF-UX-01 | El sistema debe ser responsivo desde 320 px hasta 1440 px de ancho.                           |
| RF-UX-02 | El sistema debe adaptar componentes para escritorio, tablet y móvil.                          |
| RF-UX-03 | El sistema debe mostrar indicadores de carga durante peticiones HTTP.                         |
| RF-UX-04 | El sistema debe mostrar mensajes claros de validación en formularios.                         |
| RF-UX-05 | El sistema debe mantener tiempos de respuesta inferiores a 3 segundos en operaciones comunes. |

---

## Módulo 13 — Configuración del sistema (RF-CONF)

| ID         | Requisito                                                              |
| ---------- | ---------------------------------------------------------------------- |
| RF-CONF-01 | El sistema debe permitir cambiar entre modo claro y oscuro.            |
| RF-CONF-02 | El sistema debe permitir configurar moneda principal del usuario.      |
| RF-CONF-03 | El sistema debe permitir configurar idioma del sistema.                |
| RF-CONF-04 | El sistema debe guardar preferencias de usuario de manera persistente. |

---

## Módulo 14 — Navegación bloqueada y control de acceso (RF-BLOCK)

| ID          | Requisito                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| RF-BLOCK-01 | El sistema debe bloquear el acceso a rutas privadas cuando el usuario no esté autenticado.                                      |
| RF-BLOCK-02 | El sistema debe redirigir automáticamente al login cuando un usuario intente acceder a una ruta restringida.                    |
| RF-BLOCK-03 | El sistema debe mostrar un mensaje informativo indicando que la navegación está bloqueada por falta de permisos.                |
| RF-BLOCK-04 | El sistema debe deshabilitar enlaces y botones de navegación hacia módulos restringidos para usuarios sin permisos.             |
| RF-BLOCK-05 | El sistema debe mantener el estado de bloqueo incluso tras recargar la página hasta que el usuario se autentique correctamente. |
| RF-BLOCK-06 | El sistema debe permitir desbloquear la navegación automáticamente después de iniciar sesión exitosamente.                      |
| RF-BLOCK-07 | El sistema debe registrar intentos de acceso no autorizados para fines de auditoría básica.                                     |
| RF-BLOCK-08 | El sistema debe mostrar indicadores visuales (ícono de candado o estado deshabilitado) en módulos bloqueados.                   |

---
