from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from Backend import main
from Backend.database.database import Base
from Backend.models import Administrador, AsesorBanco, Cuenta, Usuario
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

    asesor_como_usuario = Usuario(
        nombre="Asesor con registro anterior",
        email="asesor-usuario@test.com",
        documento="5555555555",
        password=hash_password("Segura123"),
        rol="usuario",
    )
    db.add(asesor_como_usuario)
    db.commit()
    db.refresh(asesor_como_usuario)
    db.add(
        AsesorBanco(
            nombre=asesor_como_usuario.nombre,
            documento=asesor_como_usuario.documento,
            codigo_asesor="ASESOR-001",
        )
    )
    db.add(
        Cuenta(
            id_usuario=asesor_como_usuario.id_usuario,
            numero_cuenta="5555555555555555",
            tipo_cuenta="ahorros",
            saldo=1000,
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


def test_solo_asesor_puede_actualizar_saldo_con_codigo_de_asesor():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    admin = Usuario(
        nombre="Admin Principal",
        email="admin-saldo@test.com",
        documento="1111111111",
        password="test",
        rol="usuario",
    )
    asesor = Usuario(
        nombre="Asesor Bancario",
        email="asesor-saldo@test.com",
        documento="3333333333",
        password="test",
        rol="asesor",
    )
    cliente = Usuario(
        nombre="Cliente Uno",
        email="cliente-saldo@test.com",
        documento="2222222222",
        password="test",
        rol="usuario",
    )
    db.add_all([admin, asesor, cliente])
    db.commit()
    db.refresh(admin)
    db.refresh(asesor)
    db.refresh(cliente)

    db.add_all(
        [
            Administrador(
                id_usuario=admin.id_usuario,
                codigo_administrador="ADM-SALDO",
            ),
            AsesorBanco(
                nombre=asesor.nombre,
                documento=asesor.documento,
                codigo_asesor="ASESOR-SALDO",
                estado="activo",
            ),
            Cuenta(
                id_usuario=cliente.id_usuario,
                numero_cuenta="1234567890123456",
                tipo_cuenta="ahorros",
                saldo=1000,
                estado="activa",
            ),
        ]
    )
    db.commit()
    cuenta = db.query(Cuenta).filter_by(
        numero_cuenta="1234567890123456"
    ).first()

    usuario_actual = {"id": admin.id_usuario}
    app = main.app
    app.dependency_overrides[main.get_db] = lambda: db
    app.dependency_overrides[main.token_required] = (
        lambda: usuario_actual["id"]
    )

    client = TestClient(app)
    url_autorizacion = (
        f"/administradores/cuenta/{cuenta.id_cuenta}/autorizar-saldo"
    )
    url_saldo = f"/administradores/cuenta/{cuenta.id_cuenta}/saldo"

    respuesta_admin = client.post(
        url_autorizacion,
        json={"codigo_autorizacion": "ADM-SALDO"},
    )
    assert respuesta_admin.status_code == 403

    usuario_actual["id"] = asesor.id_usuario

    respuesta_codigo_admin = client.post(
        url_autorizacion,
        json={"codigo_autorizacion": "ADM-SALDO"},
    )
    assert respuesta_codigo_admin.status_code == 401

    respuesta_codigo_asesor = client.post(
        url_autorizacion,
        json={"codigo_autorizacion": " ASESOR-SALDO "},
    )
    assert respuesta_codigo_asesor.status_code == 200

    respuesta_actualizar_admin = client.put(
        url_saldo,
        json={
            "saldo": 5000,
            "codigo_autorizacion": "ADM-SALDO",
        },
    )
    assert respuesta_actualizar_admin.status_code == 401

    respuesta_actualizar_asesor = client.put(
        url_saldo,
        json={
            "saldo": 5000,
            "codigo_autorizacion": " ASESOR-SALDO ",
        },
    )
    assert respuesta_actualizar_asesor.status_code == 200
    assert respuesta_actualizar_asesor.json()["saldo"] == 5000

    app.dependency_overrides.clear()
    db.close()
