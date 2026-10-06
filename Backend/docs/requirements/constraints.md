# Restricciones y decisiones del proyecto

**Producto:** Billetera Financiera
**Última revisión:** 6 de octubre de 2026
**Base:** configuración y código presentes en el repositorio. Las decisiones no respaldadas por código o acuerdos del equipo se señalan como pendientes.

## Tecnologías comprobadas

| Área | Situación observada | Restricción documental |
| --- | --- | --- |
| Interfaz | React con JavaScript y `react-scripts`; React Router y Axios | Mantener el stack actual salvo decisión explícita de migración. No describirlo como TypeScript/Vite. |
| API | FastAPI, SQLAlchemy y Uvicorn | Los endpoints deben conservar contratos compatibles con el frontend y las pruebas. |
| Base de datos | MySQL 8.4 en Compose; PyMySQL | PostgreSQL no forma parte de la configuración actual. |
| Dependencias frontend | Hay `pnpm-lock.yaml`; el Compose ejecuta `npm start`; los manifiestos contienen rangos semver | Acordar un gestor único y reconciliar manifiestos/lock antes de exigir builds reproducibles. |
| Dependencias backend | `Backend/requirements.txt`, sin versiones exactas | Fijar versiones y probar instalación reproducible antes de una entrega estable. |
| Contenedores | Servicios `db`, `backend` y `frontend` en `compose.yml` | La configuración actual es de desarrollo y no constituye por sí sola un despliegue de producción. |

## Restricciones de seguridad

- No guardar claves, tokens ni contraseñas reales en el código, documentación, pruebas o commits. Usar variables de entorno y proporcionar solo nombres/valores ficticios en ejemplos.
- No desplegar los valores de ejemplo de Compose (`root`, `app_user`, `app_pass`) ni publicar el puerto de MySQL sin controles de red.
- Configurar `ASESOR_REGISTRATION_CODE`, credenciales de correo, proveedor IA y demás secretos en el entorno donde se ejecuta el backend. La lista definitiva de variables está pendiente de inventario.
- Las rutas que consultan o modifican información de usuarios/cuentas deben validar identidad, rol y propiedad de los recursos en el servidor; ocultar una opción en la interfaz no es autorización.
- No registrar contraseñas, tokens, códigos de recuperación, CVV ni datos completos de tarjetas. Revisar expresamente el modelo y las rutas de tarjetas antes de habilitar datos reales.
- Limitar CORS a los orígenes necesarios en entornos desplegados. `allow_origins=["*"]` junto con credenciales no debe tratarse como configuración de producción.
- Usar HTTPS y secretos rotables fuera de desarrollo. El repositorio no documenta todavía una configuración de producción.

## Persistencia y cambios de esquema

- La aplicación usa MySQL y SQLAlchemy. `Backend/main.py` crea tablas al iniciar y contiene cambios de esquema condicionales.
- No se encontró una configuración de Alembic. Antes de múltiples instancias o producción, definir migraciones versionadas y una estrategia de respaldo/restauración.
- Los cambios de saldo y transferencia deben preservar consistencia, evitar saldos negativos no autorizados y revertir todas las escrituras ante un fallo.
- No usar datos bancarios reales durante desarrollo, pruebas o demostraciones sin autorización y controles apropiados.

## Calidad y proceso

- Las pruebas backend se ejecutan con pytest (hay pruebas bajo `Backend/tests/`). El alcance/cobertura efectiva debe medirse; no hay un porcentaje mínimo confirmado por configuración.
- El frontend define `start`, `build` y `test` en `Frontend/package.json`; no se identificó un script `lint` ni un chequeo TypeScript.
- No afirmar cobertura, cumplimiento WCAG, rendimiento, compatibilidad de navegador o certificación de seguridad sin mediciones reproducibles.
- Registrar requisitos y decisiones pendientes como tales. No asignar fechas, responsables, tecnologías obligatorias ni políticas de commit sin aprobación del equipo.

## Pendientes de decisión

1. Gestor de paquetes frontend y ubicación/manifiesto canónicos.
2. Versiones soportadas de Python y Node.js, y versiones fijadas de dependencias.
3. Política de ramas, revisión y formato de commits.
4. Estrategia de migraciones, backups, retención y recuperación.
5. Proveedor de correo/IA y variables de entorno necesarias en cada entorno.
6. Requisitos de privacidad, jurisdicción y alcance de cualquier integración financiera.
