/**
 * Offline Banner Component
 * Shows a banner when the device is offline
 */

import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutUp } from "react-native-reanimated";
import NetInfo from "@react-native-community/netinfo";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface OfflineBannerProps {
  compact?: boolean;
}

export function OfflineBanner({ compact = false }: OfflineBannerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOffline(!state.isConnected);
    });

    // Check initial state
    NetInfo.fetch().then((state) => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  if (compact) {
    return (
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={[styles.compactBanner, { backgroundColor: colors.warning }]}
      >
        <IconSymbol name="wifi.slash" size={14} color="#FFFFFF" />
        <ThemedText style={styles.compactText}>Offline</ThemedText>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={SlideInUp.springify()}
      exiting={SlideOutUp}
      style={[styles.banner, { backgroundColor: colors.warning }]}
    >
      <View style={styles.content}>
        <IconSymbol name="wifi.slash" size={20} color="#FFFFFF" />
        <View style={styles.textContainer}>
          <ThemedText style={styles.title}>You&apos;re Offline</ThemedText>
          <ThemedText style={styles.subtitle}>
            Scans will be saved locally and synced when connected
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: "#FFFFFF",
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  compactBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 4,
  },
  compactText: {
    color: "#FFFFFF",
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
});
