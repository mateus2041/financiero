import re

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from Backend import main
from Backend.database.database import Base
from Backend.models import Administrador, Usuario
from Backend.security import hash_password


def test_registro_y_restablecimiento_generan_codigos_alfanumericos_unicos(monkeypatch):
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

    db.close()
    engine.dispose()
