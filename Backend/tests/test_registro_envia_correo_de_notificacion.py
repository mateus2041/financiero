from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from Backend.database.database import Base
from Backend.main import registrar_usuario


def test_registro_envia_correo_de_notificacion(monkeypatch):
    engine = create_engine("sqlite://")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    llamadas = {}

    def fake_enviar_correo(destinatario, asunto, mensaje_html):
        llamadas["destinatario"] = destinatario
        llamadas["asunto"] = asunto
        llamadas["mensaje_html"] = mensaje_html
        return True

    monkeypatch.setattr("Backend.main.enviar_correo", fake_enviar_correo)
    monkeypatch.setattr("Backend.main.ubicacion_real", lambda *args, **kwargs: True)

    resultado = registrar_usuario(
        {
            "nombre": "Carlos Ruiz",
            "email": "carlos@test.com",
            "documento": "987654321",
            "password": "Segura123",
            "telefono": "3001234567",
            "tipo_documento": "cc",
            "direccion": "Calle 123",
            "localidad": "Bogotá",
            "barrio": "Centro",
            "codigo_correspondencia": "111111",
        },
        db,
        "usuario",
    )

    assert resultado["usuario"]["nombre"] == "Carlos Ruiz"
    assert llamadas["destinatario"] == "carlos@test.com"
    assert "Cuenta creada" in llamadas["asunto"]
    assert "Carlos Ruiz" in llamadas["mensaje_html"]

    db.close()
