from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from Backend import main
from Backend.database.database import Base
from Backend.models import Administrador, Cuenta, Usuario
from Backend.security import hash_password


def test_administrador_puede_listar_cuentas(monkeypatch):
    engine = create_engine("sqlite://")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    admin = Usuario(
        nombre="Admin Principal",
        email="admin@test.com",
        documento="1111111111",
        password=hash_password("Segura123"),
        rol="usuario",
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)

    db.add(
        Administrador(
            id_usuario=admin.id_usuario,
            codigo_administrador="ADM-001",
        )
    )

    cliente = Usuario(
        nombre="Cliente Uno",
        email="cliente@test.com",
        documento="2222222222",
        password=hash_password("Segura123"),
        rol="usuario",
    )
    db.add(cliente)
    db.commit()
    db.refresh(cliente)

    db.add(
        Cuenta(
            id_usuario=cliente.id_usuario,
            numero_cuenta="1234567890123456",
            tipo_cuenta="ahorros",
            saldo=15000,
            estado="activa",
        )
    )
    db.commit()

    app = main.app
    app.dependency_overrides[main.get_db] = lambda: db
    app.dependency_overrides[main.token_required] = lambda: admin.id_usuario

    client = TestClient(app)
    response = client.get("/administradores/cuentas")

    assert response.status_code == 200
    payload = response.json()
    assert "cuentas" in payload
    assert len(payload["cuentas"]) == 1
    assert payload["cuentas"][0]["nombre"] == "Cliente Uno"
    assert payload["cuentas"][0]["numero_cuenta"] == "1234567890123456"
    assert payload["cuentas"][0]["estado"] == "activo"

    app.dependency_overrides.clear()
    db.close()
