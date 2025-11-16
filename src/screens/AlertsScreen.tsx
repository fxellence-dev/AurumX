/**
 * Alerts Screen
 * Manage gold price alerts with Google authentication
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import type { MainTabScreenProps } from '@/navigation/types';
import { colors } from '@/theme';
import { Bell, Plus, LogOut, TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { TradingViewMiniWidget } from '@/components/TradingViewMiniWidget';
import { CreateAlertModal } from '@/components/CreateAlertModal';
import { useCustomAlert } from '@/components/CustomAlert';

// Gold symbols matching Live Rates screen
const GOLD_SYMBOLS = [
  { symbol: 'OANDA:XAUUSD', code: 'USD', flag: '🇺🇸', name: 'US Dollar' },
  { symbol: 'FX_IDC:XAUINR', code: 'INR', flag: '🇮🇳', name: 'Indian Rupee' },
  { symbol: 'ICMARKETS:XAUGBP', code: 'GBP', flag: '🇬🇧', name: 'British Pound' },
  { symbol: 'ICMARKETS:XAUEUR', code: 'EUR', flag: '🇪🇺', name: 'Euro' },
];

export default function AlertsScreen({ navigation }: MainTabScreenProps<'Alerts'>) {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const { showAlert, AlertComponent } = useCustomAlert();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(0); // Index of selected currency
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
      showAlert(
        'error',
        'Sign In Failed',
        'Unable to sign in with Google. Please try again.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    showAlert(
      'warning',
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              console.log('✅ Sign out completed');
            } catch (error: any) {
              console.error('Sign out failed:', error);
              // Don't show error alert for "session missing" errors as they're handled gracefully
              if (!error?.message?.includes('session missing') && error?.name !== 'AuthSessionMissingError') {
                showAlert('error', 'Error', 'Failed to sign out. Please try again.');
              }
            }
          },
        },
      ]
    );
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.gold[500]} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Not authenticated - show login screen
  if (!user) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* 3D Icon Container */}
          <View style={styles.iconWrapper}>
            {/* Shadow layers for 3D depth */}
            <View style={[styles.iconShadow, styles.iconShadow1]} />
            <View style={[styles.iconShadow, styles.iconShadow2]} />
            
            {/* Main gradient icon container - Purple theme for alerts */}
            <LinearGradient
              colors={['#A78BFA', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <View style={styles.iconInner}>
                <Bell size={56} color="#FFFFFF" strokeWidth={2.5} />
              </View>
            </LinearGradient>
          </View>
          
          <Text style={styles.title}>Price Alerts</Text>
          <Text style={styles.description}>
            Get notified when gold prices hit your target. Create custom alerts for different markets and currencies.
          </Text>

          {/* Sign in button */}
          <TouchableOpacity
            style={styles.signInButton}
            onPress={handleSignIn}
            disabled={isSigningIn}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F3F4F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.signInGradient}
            >
              {isSigningIn ? (
                <ActivityIndicator size="small" color="#1F2937" />
              ) : (
                <>
                  <Image
                    source={{ uri: 'https://www.google.com/favicon.ico' }}
                    style={styles.googleIcon}
                  />
                  <Text style={styles.signInText}>Continue with Google</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.privacyText}>
            We'll never post without your permission
          </Text>
        </ScrollView>
      </View>
    );
  }

  // Authenticated - show alerts management
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentAuthenticated}>
        {/* User Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileInfo}>
            {user.user_metadata?.avatar_url && (
              <Image
                source={{ uri: user.user_metadata.avatar_url }}
                style={styles.avatar}
              />
            )}
            <View style={styles.profileText}>
              <Text style={styles.userName}>
                {user.user_metadata?.full_name || user.email}
              </Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <LogOut size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Live Gold Rates Section */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <TrendingUp size={20} color={colors.gold[500]} />
            <Text style={styles.sectionTitle}>Live Gold Rates</Text>
          </View>
          <View style={styles.liveBadge}>
            <View style={styles.liveIndicator} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        {/* Currency Selector Tabs */}
        <View style={styles.currencyTabsContainer}>
          {GOLD_SYMBOLS.map((item, index) => (
            <TouchableOpacity
              key={item.code}
              style={[
                styles.currencyTab,
                selectedCurrency === index && styles.currencyTabActive,
              ]}
              onPress={() => setSelectedCurrency(index)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.currencyTabText,
                  selectedCurrency === index && styles.currencyTabTextActive,
                ]}
              >
                {item.code}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Full Width TradingView Widget */}
        <View style={styles.fullWidthWidgetCard}>
          <TradingViewMiniWidget 
            symbol={GOLD_SYMBOLS[selectedCurrency].symbol} 
            height={220} 
          />
        </View>

        {/* Troy Ounce Footnote */}
        <View style={styles.footnoteContainer}>
          <Text style={styles.footnoteText}>
            * All rates are per Troy Ounce (T Oz) • 1 T Oz = 31.1035 grams
          </Text>
        </View>

        {/* My Alerts Section Header */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Bell size={20} color={colors.gold[500]} />
            <Text style={styles.sectionTitle}>My Alerts</Text>
          </View>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setIsCreateModalVisible(true)}
          >
            <Plus size={20} color={colors.gold[500]} />
          </TouchableOpacity>
        </View>

        {/* Coming Soon - Alert Management */}
        <View style={styles.comingSoonCard}>
          <Bell size={48} color={colors.text.tertiary} strokeWidth={2} />
          <Text style={styles.comingSoonTitle}>Alert Management Coming Soon</Text>
          <Text style={styles.comingSoonDescription}>
            Create and manage price alerts for different markets. Get notified via email when prices hit your targets.
          </Text>
        </View>
      </ScrollView>

      {/* Create Alert Modal */}
      <CreateAlertModal
        visible={isCreateModalVisible}
        onClose={() => setIsCreateModalVisible(false)}
        onSuccess={() => {
          // TODO: Refresh alerts list
          console.log('Alert created successfully');
        }}
      />

      {/* Custom Alert Component */}
      {AlertComponent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  contentAuthenticated: {
    flexGrow: 1,
    padding: 20,
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: 32,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 32,
    padding: 3,
  },
  iconInner: {
    flex: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconShadow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 32,
    backgroundColor: '#4C1D95',
  },
  iconShadow1: {
    opacity: 0.3,
    top: 4,
    left: 4,
  },
  iconShadow2: {
    opacity: 0.15,
    top: 8,
    left: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gold[500],
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  signInButton: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  signInGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  signInText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  privacyText: {
    fontSize: 12,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  profileCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: colors.background.tertiary,
  },
  profileText: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  signOutButton: {
    padding: 8,
  },
  comingSoonCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  comingSoonDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Section Header Styles
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    marginTop: 8,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
    letterSpacing: 0.5,
  },
  addButton: {
    padding: 8,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  // Currency Tabs Styles
  currencyTabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  currencyTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
  },
  currencyTabActive: {
    backgroundColor: colors.gold[500],
    borderColor: colors.gold[500],
  },
  currencyTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  currencyTabTextActive: {
    color: colors.background.primary,
  },
  // Full Width Widget Card
  fullWidthWidgetCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 0,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: 12,
    overflow: 'hidden',
  },
  // Footnote Styles
  footnoteContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  footnoteText: {
    fontSize: 11,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
