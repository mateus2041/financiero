# Chatbot bancario Financiero

## Arquitectura

El chatbot bancario se integra en el backend FastAPI mediante el router `/ia/chat` y usa la API de Groq para responder en español con un prompt orientado a servicios bancarios y seguridad. El frontend React envía mensajes con JWT de sesión cuando existe un token válido.

## Archivos principales

- `Backend/ai/prompt.py`: define `PROMPT_BANCARIO` con políticas de seguridad y scope del asistente.
- `Backend/ai/llm.py`: conecta con Groq usando la clave `GROQ_API_KEY`, valida el modelo `openai/gpt-oss-120b` y maneja errores de red y de proveedor.
- `Backend/ai/chains.py`: valida el mensaje y el historial local antes de llamar al modelo.
- `Backend/ai/router.py`: expone el endpoint `/ia/chat` y garantiza autenticación JWT.
- `Frontend/src/pages/ChatIA.jsx`: cliente web que usa Axios para enviar mensajes y mostrar respuestas.

## Instalación

1. Crear y activar un entorno virtual.
2. Instalar dependencias desde `Backend/requirements.txt`.
3. Copiar `Backend/.env.example` a `Backend/.env` o crear un `.env` con `GROQ_API_KEY`.
4. Exportar la variable en Docker o en el entorno local.

## Configuración de Groq

Defina la variable:

```env
GROQ_API_KEY=
```

No se deben imprimir claves ni devolverlas por HTTP.

## Inicio del backend

```bash
cd Financiero
uvicorn Backend.main:app --reload --host 0.0.0.0 --port 8000
```

## Docker

En `compose.yml` se incluye la variable `GROQ_API_KEY` para el servicio backend. Si se ejecuta con Docker Compose, cargar la variable en el `.env` raíz y usar:

```bash
docker compose up --build
```

## Pruebas

```bash
cd Financiero
python -m pytest Backend/tests/test_chatbot_bancario.py -q
```

## Endpoint

### Petición

```json
{
  "mensaje": "¿Cómo funcionan las cuentas de ahorro?",
  "historial": []
}
```

### Respuesta

```json
{
  "respuesta": "Las cuentas de ahorro permiten..."
}
```

## Limitaciones

- El chatbot no genera información bancaria real inventada.
- No ejecuta transferencias ni modifica saldos por sí solo.
- Si la operación requiere un flujo transaccional autenticado, debe hacerse desde la app correspondiente.

## Medidas de seguridad

- Requiere JWT válido para el endpoint.
- No solicita contraseñas ni PIN.
- Rechaza roles no autorizados en el historial.
- No revela secretos ni claves API.
- Mantiene la lógica de operaciones bancarias reales fuera de la IA.
