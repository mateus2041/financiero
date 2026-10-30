import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from Backend.database.database import Base
from Backend.main import registrar_usuario
from Backend.models import Cuenta, Usuario


def test_registrar_usuario_crea_cuentas_pendientes_de_aprobacion(monkeypatch):
    engine = create_engine("sqlite://")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    monkeypatch.setattr("Backend.main.ubicacion_real", lambda *args, **kwargs: True)

    data = {
        "nombre": "Ana Gómez",
        "email": "ana@test.com",
        "documento": "1000000000",
        "telefono": "3001234567",
        "password": "Segura123",
        "tipo_documento": "cc",
        "ciudad": "Bogotá",
        "direccion": "Calle 12 # 34-56",
        "localidad": "La Candelaria",
        "barrio": "La Candelaria",
        "codigo_correspondencia": "110111",
    }

    resultado = registrar_usuario(data, db, "usuario")

    cuentas = db.query(Cuenta).filter(Cuenta.id_usuario == resultado["usuario"]["id"]).all()

    assert len(cuentas) == 1
    assert cuentas[0].tipo_cuenta == "corriente"
    assert {cuenta.estado for cuenta in cuentas} == {"inactiva"}

    usuario = db.query(Usuario).filter(
        Usuario.id_usuario == resultado["usuario"]["id"]
    ).one()
    assert usuario.ciudad == "Bogotá"
    assert usuario.localidad == "La Candelaria"
    assert usuario.barrio == "La Candelaria"
    assert usuario.codigo_postal == "110111"
    assert usuario.id_tipo_doc is not None

    db.close()


def test_registrar_usuario_rechaza_correo_duplicado_con_conflicto():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    db.add(
        Usuario(
            nombre="Ana Gómez",
            email="ana@test.com",
            documento="1000000000",
            password="hash",
        )
    )
    db.commit()

    with pytest.raises(HTTPException) as error:
        registrar_usuario(
            {
                "nombre": "Otra persona",
                "email": "ANA@test.com",
                "documento": "2000000000",
                "password": "Segura123",
                "telefono": "3001234567",
                "tipo_documento": "cc",
                "ciudad": "Bogotá",
                "direccion": "Calle 12 # 34-56",
                "localidad": "La Candelaria",
                "barrio": "La Candelaria",
                "codigo_correspondencia": "110111",
            },
            db,
            "usuario",
        )

    assert error.value.status_code == 409
    assert error.value.detail == "El correo electrónico ya está registrado"
    db.close()
