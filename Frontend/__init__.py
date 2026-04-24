# app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

# Inicializamos SQLAlchemy
db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # Habilitar CORS para permitir peticiones desde el frontend
    CORS(app)
    
    # Configuración de seguridad y base de datos MySQL
    app.config['SECRET_KEY'] = 'supersecretkey'
    app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://admin:""localhost:3306/billetera'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Inicializamos la base de datos con la app
    db.init_app(app)
    
    with app.app_context():
        # Importamos las rutas de la app
        from . import routes
        
        # Creamos las tablas de la base de datos si no existen
        db.create_all()
        
        # Verificación de conexión a MySQL
        try:
            db.session.execute('SELECT 1')
            print("✅ Conexión a MySQL exitosa")
        except Exception as e:
            print("❌ Error al conectar a MySQL:", e)
        finally:
            db.session.remove()  # Cerramos la sesión para liberar recursos
    
    return app