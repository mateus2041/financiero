from fastapi import FastAPI, Depends, HTTPException
from Backend.database.database import Base, engine
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text

from Backend.ai.router import router as ia_router
from Backend.models import Usuario
from Backend.dependencias import get_db

from Backend.security import (
    hash_password,
    check_password,
    generate_token,
    token_required
)


# =======================
# APP
# =======================

app = FastAPI(
    title="Financiero API",
    version="1.0"
)


# =======================
# CORS
# =======================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =======================
# IA ROUTER
# =======================

app.include_router(ia_router)


# =======================
# CREAR TABLAS
# =======================

@app.on_event("startup")
def startup():

    Base.metadata.create_all(
        bind=engine
    )

    columnas_usuario = {
        columna["name"]
        for columna in inspect(engine).get_columns("usuario")
    }

    with engine.begin() as conexion:
        if "tope_ahorros" not in columnas_usuario:
            conexion.execute(text(
                "ALTER TABLE usuario ADD COLUMN tope_ahorros DECIMAL(15, 2) NOT NULL DEFAULT 0"
            ))
        if "tope_corriente" not in columnas_usuario:
            conexion.execute(text(
                "ALTER TABLE usuario ADD COLUMN tope_corriente DECIMAL(15, 2) NOT NULL DEFAULT 0"
            ))


# =======================
# INICIO
# =======================

@app.get("/inicio")
def inicio():

    return {
        "message": "API funcionando correctamente"
    }


# =======================
# REGISTRO
# =======================

@app.post("/register")
def register(
    data: dict,
    db: Session = Depends(get_db)
):

    usuario_existente = db.query(Usuario).filter(
        Usuario.documento == data["documento"]
    ).first()

    if usuario_existente:

        raise HTTPException(
            status_code=409,
            detail="Usuario ya existe"
        )

    nuevo_usuario = Usuario(

        nombre=data["nombre"],

        email=data["email"],

        documento=data["documento"],

        password=hash_password(
            data["password"]
        ),

        telefono=data.get("telefono"),

        direccion=data.get("direccion")

    )

    db.add(nuevo_usuario)

    db.commit()

    db.refresh(nuevo_usuario)

    token = generate_token(
        nuevo_usuario.id_usuario
    )

    return {

        "message": "Usuario registrado correctamente",

        "token": token,

        "usuario": {

            "id": nuevo_usuario.id_usuario,

            "nombre": nuevo_usuario.nombre

        }

    }


# =======================
# LOGIN
# =======================

@app.post("/login")
def login(

    data: dict,

    db: Session = Depends(get_db)

):

    usuario = db.query(Usuario).filter(

        Usuario.documento == data["documento"]

    ).first()

    if not usuario:

        raise HTTPException(

            status_code=404,

            detail="Usuario no encontrado"

        )

    if not check_password(

        data["password"],

        usuario.password

    ):

        raise HTTPException(

            status_code=401,

            detail="Credenciales inválidas"

        )

    token = generate_token(

        usuario.id_usuario

    )

    return {

        "message": "Login exitoso",

        "token": token,

        "usuario": {

            "id": usuario.id_usuario,

            "nombre": usuario.nombre,

            "documento": usuario.documento

        }

    }


# =======================
# PERFIL
# =======================

@app.get("/perfil")
def perfil(

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    usuario = db.query(Usuario).filter(

        Usuario.id_usuario == current_user

    ).first()

    if not usuario:

        raise HTTPException(

            status_code=404,

            detail="Usuario no encontrado"

        )

    return {

        "id": usuario.id_usuario,

        "nombre": usuario.nombre,

        "email": usuario.email,

        "documento": usuario.documento,

        "telefono": usuario.telefono,

        "direccion": usuario.direccion,

        "tope_ahorros": usuario.tope_ahorros,

        "tope_corriente": usuario.tope_corriente

    }


# =======================
# USUARIO
# =======================
# Este endpoint es el que utiliza
# Ajustes.jsx

@app.get("/usuario")
def obtener_usuario(

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    usuario = db.query(Usuario).filter(

        Usuario.id_usuario == current_user

    ).first()

    if not usuario:

        raise HTTPException(

            status_code=404,

            detail="Usuario no encontrado"

        )

    return {

        "id": usuario.id_usuario,

        "nombre": usuario.nombre,

        "email": usuario.email,

        "documento": usuario.documento,

        "telefono": usuario.telefono,

        "direccion": usuario.direccion,

        "tope_ahorros": usuario.tope_ahorros,

        "tope_corriente": usuario.tope_corriente

    }


# =======================
# ACTUALIZAR PERFIL
# =======================

@app.put("/usuario/perfil")
def actualizar_perfil(

    data: dict,

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    usuario = db.query(Usuario).filter(

        Usuario.id_usuario == current_user

    ).first()

    if not usuario:

        raise HTTPException(

            status_code=404,

            detail="Usuario no encontrado"

        )

    # =======================
    # VERIFICAR CONTRASEÑA
    # =======================

    if "password" not in data or not data["password"]:

        raise HTTPException(

            status_code=400,

            detail="Debes ingresar tu contraseña"

        )

    if not check_password(

        data["password"],

        usuario.password

    ):

        raise HTTPException(

            status_code=401,

            detail="Contraseña incorrecta"

        )


    # =======================
    # ACTUALIZAR DATOS
    # =======================

    if "nombre" in data:

        usuario.nombre = data["nombre"]


    if "email" in data or "correo" in data:

        usuario.email = data["email"] if "email" in data else data["correo"]


    if "telefono" in data:

        usuario.telefono = data["telefono"]


    if "direccion" in data:

        usuario.direccion = data["direccion"]


    if "tope_ahorros" in data:

        usuario.tope_ahorros = data["tope_ahorros"]


    if "tope_corriente" in data:

        usuario.tope_corriente = data["tope_corriente"]


    db.commit()

    db.refresh(usuario)


    return {

        "message": "Perfil actualizado correctamente",

        "usuario": {

            "id": usuario.id_usuario,

            "nombre": usuario.nombre,

            "email": usuario.email,

            "documento": usuario.documento,

            "telefono": usuario.telefono,

            "direccion": usuario.direccion

        }

    }


# =======================
# VALIDAR TOKEN
# =======================

@app.get("/validar-token")
def validar_token(

    usuario: int = Depends(token_required)

):

    return {

        "mensaje": "Token válido",

        "usuario": usuario

    }


# =======================
# PRUEBA JWT
# =======================

@app.get("/probar-token")
def probar_token(

    usuario_id: int = Depends(token_required)

):

    return {

        "mensaje": "JWT funcionando correctamente",

        "usuario_id": usuario_id

    }


# =======================
# TEST DATABASE
# =======================

@app.get("/test-db")
def test_db(

    db: Session = Depends(get_db)

):

    db.execute(

        text("SELECT 1")

    )

    return {

        "message": "Base de datos funcionando"

    }