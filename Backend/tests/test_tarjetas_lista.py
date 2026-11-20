from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from Backend import main
from Backend.database.database import Base
from Backend.models import Administrador, Cuenta, Tarjeta, Usuario


def _crear_cliente_admin_tarjeta(estado):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session_local = sessionmaker(bind=engine)
    db = session_local()

    administrador = Usuario(
        nombre="Administrador",
        email="admin-tarjeta@test.com",
        documento="1000000001",
        password="test",
        rol="usuario",
    )
    cliente = Usuario(
        nombre="Cliente",
        email="cliente-tarjeta@test.com",
        documento="1000000002",
        password="test",
        rol="usuario",
    )
    db.add_all([administrador, cliente])
    db.commit()
    db.refresh(administrador)
    db.refresh(cliente)
    db.add(
        Administrador(
            id_usuario=administrador.id_usuario,
            codigo_administrador="ADM-TARJETA-001",
        )
    )

    cuenta = Cuenta(
        id_usuario=cliente.id_usuario,
        numero_cuenta="1234567890123456",
        tipo_cuenta="corriente",
        estado="activa",
    )
    db.add(cuenta)
    db.commit()
    db.refresh(cuenta)

    tarjeta = Tarjeta(
        id_cuenta=cuenta.id_cuenta,
        numero_tarjeta="1234567890123456",
        fecha_expiracion="12/30",
        codigo_seguridad="123",
        estado=estado,
    )
    db.add(tarjeta)
    db.commit()
    db.refresh(tarjeta)

    app = main.app
    app.dependency_overrides[main.get_db] = lambda: db
    app.dependency_overrides[main.administrador_o_asesor_requerido] = (
        lambda: administrador.id_usuario
    )

    return app, db, tarjeta.id_tarjeta, engine, cliente.id_usuario, cuenta.id_cuenta


def test_administrador_puede_eliminar_tarjeta_inhabilitada():
    app, db, tarjeta_id, engine, _, _ = _crear_cliente_admin_tarjeta("bloqueada")
    try:
        response = TestClient(app).delete(
            f"/administradores/tarjetas/{tarjeta_id}"
        )

        assert response.status_code == 200
        assert response.json()["mensaje"] == "Tarjeta eliminada correctamente"
        assert db.query(Tarjeta).filter(
            Tarjeta.id_tarjeta == tarjeta_id
        ).first() is None
    finally:
        app.dependency_overrides.pop(main.get_db, None)
        app.dependency_overrides.pop(
            main.administrador_o_asesor_requerido,
            None,
        )
        db.close()
        engine.dispose()


def test_no_se_puede_eliminar_tarjeta_activa_desde_administracion():
    app, db, tarjeta_id, engine, _, _ = _crear_cliente_admin_tarjeta("activa")
    try:
        response = TestClient(app).delete(
            f"/administradores/tarjetas/{tarjeta_id}"
        )

        assert response.status_code == 409
        assert db.query(Tarjeta).filter(
            Tarjeta.id_tarjeta == tarjeta_id
        ).first() is not None
    finally:
        app.dependency_overrides.pop(main.get_db, None)
        app.dependency_overrides.pop(
            main.administrador_o_asesor_requerido,
            None,
        )
        db.close()
        engine.dispose()


def test_cliente_puede_ver_todas_sus_tarjetas_bloqueadas_y_activas():
    app, db, _, engine, cliente_id, cuenta_id = _crear_cliente_admin_tarjeta(
        "activa"
    )
    db.add(
        Tarjeta(
            id_cuenta=cuenta_id,
            numero_tarjeta="9876543210987654",
            fecha_expiracion="12/30",
            codigo_seguridad="456",
            estado="bloqueada",
        )
    )
    db.commit()
    app.dependency_overrides[main.token_required] = lambda: cliente_id

    try:
        response = TestClient(app).get("/tarjetas/mias")

        assert response.status_code == 200
        tarjetas = response.json()
        assert len(tarjetas) == 2
        assert [tarjeta["estado"] for tarjeta in tarjetas] == [
            "activa",
            "bloqueada",
        ]
    finally:
        app.dependency_overrides.pop(main.get_db, None)
        app.dependency_overrides.pop(main.token_required, None)
        app.dependency_overrides.pop(
            main.administrador_o_asesor_requerido,
            None,
        )
        db.close()
        engine.dispose()