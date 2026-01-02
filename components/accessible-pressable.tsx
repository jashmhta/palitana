import React from 'react';
import {
  Pressable,
  PressableProps,
  Platform,
  AccessibilityRole,
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface AccessiblePressableProps extends Omit<PressableProps, 'accessibilityRole'> {
  accessibilityLabel: string;
  accessibilityHint?: string;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'selection' | 'none';
  accessibilityRole?: AccessibilityRole;
}

export function AccessiblePressable({
  accessibilityLabel,
  accessibilityHint,
  hapticFeedback = 'light',
  accessibilityRole = 'button',
  onPress,
  onPressIn,
  children,
  ...props
}: AccessiblePressableProps) {
  const handlePressIn = (event: any) => {
    if (Platform.OS !== 'web' && hapticFeedback !== 'none') {
      switch (hapticFeedback) {
        case 'light':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'selection':
          Haptics.selectionAsync();
          break;
      }
    }
    onPressIn?.(event);
  };

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      onPress={onPress}
      onPressIn={handlePressIn}
      {...props}
    >
      {children}
    </Pressable>
  );
}

// Utility function to generate accessibility labels
export function generateAccessibilityLabel(
  action: string,
  target: string,
  state?: string
): string {
  let label = `${action} ${target}`;
  if (state) {
    label += `. Currently ${state}`;
  }
  return label;
}

// Common accessibility hints
export const AccessibilityHints = {
  navigation: 'Double tap to navigate',
  toggle: 'Double tap to toggle',
  action: 'Double tap to perform action',
  input: 'Double tap to edit',
  select: 'Double tap to select',
  expand: 'Double tap to expand',
  collapse: 'Double tap to collapse',
};
