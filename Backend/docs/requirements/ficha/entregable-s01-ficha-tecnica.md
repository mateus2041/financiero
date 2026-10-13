# Entregable S01 — Ficha Técnica y Matriz de Requisitos

| Campo | Valor |
|---|---|
| Proyecto | Billetera Financiera |
| Equipo | Pendiente: los integrantes no están identificados en los archivos revisados. |
| Fecha | 13 de octubre de 2026 |

---

## 1.1 Descripción técnica

Billetera Financiera es una aplicación web académica para gestionar usuarios, cuentas, tarjetas, movimientos, transferencias y notificaciones.
Su arquitectura separa un frontend web de React y una API HTTP desarrollada con FastAPI; la API persiste datos relacionales en MySQL mediante SQLAlchemy.
El proyecto incluye perfiles de usuario, asesor bancario y administrador, además de un endpoint de asistencia con IA cuya disponibilidad depende de configuración externa.
Docker Compose define los servicios de frontend, API, migración y base de datos para el entorno de desarrollo; no se verificó un despliegue productivo.

## 1.2 Inventario de software

| Componente | Función | Versión | Licencia | ¿Genera costo? |
|---|---|---|---|---|
| Python | Runtime de la API y migraciones | 3.12 (`.python-version`; imagen `python:3.12-slim`) | PSF License | No por licencia; sí puede haber costos de infraestructura. |
| FastAPI y Uvicorn | API HTTP y servidor ASGI | 0.142.2 / 0.54.0 (`uv.lock`) | MIT / BSD-3-Clause | No por licencia. |
| SQLAlchemy, Alembic y PyMySQL | ORM, migraciones y conector MySQL | 2.1.4 / 1.20.0 / 1.2.3 (`uv.lock`) | MIT | No por licencia. |
| MySQL Community Server | Base de datos relacional (`mysql:8.4` en Compose) | 8.4; la etiqueta no fija el parche | GPLv2 | La edición Community no tiene tarifa de licencia; alojamiento y soporte pueden tener costo. |
| React y React DOM | Interfaz web | 19.2.7 (`Frontend/package-lock.json`) | MIT | No por licencia. |
| React Router DOM | Navegación del frontend | 7.18.0 (`Frontend/package-lock.json`) | MIT | No por licencia. |
| Node.js | Runtime e imagen de construcción del frontend (`node:22`) | 22 (parche no fijado) | MIT | No por licencia; infraestructura según el entorno. |
| Docker Engine / Docker Compose | Construcción y ejecución de servicios | No fijadas en los archivos revisados | Depende de la distribución instalada | No verificable sin identificar la instalación; Docker Desktop está sujeto a sus términos de uso. |

Las licencias y versiones se tomaron de los manifiestos y archivos de bloqueo presentes. No se encontró un inventario SBOM; antes de una distribución formal deben revisarse también las licencias transitivas y los avisos incluidos en cada imagen.

## 1.3 Sistema operativo del servidor

| Campo | Valor |
|---|---|
| Distribución y versión | Servidor de destino no definido. Propuesta: Ubuntu Server 24.04 LTS; no consta como instalado ni probado. |
| Arquitectura | No fijada para el servidor; confirmar arquitectura compatible con las imágenes Docker al desplegar. |
| Fin de soporte estándar | Mayo de 2029 para Ubuntu 24.04 LTS, según el ciclo oficial de Canonical. |
| Licencia | Distribución compuesta por paquetes de software libre y de código abierto con licencias propias; Ubuntu y Canonical son marcas registradas. |
| Requisitos mínimos oficiales (enlace) | [Requisitos de instalación de Ubuntu Server](https://documentation.ubuntu.com/server/reference/installation/system-requirements/). Verificar los valores aplicables a la versión 24.04 elegida. |

## 1.4 Medición de consumo

No hay mediciones de ejecución registradas en el repositorio. Los valores quedan pendientes: no se deben interpretar como cero ni como resultados de una prueba.

| Servicio | RAM reposo | RAM pico | CPU pico |
|---|---|---|---|
| `db` (MySQL) | Pendiente de medición | Pendiente de medición | Pendiente de medición |
| `backend` (FastAPI) | Pendiente de medición | Pendiente de medición | Pendiente de medición |
| `frontend` (React) | Pendiente de medición | Pendiente de medición | Pendiente de medición |
| `migrate` (tarea temporal) | Pendiente de medición | Pendiente de medición | Pendiente de medición |
| **Total** | Pendiente de medición | Pendiente de medición | Pendiente de medición |

Carga simulada con: no ejecutada; falta una ejecución del proyecto en un servidor Linux y no se encontró un script de carga.

## 1.5 Matriz de requisitos

Los requisitos de capacidad quedan pendientes hasta medir el consumo del stack con una carga representativa. No se asignan cifras estimadas como si fueran resultados; el margen recomendado se calculará sobre la medición real.

| Requisito | Mínimo | Recomendado | Justificación |
|---|---|---|---|
| CPU | Pendiente de medición | Pendiente: pico medido + margen del 30-50 % | Sin medición de CPU no es posible calcular ni justificar vCPU. |
| RAM | Pendiente de medición | Pendiente: RAM pico medida + margen del 30-50 % | Sin medición de RAM no es posible calcular memoria del servidor. |
| Disco | Pendiente: medir imágenes, dependencias, datos y registros | Pendiente: mínimo medido más espacio de crecimiento y copias | No hay tamaños de despliegue ni crecimiento medidos. |
| Tipo de disco / IOPS | No especificado | Propuesta por validar: SSD para el volumen de MySQL; IOPS por medir | El repositorio no declara tipo de disco ni tiene pruebas de I/O. |
| Red | Conectividad TCP entre frontend, API y base de datos | Propuesta: HTTPS detrás de proxy en despliegue; mantener MySQL en red privada | No hay ancho de banda ni latencia objetivo documentados; Compose conecta los servicios en una red interna. |
| Arquitectura | Pendiente de definir y validar en el host | Pendiente de validar con las imágenes y dependencias instaladas | Los archivos no fijan la arquitectura de despliegue. |
| Sistema operativo | Propuesta: Ubuntu Server 24.04 LTS | Propuesta: Ubuntu Server 24.04 LTS actualizado | Es una recomendación, no un entorno medido o ya desplegado; soporte estándar hasta mayo de 2029. |
| Docker / runtime | Docker Engine y Compose compatibles; versiones por definir | Fijar y probar versiones antes del despliegue | Compose y Dockerfiles existen, pero no fijan la versión del motor ni del plugin Compose. |
| Puertos | Frontend `3000`; API `8000`; host `3307` hacia MySQL `3306` | Propuesta: publicar solo el acceso web necesario; mantener MySQL (`3306`) interno | Mapeos tomados de `compose.yml`; la exposición final debe definirse al desplegar. |

Crecimiento estimado de datos: pendiente; no hay volumen de registros mensual ni tamaño promedio documentados.

## 1.6 Plataforma física recomendada

Las siguientes elecciones son propuestas para una instalación en las instalaciones del cliente; deben ajustarse cuando se conozcan la carga, el presupuesto y los requisitos de disponibilidad.

| Decisión | Elección | Justificación |
|---|---|---|
| Formato (torre / rack / blade) | Propuesta: servidor torre empresarial para una instalación pequeña | El repositorio no define centro de datos, número de equipos ni necesidad de alta densidad; confirmar con el cliente. |
| Nivel RAID del servidor de base de datos | Propuesta: RAID 1 con dos unidades; mantener copias de seguridad independientes | El espejo puede tolerar la falla de una unidad, pero no sustituye una copia de seguridad. No hay requisito de disponibilidad ni hardware definido. |
| Plataforma de ejecución (bare metal / VM / contenedores) | Contenedores con Docker Compose (definidos en el repositorio); despliegue real pendiente | `compose.yml` declara frontend, backend, migración y MySQL. No demuestra que ya estén desplegados ni dimensionados. |

## 1.7 Verificación de requisitos

Script: `scripts/verificar-requisitos.sh` (no se encontró en el workspace; ejecución pendiente).

Servidor donde se ejecutó: ninguno registrado. El entorno de trabajo disponible es Windows; no se verificó un servidor Linux.

```
Pendiente: no existe una salida del script para adjuntar. El script no está presente en el workspace y no se ejecutó la verificación en un servidor Linux.
```

Resultado: pendiente. No es posible afirmar cumplimiento sin el script, la ejecución en Linux y las mediciones de recursos. Completar esta sección con la salida real y ajustar los requisitos mínimos y recomendados a partir de esos datos.