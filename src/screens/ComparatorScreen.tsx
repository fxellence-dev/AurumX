/**
 * Comparator Screen
 * Compare gold prices between two markets with currency conversion
 */

import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from 'react-native';
import type { MainTabScreenProps } from '@/navigation/types';
import { colors } from '@/theme';
import { ArrowLeftRight, TrendingDown, TrendingUp, Trophy, ChevronDown, RefreshCw, Info } from 'lucide-react-native';
import {
  compareMarkets,
  getCurrencySymbol,
  type Currency,
  type PriceUnit,
  type ComparisonUnit,
  type RoundingMode,
} from '@/services/goldPriceService';
import { supabase } from '@/lib/supabase';

const CURRENCIES: Currency[] = ['USD', 'INR', 'GBP', 'EUR'];
const PRICE_UNITS: { value: PriceUnit; label: string }[] = [
  { value: 'g', label: 'Per Gram' },
  { value: '10g', label: 'Per 10 Grams' },
  { value: 'oz', label: 'Per Ounce' },
  { value: 'troyoz', label: 'Per Troy Oz' },
];
const COMPARISON_UNITS: { value: ComparisonUnit; label: string }[] = [
  { value: 'g', label: 'Per Gram' },
  { value: 'oz', label: 'Per Ounce' },
  { value: 'troyoz', label: 'Per Troy Oz' },
];
const ROUNDING_MODES: { value: RoundingMode; label: string }[] = [
  { value: 'bankers', label: "Banker's" },
  { value: 'halfup', label: 'Half Up' },
  { value: 'truncate', label: 'Truncate' },
];

export default function ComparatorScreen({ navigation }: MainTabScreenProps<'Comparator'>) {
  // Market A
  const [priceA, setPriceA] = useState('');
  const [currencyA, setCurrencyA] = useState<Currency | null>(null);
  const [unitA, setUnitA] = useState<PriceUnit | null>(null);
  const [feeA, setFeeA] = useState('0');
  const [loadingLiveRateA, setLoadingLiveRateA] = useState(false);
  const [liveRateTimestampA, setLiveRateTimestampA] = useState<string | null>(null);

  // Market B
  const [priceB, setPriceB] = useState('');
  const [currencyB, setCurrencyB] = useState<Currency | null>(null);
  const [unitB, setUnitB] = useState<PriceUnit | null>(null);
  const [feeB, setFeeB] = useState('0');
  const [loadingLiveRateB, setLoadingLiveRateB] = useState(false);
  const [liveRateTimestampB, setLiveRateTimestampB] = useState<string | null>(null);

  // FX Rate
  const [fxRate, setFxRate] = useState('');
  const [fxReversed, setFxReversed] = useState(false);
  const [loadingFxRate, setLoadingFxRate] = useState(false);
  const [fxRateTimestamp, setFxRateTimestamp] = useState<string | null>(null);

  // Comparison Settings
  const [comparisonUnit, setComparisonUnit] = useState<ComparisonUnit>('g');
  const [roundingMode, setRoundingMode] = useState<RoundingMode>('halfup');
  const [resultMarket, setResultMarket] = useState<'A' | 'B'>('B');

  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof compareMarkets> | null>(null);

  // Dropdown states
  const [showCurrencyADropdown, setShowCurrencyADropdown] = useState(false);
  const [showCurrencyBDropdown, setShowCurrencyBDropdown] = useState(false);
  const [showUnitADropdown, setShowUnitADropdown] = useState(false);
  const [showUnitBDropdown, setShowUnitBDropdown] = useState(false);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const resultsRef = useRef<View>(null);

  /**
   * Fetch live gold rate from Supabase cache for a given currency
   */
  const fetchLiveRate = async (currency: Currency): Promise<{ price: number; timestamp: string } | null> => {
    try {
      const { data, error } = await supabase
        .from('gold_prices_cache')
        .select('price_per_oz, created_at')
        .eq('currency', currency)
        .order('created_at', { ascending: false })
        .limit(1)
        .single<{ price_per_oz: number; created_at: string }>();

      if (error) {
        console.error('Error fetching live rate:', error);
        return null;
      }

      if (data) {
        return {
          price: data.price_per_oz,
          timestamp: data.created_at,
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching live rate:', error);
      return null;
    }
  };

  /**
   * Handle currency selection for Market A with auto-fill
   */
  const handleCurrencyAChange = async (currency: Currency) => {
    if (currency === currencyB) {
      return; // Can't select same currency
    }

    setCurrencyA(currency);
    setShowCurrencyADropdown(false);

    // Auto-fill with live rate
    setLoadingLiveRateA(true);
    const liveRate = await fetchLiveRate(currency);
    setLoadingLiveRateA(false);

    if (liveRate) {
      setPriceA(liveRate.price.toFixed(2));
      setUnitA('troyoz'); // Auto-select Troy Oz
      setLiveRateTimestampA(liveRate.timestamp);
    }

    // Auto-fill FX rate if both currencies are selected
    if (currencyB) {
      await fetchAndSetFxRate(currency, currencyB);
    }
  };

  /**
   * Handle currency selection for Market B with auto-fill
   */
  const handleCurrencyBChange = async (currency: Currency) => {
    if (currency === currencyA) {
      return; // Can't select same currency
    }

    setCurrencyB(currency);
    setShowCurrencyBDropdown(false);

    // Auto-fill with live rate
    setLoadingLiveRateB(true);
    const liveRate = await fetchLiveRate(currency);
    setLoadingLiveRateB(false);

    if (liveRate) {
      setPriceB(liveRate.price.toFixed(2));
      setUnitB('troyoz'); // Auto-select Troy Oz
      setLiveRateTimestampB(liveRate.timestamp);
    }

    // Auto-fill FX rate if both currencies are selected
    if (currencyA) {
      await fetchAndSetFxRate(currencyA, currency);
    }
  };

  /**
   * Fetch FX rate from Supabase cache
   * All rates are stored against GBP base currency
   * Handles conversions: direct (GBP->X), reverse (X->GBP), and cross-rates (X->Y via GBP)
   */
  const fetchFxRate = async (fromCurrency: Currency, toCurrency: Currency): Promise<{ rate: number; timestamp: string } | null> => {
    try {
      // If same currency, rate is 1
      if (fromCurrency === toCurrency) {
        return { rate: 1, timestamp: new Date().toISOString() };
      }

      // Case 1: GBP -> X (direct lookup)
      if (fromCurrency === 'GBP') {
        const { data, error } = await supabase
          .from('fx_rates_cache')
          .select('exchange_rate, fetched_at')
          .eq('base_currency', 'GBP')
          .eq('target_currency', toCurrency)
          .order('fetched_at', { ascending: false })
          .limit(1)
          .single<{ exchange_rate: number; fetched_at: string }>();

        if (error) {
          console.error('Error fetching FX rate:', error);
          return null;
        }

        if (data) {
          return {
            rate: data.exchange_rate,
            timestamp: data.fetched_at,
          };
        }
      }

      // Case 2: X -> GBP (reverse the rate)
      if (toCurrency === 'GBP') {
        const { data, error } = await supabase
          .from('fx_rates_cache')
          .select('exchange_rate, fetched_at')
          .eq('base_currency', 'GBP')
          .eq('target_currency', fromCurrency)
          .order('fetched_at', { ascending: false })
          .limit(1)
          .single<{ exchange_rate: number; fetched_at: string }>();

        if (error) {
          console.error('Error fetching FX rate:', error);
          return null;
        }

        if (data) {
          return {
            rate: 1 / data.exchange_rate, // Reverse the rate
            timestamp: data.fetched_at,
          };
        }
      }

      // Case 3: X -> Y (cross rate via GBP)
      // Formula: X -> Y = (GBP -> Y) / (GBP -> X)
      // Example: INR -> EUR = (GBP -> EUR) / (GBP -> INR)
      const { data: fromData, error: fromError } = await supabase
        .from('fx_rates_cache')
        .select('exchange_rate, fetched_at')
        .eq('base_currency', 'GBP')
        .eq('target_currency', fromCurrency)
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single<{ exchange_rate: number; fetched_at: string }>();

      const { data: toData, error: toError } = await supabase
        .from('fx_rates_cache')
        .select('exchange_rate, fetched_at')
        .eq('base_currency', 'GBP')
        .eq('target_currency', toCurrency)
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single<{ exchange_rate: number; fetched_at: string }>();

      if (fromError || toError) {
        console.error('Error fetching cross FX rate:', fromError || toError);
        return null;
      }

      if (fromData && toData) {
        // Cross rate: (GBP -> toCurrency) / (GBP -> fromCurrency)
        const crossRate = toData.exchange_rate / fromData.exchange_rate;
        
        return {
          rate: crossRate,
          timestamp: toData.fetched_at, // Use the more recent timestamp
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching FX rate:', error);
      return null;
    }
  };

  /**
   * Fetch and set FX rate in the UI
   */
  const fetchAndSetFxRate = async (fromCurrency: Currency, toCurrency: Currency) => {
    setLoadingFxRate(true);
    const fxData = await fetchFxRate(fromCurrency, toCurrency);
    setLoadingFxRate(false);

    if (fxData) {
      setFxRate(fxData.rate.toFixed(6));
      setFxRateTimestamp(fxData.timestamp);
      setFxReversed(false);
    }
  };

  /**
   * Manually refresh live rate for Market A
   */
  const refreshLiveRateA = async () => {
    if (!currencyA) return;

    setLoadingLiveRateA(true);
    const liveRate = await fetchLiveRate(currencyA);
    setLoadingLiveRateA(false);

    if (liveRate) {
      setPriceA(liveRate.price.toFixed(2));
      setLiveRateTimestampA(liveRate.timestamp);
    }
  };

  /**
   * Convert price from Troy Oz to selected unit
   */
  const convertPriceFromTroyOz = (pricePerTroyOz: number, targetUnit: PriceUnit): number => {
    // Price per gram = price per troy oz / 31.1035
    const pricePerGram = pricePerTroyOz / 31.1035;
    
    switch (targetUnit) {
      case 'g':
        return pricePerGram;
      case '10g':
        return pricePerGram * 10;
      case 'oz':
        return pricePerGram * 28.3495; // Regular ounce
      case 'troyoz':
        return pricePerTroyOz;
      default:
        return pricePerTroyOz;
    }
  };

  /**
   * Handle unit change for Market A
   */
  const handleUnitAChange = (newUnit: PriceUnit) => {
    // If we have a live rate timestamp and current price
    if (liveRateTimestampA && priceA && unitA) {
      // Convert the current price back to Troy Oz, then to new unit
      const currentPriceNum = parseFloat(priceA);
      
      // First convert current price to Troy Oz (reverse of convertPriceFromTroyOz)
      let pricePerTroyOz: number;
      const pricePerGram = currentPriceNum / (unitA === 'g' ? 1 : unitA === '10g' ? 10 : unitA === 'oz' ? 28.3495 : 31.1035);
      pricePerTroyOz = pricePerGram * 31.1035;
      
      // Now convert to new unit
      const newPrice = convertPriceFromTroyOz(pricePerTroyOz, newUnit);
      setPriceA(newPrice.toFixed(2));
    }
    
    setUnitA(newUnit);
    setShowUnitADropdown(false);
  };

  /**
   * Handle unit change for Market B
   */
  const handleUnitBChange = (newUnit: PriceUnit) => {
    // If we have a live rate timestamp and current price
    if (liveRateTimestampB && priceB && unitB) {
      // Convert the current price back to Troy Oz, then to new unit
      const currentPriceNum = parseFloat(priceB);
      
      // First convert current price to Troy Oz (reverse of convertPriceFromTroyOz)
      let pricePerTroyOz: number;
      const pricePerGram = currentPriceNum / (unitB === 'g' ? 1 : unitB === '10g' ? 10 : unitB === 'oz' ? 28.3495 : 31.1035);
      pricePerTroyOz = pricePerGram * 31.1035;
      
      // Now convert to new unit
      const newPrice = convertPriceFromTroyOz(pricePerTroyOz, newUnit);
      setPriceB(newPrice.toFixed(2));
    }
    
    setUnitB(newUnit);
    setShowUnitBDropdown(false);
  };

  /**
   * Manually refresh live rate for Market B
   */
  const refreshLiveRateB = async () => {
    if (!currencyB) return;

    setLoadingLiveRateB(true);
    const liveRate = await fetchLiveRate(currencyB);
    setLoadingLiveRateB(false);

    if (liveRate) {
      setPriceB(liveRate.price.toFixed(2));
      setLiveRateTimestampB(liveRate.timestamp);
    }
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const swapFxRate = () => {
    const current = parseFloat(fxRate);
    if (current > 0) {
      setFxRate((1 / current).toFixed(6));
      setFxReversed(!fxReversed);
      setFxRateTimestamp(null); // Clear timestamp since rate is manually inverted
      // Don't swap currencies - just invert the rate
      // The FX rate display will automatically update to show the inverted relationship
    }
  };

  const handleCompare = () => {
    // Validate all required fields
    if (!currencyA || !currencyB || !unitA || !unitB || !priceA || !priceB || !fxRate) {
      return; // Don't proceed if any required field is missing
    }

    const actualFxRate = fxReversed ? 1 / parseFloat(fxRate) : parseFloat(fxRate);
    
    const comparisonResult = compareMarkets({
      marketA: {
        price: parseFloat(priceA) || 0,
        currency: currencyA,
        unit: unitA,
        feePercentage: parseFloat(feeA) || 0,
      },
      marketB: {
        price: parseFloat(priceB) || 0,
        currency: currencyB,
        unit: unitB,
        feePercentage: parseFloat(feeB) || 0,
      },
      fxRate: actualFxRate,
      comparisonUnit,
      roundingMode,
      targetMarket: resultMarket,
    });

    setResult(comparisonResult);
    setShowResults(true);

    // Auto-scroll to results after a short delay
    setTimeout(() => {
      resultsRef.current?.measureLayout(
        scrollViewRef.current as any,
        (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
        },
        () => {}
      );
    }, 100);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const getUnitLabel = (unit: ComparisonUnit): string => {
    switch (unit) {
      case 'g': return 'gram';
      case 'oz': return 'ounce';
      case 'troyoz': return 'troy oz';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Market Comparator</Text>
          <Text style={styles.subtitle}>
            Compare gold prices between two markets
          </Text>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Info size={16} color={colors.accent.blue} />
          <Text style={styles.infoBannerText}>
            Live market rates are auto-populated with Troy Oz unit. You can modify them if needed.
          </Text>
        </View>

        {/* Market A Card */}
        <View style={styles.marketCard}>
          <View style={styles.marketHeader}>
            <View style={styles.marketBadge}>
              <Text style={styles.marketBadgeText}>Market A</Text>
            </View>
          </View>

          {/* Currency First */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Currency</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowCurrencyADropdown(true)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dropdownText,
                !currencyA && styles.dropdownPlaceholder
              ]}>
                {currencyA ? `${getCurrencySymbol(currencyA)} ${currencyA}` : 'Select Currency'}
              </Text>
              <ChevronDown size={20} color={colors.gold[500]} />
            </TouchableOpacity>
          </View>

          {/* Price with Live Rate Indicator */}
          <View style={styles.inputRow}>
            <View style={styles.labelWithRefresh}>
              <Text style={styles.inputLabel}>Price per Troy Oz</Text>
              {currencyA && (
                <TouchableOpacity onPress={refreshLiveRateA} disabled={loadingLiveRateA}>
                  {loadingLiveRateA ? (
                    <ActivityIndicator size="small" color={colors.gold[500]} />
                  ) : (
                    <RefreshCw size={16} color={colors.gold[500]} />
                  )}
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.input}
              value={priceA}
              onChangeText={(text) => {
                setPriceA(text);
                setLiveRateTimestampA(null); // Clear timestamp when manually editing
              }}
              keyboardType="decimal-pad"
              placeholder="Select currency first"
              placeholderTextColor={colors.text.tertiary}
              editable={!!currencyA}
            />
            {liveRateTimestampA && (
              <Text style={styles.liveRateHint}>
                Rate updated {formatTimestamp(liveRateTimestampA)}
              </Text>
            )}
          </View>

          {/* Unit and Fee */}
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Unit</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowUnitADropdown(true)}
                activeOpacity={0.7}
                disabled={!currencyA}
              >
                <Text style={[
                  styles.dropdownText,
                  !unitA && styles.dropdownPlaceholder
                ]}>
                  {unitA ? PRICE_UNITS.find(u => u.value === unitA)?.label : 'Auto-set'}
                </Text>
                <ChevronDown size={20} color={colors.gold[500]} />
              </TouchableOpacity>
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Fee/Markup %</Text>
              <TextInput
                style={styles.input}
                value={feeA}
                onChangeText={setFeeA}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
          </View>
        </View>

        {/* Market B Card */}
        <View style={styles.marketCard}>
          <View style={styles.marketHeader}>
            <View style={[styles.marketBadge, styles.marketBadgeB]}>
              <Text style={styles.marketBadgeText}>Market B</Text>
            </View>
          </View>

          {/* Currency First */}
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Currency</Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setShowCurrencyBDropdown(true)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dropdownText,
                !currencyB && styles.dropdownPlaceholder
              ]}>
                {currencyB ? `${getCurrencySymbol(currencyB)} ${currencyB}` : 'Select Currency'}
              </Text>
              <ChevronDown size={20} color={colors.gold[500]} />
            </TouchableOpacity>
          </View>

          {/* Price with Live Rate Indicator */}
          <View style={styles.inputRow}>
            <View style={styles.labelWithRefresh}>
              <Text style={styles.inputLabel}>Price per Troy Oz</Text>
              {currencyB && (
                <TouchableOpacity onPress={refreshLiveRateB} disabled={loadingLiveRateB}>
                  {loadingLiveRateB ? (
                    <ActivityIndicator size="small" color={colors.gold[500]} />
                  ) : (
                    <RefreshCw size={16} color={colors.gold[500]} />
                  )}
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.input}
              value={priceB}
              onChangeText={(text) => {
                setPriceB(text);
                setLiveRateTimestampB(null); // Clear timestamp when manually editing
              }}
              keyboardType="decimal-pad"
              placeholder="Select currency first"
              placeholderTextColor={colors.text.tertiary}
              editable={!!currencyB}
            />
            {liveRateTimestampB && (
              <Text style={styles.liveRateHint}>
                Rate updated {formatTimestamp(liveRateTimestampB)}
              </Text>
            )}
          </View>

          {/* Unit and Fee */}
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Unit</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowUnitBDropdown(true)}
                activeOpacity={0.7}
                disabled={!currencyB}
              >
                <Text style={[
                  styles.dropdownText,
                  !unitB && styles.dropdownPlaceholder
                ]}>
                  {unitB ? PRICE_UNITS.find(u => u.value === unitB)?.label : 'Auto-set'}
                </Text>
                <ChevronDown size={20} color={colors.gold[500]} />
              </TouchableOpacity>
            </View>

            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Fee/Markup %</Text>
              <TextInput
                style={styles.input}
                value={feeB}
                onChangeText={setFeeB}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
          </View>
        </View>

        {/* FX Rate Card */}
        <View style={styles.fxCard}>
          <View style={styles.labelWithRefresh}>
            <Text style={styles.sectionLabel}>Exchange Rate</Text>
            {currencyA && currencyB && (
              <TouchableOpacity
                onPress={() => fetchAndSetFxRate(currencyA, currencyB)}
                style={styles.refreshButton}
                disabled={loadingFxRate}
              >
                {loadingFxRate ? (
                  <ActivityIndicator size="small" color={colors.gold[500]} />
                ) : (
                  <RefreshCw size={16} color={colors.gold[500]} />
                )}
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.fxRow}>
            <Text style={styles.fxCurrency}>
              {fxReversed ? (currencyB || '—') : (currencyA || '—')}
            </Text>
            <TextInput
              style={styles.fxInput}
              value={fxRate}
              onChangeText={(text) => {
                setFxRate(text);
                setFxRateTimestamp(null); // Clear timestamp when manually editing
              }}
              keyboardType="decimal-pad"
              placeholder="Select currencies"
              placeholderTextColor={colors.text.tertiary}
              editable={!!currencyA && !!currencyB}
            />
            <Text style={styles.fxCurrency}>
              {fxReversed ? (currencyA || '—') : (currencyB || '—')}
            </Text>
            <TouchableOpacity onPress={swapFxRate} style={styles.swapButton}>
              <ArrowLeftRight size={20} color={colors.gold[500]} />
            </TouchableOpacity>
          </View>
          {fxRateTimestamp && (
            <Text style={styles.liveRateHint}>
              Rate updated {formatTimestamp(fxRateTimestamp)}
            </Text>
          )}
          {!fxRateTimestamp && fxRate && (
            <Text style={styles.fxHint}>
              1 {fxReversed ? (currencyB || '—') : (currencyA || '—')} = {fxRate || '—'} {fxReversed ? (currencyA || '—') : (currencyB || '—')}
            </Text>
          )}
        </View>

        {/* Comparison Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.sectionLabel}>Comparison Settings</Text>
          
          <Text style={styles.settingLabel}>Compare Per</Text>
          <View style={styles.settingButtons}>
            {COMPARISON_UNITS.map(unit => (
              <TouchableOpacity
                key={unit.value}
                style={[
                  styles.settingButton,
                  comparisonUnit === unit.value && styles.settingButtonActive,
                ]}
                onPress={() => setComparisonUnit(unit.value)}
              >
                <Text
                  style={[
                    styles.settingButtonText,
                    comparisonUnit === unit.value && styles.settingButtonTextActive,
                  ]}
                >
                  {unit.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.settingLabel}>Rounding Mode</Text>
          <View style={styles.settingButtons}>
            {ROUNDING_MODES.map(mode => (
              <TouchableOpacity
                key={mode.value}
                style={[
                  styles.settingButton,
                  roundingMode === mode.value && styles.settingButtonActive,
                ]}
                onPress={() => setRoundingMode(mode.value)}
              >
                <Text
                  style={[
                    styles.settingButtonText,
                    roundingMode === mode.value && styles.settingButtonTextActive,
                  ]}
                >
                  {mode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.settingLabel}>Display Results In</Text>
          <View style={styles.settingButtons}>
            <TouchableOpacity
              style={[
                styles.settingButton,
                resultMarket === 'A' && styles.settingButtonActive,
              ]}
              onPress={() => setResultMarket('A')}
            >
              <Text
                style={[
                  styles.settingButtonText,
                  resultMarket === 'A' && styles.settingButtonTextActive,
                ]}
              >
                Market A {currencyA ? `(${getCurrencySymbol(currencyA)} ${currencyA})` : ''}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.settingButton,
                resultMarket === 'B' && styles.settingButtonActive,
              ]}
              onPress={() => setResultMarket('B')}
            >
              <Text
                style={[
                  styles.settingButtonText,
                  resultMarket === 'B' && styles.settingButtonTextActive,
                ]}
              >
                Market B {currencyB ? `(${getCurrencySymbol(currencyB)} ${currencyB})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Compare Button */}
        <TouchableOpacity
          style={[
            styles.compareButton,
            (!currencyA || !currencyB || !unitA || !unitB || !priceA || !priceB || !fxRate) && styles.compareButtonDisabled
          ]}
          onPress={handleCompare}
          activeOpacity={0.8}
          disabled={!currencyA || !currencyB || !unitA || !unitB || !priceA || !priceB || !fxRate}
        >
          <Text style={styles.compareButtonText}>Compare Markets</Text>
        </TouchableOpacity>

        {/* Results */}
        {result && (
          <View ref={resultsRef} style={styles.resultsContainer}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Comparison Results</Text>
              <Text style={styles.resultsSubtitle}>Your detailed analysis</Text>
            </View>

            {/* Normalized Prices */}
            <View style={styles.resultRow}>
              <View style={styles.resultHalf}>
                <View style={styles.resultBadge}>
                  <Text style={styles.resultBadgeText}>Market A</Text>
                </View>
                <Text style={styles.resultPrice}>
                  {formatNumber(result.marketA.normalizedPrice)}
                </Text>
                <Text style={styles.resultUnit}>
                  {getCurrencySymbol(result.targetCurrency)} per {getUnitLabel(result.marketA.unit)}
                </Text>
              </View>

              <View style={[styles.resultHalf, styles.resultHalfB]}>
                <View style={[styles.resultBadge, styles.resultBadgeB]}>
                  <Text style={styles.resultBadgeText}>Market B</Text>
                </View>
                <Text style={styles.resultPrice}>
                  {formatNumber(result.marketB.normalizedPrice)}
                </Text>
                <Text style={styles.resultUnit}>
                  {getCurrencySymbol(result.targetCurrency)} per {getUnitLabel(result.marketB.unit)}
                </Text>
              </View>
            </View>

            {/* Absolute Difference */}
            <View style={styles.diffCard}>
              <Text style={styles.diffLabel}>Absolute Difference</Text>
              <View style={styles.diffRow}>
                {result.absoluteDifference > 0 ? (
                  <TrendingUp size={24} color={colors.accent.red} />
                ) : (
                  <TrendingDown size={24} color={colors.accent.green} />
                )}
                <Text style={styles.diffValue}>
                  {result.absoluteDifference > 0 ? '+' : ''}
                  {formatNumber(Math.abs(result.absoluteDifference))}
                </Text>
              </View>
              <Text style={styles.diffSubtext}>
                {result.targetCurrency} (Market A − Market B)
              </Text>
            </View>

            {/* Percentage Differences */}
            <View style={styles.percentageRow}>
              <View style={styles.percentageCard}>
                <Text style={styles.percentageLabel}>A Higher vs Market B</Text>
                <Text style={styles.percentageValue}>
                  {formatNumber(Math.abs(result.percentageVsB))}%
                </Text>
              </View>

              <View style={styles.percentageCard}>
                <Text style={styles.percentageLabel}>vs Market A</Text>
                <Text style={styles.percentageValue}>
                  {formatNumber(Math.abs(result.percentageVsA))}%
                </Text>
              </View>
            </View>

            {/* Winner Card */}
            <View style={styles.winnerCard}>
              <Trophy size={32} color={colors.gold[500]} />
              <Text style={styles.winnerTitle}>
                Market {result.cheaperMarket} is Cheaper!
              </Text>
              <Text style={styles.winnerSavings}>
                Save {formatNumber(result.savings)} {result.targetCurrency}
              </Text>
              <Text style={styles.winnerUnit}>per {getUnitLabel(comparisonUnit)}</Text>
              <Text style={styles.winnerSubtext}>✨ Best value for your money!</Text>
            </View>
          </View>
        )}

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Currency A Dropdown Modal */}
      <Modal
        visible={showCurrencyADropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCurrencyADropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCurrencyADropdown(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency - Market A</Text>
              <Text style={styles.modalSubtitle}>Choose a different currency from Market B</Text>
            </View>
            {CURRENCIES.map(curr => (
              <TouchableOpacity
                key={curr}
                style={[
                  styles.modalOption,
                  currencyA === curr && styles.modalOptionActive,
                  curr === currencyB && styles.modalOptionDisabled,
                ]}
                onPress={() => handleCurrencyAChange(curr)}
                disabled={curr === currencyB}
              >
                <View style={styles.modalOptionLeft}>
                  <Text style={styles.modalOptionSymbol}>{getCurrencySymbol(curr)}</Text>
                  <Text style={[
                    styles.modalOptionText,
                    curr === currencyB && styles.modalOptionTextDisabled,
                  ]}>
                    {curr}
                  </Text>
                </View>
                {currencyA === curr && (
                  <View style={styles.modalOptionCheck}>
                    <Text style={styles.modalOptionCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Currency B Dropdown Modal */}
      <Modal
        visible={showCurrencyBDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCurrencyBDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCurrencyBDropdown(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency - Market B</Text>
              <Text style={styles.modalSubtitle}>Choose a different currency from Market A</Text>
            </View>
            {CURRENCIES.map(curr => (
              <TouchableOpacity
                key={curr}
                style={[
                  styles.modalOption,
                  currencyB === curr && styles.modalOptionActive,
                  curr === currencyA && styles.modalOptionDisabled,
                ]}
                onPress={() => handleCurrencyBChange(curr)}
                disabled={curr === currencyA}
              >
                <View style={styles.modalOptionLeft}>
                  <Text style={styles.modalOptionSymbol}>{getCurrencySymbol(curr)}</Text>
                  <Text style={[
                    styles.modalOptionText,
                    curr === currencyA && styles.modalOptionTextDisabled,
                  ]}>
                    {curr}
                  </Text>
                </View>
                {currencyB === curr && (
                  <View style={styles.modalOptionCheck}>
                    <Text style={styles.modalOptionCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Unit A Dropdown Modal */}
      <Modal
        visible={showUnitADropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnitADropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUnitADropdown(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Unit - Market A</Text>
              <Text style={styles.modalSubtitle}>Choose pricing unit for this market</Text>
            </View>
            {PRICE_UNITS.map(unit => (
              <TouchableOpacity
                key={unit.value}
                style={[
                  styles.modalOption,
                  unitA === unit.value && styles.modalOptionActive,
                ]}
                onPress={() => handleUnitAChange(unit.value)}
              >
                <View style={styles.modalOptionLeft}>
                  <Text style={styles.modalOptionText}>
                    {unit.label}
                  </Text>
                </View>
                {unitA === unit.value && (
                  <View style={styles.modalOptionCheck}>
                    <Text style={styles.modalOptionCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Unit B Dropdown Modal */}
      <Modal
        visible={showUnitBDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnitBDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUnitBDropdown(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Unit - Market B</Text>
              <Text style={styles.modalSubtitle}>Choose pricing unit for this market</Text>
            </View>
            {PRICE_UNITS.map(unit => (
              <TouchableOpacity
                key={unit.value}
                style={[
                  styles.modalOption,
                  unitB === unit.value && styles.modalOptionActive,
                ]}
                onPress={() => handleUnitBChange(unit.value)}
              >
                <View style={styles.modalOptionLeft}>
                  <Text style={styles.modalOptionText}>
                    {unit.label}
                  </Text>
                </View>
                {unitB === unit.value && (
                  <View style={styles.modalOptionCheck}>
                    <Text style={styles.modalOptionCheckText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.blue + '15',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.accent.blue,
    lineHeight: 18,
  },
  marketCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  marketHeader: {
    marginBottom: 16,
  },
  marketBadge: {
    backgroundColor: colors.accent.blue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  marketBadgeB: {
    backgroundColor: colors.accent.green,
  },
  marketBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  inputRow: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  labelWithRefresh: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refreshButton: {
    padding: 4,
  },
  liveRateHint: {
    fontSize: 11,
    color: colors.accent.green,
    marginTop: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.default,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
  },
  fxCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  fxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fxCurrency: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gold[500],
  },
  fxInput: {
    flex: 1,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.default,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
  },
  swapButton: {
    padding: 8,
    backgroundColor: colors.background.primary,
    borderRadius: 8,
  },
  fxHint: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 8,
    textAlign: 'center',
  },
  settingsCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  settingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 8,
    marginTop: 8,
  },
  settingButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  settingButton: {
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border.default,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  settingButtonActive: {
    backgroundColor: colors.gold[500],
    borderColor: colors.gold[500],
  },
  settingButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.primary,
  },
  settingButtonTextActive: {
    color: colors.background.primary,
  },
  compareButton: {
    backgroundColor: colors.gold[500],
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  compareButtonDisabled: {
    backgroundColor: colors.border.default,
    opacity: 0.5,
  },
  compareButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background.primary,
  },
  resultsContainer: {
    marginBottom: 24,
  },
  resultsHeader: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  resultsSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  resultRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  resultHalf: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: colors.accent.blue,
  },
  resultHalfB: {
    borderColor: colors.accent.green,
  },
  resultBadge: {
    backgroundColor: colors.accent.blue,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  resultBadgeB: {
    backgroundColor: colors.accent.green,
  },
  resultBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },
  resultPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gold[500],
    marginBottom: 4,
  },
  resultUnit: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  diffCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  diffLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  diffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  diffValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gold[500],
  },
  diffSubtext: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  percentageRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  percentageCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  percentageLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
    marginBottom: 8,
    textAlign: 'center',
  },
  percentageValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.accent.purple,
  },
  winnerCard: {
    backgroundColor: colors.gold[500],
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  winnerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.background.primary,
    marginTop: 12,
    marginBottom: 8,
  },
  winnerSavings: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.background.primary,
    marginBottom: 4,
  },
  winnerUnit: {
    fontSize: 14,
    color: colors.background.primary,
    opacity: 0.8,
    marginBottom: 12,
  },
  winnerSubtext: {
    fontSize: 14,
    color: colors.background.primary,
    opacity: 0.9,
  },
  bottomSpacer: {
    height: 100,
  },
  // Dropdown styles
  dropdown: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border.default,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  dropdownPlaceholder: {
    color: colors.text.tertiary,
    fontWeight: '400',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  modalHeader: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.border.default,
  },
  modalOptionActive: {
    backgroundColor: colors.gold[500],
    borderColor: colors.gold[500],
  },
  modalOptionDisabled: {
    opacity: 0.3,
  },
  modalOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalOptionSymbol: {
    fontSize: 24,
    fontWeight: '700',
  },
  modalOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalOptionTextDisabled: {
    color: colors.text.tertiary,
  },
  modalOptionCheck: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOptionCheckText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gold[500],
  },
});
