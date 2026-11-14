from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from Backend import main
from Backend.database.database import Base
from Backend.models import AsesorBanco, Cuenta, Tarjeta, Usuario


def test_asesor_puede_cargar_estadisticas_sin_vinculo_a_usuario(monkeypatch):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    db = sessionmaker(bind=engine)()

    asesor = Usuario(
        nombre="Asesor Bancario",
        email="asesor@test.com",
        documento="1111111111",
        password="hash",
        rol="asesor",
    )
    usuario = Usuario(
        nombre="Cliente",
        email="cliente@test.com",
        documento="2222222222",
        password="hash",
        rol="usuario",
    )
    db.add_all([asesor, usuario])
    db.commit()
    db.refresh(asesor)
    db.refresh(usuario)

    db.add(
        AsesorBanco(
            nombre=asesor.nombre,
            documento=asesor.documento,
            email=asesor.email,
            codigo_asesor="ASESOR-001",
        )
    )
    cuenta_activa = Cuenta(
        id_usuario=usuario.id_usuario,
        numero_cuenta="1234567890123456",
        tipo_cuenta="ahorros",
        estado="activa",
    )
    cuenta_inactiva = Cuenta(
        id_usuario=usuario.id_usuario,
        numero_cuenta="6543210987654321",
        tipo_cuenta="corriente",
        estado="inactiva",
    )
    db.add_all([cuenta_activa, cuenta_inactiva])
    db.commit()
    db.refresh(cuenta_activa)
    db.add(Tarjeta(id_cuenta=cuenta_activa.id_cuenta, estado="activa"))
    db.commit()

    monkeypatch.setitem(main.app.dependency_overrides, main.get_db, lambda: db)
    monkeypatch.setitem(
        main.app.dependency_overrides,
        main.token_required,
        lambda: asesor.id_usuario,
    )

    response = TestClient(main.app).get("/administradores/estadisticas")

    assert response.status_code == 200
    assert response.json() == {
        "usuarios_registrados": 1,
        "usuarios_activos": 1,
        "cuentas_bloqueadas": 1,
        "cuentas_habilitadas": 1,
        "cuentas_deshabilitadas": 1,
        "tarjetas_activas": 1,
    }

    db.close()
    engine.dispose()
