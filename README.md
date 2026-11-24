# Billetera Financiera

Aplicación financiera educativa compuesta por React, FastAPI, SQLAlchemy, MySQL y Docker Compose.
El módulo BRE-B disponible es una simulación local; no se conecta ni acredita operación sobre una
red bancaria real.

## Requisitos

- Docker Desktop con Docker Compose v2
- Python 3.12 para ejecución fuera de contenedores
- Node.js 24 y npm 10 o compatible para ejecución fuera de contenedores
- Bash únicamente para scripts de respaldo/restauración

## Inicio local

```powershell
Copy-Item .env.example .env
# Reemplace todos los marcadores por valores seguros
docker compose config --quiet
docker compose up --build -d
docker compose ps
```

URLs locales:

- Aplicación: <http://127.0.0.1:3000>
- API y documentación: <http://127.0.0.1:8000/docs>
- Salud viva: <http://127.0.0.1:8000/health/live>
- Salud lista: <http://127.0.0.1:8000/health/ready>

No use valores de ejemplo como secretos fuera de desarrollo.

## Pruebas

```powershell
python -m pytest Backend/tests -q --cov=Backend --cov-report=term-missing
Set-Location Frontend
npm ci
npm test -- --watchAll=false
npm run build
```

## Operación

- [Operación y despliegue](docs/OPERACION_Y_DESPLIEGUE.md)
- [Manual técnico](docs/GUIA_TECNICA.md)
- [Manual de usuario](docs/MANUAL_USUARIO.md)
- [Calidad ISO 25010](docs/CALIDAD.md)
- [SonarQube Cloud](docs/SONARQUBE_CLOUD.md)
- [Aceptación y entrega](docs/ACEPTACION_Y_ENTREGA.md)
