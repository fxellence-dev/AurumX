/**
 * Gold Hub - Conversions
 * Unit and currency conversion utilities
 */

import { UNIT_TO_GRAMS, FX_RATES, Unit, Currency } from './constants';

/**
 * Convert any unit to grams
 * @param value - The value in the source unit
 * @param unit - The source unit
 * @returns Value in grams
 */
export function convertToGrams(value: number, unit: Unit): number {
  return value * UNIT_TO_GRAMS[unit];
}

/**
 * Convert any currency to GBP (base currency)
 * @param value - The value in the source currency
 * @param currency - The source currency
 * @returns Value in GBP
 */
export function convertToGBP(value: number, currency: Currency): number {
  return value * FX_RATES[currency];
}

/**
 * Calculate price per gram in GBP (normalized price)
 * @param price - Price per unit
 * @param unit - Unit of measurement
 * @param currency - Currency
 * @param fee - Additional fee/premium
 * @returns Normalized price per gram in GBP
 */
export function calculateNormalizedPrice(
  price: number,
  unit: Unit,
  currency: Currency,
  fee: number = 0
): number {
  // Convert total price to grams
  const totalPrice = price + fee;
  const grams = UNIT_TO_GRAMS[unit];
  const pricePerGram = totalPrice / grams;
  
  // Convert to GBP
  const priceInGBP = convertToGBP(pricePerGram, currency);
  
  return priceInGBP;
}

/**
 * Compare two markets and return comparison results
 */
export interface MarketData {
  price: number;
  unit: Unit;
  currency: Currency;
  fee: number;
}

export interface ComparisonResult {
  marketA: {
    normalizedPrice: number;
    pricePerGram: number;
  };
  marketB: {
    normalizedPrice: number;
    pricePerGram: number;
  };
  winner: 'A' | 'B' | 'equal';
  difference: number;
  percentageSaving: number;
}

export function compareMarkets(
  marketA: MarketData,
  marketB: MarketData
): ComparisonResult {
  // Calculate normalized prices (price per gram in GBP)
  const priceA = calculateNormalizedPrice(
    marketA.price,
    marketA.unit,
    marketA.currency,
    marketA.fee
  );
  
  const priceB = calculateNormalizedPrice(
    marketB.price,
    marketB.unit,
    marketB.currency,
    marketB.fee
  );
  
  // Determine winner (lower price wins)
  let winner: 'A' | 'B' | 'equal';
  let difference: number;
  let percentageSaving: number;
  
  const priceDiff = Math.abs(priceA - priceB);
  
  if (priceDiff < 0.01) {
    // Prices are essentially equal (less than 1 penny difference)
    winner = 'equal';
    difference = 0;
    percentageSaving = 0;
  } else if (priceA < priceB) {
    winner = 'A';
    difference = priceB - priceA;
    percentageSaving = (difference / priceB) * 100;
  } else {
    winner = 'B';
    difference = priceA - priceB;
    percentageSaving = (difference / priceA) * 100;
  }
  
  return {
    marketA: {
      normalizedPrice: priceA,
      pricePerGram: priceA,
    },
    marketB: {
      normalizedPrice: priceB,
      pricePerGram: priceB,
    },
    winner,
    difference,
    percentageSaving,
  };
}
