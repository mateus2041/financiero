# Plan de sprints

**Proyecto:** Billetera Financiera
**Revisión:** 6 de octubre de 2026

## Nota sobre el calendario anterior

El documento previo mezclaba agendas y fechas incompatibles (sprints simultáneos, duraciones que no coinciden y años distintos). No se puede inferir un calendario aprobado ni resultados reales de esas fechas. Se reemplaza por una propuesta de secuencia sin fechas; el equipo debe acordar duración, responsables y estado antes de planificar cada sprint.

## Propuesta de secuencia

| Sprint propuesto | Objetivo | Resultado verificable |
| --- | --- | --- |
| 1. Entorno y documentación | Reproducir instalación y ejecución de frontend/API/MySQL; documentar configuración | Una persona nueva ejecuta el proyecto siguiendo la guía; sin secretos en ejemplos |
| 2. Seguridad y acceso | Revisar registro, login, recuperación, roles y propiedad de recursos | Pruebas de autorización y recuperación pasan; matriz de permisos aprobada |
| 3. Cuentas y tarjetas | Validar creación, consulta, cambios de estado/saldo y protección de datos | Flujos de cuenta/tarjeta aceptados con casos de error y permisos |
| 4. Movimientos y transferencias | Verificar historial, transferencias internas y BRE-B según alcance aprobado | Saldos atómicos, errores/reintentos cubiertos y operación visible en historial |
| 5. Administración y comunicaciones | Cerrar gestión de asesores, notificaciones, correo y asistente IA | Roles, fallos de integraciones externas y estados de interfaz probados |
| 6. Entrega operativa | Migraciones, respaldos, pruebas integrales, seguridad y documentación | Checklist de entrega completado; limitaciones conocidas publicadas |

## Plantilla para cada sprint

Copiar esta estructura al acordar un sprint; no rellenar fechas o responsables por inferencia.

```md
## Sprint N — [objetivo]

- Fechas: por acordar
- Responsable: por acordar
- Capacidad: por acordar
- Historias: [IDs de SprintBacklog.md]
- Criterio de sprint: [resultado demostrable]

### Tareas y estado

| Tarea | Responsable | Criterio de aceptación | Estado | Evidencia |
| --- | --- | --- | --- | --- |
| | | | Pendiente | |

### Revisión

- Demo/resultado:
- Pruebas ejecutadas:
- Riesgos y bloqueos:
- Decisiones para el siguiente sprint:
```

## Estados permitidos

`Pendiente`, `En curso`, `Bloqueado`, `Hecho (validado)`. Usar **Hecho (validado)** solo si se cumplen los criterios y existe evidencia de prueba; la mera presencia de código no basta.
