from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    DateTime,
    Enum,
    Boolean,
    DECIMAL,
    Text,
    CHAR
)

from sqlalchemy.orm import relationship
from datetime import datetime

from Backend.database.database import Base, engine


# =========================================================
# 🔹 TIPO DOCUMENTO
# =========================================================

class TipoDocumento(Base):

    __tablename__ = "tipo_documento"

    id_tipo_doc = Column(
        Integer,
        primary_key=True,
        index=True
    )

    nombre_doc = Column(
        String(50),
        nullable=False
    )

    usuarios = relationship(
        "Usuario",
        back_populates="tipo_doc"
    )


# =========================================================
# 🔹 USUARIO
# =========================================================

class Usuario(Base):

    __tablename__ = "usuario"

    id_usuario = Column(
        Integer,
        primary_key=True,
        index=True
    )

    nombre = Column(
        String(100),
        nullable=False
    )

    email = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )

    password = Column(
        String(255),
        nullable=False
    )

    telefono = Column(
        String(20)
    )

    direccion = Column(
        String(200)
    )

    documento = Column(
        String(50),
        unique=True
    )

    tope_ahorros = Column(
        DECIMAL(15, 2),
        nullable=False,
        default=0
    )

    tope_corriente = Column(
        DECIMAL(15, 2),
        nullable=False,
        default=0
    )

    fecha_creacion = Column(
        DateTime,
        default=datetime.utcnow
    )

    # =====================================================
    # 🔹 RELACIÓN TIPO DOCUMENTO
    # =====================================================

    id_tipo_doc = Column(
        Integer,
        ForeignKey(
            "tipo_documento.id_tipo_doc"
        )
    )

    tipo_doc = relationship(
        "TipoDocumento",
        back_populates="usuarios"
    )

    # =====================================================
    # 🔹 RELACIÓN CUENTAS
    # =====================================================

    cuentas = relationship(
        "Cuenta",
        back_populates="usuario",
        cascade="all, delete-orphan"
    )

    # =====================================================
    # 🔹 RELACIÓN NOTIFICACIONES
    # =====================================================

    notificaciones = relationship(
        "Notificacion",
        back_populates="usuario",
        cascade="all, delete-orphan"
    )

    # =====================================================
    # 🔹 RELACIÓN LLAVES BRE-B
    # =====================================================

    llaves_breb = relationship(
        "LlaveBreb",
        back_populates="usuario",
        cascade="all, delete-orphan"
    )


# =========================================================
# 🔹 CUENTAS
# =========================================================

class Cuenta(Base):

    __tablename__ = "cuentas"

    id_cuenta = Column(
        Integer,
        primary_key=True,
        index=True
    )

    id_usuario = Column(
        Integer,
        ForeignKey(
            "usuario.id_usuario"
        ),
        nullable=False
    )

    tipo_cuenta = Column(
        Enum(
            "ahorros",
            "corriente",
            name="tipo_cuenta_enum"
        ),
        nullable=False
    )

    saldo = Column(
        DECIMAL(15, 2),
        nullable=False,
        default=0
    )

    estado = Column(
        Enum(
            "activa",
            "inactiva",
            "bloqueada",
            name="estado_cuenta_enum"
        ),
        nullable=False,
        default="activa"
    )

    usuario = relationship(
        "Usuario",
        back_populates="cuentas"
    )

    transacciones = relationship(
        "Transaccion",
        back_populates="cuenta",
        cascade="all, delete-orphan"
    )

    tarjetas = relationship(
        "Tarjeta",
        back_populates="cuenta",
        cascade="all, delete-orphan"
    )

    llaves_breb = relationship(
        "LlaveBreb",
        back_populates="cuenta",
        cascade="all, delete-orphan"
    )


# =========================================================
# 🔹 TRANSACCIONES
# =========================================================

class Transaccion(Base):

    __tablename__ = "transacciones"

    id_transaccion = Column(
        Integer,
        primary_key=True,
        index=True
    )

    id_cuenta = Column(
        Integer,
        ForeignKey(
            "cuentas.id_cuenta"
        ),
        nullable=False
    )

    monto = Column(
        DECIMAL(15, 2),
        nullable=False
    )

    tipo = Column(
        Enum(
            "Ingreso",
            "Gasto",
            "Transferencia",
            name="tipo_transaccion_enum"
        ),
        nullable=False
    )

    fecha = Column(
        DateTime,
        default=datetime.utcnow
    )

    descripcion = Column(
        Text
    )

    cuenta = relationship(
        "Cuenta",
        back_populates="transacciones"
    )

    transferencia_breb = relationship(
        "TransferenciaBreb",
        back_populates="transaccion",
        uselist=False,
        cascade="all, delete-orphan"
    )


# =========================================================
# 🔹 NOTIFICACIONES
# =========================================================

class Notificacion(Base):

    __tablename__ = "notificaciones"

    id_notificacion = Column(
        Integer,
        primary_key=True,
        index=True
    )

    id_usuario = Column(
        Integer,
        ForeignKey(
            "usuario.id_usuario"
        ),
        nullable=False
    )

    mensaje = Column(
        Text,
        nullable=False
    )

    leido = Column(
        Boolean,
        nullable=False,
        default=False
    )

    fecha = Column(
        DateTime,
        default=datetime.utcnow
    )

    usuario = relationship(
        "Usuario",
        back_populates="notificaciones"
    )


# =========================================================
# 🔹 TARJETAS
# =========================================================

class Tarjeta(Base):

    __tablename__ = "tarjetas"

    id_tarjeta = Column(
        Integer,
        primary_key=True,
        index=True
    )

    id_cuenta = Column(
        Integer,
        ForeignKey(
            "cuentas.id_cuenta"
        ),
        nullable=False
    )

    numero_tarjeta = Column(
        CHAR(16),
        unique=True
    )

    estado = Column(
        Enum(
            "activa",
            "bloqueada",
            "expirada",
            name="estado_tarjeta_enum"
        ),
        nullable=False,
        default="activa"
    )

    cuenta = relationship(
        "Cuenta",
        back_populates="tarjetas"
    )


# =========================================================
# 🔹 LLAVES BRE-B
# =========================================================

class LlaveBreb(Base):

    __tablename__ = "llaves_breb"

    id_llave = Column(
        Integer,
        primary_key=True,
        index=True
    )

    id_usuario = Column(
        Integer,
        ForeignKey(
            "usuario.id_usuario"
        ),
        nullable=False
    )

    id_cuenta = Column(
        Integer,
        ForeignKey(
            "cuentas.id_cuenta"
        ),
        nullable=False
    )

    tipo_llave = Column(
        Enum(
            "documento",
            "celular",
            "correo",
            "alfanumerica",
            name="tipo_llave_breb_enum"
        ),
        nullable=False
    )

    llave = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )

    estado = Column(
        Enum(
            "activa",
            "inactiva",
            name="estado_llave_breb_enum"
        ),
        nullable=False,
        default="activa"
    )

    fecha_creacion = Column(
        DateTime,
        default=datetime.utcnow
    )

    usuario = relationship(
        "Usuario",
        back_populates="llaves_breb"
    )

    cuenta = relationship(
        "Cuenta",
        back_populates="llaves_breb"
    )

    transferencias = relationship(
        "TransferenciaBreb",
        back_populates="llave_destino"
    )


# =========================================================
# 🔹 TRANSFERENCIAS BRE-B
# =========================================================

class TransferenciaBreb(Base):

    __tablename__ = "transferencias_breb"

    id_transferencia = Column(
        Integer,
        primary_key=True,
        index=True
    )

    id_transaccion = Column(
        Integer,
        ForeignKey(
            "transacciones.id_transaccion"
        ),
        nullable=False,
        unique=True
    )

    id_cuenta_origen = Column(
        Integer,
        ForeignKey(
            "cuentas.id_cuenta"
        ),
        nullable=False
    )

    id_cuenta_destino = Column(
        Integer,
        ForeignKey(
            "cuentas.id_cuenta"
        ),
        nullable=False
    )

    id_llave_destino = Column(
        Integer,
        ForeignKey(
            "llaves_breb.id_llave"
        ),
        nullable=False
    )

    monto = Column(
        DECIMAL(15, 2),
        nullable=False
    )

    descripcion = Column(
        String(255)
    )

    estado = Column(
        Enum(
            "pendiente",
            "procesada",
            "rechazada",
            "cancelada",
            name="estado_transferencia_breb_enum"
        ),
        nullable=False,
        default="pendiente"
    )

    referencia = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )

    fecha_transferencia = Column(
        DateTime,
        default=datetime.utcnow
    )

    transaccion = relationship(
        "Transaccion",
        back_populates="transferencia_breb"
    )

    cuenta_origen = relationship(
        "Cuenta",
        foreign_keys=[id_cuenta_origen]
    )

    cuenta_destino = relationship(
        "Cuenta",
        foreign_keys=[id_cuenta_destino]
    )

    llave_destino = relationship(
        "LlaveBreb",
        back_populates="transferencias"
    )


# =========================================================
# 🔹 CONTROL DE TOPES BRE-B
# =========================================================

class ControlTopeBreb(Base):

    __tablename__ = "control_topes_breb"

    id_control = Column(
        Integer,
        primary_key=True,
        index=True
    )

    id_usuario = Column(
        Integer,
        ForeignKey(
            "usuario.id_usuario"
        ),
        nullable=False
    )

    fecha = Column(
        DateTime,
        default=datetime.utcnow
    )

    total_enviado = Column(
        DECIMAL(15, 2),
        nullable=False,
        default=0
    )

    cantidad_operaciones = Column(
        Integer,
        nullable=False,
        default=0
    )

    usuario = relationship(
        "Usuario"
    )


# =========================================================
# 🔹 CREAR TABLAS
# =========================================================

Base.metadata.create_all(
    bind=engine
)