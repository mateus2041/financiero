# Requisitos No Funcionales — FinanceWeb

**Proyecto:** FinanceWeb — Plataforma web de gestión financiera personal
**Versión:** 1.0
**Fecha:** Abril 2026
**Clasificación:** Académico

---

## RNF-01 — Rendimiento

| ID       | Requisito                                                                                                                   | Métrica               |
| -------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| RNF-01.1 | El dashboard principal debe renderizarse en menos de 2 segundos en navegadores modernos.                                    | Tiempo de carga ≤ 2 s |
| RNF-01.2 | Las tablas financieras deben soportar al menos 5.000 registros sin degradación visible de rendimiento.                      | FPS ≥ 60              |
| RNF-01.3 | Las gráficas y estadísticas deben actualizarse sin bloquear la interfaz del usuario.                                        | UI fluida             |
| RNF-01.4 | Las consultas HTTP no deben superar 3 segundos; en caso contrario se debe mostrar indicador de carga y opción de reintento. | Timeout ≤ 3 s         |
| RNF-01.5 | El sistema debe minimizar recargas completas usando renderizado dinámico y estados reactivos.                               | UX optimizada         |

---

## RNF-02 — Disponibilidad y persistencia

| ID       | Requisito                                                                                             |
| -------- | ----------------------------------------------------------------------------------------------------- |
| RNF-02.1 | El sistema debe mantener persistencia de sesión incluso tras recargar la página.                      |
| RNF-02.2 | El sistema debe detectar pérdida de conexión y mostrar un mensaje informativo no intrusivo.           |
| RNF-02.3 | El sistema debe conservar datos cacheados temporalmente para reducir peticiones repetidas al backend. |
| RNF-02.4 | El sistema debe recuperar automáticamente información persistida después de reiniciar el navegador.   |

---

## RNF-03 — Seguridad

| ID       | Requisito                                                                                                       |
| -------- | --------------------------------------------------------------------------------------------------------------- |
| RNF-03.1 | Las credenciales y variables sensibles deben almacenarse únicamente en archivos `.env`.                         |
| RNF-03.2 | Las contraseñas deben almacenarse cifradas usando bcrypt o equivalente.                                         |
| RNF-03.3 | Los tokens JWT no deben exponerse en logs, respuestas públicas ni repositorios.                                 |
| RNF-03.4 | Todas las rutas privadas deben validar autenticación antes de permitir acceso.                                  |
| RNF-03.5 | Las dependencias deben auditarse mediante `pnpm audit --audit-level moderate` antes de cada commit.             |
| RNF-03.6 | Ninguna vulnerabilidad de nivel moderate, high o critical puede llegar a producción sin mitigación documentada. |
| RNF-03.7 | El sistema debe implementar protección básica contra ataques XSS y CSRF.                                        |
| RNF-03.8 | El sistema debe bloquear navegación y acceso a módulos privados para usuarios no autenticados.                  |

---

## RNF-04 — Mantenibilidad

| ID       | Requisito                                                                                      |
| -------- | ---------------------------------------------------------------------------------------------- |
| RNF-04.1 | La cobertura de tests debe ser ≥ 80 % por módulo.                                              |
| RNF-04.2 | Todo componente, función y servicio debe documentarse usando TSDoc (`@what / @why / @impact`). |
| RNF-04.3 | No se permite el uso de `any`, `@ts-ignore` ni `eslint-disable` sin justificación documentada. |
| RNF-04.4 | Todas las dependencias deben usar versiones exactas para garantizar builds reproducibles.      |
| RNF-04.5 | La lógica compartida debe centralizarse en módulos reutilizables.                              |
| RNF-04.6 | No se permiten importaciones cruzadas indebidas entre módulos funcionales.                     |

---

## RNF-05 — Usabilidad y accesibilidad

| ID       | Requisito                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------- |
| RNF-05.1 | Todos los elementos interactivos deben tener etiquetas accesibles (`aria-label`).                   |
| RNF-05.2 | El contraste visual debe cumplir WCAG 2.1 nivel AA.                                                 |
| RNF-05.3 | El sistema debe soportar modo claro y modo oscuro.                                                  |
| RNF-05.4 | Los formularios deben mostrar mensajes de validación claros y accionables.                          |
| RNF-05.5 | El sistema debe mantener diseño responsive desde 320 px hasta 1440 px.                              |
| RNF-05.6 | Los botones y elementos interactivos deben tener tamaño mínimo adecuado para dispositivos táctiles. |

---

## RNF-06 — Compatibilidad

| ID       | Requisito                                                                                                        |
| -------- | ---------------------------------------------------------------------------------------------------------------- |
| RNF-06.1 | El sistema debe funcionar correctamente en Chrome ≥ 110, Edge ≥ 110 y Firefox ≥ 110.                             |
| RNF-06.2 | El sistema debe funcionar en resoluciones móviles, tablet y escritorio.                                          |
| RNF-06.3 | Las funcionalidades no soportadas deben degradarse mostrando mensajes informativos en lugar de errores críticos. |
| RNF-06.4 | El sistema debe mantener compatibilidad con Node.js LTS utilizado por el proyecto.                               |

---

## RNF-07 — Escalabilidad

| ID       | Requisito                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| RNF-07.1 | El sistema debe optimizar consultas para soportar crecimiento progresivo de usuarios y registros financieros. |
| RNF-07.2 | El backend debe implementar paginación para consultas grandes.                                                |
| RNF-07.3 | El sistema debe minimizar llamadas repetidas mediante caché de consultas HTTP.                                |
| RNF-07.4 | Las tablas financieras deben soportar crecimiento sin afectar significativamente la experiencia del usuario.  |

---

## RNF-08 — Calidad de código y proceso

| ID       | Requisito                                                                                            |
| -------- | ---------------------------------------------------------------------------------------------------- |
| RNF-08.1 | El proyecto debe pasar ESLint y TypeScript antes de cada commit (`pnpm lint && pnpm tsc --noEmit`).  |
| RNF-08.2 | Los commits deben seguir el formato Conventional Commits con cuerpo pedagógico (`For:` / `Impact:`). |
| RNF-08.3 | El único gestor de paquetes permitido es `pnpm`.                                                     |
| RNF-08.4 | Todo error detectado debe corregirse antes de continuar con nuevas funcionalidades.                  |
| RNF-08.5 | No se permiten `// TODO` sin issue asociado en el repositorio.                                       |

---

## RNF-09 — Navegación bloqueada y control de acceso

| ID       | Requisito                                                                                             |
| -------- | ----------------------------------------------------------------------------------------------------- |
| RNF-09.1 | El sistema debe bloquear automáticamente la navegación hacia rutas privadas sin autenticación válida. |
| RNF-09.2 | Los módulos restringidos deben mostrarse visualmente deshabilitados para usuarios sin permisos.       |
| RNF-09.3 | El sistema debe redirigir automáticamente al login cuando se detecte acceso no autorizado.            |
| RNF-09.4 | El sistema debe mantener el estado de bloqueo incluso después de recargar la página.                  |
| RNF-09.5 | El sistema debe registrar eventos básicos de acceso denegado para auditoría.                          |

---
