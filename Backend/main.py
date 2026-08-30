from fastapi import FastAPI, Depends, HTTPException
from decimal import Decimal
import secrets
import os
import hmac
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import json

from Backend.database.database import Base, engine
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import inspect, text
from pydantic import BaseModel


class SaldoCuenta(BaseModel):
    saldo: float


class UltimosDigitosCuenta(BaseModel):
    ultimos_digitos: str


class TipoOperacionCuenta(BaseModel):
    tipo_operacion: str

from Backend.ai.router import router as ia_router
from Backend.models import Usuario, Cuenta, Transaccion, LlaveBreb, Notificacion
from Backend.dependencias import get_db
from Backend.email_service.email_service import enviar_correo

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

    columnas_cuentas = {
        columna["name"]
        for columna in inspect(engine).get_columns("cuentas")
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

        if "rol" not in columnas_usuario:

            conexion.execute(text(
                "ALTER TABLE usuario "
                "ADD COLUMN rol VARCHAR(20) NOT NULL DEFAULT 'usuario'"
            ))

        if "codigo_registro" not in columnas_usuario:

            conexion.execute(text(
                "ALTER TABLE usuario "
                "ADD COLUMN codigo_registro VARCHAR(6) UNIQUE NULL"
            ))

        if "numero_cuenta" not in columnas_cuentas:

            conexion.execute(text(
                "ALTER TABLE cuentas "
                "ADD COLUMN numero_cuenta VARCHAR(16) UNIQUE NULL"
            ))

        if "tipo_operacion" not in columnas_cuentas:

            conexion.execute(text(
                "ALTER TABLE cuentas "
                "ADD COLUMN tipo_operacion ENUM('debito', 'credito') "
                "NOT NULL DEFAULT 'debito'"
            ))

        cuentas_sin_numero = conexion.execute(text(
            "SELECT id_cuenta FROM cuentas WHERE numero_cuenta IS NULL OR numero_cuenta = ''"
        )).fetchall()

        for (id_cuenta,) in cuentas_sin_numero:
            numero = generar_numero_cuenta()
            while conexion.execute(
                text("SELECT 1 FROM cuentas WHERE numero_cuenta = :numero LIMIT 1"),
                {"numero": numero}
            ).first() is not None:
                numero = generar_numero_cuenta()

            conexion.execute(
                text("UPDATE cuentas SET numero_cuenta = :numero WHERE id_cuenta = :id_cuenta"),
                {"numero": numero, "id_cuenta": id_cuenta}
            )


# ==========================================================
# UTILIDAD LLAVE BRE-B
# ==========================================================

def obtener_llave_bre_b_actual(
    db: Session,
    usuario_id: int
):

    llave = db.query(LlaveBreb).filter(
        LlaveBreb.id_usuario == usuario_id,
        LlaveBreb.estado == "activa"
    ).order_by(
        LlaveBreb.id_llave.desc()
    ).first()

    return llave.llave if llave else None


# ==========================================================
# VALIDAR ASESOR BANCARIO
# ==========================================================

def asesor_requerido(
    current_user: int = Depends(token_required),
    db: Session = Depends(get_db)
):

    asesor = db.query(Usuario).filter(
        Usuario.id_usuario == current_user
    ).first()

    if not asesor:

        raise HTTPException(
            status_code=404,
            detail="Asesor no encontrado."
        )

    if asesor.rol != "asesor":

        raise HTTPException(
            status_code=403,
            detail="No tienes permisos de asesor bancario."
        )

    return asesor


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

def ubicacion_real(
    direccion: str,
    localidad: str,
    barrio: str,
    codigo: str
) -> bool:

    if not codigo.isdigit() or len(codigo) != 6:
        return False

    parametros = urlencode({
        "street": direccion,
        "neighbourhood": barrio,
        "city": localidad,
        "country": "Colombia",
        "postalcode": codigo,
        "format": "jsonv2",
        "limit": 1,
    })

    solicitud = Request(
        f"https://nominatim.openstreetmap.org/search?{parametros}",
        headers={
            "User-Agent": "Financiero/1.0"
        }
    )

    try:

        with urlopen(
            solicitud,
            timeout=5
        ) as respuesta:

            resultados = json.loads(
                respuesta.read().decode("utf-8")
            )

        return bool(resultados)

    except Exception:

        return False


@app.post("/register")
def register(
    data: dict,
    db: Session = Depends(get_db)
):
    return registrar_usuario(data, db, "usuario")


@app.post("/register-asesor")
def register_asesor(
    data: dict,
    db: Session = Depends(get_db)
):
    codigo_autorizacion = os.getenv("ASESOR_REGISTRATION_CODE")
    codigo_recibido = str(data.get("codigo_autorizacion", ""))

    if not codigo_autorizacion:
        raise HTTPException(
            status_code=503,
            detail="El registro de asesores no está configurado"
        )

    if not hmac.compare_digest(codigo_recibido, codigo_autorizacion):
        raise HTTPException(
            status_code=403,
            detail="Código de autorización de asesor inválido"
        )

    return registrar_usuario(data, db, "asesor")


def registrar_usuario(
    data: dict,
    db: Session,
    rol: str
):

    usuario_existente = db.query(Usuario).filter(
        Usuario.documento == data["documento"]
    ).first()

    if usuario_existente:

        raise HTTPException(
            status_code=409,
            detail="Usuario ya existe"
        )

    codigo_correspondencia = str(
        data.get(
            "codigo_correspondencia",
            ""
        )
    ).strip()

    if not ubicacion_real(
        data.get("direccion", "").strip(),
        data.get("localidad", "").strip(),
        data.get("barrio", "").strip(),
        codigo_correspondencia,
    ):

        raise HTTPException(
            status_code=400,
            detail="El código de correspondencia no coincide con una ubicación real"
        )

    codigo_registro = generar_codigo_registro(db)

    nuevo_usuario = Usuario(

        nombre=data["nombre"],

        email=data["email"],

        documento=data["documento"],

        password=hash_password(
            data["password"]
        ),

        telefono=data.get("telefono"),

        direccion=data.get("direccion"),

        rol=rol,

        codigo_registro=codigo_registro

    )

    db.add(nuevo_usuario)

    db.commit()

    db.refresh(nuevo_usuario)

    numeros_usados: set[str] = set()

    db.add_all([

        Cuenta(
            id_usuario=nuevo_usuario.id_usuario,
            numero_cuenta=generar_numero_cuenta(db, numeros_usados),
            tipo_cuenta="ahorros",
            saldo=0,
            estado="inactiva"
        ),

        Cuenta(
            id_usuario=nuevo_usuario.id_usuario,
            numero_cuenta=generar_numero_cuenta(db, numeros_usados),
            tipo_cuenta="corriente",
            saldo=0,
            estado="inactiva"
        )

    ])

    db.commit()

    asunto = "Cuenta creada - Financiero"
    mensaje = (
        f"<h3>Hola {nuevo_usuario.nombre},</h3>"
        "<p>Tu cuenta en Financiero ha sido creada correctamente.</p>"
        "<p>Tu solicitud queda pendiente de aprobación por el asesor bancario.</p>"
        "<p>Cuando tu cuenta quede activa, podrás iniciar sesión con tus credenciales.</p>"
    )

    if nuevo_usuario.email:
        enviar_correo(nuevo_usuario.email, asunto, mensaje)

    db.add(
        Notificacion(
            id_usuario=nuevo_usuario.id_usuario,
            mensaje="Tu cuenta ha sido creada correctamente y queda pendiente de aprobación.",
            leido=False,
        )
    )
    db.commit()

    return {

        "message":
        "Registro enviado correctamente. Tu solicitud queda pendiente de aprobación por el asesor bancario.",

        "codigo_registro":
        codigo_registro,

        "usuario": {

            "id":
            nuevo_usuario.id_usuario,

            "nombre":
            nuevo_usuario.nombre,

            "rol":
            nuevo_usuario.rol

        }

    }


def generar_codigo_registro(db: Session) -> str:

    while True:

        codigo = f"{secrets.randbelow(1000000):06d}"

        existe = db.query(Usuario.id_usuario).filter(
            Usuario.codigo_registro == codigo
        ).first()

        if not existe:
            return codigo


def generar_codigo_verificacion() -> str:
    return f"{secrets.randbelow(10000):04d}"


def generar_numero_cuenta(
    db: Session | None = None,
    usados: set[str] | None = None
) -> str:

    usados = usados if usados is not None else set()

    while True:

        numero = "".join(str(secrets.randbelow(10)) for _ in range(16))

        if numero in usados:
            continue

        if db is not None:
            existe = db.query(Cuenta.id_cuenta).filter(
                Cuenta.numero_cuenta == numero
            ).first()

            if existe:
                continue

        usados.add(numero)
        return numero


def formatear_numero_cuenta(numero_actual: str | None, ultimos_digitos: str) -> str:
    numero_base = str(numero_actual or "").strip()
    ultimos = str(ultimos_digitos or "").strip()

    if len(numero_base) != 16 or not numero_base.isdigit():
        raise ValueError("El número de cuenta debe tener 16 dígitos.")

    if len(ultimos) != 4 or not ultimos.isdigit():
        raise ValueError("Debe ingresar exactamente 4 dígitos.")

    return f"{numero_base[:-4]}{ultimos}"


# ==========================================================
# LOGIN
# ==========================================================

@app.post("/login")
def login(

    data: dict,

    db: Session = Depends(get_db)

):

    rol_solicitado = data.get(
        "rol",
        "usuario"
    )

    if rol_solicitado not in (
        "usuario",
        "asesor"
    ):

        raise HTTPException(
            status_code=400,
            detail="Tipo de acceso inválido"
        )

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

    if usuario.rol != rol_solicitado:

        raise HTTPException(
            status_code=403,
            detail="El documento no corresponde al tipo de acceso seleccionado"
        )

    if usuario.rol == "usuario":
        tiene_cuenta_activa = db.query(Cuenta).filter(
            Cuenta.id_usuario == usuario.id_usuario,
            Cuenta.estado == "activa"
        ).first() is not None

        if not tiene_cuenta_activa:
            raise HTTPException(
                status_code=403,
                detail="Tu registro está pendiente de aprobación por el asesor bancario."
            )

    token = generate_token(
        usuario.id_usuario
    )

    codigo_verificacion = generar_codigo_verificacion()

    asunto = "Inicio de sesión - Código de verificación - Financiero"
    mensaje = (
        f"<h3>Hola {usuario.nombre},</h3>"
        "<p>Tu acceso a Financiero fue exitoso.</p>"
        "<p>Se registró un inicio de sesión en tu cuenta.</p>"
        f"<p>Tu código de verificación es: <strong>{codigo_verificacion}</strong></p>"
        "<p>Si no fuiste tú, por favor cambia tu contraseña inmediatamente.</p>"
    )

    if usuario.email:
        enviar_correo(usuario.email, asunto, mensaje)

    db.add(
        Notificacion(
            id_usuario=usuario.id_usuario,
            mensaje="Se inició sesión correctamente en tu cuenta.",
            leido=False,
        )
    )
    db.commit()

    return {

        "message":
        "Login exitoso",

        "codigo_verificacion":
        codigo_verificacion,

        "token":
        token,

        "usuario": {

            "id":
            usuario.id_usuario,

            "nombre":
            usuario.nombre,

            "documento":
            usuario.documento,

            "rol":
            usuario.rol

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
        obtener_llave_bre_b_actual(
            db,
            current_user
        )

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
        obtener_llave_bre_b_actual(
            db,
            current_user
        )

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
# ==========================================================
#                  ASESOR BANCARIO
# ==========================================================
# ==========================================================


# ==========================================================
# CONSULTAR USUARIO Y SUS CUENTAS
# ==========================================================

@app.put("/cuentas/{id_cuenta}/tipo-operacion")
def actualizar_tipo_operacion_cuenta(
    id_cuenta: int,
    datos: TipoOperacionCuenta,
    current_user: int = Depends(token_required),
    db: Session = Depends(get_db)
):
    cuenta = db.query(Cuenta).filter(
        Cuenta.id_cuenta == id_cuenta,
        Cuenta.id_usuario == current_user
    ).first()

    if not cuenta:
        raise HTTPException(
            status_code=404,
            detail="Cuenta no encontrada."
        )

    tipo = datos.tipo_operacion.strip().lower()
    if tipo not in {"debito", "credito"}:
        raise HTTPException(
            status_code=400,
            detail="El tipo de operación debe ser débito o crédito."
        )

    cuenta.tipo_operacion = tipo
    db.commit()
    db.refresh(cuenta)

    return {
        "mensaje": "Tipo de operación actualizado correctamente.",
        "id_cuenta": cuenta.id_cuenta,
        "tipo_operacion": cuenta.tipo_operacion,
        "tipo_cuenta": cuenta.tipo_cuenta,
        "estado": cuenta.estado
    }


@app.put("/asesor-bancario/cuenta/{id_cuenta}/tipo-operacion")
def asesor_actualizar_tipo_operacion_cuenta(
    id_cuenta: int,
    datos: TipoOperacionCuenta,
    asesor: Usuario = Depends(asesor_requerido),
    db: Session = Depends(get_db)
):
    cuenta = db.query(Cuenta).filter(
        Cuenta.id_cuenta == id_cuenta
    ).first()

    if not cuenta:
        raise HTTPException(
            status_code=404,
            detail="Cuenta no encontrada."
        )

    tipo = datos.tipo_operacion.strip().lower()
    if tipo not in {"debito", "credito"}:
        raise HTTPException(
            status_code=400,
            detail="El tipo de operación debe ser débito o crédito."
        )

    cuenta.tipo_operacion = tipo
    db.commit()
    db.refresh(cuenta)

    return {
        "mensaje": "Tipo de operación actualizado correctamente.",
        "id_cuenta": cuenta.id_cuenta,
        "tipo_operacion": cuenta.tipo_operacion,
        "tipo_cuenta": cuenta.tipo_cuenta,
        "estado": cuenta.estado
    }


@app.get("/asesor-bancario/usuario/{documento}")
def asesor_consultar_usuario(

    documento: str,

    asesor: Usuario = Depends(
        asesor_requerido
    ),

    db: Session = Depends(get_db)

):

    usuario = db.query(Usuario).filter(

        Usuario.documento == documento

    ).first()

    if not usuario:

        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado."
        )

    cuentas = db.query(Cuenta).filter(

        Cuenta.id_usuario ==
        usuario.id_usuario

    ).order_by(

        Cuenta.id_cuenta

    ).all()

    return {

        "usuario": {

            "id_usuario":
            usuario.id_usuario,

            "nombre":
            usuario.nombre,

            "documento":
            usuario.documento,

            "email":
            usuario.email,

            "telefono":
            usuario.telefono,

            "direccion":
            usuario.direccion,

            "id_tipo_doc":
            usuario.id_tipo_doc,

            "rol":
            usuario.rol,

            "codigo_registro":
            usuario.codigo_registro,

            "tope_ahorros":
            float(usuario.tope_ahorros or 0),

            "tope_corriente":
            float(usuario.tope_corriente or 0),

            "fecha_creacion":
            usuario.fecha_creacion.isoformat()
            if usuario.fecha_creacion else None

        },

        "cuentas": [

            {

                "id_cuenta":
                cuenta.id_cuenta,

                "numero_cuenta":
                cuenta.numero_cuenta,

                "tipo_cuenta":
                cuenta.tipo_cuenta,

                "tipo_operacion":
                cuenta.tipo_operacion or "debito",

                "saldo":
                float(cuenta.saldo or 0),

                "estado":
                cuenta.estado

            }

            for cuenta in cuentas

        ]

    }


@app.get("/asesor-bancario/codigo/{codigo_registro}")
def asesor_consultar_por_codigo(

    codigo_registro: str,

    asesor: Usuario = Depends(
        asesor_requerido
    ),

    db: Session = Depends(get_db)

):

    if not codigo_registro.strip().isdigit() or len(codigo_registro.strip()) != 6:

        raise HTTPException(
            status_code=400,
            detail="El código de registro debe tener seis dígitos."
        )

    usuario = db.query(Usuario).filter(
        Usuario.codigo_registro == codigo_registro.strip()
    ).first()

    if not usuario:

        raise HTTPException(
            status_code=404,
            detail="Código de registro no encontrado."
        )

    cuentas = db.query(Cuenta).filter(
        Cuenta.id_usuario == usuario.id_usuario
    ).order_by(
        Cuenta.id_cuenta
    ).all()

    return {
        "usuario": {
            "id_usuario": usuario.id_usuario,
            "nombre": usuario.nombre,
            "documento": usuario.documento,
            "email": usuario.email,
            "telefono": usuario.telefono,
            "direccion": usuario.direccion,
            "rol": usuario.rol,
            "codigo_registro": usuario.codigo_registro,
            "id_tipo_doc": usuario.id_tipo_doc,
            "tope_ahorros": float(usuario.tope_ahorros or 0),
            "tope_corriente": float(usuario.tope_corriente or 0),
            "fecha_creacion": usuario.fecha_creacion.isoformat()
            if usuario.fecha_creacion else None
        },
        "cuentas": [
            {
                "id_cuenta": cuenta.id_cuenta,
                "numero_cuenta": cuenta.numero_cuenta,
                "tipo_cuenta": cuenta.tipo_cuenta,
                "tipo_operacion": cuenta.tipo_operacion or "debito",
                "saldo": float(cuenta.saldo or 0),
                "estado": cuenta.estado
            }
            for cuenta in cuentas
        ]
    }


# ==========================================================
# HABILITAR UNA CUENTA
# ==========================================================

@app.put("/asesor-bancario/cuenta/{id_cuenta}/saldo")
def asesor_actualizar_saldo(
    id_cuenta: int,
    datos: SaldoCuenta,
    asesor: Usuario = Depends(asesor_requerido),
    db: Session = Depends(get_db)
):
    if datos.saldo < 0:
        raise HTTPException(
            status_code=400,
            detail="El saldo no puede ser negativo."
        )

    cuenta = db.query(Cuenta).filter(
        Cuenta.id_cuenta == id_cuenta
    ).first()

    if not cuenta:
        raise HTTPException(
            status_code=404,
            detail="Cuenta no encontrada."
        )

    cuenta.saldo = Decimal(str(datos.saldo))
    db.commit()
    db.refresh(cuenta)

    return {
        "mensaje": "Saldo actualizado correctamente.",
        "id_cuenta": cuenta.id_cuenta,
        "saldo": float(cuenta.saldo or 0),
        "estado": cuenta.estado
    }


@app.put("/asesor-bancario/cuenta/{id_cuenta}/ultimos-digitos")
def asesor_actualizar_ultimos_digitos(
    id_cuenta: int,
    datos: UltimosDigitosCuenta,
    asesor: Usuario = Depends(asesor_requerido),
    db: Session = Depends(get_db)
):
    cuenta = db.query(Cuenta).filter(
        Cuenta.id_cuenta == id_cuenta
    ).first()

    if not cuenta:
        raise HTTPException(
            status_code=404,
            detail="Cuenta no encontrada."
        )

    try:
        numero_nuevo = formatear_numero_cuenta(cuenta.numero_cuenta, datos.ultimos_digitos)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
        ) from exc

    numero_existente = (
        db.query(Cuenta.id_cuenta)
        .filter(Cuenta.numero_cuenta == numero_nuevo, Cuenta.id_cuenta != id_cuenta)
        .first()
    )

    if numero_existente:
        raise HTTPException(
            status_code=400,
            detail="Los últimos 4 dígitos ya están asignados a otra cuenta."
        )

    cuenta.numero_cuenta = numero_nuevo
    db.commit()
    db.refresh(cuenta)

    return {
        "mensaje": "Los últimos 4 dígitos de la cuenta fueron actualizados correctamente.",
        "id_cuenta": cuenta.id_cuenta,
        "numero_cuenta": cuenta.numero_cuenta,
        "estado": cuenta.estado
    }


@app.put(
    "/asesor-bancario/cuenta/{id_cuenta}/habilitar"
)
def asesor_habilitar_cuenta(

    id_cuenta: int,

    asesor: Usuario = Depends(
        asesor_requerido
    ),

    db: Session = Depends(get_db)

):

    cuenta = db.query(Cuenta).filter(

        Cuenta.id_cuenta == id_cuenta

    ).first()

    if not cuenta:

        raise HTTPException(
            status_code=404,
            detail="Cuenta no encontrada."
        )

    if cuenta.estado == "activa":

        return {

            "mensaje":
            "La cuenta ya se encuentra habilitada.",

            "id_cuenta":
            cuenta.id_cuenta,

            "tipo_cuenta":
            cuenta.tipo_cuenta,

            "estado":
            cuenta.estado

        }

    cuenta.estado = "activa"

    db.commit()

    db.refresh(cuenta)

    return {

        "mensaje":
        "Cuenta habilitada correctamente.",

        "id_cuenta":
        cuenta.id_cuenta,

        "tipo_cuenta":
        cuenta.tipo_cuenta,

        "estado":
        cuenta.estado

    }


# ==========================================================
# DESHABILITAR UNA CUENTA
# ==========================================================

@app.put(
    "/asesor-bancario/cuenta/{id_cuenta}/deshabilitar"
)
def asesor_deshabilitar_cuenta(

    id_cuenta: int,

    asesor: Usuario = Depends(
        asesor_requerido
    ),

    db: Session = Depends(get_db)

):

    cuenta = db.query(Cuenta).filter(

        Cuenta.id_cuenta == id_cuenta

    ).first()

    if not cuenta:

        raise HTTPException(
            status_code=404,
            detail="Cuenta no encontrada."
        )

    if cuenta.estado == "inactiva":

        return {

            "mensaje":
            "La cuenta ya se encuentra deshabilitada.",

            "id_cuenta":
            cuenta.id_cuenta,

            "tipo_cuenta":
            cuenta.tipo_cuenta,

            "estado":
            cuenta.estado

        }

    cuenta.estado = "inactiva"

    db.commit()

    db.refresh(cuenta)

    return {

        "mensaje":
        "Cuenta deshabilitada correctamente.",

        "id_cuenta":
        cuenta.id_cuenta,

        "tipo_cuenta":
        cuenta.tipo_cuenta,

        "estado":
        cuenta.estado

    }


# ==========================================================
# HABILITAR TODAS LAS CUENTAS
# ==========================================================

@app.put(
    "/asesor-bancario/usuario/{documento}/habilitar-cuentas"
)
def asesor_habilitar_todas(

    documento: str,

    asesor: Usuario = Depends(
        asesor_requerido
    ),

    db: Session = Depends(get_db)

):

    usuario = db.query(Usuario).filter(

        Usuario.documento == documento

    ).first()

    if not usuario:

        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado."
        )

    cuentas = db.query(Cuenta).filter(

        Cuenta.id_usuario ==
        usuario.id_usuario

    ).all()

    if not cuentas:

        raise HTTPException(
            status_code=404,
            detail="El usuario no tiene cuentas registradas."
        )

    for cuenta in cuentas:

        cuenta.estado = "activa"

    db.commit()

    return {

        "mensaje":
        "Todas las cuentas fueron habilitadas correctamente.",

        "usuario":
        usuario.nombre,

        "documento":
        usuario.documento,

        "cuentas": [

            {

                "id_cuenta":
                cuenta.id_cuenta,

                "tipo_cuenta":
                cuenta.tipo_cuenta,

                "estado":
                cuenta.estado

            }

            for cuenta in cuentas

        ]

    }


# ==========================================================
# DESHABILITAR TODAS LAS CUENTAS
# ==========================================================

@app.put(
    "/asesor-bancario/usuario/{documento}/deshabilitar-cuentas"
)
def asesor_deshabilitar_todas(

    documento: str,

    asesor: Usuario = Depends(
        asesor_requerido
    ),

    db: Session = Depends(get_db)

):

    usuario = db.query(Usuario).filter(

        Usuario.documento == documento

    ).first()

    if not usuario:

        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado."
        )

    cuentas = db.query(Cuenta).filter(

        Cuenta.id_usuario ==
        usuario.id_usuario

    ).all()

    if not cuentas:

        raise HTTPException(
            status_code=404,
            detail="El usuario no tiene cuentas registradas."
        )

    for cuenta in cuentas:

        cuenta.estado = "inactiva"

    db.commit()

    return {

        "mensaje":
        "Todas las cuentas fueron deshabilitadas correctamente.",

        "usuario":
        usuario.nombre,

        "documento":
        usuario.documento,

        "cuentas": [

            {

                "id_cuenta":
                cuenta.id_cuenta,

                "tipo_cuenta":
                cuenta.tipo_cuenta,

                "estado":
                cuenta.estado

            }

            for cuenta in cuentas

        ]

    }


# ==========================================================
# SALDOS
# ==========================================================

@app.get("/cuentas/saldos")
def saldos_cuentas(

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    cuentas = db.query(Cuenta).filter(

        Cuenta.id_usuario == current_user

    ).all()

    saldos = {

        "cuenta_corriente":
        0,

        "cuenta_corriente_numero":
        None,

        "cuenta_corriente_estado":
        "inactiva",

        "cuenta_corriente_tipo":
        "debito",

        "cuenta_ahorro":
        0,

        "cuenta_ahorro_numero":
        None,

        "cuenta_ahorro_estado":
        "inactiva",

        "cuenta_ahorro_tipo":
        "debito"

    }

    for cuenta in cuentas:

        if cuenta.tipo_cuenta == "corriente":

            saldos["cuenta_corriente_estado"] = cuenta.estado
            saldos["cuenta_corriente_tipo"] = cuenta.tipo_operacion or "debito"

            if cuenta.estado != "activa":
                continue

            saldos[
                "cuenta_corriente"
            ] = float(
                cuenta.saldo or 0
            )

            saldos[
                "cuenta_corriente_numero"
            ] = cuenta.numero_cuenta or cuenta.id_cuenta

        elif cuenta.tipo_cuenta == "ahorros":

            saldos["cuenta_ahorro_estado"] = cuenta.estado
            saldos["cuenta_ahorro_tipo"] = cuenta.tipo_operacion or "debito"

            if cuenta.estado != "activa":
                continue

            saldos[
                "cuenta_ahorro"
            ] = float(
                cuenta.saldo or 0
            )

            saldos[
                "cuenta_ahorro_numero"
            ] = cuenta.numero_cuenta or cuenta.id_cuenta

    return saldos


# ==========================================================
# HISTORIAL DE TRANSACCIONES
# ==========================================================

@app.get("/transacciones")
def transacciones_usuario(

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    transacciones = db.query(
        Transaccion
    ).join(
        Cuenta,
        Transaccion.id_cuenta ==
        Cuenta.id_cuenta
    ).filter(

        Cuenta.id_usuario ==
        current_user

    ).order_by(

        Transaccion.fecha.desc()

    ).all()

    return [

        {

            "id_transaccion":
            transaccion.id_transaccion,

            "id_cuenta":
            transaccion.id_cuenta,

            "monto":
            float(transaccion.monto or 0),

            "tipo":
            transaccion.tipo,

            "fecha":
            transaccion.fecha,

            "descripcion":
            transaccion.descripcion,

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
# MODELOS TRANSFERENCIA
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
# TRANSFERENCIA ENTRE CUENTAS
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

        "corriente":
        "corriente",

        "ahorro":
        "ahorros"

    }

    tipo_origen = tipos.get(
        data.origen
    )

    tipo_destino = tipos.get(
        data.destino
    )

    if (
        not tipo_origen
        or not tipo_destino
        or tipo_origen == tipo_destino
    ):

        raise HTTPException(
            status_code=400,
            detail="Las cuentas de origen y destino deben ser diferentes."
        )

    try:

        cuentas = db.query(Cuenta).filter(

            Cuenta.id_usuario ==
            current_user,

            Cuenta.estado ==
            "activa",

            Cuenta.tipo_cuenta.in_([
                tipo_origen,
                tipo_destino
            ])

        ).with_for_update().all()

        cuenta_origen = next(

            (
                cuenta
                for cuenta in cuentas
                if cuenta.tipo_cuenta ==
                tipo_origen
            ),

            None

        )

        cuenta_destino = next(

            (
                cuenta
                for cuenta in cuentas
                if cuenta.tipo_cuenta ==
                tipo_destino
            ),

            None

        )

        if not cuenta_origen or not cuenta_destino:

            raise HTTPException(
                status_code=404,
                detail="No se encontraron ambas cuentas activas."
            )

        saldo_origen = Decimal(
            str(
                cuenta_origen.saldo or 0
            )
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

        cuenta_destino.saldo = (
            Decimal(
                str(
                    cuenta_destino.saldo or 0
                )
            )
            +
            data.monto
        )

        db.add_all([

            Transaccion(

                id_cuenta=
                cuenta_origen.id_cuenta,

                monto=
                data.monto,

                tipo=
                "Transferencia",

                descripcion=
                data.descripcion or
                "Transferencia entre cuentas"

            ),

            Transaccion(

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

        ])

        db.commit()

        return {

            "mensaje":
            "Transferencia realizada correctamente.",

            "saldo_origen":
            float(
                cuenta_origen.saldo
            ),

            "saldo_destino":
            float(
                cuenta_destino.saldo
            )

        }

    except HTTPException:

        db.rollback()

        raise

    except Exception as error:

        db.rollback()

        print(
            "ERROR TRANSFERENCIA ENTRE CUENTAS:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Error interno al realizar la transferencia."
        )


# ==========================================================
# TRANSFERENCIA NORMAL
# ==========================================================

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

            Cuenta.id_usuario ==
            current_user,

            Cuenta.tipo_cuenta ==
            cuenta_origen_tipo,

            Cuenta.estado ==
            "activa"

        ).with_for_update().first()

        if not cuenta_origen:

            raise HTTPException(
                status_code=404,
                detail="La cuenta de origen no existe."
            )

        cuenta_destino = db.query(Cuenta).filter(

            Cuenta.id_cuenta ==
            data.destino,

            Cuenta.estado ==
            "activa"

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
            str(
                cuenta_origen.saldo or 0
            )
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
            str(
                cuenta_destino.saldo or 0
            )
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

        db.add(
            transaccion_salida
        )

        db.add(
            transaccion_entrada
        )

        db.commit()

        db.refresh(
            cuenta_origen
        )

        db.refresh(
            cuenta_destino
        )

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
            detail="Error interno al realizar la transferencia."
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
# BRE-B
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

    llave = (
        data or {}
    ).get("llave")

    if not llave:

        raise HTTPException(
            status_code=400,
            detail="Debe ingresar una llave Bre-B."
        )

    llave = llave.strip()

    if len(llave) < 4:

        raise HTTPException(
            status_code=400,
            detail="La llave Bre-B no es válida."
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
            detail="Usuario no encontrado."
        )

    llave_existente = db.query(
        LlaveBreb
    ).filter(

        LlaveBreb.llave ==
        llave,

        LlaveBreb.estado ==
        "activa"

    ).first()

    if (
        llave_existente
        and
        llave_existente.id_usuario != current_user
    ):

        raise HTTPException(
            status_code=409,
            detail="Esta llave Bre-B ya está registrada."
        )

    cuenta_usuario = db.query(
        Cuenta
    ).filter(

        Cuenta.id_usuario ==
        current_user,

        Cuenta.estado ==
        "activa"

    ).order_by(
        Cuenta.id_cuenta
    ).first()

    if not cuenta_usuario:

        raise HTTPException(
            status_code=404,
            detail="Debe tener al menos una cuenta activa para registrar una llave Bre-B."
        )

    llave_actual = db.query(
        LlaveBreb
    ).filter(

        LlaveBreb.id_usuario ==
        current_user,

        LlaveBreb.estado ==
        "activa"

    ).order_by(
        LlaveBreb.id_llave.desc()
    ).first()

    if llave_actual:

        llave_actual.llave = llave

        llave_actual.id_cuenta = (
            cuenta_usuario.id_cuenta
        )

        llave_actual.tipo_llave = (
            "alfanumerica"
        )

        db.commit()

        db.refresh(
            llave_actual
        )

        return {

            "mensaje":
            "Llave Bre-B registrada correctamente.",

            "llave":
            llave_actual.llave

        }

    nueva_llave = LlaveBreb(

        id_usuario=
        current_user,

        id_cuenta=
        cuenta_usuario.id_cuenta,

        tipo_llave=
        "alfanumerica",

        llave=
        llave,

        estado=
        "activa"

    )

    db.add(
        nueva_llave
    )

    db.commit()

    db.refresh(
        nueva_llave
    )

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

    llave_breb = db.query(
        LlaveBreb
    ).filter(

        LlaveBreb.llave ==
        llave,

        LlaveBreb.estado ==
        "activa"

    ).first()

    if not llave_breb:

        raise HTTPException(
            status_code=404,
            detail="No se encontró un usuario asociado a esta llave Bre-B."
        )

    usuario = db.query(
        Usuario
    ).filter(

        Usuario.id_usuario ==
        llave_breb.id_usuario

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

    cuenta = db.query(
        Cuenta
    ).filter(

        Cuenta.id_cuenta ==
        llave_breb.id_cuenta

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
        cuenta.tipo_cuenta
        if cuenta
        else None

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
                detail="El monto debe ser mayor que cero."
            )

        # ==================================================
        # VALIDAR LLAVE
        # ==================================================

        llave = data.llave_destino.strip()

        if not llave:

            raise HTTPException(
                status_code=400,
                detail="Debe ingresar una llave Bre-B."
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
                detail="Cuenta de origen no válida."
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

        llave_breb = db.query(
            LlaveBreb
        ).filter(

            LlaveBreb.llave ==
            llave,

            LlaveBreb.estado ==
            "activa"

        ).first()

        if not llave_breb:

            raise HTTPException(
                status_code=404,
                detail="No se encontró el destinatario."
            )

        destinatario = db.query(
            Usuario
        ).filter(

            Usuario.id_usuario ==
            llave_breb.id_usuario

        ).first()

        if not destinatario:

            raise HTTPException(
                status_code=404,
                detail="No se encontró el destinatario."
            )

        # ==================================================
        # EVITAR AUTO TRANSFERENCIA
        # ==================================================

        if destinatario.id_usuario == current_user:

            raise HTTPException(
                status_code=400,
                detail="No puede realizar una transferencia a usted mismo."
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
                detail="La cuenta de origen no existe."
            )

        # ==================================================
        # BUSCAR CUENTA DESTINO
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
                detail="El destinatario no tiene una cuenta activa."
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
        # VALIDAR TOPE
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
                detail="Usuario de origen no encontrado."
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
            detail="Error interno al realizar la transferencia Bre-B."
        )