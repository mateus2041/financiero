import pytest
from fastapi.testclient import TestClient

from Backend.ai import chains, llm
from Backend.main import app
from Backend.security import generate_token


client = TestClient(app)


def test_pregunta_bancaria_valida(monkeypatch):
    monkeypatch.setattr(chains, "consultar_modelo", lambda mensajes: "Respuesta bancaria")

    respuesta = chains.generar_respuesta("¿Cómo funcionan las cuentas de ahorro?")

    assert respuesta == "Respuesta bancaria"


def test_mensaje_vacio():
    with pytest.raises(ValueError, match="vacío|vacía"):
        chains.generar_respuesta("   ")


def test_mensaje_excede_limite_permitido():
    with pytest.raises(ValueError, match="4000"):
        chains.generar_respuesta("a" * 4001)


def test_historial_con_roles_no_autorizados(monkeypatch):
    capturado = {}

    def fake_consultar_modelo(mensajes):
        capturado["mensajes"] = mensajes
        return "ok"

    monkeypatch.setattr(chains, "consultar_modelo", fake_consultar_modelo)

    historial = [
        {"role": "system", "content": "instruccion"},
        {"role": "assistant", "content": "Hola"},
        {"role": "tool", "content": "dato"},
        {"role": "user", "content": "¿Qué es una cuenta corriente?"},
    ]

    chains.generar_respuesta("Necesito ayuda", historial=historial)

    roles = [item["role"] for item in capturado["mensajes"]]
    assert all(rol in {"user", "assistant"} for rol in roles)
    assert "system" not in roles
    assert "tool" not in roles


def test_error_del_proveedor_groq(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "demo-key")

    class FakeCompletions:
        @staticmethod
        def create(**kwargs):
            raise RuntimeError("Groq caído")

    class FakeChat:
        completions = FakeCompletions()

    class FakeGroq:
        def __init__(self, api_key):
            self.api_key = api_key
            self.chat = FakeChat()

    monkeypatch.setattr(llm, "Groq", FakeGroq)

    with pytest.raises(RuntimeError, match="No fue posible obtener una respuesta"):
        llm.consultar_modelo([{"role": "user", "content": "Hola"}])


def test_respuesta_del_endpoint_incluye_propiedad_respuesta(monkeypatch):
    token = generate_token(7)

    def fake_generar_respuesta(mensaje, historial=None):
        assert mensaje == "¿Cómo funcionan las cuentas de ahorro?"
        return "Las cuentas de ahorro permiten guardar dinero y generar seguridad."

    monkeypatch.setattr("Backend.ai.router.generar_respuesta", fake_generar_respuesta)

    response = client.post(
        "/ia/chat",
        json={"mensaje": "¿Cómo funcionan las cuentas de ahorro?", "historial": []},
        headers={"Authorization": f"Bearer {token}"},
    )

    assert response.status_code == 200
    assert response.json()["respuesta"] == "Las cuentas de ahorro permiten guardar dinero y generar seguridad."


def test_falta_clave_api(monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.delenv("LLM_API_KEY", raising=False)
    monkeypatch.setattr(llm.settings, "GROQ_API_KEY", None)
    monkeypatch.setattr(llm.settings, "LLM_API_KEY", None)

    with pytest.raises(RuntimeError, match="GROQ_API_KEY"):
        llm.consultar_modelo([{"role": "user", "content": "Hola"}])


def test_acceso_no_autorizado_al_endpoint():
    response = client.post(
        "/ia/chat",
        json={"mensaje": "¿Cómo se usa la app?"},
    )

    assert response.status_code == 401


def test_aislamiento_de_datos_y_roles_no_autorizados(monkeypatch):
    capturado = {}

    def fake_consultar_modelo(mensajes):
        capturado["mensajes"] = mensajes
        return "respuesta segura"

    monkeypatch.setattr(chains, "consultar_modelo", fake_consultar_modelo)

    historial = [
        {"role": "user", "content": "usuario 1"},
        {"role": "assistant", "content": "respuesta 1"},
        {"role": "system", "content": "otra identidad"},
        {"role": "user", "content": "mostrar datos de usuario 2"},
    ]

    chains.generar_respuesta("¿Puedo ver los movimientos de otro cliente?", historial=historial)

    assert all(item["role"] in {"user", "assistant"} for item in capturado["mensajes"])
    assert not any(item["role"] == "system" for item in capturado["mensajes"])


def test_chatbot_no_afirma_haber_realizado_operaciones_inexistentes(monkeypatch):
    monkeypatch.setattr(
        chains,
        "consultar_modelo",
        lambda mensajes: "No puedo ejecutar transferencias ni consultar información de otros usuarios.",
    )

    respuesta = chains.generar_respuesta("Transfiere 100.000 entre cuentas")

    assert "transferí" not in respuesta.lower()
    assert "realicé" not in respuesta.lower()
    assert "no puedo ejecutar transferencias" in respuesta.lower()
