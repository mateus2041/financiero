import smtplib
from email.mime.text import MIMEText
import os


def enviar_correo(destinatario, asunto, mensaje_html):
    try:
        # 🔹 Variables de entorno (SIN valores por defecto inseguros)
        remitente = os.getenv("EMAIL_USER")
        password = os.getenv("EMAIL_PASS")

        if not remitente or not password:
            raise ValueError("Faltan credenciales de correo en variables de entorno")

        # 🔹 Crear mensaje
        msg = MIMEText(mensaje_html, "html", "utf-8")
        msg["Subject"] = asunto
        msg["From"] = remitente
        msg["To"] = destinatario

        # 🔹 Conexión segura con Gmail
        with smtplib.SMTP("smtp.gmail.com", 587) as servidor:
            servidor.starttls()
            servidor.login(remitente, password)
            servidor.send_message(msg)

        return True

    except Exception as e:
        print(f"❌ Error enviando correo: {e}")
        return False