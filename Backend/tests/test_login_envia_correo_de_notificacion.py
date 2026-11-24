<<<<<<< HEAD
from datetime import datetime, timedelta, timezone
from pathlib import Path
import re

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from Backend.database.database import Base
from Backend.main import (
    _hash_codigo_login,
    app,
    enviar_correos_acceso,
    get_db,
    login,
)
from Backend.models import Cuenta, Usuario, VerificacionLogin
=======
from pathlib import Path

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from Backend.database.database import Base
from Backend.main import enviar_correos_acceso, login
from Backend.models import Cuenta, Usuario
>>>>>>> develop
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
    monkeypatch.delenv("PYTHON_DOTENV_DISABLED", raising=False)

    import importlib
    import Backend.email_service.email_service as email_service
    try:
        importlib.reload(email_service)

        remitente, password = email_service.obtener_credenciales_correo()

        assert remitente == "prueba@gmail.com"
        assert password == "app-password"
    finally:
        env_path.unlink(missing_ok=True)


def test_email_service_devuelve_none_si_faltan_credenciales(monkeypatch):
    import Backend.email_service.email_service as email_service

    monkeypatch.delenv("EMAIL_USER", raising=False)
    monkeypatch.delenv("EMAIL_PASS", raising=False)
    monkeypatch.delenv("MAIL_USER", raising=False)
    monkeypatch.delenv("MAIL_PASSWORD", raising=False)
    monkeypatch.setattr(email_service, "_cargar_env_backend", lambda: None)

    assert email_service.obtener_credenciales_correo() is None


def test_login_envia_correo_de_notificacion(monkeypatch):
<<<<<<< HEAD
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
=======
    engine = create_engine("sqlite://")
>>>>>>> develop
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
<<<<<<< HEAD
    monkeypatch.setitem(app.dependency_overrides, get_db, lambda: db)
=======
>>>>>>> develop

    resultado = login(
        {"documento": "1000000000", "password": "Segura123", "rol": "usuario"},
        db=db,
    )

    assert resultado["message"] == "Login exitoso"
<<<<<<< HEAD
    assert resultado["challenge_id"]
    assert "token" not in resultado
    assert "codigo_verificacion" not in resultado
=======
    assert resultado["codigo_verificacion"].isdigit()
    assert len(resultado["codigo_verificacion"]) == 4
>>>>>>> develop
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
<<<<<<< HEAD
    codigo = re.search(
        r"Tu código de verificación es: <strong[^>]*>(\d{4})</strong>",
        correo_codigo["mensaje_html"],
    ).group(1)
=======
    assert resultado["codigo_verificacion"] in correo_codigo["mensaje_html"]
>>>>>>> develop
    assert "Este código de verificación vencerá en 10 minutos." in correo_codigo["mensaje_html"]
    assert correo_codigo["mensaje_html"].index(
        "Este código de verificación vencerá en 10 minutos."
    ) < correo_codigo["mensaje_html"].index("Tu código de verificación es:")
    assert "ingreso a tu cuenta" in correo_notificacion["mensaje_html"].lower()
    assert "fecha" in correo_notificacion["mensaje_html"].lower()
    assert "hora" in correo_notificacion["mensaje_html"].lower()
<<<<<<< HEAD
    reto = db.query(VerificacionLogin).filter_by(
        challenge_id=resultado["challenge_id"]
    ).one()
    assert reto.codigo_hash != codigo

    client = TestClient(app)
    codigo_incorrecto = "0000" if codigo != "0000" else "0001"
    incorrecto = client.post(
        "/verificar-login",
        json={
            "challenge_id": resultado["challenge_id"],
            "codigo": codigo_incorrecto,
        },
    )
    assert incorrecto.status_code == 401

    verificado = client.post(
        "/verificar-login",
        json={"challenge_id": resultado["challenge_id"], "codigo": codigo},
    )
    assert verificado.status_code == 200
    assert verificado.json()["token"]

    repetido = client.post(
        "/verificar-login",
        json={"challenge_id": resultado["challenge_id"], "codigo": codigo},
    )
    assert repetido.status_code == 401
=======
>>>>>>> develop

    db.close()


<<<<<<< HEAD
def test_verificacion_login_bloquea_despues_de_cinco_codigos_incorrectos(
    monkeypatch,
):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    db = sessionmaker(bind=engine)()
    challenge_id = "a" * 43
    codigo_correcto = "1234"
    db.add(
        VerificacionLogin(
            challenge_id=challenge_id,
            id_usuario=1,
            rol="usuario",
            codigo_hash=_hash_codigo_login(challenge_id, codigo_correcto),
            expira_en=datetime.now(timezone.utc).replace(tzinfo=None)
            + timedelta(minutes=10),
        )
    )
    db.commit()
    monkeypatch.setitem(app.dependency_overrides, get_db, lambda: db)
    client = TestClient(app)

    responses = [
        client.post(
            "/verificar-login",
            json={"challenge_id": challenge_id, "codigo": "9999"},
        )
        for _ in range(5)
    ]

    assert [response.status_code for response in responses] == [
        401,
        401,
        401,
        401,
        429,
    ]
    assert db.query(VerificacionLogin).filter_by(
        challenge_id=challenge_id
    ).first() is None

    db.close()


def test_login_no_emite_reto_si_falla_el_envio_del_correo(monkeypatch):
=======
def test_login_sigue_con_el_acceso_si_falla_el_envio_del_correo(monkeypatch):
>>>>>>> develop
    engine = create_engine("sqlite://")
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()

    usuario = Usuario(
        nombre="Sofía Ruiz",
        email="sofia@test.com",
        documento="2000000000",
        password=hash_password("Segura123"),
        rol="usuario",
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    db.add(
        Cuenta(
            id_usuario=usuario.id_usuario,
            numero_cuenta="2000000000000000",
            tipo_cuenta="ahorros",
            saldo=0,
            estado="activa",
        )
    )
    db.commit()

    monkeypatch.setattr("Backend.main.enviar_correos_acceso", lambda *args: False)

<<<<<<< HEAD
    with pytest.raises(HTTPException) as error:
        login(
            {"documento": "2000000000", "password": "Segura123", "rol": "usuario"},
            db=db,
        )

    assert error.value.status_code == 503
    assert db.query(VerificacionLogin).count() == 0
=======
    resultado = login(
        {"documento": "2000000000", "password": "Segura123", "rol": "usuario"},
        db=db,
    )

    assert resultado["message"] == "Login exitoso"
    assert resultado["codigo_verificacion"].isdigit()
    assert len(resultado["codigo_verificacion"]) == 4

>>>>>>> develop
    db.close()


def test_login_solo_acepta_documento_y_migra_contrasena_legacy(monkeypatch):
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

    with pytest.raises(ValidationError):
        login(
            {
                "documento": "luis@test.com",
                "password": "ClaveTemporal123!",
                "rol": "usuario",
            },
            db=db,
        )

    with pytest.raises(HTTPException) as error:
        login(
            {
                "documento": "1234567890123456",
                "password": "ClaveTemporal123!",
                "rol": "usuario",
            },
            db=db,
        )
    assert error.value.status_code == 404

    db.close()
