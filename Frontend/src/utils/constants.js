/**
 * CONSTANTS.JS (React Web)
 * Único punto de verdad para configuraciones globales fijas.
 */

// 1. Configuración de API (Detecta automáticamente si estás en local o producción)
export const API_CONFIG = {
  BASE_URL: import.meta.env?.VITE_API_URL || 'https://api.tuempresa.com/v1',
  TIMEOUT: 10000, // 10 segundos
};

// 2. Claves de Almacenamiento Local (Evita errores tipográficos al usar localStorage)
export const STORAGE_KEYS = {
  TOKEN: 'app_auth_token',
  USER: 'app_user_data',
  THEME: 'app_theme_preference',
};

// 3. Roles de Usuario (Para control de accesos y rutas protegidas)
export const USER_ROLES = {
  ADMIN: 'administrator',
  USER: 'regular_user',
  GUEST: 'guest',
};

// 4. Estados comunes de la API (Útil para tablas, modales y respuestas)
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

// 5. Límites y Validaciones del Sistema
export const VALIDATION_LIMITS = {
  MAX_FILE_SIZE_MB: 5,
  MIN_PASSWORD_LENGTH: 8,
  MAX_INPUT_LENGTH: 255,
};