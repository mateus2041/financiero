from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from Backend import main
from Backend.database.database import Base
from Backend.models import Administrador, Usuario


def crear_contexto(monkeypatch, usuario_autenticado):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    db = sessionmaker(bind=engine)()
    monkeypatch.setitem(main.app.dependency_overrides, main.get_db, lambda: db)
    monkeypatch.setitem(
        main.app.dependency_overrides,
        main.token_required,
        lambda: usuario_autenticado.id_usuario,
    )
    return engine, db


def test_calcular_edad_considera_si_ya_cumplio_este_ano():
    assert main.calcular_edad(date(1966, 11, 25), date(2026, 11, 24)) == 59
    assert main.calcular_edad(date(1966, 11, 24), date(2026, 11, 24)) == 60


def test_asesor_confirma_discapacidad_para_habilitar_beneficio_joven(monkeypatch):
    asesor = Usuario(
        nombre="Asesora",
        email="asesora@example.com",
        documento="10000001",
        password="hash",
        rol="asesor",
    )
    engine, db = crear_contexto(monkeypatch, asesor)
    usuario = Usuario(
        nombre="Usuario joven",
        email="joven@example.com",
        documento="20000002",
        password="hash",
        fecha_nacimiento=date(date.today().year - 20, 1, 1),
    )
    db.add_all([asesor, usuario])
    db.commit()
    db.refresh(usuario)

    try:
        client = TestClient(main.app)
        url = f"/usuarios/{usuario.id_usuario}/beneficio"

        sin_confirmar = client.put(
            url,
            json={"habilitado": True, "confirmar_discapacidad": False},
        )
        assert sin_confirmar.status_code == 400

        habilitado = client.put(
            url,
            json={"habilitado": True, "confirmar_discapacidad": True},
        )
        assert habilitado.status_code == 200
        assert habilitado.json()["usuario"]["beneficio_habilitado"] is True
        assert habilitado.json()["usuario"]["discapacidad_confirmada"] is True
        assert db.get(Usuario, usuario.id_usuario).beneficio_habilitado is True
    finally:
        main.app.dependency_overrides.clear()
        db.close()
        engine.dispose()


def test_asesor_puede_habilitar_beneficio_a_persona_de_60_sin_discapacidad(
    monkeypatch,
):
    asesor = Usuario(
        nombre="Asesor",
        email="asesor@example.com",
        documento="50000005",
        password="hash",
        rol="asesor",
    )
    engine, db = crear_contexto(monkeypatch, asesor)
    usuario = Usuario(
        nombre="Usuario de 60",
        email="sesenta@example.com",
        documento="60000006",
        password="hash",
        fecha_nacimiento=date(date.today().year - 60, 1, 1),
    )
    db.add_all([asesor, usuario])
    db.commit()
    db.refresh(usuario)

    try:
        response = TestClient(main.app).put(
            f"/usuarios/{usuario.id_usuario}/beneficio",
            json={"habilitado": True, "confirmar_discapacidad": False},
        )
        assert response.status_code == 200
        assert response.json()["usuario"]["tipo_beneficio"] == "pensionado"
        assert response.json()["usuario"]["beneficio_habilitado"] is True
    finally:
        main.app.dependency_overrides.clear()
        db.close()
        engine.dispose()


def test_usuario_no_asesor_no_puede_habilitar_beneficio(monkeypatch):
    usuario_autenticado = Usuario(
        nombre="Usuario normal",
        email="normal@example.com",
        documento="30000003",
        password="hash",
    )
    engine, db = crear_contexto(monkeypatch, usuario_autenticado)
    usuario_objetivo = Usuario(
        nombre="Usuario de 60",
        email="sesenta@example.com",
        documento="40000004",
        password="hash",
        fecha_nacimiento=date(date.today().year - 60, 1, 1),
    )
    db.add_all([usuario_autenticado, usuario_objetivo])
    db.commit()
    db.refresh(usuario_objetivo)

    try:
        response = TestClient(main.app).put(
            f"/usuarios/{usuario_objetivo.id_usuario}/beneficio",
            json={"habilitado": True, "confirmar_discapacidad": False},
        )
        assert response.status_code == 403
        assert db.get(Usuario, usuario_objetivo.id_usuario).beneficio_habilitado is False
    finally:
        main.app.dependency_overrides.clear()
        db.close()
        engine.dispose()


def test_usuario_consulta_estado_actual_de_su_beneficio(monkeypatch):
    usuario = Usuario(
        nombre="Usuario beneficiario",
        email="beneficiario@example.com",
        documento="90000009",
        password="hash",
        beneficio_habilitado=True,
    )
    engine, db = crear_contexto(monkeypatch, usuario)
    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    try:
        client = TestClient(main.app)
        assert client.get("/usuario").json()["beneficio_habilitado"] is True

        usuario.beneficio_habilitado = False
        db.commit()

        assert client.get("/usuario").json()["beneficio_habilitado"] is False
    finally:
        main.app.dependency_overrides.clear()
        db.close()
        engine.dispose()


def test_lista_no_expone_datos_del_beneficio_al_administrador(monkeypatch):
    administrador_usuario = Usuario(
        nombre="Administrador",
        email="admin@example.com",
        documento="70000007",
        password="hash",
    )
    engine, db = crear_contexto(monkeypatch, administrador_usuario)
    usuario = Usuario(
        nombre="Usuario de 60",
        email="cliente@example.com",
        documento="80000008",
        password="hash",
        fecha_nacimiento=date(date.today().year - 60, 1, 1),
        beneficio_habilitado=True,
    )
    db.add_all([administrador_usuario, usuario])
    db.commit()
    db.refresh(administrador_usuario)
    db.add(
        Administrador(
            id_usuario=administrador_usuario.id_usuario,
            codigo_administrador="ADM-TEST",
        )
    )
    db.commit()

    try:
        response = TestClient(main.app).get("/usuarios")
        assert response.status_code == 200
        usuario_en_lista = next(
            item for item in response.json()
            if item["id_usuario"] == usuario.id_usuario
        )
        assert usuario_en_lista["fecha_nacimiento"] is None
        assert usuario_en_lista["edad"] is None
        assert usuario_en_lista["tipo_beneficio"] is None
        assert usuario_en_lista["beneficio_habilitado"] is None
    finally:
        main.app.dependency_overrides.clear()
        db.close()
        engine.dispose()