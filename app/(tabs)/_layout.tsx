import { Tabs, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Shadows } from "@/constants/theme";
import { useLanguage } from "@/contexts/language-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

// Custom center scan button component
function CenterScanButton({ onPress }: { onPress: () => void }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.92, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <View style={styles.centerButtonWrapper}>
      <Animated.View style={[styles.centerButtonContainer, animatedStyle]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.centerButton,
            { backgroundColor: colors.primary },
            Shadows.lg,
          ]}
        >
          <IconSymbol size={32} name="qrcode.viewfinder" color="#FFFFFF" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const router = useRouter();

  const isWeb = Platform.OS === "web";
  const tabBarHeight = isWeb ? 64 : 60 + insets.bottom;

  const handleScanPress = () => {
    // Navigate to scanner tab and trigger scan
    router.push("/");
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: tabBarHeight,
          paddingBottom: isWeb ? 8 : insets.bottom,
          paddingTop: 8,
          paddingHorizontal: 0,
        },
        tabBarItemStyle: {
          height: isWeb ? 56 : 52,
          paddingTop: 6,
          paddingBottom: 4,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          lineHeight: 12,
          marginTop: 2,
        },
        tabBarIconStyle: {
          width: 24,
          height: 24,
        },
      }}
    >
      {/* Left side tabs */}
      <Tabs.Screen
        name="checkpoints"
        options={{
          title: t("nav_checkpoints"),
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
              <IconSymbol size={22} name="location.fill" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="participants"
        options={{
          title: t("nav_pilgrims"),
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
              <IconSymbol size={22} name="person.2.fill" color={color} />
            </View>
          ),
        }}
      />

      {/* Center Scan Button - Hidden tab but shows custom button */}
      <Tabs.Screen
        name="index"
        options={{
          title: "",
          tabBarIcon: () => null,
          tabBarButton: () => (
            <CenterScanButton onPress={handleScanPress} />
          ),
        }}
      />

      {/* Right side tabs */}
      <Tabs.Screen
        name="reports"
        options={{
          title: t("nav_reports"),
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
              <IconSymbol size={22} name="chart.bar.fill" color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("nav_settings"),
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activeIconContainer : styles.iconContainer}>
              <IconSymbol size={22} name="gearshape.fill" color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  activeIconContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(196, 133, 47, 0.12)",
    borderRadius: 10,
  },
  centerButtonWrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: -24,
  },
  centerButtonContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "visible",
  },
  centerButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
