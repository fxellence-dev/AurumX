/**
 * Live Rates Screen
 * View current gold prices in different currencies
 */

import React from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import type { MainTabScreenProps } from '@/navigation/types';
import { colors } from '@/theme';
import { TradingViewWidget } from '@/components/TradingViewWidget';

const GOLD_SYMBOLS = [
  { symbol: 'OANDA:XAUUSD', code: 'USD', flag: '🇺🇸', name: 'US Dollar' },
  { symbol: 'FX_IDC:XAUINR', code: 'INR', flag: '🇮🇳', name: 'Indian Rupee' },
  { symbol: 'ICMARKETS:XAUGBP', code: 'GBP', flag: '🇬🇧', name: 'British Pound' },
  { symbol: 'ICMARKETS:XAUEUR', code: 'EUR', flag: '🇪🇺', name: 'Euro' },
];

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function LiveRatesScreen({ navigation }: MainTabScreenProps<'LiveRates'>) {
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refresh delay
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const selectedSymbol = GOLD_SYMBOLS[selectedIndex];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Live Gold Rates</Text>
        <Text style={styles.subtitle}>
          Real-time XAU/OZ prices across major currencies
        </Text>
      </View>

      {/* Currency Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {GOLD_SYMBOLS.map((item, index) => (
            <TouchableOpacity
              key={item.code}
              style={[
                styles.tab,
                selectedIndex === index && styles.tabActive,
              ]}
              onPress={() => setSelectedIndex(index)}
              activeOpacity={0.7}
            >
              <Text style={styles.tabFlag}>{item.flag}</Text>
              <Text
                style={[
                  styles.tabText,
                  selectedIndex === index && styles.tabTextActive,
                ]}
              >
                {item.code}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Live Indicator Badge */}
      <View style={styles.liveBadgeContainer}>
        <View style={styles.liveBadge}>
          <View style={styles.liveIndicator} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* TradingView Widget */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold[500]}
          />
        }
      >
        <View style={styles.widgetContainer}>
          <View style={styles.widgetHeaderRow}>
            <View style={styles.widgetTitleContainer}>
              <Text style={styles.widgetTitle}>
                {selectedSymbol.flag} Gold / {selectedSymbol.code}
              </Text>
              <Text style={styles.widgetSubtitle}>
                {selectedSymbol.name}
              </Text>
            </View>
            <View style={styles.conversionBadge}>
              <Text style={styles.conversionLabel}>1 Troy OZ</Text>
              <Text style={styles.conversionValue}>31.1035g</Text>
            </View>
          </View>
          <TradingViewWidget
            symbol={selectedSymbol.symbol}
            currencyCode={selectedSymbol.code}
            height={SCREEN_HEIGHT * 0.45}
          />
        </View>
        {/* Bottom spacing for tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.background.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gold[500],
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  tabsContainer: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  tabsContent: {
    paddingVertical: 4,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  tabActive: {
    backgroundColor: colors.gold[500],
    borderColor: colors.gold[500],
  },
  tabFlag: {
    fontSize: 20,
    marginRight: 8,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: colors.background.primary,
  },
  liveBadgeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'flex-end',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.states.success,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.states.success,
    marginRight: 6,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.states.success,
    letterSpacing: 0.5,
  },
  widgetContainer: {
    marginBottom: 24,
  },
  widgetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  widgetTitleContainer: {
    flex: 1,
  },
  widgetTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  widgetSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  conversionBadge: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
  },
  conversionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  conversionValue: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.gold[500],
  },
  bottomSpacer: {
    height: 100,
  },
});
