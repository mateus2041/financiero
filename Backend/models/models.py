from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Boolean, DECIMAL, Text, CHAR
from sqlalchemy.orm import relationship
from datetime import datetime
from Backend.database import Base


# =========================
# 🔹 TIPO DOCUMENTO
# =========================
class TipoDocumento(Base):
    __tablename__ = "tipo_documento"

    id_tipo_doc = Column(Integer, primary_key=True, index=True)
    nombre_doc = Column(String(50), nullable=False)

    usuarios = relationship("Usuario", back_populates="tipo_doc")


# =========================
# 🔹 USUARIO
# =========================
class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    telefono = Column(String(20))
    direccion = Column(String(200))
    id_tipo_doc = Column(Integer, ForeignKey("tipo_documento.id_tipo_doc"))
    documento = Column(String(50), unique=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)

    tipo_doc = relationship("TipoDocumento", back_populates="usuarios")
    cuentas = relationship("Cuenta", back_populates="usuario")
    notificaciones = relationship("Notificacion", back_populates="usuario")


# =========================
# 🔹 CUENTAS
# =========================
class Cuenta(Base):
    __tablename__ = "cuentas"

    id_cuenta = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)

    tipo_cuenta = Column(
        Enum("ahorros", "corriente", name="tipo_cuenta_enum"),
        nullable=False
    )

    saldo = Column(DECIMAL(15, 2), default=0)
    
    estado = Column(
        Enum("activa", "inactiva", "bloqueada", name="estado_cuenta_enum"),
        default="activa"
    )

    usuario = relationship("Usuario", back_populates="cuentas")
    transacciones = relationship("Transaccion", back_populates="cuenta")
    tarjetas = relationship("Tarjeta", back_populates="cuenta")


# =========================
# 🔹 TRANSACCIONES
# =========================
class Transaccion(Base):
    __tablename__ = "transacciones"

    id_transaccion = Column(Integer, primary_key=True, index=True)
    id_cuenta = Column(Integer, ForeignKey("cuentas.id_cuenta"), nullable=False)

    monto = Column(DECIMAL(15, 2), nullable=False)

    tipo = Column(
        Enum("Ingreso", "Gasto", "Transferencia", name="tipo_transaccion_enum"),
        nullable=False
    )

    fecha = Column(DateTime, default=datetime.utcnow)
    descripcion = Column(Text)

    cuenta = relationship("Cuenta", back_populates="transacciones")


# =========================
# 🔹 NOTIFICACIONES
# =========================
class Notificacion(Base):
    __tablename__ = "notificaciones"

    id_notificacion = Column(Integer, primary_key=True, index=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)

    mensaje = Column(Text, nullable=False)
    leido = Column(Boolean, default=False)
    fecha = Column(DateTime, default=datetime.utcnow)

    usuario = relationship("Usuario", back_populates="notificaciones")


# =========================
# 🔹 TARJETAS
# =========================
class Tarjeta(Base):
    __tablename__ = "tarjetas"

    id_tarjeta = Column(Integer, primary_key=True, index=True)
    id_cuenta = Column(Integer, ForeignKey("cuentas.id_cuenta"), nullable=False)

    numero_tarjeta = Column(CHAR(16), unique=True)

    estado = Column(
        Enum("activa", "bloqueada", "expirada", name="estado_tarjeta_enum"),
        default="activa"
    )

    cuenta = relationship("Cuenta", back_populates="tarjetas")