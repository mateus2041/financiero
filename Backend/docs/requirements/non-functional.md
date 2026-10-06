# Requisitos no funcionales

**Producto:** Billetera Financiera
**Última revisión:** 6 de octubre de 2026

## Estado

Los valores de rendimiento, cobertura y compatibilidad de versiones de este documento son criterios propuestos, no resultados certificados. El repositorio no contiene mediciones que permitan afirmar que ya se cumplen.

## Seguridad y privacidad

- RNF-SEC-01: almacenar contraseñas mediante un algoritmo de hash adecuado; nunca conservarlas en texto plano.
- RNF-SEC-02: validar token, rol y titularidad en cada endpoint protegido; las restricciones del cliente no sustituyen controles de API.
- RNF-SEC-03: no exponer secretos, tokens, códigos de recuperación, CVV ni datos completos de tarjetas en logs, respuestas no autorizadas o documentación.
- RNF-SEC-04: mantener credenciales en variables de entorno y configurar valores diferentes para desarrollo, pruebas y producción.
- RNF-SEC-05: configurar CORS por origen en despliegues y usar HTTPS para tráfico externo.
- RNF-SEC-06: las operaciones de saldo/transferencia deben ser atómicas y registrar errores sin filtrar datos sensibles.
- RNF-SEC-07: documentar retención, tratamiento y eliminación de datos antes de usar información financiera real.

## Integridad y disponibilidad

- RNF-DAT-01: una transferencia debe completarse por entero o no modificar saldos/movimientos.
- RNF-DAT-02: las operaciones repetidas por reintento no deben producir duplicados o débitos múltiples cuando el flujo requiera idempotencia.
- RNF-DAT-03: documentar backup y restauración de MySQL y probarlos antes de una entrega operativa.
- RNF-DAT-04: un fallo de correo o del proveedor IA no debe provocar una respuesta de éxito falsa ni impedir operaciones financieras no dependientes de esos servicios.
- RNF-DAT-05: añadir migraciones versionadas para que los cambios de esquema sean repetibles entre entornos.

## Rendimiento y capacidad

- RNF-PERF-01: definir una carga representativa y medir latencia de endpoints críticos; acordar un objetivo de percentil y carga antes de declarar cumplimiento.
- RNF-PERF-02: limitar y paginar listados potencialmente grandes, en particular movimientos y usuarios.
- RNF-PERF-03: medir por separado tiempo de respuesta de API, consultas a base de datos y renderizado frontend.
- RNF-PERF-04: mostrar estados de carga, error y reintento en operaciones de red.

No se establece todavía una meta numérica de latencia, concurrencia o volumen: las metas anteriores de 2/3 segundos y 5.000 registros no estaban respaldadas por pruebas.

## Mantenibilidad y pruebas

- RNF-MANT-01: las reglas de negocio críticas deben probarse con pytest, incluidos permisos, saldos, transferencias y errores.
- RNF-MANT-02: registrar comandos efectivos de instalación, ejecución y pruebas para frontend y backend.
- RNF-MANT-03: fijar y verificar dependencias y runtimes para conseguir instalaciones reproducibles.
- RNF-MANT-04: las nuevas funcionalidades deben actualizar requisitos, backlog y casos de prueba relevantes.
- RNF-MANT-05: no establecer un porcentaje mínimo de cobertura hasta configurar y medir cobertura por módulo.

## Usabilidad y compatibilidad

- RNF-UX-01: formularios deben indicar campos inválidos y comunicar los resultados de operaciones.
- RNF-UX-02: controles interactivos deben tener etiquetas accesibles y foco visible; evaluar contraste y navegación por teclado.
- RNF-UX-03: verificar los flujos principales en escritorio y móvil, y en navegadores que el equipo defina como soportados.
- RNF-UX-04: mostrar estados de carga, sesión vencida, falta de conexión y error de servicio sin perder silenciosamente los datos introducidos.

## Validación pendiente

No se han documentado ejecuciones recientes de pruebas completas, análisis de dependencias, auditoría de seguridad, mediciones de rendimiento ni verificación WCAG. Registrar fecha, versión, comando y resultado cuando se realicen; no presentar estos requisitos como certificaciones.
