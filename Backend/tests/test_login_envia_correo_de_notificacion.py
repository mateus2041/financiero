from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from Backend.database.database import Base
from Backend.main import enviar_correos_acceso, login
from Backend.models import Cuenta, Usuario
from Backend.security import check_password, hash_password


def test_notificacion_no_se_envia_si_falla_el_codigo(monkeypatch):
    asuntos_enviados = []

    def fake_enviar_correo(destinatario, asunto, mensaje_html):
        asuntos_enviados.append(asunto)
        return False

    monkeypatch.setattr("Backend.main.enviar_correo", fake_enviar_correo)

    enviado = enviar_correos_acceso(
        "ana@test.com",
        "Código de verificación",
        "código",
        "Notificación de ingreso",
        "ingreso",
    )

    assert enviado is False
    assert asuntos_enviados == ["Código de verificación"]


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


def test_email_service_devuelve_none_si_faltan_credenciales(monkeypatch, tmp_path):
    backend_dir = Path(__file__).resolve().parents[1]
    env_path = backend_dir / ".env"
    if env_path.exists():
        env_path.unlink()

    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("EMAIL_USER", raising=False)
    monkeypatch.delenv("EMAIL_PASS", raising=False)
    monkeypatch.delenv("MAIL_USER", raising=False)
    monkeypatch.delenv("MAIL_PASSWORD", raising=False)

    import importlib
    import Backend.email_service.email_service as email_service
    importlib.reload(email_service)

    assert email_service.obtener_credenciales_correo() is None


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

    llamadas = []

    def fake_enviar_correo(destinatario, asunto, mensaje_html):
        llamadas.append({
            "destinatario": destinatario,
            "asunto": asunto,
            "mensaje_html": mensaje_html,
        })
        return True

    monkeypatch.setattr("Backend.main.enviar_correo", fake_enviar_correo)

    resultado = login(
        {"documento": "1000000000", "password": "Segura123", "rol": "usuario"},
        db=db,
    )

    assert resultado["message"] == "Login exitoso"
    assert resultado["codigo_verificacion"].isdigit()
    assert len(resultado["codigo_verificacion"]) == 4
    assert len(llamadas) == 2
    assert "Código de verificación" in llamadas[0]["asunto"]
    assert "Fecha y hora" in llamadas[1]["asunto"]
    correo_codigo = next(
        llamada for llamada in llamadas
        if "Código de verificación" in llamada["asunto"]
    )
    correo_notificacion = next(
        llamada for llamada in llamadas
        if "Fecha y hora" in llamada["asunto"]
    )
    assert correo_codigo["destinatario"] == "ana@test.com"
    assert "Ana Gómez" in correo_codigo["mensaje_html"]
    assert "Estimado cliente" in correo_codigo["mensaje_html"]
    assert resultado["codigo_verificacion"] in correo_codigo["mensaje_html"]
    assert "Este código de verificación vencerá en 10 minutos." in correo_codigo["mensaje_html"]
    assert correo_codigo["mensaje_html"].index(
        "Este código de verificación vencerá en 10 minutos."
    ) < correo_codigo["mensaje_html"].index("Tu código de verificación es:")
    assert "ingreso a tu cuenta" in correo_notificacion["mensaje_html"].lower()
    assert "fecha" in correo_notificacion["mensaje_html"].lower()
    assert "hora" in correo_notificacion["mensaje_html"].lower()

    db.close()


def test_login_acepta_identificadores_alternos_y_migra_contrasena_legacy(monkeypatch):
    engine = create_engine("sqlite://")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    usuario = Usuario(
        nombre="Luis Mateus",
        email="luis@test.com",
        documento="1234567890",
        password="ClaveTemporal123!",
        rol="usuario",
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    password_legacy = usuario.password

    db.add(
        Cuenta(
            id_usuario=usuario.id_usuario,
            numero_cuenta="1234567890123456",
            tipo_cuenta="corriente",
            saldo=0,
            estado="activa",
        )
    )
    db.commit()
    monkeypatch.setattr("Backend.main.enviar_correos_acceso", lambda *args: True)

    resultado = login(
        {"documento": "1234567890", "password": "ClaveTemporal123!", "rol": "usuario"},
        db=db,
    )

    db.refresh(usuario)
    assert resultado["message"] == "Login exitoso"
    assert usuario.password != password_legacy
    assert check_password("ClaveTemporal123!", usuario.password)

    for identificador in ("luis@test.com", "1234567890123456"):
        resultado = login(
            {
                "documento": identificador,
                "password": "ClaveTemporal123!",
                "rol": "usuario",
            },
            db=db,
        )
        assert resultado["message"] == "Login exitoso"

    db.close()
