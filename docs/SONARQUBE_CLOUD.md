# SonarQube Cloud

## Configuración de análisis

El análisis se ejecuta desde `.github/workflows/ci.yml`, después de que pasen las pruebas y se publiquen los reportes de cobertura. Ese workflow es la única fuente de análisis CI; evita competir con el workflow Sonar heredado.

`sonar-project.properties` identifica el proyecto `mateus2041_financiero` y la organización `mateus2041`. El análisis descarga `coverage.xml` y `Frontend/coverage/lcov.info` desde los artefactos generados por los jobs backend y frontend.

En GitHub, el repositorio debe tener configurado el secreto `SONAR_TOKEN`. No lo almacene en el repositorio ni lo imprima en los logs.

## Acción manual requerida en SonarQube Cloud

La ejecución #59 del workflow CI falló con este mensaje:

> You are running CI analysis while Automatic Analysis is enabled. Please consider disabling one or the other.

El scanner conectó con SonarQube Cloud, cargó el proyecto y sus reglas, detectó el vínculo GitHub como `BOUND` y reconoció `main`. El fallo ocurre porque el proyecto tiene **Automatic Analysis** y **CI-based analysis** activos simultáneamente; no es un error de código de salida aislado.

En SonarQube Cloud, abra la configuración del proyecto `mateus2041_financiero`, vaya a **Administration > Analysis Method** y desactive **Automatic Analysis** para dejar como método de análisis el workflow de GitHub Actions. La ubicación exacta puede variar con la interfaz. No active ambos métodos en paralelo.

No se puede cambiar esta opción desde este repositorio. Después del cambio en SonarQube Cloud, vuelva a ejecutar el workflow **CI** y confirme que el job **SonarQube Cloud** finalice correctamente.

## Comprobaciones de la ejecución #59

- `SONAR_TOKEN` fue proporcionado al action y el scanner pudo comunicarse con el servicio y cargar los ajustes del proyecto. El valor se mantiene oculto en los logs.
- La configuración define `sonar.organization=mateus2041`; el servidor resolvió `mateus2041_financiero` y cargó sus ajustes sin error de organización o proyecto.
- El vínculo al repositorio GitHub aparece como `BOUND`; la rama `main` se detectó correctamente.
- El scanner CLI 8.5.0.16571 aprovisionó Java 21.0.13.1 automáticamente, sin un error de compatibilidad.
- Los reportes de cobertura de ambos jobs se generaron, cargaron como artefactos y se descargaron antes del análisis.
- El análisis se detuvo antes de procesar archivos, importar cobertura o publicar resultados; esta ejecución no permite confirmar el Quality Gate ni los permisos finales de análisis del token.
