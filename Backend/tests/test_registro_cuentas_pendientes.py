from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from Backend.database.database import Base
from Backend.main import registrar_usuario
from Backend.models import Cuenta


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
        "direccion": "Calle 12 # 34-56",
        "localidad": "Bogotá",
        "barrio": "La Candelaria",
        "codigo_correspondencia": "110111",
    }

    resultado = registrar_usuario(data, db, "usuario")

    cuentas = db.query(Cuenta).filter(Cuenta.id_usuario == resultado["usuario"]["id"]).all()

    assert len(cuentas) == 2
    assert {cuenta.estado for cuenta in cuentas} == {"inactiva"}

    db.close()
