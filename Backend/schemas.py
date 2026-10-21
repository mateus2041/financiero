from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import AliasChoices, BaseModel, ConfigDict, EmailStr, Field


class SchemaBase(BaseModel):
    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)


class UsuarioRegistroSchema(SchemaBase):
    nombre: str = Field(min_length=3, max_length=100)
    email: EmailStr
    documento: str = Field(min_length=5, max_length=50, pattern=r"^\d+$")
    password: str = Field(min_length=8, max_length=128)
    telefono: str = Field(min_length=7, max_length=20)
    tipo_documento: Literal["cc", "ti", "ce"]
    direccion: str = Field(min_length=1, max_length=200)
    ciudad: str = Field(min_length=1, max_length=100)
    localidad: str = Field(min_length=1, max_length=100)
    barrio: str = Field(min_length=1, max_length=100)
    codigo_correspondencia: str = Field(
        min_length=6,
        max_length=6,
        pattern=r"^\d{6}$",
        validation_alias=AliasChoices("codigo_correspondencia", "codigo_postal"),
    )
    codigo_autorizacion: str | None = None
    especialidad: str | None = Field(default=None, max_length=100)


class UsuarioLoginSchema(SchemaBase):
    documento: str = Field(min_length=1, max_length=50)
    password: str = Field(min_length=1, max_length=128)
    rol: Literal["usuario", "asesor"] = "usuario"


class AsesorLoginSchema(SchemaBase):
    email: EmailStr
    codigo_asesor: str = Field(min_length=1, max_length=30)


class AdministradorLoginSchema(SchemaBase):
    documento: str = Field(min_length=1, max_length=50)
    codigo_administrador: str = Field(min_length=1, max_length=30)


class UsuarioActualizacionSchema(SchemaBase):
    nombre: str | None = Field(default=None, min_length=3, max_length=100)
    email: EmailStr | None = Field(
        default=None,
        validation_alias=AliasChoices("email", "correo"),
    )
    telefono: str | None = Field(default=None, max_length=20)
    direccion: str | None = Field(default=None, max_length=200)
    codigo_postal: str | None = Field(default=None, max_length=6)
    ciudad: str | None = Field(default=None, max_length=100)
    localidad: str | None = Field(default=None, max_length=100)
    barrio: str | None = Field(default=None, max_length=100)


class PerfilActualizacionSchema(UsuarioActualizacionSchema):
    password: str = Field(min_length=1, max_length=128)
    tope_ahorros: Decimal | None = Field(default=None, ge=0)
    tope_corriente: Decimal | None = Field(default=None, ge=0)


class NuevaCuenta(SchemaBase):
    tipo_cuenta: Literal["ahorros", "corriente"]
    tipo_operacion: Literal["debito", "credito"] = "debito"
    opcion_cuenta: Literal["ahorros", "credito"] | None = None
    saldo: Decimal = Field(default=Decimal("0"), ge=0)


class TransaccionSchema(SchemaBase):
    id_transaccion: int | None = None
    id_cuenta: int = Field(gt=0)
    tipo: Literal["Ingreso", "Gasto", "Transferencia"]
    monto: Decimal = Field(gt=0)
    descripcion: str | None = Field(default=None, max_length=255)
    fecha: datetime | None = None


class AsesorRegistroSchema(SchemaBase):
    nombre: str = Field(min_length=1, max_length=100)
    documento: str = Field(min_length=1, max_length=50)
    tipo_documento: str = Field(min_length=1, max_length=50)
    cargo: str | None = Field(default=None, max_length=100)
    email: EmailStr
    documento_adicional: str | None = None


class AsesorActualizacionSchema(AsesorRegistroSchema):
    id_asesor: int = Field(gt=0)
    codigo_asesor: str = Field(min_length=1, max_length=30)
    estado: Literal["activo", "inactivo"] | None = None


class TransferenciaSchema(SchemaBase):
    origen: str = Field(min_length=1, max_length=50)
    destino: int = Field(gt=0)
    monto: Decimal = Field(gt=0)
    descripcion: str = Field(default="", max_length=255)


class TransferenciaEntreCuentasSchema(SchemaBase):
    origen: str = Field(min_length=1, max_length=50)
    destino: str = Field(min_length=1, max_length=50)
    monto: Decimal = Field(gt=0)
    descripcion: str = Field(default="", max_length=255)


class RegistrarLlaveSchema(SchemaBase):
    llave: str = Field(min_length=1, max_length=100)
    tipo_llave: Literal["documento", "celular", "correo", "alfanumerica"]
    id_cuenta: int = Field(gt=0)


class TransferenciaBreBSchema(SchemaBase):
    origen: str = Field(min_length=1, max_length=50)
    llave_destino: str = Field(min_length=1, max_length=100)
    monto: Decimal = Field(gt=0)
    descripcion: str = Field(default="", max_length=255)


class UsuarioAutenticadoRespuesta(SchemaBase):
    id: int
    nombre: str
    documento: str | None = None
    rol: str


class RegistroRespuesta(SchemaBase):
    message: str
    codigo_registro: str
    usuario: UsuarioAutenticadoRespuesta


class LoginRespuesta(SchemaBase):
    message: str
    codigo_verificacion: str
    token: str
    usuario: UsuarioAutenticadoRespuesta


class UsuarioRespuesta(SchemaBase):
    model_config = ConfigDict(
        extra="ignore",
        str_strip_whitespace=True,
        from_attributes=True,
        populate_by_name=True,
    )

    id_usuario: int
    nombre: str
    documento: str | None = None
    correo: EmailStr = Field(validation_alias=AliasChoices("correo", "email"))
    telefono: str | None = None
    direccion: str | None = None
    codigo_postal: str | None = None
    ciudad: str | None = None
    localidad: str | None = None
    barrio: str | None = None
    codigo_registro: str | None = None
    estado: str = "activo"
    fecha_creacion: datetime | None = None


class CuentaRespuesta(SchemaBase):
    model_config = ConfigDict(extra="ignore", from_attributes=True)

    id_cuenta: int
    id_usuario: int
    numero_cuenta: str | None = None
    tipo_cuenta: str
    tipo_operacion: str
    saldo: Decimal
    estado: str


class TransaccionRespuesta(TransaccionSchema):
    model_config = ConfigDict(extra="ignore", from_attributes=True)


class AsesorRespuesta(SchemaBase):
    model_config = ConfigDict(extra="ignore", from_attributes=True)

    id_asesor: int
    nombre: str | None = None
    documento: str | None = None
    tipo_documento: str | None = None
    email: EmailStr | None = None
    cargo: str | None = None
    codigo_asesor: str
    estado: str
    fecha_ingreso: datetime | None = None


class AsesoresRespuesta(SchemaBase):
    asesores: list[AsesorRespuesta]


class CuentaAdministradorRespuesta(CuentaRespuesta):
    nombre: str
    documento: str | None = None
    rol: str
    tipos_cuenta: list[str]
    fecha_estado: datetime | None = None


class CuentasAdministradorRespuesta(SchemaBase):
    cuentas: list[CuentaAdministradorRespuesta]


class AdministradorRespuesta(SchemaBase):
    model_config = ConfigDict(extra="ignore", from_attributes=True)

    id_administrador: int
    id_usuario: int | None = None
    codigo_administrador: str
    fecha_ingreso: datetime