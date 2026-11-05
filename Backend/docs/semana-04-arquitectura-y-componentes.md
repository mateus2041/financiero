# Semana 04 — Arquitectura y componentes

**Estado:** arquitectura lógica inferida de los archivos de configuración y del código; ejecución integral no certificada.

> No se localizó la guía oficial de la semana 04. La estructura de este documento es una organización técnica de la evidencia disponible.

## Vista general

```text
Navegador
  └─ Frontend React (Create React App, JavaScript)
       └─ HTTP/JSON mediante Axios o fetch
            └─ API FastAPI (Python)
                 ├─ SQLAlchemy
                 │    └─ MySQL 8.4
                 ├─ correo (configuración externa)
                 └─ asistente IA/proveedor LLM (configuración externa)
```

La configuración de Compose define `db`, `backend` y `frontend`, además de volúmenes para MySQL y dependencias de desarrollo. Esta topología describe la configuración del repositorio y no una arquitectura de producción verificada.

## Componentes observados

| Componente | Tecnología o ubicación | Responsabilidad evidenciada |
|---|---|---|
| Cliente web | `Frontend/src/`, React y JavaScript | Pantallas, navegación, formularios y peticiones a la API. |
| API | `Backend/main.py`, FastAPI | Rutas de cuentas, usuarios, autenticación, transacciones y administración. |
| Routers especializados | `Backend/routers/`, `Backend/ai/` | Funciones BRE-B, asesoría y asistencia IA. |
| Persistencia | `Backend/models.py`, SQLAlchemy | Entidades del dominio y acceso a la base de datos. |
| Base de datos | `mysql:8.4` en `compose.yml` | Persistencia relacional; puerto publicado `3307` hacia `3306`. |
| Correo | `Backend/email_service/` | Envío dependiente de configuración del entorno. |

## Comunicación y configuración

- El cliente realiza peticiones HTTP a direcciones locales codificadas en varias páginas y servicios. La configuración no es uniforme; debe centralizarse y parametrizarse antes de desplegar.
- La API usa rutas HTTP con payloads JSON y autenticación para algunos flujos. El contrato completo debe verificarse en OpenAPI y contra las llamadas de la interfaz.
- El frontend está configurado con `react-scripts`; el archivo de dependencias también declara `react-router-dom` y `axios`.
- `Backend/requirements.txt` declara FastAPI, SQLAlchemy, Alembic, PyMySQL y dependencias de integraciones con rangos abiertos o sin versión exacta.
- La clave del proveedor de IA y credenciales de servicios externos deben inyectarse desde el entorno; no se deben incluir en esta documentación.

## Límites de confianza

1. El navegador no es confiable para decidir titularidad, rol, saldo ni elegibilidad.
2. La API debe validar autenticación/autorización y comprobar el acceso a cada recurso.
3. La base de datos debe ser accesible solo por los servicios autorizados.
4. Los proveedores externos reciben únicamente los datos estrictamente necesarios.
5. Los puertos y credenciales de Compose son configuración local, no perfil listo para producción.

## Incertidumbres arquitectónicas

- Compose no define proxy inverso, TLS, observabilidad, gestión de secretos, réplicas ni configuración de producción.
- Las rutas del frontend utilizan varias formas de `localhost` y prefijos diferentes; la integración por entorno requiere verificación.
- Los documentos heredados describen una configuración de Alembic/servicio `migrate`, pero el `compose.yml` actual solo define `db`, `backend` y `frontend`. Ver [operación y entrega](semana-09-operacion-y-entrega.md).
- No se ha medido disponibilidad, carga, latencia o escalabilidad.

**Referencias:** [compose.yml](../compose.yml), [package.json](../Frontend/package.json), [requirements.txt](../Backend/requirements.txt), [API](../Backend/main.py).
