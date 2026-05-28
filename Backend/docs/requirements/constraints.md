# Restricciones del Proyecto — FinanceWeb

**Proyecto:** FinanceWeb — Plataforma web de gestión financiera personal
**Versión:** 1.0
**Fecha:** Abril 2026
**Clasificación:** Académico

---

## RC-01 — Restricciones tecnológicas

| ID      | Restricción                                                                                                                                              | Justificación                                                             |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| RC-01.1 | El framework obligatorio es **React** con **Vite** y **TypeScript**. No se permite migrar a Angular, Vue, Svelte ni otros frameworks.                    | El objetivo académico es demostrar arquitectura moderna basada en React.  |
| RC-01.2 | El lenguaje es **TypeScript** en modo estricto (`"strict": true`). No se permite JavaScript puro.                                                        | Garantiza type safety y facilita el mantenimiento del sistema financiero. |
| RC-01.3 | El único gestor de paquetes permitido es **pnpm**. No se puede usar `npm`, `yarn` ni `bun`.                                                              | Reproducibilidad de builds y control centralizado de dependencias.        |
| RC-01.4 | Todas las versiones de dependencias deben ser **exactas** (sin `^`, `~`, `*` ni `latest`).                                                               | Evita builds inconsistentes y vulnerabilidades inesperadas.               |
| RC-01.5 | El backend debe implementarse con **FastAPI** y base de datos **PostgreSQL**. No se permite cambiar a otros frameworks backend sin aprobación académica. | Uniformidad tecnológica y compatibilidad con el entorno del proyecto.     |
| RC-01.6 | El sistema de autenticación debe usar **JWT** con expiración controlada. No se permiten sesiones inseguras basadas únicamente en almacenamiento local.   | Garantiza un estándar mínimo de seguridad.                                |
| RC-01.7 | El diseño visual debe implementarse usando **Tailwind CSS**. No se permite Bootstrap ni frameworks CSS externos adicionales.                             | Mantener consistencia visual y control de estilos.                        |

---

## RC-02 — Restricciones de APIs externas

| ID      | Restricción                                                                                                             | Justificación                                                      |
| ------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| RC-02.1 | Solo se pueden integrar APIs financieras gratuitas previamente documentadas en el proyecto.                             | Control de costes y validación académica de dependencias externas. |
| RC-02.2 | Las API keys deben almacenarse únicamente en archivos `.env`. Nunca pueden escribirse directamente en el código fuente. | Prevención de filtración de credenciales.                          |
| RC-02.3 | No se permite depender de APIs premium o de pago para funcionalidades esenciales del sistema.                           | Restricción económica del entorno académico.                       |
| RC-02.4 | Toda integración externa debe tener manejo de errores, timeout y fallback visual para evitar bloqueos del sistema.      | Mejora la resiliencia de la aplicación.                            |

---

## RC-03 — Restricciones de plataforma

| ID      | Restricción                                                                                     | Justificación                                                       |
| ------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| RC-03.1 | La plataforma principal es **Web Responsive Desktop First**. La adaptación móvil es secundaria. | El sistema financiero será evaluado principalmente en computadores. |
| RC-03.2 | La aplicación debe funcionar correctamente en los navegadores modernos: Chrome, Edge y Firefox. | Compatibilidad mínima requerida para la evaluación académica.       |
| RC-03.3 | No se requiere soporte para Internet Explorer ni navegadores obsoletos.                         | Reducción de complejidad técnica innecesaria.                       |
| RC-03.4 | Las funcionalidades críticas deben funcionar incluso con conexiones lentas o inestables.        | Accesibilidad académica y pruebas en diferentes entornos de red.    |

---

## RC-04 — Restricciones de seguridad

| ID      | Restricción                                                                                                                    |
| ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| RC-04.1 | Los archivos `.env`, `.env.local` y cualquier variante **no deben commitearse** al repositorio.                                |
| RC-04.2 | Las contraseñas deben almacenarse cifradas utilizando algoritmos seguros (`bcrypt` o equivalente).                             |
| RC-04.3 | Ninguna vulnerabilidad CVE de nivel **moderate, high o critical** puede llegar al branch principal sin mitigación documentada. |
| RC-04.4 | El sistema no debe almacenar información bancaria real ni datos financieros sensibles de terceros.                             |
| RC-04.5 | Todas las rutas privadas deben validar autenticación y autorización antes de renderizar información sensible.                  |
| RC-04.6 | Los tokens JWT no deben exponerse en logs ni respuestas visibles al usuario.                                                   |

---

## RC-05 — Restricciones de calidad

| ID      | Restricción                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------ |
| RC-05.1 | La cobertura de tests no puede bajar del **80 %** de líneas y ramas por módulo.                              |
| RC-05.2 | No se puede hacer merge a `main` con errores de TypeScript (`pnpm tsc --noEmit`) ni de ESLint (`pnpm lint`). |
| RC-05.3 | No se permiten `// TODO` sin issue asociado en el repositorio.                                               |
| RC-05.4 | Cada función, hook, servicio y componente debe tener documentación TSDoc (`@what / @why / @impact`).         |
| RC-05.5 | Toda petición HTTP debe tener tipado estricto de request y response.                                         |
| RC-05.6 | No se permite código duplicado entre módulos; la lógica compartida debe centralizarse.                       |

---

## RC-06 — Restricciones de proceso y tiempo

| ID      | Restricción                                                                              |
| ------- | ---------------------------------------------------------------------------------------- |
| RC-06.1 | El proyecto sigue el formato **Conventional Commits** con cuerpo pedagógico obligatorio. |
| RC-06.2 | Cada módulo debe entregarse con documentación, pruebas y validaciones completas.         |
| RC-06.3 | El proyecto es **académico y sin fines comerciales**.                                    |
| RC-06.4 | No se aceptan módulos incompletos o marcados como “en construcción” en la entrega final. |
| RC-06.5 | Toda funcionalidad nueva debe pasar revisión técnica antes de integrarse a `main`.       |

---

## RC-07 — Restricciones de arquitectura

| ID      | Restricción                                                                                                                           |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| RC-07.1 | La estructura de carpetas definida en `src/modules/` y `src/shared/` es obligatoria y no puede modificarse sin aprobación del equipo. |
| RC-07.2 | No se permiten importaciones cruzadas entre módulos (`src/modules/auth` no puede importar de `src/modules/dashboard`).                |
| RC-07.3 | Toda lógica compartida debe ubicarse en `src/shared/`.                                                                                |
| RC-07.4 | El cliente HTTP debe centralizarse en `src/shared/lib/httpClient.ts`. No se permiten llamadas `fetch` directas dentro de módulos.     |
| RC-07.5 | El manejo global de estado debe implementarse mediante Context API, Zustand o Redux Toolkit previamente definidos por el equipo.      |
| RC-07.6 | Las variables de entorno deben validarse al iniciar la aplicación mediante un esquema tipado.                                         |
| RC-07.7 | Cada módulo debe ser independiente, escalable y desacoplado del resto del sistema.                                                    |

---
