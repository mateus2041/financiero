import os

from flask import Flask
from flask_wtf.csrf import CSRFProtect
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy import text
from sqlalchemy.engine import URL

# Inicializamos SQLAlchemy
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)

    secret_key = os.environ.get("FLASK_SECRET_KEY")
    database_user = os.environ.get("DB_USER")
    database_password = os.environ.get("DB_PASSWORD")
    cors_origins = [
        origin.strip()
        for origin in os.environ.get("CORS_ORIGINS", "").split(",")
        if origin.strip()
    ]

    if not secret_key or len(secret_key) < 32:
        raise RuntimeError("FLASK_SECRET_KEY must contain at least 32 characters")
    if not database_user or not database_password:
        raise RuntimeError("DB_USER and DB_PASSWORD must be configured")
    if not cors_origins or "*" in cors_origins:
        raise RuntimeError("CORS_ORIGINS must contain explicit allowed origins")

    app.config["SECRET_KEY"] = secret_key
    app.config["SQLALCHEMY_DATABASE_URI"] = URL.create(
        "mysql+pymysql",
        username=database_user,
        password=database_password,
        host=os.environ.get("DB_HOST", "localhost"),
        port=int(os.environ.get("DB_PORT", "3306")),
        database=os.environ.get("DB_NAME", "billetera"),
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SESSION_COOKIE_HTTPONLY"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
    CSRFProtect(app)
    CORS(app, origins=cors_origins)

    # Inicializamos la base de datos con la app
    db.init_app(app)
    
    with app.app_context():
        # Importamos las rutas de la app
        from . import routes
        
        # Creamos las tablas de la base de datos si no existen
        db.create_all()
        
        # Verificación de conexión a MySQL
        try:
            db.session.execute(text("SELECT 1"))
            app.logger.info("MySQL connection established")
        finally:
            db.session.remove()
    
    return app