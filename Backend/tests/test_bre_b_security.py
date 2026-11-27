from types import SimpleNamespace
from unittest.mock import Mock

from fastapi.testclient import TestClient

from Backend import main


class FakeQuery:
    def __init__(self, result):
        self.result = result

    def filter(self, *conditions):
        return self

    def first(self):
        return self.result


def test_consultar_llave_bre_b_no_retorna_documento(monkeypatch):
    llave = SimpleNamespace(
        id_usuario=2,
        id_cuenta=5,
        llave="cuenta-ejemplo",
        tipo_llave="alfanumerica",
    )
    usuario = SimpleNamespace(
        id_usuario=2,
        nombre="Destinataria",
        documento="1234567890",
    )
    cuenta = SimpleNamespace(tipo_cuenta="corriente")
    database = Mock()
    database.query.side_effect = [
        FakeQuery(llave),
        FakeQuery(usuario),
        FakeQuery(cuenta),
    ]
    monkeypatch.setitem(
        main.app.dependency_overrides,
        main.get_db,
        lambda: database,
    )
    monkeypatch.setitem(
        main.app.dependency_overrides,
        main.token_required,
        lambda: 1,
    )

    response = TestClient(main.app).get("/bre-b/consultar/cuenta-ejemplo")

    assert response.status_code == 200, response.text
    assert response.json()["nombre"] == "Destinataria"
    assert response.json()["llave"] == "cuenta-ejemplo"
    assert "documento" not in response.json()
