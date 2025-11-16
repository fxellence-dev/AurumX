/**
 * Alert List Item Component
 * Displays individual alert with toggle functionality
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { colors } from '@/theme';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, Trash2 } from 'lucide-react-native';
import type { GoldRateAlert } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { useCustomAlert } from './CustomAlert';

interface AlertListItemProps {
  alert: GoldRateAlert;
  onToggle?: (id: string, enabled: boolean) => void;
  onDelete?: (id: string) => void;
}

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸',
  INR: '🇮🇳',
  GBP: '🇬🇧',
  EUR: '🇪🇺',
};

const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar',
  INR: 'Indian Rupee',
  GBP: 'British Pound',
  EUR: 'Euro',
};

const CONDITION_CONFIG = {
  above: {
    icon: TrendingUp,
    label: 'Price Goes Above',
    color: colors.states.success,
  },
  below: {
    icon: TrendingDown,
    label: 'Price Goes Below',
    color: colors.states.info,
  },
  change_up: {
    icon: ArrowUp,
    label: 'Price Increases By',
    color: colors.states.success,
  },
  change_down: {
    icon: ArrowDown,
    label: 'Price Decreases By',
    color: colors.states.warning,
  },
};

export function AlertListItem({ alert, onToggle, onDelete }: AlertListItemProps) {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [enabled, setEnabled] = useState(alert.enabled);
  const { showAlert, AlertComponent } = useCustomAlert();

  const config = CONDITION_CONFIG[alert.condition as keyof typeof CONDITION_CONFIG];
  const Icon = config?.icon;
  const flag = CURRENCY_FLAGS[alert.currency];
  const currencyName = CURRENCY_NAMES[alert.currency];

  const getConditionText = () => {
    if (alert.condition === 'above' || alert.condition === 'below') {
      const symbol = alert.currency === 'USD' ? '$' : alert.currency === 'GBP' ? '£' : alert.currency === 'INR' ? '₹' : '€';
      return `${config.label} ${symbol}${alert.target_price?.toFixed(2)}`;
    } else {
      return `${config.label} ${alert.change_percent?.toFixed(1)}%`;
    }
  };

  const handleToggle = async (value: boolean) => {
    setIsToggling(true);
    try {
      const { error } = await (supabase
        .from('gold_rate_alerts')
        .update as any)({ enabled: value })
        .eq('id', alert.id);

      if (error) {
        console.error('Error toggling alert:', error);
        showAlert(
          'error',
          'Update Failed',
          `Failed to ${value ? 'enable' : 'disable'} the alert. Please try again.`,
          [{ text: 'OK' }]
        );
        return;
      }

      setEnabled(value);
      onToggle?.(alert.id, value);
      
      // Show success feedback
      showAlert(
        'success',
        `Alert ${value ? 'Enabled' : 'Disabled'}`,
        `"${alert.alert_name}" has been ${value ? 'enabled' : 'disabled'}. You will ${value ? 'now' : 'no longer'} receive notifications for this alert.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to toggle alert:', error);
      showAlert(
        'error',
        'Update Failed',
        'An unexpected error occurred. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = () => {
    showAlert(
      'warning',
      'Delete Alert',
      `Are you sure you want to delete "${alert.alert_name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await (supabase
        .from('gold_rate_alerts')
        .delete as any)()
        .eq('id', alert.id);

      if (error) {
        console.error('Error deleting alert:', error);
        showAlert(
          'error',
          'Delete Failed',
          'Failed to delete the alert. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Show success feedback
      showAlert(
        'success',
        'Alert Deleted',
        `"${alert.alert_name}" has been successfully deleted.`,
        [{ text: 'OK' }]
      );
      
      // Notify parent component
      onDelete?.(alert.id);
    } catch (error) {
      console.error('Failed to delete alert:', error);
      showAlert(
        'error',
        'Delete Failed',
        'An unexpected error occurred. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Icon and Name */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.labelIcon}>🏷️</Text>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.alertName} numberOfLines={1}>
              {alert.alert_name}
            </Text>
          </View>
        </View>

        {/* Currency Info */}
        <View style={styles.currencyRow}>
          <Text style={styles.flag}>{flag}</Text>
          <Text style={styles.currencyText}>
            {currencyName} ({alert.currency})
          </Text>
        </View>

        {/* Condition */}
        <View style={styles.conditionRow}>
          {Icon && (
            <View style={[styles.conditionIconContainer, { backgroundColor: config.color + '20' }]}>
              <Icon size={14} color={config.color} strokeWidth={2.5} />
            </View>
          )}
          <Text style={styles.conditionText}>{getConditionText()}</Text>
        </View>
      </View>

      {/* Actions Container */}
      <View style={styles.actionsContainer}>
        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={isDeleting || isToggling}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color={colors.states.error} />
          ) : (
            <Trash2 size={20} color={colors.states.error} strokeWidth={2} />
          )}
        </TouchableOpacity>

        {/* Toggle Switch */}
        <View style={styles.toggleContainer}>
          {isToggling ? (
            <ActivityIndicator size="small" color={colors.gold[500]} />
          ) : (
            <Switch
              value={enabled}
              onValueChange={handleToggle}
              trackColor={{
                false: colors.background.secondary,
                true: colors.gold[500] + '80',
              }}
              thumbColor={enabled ? colors.gold[500] : colors.text.tertiary}
              ios_backgroundColor={colors.background.secondary}
            />
          )}
        </View>
      </View>
      {AlertComponent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.gold[500] + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  labelIcon: {
    fontSize: 16,
  },
  nameContainer: {
    flex: 1,
  },
  alertName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  flag: {
    fontSize: 20,
    marginRight: 8,
  },
  currencyText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conditionIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  conditionText: {
    fontSize: 14,
    color: colors.text.secondary,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.states.error + '15',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.states.error + '30',
  },
  toggleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 51,
  },
});
