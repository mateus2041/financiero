from fastapi import FastAPI, Depends, HTTPException
from decimal import Decimal
import secrets
import os
import re
import hmac
from datetime import datetime
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


class SaldoCuentaAutorizado(BaseModel):
    saldo: float
    codigo_autorizacion: str


class CodigoAutorizacion(BaseModel):
    codigo_autorizacion: str


class UltimosDigitosCuenta(BaseModel):
    ultimos_digitos: str


class UltimosDigitosCuentaAutorizada(BaseModel):
    ultimos_digitos: str
    codigo_autorizacion: str


class TipoOperacionCuenta(BaseModel):
    tipo_operacion: str


class TipoOperacionCuentaAutorizada(BaseModel):
    tipo_operacion: str
    codigo_autorizacion: str

class NuevaCuenta(BaseModel):
    tipo_cuenta: str
    tipo_operacion: str = "debito"
    opcion_cuenta: str | None = None
    saldo: float = 0

class ConfirmarContrasena(BaseModel):
    password: str


class SolicitudRecuperacion(BaseModel):
    documento: str
    email: str


class VerificarRecuperacion(BaseModel):
    documento: str
    codigo: str


class RestablecerContrasena(BaseModel):
    token: str
    nueva_password: str


class VerificarTarjetaRecuperacion(BaseModel):
    token: str
    ultimos_digitos: str
    fecha_expiracion: str
    codigo_seguridad: str


from Backend.ai.router import router as ia_router
from Backend.models import (
    Usuario,
    Administrador,
    Cuenta,
    Tarjeta,
    Transaccion,
    LlaveBreb,
    Notificacion
)
from Backend.dependencias import get_db
from Backend.email_service.email_service import crear_plantilla_email, enviar_correo

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

codigos_recuperacion = {}


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

    columnas_administradores = {
        columna["name"]
        for columna in inspect(engine).get_columns("administradores")
    }

    with engine.begin() as conexion:
        conexion.execute(text(
            """
            CREATE TABLE IF NOT EXISTS asesores_banco (
                id_asesor INT AUTO_INCREMENT PRIMARY KEY,
                id_usuario INT NULL,
                nombre VARCHAR(100) NULL,
                documento VARCHAR(50) NULL,
                tipo_documento VARCHAR(50) NULL,
                email VARCHAR(100) NULL,
                codigo_asesor VARCHAR(30) NOT NULL UNIQUE,
                especialidad VARCHAR(100),
                estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
                fecha_ingreso DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        ))

    columnas_asesores = {
        columna["name"]
        for columna in inspect(engine).get_columns("asesores_banco")
    }

    claves_asesores = inspect(engine).get_foreign_keys("asesores_banco")

    with engine.begin() as conexion:

        if "id_usuario" not in columnas_administradores:

            conexion.execute(text(
                "ALTER TABLE administradores "
                "ADD COLUMN id_usuario INT NULL UNIQUE, "
                "ADD CONSTRAINT fk_administradores_usuario "
                "FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)"
            ))

        if "nombre" not in columnas_asesores:
            conexion.execute(text(
                "ALTER TABLE asesores_banco ADD COLUMN nombre VARCHAR(100) NULL"
            ))

        if "documento" not in columnas_asesores:
            conexion.execute(text(
                "ALTER TABLE asesores_banco ADD COLUMN documento VARCHAR(50) NULL"
            ))

        if "tipo_documento" not in columnas_asesores:
            conexion.execute(text(
                "ALTER TABLE asesores_banco "
                "ADD COLUMN tipo_documento VARCHAR(50) NULL"
            ))

        conexion.execute(text(
            "UPDATE asesores_banco "
            "SET tipo_documento = 'Cedula de ciudadania' "
            "WHERE tipo_documento IS NULL OR tipo_documento = ''"
        ))

        if "email" not in columnas_asesores:
            conexion.execute(text(
                "ALTER TABLE asesores_banco ADD COLUMN email VARCHAR(100) NULL"
            ))

        if any(
            clave.get("name") == "fk_asesor_usuario"
            for clave in claves_asesores
        ):
            conexion.execute(text(
                "ALTER TABLE asesores_banco DROP FOREIGN KEY fk_asesor_usuario"
            ))

        conexion.execute(text(
            "ALTER TABLE asesores_banco MODIFY COLUMN id_usuario INT NULL"
        ))

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

    if asesor:

        if asesor.rol != "asesor":

            raise HTTPException(
                status_code=403,
                detail="No tienes permisos de asesor bancario."
            )

        return asesor

    asesor_independiente = db.execute(
        text(
            """
            SELECT id_asesor, nombre, documento, tipo_documento
            FROM asesores_banco
            WHERE id_asesor = :id_asesor
              AND estado = 'activo'
            LIMIT 1
            """
        ),
        {"id_asesor": abs(current_user)},
    ).mappings().first()

    if not asesor_independiente or current_user >= 0:

        raise HTTPException(
            status_code=404,
            detail="Asesor no encontrado."
        )

    return asesor_independiente


def administrador_o_asesor_requerido(
    current_user: int = Depends(token_required),
    db: Session = Depends(get_db)
):
    administrador = db.query(Administrador).filter(
        Administrador.id_usuario == current_user
    ).first()

    if administrador:
        return current_user

    asesor_requerido(current_user=current_user, db=db)
    return current_user


# ==========================================================
# INICIO
# ==========================================================

@app.get("/inicio")
def inicio():

    return {
        "message": "API funcionando correctamente"
    }


@app.get("/notificaciones")
def listar_notificaciones(
    current_user: int = Depends(token_required),
    db: Session = Depends(get_db)
):
    notificaciones = db.query(Notificacion).filter(
        Notificacion.id_usuario == current_user
    ).order_by(Notificacion.fecha.desc()).all()

    return [
        {
            "id_notificacion": notificacion.id_notificacion,
            "nombre_asesor": notificacion.usuario.nombre if notificacion.usuario else "Sin nombre",
            "mensaje": notificacion.mensaje,
            "leida": notificacion.leido,
            "fecha_creacion": notificacion.fecha,
        }
        for notificacion in notificaciones
    ]


@app.put("/notificaciones/leer-todas")
def marcar_todas_notificaciones_leidas(
    current_user: int = Depends(token_required),
    db: Session = Depends(get_db)
):
    db.query(Notificacion).filter(
        Notificacion.id_usuario == current_user,
        Notificacion.leido.is_(False)
    ).update(
        {Notificacion.leido: True},
        synchronize_session=False
    )
    db.commit()

    return {"message": "Notificaciones marcadas como leídas."}


@app.put("/notificaciones/{id_notificacion}/leer")
def marcar_notificacion_leida(
    id_notificacion: int,
    current_user: int = Depends(token_required),
    db: Session = Depends(get_db)
):
    notificacion = db.query(Notificacion).filter(
        Notificacion.id_notificacion == id_notificacion,
        Notificacion.id_usuario == current_user
    ).first()

    if not notificacion:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")

    notificacion.leido = True
    db.commit()

    return {"message": "Notificación marcada como leída."}


@app.delete("/notificaciones/{id_notificacion}")
def eliminar_notificacion(
    id_notificacion: int,
    current_user: int = Depends(token_required),
    db: Session = Depends(get_db)
):
    notificacion = db.query(Notificacion).filter(
        Notificacion.id_notificacion == id_notificacion,
        Notificacion.id_usuario == current_user
    ).first()

    if not notificacion:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")

    db.delete(notificacion)
    db.commit()

    return {"message": "Notificación eliminada."}


@app.delete("/notificaciones")
def eliminar_todas_notificaciones(
    current_user: int = Depends(token_required),
    db: Session = Depends(get_db)
):
    db.query(Notificacion).filter(
        Notificacion.id_usuario == current_user
    ).delete(synchronize_session=False)
    db.commit()

    return {"message": "Notificaciones eliminadas."}


# ==========================================================
# REGISTRO
# ==========================================================

def ubicacion_real(
    direccion: str,
    localidad: str,
    barrio: str,
    codigo: str,
    ciudad: str = ""
) -> bool:

    if not codigo.isdigit() or len(codigo) != 6:
        return False

    parametros = urlencode({
        "street": direccion,
        "city": ciudad or localidad,
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


@app.post("/recuperar-password")
def solicitar_recuperacion(
    datos: SolicitudRecuperacion,
    db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(
        Usuario.documento == datos.documento,
        Usuario.email == datos.email
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=400,
            detail="El documento y el correo no coinciden con una cuenta registrada"
        )

    codigo = f"{secrets.randbelow(1000000):06d}"
    codigos_recuperacion[datos.documento] = {
        "codigo": codigo,
        "expira": datetime.utcnow().timestamp() + 600,
        "intentos": 0
    }
    mensaje = crear_plantilla_email(
        f"""
        <p>Hola <strong>{usuario.nombre}</strong>,</p>
        <p>Tu código temporal para recuperar el acceso es:</p>
        <p style=\"color: #0d6efd; font-size: 22px; letter-spacing: 4px;\"><strong>{codigo}</strong></p>
        <p>Este código vence en 10 minutos. Si no solicitaste este cambio, ignora este mensaje.</p>
        """
    )
    correo_enviado = enviar_correo(
        usuario.email,
        "Código para recuperar tu contraseña",
        mensaje
    )
    if not correo_enviado:
        codigos_recuperacion.pop(datos.documento, None)
        raise HTTPException(
            status_code=503,
            detail="No fue posible enviar el código al correo registrado"
        )

    return {
        "message": "Si los datos coinciden, recibirás un código en tu correo."
    }


@app.post("/verificar-codigo-recuperacion")
def verificar_codigo_recuperacion(
    datos: VerificarRecuperacion,
    db: Session = Depends(get_db)
):
    registro = codigos_recuperacion.get(datos.documento)
    if not registro or registro["expira"] < datetime.utcnow().timestamp():
        raise HTTPException(status_code=400, detail="El código es inválido o expiró")

    registro["intentos"] += 1
    if registro["intentos"] > 5 or not hmac.compare_digest(registro["codigo"], datos.codigo):
        raise HTTPException(status_code=400, detail="El código es inválido o expiró")

    usuario = db.query(Usuario).filter(Usuario.documento == datos.documento).first()
    token = secrets.token_urlsafe(32)
    codigos_recuperacion[datos.documento] = {
        "token": token,
        "usuario_id": usuario.id_usuario,
        "tarjeta_verificada": False,
        "expira": datetime.utcnow().timestamp() + 600
    }
    return {"token": token}


@app.post("/verificar-tarjeta-recuperacion")
def verificar_tarjeta_recuperacion(
    datos: VerificarTarjetaRecuperacion,
    db: Session = Depends(get_db)
):
    documento = next(
        (clave for clave, valor in codigos_recuperacion.items()
         if valor.get("token") == datos.token),
        None
    )
    registro = codigos_recuperacion.get(documento) if documento else None
    if not registro or registro["expira"] < datetime.utcnow().timestamp():
        raise HTTPException(status_code=400, detail="La sesión de recuperación expiró")

    ultimos_digitos = datos.ultimos_digitos.strip()
    if not re.fullmatch(r"\d{6}", ultimos_digitos):
        raise HTTPException(status_code=400, detail="Ingresa exactamente los últimos 6 dígitos")

    if not re.fullmatch(r"(0[1-9]|1[0-2])/\d{2}", datos.fecha_expiracion.strip()):
        raise HTTPException(status_code=400, detail="Ingresa la fecha de expiración en formato MM/AA")

    if not re.fullmatch(r"\d{3}", datos.codigo_seguridad.strip()):
        raise HTTPException(status_code=400, detail="Ingresa un código de seguridad de 3 dígitos")

    tarjeta = db.query(Tarjeta).join(Cuenta).filter(
        Cuenta.id_usuario == registro["usuario_id"],
        Tarjeta.numero_tarjeta.isnot(None),
        Tarjeta.numero_tarjeta.endswith(ultimos_digitos)
    ).first()
    if (
        not tarjeta
        or tarjeta.fecha_expiracion != datos.fecha_expiracion.strip()
        or tarjeta.codigo_seguridad != datos.codigo_seguridad.strip()
    ):
        raise HTTPException(status_code=400, detail="Los últimos 6 dígitos no coinciden")

    registro["tarjeta_verificada"] = True
    return {"message": "Identidad verificada correctamente"}


@app.post("/restablecer-password")
def restablecer_password(
    datos: RestablecerContrasena,
    db: Session = Depends(get_db)
):
    documento = next(
        (clave for clave, valor in codigos_recuperacion.items()
         if valor.get("token") == datos.token),
        None
    )
    registro = codigos_recuperacion.get(documento) if documento else None
    if not registro or registro["expira"] < datetime.utcnow().timestamp():
        raise HTTPException(status_code=400, detail="La sesión de recuperación expiró")
    if not registro.get("tarjeta_verificada"):
        raise HTTPException(status_code=403, detail="Verifica los últimos 6 dígitos de tu tarjeta")
    if len(datos.nueva_password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")

    usuario = db.query(Usuario).filter(Usuario.id_usuario == registro["usuario_id"]).first()
    usuario.password = hash_password(datos.nueva_password)
    db.commit()
    del codigos_recuperacion[documento]
    return {"message": "Contraseña actualizada correctamente"}


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
        ciudad=data.get("ciudad", "").strip(),
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

    if rol == "asesor":
        db.execute(
            text(
                """
                INSERT INTO asesores_banco (
                    id_usuario,
                    codigo_asesor,
                    especialidad,
                    estado
                )
                VALUES (
                    :id_usuario,
                    :codigo_asesor,
                    :especialidad,
                    'activo'
                )
                """
            ),
            {
                "id_usuario": nuevo_usuario.id_usuario,
                "codigo_asesor": f"ASESOR-{nuevo_usuario.id_usuario:06d}",
                "especialidad": data.get("especialidad", "Asesoría bancaria"),
            },
        )

    numeros_usados: set[str] = set()

    db.add(
        Cuenta(
            id_usuario=nuevo_usuario.id_usuario,
            numero_cuenta=generar_numero_cuenta(db, numeros_usados),
            tipo_cuenta="corriente",
            saldo=0,
            estado="inactiva"
        )
    )

    db.commit()

    asunto = "Cuenta creada - Financiero"
    mensaje = crear_plantilla_email(
        f"""
        <p style="margin: 0 0 14px; font-size: 15px; color: #1f1f1f;">
            Hola <strong>{nuevo_usuario.nombre}</strong>,
        </p>
        <p style="margin: 0 0 14px; font-size: 14px; color: #1f1f1f;">
            Tu cuenta en Financiero ha sido creada correctamente.
        </p>
        <p style="margin: 0 0 14px; font-size: 14px; color: #1f1f1f;">
            Tu solicitud queda pendiente de aprobación por el asesor bancario.
        </p>
        <p style="margin: 0; font-size: 14px; color: #1f1f1f;">
            Cuando tu cuenta quede activa, podrás iniciar sesión con tus credenciales.
        </p>
        """
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

@app.post("/asesor-login")
def asesor_login(
    data: dict,
    db: Session = Depends(get_db)
):
    email_asesor = str(data.get("email", "")).strip().lower()
    codigo_asesor = str(data.get("codigo_asesor", "")).strip()

    if not email_asesor or not codigo_asesor:
        raise HTTPException(
            status_code=400,
            detail="Ingrese el correo y el código del asesor"
        )

    asesor = db.execute(
        text(
            """
                 SELECT a.id_asesor, u.id_usuario,
                     COALESCE(u.nombre, a.nombre) AS nombre,
                     COALESCE(u.documento, a.documento) AS documento,
                                         COALESCE(a.email, u.email) AS email,
                     COALESCE(u.rol, 'asesor') AS rol
            FROM asesores_banco AS a
            LEFT JOIN usuario AS u ON u.id_usuario = a.id_usuario
                        WHERE LOWER(COALESCE(a.email, u.email)) = :email_asesor
              AND a.codigo_asesor = :codigo_asesor
              AND a.estado = 'activo'
              AND (u.rol = 'asesor' OR u.id_usuario IS NULL)
            LIMIT 1
            """
        ),
                {
                    "email_asesor": email_asesor,
                    "codigo_asesor": codigo_asesor,
                },
    ).mappings().first()

    if not asesor:
        raise HTTPException(
            status_code=401,
            detail="Correo, código de asesor inválido o asesor inactivo"
        )

    if not asesor["email"]:
        raise HTTPException(
            status_code=400,
            detail="El asesor no tiene un correo electrónico registrado"
        )

    codigo_verificacion = generar_codigo_verificacion()
    asunto = "Inicio de sesión de asesor - Código de verificación - Financiero"
    mensaje = crear_plantilla_email(
        f"""
        <p style="margin: 0 0 14px; font-size: 15px; color: #1f1f1f;">
            Hola <strong>{asesor['nombre']}</strong>,
        </p>
        <p style="margin: 0 0 14px; font-size: 14px; color: #1f1f1f;">
            Tu acceso como asesor bancario fue exitoso.
        </p>
        <p style="margin: 0 0 14px; font-size: 14px; color: #1f1f1f;">
            Tu código de verificación es: <strong style="color: #0d6efd;">{codigo_verificacion}</strong>
        </p>
        """
    )
    enviar_correo(asesor["email"], asunto, mensaje)

    return {
        "message": "Acceso de asesor exitoso",
        "codigo_verificacion": codigo_verificacion,
        "token": generate_token(
            asesor["id_usuario"]
            if asesor["id_usuario"] is not None
            else -asesor["id_asesor"]
        ),
        "usuario": {
            "id": asesor["id_usuario"]
            if asesor["id_usuario"] is not None
            else -asesor["id_asesor"],
            "nombre": asesor["nombre"],
            "documento": asesor["documento"],
            "rol": asesor["rol"]
        }
    }


@app.post("/administradores/asesores")
def registrar_codigo_asesor(
    data: dict,
    current_user: int = Depends(token_required),
    db: Session = Depends(get_db)
):
    administrador = db.query(Administrador).filter(
        Administrador.id_usuario == current_user
    ).first()

    if not administrador:
        raise HTTPException(
            status_code=403,
            detail="Solo un administrador puede registrar asesores"
        )

    nombre = str(data.get("nombre", "")).strip()
    documento = str(data.get("documento", "")).strip()
    email = str(data.get("email", "")).strip()
    tipo_documento = str(data.get("tipo_documento", "")).strip()
    cargo = "Asesor"

    if not nombre or not documento or not email or not tipo_documento:
        raise HTTPException(
            status_code=400,
            detail="Nombre, número, correo y tipo de documento son obligatorios"
        )

    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise HTTPException(status_code=400, detail="Ingrese un correo electrónico válido")

    caracteres_codigo = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    codigo_asesor = "".join(
        secrets.choice(caracteres_codigo)
        for _ in range(10)
    )

    while db.execute(
        text(
            "SELECT 1 FROM asesores_banco "
            "WHERE codigo_asesor = :codigo_asesor LIMIT 1"
        ),
        {"codigo_asesor": codigo_asesor},
    ).first() is not None:
        codigo_asesor = "".join(
            secrets.choice(caracteres_codigo)
            for _ in range(10)
        )

    db.execute(
        text(
            """
            INSERT INTO asesores_banco (
                nombre, documento, email, tipo_documento,
                codigo_asesor, especialidad, estado
            )
            VALUES (
                :nombre, :documento, :email, :tipo_documento,
                :codigo_asesor, :cargo, 'activo'
            )
            """
        ),
        {
            "nombre": nombre,
            "documento": documento,
            "email": email,
            "tipo_documento": tipo_documento,
            "codigo_asesor": codigo_asesor,
            "cargo": cargo,
        },
    )
    db.commit()

    return {
        "mensaje": "Asesor registrado correctamente",
        "codigo_asesor": codigo_asesor,
        "estado": "activo"
    }


@app.get("/administradores/asesores")
def consultar_asesores(
    codigo_asesor: str | None = None,
    current_user: int = Depends(token_required),
    db: Session = Depends(get_db)
):
    administrador = db.query(Administrador).filter(
        Administrador.id_usuario == current_user
    ).first()

    if not administrador:
        raise HTTPException(
            status_code=403,
            detail="Solo un administrador puede consultar asesores"
        )

    consulta = db.execute(
        text(
            """
                 SELECT a.id_asesor,
                     COALESCE(a.nombre, u.nombre) AS nombre,
                     COALESCE(a.documento, u.documento) AS documento,
                     COALESCE(a.tipo_documento, td.nombre_doc) AS tipo_documento,
                     COALESCE(a.especialidad, u.rol) AS cargo,
                     COALESCE(a.email, u.email) AS email,
                     a.codigo_asesor,
                     a.estado, a.fecha_ingreso
            FROM asesores_banco AS a
            LEFT JOIN usuario AS u ON u.id_usuario = a.id_usuario
            LEFT JOIN tipo_documento AS td ON td.id_tipo_doc = u.id_tipo_doc
            WHERE (:codigo_asesor IS NULL OR a.codigo_asesor = :codigo_asesor)
            ORDER BY a.id_asesor
            """
        ),
        {
            "codigo_asesor": codigo_asesor.strip() if codigo_asesor else None
        }
    ).mappings().all()

    return {
        "asesores": [
            {
                **dict(asesor),
                "fecha_ingreso": asesor["fecha_ingreso"].isoformat()
                if asesor["fecha_ingreso"] else None
            }
            for asesor in consulta
        ]
    }


@app.delete("/administradores/asesores/{id_asesor}")
def eliminar_asesor(
    id_asesor: int,
    current_user: int = Depends(token_required),
    db: Session = Depends(get_db)
):
    administrador = db.query(Administrador).filter(
        Administrador.id_usuario == current_user
    ).first()

    if not administrador:
        raise HTTPException(
            status_code=403,
            detail="Solo un administrador puede eliminar asesores"
        )

    asesor = db.execute(
        text("SELECT id_asesor FROM asesores_banco WHERE id_asesor = :id_asesor"),
        {"id_asesor": id_asesor}
    ).mappings().first()

    if not asesor:
        raise HTTPException(
            status_code=404,
            detail="Asesor no encontrado"
        )

    db.execute(
        text("DELETE FROM asesores_banco WHERE id_asesor = :id_asesor"),
        {"id_asesor": id_asesor}
    )
    db.commit()

    return {"mensaje": "Asesor eliminado correctamente", "id_asesor": id_asesor}


@app.put("/administradores/asesores/{id_asesor}")
def actualizar_asesor(
    id_asesor: int,
    data: dict,
    current_user: int = Depends(token_required),
    db: Session = Depends(get_db)
):
    administrador = db.query(Administrador).filter(
        Administrador.id_usuario == current_user
    ).first()

    if not administrador:
        raise HTTPException(
            status_code=403,
            detail="Solo un administrador puede actualizar asesores"
        )

    try:
        nuevo_id_asesor = int(data.get("id_asesor"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Ingrese un ID de asesor válido")

    codigo_asesor = str(data.get("codigo_asesor", "")).strip()
    if not codigo_asesor:
        raise HTTPException(status_code=400, detail="Ingrese el código de asesor")
    if len(codigo_asesor) > 30:
        raise HTTPException(
            status_code=400,
            detail="El código de asesor no puede superar 30 caracteres"
        )

    nombre = data.get("nombre")
    if nombre is not None:
        nombre = str(nombre).strip()
        if not nombre:
            raise HTTPException(status_code=400, detail="Ingrese el nombre del asesor")

    documento = data.get("documento")
    if documento is not None:
        documento = str(documento).strip()
        if not documento:
            raise HTTPException(status_code=400, detail="Ingrese el documento del asesor")

    tipo_documento = data.get("tipo_documento")
    if tipo_documento is not None:
        tipo_documento = str(tipo_documento).strip()
        if not tipo_documento:
            raise HTTPException(status_code=400, detail="Seleccione el tipo de documento")

    cargo = data.get("cargo")
    if cargo is not None:
        cargo = str(cargo).strip()
        if not cargo:
            raise HTTPException(status_code=400, detail="Ingrese el cargo del asesor")

    email = data.get("email")
    if email is not None:
        email = str(email).strip()

    estado = data.get("estado")
    if estado is not None:
        estado = str(estado).strip().lower()
        if estado not in {"activo", "inactivo"}:
            raise HTTPException(
                status_code=400,
                detail="El estado debe ser activo o inactivo"
            )

    asesor = db.execute(
        text("SELECT id_asesor FROM asesores_banco WHERE id_asesor = :id_asesor"),
        {"id_asesor": id_asesor}
    ).mappings().first()
    if not asesor:
        raise HTTPException(status_code=404, detail="Asesor no encontrado")

    conflicto = db.execute(
        text(
            """
            SELECT id_asesor FROM asesores_banco
            WHERE (id_asesor = :nuevo_id_asesor OR codigo_asesor = :codigo_asesor)
              AND id_asesor <> :id_asesor
            LIMIT 1
            """
        ),
        {
            "nuevo_id_asesor": nuevo_id_asesor,
            "codigo_asesor": codigo_asesor,
            "id_asesor": id_asesor
        }
    ).mappings().first()
    if conflicto:
        raise HTTPException(status_code=409, detail="El ID o código ya pertenece a otro asesor")

    db.execute(
        text(
            """
            UPDATE asesores_banco
            SET id_asesor = :nuevo_id_asesor,
                codigo_asesor = :codigo_asesor,
                nombre = COALESCE(:nombre, nombre),
                documento = COALESCE(:documento, documento),
                tipo_documento = COALESCE(:tipo_documento, tipo_documento),
                especialidad = COALESCE(:cargo, especialidad),
                email = COALESCE(:email, email),
                estado = COALESCE(:estado, estado)
            WHERE id_asesor = :id_asesor
            """
        ),
        {
            "nuevo_id_asesor": nuevo_id_asesor,
            "codigo_asesor": codigo_asesor,
            "nombre": nombre,
            "documento": documento,
            "tipo_documento": tipo_documento,
            "cargo": cargo,
            "email": email,
            "estado": estado,
            "id_asesor": id_asesor
        }
    )
    db.commit()

    return {
        "mensaje": "Asesor actualizado correctamente",
        "id_asesor": nuevo_id_asesor,
        "codigo_asesor": codigo_asesor,
        "estado": estado
    }


@app.post("/administrador-login")
def administrador_login(
    data: dict,
    db: Session = Depends(get_db)
):
    documento = str(data.get("documento", "")).strip()
    codigo_administrador = str(
        data.get("codigo_administrador", "")
    ).strip()

    if not documento or not codigo_administrador:
        raise HTTPException(
            status_code=400,
            detail="Ingrese el número de documento y el código de administrador"
        )

    administrador = db.query(Administrador).filter(
        Administrador.codigo_administrador == codigo_administrador
    ).first()

    if not administrador:
        raise HTTPException(
            status_code=401,
            detail="Código de administrador inválido"
        )

    usuario = db.query(Usuario).filter(
        Usuario.id_usuario == administrador.id_usuario
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=401,
            detail="El administrador no está asociado a un usuario válido"
        )

    if usuario.documento != documento:
        raise HTTPException(
            status_code=401,
            detail="El documento no corresponde al administrador"
        )

    codigo_verificacion = generar_codigo_verificacion()
    asunto = "Inicio de sesión de administrador - Código de verificación - Financiero"
    mensaje = crear_plantilla_email(
        f"""
        <p style="margin: 0 0 14px; font-size: 15px; color: #1f1f1f;">
            Hola <strong>{usuario.nombre}</strong>,
        </p>
        <p style="margin: 0 0 14px; font-size: 14px; color: #1f1f1f;">
            Tu acceso como administrador fue exitoso.
        </p>
        <p style="margin: 0 0 14px; font-size: 14px; color: #1f1f1f;">
            Tu código de verificación es: <strong style="color: #0d6efd;">{codigo_verificacion}</strong>
        </p>
        """
    )
    enviar_correo(usuario.email, asunto, mensaje)

    return {
        "message": "Acceso de administrador exitoso",
        "codigo_verificacion": codigo_verificacion,
        "token": generate_token(usuario.id_usuario),
        "usuario": {
            "id": usuario.id_usuario,
            "nombre": usuario.nombre,
            "documento": usuario.documento,
            "rol": "administrador"
        }
    }

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

    if rol_solicitado == "asesor":
        asesor = db.execute(
            text(
                """
                SELECT id_asesor
                FROM asesores_banco
                WHERE id_usuario = :id_usuario
                  AND estado = 'activo'
                LIMIT 1
                """
            ),
            {"id_usuario": usuario.id_usuario},
        ).first()

        if not asesor:
            raise HTTPException(
                status_code=403,
                detail="El asesor no está registrado o está inactivo"
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
    fecha_hora_ingreso = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    asunto = "Inicio de sesión - Código de verificación - Financiero"
    mensaje = crear_plantilla_email(
        f"""
        <p style="margin: 0 0 14px; font-size: 15px; color: #1f1f1f;">
            Hola <strong>{usuario.nombre}</strong>,
        </p>
        <p style="margin: 0 0 14px; font-size: 14px; color: #1f1f1f;">
            Tu acceso a Financiero fue exitoso.
        </p>
        <p style="margin: 0 0 14px; font-size: 14px; color: #1f1f1f;">
            Se registró un inicio de sesión en tu cuenta.
        </p>
        <p style="margin: 0 0 14px; font-size: 14px; color: #1f1f1f;">
            Tu código de verificación es: <strong style="color: #0d6efd;">{codigo_verificacion}</strong>
        </p>
        <p style="margin: 0; font-size: 14px; color: #1f1f1f;">
            Si no fuiste tú, por favor cambia tu contraseña inmediatamente.
        </p>
        """
    )

    asunto_notificacion_ingreso = "Notificación de ingreso a tu cuenta - Fecha y hora - Financiero"
    mensaje_notificacion_ingreso = crear_plantilla_email(
        f"""
        <p style="margin: 0 0 14px; font-size: 15px; color: #1f1f1f;">
            Hola <strong>{usuario.nombre}</strong>,
        </p>
        <p style="margin: 0 0 14px; font-size: 14px; color: #1f1f1f;">
            Se registró un ingreso a tu cuenta en Financiero.
        </p>
        <p style="margin: 0 0 14px; font-size: 14px; color: #1f1f1f;">
            <strong>Fecha y hora:</strong> {fecha_hora_ingreso}
        </p>
        <p style="margin: 0; font-size: 14px; color: #1f1f1f;">
            Si no reconoces esta actividad, te recomendamos cambiar tu contraseña de inmediato.
        </p>
        """
    )

    if usuario.email:
        enviar_correo(usuario.email, asunto, mensaje)
        enviar_correo(usuario.email, asunto_notificacion_ingreso, mensaje_notificacion_ingreso)

    db.add(
        Notificacion(
            id_usuario=usuario.id_usuario,
            mensaje=f"Se inició sesión correctamente en tu cuenta el {fecha_hora_ingreso}.",
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

@app.get("/usuarios")
def listar_usuarios(
    current_user: int = Depends(administrador_o_asesor_requerido),
    db: Session = Depends(get_db)
):
    usuarios = db.query(Usuario).filter(
        Usuario.rol == "usuario"
    ).order_by(Usuario.id_usuario).all()

    return [
        {
            "id_usuario": usuario.id_usuario,
            "nombre": usuario.nombre,
            "documento": usuario.documento,
            "correo": usuario.email,
            "telefono": usuario.telefono,
            "direccion": usuario.direccion,
            "codigo_registro": usuario.codigo_registro,
            "estado": getattr(usuario, "estado", "activo")
        }
        for usuario in usuarios
    ]


@app.get("/administradores/cuentas")
def listar_cuentas_admin(
    current_user: int = Depends(administrador_o_asesor_requerido),
    db: Session = Depends(get_db)
):
    cuentas = (
        db.query(Cuenta, Usuario)
        .join(Usuario, Usuario.id_usuario == Cuenta.id_usuario)
        .filter(Usuario.rol == "usuario")
        .filter(~Usuario.id_usuario.in_(
            db.query(Administrador.id_usuario)
        ))
        .filter(text(
            "NOT EXISTS ("
            "SELECT 1 FROM asesores_banco asesor "
            "WHERE asesor.id_usuario = usuario.id_usuario"
            ")"
        ))
        .order_by(Cuenta.id_cuenta)
        .all()
    )

    return {
        "cuentas": [
            {
                "id_cuenta": cuenta.id_cuenta,
                "id_usuario": usuario.id_usuario,
                "nombre": usuario.nombre,
                "documento": usuario.documento,
                "rol": usuario.rol,
                "numero_cuenta": cuenta.numero_cuenta,
                "tipo_cuenta": cuenta.tipo_cuenta,
                "tipo_operacion": cuenta.tipo_operacion or "debito",
                "tipos_cuenta": [
                    cuenta_usuario.tipo_cuenta
                    for cuenta_usuario in usuario.cuentas
                ],
                "saldo": float(cuenta.saldo or 0),
                "estado": "activo" if cuenta.estado == "activa" else "inactivo",
            }
            for cuenta, usuario in cuentas
        ]
    }


@app.post("/usuarios/{id_usuario}/cuentas")
def crear_cuenta_usuario(
    id_usuario: int,
    datos: NuevaCuenta,
    current_user: int = Depends(administrador_o_asesor_requerido),
    db: Session = Depends(get_db)
):
    tipo_cuenta = datos.tipo_cuenta.strip().lower()

    opcion_cuenta = (datos.opcion_cuenta or tipo_cuenta).strip().lower()
    if opcion_cuenta not in {"ahorros", "credito"}:
        raise HTTPException(
            status_code=400,
            detail="La opción debe ser ahorros o crédito."
        )

    tipo_cuenta = "ahorros" if opcion_cuenta == "ahorros" else "corriente"
    tipo_operacion = "credito" if opcion_cuenta == "credito" else "debito"
    if datos.tipo_operacion.strip().lower() not in {"debito", "credito"}:
        raise HTTPException(
            status_code=400,
            detail="El tipo de operación debe ser débito o crédito."
        )

    if datos.saldo < 0:
        raise HTTPException(
            status_code=400,
            detail="El saldo no puede ser negativo."
        )

    usuario = db.query(Usuario).filter(
        Usuario.id_usuario == id_usuario,
        Usuario.rol == "usuario",
        ~Usuario.id_usuario.in_(db.query(Administrador.id_usuario)),
        text(
            "NOT EXISTS ("
            "SELECT 1 FROM asesores_banco asesor "
            "WHERE asesor.id_usuario = usuario.id_usuario"
            ")"
        )
    ).first()

    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    cuenta_existente = db.query(Cuenta).filter(
        Cuenta.id_usuario == id_usuario,
        Cuenta.tipo_cuenta == tipo_cuenta
    ).first()

    if cuenta_existente:
        if opcion_cuenta == "credito" and tipo_cuenta == "corriente":
            cuenta_existente.tipo_operacion = "credito"
            cuenta_existente.saldo = Decimal(str(datos.saldo))
            cuenta_existente.estado = "activa"
            db.commit()
            db.refresh(cuenta_existente)
            return {
                "mensaje": "La cuenta principal fue configurada como crédito.",
                "id_cuenta": cuenta_existente.id_cuenta,
                "id_usuario": usuario.id_usuario,
                "nombre": usuario.nombre,
                "numero_cuenta": cuenta_existente.numero_cuenta,
                "tipo_cuenta": cuenta_existente.tipo_cuenta,
                "tipo_operacion": cuenta_existente.tipo_operacion,
                "saldo": float(cuenta_existente.saldo or 0),
                "estado": cuenta_existente.estado
            }
        raise HTTPException(
            status_code=400,
            detail=f"El usuario ya tiene una cuenta {tipo_cuenta}."
        )

    cuenta = Cuenta(
        id_usuario=id_usuario,
        numero_cuenta=generar_numero_cuenta(db),
        tipo_cuenta=tipo_cuenta,
        tipo_operacion=tipo_operacion,
        saldo=Decimal(str(datos.saldo)),
        estado="activa"
    )
    db.add(cuenta)
    db.commit()
    db.refresh(cuenta)

    return {
        "mensaje": "Cuenta creada correctamente.",
        "id_cuenta": cuenta.id_cuenta,
        "id_usuario": usuario.id_usuario,
        "nombre": usuario.nombre,
        "numero_cuenta": cuenta.numero_cuenta,
        "tipo_cuenta": cuenta.tipo_cuenta,
        "tipo_operacion": cuenta.tipo_operacion,
        "saldo": float(cuenta.saldo or 0),
        "estado": cuenta.estado
    }


@app.get("/usuarios/{id_usuario}/cuentas")
def listar_cuentas_usuario(
    id_usuario: int,
    current_user: int = Depends(administrador_o_asesor_requerido),
    db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(
        Usuario.id_usuario == id_usuario,
        Usuario.rol == "usuario",
        ~Usuario.id_usuario.in_(
            db.query(Administrador.id_usuario)
        ),
        text(
            "NOT EXISTS ("
            "SELECT 1 FROM asesores_banco asesor "
            "WHERE asesor.id_usuario = usuario.id_usuario"
            ")"
        )
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    cuentas = db.query(Cuenta).filter(
        Cuenta.id_usuario == id_usuario
    ).order_by(Cuenta.id_cuenta).all()

    return {
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

@app.get("/tarjeta")
def consultar_tarjeta(
    current_user: int = Depends(token_required),
    db: Session = Depends(get_db)
):
    cuenta = db.query(Cuenta).filter(
        Cuenta.id_usuario == current_user,
        Cuenta.tipo_cuenta == "corriente"
    ).order_by(Cuenta.id_cuenta).first()

    if not cuenta:
        raise HTTPException(
            status_code=404,
            detail="No tienes una cuenta corriente asociada."
        )

    tarjeta = db.query(Tarjeta).filter(
        Tarjeta.id_cuenta == cuenta.id_cuenta
    ).first()

    if not tarjeta:
        numero_tarjeta = f"{secrets.randbelow(10**16):016d}"
        while db.query(Tarjeta).filter(
            Tarjeta.numero_tarjeta == numero_tarjeta
        ).first():
            numero_tarjeta = f"{secrets.randbelow(10**16):016d}"

        fecha_expiracion = (
            f"{secrets.randbelow(12) + 1:02d}/"
            f"{str(datetime.utcnow().year + 5)[-2:]}"
        )
        codigo_seguridad = f"{secrets.randbelow(1000):03d}"

        tarjeta = Tarjeta(
            id_cuenta=cuenta.id_cuenta,
            numero_tarjeta=numero_tarjeta,
            fecha_expiracion=fecha_expiracion,
            codigo_seguridad=codigo_seguridad,
            estado="bloqueada" if cuenta.estado == "bloqueada" else "activa"
        )
        db.add(tarjeta)
        db.commit()
        db.refresh(tarjeta)

    if not tarjeta.fecha_expiracion or not tarjeta.codigo_seguridad:
        tarjeta.fecha_expiracion = tarjeta.fecha_expiracion or (
            f"{secrets.randbelow(12) + 1:02d}/"
            f"{str(datetime.utcnow().year + 5)[-2:]}"
        )
        tarjeta.codigo_seguridad = tarjeta.codigo_seguridad or f"{secrets.randbelow(1000):03d}"
        db.commit()
        db.refresh(tarjeta)

    estado = "bloqueada" if cuenta.estado == "bloqueada" else tarjeta.estado

    return {
        "id_tarjeta": tarjeta.id_tarjeta,
        "ultimos_digitos": str(tarjeta.numero_tarjeta)[-6:],
        "ultimos_tres": str(tarjeta.numero_tarjeta)[-3:],
        "fecha_expiracion": tarjeta.fecha_expiracion,
        "codigo_seguridad": tarjeta.codigo_seguridad,
        "numero_cuenta": cuenta.numero_cuenta,
        "tipo_cuenta": cuenta.tipo_cuenta,
        "estado": estado
    }


@app.put("/tarjeta/bloquear")
def bloquear_tarjeta(
    datos: ConfirmarContrasena,
    current_user: int = Depends(token_required),
    db: Session = Depends(get_db)
):
    usuario = db.query(Usuario).filter(
        Usuario.id_usuario == current_user
    ).first()

    if not usuario or not check_password(datos.password, usuario.password):
        raise HTTPException(
            status_code=401,
            detail="La contraseña es incorrecta."
        )

    cuenta = db.query(Cuenta).filter(
        Cuenta.id_usuario == current_user,
        Cuenta.tipo_cuenta == "corriente"
    ).order_by(Cuenta.id_cuenta).first()

    if not cuenta:
        raise HTTPException(
            status_code=404,
            detail="No tienes una cuenta corriente asociada."
        )

    tarjeta = db.query(Tarjeta).filter(
        Tarjeta.id_cuenta == cuenta.id_cuenta
    ).first()

    if tarjeta:
        tarjeta.estado = "bloqueada"
    cuenta.estado = "bloqueada"
    db.commit()

    return {
        "mensaje": "La tarjeta y la cuenta corriente fueron bloqueadas correctamente.",
        "estado": "bloqueada"
    }


@app.put("/tarjeta/desbloquear")
def desbloquear_tarjeta(
    current_user: int = Depends(token_required),
    db: Session = Depends(get_db)
):
    cuenta = db.query(Cuenta).filter(
        Cuenta.id_usuario == current_user,
        Cuenta.tipo_cuenta == "corriente"
    ).order_by(Cuenta.id_cuenta).first()

    if not cuenta:
        raise HTTPException(
            status_code=404,
            detail="No tienes una cuenta corriente asociada."
        )

    tarjeta = db.query(Tarjeta).filter(
        Tarjeta.id_cuenta == cuenta.id_cuenta
    ).first()

    if tarjeta:
        tarjeta.estado = "activa"
    cuenta.estado = "activa"
    db.commit()

    return {
        "mensaje": "La tarjeta y la cuenta corriente fueron desbloqueadas correctamente.",
        "estado": "activa"
    }

@app.get("/cuentas/mis-cuentas")
def mis_cuentas(

    current_user: int = Depends(token_required),

    db: Session = Depends(get_db)

):

    cuentas = db.query(Cuenta).filter(

        Cuenta.id_usuario == current_user,
        Cuenta.tipo_cuenta == "corriente"

    ).order_by(

        Cuenta.id_cuenta

    ).all()

    usuario = db.query(Usuario).filter(
        Usuario.id_usuario == current_user
    ).first()

    return [

        {

            "id_cuenta":
            cuenta.id_cuenta,

            "numero_cuenta":
            cuenta.numero_cuenta,

            "nombre":
            usuario.nombre if usuario else "",

            "tipo_cuenta":
            cuenta.tipo_cuenta,

            "saldo":
            float(cuenta.saldo or 0),

            "estado":
            cuenta.estado

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

@app.get("/asesor-bancario/usuarios")
def asesor_listar_usuarios(
    asesor: Usuario = Depends(asesor_requerido),
    db: Session = Depends(get_db)
):
    usuarios = db.query(Usuario).filter(
        Usuario.rol == "usuario"
    ).order_by(
        Usuario.fecha_creacion.desc(),
        Usuario.id_usuario.desc()
    ).all()

    return [
        {
            "id_usuario": usuario.id_usuario,
            "nombre": usuario.nombre,
            "codigo_registro": usuario.codigo_registro,
            "fecha_creacion": usuario.fecha_creacion.isoformat()
            if usuario.fecha_creacion else None
        }
        for usuario in usuarios
    ]

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


@app.put("/administradores/cuenta/{id_cuenta}/saldo")
def administrador_actualizar_saldo(
    id_cuenta: int,
    datos: SaldoCuentaAutorizado,
    current_user: int = Depends(administrador_o_asesor_requerido),
    db: Session = Depends(get_db)
):
    if datos.saldo < 0:
        raise HTTPException(
            status_code=400,
            detail="El saldo no puede ser negativo."
        )

    codigo = datos.codigo_autorizacion.strip()
    codigo_administrador = db.query(Administrador).filter(
        Administrador.codigo_administrador == codigo
    ).first()
    codigo_asesor = db.execute(
        text(
            """
            SELECT id_asesor
            FROM asesores_banco
            WHERE codigo_asesor = :codigo
              AND estado = 'activo'
            LIMIT 1
            """
        ),
        {"codigo": codigo},
    ).first()

    if not codigo_administrador and not codigo_asesor:
        raise HTTPException(
            status_code=401,
            detail="El código de administrador o asesor no es válido."
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


@app.put("/administradores/cuenta/{id_cuenta}/tipo-operacion")
def administrador_actualizar_tipo_operacion(
    id_cuenta: int,
    datos: TipoOperacionCuentaAutorizada,
    current_user: int = Depends(administrador_o_asesor_requerido),
    db: Session = Depends(get_db)
):
    tipo_operacion = datos.tipo_operacion.strip().lower()
    if tipo_operacion not in {"debito", "credito"}:
        raise HTTPException(
            status_code=400,
            detail="El tipo de operación debe ser débito o crédito."
        )

    codigo = datos.codigo_autorizacion.strip()
    codigo_administrador = db.query(Administrador).filter(
        Administrador.codigo_administrador == codigo
    ).first()
    codigo_asesor = db.execute(
        text(
            """
            SELECT id_asesor
            FROM asesores_banco
            WHERE codigo_asesor = :codigo
              AND estado = 'activo'
            LIMIT 1
            """
        ),
        {"codigo": codigo},
    ).first()

    if not codigo_administrador and not codigo_asesor:
        raise HTTPException(
            status_code=401,
            detail="El código de administrador o asesor no es válido."
        )

    cuenta = db.query(Cuenta).filter(
        Cuenta.id_cuenta == id_cuenta
    ).first()

    if not cuenta:
        raise HTTPException(
            status_code=404,
            detail="Cuenta no encontrada."
        )

    cuenta.tipo_operacion = tipo_operacion
    db.commit()
    db.refresh(cuenta)

    return {
        "mensaje": "Tipo de operación actualizado correctamente.",
        "id_cuenta": cuenta.id_cuenta,
        "tipo_operacion": cuenta.tipo_operacion,
        "tipo_cuenta": cuenta.tipo_cuenta,
        "estado": cuenta.estado
    }


@app.put("/administradores/cuenta/{id_cuenta}/ultimos-digitos")
def administrador_actualizar_ultimos_digitos(
    id_cuenta: int,
    datos: UltimosDigitosCuentaAutorizada,
    current_user: int = Depends(administrador_o_asesor_requerido),
    db: Session = Depends(get_db)
):
    codigo = datos.codigo_autorizacion.strip()
    codigo_administrador = db.query(Administrador).filter(
        Administrador.codigo_administrador == codigo
    ).first()
    codigo_asesor = db.execute(
        text(
            """
            SELECT id_asesor
            FROM asesores_banco
            WHERE codigo_asesor = :codigo
              AND estado = 'activo'
            LIMIT 1
            """
        ),
        {"codigo": codigo},
    ).first()

    if not codigo_administrador and not codigo_asesor:
        raise HTTPException(
            status_code=401,
            detail="El código de administrador o asesor no es válido."
        )

    cuenta = db.query(Cuenta).filter(
        Cuenta.id_cuenta == id_cuenta
    ).first()

    if not cuenta:
        raise HTTPException(
            status_code=404,
            detail="Cuenta no encontrada."
        )

    try:
        numero_nuevo = formatear_numero_cuenta(
            cuenta.numero_cuenta,
            datos.ultimos_digitos
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    numero_existente = (
        db.query(Cuenta.id_cuenta)
        .filter(
            Cuenta.numero_cuenta == numero_nuevo,
            Cuenta.id_cuenta != id_cuenta
        )
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


@app.post("/administradores/cuenta/{id_cuenta}/autorizar-tipo-operacion")
def autorizar_edicion_tipo_operacion(
    id_cuenta: int,
    datos: CodigoAutorizacion,
    current_user: int = Depends(administrador_o_asesor_requerido),
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

    if cuenta.tipo_cuenta != "corriente":
        raise HTTPException(
            status_code=400,
            detail="El tipo de operación solo aplica a cuentas corrientes."
        )

    codigo = datos.codigo_autorizacion.strip()
    codigo_administrador = db.query(Administrador).filter(
        Administrador.codigo_administrador == codigo
    ).first()
    codigo_asesor = db.execute(
        text(
            """
            SELECT id_asesor
            FROM asesores_banco
            WHERE codigo_asesor = :codigo
              AND estado = 'activo'
            LIMIT 1
            """
        ),
        {"codigo": codigo},
    ).first()

    if not codigo_administrador and not codigo_asesor:
        raise HTTPException(
            status_code=401,
            detail="El código de administrador o asesor no es válido."
        )

    return {
        "mensaje": "Código autorizado correctamente.",
        "id_cuenta": cuenta.id_cuenta,
        "autorizado": True
    }


@app.post("/administradores/cuenta/{id_cuenta}/autorizar-ultimos-digitos")
def autorizar_edicion_ultimos_digitos(
    id_cuenta: int,
    datos: CodigoAutorizacion,
    current_user: int = Depends(administrador_o_asesor_requerido),
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

    codigo = datos.codigo_autorizacion.strip()
    codigo_administrador = db.query(Administrador).filter(
        Administrador.codigo_administrador == codigo
    ).first()
    codigo_asesor = db.execute(
        text(
            """
            SELECT id_asesor
            FROM asesores_banco
            WHERE codigo_asesor = :codigo
              AND estado = 'activo'
            LIMIT 1
            """
        ),
        {"codigo": codigo},
    ).first()

    if not codigo_administrador and not codigo_asesor:
        raise HTTPException(
            status_code=401,
            detail="El código de administrador o asesor no es válido."
        )

    return {
        "mensaje": "Código autorizado correctamente.",
        "id_cuenta": cuenta.id_cuenta,
        "autorizado": True
    }


@app.post("/administradores/cuenta/{id_cuenta}/autorizar-saldo")
def autorizar_edicion_saldo(
    id_cuenta: int,
    datos: CodigoAutorizacion,
    current_user: int = Depends(administrador_o_asesor_requerido),
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

    codigo = datos.codigo_autorizacion.strip()
    codigo_administrador = db.query(Administrador).filter(
        Administrador.codigo_administrador == codigo
    ).first()
    codigo_asesor = db.execute(
        text(
            """
            SELECT id_asesor
            FROM asesores_banco
            WHERE codigo_asesor = :codigo
              AND estado = 'activo'
            LIMIT 1
            """
        ),
        {"codigo": codigo},
    ).first()

    if not codigo_administrador and not codigo_asesor:
        raise HTTPException(
            status_code=401,
            detail="El código de administrador o asesor no es válido."
        )

    return {
        "mensaje": "Código autorizado correctamente.",
        "id_cuenta": cuenta.id_cuenta,
        "autorizado": True
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

    payload = data or {}

    llave = payload.get("llave")
    id_cuenta = payload.get("id_cuenta")

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

    if not id_cuenta:

        raise HTTPException(
            status_code=400,
            detail="Debe seleccionar una cuenta activa."
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

        Cuenta.id_cuenta ==
        id_cuenta,

        Cuenta.id_usuario ==
        current_user,

        Cuenta.estado ==
        "activa"

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