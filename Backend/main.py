from fastapi import FastAPI, Depends, HTTPException
from decimal import Decimal
from Backend.database.database import Base, engine
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
from pydantic import BaseModel

from Backend.ai.router import router as ia_router
from Backend.models import Usuario, Cuenta, Transaccion
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
                "ALTER TABLE usuario "
                "ADD COLUMN tope_ahorros DECIMAL(15, 2) "
                "NOT NULL DEFAULT 0"
            ))

        if "tope_corriente" not in columnas_usuario:

            conexion.execute(text(
                "ALTER TABLE usuario "
                "ADD COLUMN tope_corriente DECIMAL(15, 2) "
                "NOT NULL DEFAULT 0"
            ))

        # =======================
        # LLAVE BRE-B
        # =======================

        if "llave_bre_b" not in columnas_usuario:

            conexion.execute(text(
                "ALTER TABLE usuario "
                "ADD COLUMN llave_bre_b VARCHAR(100) UNIQUE NULL"
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

    db.add_all([
        Cuenta(
            id_usuario=nuevo_usuario.id_usuario,
            tipo_cuenta="ahorros",
            saldo=0,
            estado="activa",
        ),
        Cuenta(
            id_usuario=nuevo_usuario.id_usuario,
            tipo_cuenta="corriente",
            saldo=0,
            estado="activa",
        ),
    ])

    db.commit()

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

        usuario.email = (
            data["email"]
            if "email" in data
            else data["correo"]
        )


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


# ==========================================================
#                  TRANSFERENCIAS
# ==========================================================

class Transferencia(BaseModel):

    origen: str
    destino: int
    monto: Decimal
    descripcion: str = ""


def tipo_cuenta(origen: str):

    valores = {
        "Cuenta de Ahorros": "ahorros",
        "Cuenta Corriente": "corriente",
        "ahorro": "ahorros",
        "ahorros": "ahorros",
        "corriente": "corriente",
    }

    return valores.get(origen)


@app.get("/cuentas/existe/{id_cuenta}")
def cuenta_existe(

    id_cuenta: int,

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    cuenta = db.query(Cuenta).filter(
        Cuenta.id_cuenta == id_cuenta,
        Cuenta.estado == "activa"
    ).first()

    return {"existe": cuenta is not None}


@app.get("/cuentas/mis-cuentas")
def mis_cuentas(

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    cuentas = db.query(Cuenta).filter(
        Cuenta.id_usuario == current_user,
        Cuenta.estado == "activa"
    ).all()

    return [
        {
            "id": cuenta.id_cuenta,
            "tipo": cuenta.tipo_cuenta,
            "saldo": float(cuenta.saldo or 0),
        }
        for cuenta in cuentas
    ]


@app.get("/cuentas/destino")
def cuentas_destino(

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    cuentas = db.query(Cuenta).filter(
        Cuenta.estado == "activa"
    ).order_by(Cuenta.id_cuenta).all()

    return [
        {
            "id": cuenta.id_cuenta,
            "tipo": cuenta.tipo_cuenta,
        }
        for cuenta in cuentas
    ]


@app.post("/transferencias")
def realizar_transferencia(

    data: Transferencia,

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    cuenta_origen_tipo = tipo_cuenta(data.origen)

    if not cuenta_origen_tipo:
        raise HTTPException(status_code=400, detail="Cuenta de origen no válida.")

    if data.monto <= Decimal("0"):
        raise HTTPException(status_code=400, detail="El monto debe ser mayor que cero.")

    monto = data.monto

    cuenta_origen = db.query(Cuenta).filter(
        Cuenta.id_usuario == current_user,
        Cuenta.tipo_cuenta == cuenta_origen_tipo,
        Cuenta.estado == "activa"
    ).with_for_update().first()

    if not cuenta_origen:
        raise HTTPException(status_code=404, detail="La cuenta de origen no existe.")

    cuenta_destino = db.query(Cuenta).filter(
        Cuenta.id_cuenta == data.destino,
        Cuenta.estado == "activa"
    ).with_for_update().first()

    if not cuenta_destino:
        raise HTTPException(status_code=404, detail="La cuenta destino no existe.")

    if cuenta_origen.id_cuenta == cuenta_destino.id_cuenta:
        raise HTTPException(status_code=400, detail="No puede transferir a la misma cuenta.")

    if Decimal(str(cuenta_origen.saldo or 0)) < monto:
        raise HTTPException(status_code=400, detail="Saldo insuficiente.")

    cuenta_origen.saldo -= monto
    cuenta_destino.saldo += monto

    db.add_all([
        Transaccion(
            id_cuenta=cuenta_origen.id_cuenta,
            monto=monto,
            tipo="Transferencia",
            descripcion=data.descripcion or "Transferencia enviada",
        ),
        Transaccion(
            id_cuenta=cuenta_destino.id_cuenta,
            monto=monto,
            tipo="Ingreso",
            descripcion=data.descripcion or "Transferencia recibida",
        ),
    ])

    db.commit()

    return {"mensaje": "Transferencia realizada correctamente."}


@app.post("/reportes/transaccion-fallida")
def reportar_transaccion_fallida(

    data: dict,

    current_user: int = Depends(token_required),

):

    print(
        "Transacción fallida reportada",
        {"usuario": current_user, **data}
    )

    return {"mensaje": "Reporte registrado correctamente."}


# ==========================================================
#                  BRE-B
# ==========================================================


# =======================
# MODELO TRANSFERENCIA
# =======================

class TransferenciaBreB(BaseModel):

    origen: str

    llave_destino: str

    monto: float

    descripcion: str = ""


# =======================
# REGISTRAR LLAVE BRE-B
# =======================

@app.put("/bre-b/llave")
def registrar_llave_bre_b(

    data: dict,

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    llave = data.get("llave")

    if not llave:

        raise HTTPException(

            status_code=400,

            detail="Debe ingresar una llave Bre-B."

        )


    if len(llave) < 4:

        raise HTTPException(

            status_code=400,

            detail="La llave Bre-B no es válida."

        )


    # Verificar si la llave ya existe

    usuario_llave = db.query(Usuario).filter(

        Usuario.llave_bre_b == llave

    ).first()


    if usuario_llave and usuario_llave.id_usuario != current_user:

        raise HTTPException(

            status_code=409,

            detail="Esta llave Bre-B ya está registrada."

        )


    usuario = db.query(Usuario).filter(

        Usuario.id_usuario == current_user

    ).first()


    if not usuario:

        raise HTTPException(

            status_code=404,

            detail="Usuario no encontrado."

        )


    usuario.llave_bre_b = llave

    db.commit()

    db.refresh(usuario)


    return {

        "mensaje": "Llave Bre-B registrada correctamente.",

        "llave": usuario.llave_bre_b

    }


# =======================
# CONSULTAR LLAVE BRE-B
# =======================

@app.get("/bre-b/consultar/{llave}")
def consultar_llave_bre_b(

    llave: str,

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    usuario = db.query(Usuario).filter(

        Usuario.llave_bre_b == llave

    ).first()


    if not usuario:

        raise HTTPException(

            status_code=404,

            detail="No se encontró un usuario asociado a esta llave Bre-B."

        )


    if usuario.id_usuario == current_user:

        raise HTTPException(

            status_code=400,

            detail="Esta llave pertenece a su propio usuario."

        )


    return {

        "nombre": usuario.nombre,

        "documento": usuario.documento,

        "llave": usuario.llave_bre_b

    }


# =======================
# TRANSFERENCIA BRE-B
# =======================

@app.post("/transferencias/bre-b")
def transferencia_bre_b(

    data: TransferenciaBreB,

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    # =======================
    # VALIDAR MONTO
    # =======================

    if data.monto <= 0:

        raise HTTPException(

            status_code=400,

            detail="El monto debe ser mayor a cero."

        )


    # =======================
    # VALIDAR ORIGEN
    # =======================

    if data.origen not in [

        "corriente",

        "ahorro"

    ]:

        raise HTTPException(

            status_code=400,

            detail="Cuenta de origen no válida."

        )


    # =======================
    # BUSCAR DESTINATARIO
    # =======================

    destinatario = db.query(Usuario).filter(

        Usuario.llave_bre_b == data.llave_destino

    ).first()


    if not destinatario:

        raise HTTPException(

            status_code=404,

            detail="No se encontró el destinatario."

        )


    # =======================
    # EVITAR AUTO TRANSFERENCIA
    # =======================

    if destinatario.id_usuario == current_user:

        raise HTTPException(

            status_code=400,

            detail="No puede realizar una transferencia a usted mismo."

        )


    # ==================================================
    # IMPORTANTE
    # ==================================================
    #
    # Aquí debemos modificar el saldo real de las cuentas.
    #
    # Como tu modelo Cuenta todavía no está incluido
    # en el main.py que me enviaste, no voy a inventar
    # nombres de columnas.
    #
    # Por ahora verificamos que el destinatario existe.
    #


    return {

        "mensaje": "Transferencia Bre-B preparada correctamente.",

        "destinatario": destinatario.nombre,

        "llave_destino": data.llave_destino,

        "monto": data.monto,

        "descripcion": data.descripcion

    }