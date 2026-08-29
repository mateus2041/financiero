from Backend.models import Cuenta


def test_cuenta_tiene_tipo_operacion():
    assert "tipo_operacion" in Cuenta.__table__.columns
