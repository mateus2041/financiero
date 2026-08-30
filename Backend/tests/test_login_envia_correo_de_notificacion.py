from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from Backend.database.database import Base
from Backend.main import login
from Backend.models import Cuenta, Usuario
from Backend.security import hash_password


def test_email_service_lee_credenciales_desde_backend_env(monkeypatch, tmp_path):
    backend_dir = Path(__file__).resolve().parents[1]
    env_path = backend_dir / ".env"
    env_path.write_text("EMAIL_USER=prueba@gmail.com\nEMAIL_PASS=app-password\n", encoding="utf-8")

    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("EMAIL_USER", raising=False)
    monkeypatch.delenv("EMAIL_PASS", raising=False)

    import importlib
    import Backend.email_service.email_service as email_service
    importlib.reload(email_service)

    remitente, password = email_service.obtener_credenciales_correo()

    assert remitente == "prueba@gmail.com"
    assert password == "app-password"

    env_path.unlink(missing_ok=True)


def test_login_envia_correo_de_notificacion(monkeypatch):
    engine = create_engine("sqlite://")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    usuario = Usuario(
        nombre="Ana Gómez",
        email="ana@test.com",
        documento="1000000000",
        password=hash_password("Segura123"),
        rol="usuario",
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    db.add(
        Cuenta(
            id_usuario=usuario.id_usuario,
            numero_cuenta="1234567890123456",
            tipo_cuenta="ahorros",
            saldo=0,
            estado="activa",
        )
    )
    db.commit()

    llamadas = {}

    def fake_enviar_correo(destinatario, asunto, mensaje_html):
        llamadas["destinatario"] = destinatario
        llamadas["asunto"] = asunto
        llamadas["mensaje_html"] = mensaje_html
        return True

    monkeypatch.setattr("Backend.main.enviar_correo", fake_enviar_correo)

    resultado = login({"documento": "1000000000", "password": "Segura123", "rol": "usuario"}, db)

    assert resultado["message"] == "Login exitoso"
    assert resultado["codigo_verificacion"].isdigit()
    assert len(resultado["codigo_verificacion"]) == 4
    assert llamadas["destinatario"] == "ana@test.com"
    assert "Inicio de sesión" in llamadas["asunto"]
    assert "Ana Gómez" in llamadas["mensaje_html"]
    assert resultado["codigo_verificacion"] in llamadas["mensaje_html"]

    db.close()
