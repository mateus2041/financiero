from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from Backend.database.database import SessionLocal
from Backend.models import Usuario, Cuenta

router = APIRouter(
    prefix="/asesor-bancario",
    tags=["Asesor Bancario"]
)


# ============================================================
# CONEXIÓN A BASE DE DATOS
# ============================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============================================================
# CONSULTAR USUARIO Y SUS CUENTAS
# ============================================================

@router.get("/usuario/{documento}")
def consultar_usuario(
    documento: str,
    db: Session = Depends(get_db)
):
    usuario = (
        db.query(Usuario)
        .filter(Usuario.documento == documento)
        .first()
    )

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    cuentas = (
        db.query(Cuenta)
        .filter(Cuenta.id_usuario == usuario.id_usuario)
        .all()
    )

    return {
        "usuario": {
            "id_usuario": usuario.id_usuario,
            "nombre": usuario.nombre,
            "documento": usuario.documento
        },
        "cuentas": [
            {
                "id_cuenta": cuenta.id_cuenta,
                "numero_cuenta": cuenta.numero_cuenta,
                "tipo_cuenta": cuenta.tipo_cuenta,
                "saldo": float(cuenta.saldo),
                "estado": cuenta.estado
            }
            for cuenta in cuentas
        ]
    }


# ============================================================
# HABILITAR UNA CUENTA
# ============================================================

@router.put("/cuenta/{id_cuenta}/habilitar")
def habilitar_cuenta(
    id_cuenta: int,
    db: Session = Depends(get_db)
):
    cuenta = (
        db.query(Cuenta)
        .filter(Cuenta.id_cuenta == id_cuenta)
        .first()
    )

    if not cuenta:
        raise HTTPException(
            status_code=404,
            detail="Cuenta no encontrada"
        )

    if cuenta.estado == "activa":
        return {
            "mensaje": "La cuenta ya se encuentra habilitada",
            "id_cuenta": cuenta.id_cuenta,
            "estado": cuenta.estado
        }

    cuenta.estado = "activa"

    db.commit()
    db.refresh(cuenta)

    return {
        "mensaje": "Cuenta habilitada correctamente",
        "id_cuenta": cuenta.id_cuenta,
        "tipo_cuenta": cuenta.tipo_cuenta,
        "estado": cuenta.estado
    }


# ============================================================
# DESHABILITAR UNA CUENTA
# ============================================================

@router.put("/cuenta/{id_cuenta}/deshabilitar")
def deshabilitar_cuenta(
    id_cuenta: int,
    db: Session = Depends(get_db)
):
    cuenta = (
        db.query(Cuenta)
        .filter(Cuenta.id_cuenta == id_cuenta)
        .first()
    )

    if not cuenta:
        raise HTTPException(
            status_code=404,
            detail="Cuenta no encontrada"
        )

    if cuenta.estado == "inactiva":
        return {
            "mensaje": "La cuenta ya se encuentra deshabilitada",
            "id_cuenta": cuenta.id_cuenta,
            "estado": cuenta.estado
        }

    cuenta.estado = "inactiva"

    db.commit()
    db.refresh(cuenta)

    return {
        "mensaje": "Cuenta deshabilitada correctamente",
        "id_cuenta": cuenta.id_cuenta,
        "tipo_cuenta": cuenta.tipo_cuenta,
        "estado": cuenta.estado
    }


# ============================================================
# HABILITAR TODAS LAS CUENTAS DE UN USUARIO
# ============================================================

@router.put("/usuario/{documento}/habilitar-cuentas")
def habilitar_cuentas_usuario(
    documento: str,
    db: Session = Depends(get_db)
):
    usuario = (
        db.query(Usuario)
        .filter(Usuario.documento == documento)
        .first()
    )

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    cuentas = (
        db.query(Cuenta)
        .filter(Cuenta.id_usuario == usuario.id_usuario)
        .all()
    )

    if not cuentas:
        raise HTTPException(
            status_code=404,
            detail="El usuario no tiene cuentas registradas"
        )

    for cuenta in cuentas:
        cuenta.estado = "activa"

    db.commit()

    return {
        "mensaje": "Todas las cuentas del usuario fueron habilitadas",
        "usuario": usuario.nombre,
        "documento": usuario.documento,
        "cuentas": [
            {
                "id_cuenta": cuenta.id_cuenta,
                "tipo_cuenta": cuenta.tipo_cuenta,
                "estado": cuenta.estado
            }
            for cuenta in cuentas
        ]
    }


# ============================================================
# DESHABILITAR TODAS LAS CUENTAS DE UN USUARIO
# ============================================================

@router.put("/usuario/{documento}/deshabilitar-cuentas")
def deshabilitar_cuentas_usuario(
    documento: str,
    db: Session = Depends(get_db)
):
    usuario = (
        db.query(Usuario)
        .filter(Usuario.documento == documento)
        .first()
    )

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    cuentas = (
        db.query(Cuenta)
        .filter(Cuenta.id_usuario == usuario.id_usuario)
        .all()
    )

    if not cuentas:
        raise HTTPException(
            status_code=404,
            detail="El usuario no tiene cuentas registradas"
        )

    for cuenta in cuentas:
        cuenta.estado = "inactiva"

    db.commit()

    return {
        "mensaje": "Todas las cuentas del usuario fueron deshabilitadas",
        "usuario": usuario.nombre,
        "documento": usuario.documento,
        "cuentas": [
            {
                "id_cuenta": cuenta.id_cuenta,
                "tipo_cuenta": cuenta.tipo_cuenta,
                "estado": cuenta.estado
            }
            for cuenta in cuentas
        ]
    }