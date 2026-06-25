from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# =========================
# CONFIGURACIÓN MYSQL (DOCKER)
# =========================
USER = "root"
PASSWORD = "root"
HOST = "db"   # 👈 nombre del servicio en docker-compose
PORT = "3306"
DB = "billetera"

DATABASE_URL = "mysql+mysqlconnector://app_user:app_password@mysql-billetera:3306/billetera"


# =========================
# MOTOR DE CONEXIÓN
# =========================
engine = create_engine(
    DATABASE_URL,
    echo=True,
    pool_pre_ping=True
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
# DEPENDENCIA FASTAPI
# =========================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()