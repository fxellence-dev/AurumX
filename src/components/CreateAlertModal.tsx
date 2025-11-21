/**
 * Create Alert Modal
 * Modal for creating new price alerts with various conditions
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/theme';
import { X, TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Currency, AlertCondition } from '@/utils/constants';
import type { CreateAlertPayload } from '@/types/database';
import { useCustomAlert } from './CustomAlert';

// Alert condition types
const ALERT_CONDITIONS = [
  {
    id: 'above',
    emoji: '📈',
    title: 'Price Goes Above',
    description: 'Alert me when price rises above target',
    icon: TrendingUp,
    inputType: 'price',
  },
  {
    id: 'below',
    emoji: '📉',
    title: 'Price Goes Below',
    description: 'Alert me when price falls below target',
    icon: TrendingDown,
    inputType: 'price',
  },
  {
    id: 'change_up',
    emoji: '⬆️',
    title: 'Price Increases By',
    description: 'Alert me when price increases by percentage',
    icon: ArrowUp,
    inputType: 'percent',
  },
  {
    id: 'change_down',
    emoji: '⬇️',
    title: 'Price Decreases By',
    description: 'Alert me when price decreases by percentage',
    icon: ArrowDown,
    inputType: 'percent',
  },
] as const;

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
] as const;

interface CreateAlertModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (newAlert?: any) => void;
  showSuccessAlert?: (message: string) => void;
}

export function CreateAlertModal({ visible, onClose, onSuccess, showSuccessAlert }: CreateAlertModalProps) {
  const { user } = useAuth();
  const { showAlert, AlertComponent } = useCustomAlert();
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
  const [alertName, setAlertName] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedConditionData = ALERT_CONDITIONS.find(c => c.id === selectedCondition);

  const handleReset = () => {
    setSelectedCondition(null);
    setSelectedCurrency('USD');
    setAlertName('');
    setTargetValue('');
    setIsSubmitting(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const validateInputs = (): string | null => {
    if (!selectedCondition) {
      return 'Please select an alert condition';
    }
    if (!alertName.trim()) {
      return 'Please enter an alert name';
    }
    if (!targetValue.trim()) {
      return selectedConditionData?.inputType === 'price' 
        ? 'Please enter a target price' 
        : 'Please enter a percentage';
    }

    const numericValue = parseFloat(targetValue);
    if (isNaN(numericValue) || numericValue <= 0) {
      return selectedConditionData?.inputType === 'price'
        ? 'Please enter a valid price (greater than 0)'
        : 'Please enter a valid percentage (greater than 0)';
    }

    return null;
  };

  const handleSubmit = async () => {
    // Validate inputs
    const error = validateInputs();
    if (error) {
      showAlert('warning', 'Validation Error', error);
      return;
    }

    if (!user) {
      showAlert('error', 'Authentication Required', 'You must be logged in to create alerts');
      return;
    }

    setIsSubmitting(true);

    try {
      const numericValue = parseFloat(targetValue);
      const isPercentage = selectedConditionData?.inputType === 'percent';

      // Prepare alert data
      const alertData: CreateAlertPayload = {
        user_id: user.id,
        user_email: user.email!,
        user_name: user.user_metadata?.full_name || user.email!,
        user_phone: user.user_metadata?.phone || null,
        currency: selectedCurrency,
        condition: selectedCondition! as AlertCondition,
        target_price: isPercentage ? null : numericValue,
        change_percent: isPercentage ? numericValue : null,
        alert_name: alertName.trim(),
        enabled: true,
      };

      console.log('Creating alert:', alertData);

      // Insert into Supabase
      const { data, error: insertError } = await supabase
        .from('gold_rate_alerts')
        .insert(alertData as any)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating alert:', insertError);
        throw insertError;
      }

      console.log('Alert created successfully:', data);

      // Close modal first
      handleClose();
      
      // Call onSuccess immediately to update the UI
      onSuccess?.(data);
      
      // Show success message using parent's alert (after modal is closed)
      if (showSuccessAlert) {
        setTimeout(() => {
          console.log('Showing success alert via parent...');
          showSuccessAlert(`Your alert "${alertName}" has been created successfully. You'll be notified via email and push notification when the condition is met.`);
        }, 400);
      }
    } catch (error: any) {
      console.error('Failed to create alert:', error);
      showAlert(
        'error',
        'Error',
        error.message || 'Failed to create alert. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Price Alert</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Currency Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Currency</Text>
              <View style={styles.currencyGrid}>
                {CURRENCIES.map((currency) => (
                  <TouchableOpacity
                    key={currency.code}
                    style={[
                      styles.currencyButton,
                      selectedCurrency === currency.code && styles.currencyButtonActive,
                    ]}
                    onPress={() => setSelectedCurrency(currency.code as Currency)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.currencySymbol,
                        selectedCurrency === currency.code && styles.currencySymbolActive,
                      ]}
                    >
                      {currency.symbol}
                    </Text>
                    <Text
                      style={[
                        styles.currencyCode,
                        selectedCurrency === currency.code && styles.currencyCodeActive,
                      ]}
                    >
                      {currency.code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Alert Condition Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Alert Condition</Text>
              <View style={styles.conditionsContainer}>
                {ALERT_CONDITIONS.map((condition) => {
                  const Icon = condition.icon;
                  const isSelected = selectedCondition === condition.id;

                  return (
                    <TouchableOpacity
                      key={condition.id}
                      style={[
                        styles.conditionCard,
                        isSelected && styles.conditionCardActive,
                      ]}
                      onPress={() => setSelectedCondition(condition.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.conditionHeader}>
                        <Text style={styles.conditionEmoji}>{condition.emoji}</Text>
                        <View style={styles.conditionIconContainer}>
                          <Icon
                            size={16}
                            color={isSelected ? colors.gold[500] : colors.text.tertiary}
                          />
                        </View>
                      </View>
                      <Text
                        style={[
                          styles.conditionTitle,
                          isSelected && styles.conditionTitleActive,
                        ]}
                      >
                        {condition.title}
                      </Text>
                      <Text style={styles.conditionDescription}>
                        {condition.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Alert Name Input */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Alert Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Gold reaches $2000"
                placeholderTextColor={colors.text.tertiary}
                value={alertName}
                onChangeText={setAlertName}
                maxLength={100}
              />
            </View>

            {/* Target Value Input */}
            {selectedConditionData && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  {selectedConditionData.inputType === 'price'
                    ? `Target Price (${CURRENCIES.find(c => c.code === selectedCurrency)?.symbol})`
                    : 'Percentage Change (%)'}
                </Text>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputPrefix}>
                    {selectedConditionData.inputType === 'price'
                      ? CURRENCIES.find(c => c.code === selectedCurrency)?.symbol
                      : '%'}
                  </Text>
                  <TextInput
                    style={styles.inputWithPrefix}
                    placeholder={
                      selectedConditionData.inputType === 'price'
                        ? '2000.00'
                        : '5.0'
                    }
                    placeholderTextColor={colors.text.tertiary}
                    value={targetValue}
                    onChangeText={setTargetValue}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            )}

            {/* Email (Disabled) */}
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Notifications</Text>
              <View style={styles.inputDisabled}>
                <Text style={styles.inputDisabledText}>{user?.email}</Text>
              </View>
              <Text style={styles.helperText}>
                You'll receive alerts via email and push notifications
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.createButton, isSubmitting && styles.createButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color={colors.background.primary} />
              ) : (
                <LinearGradient
                  colors={[colors.gold[500], colors.gold[600]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.createButtonGradient}
                >
                  <Text style={styles.createButtonText}>Create Alert</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Custom Alert Component */}
      {AlertComponent}
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  currencyGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  currencyButton: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  currencyButtonActive: {
    backgroundColor: colors.gold[500] + '15',
    borderColor: colors.gold[500],
  },
  currencySymbol: {
    fontSize: 24,
    marginBottom: 4,
    color: colors.text.secondary,
  },
  currencySymbolActive: {
    color: colors.gold[500],
  },
  currencyCode: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  currencyCodeActive: {
    color: colors.gold[500],
  },
  conditionsContainer: {
    gap: 12,
  },
  conditionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  conditionCardActive: {
    backgroundColor: colors.gold[500] + '15',
    borderColor: colors.gold[500],
  },
  conditionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conditionEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  conditionIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  conditionTitleActive: {
    color: colors.gold[500],
  },
  conditionDescription: {
    fontSize: 13,
    color: colors.text.tertiary,
    lineHeight: 18,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.default,
    overflow: 'hidden',
  },
  inputPrefix: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.gold[500],
    paddingHorizontal: 16,
  },
  inputWithPrefix: {
    flex: 1,
    padding: 16,
    paddingLeft: 0,
    fontSize: 16,
    color: colors.text.primary,
  },
  inputDisabled: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
    opacity: 0.6,
  },
  inputDisabledText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  helperText: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  createButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background.primary,
  },
});
