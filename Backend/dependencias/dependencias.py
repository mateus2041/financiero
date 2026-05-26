from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# =========================
# CONFIGURACIÓN MYSQL
# =========================
USER = "root"
PASSWORD = ""   # ← deja vacío si no tienes contraseña
HOST = "localhost"
PORT = "3306"
DB = "billetera_db"

DATABASE_URL = f"mysql+mysqlconnector://{USER}:{PASSWORD}@{HOST}:{PORT}/{DB}"

# =========================
# MOTOR DE CONEXIÓN
# =========================
engine = create_engine(
    DATABASE_URL,
    echo=True  # muestra consultas en consola (opcional)
)

# =========================
# SESIONES
# =========================
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# =========================
# BASE PARA MODELOS
# =========================
Base = declarative_base()

# =========================
# DEPENDENCIA PARA FASTAPI
# =========================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()