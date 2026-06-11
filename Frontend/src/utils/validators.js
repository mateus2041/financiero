/**
 * VALIDATORS.JS (React Web)
 * Reglas de validación para formularios.
 */

/**
 * Valida el correo electrónico
 * @param {string} email 
 */
export const validateEmail = (email) => {
  if (!email || email.trim() === '') {
    return { isValid: false, message: 'El correo electrónico es obligatorio.' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'El formato del correo no es válido (ej: usuario@dominio.com).' };
  }
  return { isValid: true, message: '' };
};

/**
 * Valida la seguridad de la contraseña en el registro
 * @param {string} password 
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'La contraseña es obligatoria.' };
  }
  if (password.length < 8) {
    return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres.' };
  }
  if (!/\d/.test(password)) {
    return { isValid: false, message: 'La contraseña debe incluir al menos un número.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'La contraseña debe incluir al menos una letra mayúscula.' };
  }
  return { isValid: true, message: '' };
};

/**
 * Valida que dos contraseñas coincidan (Confirmar contraseña)
 * @param {string} password 
 * @param {string} confirmPassword 
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return { isValid: false, message: 'Las contraseñas no coinciden.' };
  }
  return { isValid: true, message: '' };
};

/**
 * Valida campos de texto requeridos comunes (Nombres, Apellidos, etc.)
 * @param {string} text 
 * @param {string} fieldName - Nombre del campo para personalizar el error
 */
export const validateRequiredText = (text, fieldName = 'Este campo') => {
  if (!text || text.trim() === '') {
    return { isValid: false, message: `${fieldName} es obligatorio.` };
  }
  if (text.trim().length < 3) {
    return { isValid: false, message: `${fieldName} debe tener al menos 3 caracteres.` };
  }
  return { isValid: true, message: '' };
};