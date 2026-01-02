/**
 * Checkpoint Quick Switcher
 * Floating action button for quick checkpoint switching
 */

import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, {
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { IconSymbol } from "./ui/icon-symbol";
import { ThemedText } from "./themed-text";
import { DEFAULT_CHECKPOINTS } from "@/constants/checkpoints";
import { Colors, Shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface CheckpointQuickSwitcherProps {
  currentCheckpoint: number;
  onCheckpointChange: (checkpointId: number) => void;
  bottom?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function CheckpointQuickSwitcher({
  currentCheckpoint,
  onCheckpointChange,
  bottom = 160,
}: CheckpointQuickSwitcherProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  
  const [isExpanded, setIsExpanded] = useState(false);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const toggleExpanded = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    setIsExpanded(!isExpanded);
    rotation.value = withSpring(isExpanded ? 0 : 180);
    scale.value = withSpring(isExpanded ? 1 : 1.1);
  };

  const handleCheckpointSelect = (checkpointId: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onCheckpointChange(checkpointId);
    setIsExpanded(false);
    rotation.value = withSpring(0);
    scale.value = withSpring(1);
  };

  return (
    <View style={[styles.container, { bottom }]}>
      {/* Checkpoint Options */}
      {isExpanded && (
        <View style={styles.optionsContainer}>
          {DEFAULT_CHECKPOINTS.map((checkpoint, index) => {
            const isActive = checkpoint.id === currentCheckpoint;
            const delay = index * 50;
            
            return (
              <Animated.View
                key={checkpoint.id}
                entering={FadeInRight.delay(delay).springify()}
                style={[
                  styles.optionWrapper,
                  { marginBottom: 12 },
                ]}
              >
                <Pressable
                  style={[
                    styles.option,
                    {
                      backgroundColor: isActive ? colors.primary : colors.card,
                    },
                    Shadows.md,
                  ]}
                  onPress={() => handleCheckpointSelect(checkpoint.id)}
                >
                  <View style={styles.optionContent}>
                    <ThemedText
                      style={[
                        styles.optionNumber,
                        { color: isActive ? "#FFFFFF" : colors.text },
                      ]}
                    >
                      #{checkpoint.number}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.optionDescription,
                        { color: isActive ? "#FFFFFF" : colors.textSecondary },
                      ]}
                      numberOfLines={1}
                    >
                      {checkpoint.description}
                    </ThemedText>
                  </View>
                  {isActive && (
                    <IconSymbol
                      name="checkmark.circle.fill"
                      size={20}
                      color="#FFFFFF"
                    />
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      )}

      {/* Main FAB */}
      <AnimatedPressable
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
          },
          Shadows.lg,
          animatedStyle,
        ]}
        onPress={toggleExpanded}
      >
        <IconSymbol
          name={isExpanded ? "xmark" : "location.fill"}
          size={28}
          color="#FFFFFF"
        />
      </AnimatedPressable>

      {/* Current Checkpoint Badge */}
      {!isExpanded && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.error,
            },
          ]}
        >
          <ThemedText style={styles.badgeText}>
            {DEFAULT_CHECKPOINTS.find(c => c.id === currentCheckpoint)?.number || 1}
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 20,
    alignItems: "flex-end",
    zIndex: 1000,
  },
  optionsContainer: {
    marginBottom: 12,
  },
  optionWrapper: {
    alignItems: "flex-end",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    minWidth: 180,
    maxWidth: 220,
  },
  optionContent: {
    flex: 1,
    marginRight: 8,
  },
  optionNumber: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 13,
    fontWeight: "500",
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
