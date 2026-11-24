# Semana 08 — Calidad y pruebas

**Estado:** inventario de pruebas en disco; esta entrega no afirma que las pruebas hayan sido ejecutadas.

> No se localizaron instrucciones ni criterios oficiales para la semana 08. Los comandos aquí son propuestas de validación y deben ejecutarse en el entorno del proyecto.

## Inventario encontrado

Hay nueve archivos de prueba Python bajo `Backend/tests/`:

| Archivo | Área aparente por nombre/casos observados |
|---|---|
| `test_administradores_cuentas.py` | Consultas de cuentas por roles administrativos/asesoría. |
| `test_chatbot_bancario.py` | Payloads, autorización, errores del proveedor y respuesta IA. |
| `test_cuenta_numero.py` | Generación/formato de número de cuenta. |
| `test_llm.py` | Selección/fallback y ausencia de proveedor LLM. |
| `test_login_envia_correo_de_notificacion.py` | Configuración de correo y notificación en login. |
| `test_pydantic_schemas.py` | Validación de esquemas y respuestas. |
| `test_registro_cuentas_pendientes.py` | Creación de cuentas pendientes durante registro. |
| `test_registro_envia_correo_de_notificacion.py` | Notificación de registro. |
| `test_tipo_operacion_cuenta.py` | Tipos de cuenta/operación y rutas relacionadas. |

El frontend declara scripts `start`, `build` y `test` en `Frontend/package.json`; no se registró aquí una ejecución ni resultado.

## Validación reproducible propuesta

Desde la raíz, en PowerShell:

```powershell
.\.venv\Scripts\python.exe -m pytest Backend\tests -q
Set-Location Frontend
npm test -- --watchAll=false
npm run build
```

Estos comandos deben revisarse contra los runtimes/dependencias instalados. No se confirma compatibilidad ni resultado hasta ejecutarlos y guardar salida, versiones y fecha. Ejecutar solo con servicios/variables requeridos por los tests; no conectar pruebas a datos financieros reales.

## Vacíos importantes de cobertura por comprobar

- Autorización negativa de titularidad y matriz de roles sobre todas las rutas.
- Transferencias: saldo insuficiente, rollback, concurrencia, destino inválido e idempotencia.
- Recuperación de acceso y expiración/reuso de códigos.
- Protección de información de tarjetas y registros.
- Contratos reales frontend/API y errores de red/sesión.
- Migraciones desde esquema vacío y preexistente.
- Pruebas de integración aisladas de correo, MySQL y proveedores LLM.
- Cobertura cuantitativa, linting, dependencias vulnerables, accesibilidad y rendimiento.

## Criterio para registrar un resultado

Cada informe de prueba debe indicar comando exacto, versión de Python/Node y dependencias, configuración no secreta, fecha, resultado, fallos y alcance. No confundir “hay pruebas” con “la suite pasa” ni un build correcto con aceptación funcional.

**Referencias:** [pruebas backend](../Backend/tests), [package.json frontend](../Frontend/package.json), [Requisitos no funcionales](../Backend/docs/requirements/non-functional.md).
