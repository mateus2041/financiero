# Historias de Usuario — FinanceWeb

**Proyecto:** FinanceWeb — Plataforma web de gestión financiera personal
**Versión:** 1.0
**Fecha:** Abril 2026
**Clasificación:** Académico

---

## Actores del sistema

| Actor             | Descripción                                                                   |
| ----------------- | ----------------------------------------------------------------------------- |
| **Visitante**     | Usuario no autenticado que explora la plataforma.                             |
| **Usuario**       | Persona registrada que administra sus finanzas personales.                    |
| **Administrador** | Usuario encargado de supervisar configuraciones y control básico del sistema. |
| **Desarrollador** | Persona que estudia el proyecto como referencia académica y técnica.          |

---

## Épica 1 — Gestión de autenticación y acceso

### HU-01 — Registrarme en la plataforma

> **Como** visitante,
> **quiero** crear una cuenta con email y contraseña,
> **para** acceder a las funcionalidades financieras del sistema.

**Criterios de aceptación:**

* [ ] El formulario valida email y contraseña con mínimo 8 caracteres.
* [ ] Se muestra mensaje de confirmación al registrarse correctamente.
* [ ] El sistema evita registros duplicados.
* [ ] Los errores se muestran en español y de forma descriptiva.

**Estimación:** S (Pequeña)
**Módulo:** `auth/`

---

### HU-02 — Iniciar sesión

> **Como** usuario,
> **quiero** iniciar sesión de manera segura,
> **para** acceder a mi información financiera.

**Criterios de aceptación:**

* [ ] El sistema valida credenciales correctamente.
* [ ] El usuario es redirigido al dashboard tras autenticarse.
* [ ] La sesión permanece activa hasta expiración del token.
* [ ] Los intentos fallidos muestran mensajes de error claros.

**Estimación:** S (Pequeña)
**Módulo:** `auth/`

---

### HU-03 — Recuperar contraseña

> **Como** usuario,
> **quiero** recuperar mi contraseña mediante correo electrónico,
> **para** volver a acceder a mi cuenta si la olvido.

**Criterios de aceptación:**

* [ ] El sistema envía enlace de recuperación al correo registrado.
* [ ] El enlace expira automáticamente después de un tiempo definido.
* [ ] Se muestra confirmación de envío correctamente.

**Estimación:** XS (Muy pequeña)
**Módulo:** `auth/`

---

## Épica 2 — Dashboard financiero

### HU-04 — Ver resumen financiero

> **Como** usuario,
> **quiero** visualizar un resumen de mis ingresos, gastos y balance total,
> **para** conocer mi estado financiero actual.

**Criterios de aceptación:**

* [ ] El dashboard muestra ingresos totales, gastos totales y balance.
* [ ] Los datos se actualizan automáticamente tras registrar movimientos.
* [ ] Se muestran gráficos financieros interactivos.
* [ ] La carga inicial ocurre en menos de 2 segundos.

**Estimación:** M (Media)
**Módulo:** `dashboard/`

---

### HU-05 — Visualizar estadísticas mensuales

> **Como** usuario,
> **quiero** consultar estadísticas y gráficos financieros mensuales,
> **para** analizar mis hábitos económicos.

**Criterios de aceptación:**

* [ ] El sistema genera gráficos de ingresos y gastos.
* [ ] El usuario puede filtrar por fechas.
* [ ] Los gráficos responden correctamente en dispositivos móviles y escritorio.
* [ ] La información puede exportarse en PDF y Excel.

**Estimación:** M (Media)
**Módulo:** `reports/`

---

## Épica 3 — Gestión de ingresos

### HU-06 — Registrar ingresos

> **Como** usuario,
> **quiero** registrar ingresos económicos,
> **para** llevar control de mi dinero recibido.

**Criterios de aceptación:**

* [ ] El formulario valida montos positivos.
* [ ] El usuario puede seleccionar categoría de ingreso.
* [ ] El ingreso aparece inmediatamente en el dashboard.
* [ ] Se registra fecha y descripción opcional.

**Estimación:** S (Pequeña)
**Módulo:** `income/`

---

### HU-07 — Editar y eliminar ingresos

> **Como** usuario,
> **quiero** modificar o eliminar ingresos registrados,
> **para** mantener mi información actualizada.

**Criterios de aceptación:**

* [ ] El sistema permite editar datos previamente registrados.
* [ ] El usuario puede eliminar ingresos con confirmación previa.
* [ ] El dashboard se actualiza automáticamente después del cambio.

**Estimación:** S (Pequeña)
**Módulo:** `income/`

---

## Épica 4 — Gestión de gastos

### HU-08 — Registrar gastos

> **Como** usuario,
> **quiero** registrar mis gastos diarios,
> **para** controlar en qué utilizo mi dinero.

**Criterios de aceptación:**

* [ ] El sistema valida que el monto sea mayor a cero.
* [ ] El usuario puede seleccionar categoría de gasto.
* [ ] Los gastos se reflejan automáticamente en el balance.
* [ ] El formulario muestra mensajes claros de validación.

**Estimación:** S (Pequeña)
**Módulo:** `expenses/`

---

### HU-09 — Filtrar gastos

> **Como** usuario,
> **quiero** filtrar gastos por fecha y categoría,
> **para** encontrar información específica rápidamente.

**Criterios de aceptación:**

* [ ] El sistema permite filtrar por rango de fechas.
* [ ] El sistema permite filtrar por categorías.
* [ ] Los resultados se actualizan sin recargar la página.

**Estimación:** XS (Muy pequeña)
**Módulo:** `expenses/`

---

## Épica 5 — Presupuestos financieros

### HU-10 — Crear presupuestos

> **Como** usuario,
> **quiero** establecer presupuestos mensuales,
> **para** controlar límites de gasto por categoría.

**Criterios de aceptación:**

* [ ] El usuario puede asignar un límite monetario por categoría.
* [ ] El sistema calcula automáticamente el porcentaje usado.
* [ ] El sistema muestra alertas visuales al superar límites.
* [ ] El presupuesto puede editarse o eliminarse.

**Estimación:** M (Media)
**Módulo:** `budgets/`

---

## Épica 6 — Navegación bloqueada y seguridad

### HU-11 — Bloquear navegación privada

> **Como** visitante,
> **quiero** que las rutas privadas estén bloqueadas,
> **para** evitar acceder a información sin autenticación.

**Criterios de aceptación:**

* [ ] El sistema redirige automáticamente al login.
* [ ] Los módulos privados muestran icono de bloqueo.
* [ ] Los enlaces restringidos aparecen deshabilitados.
* [ ] El estado de bloqueo persiste tras recargar la página.

**Estimación:** S (Pequeña)
**Módulo:** `navigation/`

---

### HU-12 — Mantener sesión segura

> **Como** usuario,
> **quiero** que mi sesión expire automáticamente tras inactividad,
> **para** proteger mi información financiera.

**Criterios de aceptación:**

* [ ] El sistema detecta expiración del token JWT.
* [ ] La sesión se cierra automáticamente al expirar.
* [ ] El usuario es redirigido al login.
* [ ] Se muestra mensaje indicando expiración de sesión.

**Estimación:** S (Pequeña)
**Módulo:** `security/`

---

## Épica 7 — Configuración del sistema

### HU-13 — Cambiar preferencias visuales

> **Como** usuario,
> **quiero** cambiar entre modo claro y oscuro,
> **para** personalizar la experiencia visual.

**Criterios de aceptación:**

* [ ] El sistema permite alternar entre tema claro y oscuro.
* [ ] La preferencia se guarda automáticamente.
* [ ] El diseño se actualiza sin recargar la página.

**Estimación:** XS (Muy pequeña)
**Módulo:** `settings/`

---

### HU-14 — Configurar moneda principal

> **Como** usuario,
> **quiero** seleccionar la moneda principal de mi cuenta,
> **para** visualizar correctamente mis movimientos financieros.

**Criterios de aceptación:**

* [ ] El usuario puede seleccionar moneda desde configuración.
* [ ] Todos los montos se actualizan automáticamente.
* [ ] La configuración se mantiene entre sesiones.

**Estimación:** XS (Muy pequeña)
**Módulo:** `settings/`

---

## Épica 8 — Showcase académico

### HU-15 — Explorar la arquitectura del sistema

> **Como** desarrollador,
> **quiero** visualizar la estructura y módulos del proyecto,
> **para** estudiar la arquitectura implementada.

**Criterios de aceptación:**

* [ ] La plataforma muestra listado de módulos principales.
* [ ] Cada módulo incluye descripción técnica breve.
* [ ] Se indican tecnologías utilizadas por módulo.
* [ ] La navegación entre módulos es clara y organizada.

**Estimación:** S (Pequeña)
**Módulo:** `docs/`

---

### HU-16 — Consultar estado del sistema

> **Como** administrador,
> **quiero** visualizar el estado general del sistema,
> **para** monitorear funcionamiento básico y seguridad.

**Criterios de aceptación:**

* [ ] El sistema muestra estado de autenticación y servicios.
* [ ] Se visualizan registros básicos de errores y accesos bloqueados.
* [ ] La información se actualiza automáticamente.
* [ ] Solo usuarios administradores pueden acceder a esta sección.

**Estimación:** M (Media)
**Módulo:** `admin/`

---
