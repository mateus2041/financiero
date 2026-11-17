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
  if (amount === null || Number.isNaN(Number(amount))) return '$0.00';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const parsePositiveInteger = (value) => {
  if (
    typeof value !== 'number' &&
    (typeof value !== 'string' || !/^\d+$/.test(value))
  ) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

export const sanitizeLocalName = (value) => {
  if (typeof value !== "string") return "Sin nombre";

  const name = value.normalize("NFKC").trim();
  return name.length <= 100 && /^[\p{L}\p{M}\p{N} .,'’-]+$/u.test(name)
    ? name
    : "Sin nombre";
};

export const groupDigitsByThousands = (digits) => {
  let grouped = "";

  for (let index = 0; index < digits.length; index += 1) {
    if (index > 0 && (digits.length - index) % 3 === 0) {
      grouped += ".";
    }
    grouped += digits[index];
  }

  return grouped;
};

export const activateOnEnterOrSpace = (event, action) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
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
  const normalizedEmail = String(email).toLowerCase();
  const parts = normalizedEmail.split("@");
  if (parts.length !== 2 || /\s/.test(normalizedEmail)) return false;

  const [localPart, domain] = parts;
  const dotIndex = domain.indexOf(".");
  return (
    localPart.length > 0 &&
    dotIndex > 0 &&
    dotIndex < domain.length - 1
  );
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