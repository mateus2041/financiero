from sqlalchemy.orm import Session
from Backend.models import Usuario, Cuenta, Transaccion


def obtener_usuario(db: Session, id_usuario: int):

    usuario = (
        db.query(Usuario)
        .filter(
            Usuario.id_usuario == id_usuario
        )
        .first()
    )

    return usuario


def obtener_cuenta(db: Session, id_usuario: int):

    cuenta = (
        db.query(Cuenta)
        .filter(
            Cuenta.id_usuario == id_usuario
        )
        .first()
    )

    return cuenta


def obtener_transacciones(db: Session, id_cuenta: int):

    transacciones = (
        db.query(Transaccion)
        .filter(
            Transaccion.id_cuenta == id_cuenta
        )
        .order_by(
            Transaccion.id_transaccion.desc()
        )
        .limit(5)
        .all()
    )

    return transacciones