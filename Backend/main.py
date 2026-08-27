from fastapi import FastAPI, Depends, HTTPException
from decimal import Decimal
from Backend.database.database import Base, engine
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
from pydantic import BaseModel

from Backend.ai.router import router as ia_router
from Backend.models import Usuario, Cuenta, Transaccion, LlaveBreb
from Backend.dependencias import get_db

from Backend.security import (
    hash_password,
    check_password,
    generate_token,
    token_required
)


# ==========================================================
# APP
# ==========================================================

app = FastAPI(
    title="Financiero API",
    version="1.0"
)


# ==========================================================
# CORS
# ==========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================
# IA ROUTER
# ==========================================================

app.include_router(ia_router)


# ==========================================================
# CREAR TABLAS
# ==========================================================

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

        if "llave_bre_b" not in columnas_usuario:

            conexion.execute(text(
                "ALTER TABLE usuario "
                "ADD COLUMN llave_bre_b VARCHAR(100) UNIQUE NULL"
            ))


# ==========================================================
# UTILIDAD LLAVE BRE-B
# ==========================================================

def obtener_llave_bre_b_actual(db: Session, usuario_id: int):

    llave = db.query(LlaveBreb).filter(
        LlaveBreb.id_usuario == usuario_id,
        LlaveBreb.estado == "activa"
    ).order_by(LlaveBreb.id_llave.desc()).first()

    return llave.llave if llave else None


# ==========================================================
# INICIO
# ==========================================================

@app.get("/inicio")
def inicio():

    return {
        "message": "API funcionando correctamente"
    }


# ==========================================================
# REGISTRO
# ==========================================================

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
            estado="activa"
        ),

        Cuenta(
            id_usuario=nuevo_usuario.id_usuario,
            tipo_cuenta="corriente",
            saldo=0,
            estado="activa"
        )

    ])

    db.commit()

    token = generate_token(
        nuevo_usuario.id_usuario
    )

    return {

        "message":
        "Usuario registrado correctamente",

        "token":
        token,

        "usuario": {

            "id":
            nuevo_usuario.id_usuario,

            "nombre":
            nuevo_usuario.nombre

        }

    }


# ==========================================================
# LOGIN
# ==========================================================

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

        "message":
        "Login exitoso",

        "token":
        token,

        "usuario": {

            "id":
            usuario.id_usuario,

            "nombre":
            usuario.nombre,

            "documento":
            usuario.documento

        }

    }


# ==========================================================
# PERFIL
# ==========================================================

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

        "id":
        usuario.id_usuario,

        "nombre":
        usuario.nombre,

        "email":
        usuario.email,

        "documento":
        usuario.documento,

        "telefono":
        usuario.telefono,

        "direccion":
        usuario.direccion,

        "tope_ahorros":
        float(usuario.tope_ahorros or 0),

        "tope_corriente":
        float(usuario.tope_corriente or 0),

        "llave_bre_b":
        obtener_llave_bre_b_actual(db, current_user)

    }


# ==========================================================
# USUARIO
# ==========================================================

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

        "id":
        usuario.id_usuario,

        "nombre":
        usuario.nombre,

        "email":
        usuario.email,

        "documento":
        usuario.documento,

        "telefono":
        usuario.telefono,

        "direccion":
        usuario.direccion,

        "tope_ahorros":
        float(usuario.tope_ahorros or 0),

        "tope_corriente":
        float(usuario.tope_corriente or 0),

        "llave_bre_b":
        obtener_llave_bre_b_actual(db, current_user)

    }


# ==========================================================
# ACTUALIZAR PERFIL
# ==========================================================

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

    if "nombre" in data:

        usuario.nombre = data["nombre"]

    if "email" in data:

        usuario.email = data["email"]

    elif "correo" in data:

        usuario.email = data["correo"]

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

        "message":
        "Perfil actualizado correctamente",

        "usuario": {

            "id":
            usuario.id_usuario,

            "nombre":
            usuario.nombre,

            "email":
            usuario.email,

            "documento":
            usuario.documento,

            "telefono":
            usuario.telefono,

            "direccion":
            usuario.direccion

        }

    }


# ==========================================================
# VALIDAR TOKEN
# ==========================================================

@app.get("/validar-token")
def validar_token(

    usuario: int = Depends(token_required)

):

    return {

        "mensaje":
        "Token válido",

        "usuario":
        usuario

    }


# ==========================================================
# PRUEBA JWT
# ==========================================================

@app.get("/probar-token")
def probar_token(

    usuario_id: int = Depends(token_required)

):

    return {

        "mensaje":
        "JWT funcionando correctamente",

        "usuario_id":
        usuario_id

    }


# ==========================================================
# TEST DATABASE
# ==========================================================

@app.get("/test-db")
def test_db(

    db: Session = Depends(get_db)

):

    db.execute(
        text("SELECT 1")
    )

    return {
        "message":
        "Base de datos funcionando"
    }


# ==========================================================
# CUENTAS
# ==========================================================

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

    return {

        "existe":
        cuenta is not None

    }


# ==========================================================
# MIS CUENTAS
# ==========================================================

@app.get("/cuentas/mis-cuentas")
def mis_cuentas(

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    cuentas = db.query(Cuenta).filter(

        Cuenta.id_usuario == current_user,

        Cuenta.estado == "activa"

    ).order_by(

        Cuenta.id_cuenta

    ).all()

    return [

        {

            "id":
            cuenta.id_cuenta,

            "tipo":
            cuenta.tipo_cuenta,

            "saldo":
            float(cuenta.saldo or 0)

        }

        for cuenta in cuentas

    ]


# ==========================================================
# SALDOS
# ==========================================================

@app.get("/cuentas/saldos")
def saldos_cuentas(

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    cuentas = db.query(Cuenta).filter(

        Cuenta.id_usuario == current_user,

        Cuenta.estado == "activa"

    ).all()

    saldos = {

        "cuenta_corriente": 0,

        "cuenta_corriente_numero": None,

        "cuenta_ahorro": 0,

        "cuenta_ahorro_numero": None

    }

    for cuenta in cuentas:

        if cuenta.tipo_cuenta == "corriente":

            saldos["cuenta_corriente"] = float(
                cuenta.saldo or 0
            )

            saldos["cuenta_corriente_numero"] = cuenta.id_cuenta

        elif cuenta.tipo_cuenta == "ahorros":

            saldos["cuenta_ahorro"] = float(
                cuenta.saldo or 0
            )

            saldos["cuenta_ahorro_numero"] = cuenta.id_cuenta

    return saldos


# ==========================================================
# HISTORIAL DE TRANSACCIONES
# ==========================================================

@app.get("/transacciones")
def transacciones_usuario(

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    transacciones = db.query(Transaccion).join(
        Cuenta,
        Transaccion.id_cuenta == Cuenta.id_cuenta
    ).filter(
        Cuenta.id_usuario == current_user
    ).order_by(
        Transaccion.fecha.desc()
    ).all()

    return [
        {
            "id_transaccion": transaccion.id_transaccion,
            "id_cuenta": transaccion.id_cuenta,
            "monto": float(transaccion.monto or 0),
            "tipo": transaccion.tipo,
            "fecha": transaccion.fecha,
            "descripcion": transaccion.descripcion,
        }
        for transaccion in transacciones
    ]


# ==========================================================
# CUENTAS DESTINO
# ==========================================================

@app.get("/cuentas/destino")
def cuentas_destino(

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    cuentas = db.query(Cuenta).filter(

        Cuenta.estado == "activa",

        Cuenta.id_usuario != current_user

    ).order_by(

        Cuenta.id_cuenta

    ).all()

    return [

        {

            "id":
            cuenta.id_cuenta,

            "tipo":
            cuenta.tipo_cuenta

        }

        for cuenta in cuentas

    ]


# ==========================================================
# MODELO TRANSFERENCIA NORMAL
# ==========================================================

class Transferencia(BaseModel):

    origen: str

    destino: int

    monto: Decimal

    descripcion: str = ""


class TransferenciaEntreCuentas(BaseModel):

    origen: str

    destino: str

    monto: Decimal

    descripcion: str = ""


# ==========================================================
# CONVERTIR TIPO DE CUENTA
# ==========================================================

def tipo_cuenta(origen: str):

    valores = {

        "Cuenta de Ahorros":
        "ahorros",

        "Cuenta Corriente":
        "corriente",

        "ahorro":
        "ahorros",

        "ahorros":
        "ahorros",

        "corriente":
        "corriente"

    }

    return valores.get(origen)


# ==========================================================
# TRANSFERENCIA NORMAL
# ==========================================================

@app.post("/transferencias/entre-cuentas")
def transferir_entre_cuentas(

    data: TransferenciaEntreCuentas,

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    if data.monto <= Decimal("0"):

        raise HTTPException(
            status_code=400,
            detail="El monto debe ser mayor que cero."
        )

    tipos = {
        "corriente": "corriente",
        "ahorro": "ahorros"
    }

    tipo_origen = tipos.get(data.origen)
    tipo_destino = tipos.get(data.destino)

    if not tipo_origen or not tipo_destino or tipo_origen == tipo_destino:

        raise HTTPException(
            status_code=400,
            detail="Las cuentas de origen y destino deben ser diferentes."
        )

    try:

        cuentas = db.query(Cuenta).filter(
            Cuenta.id_usuario == current_user,
            Cuenta.estado == "activa",
            Cuenta.tipo_cuenta.in_([tipo_origen, tipo_destino])
        ).with_for_update().all()

        cuenta_origen = next(
            (cuenta for cuenta in cuentas if cuenta.tipo_cuenta == tipo_origen),
            None
        )
        cuenta_destino = next(
            (cuenta for cuenta in cuentas if cuenta.tipo_cuenta == tipo_destino),
            None
        )

        if not cuenta_origen or not cuenta_destino:

            raise HTTPException(
                status_code=404,
                detail="No se encontraron ambas cuentas activas."
            )

        saldo_origen = Decimal(str(cuenta_origen.saldo or 0))

        if saldo_origen < data.monto:

            raise HTTPException(
                status_code=400,
                detail="Saldo insuficiente."
            )

        cuenta_origen.saldo = saldo_origen - data.monto
        cuenta_destino.saldo = Decimal(str(cuenta_destino.saldo or 0)) + data.monto

        db.add_all([
            Transaccion(
                id_cuenta=cuenta_origen.id_cuenta,
                monto=data.monto,
                tipo="Transferencia",
                descripcion=data.descripcion or "Transferencia entre cuentas"
            ),
            Transaccion(
                id_cuenta=cuenta_destino.id_cuenta,
                monto=data.monto,
                tipo="Ingreso",
                descripcion=data.descripcion or "Ingreso por transferencia"
            )
        ])

        db.commit()

        return {
            "mensaje": "Transferencia realizada correctamente.",
            "saldo_origen": float(cuenta_origen.saldo),
            "saldo_destino": float(cuenta_destino.saldo)
        }

    except HTTPException:

        db.rollback()

        raise

    except Exception as error:

        db.rollback()

        print("ERROR TRANSFERENCIA ENTRE CUENTAS:", error)

        raise HTTPException(
            status_code=500,
            detail="Error interno al realizar la transferencia."
        )

@app.post("/transferencias")
def realizar_transferencia(

    data: Transferencia,

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    try:

        if data.monto <= Decimal("0"):

            raise HTTPException(
                status_code=400,
                detail="El monto debe ser mayor que cero."
            )

        cuenta_origen_tipo = tipo_cuenta(
            data.origen
        )

        if not cuenta_origen_tipo:

            raise HTTPException(
                status_code=400,
                detail="Cuenta de origen no válida."
            )

        cuenta_origen = db.query(Cuenta).filter(

            Cuenta.id_usuario == current_user,

            Cuenta.tipo_cuenta ==
            cuenta_origen_tipo,

            Cuenta.estado == "activa"

        ).with_for_update().first()

        if not cuenta_origen:

            raise HTTPException(
                status_code=404,
                detail="La cuenta de origen no existe."
            )

        cuenta_destino = db.query(Cuenta).filter(

            Cuenta.id_cuenta == data.destino,

            Cuenta.estado == "activa"

        ).with_for_update().first()

        if not cuenta_destino:

            raise HTTPException(
                status_code=404,
                detail="La cuenta destino no existe."
            )

        if cuenta_destino.id_usuario == current_user:

            raise HTTPException(
                status_code=400,
                detail="La cuenta destino pertenece al mismo usuario."
            )

        saldo_origen = Decimal(
            str(cuenta_origen.saldo or 0)
        )

        if saldo_origen < data.monto:

            raise HTTPException(
                status_code=400,
                detail="Saldo insuficiente."
            )

        cuenta_origen.saldo = (
            saldo_origen -
            data.monto
        )

        saldo_destino = Decimal(
            str(cuenta_destino.saldo or 0)
        )

        cuenta_destino.saldo = (
            saldo_destino +
            data.monto
        )

        transaccion_salida = Transaccion(

            id_cuenta=
            cuenta_origen.id_cuenta,

            monto=
            data.monto,

            tipo=
            "Transferencia",

            descripcion=
            data.descripcion or
            "Transferencia"

        )

        transaccion_entrada = Transaccion(

            id_cuenta=
            cuenta_destino.id_cuenta,

            monto=
            data.monto,

            tipo=
            "Ingreso",

            descripcion=
            data.descripcion or
            "Ingreso por transferencia"

        )

        db.add(transaccion_salida)

        db.add(transaccion_entrada)

        db.commit()

        db.refresh(cuenta_origen)

        db.refresh(cuenta_destino)

        return {

            "mensaje":
            "Transferencia realizada correctamente.",

            "monto":
            float(data.monto),

            "saldo_origen":
            float(cuenta_origen.saldo),

            "saldo_destino":
            float(cuenta_destino.saldo)

        }

    except HTTPException:

        db.rollback()

        raise

    except Exception as error:

        db.rollback()

        print(
            "ERROR TRANSFERENCIA:",
            error
        )

        raise HTTPException(

            status_code=500,

            detail=
            "Error interno al realizar la transferencia."

        )


# ==========================================================
# REPORTAR TRANSACCIÓN FALLIDA
# ==========================================================

@app.post("/reportes/transaccion-fallida")
def reportar_transaccion_fallida(

    data: dict,

    current_user: int = Depends(token_required)

):

    print(

        "Transacción fallida reportada",

        {

            "usuario":
            current_user,

            **data

        }

    )

    return {

        "mensaje":
        "Reporte registrado correctamente."

    }


# ==========================================================
#                    BRE-B
# ==========================================================

class TransferenciaBreB(BaseModel):

    origen: str

    llave_destino: str

    monto: Decimal

    descripcion: str = ""


# ==========================================================
# REGISTRAR LLAVE BRE-B
# ==========================================================

@app.put("/bre-b/llave")
def registrar_llave_bre_b(

    data: dict,

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    llave = (data or {}).get("llave")

    if not llave:

        raise HTTPException(

            status_code=400,

            detail=
            "Debe ingresar una llave Bre-B."

        )

    llave = llave.strip()

    if len(llave) < 4:

        raise HTTPException(

            status_code=400,

            detail=
            "La llave Bre-B no es válida."

        )

    usuario = db.query(
        Usuario
    ).filter(

        Usuario.id_usuario ==
        current_user

    ).first()

    if not usuario:

        raise HTTPException(

            status_code=404,

            detail=
            "Usuario no encontrado."

        )

    llave_existente = db.query(LlaveBreb).filter(
        LlaveBreb.llave == llave,
        LlaveBreb.estado == "activa"
    ).first()

    if llave_existente and llave_existente.id_usuario != current_user:

        raise HTTPException(

            status_code=409,

            detail=
            "Esta llave Bre-B ya está registrada."

        )

    cuenta_usuario = db.query(Cuenta).filter(
        Cuenta.id_usuario == current_user,
        Cuenta.estado == "activa"
    ).order_by(Cuenta.id_cuenta).first()

    if not cuenta_usuario:

        raise HTTPException(

            status_code=404,

            detail=
            "Debe tener al menos una cuenta activa para registrar una llave Bre-B."

        )

    llave_actual = db.query(LlaveBreb).filter(
        LlaveBreb.id_usuario == current_user,
        LlaveBreb.estado == "activa"
    ).order_by(LlaveBreb.id_llave.desc()).first()

    if llave_actual:

        llave_actual.llave = llave
        llave_actual.id_cuenta = cuenta_usuario.id_cuenta
        llave_actual.tipo_llave = "alfanumerica"
        db.commit()
        db.refresh(llave_actual)

        return {

            "mensaje":
            "Llave Bre-B registrada correctamente.",

            "llave":
            llave_actual.llave

        }

    nueva_llave = LlaveBreb(
        id_usuario=current_user,
        id_cuenta=cuenta_usuario.id_cuenta,
        tipo_llave="alfanumerica",
        llave=llave,
        estado="activa"
    )

    db.add(nueva_llave)
    db.commit()
    db.refresh(nueva_llave)

    return {

        "mensaje":
        "Llave Bre-B registrada correctamente.",

        "llave":
        nueva_llave.llave

    }


# ==========================================================
# CONSULTAR LLAVE BRE-B
# ==========================================================

@app.get("/bre-b/consultar/{llave}")
def consultar_llave_bre_b(

    llave: str,

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    llave = llave.strip()

    llave_breb = db.query(LlaveBreb).filter(
        LlaveBreb.llave == llave,
        LlaveBreb.estado == "activa"
    ).first()

    if not llave_breb:

        raise HTTPException(

            status_code=404,

            detail=
            "No se encontró un usuario asociado a esta llave Bre-B."

        )

    usuario = db.query(Usuario).filter(
        Usuario.id_usuario == llave_breb.id_usuario
    ).first()

    if not usuario:

        raise HTTPException(

            status_code=404,

            detail=
            "No se encontró un usuario asociado a esta llave Bre-B."

        )

    if usuario.id_usuario == current_user:

        raise HTTPException(

            status_code=400,

            detail=
            "Esta llave pertenece a su propio usuario."

        )

    cuenta = db.query(Cuenta).filter(
        Cuenta.id_cuenta == llave_breb.id_cuenta
    ).first()

    return {

        "nombre":
        usuario.nombre,

        "documento":
        usuario.documento,

        "llave":
        llave_breb.llave,

        "tipo_llave":
        llave_breb.tipo_llave,

        "id_cuenta":
        llave_breb.id_cuenta,

        "tipo_cuenta":
        cuenta.tipo_cuenta if cuenta else None

    }


# ==========================================================
# TRANSFERENCIA BRE-B
# ==========================================================

@app.post("/transferencias/bre-b")
def transferencia_bre_b(

    data: TransferenciaBreB,

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    try:

        # ==================================================
        # VALIDAR MONTO
        # ==================================================

        if data.monto <= Decimal("0"):

            raise HTTPException(

                status_code=400,

                detail=
                "El monto debe ser mayor que cero."

            )


        # ==================================================
        # VALIDAR LLAVE
        # ==================================================

        llave = data.llave_destino.strip()

        if not llave:

            raise HTTPException(

                status_code=400,

                detail=
                "Debe ingresar una llave Bre-B."

            )


        # ==================================================
        # VALIDAR ORIGEN
        # ==================================================

        if data.origen not in [

            "corriente",

            "ahorro",

            "ahorros"

        ]:

            raise HTTPException(

                status_code=400,

                detail=
                "Cuenta de origen no válida."

            )

        tipo_origen = (

            "ahorros"

            if data.origen in [
                "ahorro",
                "ahorros"
            ]

            else

            "corriente"

        )


        # ==================================================
        # BUSCAR DESTINATARIO
        # ==================================================

        llave_breb = db.query(LlaveBreb).filter(
            LlaveBreb.llave == llave,
            LlaveBreb.estado == "activa"
        ).first()

        if not llave_breb:

            raise HTTPException(

                status_code=404,

                detail=
                "No se encontró el destinatario."

            )

        destinatario = db.query(Usuario).filter(
            Usuario.id_usuario == llave_breb.id_usuario
        ).first()

        if not destinatario:

            raise HTTPException(

                status_code=404,

                detail=
                "No se encontró el destinatario."

            )


        # ==================================================
        # EVITAR AUTO TRANSFERENCIA
        # ==================================================

        if (

            destinatario.id_usuario ==
            current_user

        ):

            raise HTTPException(

                status_code=400,

                detail=
                "No puede realizar una transferencia a usted mismo."

            )


        # ==================================================
        # BUSCAR CUENTA ORIGEN
        # ==================================================

        cuenta_origen = db.query(
            Cuenta
        ).filter(

            Cuenta.id_usuario ==
            current_user,

            Cuenta.tipo_cuenta ==
            tipo_origen,

            Cuenta.estado ==
            "activa"

        ).with_for_update().first()

        if not cuenta_origen:

            raise HTTPException(

                status_code=404,

                detail=
                "La cuenta de origen no existe."

            )


        # ==================================================
        # BUSCAR CUENTA DESTINO
        # ==================================================
        #
        # Para nuestra simulación Bre-B vamos a recibir
        # el dinero en la CUENTA DE AHORROS del destinatario.
        #
        # ==================================================

        cuenta_destino = db.query(
            Cuenta
        ).filter(

            Cuenta.id_usuario ==
            destinatario.id_usuario,

            Cuenta.tipo_cuenta ==
            "ahorros",

            Cuenta.estado ==
            "activa"

        ).with_for_update().first()


        # ==================================================
        # SI NO TIENE AHORROS, BUSCAR CORRIENTE
        # ==================================================

        if not cuenta_destino:

            cuenta_destino = db.query(
                Cuenta
            ).filter(

                Cuenta.id_usuario ==
                destinatario.id_usuario,

                Cuenta.tipo_cuenta ==
                "corriente",

                Cuenta.estado ==
                "activa"

            ).with_for_update().first()


        if not cuenta_destino:

            raise HTTPException(

                status_code=404,

                detail=
                "El destinatario no tiene una cuenta activa."

            )


        # ==================================================
        # VALIDAR SALDO
        # ==================================================

        saldo_origen = Decimal(

            str(
                cuenta_origen.saldo or 0
            )

        )

        if saldo_origen < data.monto:

            raise HTTPException(

                status_code=400,

                detail=(

                    "Saldo insuficiente. "

                    f"Saldo disponible: "
                    f"${saldo_origen:,.0f}"

                )

            )


        # ==================================================
        # VALIDAR TOPE DE LA CUENTA ORIGEN
        # ==================================================

        usuario_origen = db.query(
            Usuario
        ).filter(

            Usuario.id_usuario ==
            current_user

        ).first()

        if not usuario_origen:

            raise HTTPException(

                status_code=404,

                detail=
                "Usuario de origen no encontrado."

            )


        if tipo_origen == "ahorros":

            tope = Decimal(

                str(
                    usuario_origen.tope_ahorros or 0
                )

            )

        else:

            tope = Decimal(

                str(
                    usuario_origen.tope_corriente or 0
                )

            )


        # ==================================================
        # VALIDAR TOPE
        # ==================================================

        if tope > 0 and data.monto > tope:

            raise HTTPException(

                status_code=400,

                detail=(

                    "El monto supera el tope "
                    "permitido para esta cuenta."

                )

            )


        # ==================================================
        # DESCONTAR ORIGEN
        # ==================================================

        cuenta_origen.saldo = (

            saldo_origen -
            data.monto

        )


        # ==================================================
        # SUMAR DESTINO
        # ==================================================

        saldo_destino = Decimal(

            str(
                cuenta_destino.saldo or 0
            )

        )

        cuenta_destino.saldo = (

            saldo_destino +
            data.monto

        )


        # ==================================================
        # TRANSACCIÓN SALIDA
        # ==================================================

        transaccion_salida = Transaccion(

            id_cuenta=
            cuenta_origen.id_cuenta,

            monto=
            data.monto,

            tipo=
            "Transferencia",

            descripcion=
            data.descripcion or
            "Transferencia Bre-B enviada"

        )


        # ==================================================
        # TRANSACCIÓN ENTRADA
        # ==================================================

        transaccion_entrada = Transaccion(

            id_cuenta=
            cuenta_destino.id_cuenta,

            monto=
            data.monto,

            tipo=
            "Ingreso",

            descripcion=
            data.descripcion or
            "Transferencia Bre-B recibida"

        )


        db.add(
            transaccion_salida
        )

        db.add(
            transaccion_entrada
        )


        # ==================================================
        # GUARDAR TODO
        # ==================================================

        db.commit()

        db.refresh(
            cuenta_origen
        )

        db.refresh(
            cuenta_destino
        )


        # ==================================================
        # RESPUESTA
        # ==================================================

        return {

            "mensaje":
            "Transferencia Bre-B realizada correctamente.",

            "destinatario":
            destinatario.nombre,

            "llave_destino":
            llave,

            "monto":
            float(data.monto),

            "descripcion":
            data.descripcion,

            "cuenta_origen":
            cuenta_origen.tipo_cuenta,

            "cuenta_destino":
            cuenta_destino.tipo_cuenta,

            "saldo_restante":
            float(
                cuenta_origen.saldo
            )

        }


    except HTTPException:

        db.rollback()

        raise


    except Exception as error:

        db.rollback()

        print(
            "ERROR BRE-B:",
            error
        )

        raise HTTPException(

            status_code=500,

            detail=
            "Error interno al realizar la transferencia Bre-B."

        )