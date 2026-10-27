from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from Backend import main
from Backend.database.database import Base
from Backend.models import Administrador, Usuario


def test_listar_usuarios_acepta_correos_de_dominio_reservado(monkeypatch):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    db = sessionmaker(bind=engine)()

    administrador_usuario = Usuario(
        nombre="Admin Principal",
        email="admin@example.com",
        documento="1111111111",
        password="hash",
        rol="usuario",
    )
    usuario_prueba = Usuario(
        nombre="Usuario de prueba",
        email="usuario.prueba@example.test",
        documento="2222222222",
        password="hash",
        rol="usuario",
    )
    db.add_all([administrador_usuario, usuario_prueba])
    db.commit()
    db.refresh(administrador_usuario)
    db.add(
        Administrador(
            id_usuario=administrador_usuario.id_usuario,
            codigo_administrador="ADM-001",
        )
    )
    db.commit()

    monkeypatch.setitem(main.app.dependency_overrides, main.get_db, lambda: db)
    monkeypatch.setitem(
        main.app.dependency_overrides,
        main.token_required,
        lambda: administrador_usuario.id_usuario,
    )

    try:
        response = TestClient(
            main.app,
            raise_server_exceptions=False,
        ).get("/usuarios")

        assert response.status_code == 200
        usuarios = response.json()
        assert any(
            usuario["correo"] == "usuario.prueba@example.test"
            for usuario in usuarios
        )
    finally:
        db.close()
        engine.dispose()
