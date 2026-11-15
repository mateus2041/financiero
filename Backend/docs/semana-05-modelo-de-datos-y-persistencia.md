# Semana 05 — Modelo de datos y persistencia

**Estado:** inventario conceptual de los modelos; no sustituye un diagrama ER generado ni una inspección de la base en ejecución.

> La guía oficial de la semana 05 no estuvo disponible. Las entidades se enumeran porque aparecen en `Backend/models.py`; cardinalidades, restricciones y estado operativo deben verificarse en el esquema y las revisiones Alembic.

## Entidades observadas

| Entidad/modelo | Atributos representativos observados |
|---|---|
| Tipo de documento | Identificador y nombre del tipo. |
| Usuario | Identidad, correo, credencial, contacto, documento, rol y estado. |
| Administrador | Referencia de usuario, código y fecha de ingreso. |
| Asesor bancario | Identidad, código, especialidad, estado y fecha de ingreso. |
| Cuenta | Número, usuario asociado, tipo, operación, saldo y estado. |
| Transacción | Cuenta, monto, tipo, fecha y descripción. |
| Notificación | Usuario, mensaje, leído y fecha. |
| Tarjeta | Cuenta, número, expiración, código de seguridad y estado. |
| Llave BRE-B | Usuario/cuenta, tipo, llave, estado y fecha. |
| Transferencia BRE-B | Referencias a cuentas/llave, monto, estado y referencia. |

El modelo incluye campos sensibles de tarjeta, incluido `codigo_seguridad`. Esto requiere revisión de diseño y controles antes de utilizar datos reales; no se concluye aquí cómo se almacenan, exponen o protegen.

## Persistencia y cambios de esquema

- El archivo Compose declara MySQL `8.4` y un volumen persistente llamado `mysql_data`.
- El backend define modelos SQLAlchemy.
- Hay configuración de Alembic y seis revisiones, incluida una revisión de merge para unificar las ramas históricas.
- Compose ofrece `migrate` bajo el perfil `maintenance`, invocado explícitamente para no ejecutar DDL automáticamente. El grafo se comprueba en pruebas; la aplicación de migraciones sobre una instancia MySQL real sigue pendiente de ensayo aislado.
- El script `mysql_billetera.session.sql` no debe tratarse como respaldo completo sin verificar contenido y cobertura.

## Reglas de integridad a validar

1. Toda cuenta y movimiento debe vincularse a recursos existentes y autorizados.
2. Tipos de moneda, precisión decimal, límites y reglas de saldo deben documentarse según decisiones de negocio, no inferirse solo del tipo de columna.
3. El débito, crédito y registro de una transferencia deben persistirse juntos o revertirse juntos.
4. Las restricciones únicas, claves foráneas, nulabilidad e índices deben contrastarse entre modelos y migraciones.
5. Los cambios de esquema deben versionarse y ensayarse sobre una copia de datos antes de aplicarse a información que se quiera conservar.

## Pendientes de evidencia

- Diagrama entidad-relación generado desde el esquema vigente.
- Tipos/precisiones, índices, claves foráneas y cascadas por tabla.
- Reconciliación de modelos con ambas revisiones Alembic y bases de datos existentes.
- Validación formal de protección/retención de campos sensibles.
- Evidencia de respaldo y restauración probada.

**Referencias:** [models.py](../Backend/models.py), [alembic.ini](../Backend/alembic.ini), [versiones Alembic](../Backend/alembic/versions), [configuración Compose](../compose.yml).
