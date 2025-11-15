/**
 * Gold Hub - Validation
 * Input validation utilities (phone numbers, emails, etc.)
 */

import { PHONE_PATTERNS } from './constants';

/**
 * Validate phone number in E.164 format
 * Supports UK (+44), US (+1), and India (+91) formats
 * @param phone - Phone number string
 * @returns Object with isValid flag and error message
 */
export function validatePhone(phone: string): { isValid: boolean; error?: string } {
  if (!phone || phone.trim() === '') {
    // Phone is optional, so empty is valid
    return { isValid: true };
  }
  
  const trimmedPhone = phone.trim();
  
  // Must start with +
  if (!trimmedPhone.startsWith('+')) {
    return {
      isValid: false,
      error: 'Phone number must start with + (e.g., +44, +1, +91)',
    };
  }
  
  // Check against supported patterns
  const isUK = PHONE_PATTERNS.UK.test(trimmedPhone);
  const isUS = PHONE_PATTERNS.US.test(trimmedPhone);
  const isIndia = PHONE_PATTERNS.INDIA.test(trimmedPhone);
  
  if (!isUK && !isUS && !isIndia) {
    return {
      isValid: false,
      error: 'Invalid phone format. Supported: +44 (UK), +1 (US), +91 (India) followed by 10 digits',
    };
  }
  
  return { isValid: true };
}

/**
 * Validate email address
 * @param email - Email address string
 * @returns Object with isValid flag and error message
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || email.trim() === '') {
    return {
      isValid: false,
      error: 'Email is required',
    };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Invalid email format',
    };
  }
  
  return { isValid: true };
}

/**
 * Validate alert name
 * @param name - Alert name string
 * @returns Object with isValid flag and error message
 */
export function validateAlertName(name: string): { isValid: boolean; error?: string } {
  if (!name || name.trim() === '') {
    return {
      isValid: false,
      error: 'Alert name is required',
    };
  }
  
  if (name.trim().length < 3) {
    return {
      isValid: false,
      error: 'Alert name must be at least 3 characters',
    };
  }
  
  if (name.trim().length > 50) {
    return {
      isValid: false,
      error: 'Alert name must be less than 50 characters',
    };
  }
  
  return { isValid: true };
}

/**
 * Validate target price
 * @param price - Price value
 * @returns Object with isValid flag and error message
 */
export function validateTargetPrice(price: number | string): { isValid: boolean; error?: string } {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return {
      isValid: false,
      error: 'Please enter a valid number',
    };
  }
  
  if (numPrice <= 0) {
    return {
      isValid: false,
      error: 'Price must be greater than 0',
    };
  }
  
  return { isValid: true };
}

/**
 * Validate change percentage
 * @param percent - Percentage value
 * @returns Object with isValid flag and error message
 */
export function validateChangePercent(percent: number | string): { isValid: boolean; error?: string } {
  const numPercent = typeof percent === 'string' ? parseFloat(percent) : percent;
  
  if (isNaN(numPercent)) {
    return {
      isValid: false,
      error: 'Please enter a valid number',
    };
  }
  
  if (numPercent <= 0) {
    return {
      isValid: false,
      error: 'Percentage must be greater than 0',
    };
  }
  
  if (numPercent > 100) {
    return {
      isValid: false,
      error: 'Percentage must be 100 or less',
    };
  }
  
  return { isValid: true };
}
