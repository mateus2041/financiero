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
    assert response.json()[0]["numero_tarjeta"] == "**** **** **** 3456"
    assert "codigo_seguridad" not in response.json()[0]
    assert "ultimos_tres" not in response.json()[0]
    assert response.json()[0]["estado"] == "activa"

    db.close()
    engine.dispose()


def test_tarjeta_endpoints_no_exponen_numero_completo_ni_cvv(monkeypatch):
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
    tarjeta = Tarjeta(
        id_cuenta=cuenta.id_cuenta,
        numero_tarjeta="4000001234567899",
        fecha_expiracion="12/31",
        codigo_seguridad="123",
        estado="activa",
    )
    db.add(tarjeta)
    db.commit()
    tarjeta_id = tarjeta.id_tarjeta

    responses = [
        client.get("/tarjetas/mias"),
        client.get(f"/usuarios/{cliente.id_usuario}/tarjetas"),
        client.get("/tarjeta"),
        client.get("/tarjeta/ultima"),
    ]

    for response in responses:
        assert response.status_code == 200, response.text
        tarjeta_respuesta = response.json()
        if isinstance(tarjeta_respuesta, list):
            tarjeta_respuesta = tarjeta_respuesta[0]
        if "tarjeta" in tarjeta_respuesta:
            tarjeta_respuesta = tarjeta_respuesta["tarjeta"]
        assert tarjeta_respuesta["numero_tarjeta"] == "**** **** **** 7899"
        assert "codigo_seguridad" not in tarjeta_respuesta
        assert "4000001234567899" not in response.text

    response = client.patch(
        f"/tarjetas/{tarjeta_id}",
        json={"fecha_vencimiento": "2032-01", "cvv": "987"},
    )
    assert response.status_code == 200, response.text
    assert "codigo_seguridad" not in response.json()
    assert "4000001234567899" not in response.text

    response = client.put(f"/tarjetas/{tarjeta_id}/restablecer-cvv")
    assert response.status_code == 200, response.text
    assert response.json()["cvv_restablecido"] is True
    assert "codigo_seguridad" not in response.json()

    tarjeta.cvv_restablecido = False
    db.commit()
    response = client.put("/tarjeta/restablecer-cvv")
    assert response.status_code == 200, response.text
    assert "codigo_seguridad" not in response.json()

    db.close()
    engine.dispose()


def test_desbloquear_tarjeta_exige_contrasena_actual(monkeypatch):
    client, db, cliente, engine = crear_contexto_tarjetas(
        monkeypatch,
        cuenta=("corriente", "bloqueada"),
    )
    monkeypatch.setitem(
        main.app.dependency_overrides,
        main.token_required,
        lambda: cliente.id_usuario,
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

    response = client.put(
        "/tarjeta/desbloquear",
        json={"password": "incorrecta"},
    )
    assert response.status_code == 401
    assert db.query(Cuenta).one().estado == "bloqueada"
    assert db.query(Tarjeta).one().estado == "bloqueada"

    response = client.put(
        "/tarjeta/desbloquear",
        json={"password": "Segura123"},
    )
    assert response.status_code == 200, response.text
    assert db.query(Cuenta).one().estado == "activa"
    assert db.query(Tarjeta).one().estado == "activa"

    db.close()
    engine.dispose()


def test_bloquear_tarjeta_guarda_motivo_y_lo_expone_en_lista_admin(monkeypatch):
    client, db, cliente, engine = crear_contexto_tarjetas(
        monkeypatch,
        cuenta=("corriente", "activa"),
    )
    cuenta = db.query(Cuenta).one()
    tarjeta = Tarjeta(
        id_cuenta=cuenta.id_cuenta,
        numero_tarjeta="1234567890123456",
        fecha_expiracion="12/31",
        codigo_seguridad="123",
        estado="activa",
    )
    db.add(tarjeta)
    db.commit()
    tarjeta_id = tarjeta.id_tarjeta
    monkeypatch.setitem(
        main.app.dependency_overrides,
        main.token_required,
        lambda: cliente.id_usuario,
    )

    response = client.put(
        f"/tarjetas/{tarjeta_id}/bloquear",
        json={"documento": cliente.documento},
    )

    assert response.status_code == 422
    assert db.query(Tarjeta).filter_by(id_tarjeta=tarjeta_id).one().estado == "activa"

    response = client.put(
        f"/tarjetas/{tarjeta_id}/bloquear",
        json={
            "documento": cliente.documento,
            "motivo": "Me robaron la tarjeta al salir del trabajo",
        },
    )

    assert response.status_code == 200, response.text
    motivo = "Me robaron la tarjeta al salir del trabajo"
    assert response.json()["motivo_bloqueo"] == motivo
    tarjeta_guardada = db.query(Tarjeta).filter_by(id_tarjeta=tarjeta_id).one()
    assert tarjeta_guardada.motivo_bloqueo == motivo

    administrador = db.query(Administrador).one()
    monkeypatch.setitem(
        main.app.dependency_overrides,
        main.token_required,
        lambda: administrador.id_usuario,
    )
    response = client.get("/administradores/tarjetas")

    assert response.status_code == 200, response.text
    tarjeta_listada = next(
        item for item in response.json() if item["id_tarjeta"] == tarjeta_id
    )
    assert tarjeta_listada["motivo_bloqueo"] == motivo

    db.close()
    engine.dispose()


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
