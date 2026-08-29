import re

from Backend.main import generar_numero_cuenta, formatear_numero_cuenta


def test_generar_numero_cuenta_tiene_16_digitos():
    numero = generar_numero_cuenta()

    assert isinstance(numero, str)
    assert re.fullmatch(r"\d{16}", numero)
    assert len(numero) == 16


def test_formatear_numero_cuenta_actualiza_ultimos_4_digitos():
    numero = "1234567890123456"
    actualizado = formatear_numero_cuenta(numero, "9876")

    assert actualizado == "1234567890129876"
    assert len(actualizado) == 16
    assert re.fullmatch(r"\d{16}", actualizado)
