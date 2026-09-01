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


def crear_plantilla_email(contenido_html: str) -> str:
    return f"""
    <div style="font-family: Arial, Helvetica, sans-serif; color: #1f1f1f; line-height: 1.6; max-width: 700px; margin: 0 auto; padding: 24px; background-color: #f7f7f7; border: 1px solid #dfe3e8;">
        <p style="margin: 0 0 20px; font-size: 16px; color: #1f1f1f;">Estimado cliente.</p>

        <p style="margin: 0 0 18px; font-size: 14px; color: #1f1f1f;">
            <strong style="color: #0d6efd;">financerio </strong> le informa que usted está recibiendo este mensaje por un trámite o actividad relacionada con su cuenta en Financiero.
        </p>

        <p style="margin: 0 0 18px; font-size: 16px; font-weight: 600; color: #1f1f1f;">Su banco de confianza.</p>

        <div style="border-top: 2px solid #d0d7de; margin: 18px 0 22px;"></div>

        {contenido_html}

        <div style="border-top: 2px solid #d0d7de; margin: 22px 0 18px;"></div>

        <p style="margin: 0 0 12px; font-size: 14px; color: #1f1f1f;">Por favor no responda este correo.</p>
        <p style="margin: 0 0 12px; font-size: 14px; color: #1f1f1f;">
            Para cualquier información adicional puede consultar nuestra página de Internet o comunicarse con nosotros a través de las siguientes opciones:
        </p>
        <ul style="margin: 0 0 18px 20px; padding: 0; font-size: 14px; color: #1f1f1f;">
            <li><span style="color: #0d6efd;">Línea Amiga</span></li>
            <li>Bogotá: <span style="color: #0d6efd;">601 5426446</span></li>
            <li>Resto del país: <span style="color: #0d6efd;">018000910038</span></li>
        </ul>

        <div style="border-top: 2px solid #d0d7de; margin: 18px 0 20px;"></div>

        <p style="margin: 0 0 14px; font-size: 12px; color: #4b5563; line-height: 1.5;">
            Este correo fue enviado por petición suya. Si desea no ser contactado desde esta dirección de correo, por favor ingrese a nuestra página de Internet o a la oficina del banco para modificar la matrícula de notificaciones. Toda información contenida en este mensaje es considerada de carácter confidencial y/o privilegiado y está dirigida únicamente a su destinatario, quien por tal razón es el único autorizado para leerla y utilizarla. Si usted ha recibido este correo por error, le pedimos que lo elimine totalmente de su sistema y comunique tal situación al remitente de inmediato.
        </p>

        <div style="border-top: 2px solid #d0d7de; margin: 22px 0 10px;"></div>

        <p style="margin: 0; font-size: 14px; color: #1f1f1f;">Tildes omitidas para manejar compatibilidad entre correos.</p>
    </div>
    """


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
