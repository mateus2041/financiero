from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum, DECIMAL
from sqlalchemy.orm import relationship
from Backend.dependencias import Base


# =========================
# USUARIO
# =========================
class Usuario(Base):
    __tablename__ = "usuarios"

    id_usuario = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    telefono = Column(String(20))
    direccion = Column(String(200))
    documento = Column(String(50), unique=True)

    # RELACIONES
    transacciones = relationship(
        "Transaccion",
        back_populates="usuario"
    )

    cuentas = relationship(
        "Cuenta",
        back_populates="usuario"
    )


# =========================
# TRANSACCIONES
# =========================
class Transaccion(Base):
    __tablename__ = "transacciones"

    id = Column(Integer, primary_key=True, index=True)

    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id_usuario")
    )

    tipo = Column(String(50))
    monto = Column(Float)
    descripcion = Column(String(200))

    # RELACIÓN INVERSA
    usuario = relationship(
        "Usuario",
        back_populates="transacciones"
    )


# =========================
# CUENTAS
# =========================
class Cuenta(Base):
    __tablename__ = "cuentas"

    id_cuenta = Column(Integer, primary_key=True, index=True)

    id_usuario = Column(
        Integer,
        ForeignKey("usuarios.id_usuario")
    )

    tipo_cuenta = Column(
        Enum("ahorros", "corriente"),
        nullable=False
    )

    saldo = Column(
        DECIMAL(15, 2),
        default=0
    )

    estado = Column(
        Enum("activa", "inactiva", "bloqueada"),
        default="activa"
    )

    # RELACIÓN INVERSA
    usuario = relationship(
        "Usuario",
        back_populates="cuentas"
    )
