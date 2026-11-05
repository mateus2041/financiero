import os

import mysql.connector
from dotenv import load_dotenv

load_dotenv()

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
        print("✅ Conectado a la base de datos")

        cursor = conexion.cursor()
        cursor.execute("SELECT DATABASE();")
        resultado = cursor.fetchone()
        print("Base de datos actual:", resultado)

except mysql.connector.Error as error:
    print("❌ Error al conectar:", error)

finally:
    if 'conexion' in locals() and conexion.is_connected():
        cursor.close()
        conexion.close()
        print("🔌 Conexión cerrada")