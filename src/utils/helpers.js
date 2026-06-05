// Helper utilities for Manjula Milk Forming
import { LOGO_BASE64 } from './logoBase64';

/**
 * Format date to DD-MM-YYYY
 */
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Format date to YYYY-MM-DD for database
 */
export const formatDateDB = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

/**
 * Format time to HH:MM AM/PM
 */
export const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
};

/**
 * Format currency in Indian Rupees
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '₹0.00';
  return `₹${parseFloat(amount).toFixed(2)}`;
};

/**
 * Format quantity in liters
 */
export const formatLiters = (qty) => {
  if (qty === null || qty === undefined) return '0 L';
  const num = parseFloat(qty);
  if (num === Math.floor(num)) return `${num} L`;
  return `${num.toFixed(2)} L`;
};

/**
 * Get milk type label
 */
export const getMilkTypeLabel = (type) => {
  switch (type) {
    case '1': return '1 Liter';
    case '0.5': return '½ Liter';
    case '0.25': return '¼ Liter';
    case '1.75': return '1.75 Liter';
    case 'custom': return 'Custom';
    default: return type;
  }
};

/**
 * Get today's date as Date object (start of day)
 */
export const getToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get start of current month
 */
export const getMonthStart = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Calculate total amount
 */
export const calculateAmount = (quantity, ratePerLiter) => {
  return parseFloat((parseFloat(quantity) * parseFloat(ratePerLiter)).toFixed(2));
};

/**
 * Validate phone number (Indian format)
 */
export const isValidPhone = (phone) => {
  if (!phone) return true; // Optional field
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
};

/**
 * Generate greeting based on time of day
 */
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

/**
 * Debounce function for search
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Get logo image as a Base64 data URI for PDF embedding.
 * The logo is embedded directly (see logoBase64.js) so it renders reliably
 * in print/share/download across Expo Go and production, without depending
 * on runtime file-system reads which were failing previously.
 */
export const getLogoBase64 = async () => {
  return LOGO_BASE64 || '';
};
