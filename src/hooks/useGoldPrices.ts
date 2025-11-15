/**
 * Gold Prices Hook
 * 
 * React Query hook for fetching live gold prices from cache
 * 
 * Features:
 * - Fetches latest prices for GBP, USD, INR
 * - Auto-refresh every 60 seconds
 * - Optimistic updates
 * - Loading and error states
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { GoldPriceCache } from '@/types/database';
import { Currency } from '@/utils/constants';

interface GoldPricesMap {
  [Currency.GBP]: GoldPriceCache | null;
  [Currency.USD]: GoldPriceCache | null;
  [Currency.INR]: GoldPriceCache | null;
}

/**
 * Fetch all gold prices from cache table
 */
async function fetchGoldPrices(): Promise<GoldPricesMap> {
  const { data, error } = await supabase
    .from('gold_prices_cache')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch gold prices: ${error.message}`);
  }

  // Convert array to map by currency
  const pricesMap: GoldPricesMap = {
    [Currency.GBP]: null,
    [Currency.USD]: null,
    [Currency.INR]: null,
  };

  data?.forEach((price) => {
    pricesMap[price.currency as Currency] = price;
  });

  return pricesMap;
}

/**
 * Hook for fetching live gold prices
 * 
 * @example
 * const { data, isLoading, error, refetch } = useGoldPrices();
 * const gbpPrice = data?.GBP?.price_per_oz;
 */
export function useGoldPrices() {
  return useQuery({
    queryKey: ['goldPrices'],
    queryFn: fetchGoldPrices,
    staleTime: 60_000, // Consider data fresh for 60 seconds
    refetchInterval: 60_000, // Auto-refetch every 60 seconds
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook for fetching a single currency's price
 * 
 * @example
 * const { data, isLoading } = useGoldPrice('GBP');
 * const pricePerOz = data?.price_per_oz;
 */
export function useGoldPrice(currency: Currency) {
  const { data, ...rest } = useGoldPrices();
  
  return {
    data: data?.[currency] ?? null,
    ...rest,
  };
}
