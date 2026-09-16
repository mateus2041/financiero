from datetime import datetime, timezone

from Backend.main import convertir_a_hora_local


def test_convertir_a_hora_local_usa_hora_de_bogota():
    utc_time = datetime(2026, 9, 16, 12, 0, tzinfo=timezone.utc)

    bogota_time = convertir_a_hora_local(utc_time)

    assert bogota_time.tzinfo.key == "America/Bogota"
    assert bogota_time.isoformat() == "2026-09-16T07:00:00-05:00"
