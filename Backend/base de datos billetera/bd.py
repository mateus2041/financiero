import mysql.connector

try:
    conexion = mysql.connector.connect(
        host="localhost",
        user="root",
        password="TU_PASSWORD",
        database="billetera_db"
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