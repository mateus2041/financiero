# Matriz de trazabilidad y pendientes

**Base:** documentos funcionales existentes, modelos y rutas identificados. El estado registra evidencia, no una aceptación de producto.

| ID documental | Capacidad | Evidencia de implementación | Validación que falta |
|---|---|---|---|
| ACC | Registro/login/recuperación | Rutas en `Backend/main.py`, seguridad y esquemas | Flujo integral, expiración, mensajes seguros y roles. |
| PERF | Perfil | Rutas de perfil y modelo de usuario | Propiedad del recurso, campos permitidos e integración UI. |
| CUE | Cuentas/saldos | Modelo `Cuenta`, endpoints y pantallas frontend | Reglas de negocio, permisos, precisión e integridad. |
| TAR | Tarjetas | Modelo `Tarjeta`, rutas de gestión | Almacenamiento/exposición de datos sensibles y autorización. |
| MOV | Historial de transacciones | Modelo `Transaccion`, endpoint `/transacciones` | Aislamiento, orden, filtros y paginación. |
| TRF | Transferencia interna | Endpoint `/transferencias/entre-cuentas` | Atomicidad, concurrencia, reintento, comprobante y errores. |
| BREB | Llaves/transferencia BRE-B | Modelo y rutas en API/router | Simulación versus integración, contrato y pruebas externas. |
| ADM | Administración/asesoría | Rutas administrativas y router asesor | Matriz aprobada, auditoría y negativas. |
| NOT | Notificaciones | Modelo y rutas en `Backend/main.py` | Aislamiento e interacción completa en frontend. |
| IA | Asistente conversacional | Router `/ia/chat`, módulos IA y pruebas focalizadas | Privacidad, proveedor, límites, timeout y disponibilidad. |
| OPS | Migraciones/operación | Alembic con una sola revisión `head`, perfil Compose `maintenance`, endpoints de salud y herramienta de respaldo | Ensayar upgrade/restore en MySQL aislado y en una copia de datos existentes. |
| SEC | Seguridad de ejecución | CORS explícito, clave JWT por ambiente, secretos MySQL externos | Definir clave persistente/HTTPS y ejecutar revisión de seguridad. |
| QA | Calidad | Pruebas focalizadas backend, suite heredada, build frontend y validación Compose | Resolver fallos heredados y ejecutar aceptación end-to-end con servicios activos. |

## Prioridad de cierre sugerida

1. Ensayar migraciones/Compose y resolver conflictos de documentación heredada.
2. Verificar autorización por rol/titularidad y tratamiento de tarjetas.
3. Probar atomicidad y casos de error de transferencias.
4. Ejecutar la suite backend, pruebas frontend y build.
5. Confirmar alcance de BRE-B y de las funciones mostradas en interfaz.
6. Completar guía oficial y rúbrica semanal ausentes; ajustar títulos y criterios de semanas 03–09.

## Registro de evidencia para completar

| Fecha | Versión/ambiente | Comando o escenario | Resultado | Evidencia/defecto |
|---|---|---|---|---|
| Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |

No marcar una fila como aceptada hasta registrar una prueba reproducible y resolver defectos bloqueantes.
