/**
 * Gold Hub - Constants
 * App-wide constants including FX rates, unit conversions, etc.
 */

/**
 * Currency types supported by the app
 */
export const CURRENCIES = ['GBP', 'USD', 'INR', 'EUR'] as const;
export type Currency = typeof CURRENCIES[number];

/**
 * Unit types for gold measurement
 */
export const UNITS = ['troy-ounce', 'gram', 'kilogram', 'tola'] as const;
export type Unit = typeof UNITS[number];

/**
 * Alert condition types
 */
export const ALERT_CONDITIONS = ['above', 'below', 'change_up', 'change_down'] as const;
export type AlertCondition = typeof ALERT_CONDITIONS[number];

/**
 * Unit to grams conversion rates
 * All units are converted to grams for normalization
 */
export const UNIT_TO_GRAMS: Record<Unit, number> = {
  'troy-ounce': 31.1035,
  'gram': 1.0,
  'kilogram': 1000.0,
  'tola': 11.6638,
};

/**
 * Fixed FX rates for currency conversion
 * Base currency: GBP = 1.0
 * 
 * NOTE: These rates should match the web app exactly
 * Update these values to match your web app's FX rates
 */
export const FX_RATES: Record<Currency, number> = {
  'GBP': 1.0,
  'USD': 0.79,      // 1 USD = 0.79 GBP (example - update with actual rate)
  'INR': 0.0097,    // 1 INR = 0.0097 GBP (example - update with actual rate)
  'EUR': 0.85,      // 1 EUR = 0.85 GBP (example - update with actual rate)
};

/**
 * Currency symbols for display
 */
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  'GBP': '£',
  'USD': '$',
  'INR': '₹',
  'EUR': '€',
};

/**
 * Currency names
 */
export const CURRENCY_NAMES: Record<Currency, string> = {
  'GBP': 'British Pound',
  'USD': 'US Dollar',
  'INR': 'Indian Rupee',
  'EUR': 'Euro',
};

/**
 * Unit display names
 */
export const UNIT_NAMES: Record<Unit, string> = {
  'troy-ounce': 'Troy Ounce',
  'gram': 'Gram',
  'kilogram': 'Kilogram',
  'tola': 'Tola',
};

/**
 * Alert condition display names
 */
export const CONDITION_NAMES: Record<AlertCondition, string> = {
  'above': 'Price goes above',
  'below': 'Price goes below',
  'change_up': 'Price increases by',
  'change_down': 'Price decreases by',
};

/**
 * Phone number validation patterns
 */
export const PHONE_PATTERNS = {
  UK: /^\+44\d{10}$/,
  US: /^\+1\d{10}$/,
  INDIA: /^\+91\d{10}$/,
};

/**
 * App configuration
 */
export const APP_CONFIG = {
  NAME: 'Gold Hub',
  VERSION: '1.0.0',
  WEB_URL: process.env.EXPO_PUBLIC_APP_URL || 'https://goldhub.com',
  SUPPORT_EMAIL: 'support@goldhub.com',
};

/**
 * Query cache times (in milliseconds)
 */
export const CACHE_TIMES = {
  GOLD_PRICES: 5 * 60 * 1000,        // 5 minutes
  ALERTS: 30 * 1000,                  // 30 seconds
  USER_PROFILE: 10 * 60 * 1000,       // 10 minutes
};

/**
 * Preset comparison scenarios
 */
export interface PresetScenario {
  id: string;
  name: string;
  marketA: {
    price: number;
    unit: Unit;
    currency: Currency;
    fee: number;
  };
  marketB: {
    price: number;
    unit: Unit;
    currency: Currency;
    fee: number;
  };
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'uk-vs-india-1oz',
    name: 'UK vs India (1 oz)',
    marketA: {
      price: 1800,
      unit: 'troy-ounce',
      currency: 'GBP',
      fee: 0,
    },
    marketB: {
      price: 180000,
      unit: 'troy-ounce',
      currency: 'INR',
      fee: 0,
    },
  },
  {
    id: 'dubai-vs-london-10g',
    name: 'Dubai vs London (10g)',
    marketA: {
      price: 2500,
      unit: 'gram',
      currency: 'USD',
      fee: 50,
    },
    marketB: {
      price: 600,
      unit: 'gram',
      currency: 'GBP',
      fee: 0,
    },
  },
  {
    id: 'us-vs-uk-1kg',
    name: 'US vs UK (1 kg)',
    marketA: {
      price: 60000,
      unit: 'kilogram',
      currency: 'USD',
      fee: 500,
    },
    marketB: {
      price: 50000,
      unit: 'kilogram',
      currency: 'GBP',
      fee: 300,
    },
  },
];
