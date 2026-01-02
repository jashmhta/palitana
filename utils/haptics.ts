import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback patterns for different actions
 */
export const HapticPatterns = {
  // Light tap for general interactions
  tap: async () => {
    if (Platform.OS === 'web') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  // Medium impact for button presses
  press: async () => {
    if (Platform.OS === 'web') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  // Heavy impact for important actions
  heavy: async () => {
    if (Platform.OS === 'web') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  // Selection feedback for toggles and pickers
  selection: async () => {
    if (Platform.OS === 'web') return;
    await Haptics.selectionAsync();
  },

  // Success notification
  success: async () => {
    if (Platform.OS === 'web') return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  // Error notification
  error: async () => {
    if (Platform.OS === 'web') return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  // Warning notification
  warning: async () => {
    if (Platform.OS === 'web') return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  // QR scan success pattern
  scanSuccess: async () => {
    if (Platform.OS === 'web') return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 100);
  },

  // QR scan error pattern
  scanError: async () => {
    if (Platform.OS === 'web') return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 100);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 200);
  },

  // Celebration pattern for completed pilgrimage
  celebration: async () => {
    if (Platform.OS === 'web') return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 100);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 200);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 300);
  },

  // Pull to refresh pattern
  refresh: async () => {
    if (Platform.OS === 'web') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  // Swipe action pattern
  swipe: async () => {
    if (Platform.OS === 'web') return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  // Delete action pattern
  delete: async () => {
    if (Platform.OS === 'web') return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 150);
  },
};

// Context-aware haptic feedback
export function triggerHaptic(
  action: 'tap' | 'press' | 'success' | 'error' | 'warning' | 'selection' | 'scan_success' | 'scan_error' | 'celebration' | 'refresh' | 'delete'
) {
  switch (action) {
    case 'tap':
      return HapticPatterns.tap();
    case 'press':
      return HapticPatterns.press();
    case 'success':
      return HapticPatterns.success();
    case 'error':
      return HapticPatterns.error();
    case 'warning':
      return HapticPatterns.warning();
    case 'selection':
      return HapticPatterns.selection();
    case 'scan_success':
      return HapticPatterns.scanSuccess();
    case 'scan_error':
      return HapticPatterns.scanError();
    case 'celebration':
      return HapticPatterns.celebration();
    case 'refresh':
      return HapticPatterns.refresh();
    case 'delete':
      return HapticPatterns.delete();
    default:
      return HapticPatterns.tap();
  }
}
