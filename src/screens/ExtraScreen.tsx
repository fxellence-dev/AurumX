/**
 * Extra Screen
 * Gold investment resources and dealers in the UK
 */

import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Linking } from 'react-native';
import type { MainTabScreenProps } from '@/navigation/types';
import { colors } from '@/theme';
import { ExternalLink, Shield, Award, TrendingUp, Star } from 'lucide-react-native';

// UK Gold Investment Dealers
const GOLD_DEALERS = [
  {
    name: 'The Royal Mint',
    description: 'Official UK government mint with over 1,100 years of history',
    website: 'https://www.royalmint.com',
    features: ['Government-backed', 'VAT-free gold', 'Secure storage'],
    rating: 4.8,
    icon: '👑',
  },
  {
    name: 'BullionByPost',
    description: 'UK\'s largest online bullion dealer with competitive prices',
    website: 'https://www.bullionbypost.co.uk',
    features: ['Price match guarantee', 'Free insured delivery', 'Buy-back service'],
    rating: 4.9,
    icon: '🥇',
  },
  {
    name: 'Atkinsons Bullion',
    description: 'Family-run dealer since 2008, trusted by thousands',
    website: 'https://atkinsonsbullion.com',
    features: ['Competitive rates', 'Expert advice', 'Physical & digital'],
    rating: 4.7,
    icon: '💎',
  },
  {
    name: 'Gold.co.uk',
    description: 'Leading precious metals dealer with excellent customer service',
    website: 'https://www.gold.co.uk',
    features: ['Live pricing', 'Secure vault storage', 'Investment advice'],
    rating: 4.6,
    icon: '🏆',
  },
  {
    name: 'Bleyer Bullion',
    description: 'Independent bullion dealer specializing in gold and silver',
    website: 'https://www.bleyer.co.uk',
    features: ['Family business', 'Transparent pricing', 'Expert guidance'],
    rating: 4.7,
    icon: '⭐',
  },
];

export default function ExtraScreen({ navigation }: MainTabScreenProps<'Extra'>) {
  const openWebsite = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Gold Investment</Text>
          <Text style={styles.subtitle}>
            Trusted UK dealers for buying and selling gold
          </Text>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Shield size={20} color={colors.accent.blue} />
          <Text style={styles.infoBannerText}>
            All dealers listed are reputable UK-based companies with excellent track records
          </Text>
        </View>

        {/* Dealer Cards */}
        {GOLD_DEALERS.map((dealer, index) => (
          <TouchableOpacity
            key={index}
            style={styles.dealerCard}
            onPress={() => openWebsite(dealer.website)}
            activeOpacity={0.7}
          >
            {/* Card Header */}
            <View style={styles.dealerHeader}>
              <View style={styles.dealerTitleRow}>
                <Text style={styles.dealerIcon}>{dealer.icon}</Text>
                <View style={styles.dealerTitleContainer}>
                  <Text style={styles.dealerName}>{dealer.name}</Text>
                  <View style={styles.ratingContainer}>
                    <Star size={14} color={colors.gold[500]} fill={colors.gold[500]} />
                    <Text style={styles.ratingText}>{dealer.rating}</Text>
                  </View>
                </View>
              </View>
              <ExternalLink size={20} color={colors.gold[500]} />
            </View>

            {/* Description */}
            <Text style={styles.dealerDescription}>{dealer.description}</Text>

            {/* Features */}
            <View style={styles.featuresContainer}>
              {dealer.features.map((feature, idx) => (
                <View key={idx} style={styles.featureTag}>
                  <Text style={styles.featureTagText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* CTA */}
            <View style={styles.ctaContainer}>
              <Text style={styles.ctaText}>Visit Website</Text>
              <ExternalLink size={16} color={colors.gold[500]} />
            </View>
          </TouchableOpacity>
        ))}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            ⚠️ Disclaimer: This app does not endorse any specific dealer. Please do your own research before making any investment decisions. Past performance does not guarantee future results.
          </Text>
        </View>
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
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.blue + '15',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 10,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: colors.accent.blue,
    lineHeight: 18,
  },
  dealerCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  dealerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dealerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dealerIcon: {
    fontSize: 32,
  },
  dealerTitleContainer: {
    flex: 1,
  },
  dealerName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gold[500],
  },
  dealerDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  featureTag: {
    backgroundColor: colors.gold[500] + '20',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.gold[500] + '30',
  },
  featureTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gold[500],
  },
  ctaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gold[500],
  },
  disclaimer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginTop: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: colors.text.tertiary,
    lineHeight: 18,
    textAlign: 'center',
  },
});
