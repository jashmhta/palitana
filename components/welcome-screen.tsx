/**
 * Welcome Screen Component
 * Beautiful animated welcome screen with glassmorphism effects
 */

import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Dimensions, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface WelcomeScreenProps {
  onComplete: () => void;
}

export function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  // Animation values
  const logoScale = useSharedValue(0);
  const logoRotate = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const particleProgress = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // Logo entrance animation
    logoScale.value = withDelay(
      300,
      withSpring(1, { damping: 12, stiffness: 100 })
    );

    // Subtle logo rotation
    logoRotate.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Glow pulse
    glowOpacity.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1500 }),
          withTiming(0.3, { duration: 1500 })
        ),
        -1,
        true
      )
    );

    // Particle animation
    particleProgress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: `${logoRotate.value}deg` },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handleGetStarted = () => {
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
    onComplete();
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Floating particles
  const renderParticles = () => {
    const particles = [];
    for (let i = 0; i < 20; i++) {
      const delay = i * 150;
      const startX = Math.random() * SCREEN_WIDTH;
      const startY = SCREEN_HEIGHT + 50;
      
      particles.push(
        <FloatingParticle
          key={i}
          delay={delay}
          startX={startX}
          startY={startY}
          color={colors.primary}
        />
      );
    }
    return particles;
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={
          colorScheme === "dark"
            ? ["#0F0F0F", "#1A1A1A", "#0F0F0F"]
            : ["#FEF9E7", "#FFFFFF", "#FEF9E7"]
        }
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating particles */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {renderParticles()}
      </View>

      {/* Content */}
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing["2xl"],
            paddingBottom: insets.bottom + Spacing["2xl"],
          },
        ]}
      >
        {/* Logo section */}
        <View style={styles.logoSection}>
          {/* Glow effect */}
          <Animated.View style={[styles.glow, glowAnimatedStyle]}>
            <LinearGradient
              colors={[colors.primary + "00", colors.primary + "40", colors.primary + "00"]}
              style={styles.glowGradient}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
            />
          </Animated.View>

          {/* Logo */}
          <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
            <LinearGradient
              colors={[colors.gradientPrimaryStart, colors.gradientPrimaryEnd]}
              style={styles.logoGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <ThemedText style={styles.logoEmoji}>🙏</ThemedText>
            </LinearGradient>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.delay(600).duration(800)}>
            <ThemedText style={[styles.title, { color: colors.text }]}>
              Palitana Yatra
            </ThemedText>
          </Animated.View>

          {/* Subtitle */}
          <Animated.View entering={FadeInDown.delay(800).duration(800)}>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sacred Pilgrimage Tracker
            </ThemedText>
          </Animated.View>
        </View>

        {/* Features section */}
        <Animated.View
          style={styles.featuresSection}
          entering={FadeInUp.delay(1000).duration(800)}
        >
          <FeatureItem
            icon="📍"
            title="Track Progress"
            description="Monitor pilgrims across 16 sacred checkpoints"
            delay={1100}
            colors={colors}
          />
          <FeatureItem
            icon="📱"
            title="QR Scanning"
            description="Quick and easy check-in at each location"
            delay={1200}
            colors={colors}
          />
          <FeatureItem
            icon="☁️"
            title="Cloud Sync"
            description="Real-time data sync across all devices"
            delay={1300}
            colors={colors}
          />
        </Animated.View>

        {/* CTA Button */}
        <Animated.View
          style={styles.ctaSection}
          entering={FadeInUp.delay(1400).duration(800)}
        >
          <Pressable onPress={handleGetStarted}>
            <Animated.View style={buttonAnimatedStyle}>
              <LinearGradient
                colors={[colors.gradientPrimaryStart, colors.gradientPrimaryEnd]}
                style={styles.ctaButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <ThemedText style={styles.ctaText}>Get Started</ThemedText>
                <ThemedText style={styles.ctaArrow}>→</ThemedText>
              </LinearGradient>
            </Animated.View>
          </Pressable>

          <ThemedText style={[styles.versionText, { color: colors.textTertiary }]}>
            Version 1.0.0 • Made with 🙏 for Palitana
          </ThemedText>
        </Animated.View>
      </View>
    </View>
  );
}

// Floating particle component
function FloatingParticle({
  delay,
  startX,
  startY,
  color,
}: {
  delay: number;
  startX: number;
  startY: number;
  color: string;
}) {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: 4000 + Math.random() * 2000, easing: Easing.linear }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.6, { duration: 1000 }),
          withTiming(0.6, { duration: 2000 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(progress.value, [0, 1], [0, -SCREEN_HEIGHT - 100]);
    const translateX = Math.sin(progress.value * Math.PI * 2) * 30;
    
    return {
      transform: [
        { translateY },
        { translateX },
      ],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: startX,
          top: startY,
          width: 6 + Math.random() * 4,
          height: 6 + Math.random() * 4,
          borderRadius: 10,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

// Feature item component
function FeatureItem({
  icon,
  title,
  description,
  delay,
  colors,
}: {
  icon: string;
  title: string;
  description: string;
  delay: number;
  colors: typeof Colors.light;
}) {
  return (
    <Animated.View
      style={[
        styles.featureItem,
        {
          backgroundColor: colors.glass,
          borderColor: colors.glassBorder,
        },
      ]}
      entering={FadeInUp.delay(delay).duration(600)}
    >
      <View style={[styles.featureIcon, { backgroundColor: colors.primaryLight }]}>
        <ThemedText style={styles.featureEmoji}>{icon}</ThemedText>
      </View>
      <View style={styles.featureContent}>
        <ThemedText style={[styles.featureTitle, { color: colors.text }]}>
          {title}
        </ThemedText>
        <ThemedText style={[styles.featureDescription, { color: colors.textSecondary }]}>
          {description}
        </ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "space-between",
  },
  logoSection: {
    alignItems: "center",
    marginTop: Spacing["3xl"],
  },
  glow: {
    position: "absolute",
    width: 300,
    height: 300,
    top: -50,
  },
  glowGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 150,
  },
  logoContainer: {
    marginBottom: Spacing.xl,
    ...Shadows.glow,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmoji: {
    fontSize: 56,
  },
  title: {
    fontSize: Typography.size["3xl"],
    fontWeight: Typography.weight.bold,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.size.lg,
    textAlign: "center",
  },
  featuresSection: {
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    ...Shadows.sm,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: Typography.size.sm,
  },
  ctaSection: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing["3xl"],
    borderRadius: Radius.full,
    gap: Spacing.sm,
    ...Shadows.lg,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
  },
  ctaArrow: {
    color: "#FFFFFF",
    fontSize: Typography.size.xl,
  },
  versionText: {
    fontSize: Typography.size.xs,
    marginTop: Spacing.lg,
  },
});
