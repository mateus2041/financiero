/**
 * HELPERS.JS (React Web)
 * Funciones utilitarias puras y reutilizables.
 */

/**
 * Formatea un número como moneda local (Ej: 1500 -> $1,500.00)
 * @param {number} amount 
 * @param {string} locale - Por defecto 'es-MX' o 'es-CO'
 * @param {string} currency - Por defecto 'MXN' o 'USD'
 */
export const formatCurrency = (amount, locale = 'es-MX', currency = 'MXN') => {
  if (isNaN(amount) || amount === null) return '$0.00';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Formatea una fecha ISO en un formato legible (Ej: 2026-06-10 -> 10 de junio de 2026)
 * @param {string|Date} date 
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Valida si un string tiene estructura válida de correo electrónico
 * @param {string} email 
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(String(email).toLowerCase());
};

/**
 * Recorta un texto largo y añade puntos suspensivos (Truncate)
 * @param {string} text 
 * @param {number} limit 
 */
export const truncateText = (text, limit = 50) => {
  if (!text) return '';
  if (text.length <= limit) return text;
  return `${text.substring(0, limit)}...`;
};

/**
 * Descarga un archivo en el navegador a partir de un Blob (Muy útil para reportes Excel/PDF)
 * @param {Blob} blob 
 * @param {string} fileName 
 */
export const downloadFile = (blob, fileName) => {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
};