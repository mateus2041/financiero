import smtplib
from email.mime.text import MIMEText
import os


def enviar_correo(destinatario, asunto, mensaje_html):
    try:
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
            or os.getenv("MAIL_USERNAME")
        )

        if not remitente or not password:
            raise ValueError(
                "Faltan credenciales de correo en variables de entorno. "
                "Configura EMAIL_USER/EMAIL_PASS o MAIL_USER/MAIL_PASSWORD."
            )

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