import pytest
from pydantic import ValidationError

from Backend.main import app
from Backend.schemas import (
    AdministradorLoginSchema,
    AsesorActualizacionSchema,
    AsesorLoginSchema,
    AsesorRegistroSchema,
    AsesoresRespuesta,
    CuentasAdministradorRespuesta,
    LoginRespuesta,
    NuevaCuenta,
    PerfilActualizacionSchema,
    TransferenciaEntreCuentasSchema,
    TransaccionSchema,
    UsuarioLoginSchema,
    UsuarioRegistroSchema,
    UsuarioRespuesta,
)


REGISTRO_VALIDO = {
    "nombre": "Ana Perez",
    "email": "ana@example.com",
    "documento": "1234567890",
    "password": "Segura123",
    "telefono": "3001234567",
    "tipo_documento": "cc",
    "direccion": "Calle 1",
    "ciudad": "Bogota",
    "localidad": "Centro",
    "barrio": "Centro",
    "codigo_correspondencia": "110111",
}


def test_esquema_registro_acepta_payload_del_frontend():
    usuario = UsuarioRegistroSchema.model_validate(REGISTRO_VALIDO)

    assert usuario.codigo_correspondencia == "110111"
    assert usuario.email == "ana@example.com"


def test_esquema_registro_rechaza_correo_y_documento_invalidos():
    with pytest.raises(ValidationError):
        UsuarioRegistroSchema.model_validate({**REGISTRO_VALIDO, "email": "invalido"})

    with pytest.raises(ValidationError):
        UsuarioRegistroSchema.model_validate({**REGISTRO_VALIDO, "documento": "ABC123"})


def test_esquemas_login_y_actualizacion_validan_campos():
    assert UsuarioLoginSchema(documento="12345", password="x", rol="asesor").rol == "asesor"
    assert AsesorLoginSchema(email="asesor@example.com", codigo_asesor="A-123").codigo_asesor == "A-123"
    assert AdministradorLoginSchema(documento="12345", codigo_administrador="ADM-1")
    assert PerfilActualizacionSchema(password="correcta", correo="nuevo@example.com").email == "nuevo@example.com"

    with pytest.raises(ValidationError):
        UsuarioLoginSchema(documento="12345", password="x", rol="administrador")


def test_esquemas_cuenta_transaccion_y_transferencia_rechazan_montos_invalidos():
    with pytest.raises(ValidationError):
        NuevaCuenta(tipo_cuenta="ahorros", saldo=-1)

    with pytest.raises(ValidationError):
        TransaccionSchema(id_cuenta=1, tipo="Ingreso", monto=0)

    with pytest.raises(ValidationError):
        TransferenciaEntreCuentasSchema(
            origen="ahorros",
            destino="corriente",
            monto=-1,
        )


def test_esquemas_de_asesor_validan_correo_y_codigo():
    asesor = AsesorRegistroSchema(
        nombre="Asesor Uno",
        documento="12345",
        tipo_documento="cc",
        email="asesor@example.com",
    )
    actualizacion = AsesorActualizacionSchema(
        id_asesor=1,
        codigo_asesor="ASESOR-1",
        nombre=asesor.nombre,
        documento=asesor.documento,
        tipo_documento=asesor.tipo_documento,
        email=asesor.email,
    )
    assert actualizacion.id_asesor == 1

    with pytest.raises(ValidationError):
        AsesorRegistroSchema(
            nombre="Asesor Uno",
            documento="12345",
            tipo_documento="cc",
            email="invalido",
        )


def test_respuestas_de_autenticacion_se_publican_en_openapi():
    assert app.openapi()
    assert app.openapi_schema["components"]["schemas"]["LoginRespuesta"]
    assert LoginRespuesta.model_fields["token"].is_required()


def test_esquemas_de_respuesta_validan_usuarios_asesores_y_cuentas():
    usuario = UsuarioRespuesta.model_validate(
        {
            "id_usuario": 1,
            "nombre": "Ana Perez",
            "email": "ana@example.com",
        }
    )
    asesores = AsesoresRespuesta.model_validate(
        {
            "asesores": [
                {
                    "id_asesor": 1,
                    "nombre": "Asesor Uno",
                    "email": "asesor@example.com",
                    "codigo_asesor": "ASESOR-1",
                    "estado": "activo",
                }
            ]
        }
    )
    cuentas = CuentasAdministradorRespuesta.model_validate(
        {
            "cuentas": [
                {
                    "id_cuenta": 1,
                    "id_usuario": 2,
                    "nombre": "Ana Perez",
                    "rol": "usuario",
                    "numero_cuenta": "1234567890123456",
                    "tipo_cuenta": "ahorros",
                    "tipo_operacion": "debito",
                    "tipos_cuenta": ["ahorros"],
                    "saldo": "10.00",
                    "estado": "activo",
                }
            ]
        }
    )

    assert usuario.correo == "ana@example.com"
    assert asesores.asesores[0].id_asesor == 1
    assert cuentas.cuentas[0].saldo == 10
