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


def test_asesor_puede_listar_cuentas():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    asesor = Usuario(
        nombre="Asesor Bancario",
        email="asesor@test.com",
        documento="3333333333",
        password=hash_password("Segura123"),
        rol="asesor",
    )
    cliente = Usuario(
        nombre="Cliente Dos",
        email="cliente2@test.com",
        documento="4444444444",
        password=hash_password("Segura123"),
        rol="usuario",
    )
    db.add_all([asesor, cliente])
    db.commit()
    db.refresh(asesor)
    db.refresh(cliente)

    db.add(
        Cuenta(
            id_usuario=cliente.id_usuario,
            numero_cuenta="9876543210123456",
            tipo_cuenta="corriente",
            saldo=25000,
            estado="inactiva",
        )
    )
    db.commit()

    app = main.app
    app.dependency_overrides[main.get_db] = lambda: db
    app.dependency_overrides[main.token_required] = lambda: asesor.id_usuario

    client = TestClient(app)
    response = client.get("/administradores/cuentas")

    assert response.status_code == 200
    payload = response.json()
    assert len(payload["cuentas"]) == 1
    assert payload["cuentas"][0]["nombre"] == "Cliente Dos"
    assert payload["cuentas"][0]["estado"] == "inactivo"

    app.dependency_overrides.clear()
    db.close()


def test_codigo_administrador_acepta_mayusculas_minusculas():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    admin = Usuario(
        nombre="Admin Principal",
        email="admin@test.com",
        documento="5555555555",
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
        nombre="Cliente Tres",
        email="cliente3@test.com",
        documento="6666666666",
        password=hash_password("Segura123"),
        rol="usuario",
    )
    db.add(cliente)
    db.commit()
    db.refresh(cliente)

    db.add(
        Cuenta(
            id_usuario=cliente.id_usuario,
            numero_cuenta="1111222233334444",
            tipo_cuenta="ahorros",
            saldo=5000,
            estado="activa",
        )
    )
    db.commit()

    app = main.app
    app.dependency_overrides[main.get_db] = lambda: db
    app.dependency_overrides[main.token_required] = lambda: admin.id_usuario

    client = TestClient(app)
    response = client.put(
        "/administradores/cuenta/1/saldo",
        json={"saldo": 20000, "codigo_autorizacion": "adm-001"},
    )

    assert response.status_code == 200
    assert response.json()["mensaje"] == "Saldo actualizado correctamente."

    app.dependency_overrides.clear()
    db.close()
