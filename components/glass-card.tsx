/**
 * Glassmorphism Card Component
 * Premium glass-effect card with blur and transparency
 */

import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { Colors, Radius, Shadows, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: "default" | "elevated" | "accent" | "success" | "warning" | "error";
  padding?: keyof typeof Spacing;
  borderRadius?: keyof typeof Radius;
  animated?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function GlassCard({
  children,
  style,
  onPress,
  variant = "default",
  padding = "base",
  borderRadius = "lg",
  animated = true,
}: GlassCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const scale = useSharedValue(1);

  const getVariantColors = () => {
    switch (variant) {
      case "elevated":
        return {
          background: colors.cardElevated,
          border: colors.border,
          gradient: [colors.glass, colors.glass],
        };
      case "accent":
        return {
          background: colors.primaryLight,
          border: colors.primary + "40",
          gradient: [colors.primary + "10", colors.primary + "05"],
        };
      case "success":
        return {
          background: colors.successLight,
          border: colors.success + "40",
          gradient: [colors.success + "10", colors.success + "05"],
        };
      case "warning":
        return {
          background: colors.warningLight,
          border: colors.warning + "40",
          gradient: [colors.warning + "10", colors.warning + "05"],
        };
      case "error":
        return {
          background: colors.errorLight,
          border: colors.error + "40",
          gradient: [colors.error + "10", colors.error + "05"],
        };
      default:
        return {
          background: colors.glass,
          border: colors.glassBorder,
          gradient: [colors.glass, colors.glassOverlay],
        };
    }
  };

  const variantColors = getVariantColors();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (animated && onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    if (animated && onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  };

  const cardContent = (
    <View
      style={[
        styles.card,
        {
          backgroundColor: variantColors.background,
          borderColor: variantColors.border,
          padding: Spacing[padding],
          borderRadius: Radius[borderRadius],
        },
        colorScheme === "light" ? Shadows.md : Shadows.sm,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
      >
        {cardContent}
      </AnimatedPressable>
    );
  }

  return cardContent;
}

/**
 * Gradient Glass Card with linear gradient overlay
 */
interface GradientGlassCardProps extends Omit<GlassCardProps, "variant"> {
  gradientColors?: [string, string];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
}

export function GradientGlassCard({
  children,
  style,
  onPress,
  padding = "base",
  borderRadius = "lg",
  animated = true,
  gradientColors,
  gradientStart = { x: 0, y: 0 },
  gradientEnd = { x: 1, y: 1 },
}: GradientGlassCardProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const scale = useSharedValue(1);

  const defaultGradient: [string, string] = [
    colors.gradientPrimaryStart,
    colors.gradientPrimaryEnd,
  ];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (animated && onPress) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    if (animated && onPress) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  };

  const cardContent = (
    <LinearGradient
      colors={gradientColors || defaultGradient}
      start={gradientStart}
      end={gradientEnd}
      style={[
        styles.gradientCard,
        {
          padding: Spacing[padding],
          borderRadius: Radius[borderRadius],
        },
        Shadows.lg,
        style,
      ]}
    >
      {children}
    </LinearGradient>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
      >
        {cardContent}
      </AnimatedPressable>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: "hidden",
  },
  gradientCard: {
    overflow: "hidden",
  },
});
