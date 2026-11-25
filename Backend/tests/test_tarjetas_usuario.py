from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from Backend import main
from Backend.database.database import Base
from Backend.models import Administrador, Cuenta, Tarjeta, Usuario
from Backend.security import hash_password


def crear_contexto_tarjetas(monkeypatch, cuenta=None):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    db = sessionmaker(bind=engine)()

    administrador = Usuario(
        nombre="Administradora",
        email="admin.tarjetas@example.com",
        documento="1111111111",
        password=hash_password("Segura123"),
        rol="usuario",
    )
    cliente = Usuario(
        nombre="Cliente",
        email="cliente.tarjetas@example.com",
        documento="2222222222",
        password=hash_password("Segura123"),
        rol="usuario",
    )
    db.add_all([administrador, cliente])
    db.commit()
    db.refresh(administrador)
    db.refresh(cliente)
    db.add(
        Administrador(
            id_usuario=administrador.id_usuario,
            codigo_administrador="ADM-TARJETAS",
        )
    )
    if cuenta:
        db.add(
            Cuenta(
                id_usuario=cliente.id_usuario,
                numero_cuenta="1234567890123456",
                tipo_cuenta=cuenta[0],
                estado=cuenta[1],
            )
        )
    db.commit()

    monkeypatch.setitem(main.app.dependency_overrides, main.get_db, lambda: db)
    monkeypatch.setitem(
        main.app.dependency_overrides,
        main.token_required,
        lambda: administrador.id_usuario,
    )
    return TestClient(main.app), db, cliente, engine


def test_usuario_puede_listar_sus_tarjetas(monkeypatch):
    client, db, cliente, engine = crear_contexto_tarjetas(
        monkeypatch,
        cuenta=("corriente", "activa"),
    )
    monkeypatch.setitem(
        main.app.dependency_overrides,
        main.token_required,
        lambda: cliente.id_usuario,
    )

    cuenta = db.query(Cuenta).one()
    db.add(Tarjeta(
        id_cuenta=cuenta.id_cuenta,
        numero_tarjeta="1234567890123456",
        fecha_expiracion="12/31",
        codigo_seguridad="123",
        estado="activa",
    ))
    db.commit()

    response = client.get("/tarjetas/mias")

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["id_tarjeta"] is not None
    assert response.json()[0]["ultimos_tres"] == "456"
    assert response.json()[0]["estado"] == "activa"

    db.close()
    engine.dispose()


<<<<<<< HEAD
=======
def test_administrador_puede_eliminar_tarjeta_de_cliente(monkeypatch):
    client, db, _, engine = crear_contexto_tarjetas(
        monkeypatch,
        cuenta=("corriente", "activa"),
    )
    cuenta = db.query(Cuenta).one()
    tarjeta = Tarjeta(
        id_cuenta=cuenta.id_cuenta,
        numero_tarjeta="1234567890123456",
        fecha_expiracion="12/31",
        codigo_seguridad="123",
        estado="bloqueada",
    )
    db.add(tarjeta)
    db.commit()
    tarjeta_id = tarjeta.id_tarjeta

    response = client.delete(f"/tarjetas/{tarjeta_id}")

    assert response.status_code == 200, response.text
    assert db.query(Tarjeta).filter_by(id_tarjeta=tarjeta_id).first() is None

    db.close()
    engine.dispose()


>>>>>>> 1d230e60767b7ee8dd388f8bc1c2da18b87a7cc2
def test_administrador_puede_agregar_tarjeta_a_cuenta_de_ahorros(monkeypatch):
    client, db, cliente, engine = crear_contexto_tarjetas(
        monkeypatch,
        cuenta=("ahorros", "activa"),
    )

    response = client.post(
        f"/usuarios/{cliente.id_usuario}/tarjetas",
        json={
            "fecha_vencimiento": "2031-02",
            "cvv": "123",
            "primeros_digitos": "1234567890123",
            "ultimos_digitos": "456",
        },
    )

    assert response.status_code == 200
    tarjeta = db.query(Tarjeta).one()
    assert tarjeta.id_cuenta == db.query(Cuenta).one().id_cuenta
    assert tarjeta.fecha_expiracion == "02/31"

    db.close()
    engine.dispose()


def test_agregar_tarjeta_requiere_cuenta_activa(monkeypatch):
    client, db, cliente, engine = crear_contexto_tarjetas(
        monkeypatch,
        cuenta=("ahorros", "inactiva"),
    )

    response = client.post(
        f"/usuarios/{cliente.id_usuario}/tarjetas",
        json={
            "fecha_vencimiento": "2031-02",
            "cvv": "123",
            "primeros_digitos": "1234567890123",
            "ultimos_digitos": "456",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == (
        "El cliente no tiene una cuenta activa para asociar la tarjeta"
    )
    assert db.query(Tarjeta).count() == 0

    db.close()
    engine.dispose()


def test_bloqueo_de_base_de_datos_muestra_error_y_revierte_transaccion(
    monkeypatch,
    caplog,
):
    client, db, cliente, engine = crear_contexto_tarjetas(
        monkeypatch,
        cuenta=("corriente", "activa"),
    )

    def commit_con_bloqueo():
        raise OperationalError(
            "INSERT INTO tarjetas",
            {},
            Exception(1205, "Lock wait timeout exceeded"),
        )

    monkeypatch.setattr(db, "commit", commit_con_bloqueo)

    response = client.post(
        f"/usuarios/{cliente.id_usuario}/tarjetas",
        json={
            "fecha_vencimiento": "2031-02",
            "cvv": "123",
            "primeros_digitos": "1234567890123",
            "ultimos_digitos": "456",
        },
    )

    assert response.status_code == 503
    assert "ocupada por otra operación" in response.json()["detail"]
    assert db.query(Tarjeta).count() == 0
    assert "1234567890123456" not in caplog.text
    assert "codigo_seguridad" not in caplog.text

    db.close()
    engine.dispose()
