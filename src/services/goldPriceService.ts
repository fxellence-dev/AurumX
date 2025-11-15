/**
 * Gold Price Service
 * Fetches current gold prices for different currencies
 * Note: This uses mock data for now. In production, integrate with a real gold price API
 */

export interface GoldPrice {
  currency: string;
  pricePerOunce: number;
  lastUpdated: Date;
  symbol: string;
}

// Mock prices - In production, fetch from real API
const MOCK_PRICES: Record<string, number> = {
  USD: 2650.50,
  INR: 220000,
  GBP: 2100.75,
  EUR: 2450.30,
};

/**
 * Fetches current gold prices for all supported currencies
 * TODO: Replace with real API integration (e.g., GoldAPI.io, Metals-API, etc.)
 */
export async function fetchGoldPrices(): Promise<GoldPrice[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return Object.entries(MOCK_PRICES).map(([currency, price]) => ({
    currency,
    pricePerOunce: price,
    lastUpdated: new Date(),
    symbol: getCurrencySymbol(currency),
  }));
}

/**
 * Fetches gold price for a specific currency
 */
export async function fetchGoldPrice(currency: string): Promise<GoldPrice> {
  const prices = await fetchGoldPrices();
  const price = prices.find(p => p.currency === currency);
  
  if (!price) {
    throw new Error(`Price not found for currency: ${currency}`);
  }
  
  return price;
}

/**
 * Gets the currency symbol for display
 */
export function getCurrencySymbol(currency: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    INR: '₹',
    GBP: '£',
    EUR: '€',
  };
  
  return symbols[currency] || currency;
}

/**
 * Converts weight between different units
 */
export function convertWeight(value: number, fromUnit: string, toUnit: string): number {
  // Convert to grams first (base unit)
  const toGrams: Record<string, number> = {
    'g': 1,
    'oz': 31.1035,      // Troy ounce
    'kg': 1000,
    'tola': 11.6638,    // Indian/Pakistani tola
    'lb': 373.242,      // Troy pound
  };
  
  const grams = value * toGrams[fromUnit];
  return grams / toGrams[toUnit];
}

/**
 * Calculates the price for a given weight of gold
 */
export function calculateGoldValue(
  weight: number,
  unit: string,
  pricePerOunce: number
): number {
  // Convert weight to troy ounces
  const ounces = convertWeight(weight, unit, 'oz');
  return ounces * pricePerOunce;
}

/**
 * Market Comparison Types and Functions
 */

export type PriceUnit = 'g' | '10g' | 'oz' | 'troyoz';
export type Currency = 'USD' | 'INR' | 'GBP' | 'EUR';
export type RoundingMode = 'bankers' | 'halfup' | 'truncate';
export type ComparisonUnit = 'g' | 'oz' | 'troyoz';

export interface MarketPrice {
  price: number;
  currency: Currency;
  unit: PriceUnit;
  feePercentage: number;
}

export interface ComparisonParams {
  marketA: MarketPrice;
  marketB: MarketPrice;
  fxRate: number; // Exchange rate from Market A currency to Market B currency
  comparisonUnit: ComparisonUnit;
  roundingMode: RoundingMode;
  targetMarket?: 'A' | 'B'; // Which market's currency to display results in
}

export interface ComparisonResult {
  marketA: {
    normalizedPrice: number;
    currency: Currency;
    unit: ComparisonUnit;
  };
  marketB: {
    normalizedPrice: number;
    currency: Currency;
    unit: ComparisonUnit;
  };
  absoluteDifference: number;
  percentageVsB: number;
  percentageVsA: number;
  cheaperMarket: 'A' | 'B';
  savings: number;
  targetCurrency: Currency;
}

/**
 * Applies rounding based on selected mode
 */
function applyRounding(value: number, mode: RoundingMode, decimals: number = 2): number {
  const multiplier = Math.pow(10, decimals);
  
  switch (mode) {
    case 'bankers': // Round to nearest even (Banker's rounding)
      const scaled = value * multiplier;
      const rounded = Math.round(scaled);
      // If exactly halfway, round to even
      if (Math.abs(scaled - rounded) === 0.5) {
        return (rounded % 2 === 0 ? rounded : rounded + (scaled > 0 ? -1 : 1)) / multiplier;
      }
      return rounded / multiplier;
      
    case 'halfup': // Standard rounding (half up)
      return Math.round(value * multiplier) / multiplier;
      
    case 'truncate': // Truncate (round down)
      return Math.floor(value * multiplier) / multiplier;
      
    default:
      return value;
  }
}

/**
 * Step 1: Apply fees/markup to price
 */
function applyFees(price: number, feePercentage: number): number {
  return price * (1 + feePercentage / 100);
}

/**
 * Step 2: Normalize to per gram
 */
function normalizeToPerGram(price: number, unit: PriceUnit): number {
  switch (unit) {
    case 'g':
      return price;
    case '10g':
      return price / 10;
    case 'oz':
      return price / 28.3495; // Regular ounce
    case 'troyoz':
      return price / 31.1035; // Troy ounce
    default:
      return price;
  }
}

/**
 * Step 3: Convert to target comparison unit
 */
function convertToComparisonUnit(pricePerGram: number, targetUnit: ComparisonUnit): number {
  switch (targetUnit) {
    case 'g':
      return pricePerGram;
    case 'oz':
      return pricePerGram * 28.3495;
    case 'troyoz':
      return pricePerGram * 31.1035;
    default:
      return pricePerGram;
  }
}

/**
 * Main comparison calculation function
 */
export function compareMarkets(params: ComparisonParams): ComparisonResult {
  const { marketA, marketB, fxRate, comparisonUnit, roundingMode, targetMarket = 'B' } = params;
  
  // Step 1: Apply fees to both markets
  const priceAWithFees = applyFees(marketA.price, marketA.feePercentage);
  const priceBWithFees = applyFees(marketB.price, marketB.feePercentage);
  
  // Step 2: Normalize both to per gram
  const priceAPerGram = normalizeToPerGram(priceAWithFees, marketA.unit);
  const priceBPerGram = normalizeToPerGram(priceBWithFees, marketB.unit);
  
  // Step 3: Convert to target comparison unit
  const priceAInUnit = convertToComparisonUnit(priceAPerGram, comparisonUnit);
  const priceBInUnit = convertToComparisonUnit(priceBPerGram, comparisonUnit);
  
  // Step 4: Currency conversion based on target market
  let finalPriceA: number;
  let finalPriceB: number;
  let targetCurrency: Currency;
  
  if (targetMarket === 'A') {
    // Convert Market B to Market A currency
    targetCurrency = marketA.currency;
    finalPriceA = applyRounding(priceAInUnit, roundingMode);
    finalPriceB = marketA.currency !== marketB.currency 
      ? applyRounding(priceBInUnit / fxRate, roundingMode)
      : applyRounding(priceBInUnit, roundingMode);
  } else {
    // Convert Market A to Market B currency (default behavior)
    targetCurrency = marketB.currency;
    finalPriceA = marketA.currency !== marketB.currency 
      ? applyRounding(priceAInUnit * fxRate, roundingMode)
      : applyRounding(priceAInUnit, roundingMode);
    finalPriceB = applyRounding(priceBInUnit, roundingMode);
  }
  
  // Step 5: Calculate differences
  const absoluteDiff = finalPriceA - finalPriceB;
  const percentageVsB = (absoluteDiff / finalPriceB) * 100;
  const percentageVsA = (absoluteDiff / finalPriceA) * 100;
  
  const cheaperMarket = finalPriceA < finalPriceB ? 'A' : 'B';
  const savings = Math.abs(absoluteDiff);
  
  return {
    marketA: {
      normalizedPrice: finalPriceA,
      currency: targetCurrency,
      unit: comparisonUnit,
    },
    marketB: {
      normalizedPrice: finalPriceB,
      currency: targetCurrency,
      unit: comparisonUnit,
    },
    absoluteDifference: absoluteDiff,
    percentageVsB: applyRounding(percentageVsB, roundingMode),
    percentageVsA: applyRounding(percentageVsA, roundingMode),
    cheaperMarket,
    savings,
    targetCurrency,
  };
}
