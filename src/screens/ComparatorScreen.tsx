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
} from 'react-native';
import type { MainTabScreenProps } from '@/navigation/types';
import { colors } from '@/theme';
import { ArrowLeftRight, TrendingDown, TrendingUp, Trophy, ChevronDown } from 'lucide-react-native';
import {
  compareMarkets,
  getCurrencySymbol,
  type Currency,
  type PriceUnit,
  type ComparisonUnit,
  type RoundingMode,
} from '@/services/goldPriceService';

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

  // Market B
  const [priceB, setPriceB] = useState('');
  const [currencyB, setCurrencyB] = useState<Currency | null>(null);
  const [unitB, setUnitB] = useState<PriceUnit | null>(null);
  const [feeB, setFeeB] = useState('0');

  // FX Rate
  const [fxRate, setFxRate] = useState('');
  const [fxReversed, setFxReversed] = useState(false);

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

  const swapFxRate = () => {
    const current = parseFloat(fxRate);
    if (current > 0) {
      setFxRate((1 / current).toFixed(6));
      setFxReversed(!fxReversed);
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

        {/* Market A Card */}
        <View style={styles.marketCard}>
          <View style={styles.marketHeader}>
            <View style={styles.marketBadge}>
              <Text style={styles.marketBadgeText}>Market A</Text>
            </View>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Price</Text>
            <TextInput
              style={styles.input}
              value={priceA}
              onChangeText={setPriceA}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
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

            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Unit</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowUnitADropdown(true)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dropdownText,
                  !unitA && styles.dropdownPlaceholder
                ]}>
                  {unitA ? PRICE_UNITS.find(u => u.value === unitA)?.label : 'Select Unit'}
                </Text>
                <ChevronDown size={20} color={colors.gold[500]} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputRow}>
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

        {/* Market B Card */}
        <View style={styles.marketCard}>
          <View style={styles.marketHeader}>
            <View style={[styles.marketBadge, styles.marketBadgeB]}>
              <Text style={styles.marketBadgeText}>Market B</Text>
            </View>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Price</Text>
            <TextInput
              style={styles.input}
              value={priceB}
              onChangeText={setPriceB}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
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

            <View style={styles.halfInput}>
              <Text style={styles.inputLabel}>Unit</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowUnitBDropdown(true)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.dropdownText,
                  !unitB && styles.dropdownPlaceholder
                ]}>
                  {unitB ? PRICE_UNITS.find(u => u.value === unitB)?.label : 'Select Unit'}
                </Text>
                <ChevronDown size={20} color={colors.gold[500]} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputRow}>
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

        {/* FX Rate Card */}
        <View style={styles.fxCard}>
          <Text style={styles.sectionLabel}>Exchange Rate</Text>
          <View style={styles.fxRow}>
            <Text style={styles.fxCurrency}>
              {fxReversed ? (currencyB || '—') : (currencyA || '—')}
            </Text>
            <TextInput
              style={styles.fxInput}
              value={fxRate}
              onChangeText={setFxRate}
              keyboardType="decimal-pad"
              placeholder="1.00"
              placeholderTextColor={colors.text.tertiary}
            />
            <Text style={styles.fxCurrency}>
              {fxReversed ? (currencyA || '—') : (currencyB || '—')}
            </Text>
            <TouchableOpacity onPress={swapFxRate} style={styles.swapButton}>
              <ArrowLeftRight size={20} color={colors.gold[500]} />
            </TouchableOpacity>
          </View>
          <Text style={styles.fxHint}>
            1 {fxReversed ? (currencyB || '—') : (currencyA || '—')} = {fxRate || '—'} {fxReversed ? (currencyA || '—') : (currencyB || '—')}
          </Text>
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
                onPress={() => {
                  if (curr !== currencyB) {
                    setCurrencyA(curr);
                    setShowCurrencyADropdown(false);
                  }
                }}
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
                onPress={() => {
                  if (curr !== currencyA) {
                    setCurrencyB(curr);
                    setShowCurrencyBDropdown(false);
                  }
                }}
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
                onPress={() => {
                  setUnitA(unit.value);
                  setShowUnitADropdown(false);
                }}
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
                onPress={() => {
                  setUnitB(unit.value);
                  setShowUnitBDropdown(false);
                }}
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
