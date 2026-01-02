/**
 * Day Picker Component
 * Allows selection between Day 1 and Day 2 of the Palitana Yatra
 */

import { Pressable, StyleSheet, View } from "react-native";

import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface DayPickerProps {
  selectedDay: 1 | 2 | "all";
  onSelectDay: (day: 1 | 2 | "all") => void;
  showAllOption?: boolean;
  compact?: boolean;
}

const DAY_INFO = {
  1: {
    title: "Day 1",
    subtitle: "First day of Yatra",
    icon: "calendar" as const,
    checkpoints: "1-3",
  },
  2: {
    title: "Day 2",
    subtitle: "Second day of Yatra",
    icon: "calendar" as const,
    checkpoints: "1-3",
  },
};

export function DayPicker({ selectedDay, onSelectDay, showAllOption = true, compact = false }: DayPickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const handleSelect = (day: 1 | 2 | "all") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectDay(day);
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {showAllOption && (
          <Pressable
            style={[
              styles.compactButton,
              { backgroundColor: selectedDay === "all" ? colors.primary : colors.backgroundSecondary },
            ]}
            onPress={() => handleSelect("all")}
          >
            <ThemedText
              style={[
                styles.compactButtonText,
                { color: selectedDay === "all" ? "#FFFFFF" : colors.textSecondary },
              ]}
            >
              All
            </ThemedText>
          </Pressable>
        )}
        <Pressable
          style={[
            styles.compactButton,
            { backgroundColor: selectedDay === 1 ? colors.primary : colors.backgroundSecondary },
          ]}
          onPress={() => handleSelect(1)}
        >
          <ThemedText
            style={[
              styles.compactButtonText,
              { color: selectedDay === 1 ? "#FFFFFF" : colors.textSecondary },
            ]}
          >
            Day 1
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.compactButton,
            { backgroundColor: selectedDay === 2 ? colors.primary : colors.backgroundSecondary },
          ]}
          onPress={() => handleSelect(2)}
        >
          <ThemedText
            style={[
              styles.compactButtonText,
              { color: selectedDay === 2 ? "#FFFFFF" : colors.textSecondary },
            ]}
          >
            Day 2
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showAllOption && (
        <Pressable
          style={[
            styles.allButton,
            { 
              backgroundColor: selectedDay === "all" ? colors.primary : colors.card,
              borderColor: selectedDay === "all" ? colors.primary : colors.border,
            },
            Shadows.sm,
          ]}
          onPress={() => handleSelect("all")}
        >
          <IconSymbol 
            name="calendar" 
            size={20} 
            color={selectedDay === "all" ? "#FFFFFF" : colors.textSecondary} 
          />
          <ThemedText
            style={[
              styles.allButtonText,
              { color: selectedDay === "all" ? "#FFFFFF" : colors.text },
            ]}
          >
            All Days
          </ThemedText>
        </Pressable>
      )}
      
      <View style={styles.daysRow}>
        {([1, 2] as const).map((day) => {
          const info = DAY_INFO[day];
          const isSelected = selectedDay === day;

          return (
            <Pressable
              key={day}
              style={[
                styles.dayCard,
                { 
                  backgroundColor: isSelected ? colors.primary : colors.card,
                  borderColor: isSelected ? colors.primary : colors.border,
                },
                Shadows.sm,
              ]}
              onPress={() => handleSelect(day)}
            >
              <View style={styles.dayHeader}>
                <IconSymbol
                  name={info.icon}
                  size={24}
                  color={isSelected ? "#FFFFFF" : colors.primary}
                />
                <View style={styles.dayTitleContainer}>
                  <ThemedText
                    style={[
                      styles.dayTitle,
                      { color: isSelected ? "#FFFFFF" : colors.text },
                    ]}
                  >
                    {info.title}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.daySubtitle,
                      { color: isSelected ? "rgba(255,255,255,0.8)" : colors.textSecondary },
                    ]}
                  >
                    {info.subtitle}
                  </ThemedText>
                </View>
              </View>
              <View 
                style={[
                  styles.checkpointBadge, 
                  { backgroundColor: isSelected ? "rgba(255,255,255,0.2)" : colors.backgroundSecondary }
                ]}
              >
                <ThemedText
                  style={[
                    styles.checkpointText,
                    { color: isSelected ? "#FFFFFF" : colors.textSecondary },
                  ]}
                >
                  Checkpoints {info.checkpoints}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
  },
  allButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  allButtonText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  daysRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  dayCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  dayTitleContainer: {
    flex: 1,
  },
  dayTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  daySubtitle: {
    fontSize: Typography.size.sm,
  },
  checkpointBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radius.md,
    alignSelf: "flex-start",
  },
  checkpointText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  // Compact styles
  compactContainer: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  compactButton: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
  },
  compactButtonText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
});
