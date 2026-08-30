from Backend.main import app
from Backend.models import Cuenta


def test_cuenta_tiene_tipo_operacion():
    assert "tipo_operacion" in Cuenta.__table__.columns


def test_existe_ruta_asesor_para_actualizar_tipo_operacion():
    rutas = {
        getattr(ruta, "path", None)
        for ruta in app.router.routes
        if hasattr(ruta, "path")
    }
    assert "/asesor-bancario/cuenta/{id_cuenta}/tipo-operacion" in rutas
