/**
 * Gold Hub - Formatters
 * Utilities for formatting dates, numbers, currencies
 */

import { format, formatDistanceToNow } from 'date-fns';
import { Currency, CURRENCY_SYMBOLS } from './constants';

/**
 * Format a number as currency with symbol
 * @param value - Numeric value
 * @param currency - Currency code
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency: Currency,
  decimals: number = 2
): string {
  const symbol = CURRENCY_SYMBOLS[currency];
  const formatted = value.toFixed(decimals);
  
  return `${symbol}${formatted}`;
}

/**
 * Format a number with thousand separators
 * @param value - Numeric value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a percentage value
 * @param value - Numeric value (e.g., 15.5 for 15.5%)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format a date as "time ago" (e.g., "5 minutes ago")
 * @param date - Date string or Date object
 * @returns Formatted time ago string
 */
export function formatTimeAgo(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true });
}

/**
 * Format a date as full date string
 * @param date - Date string or Date object
 * @param formatStr - Format string (default: 'PPP' for "April 29th, 2021")
 * @returns Formatted date string
 */
export function formatDate(
  date: string | Date,
  formatStr: string = 'PPP'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Format a date and time
 * @param date - Date string or Date object
 * @returns Formatted date and time string
 */
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'PPP p'); // e.g., "April 29th, 2021 at 12:30 PM"
}

/**
 * Truncate text with ellipsis
 * @param text - Text string
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format phone number for display
 * @param phone - Phone number string
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // UK: +44 7XXX XXX XXX
  if (phone.startsWith('+44')) {
    const digits = phone.slice(3);
    return `+44 ${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  
  // US: +1 (XXX) XXX-XXXX
  if (phone.startsWith('+1')) {
    const digits = phone.slice(2);
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // India: +91 XXXXX XXXXX
  if (phone.startsWith('+91')) {
    const digits = phone.slice(3);
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }
  
  return phone;
}
