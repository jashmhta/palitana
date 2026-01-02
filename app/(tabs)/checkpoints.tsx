import { LinearGradient } from "expo-linear-gradient";
import { FlatList, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useLanguage } from "@/contexts/language-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DEFAULT_CHECKPOINTS } from "@/constants/checkpoints";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsive } from "@/hooks/use-responsive";
import { useSettings } from "@/hooks/use-storage";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { CheckpointWithStats } from "@/types";

export default function CheckpointsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const { isDesktop, containerWidth } = useResponsive();
  const { t } = useLanguage();

  const { settings, updateSettings } = useSettings();
  const { participants, scanLogs } = useOfflineSync();

  // Calculate stats for each checkpoint
  const checkpointsWithStats: CheckpointWithStats[] = DEFAULT_CHECKPOINTS.map((checkpoint) => {
    const checkpointLogs = scanLogs.filter((log) => log.checkpointId === checkpoint.id);
    const lastLog = checkpointLogs.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    return {
      ...checkpoint,
      scanCount: checkpointLogs.length,
      lastScanTime: lastLog?.timestamp,
    };
  });

  const totalParticipants = participants.length;
  const totalScans = scanLogs.length;
  const activeCheckpoints = checkpointsWithStats.filter((c) => c.scanCount > 0).length;

  // All checkpoints are used on both days, no day grouping needed

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return t("checkpoints_no_scans");
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return t("just_now");
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getProgressColor = (scanCount: number) => {
    if (totalParticipants === 0) return colors.textTertiary;
    const percentage = (scanCount / totalParticipants) * 100;
    if (percentage >= 90) return colors.success;
    if (percentage >= 50) return colors.pending;
    if (percentage > 0) return colors.primary;
    return colors.textTertiary;
  };

  const renderCheckpoint = ({ item, index }: { item: CheckpointWithStats; index: number }) => {
    const isActive = item.id === settings.currentCheckpoint;
    const progressPercentage = totalParticipants > 0 
      ? Math.round((item.scanCount / totalParticipants) * 100) 
      : 0;
    const statusColor = getProgressColor(item.scanCount);

    return (
      <Animated.View 
        entering={FadeInDown.delay(Math.min(index * 30, 300)).springify()}
        style={isDesktop && styles.checkpointCardWrapper}
      >
        <Pressable
          style={[
            styles.checkpointCard,
            { backgroundColor: colors.card },
            Shadows.sm,
            isActive && { borderColor: colors.primary, borderWidth: 2 },
            isDesktop && styles.checkpointCardDesktop,
          ]}
          onPress={() => updateSettings({ currentCheckpoint: item.id })}
        >
          <View style={styles.cardContent}>
            {/* Checkpoint Number Badge */}
            <View
              style={[
                styles.numberBadge,
                {
                  backgroundColor: isActive ? colors.primary : 
                    item.scanCount > 0 ? colors.primaryLight : colors.backgroundSecondary,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.numberText,
                  { color: isActive ? "#FFFFFF" : 
                    item.scanCount > 0 ? colors.primary : colors.textTertiary },
                ]}
              >
                {item.number}
              </ThemedText>
            </View>

            {/* Checkpoint Info */}
            <View style={styles.checkpointInfo}>
              <View style={styles.titleRow}>
                <ThemedText style={styles.checkpointName} numberOfLines={1}>
                  {item.description}
                </ThemedText>
                {isActive && (
                  <View style={[styles.activeBadge, { backgroundColor: colors.successLight }]}>
                    <ThemedText style={[styles.activeBadgeText, { color: colors.success }]}>
                      {t("active")}
                    </ThemedText>
                  </View>
                )}
              </View>
              <View style={styles.metaRow}>
                <View style={[styles.dayBadge, { backgroundColor: colors.backgroundSecondary }]}>
                  <ThemedText style={[styles.dayText, { color: colors.textSecondary }]}>
                    Day {item.day}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.timeText, { color: colors.textTertiary }]}>
                  {formatTime(item.lastScanTime)}
                </ThemedText>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressSection}>
                <View style={[styles.progressBarBg, { backgroundColor: colors.backgroundSecondary }]}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: statusColor,
                        width: `${progressPercentage}%`,
                      },
                    ]}
                  />
                </View>
                <ThemedText style={[styles.progressText, { color: colors.textSecondary }]}>
                  {progressPercentage}%
                </ThemedText>
              </View>
            </View>

            {/* Scan Count */}
            <View style={styles.countContainer}>
              <ThemedText style={[styles.countNumber, { color: statusColor }]}>
                {item.scanCount}
              </ThemedText>
              <ThemedText style={[styles.countLabel, { color: colors.textTertiary }]}>
                /{totalParticipants}
              </ThemedText>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  // Desktop Layout
  if (isDesktop) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.desktopScrollView}
          contentContainerStyle={[
            styles.desktopContent,
            { paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 20) + 80 }
          ]}
        >
          <View style={[styles.desktopContainer, { maxWidth: containerWidth }]}>
            {/* Desktop Header */}
            <LinearGradient
              colors={[colors.gradientPrimaryStart, colors.gradientPrimaryEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.desktopHeader}
            >
              <View style={styles.desktopHeaderContent}>
                <View>
                  <ThemedText style={styles.headerTitle}>{t("checkpoints_title")}</ThemedText>
                  <ThemedText style={styles.headerSubtitle}>
                    {t("checkpoints_subtitle")}
                  </ThemedText>
                </View>
                <View style={styles.desktopStatsRow}>
                  <View style={styles.desktopStatCard}>
                    <IconSymbol name="location.fill" size={18} color="rgba(255,255,255,0.9)" />
                    <ThemedText style={styles.statValue}>{activeCheckpoints}</ThemedText>
                    <ThemedText style={styles.statLabel}>{t("checkpoints_active")}</ThemedText>
                  </View>
                  <View style={styles.desktopStatCard}>
                    <IconSymbol name="person.2.fill" size={18} color="rgba(255,255,255,0.9)" />
                    <ThemedText style={styles.statValue}>{totalParticipants}</ThemedText>
                    <ThemedText style={styles.statLabel}>{t("nav_pilgrims")}</ThemedText>
                  </View>
                  <View style={styles.desktopStatCard}>
                    <IconSymbol name="checkmark.circle.fill" size={18} color="rgba(255,255,255,0.9)" />
                    <ThemedText style={styles.statValue}>{totalScans}</ThemedText>
                    <ThemedText style={styles.statLabel}>{t("checkpoints_scans")}</ThemedText>
                  </View>
                </View>
              </View>
            </LinearGradient>

            {/* All Checkpoints */}
            <View style={styles.daySection}>
              <ThemedText style={styles.daySectionTitle}>{t("checkpoints_all")}</ThemedText>
              <View style={styles.desktopGrid}>
                {checkpointsWithStats.map((item, index) => (
                  <View key={item.id} style={styles.desktopGridItem}>
                    {renderCheckpoint({ item, index })}
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  // Mobile Layout
  return (
    <ThemedView style={styles.container}>
      {/* Premium Header */}
      <LinearGradient
        colors={[colors.gradientPrimaryStart, colors.gradientPrimaryEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}
      >
        <Animated.View entering={FadeInDown.delay(100)}>
          <ThemedText style={styles.headerTitle}>{t("checkpoints_title")}</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {t("checkpoints_subtitle")}
          </ThemedText>
        </Animated.View>

        {/* Summary Stats */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <IconSymbol name="location.fill" size={18} color="rgba(255,255,255,0.9)" />
            <ThemedText style={styles.statValue}>{activeCheckpoints}</ThemedText>
            <ThemedText style={styles.statLabel}>{t("checkpoints_active")}</ThemedText>
          </View>
          <View style={styles.statCard}>
            <IconSymbol name="person.2.fill" size={18} color="rgba(255,255,255,0.9)" />
            <ThemedText style={styles.statValue}>{totalParticipants}</ThemedText>
            <ThemedText style={styles.statLabel}>{t("nav_pilgrims")}</ThemedText>
          </View>
          <View style={styles.statCard}>
            <IconSymbol name="checkmark.circle.fill" size={18} color="rgba(255,255,255,0.9)" />
            <ThemedText style={styles.statValue}>{totalScans}</ThemedText>
            <ThemedText style={styles.statLabel}>{t("checkpoints_scans")}</ThemedText>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Checkpoint List */}
      <FlatList
        data={checkpointsWithStats}
        renderItem={renderCheckpoint}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 70 },
        ]}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Desktop styles
  desktopScrollView: {
    flex: 1,
  },
  desktopContent: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  desktopContainer: {
    width: "100%",
  },
  desktopHeader: {
    borderRadius: Radius["2xl"],
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  desktopHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  desktopStatsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  desktopStatCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  daySection: {
    marginBottom: Spacing.xl,
  },
  daySectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.md,
  },
  desktopGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  desktopGridItem: {
    width: "48%",
    minWidth: 350,
  },
  checkpointCardWrapper: {
    flex: 1,
  },
  checkpointCardDesktop: {
    marginBottom: 0,
  },
  // Mobile styles
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: Radius["2xl"],
    borderBottomRightRadius: Radius["2xl"],
  },
  headerTitle: {
    fontSize: Typography.size["2xl"],
    fontWeight: Typography.weight.bold,
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: Typography.size.sm,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
  },
  statValue: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: "#FFFFFF",
    marginTop: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.size.xs,
    color: "rgba(255,255,255,0.8)",
  },
  listContent: {
    padding: Spacing.lg,
  },
  checkpointCard: {
    borderRadius: Radius.xl,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  numberBadge: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  numberText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  checkpointInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  checkpointName: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    flex: 1,
  },
  activeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  activeBadgeText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    gap: Spacing.md,
  },
  dayBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.xs,
  },
  dayText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  timeText: {
    fontSize: Typography.size.xs,
  },
  progressSection: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  progressText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
    width: 32,
    textAlign: "right",
  },
  countContainer: {
    alignItems: "center",
    marginLeft: Spacing.md,
  },
  countNumber: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  countLabel: {
    fontSize: Typography.size.xs,
  },
});
