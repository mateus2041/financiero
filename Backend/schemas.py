from marshmallow import Schema, fields, validate


# =========================
# SCHEMA PARA USUARIO
# =========================
class UsuarioSchema(Schema):
    id_usuario = fields.Int(dump_only=True)  # 🔥 coincide con el modelo

    nombre = fields.Str(required=True, validate=validate.Length(min=3))

    correo = fields.Email(required=True)  # 🔥 mejor que Str

    tipo_documento = fields.Str(
        required=True,
        validate=validate.OneOf(["cc", "ti", "ce"])
    )

    numero_documento = fields.Str(
        required=True,
        validate=validate.Length(min=5)
    )

    telefono = fields.Str(
        required=True,
        validate=validate.Length(min=10, max=10)
    )

    password = fields.Str(
        load_only=True,
        required=True,
        validate=validate.Length(min=6)
    )

    fecha_creacion = fields.DateTime(dump_only=True)


# =========================
# SCHEMA PARA TRANSACCION
# =========================
class TransaccionSchema(Schema):
    id_transaccion = fields.Int(dump_only=True)  # 🔥 coincide con el modelo

    id_cuenta = fields.Int(required=True)  # 🔥 corregido (antes usuario_id)

    tipo = fields.Str(
        required=True,
        validate=validate.OneOf(["Ingreso", "Gasto", "Transferencia"])  # 🔥 igual al ENUM
    )

    monto = fields.Float(required=True)

    descripcion = fields.Str(validate=validate.Length(max=255))

    fecha = fields.DateTime(dump_only=True)


# =========================
# SCHEMA PARA CUENTA (EXTRA 🔥)
# =========================
class CuentaSchema(Schema):
    id_cuenta = fields.Int(dump_only=True)

    id_usuario = fields.Int(required=True)

    tipo_cuenta = fields.Str(
        required=True,
        validate=validate.OneOf(["ahorros", "corriente"])
    )

    saldo = fields.Float(dump_only=True)

    estado = fields.Str(
        validate=validate.OneOf(["activa", "inactiva", "bloqueada"])
    )


# =========================
# INSTANCIAS
# =========================
usuario_schema = UsuarioSchema()
usuarios_schema = UsuarioSchema(many=True)

transaccion_schema = TransaccionSchema()
transacciones_schema = TransaccionSchema(many=True)

cuenta_schema = CuentaSchema()
cuentas_schema = CuentaSchema(many=True)