from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

# cargar variables del .env
load_dotenv()

# obtener URL completa (RECOMENDADO)
DATABASE_URL = os.getenv("DATABASE_URL")

# validar que exista
if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL no está definida en el .env")

# crear engine
engine = create_engine(
    DATABASE_URL,
    echo=True,
    pool_pre_ping=True
)

# sesión de base de datos
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# base para modelos
Base = declarative_base()