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
Docker Compose define los servicios de frontend, API y base de datos para desarrollo; no declara un servicio de migración ni se verificó un despliegue productivo. Hay revisiones Alembic, pero su ejecución no está integrada en Compose.

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
| `migrate` (servicio propuesto; no declarado en Compose) | No medido | No medido | No medido |
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
| Plataforma de ejecución (bare metal / VM / contenedores) | Contenedores con Docker Compose (definidos en el repositorio); despliegue real pendiente | `compose.yml` declara frontend, backend y MySQL; existen revisiones Alembic, pero no un servicio Compose de migración. No demuestra que estén desplegados ni dimensionados. |

## 1.7 Verificación de requisitos

Script: `scripts/verificar-requisitos.sh` (no se encontró en el workspace; ejecución pendiente).

Servidor donde se ejecutó: ninguno registrado. El entorno de trabajo disponible es Windows; no se verificó un servidor Linux.

```
Pendiente: no existe una salida del script para adjuntar. El script no está presente en el workspace y no se ejecutó la verificación en un servidor Linux.
```

Resultado: pendiente. No es posible afirmar cumplimiento sin el script, la ejecución en Linux y las mediciones de recursos. Completar esta sección con la salida real y ajustar los requisitos mínimos y recomendados a partir de esos datos.

---

## 2. Auditoría de la lista de chequeo del Trimestre VII

**Fecha de revisión:** 13 de noviembre de 2026

**Instrumento:** *Lista de chequeo Proyecto Trimestre VII FINAL.xlsx*, hoja «Hoja1», criterios 1–12.
**Método:** revisión de este documento y contraste con el código fuente, configuración, modelos, pruebas y documentación disponibles. La revisión no certifica despliegue, aceptación funcional ni operación financiera real.

### 2.1 Resultado ejecutivo

| Estado | Cantidad |
|---|---:|
| COMPLETO con información y evidencia suficiente | 0 de 12 |
| INCOMPLETO: existe información, pero falta completar o validar | 9 |
| FALTANTE: no se encontró evidencia suficiente | 2 |
| NO APLICA, sujeto a confirmar el alcance móvil | 1 |

El backlog disponible contiene 22 elementos: 15 con estado **Parcial / validar**, 7 **Pendiente** y ninguno **Hecho (validado)**. En consecuencia, el avance formalmente validado en ese registro es **0/22 (0 %)**; no representa el porcentaje real de trabajo realizado y no debe presentarse como tal sin validación del equipo. No se encontraron integrantes identificados, URL de despliegue, actas de aceptación, retrospectivas de los cuatro trimestres ni capturas reales de la aplicación.

### 2.2 Revisión individual de los 12 criterios

| # | Dimensión | Criterio | Estado | Evidencia y faltantes |
|---:|---|---|---|---|
| 1 | D1 | Backlog final con avance, justificación de pendientes y retrospectiva de cuatro trimestres | INCOMPLETO | Hay un [backlog de producto](../SprintBacklog.md), pero no tiene porcentajes ni retrospectivas. El registro consultado muestra 0 de 22 tareas como **Hecho (validado)**. El porcentaje de trabajo real, la justificación de lo no alcanzado y las reflexiones T1–T4 deben ser confirmados por el equipo. |
| 2 | D1 | Plan de implantación con secuencia, responsables y criterios de éxito | INCOMPLETO | Hay un [plan de sprints](../sprints.md), pero no un plan de implantación aprobado ni responsables nominales. Se incorpora una secuencia propuesta en la sección 3; se deben asignar responsables y aprobar los criterios. |
| 3 | D2 | Sistema funcionando e integrado: frontend, backend y base de datos | INCOMPLETO | Se identifican React, FastAPI y MySQL en `compose.yml`, pero no hay evidencia de aceptación integral. El build de frontend falló por errores de sintaxis en `Frontend/src/pages/ChatIA.jsx` (línea 81) y `Frontend/src/pages/cuenta.jsx` (línea 51); no se comprobó el sistema integrado contra una base activa. |
| 4 | D2 | Manejo robusto de errores e integridad referencial completa | INCOMPLETO | [Los modelos](../../../models.py) definen claves foráneas para varias relaciones, pero no se verificó que el esquema efectivo y las migraciones mantengan integridad completa. Las pruebas y el build fallan; faltan pruebas sistemáticas de excepciones, rollback, restricciones y consistencia en toda la aplicación. |
| 5 | D2 | Roles/permisos funcionales en frontend y backend; código organizado | INCOMPLETO | Existen controles de rol en algunas rutas, pero la autorización no es consistente: varias operaciones de `Backend/routers/asesor_bancario.py` no declaran dependencia de autenticación/rol. También se observó una clave JWT fija en `Backend/security.py` y CORS permisivo en `Backend/main.py`. Faltan pruebas negativas por rol/titularidad y correcciones antes de cualquier exposición. |
| 6 | D2 | Integración IoT o móvil funcional, si aplica, y justificación | NO APLICA provisional | El alcance observado es una aplicación web; no se encontró integración IoT ni aplicación móvil nativa. Hay componentes/estilos web adaptables a móvil, pero eso no acredita una integración móvil independiente. El equipo debe confirmar que no se exige una app móvil separada. |
| 7 | D3 | Despliegue accesible fuera del entorno local y configuración por ambiente | FALTANTE | `compose.yml` describe servicios locales. No se encontró URL de despliegue, evidencia de un entorno accesible ni configuración separada de desarrollo, pruebas y producción. No declarar despliegue hasta aportar URL y evidencia verificable. |
| 8 | D3 | Manual técnico paso a paso y manual de usuario con capturas reales | INCOMPLETO | Existe una [guía técnica](../../guia-tecnica.md) con pasos propuestos, no validados mediante instalación reproducible. No se encontró manual de usuario ni capturas reales de los flujos; la única imagen localizada es el logo. |
| 9 | D3 | Estrategia de respaldo y proceso de migración, si aplica | INCOMPLETO | [El entregable S02](../../entregable-s02-planes.md) describe una estrategia propuesta, pero contiene marcadores de conflicto. Cita `scripts/respaldar.sh`, archivo que no existe en `scripts/`; no hay respaldo/restauración ejecutados. [La guía Alembic](../../migraciones.md) también tiene conflictos y describe un servicio `migrate` ausente en Compose. |
| 10 | D4 | Plan de calidad con estándares, métricas y análisis estático configurado | INCOMPLETO | Hay casos y recomendaciones en [calidad y pruebas](../../semana-08-calidad-y-pruebas.md), pero no métricas medidas ni configuración identificada de análisis estático backend. `Frontend/package.json` no declara un script `lint`. |
| 11 | D4 | Informe final de pruebas, defectos resueltos y pendientes justificados | INCOMPLETO | Ejecución realizada el 13 de noviembre de 2026: `python -m pytest Backend\tests -q` resultó en **35 aprobadas, 7 fallidas y 36 advertencias**. Se observaron fallos de configuración/tablas SQLite, expectativas de autorización y configuración de integraciones. `npm test -- --watchAll=false` encontró **cero pruebas**. `npm run build` falló por los errores de sintaxis del criterio 3. No se encontró registro que permita afirmar que esos defectos se hayan solucionado. |
| 12 | D5 | Explicación integral por integrante y reflexión final de cuatro trimestres | FALTANTE | No se encontró roster, evidencia de sustentación ni reflexión individual por trimestre. Las plantillas de la sección 4 permiten completar estos datos cuando los confirme cada integrante. |

**Conclusión:** ningún criterio se marca COMPLETO. Los estados describen la evidencia localizada, no una calificación oficial del jurado. El criterio 6 es NO APLICA solo de forma provisional hasta confirmar el alcance.

### 2.3 Evidencia técnica que requiere atención antes de una entrega

- `compose.yml` declara `db`, `backend` y `frontend`; no define un servicio `migrate`. Las instrucciones de migración deben alinearse con esta configuración antes de ejecutar cambios sobre datos persistentes.
- `Backend/models.py` contiene relaciones con claves foráneas, pero el esquema activo no fue inspeccionado ni comparado íntegramente con todas las revisiones Alembic. No afirmar integridad completa sin esa comprobación.
- Los errores actuales del build bloquean validar la compilación del frontend; la ausencia de pruebas frontend impide presentar una suite frontend aprobada.
- La configuración de seguridad observada (dependencias de rol incompletas en el router de asesoría, secreto JWT fijo y CORS permisivo) debe corregirse antes de desplegar o usar información real.
- Los resultados de pruebas de esta sección son una línea base de auditoría. Deben repetirse después de las correcciones y actualizarse con comando, fecha, entorno, resultado y defectos pendientes.

### 2.4 Registro de defectos y pendientes de calidad

| ID | Hallazgo observado | Evidencia / alcance | Estado al cierre de esta auditoría |
|---|---|---|---|
| QA-01 | El build de frontend falla por sintaxis en dos páginas | `Frontend/src/pages/ChatIA.jsx` (línea 81) y `Frontend/src/pages/cuenta.jsx` (línea 51) | Pendiente de corregir y volver a compilar; no se registró solución. |
| QA-02 | Siete pruebas backend fallaron | Tres pruebas de cuentas administrativas, una de estadísticas de asesor, una de acceso al chat, una de configuración LLM y una de correo. La salida incluye errores de tablas/conexiones SQLite; causa raíz por confirmar. | Pendiente de diagnóstico y corrección; no declarar las fallas como resueltas. |
| QA-03 | No hay pruebas frontend detectables | Jest encontró cero pruebas con `npm test -- --watchAll=false`. | Pendiente de crear y ejecutar pruebas de flujos críticos. |
| QA-04 | Documentación de migración/respaldo contradictoria | Marcadores de conflicto en `Backend/docs/entregable-s02-planes.md` y `Backend/docs/migraciones.md`; servicio `migrate` no declarado en Compose. | Pendiente de unificar instrucciones y ensayar el proceso. |

Las métricas mínimas que deben registrarse en la siguiente verificación son: pruebas ejecutadas/aprobadas/fallidas, resultado del build, defectos abiertos/cerrados por severidad, casos de autorización aprobados, resultado de migración y restauración, y resultado del análisis estático una vez configurado. No se fija un umbral de cobertura o disponibilidad sin aprobación del equipo y medición de referencia.

## 3. Plan de implantación propuesto

Esta secuencia es una propuesta documental y no evidencia de que el proyecto se haya implantado. Los responsables se describen por rol; el equipo debe asignar nombres y fechas.

| Paso | Actividad | Responsable por asignar | Criterio de éxito |
|---:|---|---|---|
| 1 | Corregir errores de compilación y estabilizar pruebas backend/frontend | Responsable técnico y desarrolladores | Build correcto; pruebas acordadas ejecutadas y sin fallos bloqueantes; defectos restantes registrados y justificados. |
| 2 | Revisar autorización, secretos, CORS y acceso a datos | Responsable técnico y responsable de seguridad/calidad | Matriz de roles/titularidad aprobada; casos positivos y negativos pasan; configuración no contiene secretos reutilizables ni exposición no aprobada. |
| 3 | Alinear migraciones con Compose y ensayar respaldo/restauración en una base aislada | Responsable de base de datos/operación y validador independiente | Migración comprobada en base vacía y copia preexistente; restauración en base separada y conciliación de tablas/conteos registrada; datos originales intactos. |
| 4 | Desplegar en ambiente de pruebas con configuración independiente | Responsable de operación | URL accesible y registrada; servicios responden a comprobaciones de salud; conectividad, HTTPS y CORS verificados. |
| 5 | Ejecutar aceptación integral y decidir publicación o aplazamiento | Responsable del producto, calidad y responsable técnico | Evidencia reproducible de flujos críticos, defectos bloqueantes corregidos o aceptados formalmente, respaldo y reversión aprobados. |

### 3.1 Controles mínimos de respaldo y migración

1. Identificar y autorizar el ambiente y la base de origen; no incluir credenciales ni datos personales en el informe.
2. Obtener un respaldo de la base antes de cualquier migración y registrar fecha, versión, tamaño y resultado de validación.
3. Ensayar migración y restauración en una base aislada; no marcar una revisión Alembic ni alterar el volumen persistente para eludir errores.
4. Verificar tablas, relaciones, conteos y acceso de la aplicación después de la operación.
5. Registrar resultado, defectos y persona responsable. El ensayo no está ejecutado y no sustituye una política aprobada de frecuencia, retención, cifrado y custodia.

## 4. Información que debe aportar el equipo

### 4.1 Identificación, avance y sustentación

| Dato | Estado / evidencia |
|---|---|
| Ficha, integrantes y roles nominales | Pendiente de confirmación |
| URL del repositorio y URL de despliegue accesible (si existe) | Pendiente de confirmación |
| Porcentaje real de avance y justificación por elemento del backlog | Pendiente; no inferirlo del porcentaje de tareas validadas |
| Responsable nominal y fechas del plan de implantación | Pendiente de aprobación |

| Integrante | Explica frontend, API, base de datos, seguridad y operación | Evidencia de sustentación | Pendientes |
|---|---|---|---|
| Nombre por confirmar | Pendiente | Pendiente | Pendiente |
| Nombre por confirmar | Pendiente | Pendiente | Pendiente |
| Agregar una fila por integrante adicional | Pendiente | Pendiente | Pendiente |

### 4.2 Retrospectiva de los cuatro trimestres

| Trimestre | Objetivo y resultado real | Logro demostrado | Dificultad / pendiente y causa | Aprendizaje y mejora | Evidencia |
|---|---|---|---|---|---|
| T1 | Pendiente de relato del equipo | Pendiente | Pendiente | Pendiente | Pendiente |
| T2 | Pendiente de relato del equipo | Pendiente | Pendiente | Pendiente | Pendiente |
| T3 | Pendiente de relato del equipo | Pendiente | Pendiente | Pendiente | Pendiente |
| T4 | Pendiente de relato del equipo | Pendiente | Pendiente | Pendiente | Pendiente |

### 4.3 Acciones prioritarias para cerrar la lista

1. Corregir los errores de sintaxis del frontend y hacer reproducibles las pruebas; agregar pruebas de frontend.
2. Cerrar brechas de autenticación/autorización, gestionar secretos fuera del código y restringir CORS antes de exponer la aplicación.
3. Resolver los conflictos documentales de migración/respaldo, implementar y ensayar los procedimientos en un ambiente aislado.
4. Definir estándares y herramientas de análisis estático; registrar métricas sin atribuirles resultados no medidos.
5. Preparar manual de usuario con capturas reales únicamente después de validar la interfaz; completar equipo, avance, despliegue y retrospectivas con datos confirmados.