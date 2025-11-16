/**
 * Custom Alert Component
 * Beautiful themed alert dialogs matching the app's gold theme
 */

import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { colors } from '@/theme';
import { AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
}

const ALERT_CONFIG = {
  success: {
    icon: CheckCircle,
    color: colors.states.success,
    gradient: ['#10B981', '#059669'] as const,
  },
  error: {
    icon: XCircle,
    color: colors.states.error,
    gradient: ['#EF4444', '#DC2626'] as const,
  },
  warning: {
    icon: AlertCircle,
    color: colors.states.warning,
    gradient: ['#F59E0B', '#D97706'] as const,
  },
  info: {
    icon: Info,
    color: colors.gold[500],
    gradient: [colors.gold[500], colors.gold[600]] as const,
  },
};

export function CustomAlert({
  visible,
  type = 'info',
  title,
  message,
  buttons = [{ text: 'OK', style: 'default' }],
  onDismiss,
}: CustomAlertProps) {
  const config = ALERT_CONFIG[type];
  const Icon = config.icon;

  const handleButtonPress = (button: AlertButton) => {
    button.onPress?.();
    onDismiss?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
        
        <View style={styles.alertContainer}>
          {/* Icon Header */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={config.gradient}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon size={32} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>{title}</Text>
            {message && <Text style={styles.message}>{message}</Text>}
          </View>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.button,
                  button.style === 'cancel' && styles.buttonCancel,
                  buttons.length === 1 && styles.buttonSingle,
                ]}
                onPress={() => handleButtonPress(button)}
                activeOpacity={0.8}
              >
                {button.style === 'destructive' ? (
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.buttonTextPrimary}>{button.text}</Text>
                  </LinearGradient>
                ) : button.style === 'cancel' ? (
                  <View style={styles.buttonContent}>
                    <Text style={styles.buttonTextSecondary}>{button.text}</Text>
                  </View>
                ) : (
                  <LinearGradient
                    colors={config.gradient}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.buttonTextPrimary}>{button.text}</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Hook for easier usage
export function useCustomAlert() {
  const [alertState, setAlertState] = React.useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message?: string;
    buttons?: AlertButton[];
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    buttons: [],
  });

  const showAlert = (
    type: AlertType,
    title: string,
    message?: string,
    buttons?: AlertButton[]
  ) => {
    setAlertState({
      visible: true,
      type,
      title,
      message,
      buttons: buttons || [{ text: 'OK', style: 'default' }],
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  const AlertComponent = (
    <CustomAlert
      visible={alertState.visible}
      type={alertState.type}
      title={alertState.title}
      message={alertState.message}
      buttons={alertState.buttons}
      onDismiss={hideAlert}
    />
  );

  return {
    showAlert,
    hideAlert,
    AlertComponent,
  };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  alertContainer: {
    width: width - 64,
    maxWidth: 400,
    backgroundColor: colors.background.primary,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  iconContainer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
    gap: 1,
  },
  button: {
    flex: 1,
    overflow: 'hidden',
  },
  buttonSingle: {
    flex: 1,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCancel: {
    backgroundColor: colors.background.secondary,
  },
  buttonContent: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTextPrimary: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
  },
});
