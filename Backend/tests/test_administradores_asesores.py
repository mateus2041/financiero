import re

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from Backend import main
from Backend.database.database import Base
from Backend.models import Administrador, AsesorBanco, Usuario
from Backend.security import hash_password


<<<<<<< HEAD
def test_registro_y_restablecimiento_generan_codigos_alfanumericos_unicos(monkeypatch):
=======
def test_registro_estado_restablecimiento_y_eliminacion(monkeypatch):
>>>>>>> 1d230e60767b7ee8dd388f8bc1c2da18b87a7cc2
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    db = sessionmaker(bind=engine)()

    administrador_usuario = Usuario(
        nombre="Admin Principal",
        email="admin.asesores@example.com",
        documento="1111111111",
        password=hash_password("Segura123"),
        rol="usuario",
    )
    db.add(administrador_usuario)
    db.commit()
    db.refresh(administrador_usuario)
    db.add(
        Administrador(
            id_usuario=administrador_usuario.id_usuario,
            codigo_administrador="ADM-ASESORES",
        )
    )
    db.commit()

    monkeypatch.setitem(main.app.dependency_overrides, main.get_db, lambda: db)
    monkeypatch.setitem(
        main.app.dependency_overrides,
        main.token_required,
        lambda: administrador_usuario.id_usuario,
    )

    client = TestClient(main.app)
    codigos = []
    for indice in range(2):
        response = client.post(
            "/administradores/asesores",
            json={
                "nombre": f"Asesor {indice}",
                "documento": f"222222222{indice}",
                "tipo_documento": "cc",
                "email": f"asesor{indice}@example.com",
            },
        )

        assert response.status_code == 200
        codigo = response.json()["codigo_asesor"]
        assert re.fullmatch(r"(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[A-Za-z\d]{10}", codigo)
        codigos.append(codigo)

    assert codigos[0] != codigos[1]

    id_asesor = db.execute(
        text("SELECT id_asesor FROM asesores_banco ORDER BY id_asesor LIMIT 1")
    ).scalar_one()
<<<<<<< HEAD
=======
    response = client.put(
        f"/administradores/asesores/{id_asesor}",
        json={
            "id_asesor": id_asesor,
            "codigo_asesor": codigos[0],
            "estado": "inactivo",
        },
    )

    assert response.status_code == 200
    assert response.json()["estado"] == "inactivo"
    estado_guardado = db.execute(
        text("SELECT estado FROM asesores_banco WHERE id_asesor = :id_asesor"),
        {"id_asesor": id_asesor},
    ).scalar_one()
    assert estado_guardado == "inactivo"

>>>>>>> 1d230e60767b7ee8dd388f8bc1c2da18b87a7cc2
    response = client.post(
        f"/administradores/asesores/{id_asesor}/restablecer-codigo",
        json={},
    )

    assert response.status_code == 200
    nuevo_codigo = response.json()["codigo_asesor"]
    assert re.fullmatch(r"(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[A-Za-z\d]{10}", nuevo_codigo)
    assert nuevo_codigo not in codigos

    codigo_guardado = db.execute(
        text(
            "SELECT codigo_asesor FROM asesores_banco WHERE id_asesor = :id_asesor"
        ),
        {"id_asesor": id_asesor},
    ).scalar_one()
    assert codigo_guardado == nuevo_codigo

<<<<<<< HEAD
=======
    response = client.delete(f"/administradores/asesores/{id_asesor}")

    assert response.status_code == 200
    assert response.json()["id_asesor"] == id_asesor
    asesor_eliminado = db.execute(
        text("SELECT id_asesor FROM asesores_banco WHERE id_asesor = :id_asesor"),
        {"id_asesor": id_asesor},
    ).first()
    assert asesor_eliminado is None

>>>>>>> 1d230e60767b7ee8dd388f8bc1c2da18b87a7cc2
    db.close()
    engine.dispose()


def test_login_asesor_diferencia_correo_codigo_y_estado(monkeypatch):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    db = sessionmaker(bind=engine)()
    db.add(
        AsesorBanco(
            nombre="Asesor Activo",
            documento="3333333333",
            tipo_documento="cc",
            email="asesor.activo@example.com",
            codigo_asesor="CodigoValido1",
            especialidad="Ahorro",
            estado="activo",
        )
    )
    db.commit()

    monkeypatch.setitem(main.app.dependency_overrides, main.get_db, lambda: db)
    client = TestClient(main.app)

    correo_invalido = client.post(
        "/asesor-login",
        json={
            "email": "otro.asesor@example.com",
            "codigo_asesor": "CodigoValido1",
        },
    )
    assert correo_invalido.status_code == 401
    assert correo_invalido.json()["detail"] == (
        "El correo electrónico del asesor no está registrado"
    )

    codigo_invalido = client.post(
        "/asesor-login",
        json={
            "email": "asesor.activo@example.com",
            "codigo_asesor": "CodigoIncorrecto",
        },
    )
    assert codigo_invalido.status_code == 401
    assert codigo_invalido.json()["detail"] == "El código de asesor no es válido"

    asesor = db.query(AsesorBanco).filter_by(email="asesor.activo@example.com").one()
    asesor.estado = "inactivo"
    db.commit()

    asesor_inactivo = client.post(
        "/asesor-login",
        json={
            "email": "asesor.activo@example.com",
            "codigo_asesor": "CodigoValido1",
        },
    )
    assert asesor_inactivo.status_code == 401
    assert asesor_inactivo.json()["detail"] == "El asesor está inactivo"

    db.close()
    engine.dispose()


def test_login_asesor_ignora_usuario_administrador_con_mismo_email(monkeypatch):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    db = sessionmaker(bind=engine)()
    db.add_all(
        [
            Usuario(
                nombre="Administrador",
                email="asesor@example.com",
                documento="4444444444",
                password=hash_password("Segura123"),
                rol="administrador",
            ),
            AsesorBanco(
                nombre="Mateo Asesor",
                documento="5555555555",
                tipo_documento="cc",
                email="asesor@example.com",
                codigo_asesor="CodigoValido2",
                especialidad="Créditos",
                estado="activo",
            ),
        ]
    )
    db.commit()

    monkeypatch.setitem(main.app.dependency_overrides, main.get_db, lambda: db)
    client = TestClient(main.app)
    response = client.post(
        "/asesor-login",
        json={
            "email": "asesor@example.com",
            "codigo_asesor": "CodigoValido2",
        },
    )

    assert response.status_code == 200
    assert response.json()["usuario"]["rol"] == "asesor"
    assert response.json()["usuario"]["id"] < 0

    db.close()
    engine.dispose()


def test_login_administrador_valida_el_rol_en_la_base_de_datos(monkeypatch):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    db = sessionmaker(bind=engine)()
    usuario = Usuario(
        nombre="Usuario Asociado",
        email="usuario.administrador@example.com",
        documento="6666666666",
        password=hash_password("Segura123"),
        rol="usuario",
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    db.add(
        Administrador(
            id_usuario=usuario.id_usuario,
            codigo_administrador="ADM-INCONSISTENTE",
        )
    )
    db.commit()

    monkeypatch.setitem(main.app.dependency_overrides, main.get_db, lambda: db)
    client = TestClient(main.app)
    response = client.post(
        "/administrador-login",
        json={
            "documento": "6666666666",
            "codigo_administrador": "ADM-INCONSISTENTE",
        },
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "El usuario no tiene el rol de administrador"

    db.close()
    engine.dispose()
