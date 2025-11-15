/**
 * Gold Hub - Database Types
 * TypeScript types for Supabase tables
 * DO NOT MODIFY - these match the existing backend schema
 */

import { Currency, AlertCondition } from '../utils/constants';

/**
 * Gold Prices Cache Table
 * Stores latest gold prices fetched by Edge Function
 */
export interface GoldPriceCache {
  currency: Currency;
  price_per_oz: number;
  fetched_at: string;
  created_at: string;
}

/**
 * Gold Rate Alerts Table
 * Stores user-created price alerts
 */
export interface GoldRateAlert {
  id: string;
  alert_name: string;
  user_id: string;
  user_email: string;
  user_name: string;
  user_phone: string | null;
  currency: Currency;
  condition: AlertCondition;
  target_price: number | null;
  change_percent: number | null;
  enabled: boolean;
  triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Alert creation payload (for insert)
 */
export interface CreateAlertPayload {
  alert_name: string;
  user_id: string;
  user_email: string;
  user_name: string;
  user_phone: string | null;
  currency: Currency;
  condition: AlertCondition;
  target_price: number | null;
  change_percent: number | null;
  enabled: boolean;
}

/**
 * Alert update payload
 */
export interface UpdateAlertPayload {
  alert_name?: string;
  currency?: Currency;
  condition?: AlertCondition;
  target_price?: number | null;
  change_percent?: number | null;
  enabled?: boolean;
  user_phone?: string | null;
}

/**
 * Supabase User (from auth.users)
 */
export interface SupabaseUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
}

/**
 * Supabase Database Schema Type
 * Used for type-safe queries with Supabase client
 */
export interface Database {
  public: {
    Tables: {
      gold_prices_cache: {
        Row: GoldPriceCache;
        Insert: Omit<GoldPriceCache, 'created_at'>;
        Update: Partial<Omit<GoldPriceCache, 'created_at'>>;
      };
      gold_rate_alerts: {
        Row: GoldRateAlert;
        Insert: CreateAlertPayload;
        Update: UpdateAlertPayload;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
