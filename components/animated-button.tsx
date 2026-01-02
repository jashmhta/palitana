/**
 * Animated Button Component
 * Premium button with micro-interactions, haptics, and hover effects
 */

import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg" | "xl";

interface AnimatedButtonProps {
  title?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  haptic?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function AnimatedButton({
  title,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  haptic = true,
}: AnimatedButtonProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return {
          paddingVertical: Spacing.sm,
          paddingHorizontal: Spacing.md,
          fontSize: Typography.size.sm,
          iconSize: 16,
          borderRadius: Radius.sm,
        };
      case "lg":
        return {
          paddingVertical: Spacing.base,
          paddingHorizontal: Spacing.xl,
          fontSize: Typography.size.lg,
          iconSize: 24,
          borderRadius: Radius.lg,
        };
      case "xl":
        return {
          paddingVertical: Spacing.lg,
          paddingHorizontal: Spacing["2xl"],
          fontSize: Typography.size.xl,
          iconSize: 28,
          borderRadius: Radius.xl,
        };
      default: // md
        return {
          paddingVertical: Spacing.md,
          paddingHorizontal: Spacing.lg,
          fontSize: Typography.size.md,
          iconSize: 20,
          borderRadius: Radius.md,
        };
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "secondary":
        return {
          background: colors.backgroundSecondary,
          textColor: colors.text,
          borderColor: colors.border,
          borderWidth: 1,
          gradient: null,
        };
      case "outline":
        return {
          background: "transparent",
          textColor: colors.primary,
          borderColor: colors.primary,
          borderWidth: 2,
          gradient: null,
        };
      case "ghost":
        return {
          background: "transparent",
          textColor: colors.primary,
          borderColor: "transparent",
          borderWidth: 0,
          gradient: null,
        };
      case "danger":
        return {
          background: colors.error,
          textColor: "#FFFFFF",
          borderColor: "transparent",
          borderWidth: 0,
          gradient: [colors.error, "#CC2F26"] as [string, string],
        };
      case "success":
        return {
          background: colors.success,
          textColor: "#FFFFFF",
          borderColor: "transparent",
          borderWidth: 0,
          gradient: [colors.success, "#2BA84A"] as [string, string],
        };
      default: // primary
        return {
          background: colors.primary,
          textColor: "#FFFFFF",
          borderColor: "transparent",
          borderWidth: 0,
          gradient: [colors.gradientPrimaryStart, colors.gradientPrimaryEnd] as [string, string],
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const handlePress = () => {
    if (disabled || loading) return;
    
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Bounce animation
    scale.value = withSequence(
      withSpring(0.95, { damping: 10, stiffness: 400 }),
      withSpring(1, { damping: 10, stiffness: 400 })
    );
    
    onPress();
  };

  const buttonContent = (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.textColor}
        />
      ) : (
        <>
          {icon && iconPosition === "left" && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          {title && (
            <ThemedText
              style={[
                styles.text,
                {
                  color: variantStyles.textColor,
                  fontSize: sizeStyles.fontSize,
                },
              ]}
            >
              {title}
            </ThemedText>
          )}
          {icon && iconPosition === "right" && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </>
      )}
    </View>
  );

  const baseButtonStyle = [
    styles.button,
    {
      paddingVertical: sizeStyles.paddingVertical,
      paddingHorizontal: sizeStyles.paddingHorizontal,
      borderRadius: sizeStyles.borderRadius,
      borderWidth: variantStyles.borderWidth,
      borderColor: variantStyles.borderColor,
      backgroundColor: variantStyles.gradient ? "transparent" : variantStyles.background,
    },
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    variant === "primary" && Shadows.md,
    style,
  ];

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[animatedStyle, fullWidth && styles.fullWidth]}
    >
      {variantStyles.gradient ? (
        <LinearGradient
          colors={variantStyles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={baseButtonStyle}
        >
          {buttonContent}
        </LinearGradient>
      ) : (
        <View style={baseButtonStyle}>{buttonContent}</View>
      )}
    </AnimatedPressable>
  );
}

/**
 * Icon Button - Circular button with just an icon
 */
interface IconButtonProps {
  icon: ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  style?: ViewStyle;
  haptic?: boolean;
}

export function IconButton({
  icon,
  onPress,
  variant = "ghost",
  size = "md",
  disabled = false,
  style,
  haptic = true,
}: IconButtonProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  
  const scale = useSharedValue(1);

  const getSize = () => {
    switch (size) {
      case "sm": return 32;
      case "lg": return 48;
      case "xl": return 56;
      default: return 40;
    }
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case "primary": return colors.primary;
      case "secondary": return colors.backgroundSecondary;
      case "danger": return colors.error;
      case "success": return colors.success;
      default: return "transparent";
    }
  };

  const buttonSize = getSize();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const handlePress = () => {
    if (disabled) return;
    
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress();
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={animatedStyle}
    >
      <View
        style={[
          styles.iconButton,
          {
            width: buttonSize,
            height: buttonSize,
            borderRadius: buttonSize / 2,
            backgroundColor: getBackgroundColor(),
          },
          disabled && styles.disabled,
          style,
        ]}
      >
        {icon}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: Typography.weight.semibold,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});
