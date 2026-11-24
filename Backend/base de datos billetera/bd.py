import os
import logging

import mysql.connector
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

db_password = os.getenv("DB_PASSWORD")
if not db_password:
    raise RuntimeError("DB_PASSWORD must be set in the environment or .env file")

try:
    conexion = mysql.connector.connect(
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "3306")),
        user=os.getenv("DB_USER", "app_user"),
        password=db_password,
        database=os.getenv("DB_NAME", "billetera")
    )

    if conexion.is_connected():
        logger.info("Conectado a la base de datos")

        cursor = conexion.cursor()
        cursor.execute("SELECT DATABASE();")
        resultado = cursor.fetchone()
        logger.info("Base de datos actual: %s", resultado)

except mysql.connector.Error as error:
    logger.exception("Error al conectar")

finally:
    if 'conexion' in locals() and conexion.is_connected():
        cursor.close()
        conexion.close()
        logger.info("Conexión cerrada")