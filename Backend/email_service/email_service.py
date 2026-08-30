import os
import smtplib
from email.mime.text import MIMEText
from pathlib import Path

from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parents[1]


def _cargar_env_backend():
    candidatos = [
        Path.cwd() / ".env",
        BASE_DIR / ".env",
        BASE_DIR.parent / ".env",
    ]

    for archivo in candidatos:
        if archivo.exists():
            load_dotenv(archivo, override=False)


_cargar_env_backend()


def obtener_credenciales_correo():
    remitente = (
        os.getenv("EMAIL_USER")
        or os.getenv("MAIL_USER")
        or os.getenv("MAIL_USERNAME")
        or os.getenv("MAIL_USERNSME")
    )
    password = (
        os.getenv("EMAIL_PASS")
        or os.getenv("MAIL_PASSWORD")
        or os.getenv("MAIL_PASS")
        or os.getenv("MAIL_APP_PASSWORD")
    )

    if not remitente or not password:
        raise ValueError(
            "Faltan credenciales de correo en variables de entorno. "
            "Configura EMAIL_USER/EMAIL_PASS o MAIL_USER/MAIL_PASSWORD. "
            "Para Gmail usa la contraseña de aplicación."
        )

    return remitente, password


def enviar_correo(destinatario, asunto, mensaje_html):
    try:
        remitente, password = obtener_credenciales_correo()

        msg = MIMEText(mensaje_html, "html", "utf-8")
        msg["Subject"] = asunto
        msg["From"] = remitente
        msg["To"] = destinatario

        with smtplib.SMTP("smtp.gmail.com", 587) as servidor:
            servidor.starttls()
            servidor.login(remitente, password)
            servidor.send_message(msg)

        return True

    except Exception as e:
        print(f"❌ Error enviando correo: {e}")
        return False
