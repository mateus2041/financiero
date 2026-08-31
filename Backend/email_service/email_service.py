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
        Path.cwd() / "Backend" / ".env",
        BASE_DIR / ".." / ".env",
    ]

    for archivo in candidatos:
        ruta = Path(archivo)
        if ruta.exists():
            load_dotenv(ruta, override=False)
            return


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
        or os.getenv("EMAIL_PASSWORD")
        or os.getenv("MAIL_PASSWORD")
        or os.getenv("MAIL_PASS")
        or os.getenv("MAIL_APP_PASSWORD")
    )

    if not remitente or not password:
        return None

    return remitente, password


def enviar_correo(destinatario, asunto, mensaje_html):
    try:
        if not destinatario:
            return False

        credenciales = obtener_credenciales_correo()
        if not credenciales:
            print(
                "⚠️ Correo no configurado: faltan EMAIL_USER/EMAIL_PASS o "
                "MAIL_USER/MAIL_PASSWORD. El login continuará sin enviar email."
            )
            return False

        remitente, password = credenciales
        smtp_host = os.getenv("MAIL_SERVER") or os.getenv("SMTP_HOST") or "smtp.gmail.com"
        smtp_port = int(os.getenv("MAIL_PORT") or os.getenv("SMTP_PORT") or "587")

        msg = MIMEText(mensaje_html, "html", "utf-8")
        msg["Subject"] = asunto
        msg["From"] = remitente
        msg["To"] = destinatario

        with smtplib.SMTP(smtp_host, smtp_port) as servidor:
            servidor.starttls()
            servidor.login(remitente, password)
            servidor.send_message(msg)

        return True

    except Exception as e:
        print(f"❌ Error enviando correo: {e}")
        return False
