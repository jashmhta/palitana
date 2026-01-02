/**
 * Live Dashboard Component
 * Real-time statistics and progress monitoring
 */

import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import { GlassCard } from "@/components/glass-card";
import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DEFAULT_CHECKPOINTS as CHECKPOINTS, TOTAL_CHECKPOINTS } from "@/constants/checkpoints";
import { Checkpoint } from "@/types";
import { Colors, Radius, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { getParticipantsWithProgress, useParticipants, useScanLogs } from "@/hooks/use-storage";

interface CheckpointStats {
  id: number;
  name: string;
  scannedCount: number;
  percentage: number;
}

export function LiveDashboard() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const { participants } = useParticipants();
  const { scanLogs } = useScanLogs();
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Pulse animation for live indicator
  const pulseScale = useSharedValue(1);
  
  useEffect(() => {
    pulseScale.value = withRepeat(
      withTiming(1.3, { duration: 1000 }),
      -1,
      true
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Calculate stats
  const participantsWithProgress = getParticipantsWithProgress(participants, scanLogs);
  
  const totalParticipants = participants.length;
  const completedCount = participantsWithProgress.filter(
    p => p.totalScans === TOTAL_CHECKPOINTS
  ).length;
  const inProgressCount = participantsWithProgress.filter(
    p => p.totalScans > 0 && p.totalScans < TOTAL_CHECKPOINTS
  ).length;
  const notStartedCount = totalParticipants - completedCount - inProgressCount;

  const completionRate = totalParticipants > 0 
    ? Math.round((completedCount / totalParticipants) * 100) 
    : 0;

  // Checkpoint stats
  const checkpointStats: CheckpointStats[] = CHECKPOINTS.map((cp: Checkpoint) => {
    const uniqueScanned = new Set(
      scanLogs.filter(log => log.checkpointId === cp.id).map(log => log.participantId)
    ).size;
    return {
      id: cp.id,
      name: cp.description,
      scannedCount: uniqueScanned,
      percentage: totalParticipants > 0 
        ? Math.round((uniqueScanned / totalParticipants) * 100) 
        : 0,
    };
  });

  // Recent scans
  const recentScans = [...scanLogs]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setLastUpdate(new Date());
    setRefreshing(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getParticipantName = (participantId: string) => {
    const participant = participants.find(p => p.id === participantId);
    return participant?.name || "Unknown";
  };

  const getCheckpointName = (checkpointId: number) => {
    const checkpoint = CHECKPOINTS.find((cp: Checkpoint) => cp.id === checkpointId);
    return checkpoint?.description || `Checkpoint ${checkpointId}`;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + Spacing.base, paddingBottom: insets.bottom + 100 }
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <LinearGradient
        colors={[colors.gradientPrimaryStart, colors.gradientPrimaryEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <ThemedText style={styles.headerTitle}>Live Dashboard</ThemedText>
            <View style={styles.liveIndicator}>
              <Animated.View style={[styles.liveDot, { backgroundColor: "#4ADE80" }, pulseStyle]} />
              <ThemedText style={styles.liveText}>
                Updated {formatTime(lastUpdate)}
              </ThemedText>
            </View>
          </View>
          <Pressable onPress={handleRefresh} style={styles.refreshButton}>
            <IconSymbol name="arrow.clockwise" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Main Stats */}
        <View style={styles.mainStats}>
          <View style={styles.completionRing}>
            <Svg width={100} height={100}>
              <Circle
                cx={50}
                cy={50}
                r={42}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth={8}
                fill="none"
              />
              <Circle
                cx={50}
                cy={50}
                r={42}
                stroke="#FFFFFF"
                strokeWidth={8}
                fill="none"
                strokeDasharray={`${2 * Math.PI * 42}`}
                strokeDashoffset={`${2 * Math.PI * 42 * (1 - completionRate / 100)}`}
                strokeLinecap="round"
                rotation="-90"
                origin="50, 50"
              />
            </Svg>
            <View style={styles.completionText}>
              <ThemedText style={styles.completionPercent}>{completionRate}%</ThemedText>
              <ThemedText style={styles.completionLabel}>Complete</ThemedText>
            </View>
          </View>

          <View style={styles.statsColumn}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{completedCount}</ThemedText>
              <ThemedText style={styles.statLabel}>Completed</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{inProgressCount}</ThemedText>
              <ThemedText style={styles.statLabel}>In Progress</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{notStartedCount}</ThemedText>
              <ThemedText style={styles.statLabel}>Not Started</ThemedText>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Checkpoint Progress */}
      <Animated.View entering={FadeInDown.delay(100)}>
        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
          Checkpoint Progress
        </ThemedText>
        <GlassCard padding="md" style={styles.checkpointCard}>
          {checkpointStats.slice(0, 8).map((cp: CheckpointStats, index: number) => (
            <View key={cp.id} style={styles.checkpointRow}>
              <View style={styles.checkpointInfo}>
                <View style={[styles.checkpointNumber, { backgroundColor: colors.primaryLight }]}>
                  <ThemedText style={[styles.checkpointNumberText, { color: colors.primary }]}>
                    {cp.id}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.checkpointName, { color: colors.text }]} numberOfLines={1}>
                  {cp.name}
                </ThemedText>
              </View>
              <View style={styles.checkpointProgress}>
                <View style={[styles.progressBar, { backgroundColor: colors.backgroundSecondary }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: cp.percentage >= 100 ? colors.success : colors.primary,
                        width: `${Math.min(cp.percentage, 100)}%`,
                      },
                    ]}
                  />
                </View>
                <ThemedText style={[styles.checkpointCount, { color: colors.textSecondary }]}>
                  {cp.scannedCount}/{totalParticipants}
                </ThemedText>
              </View>
            </View>
          ))}
        </GlassCard>
      </Animated.View>

      {/* Recent Activity */}
      <Animated.View entering={FadeInDown.delay(200)}>
        <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>
          Recent Scans
        </ThemedText>
        <GlassCard padding="md" style={styles.activityCard}>
          {recentScans.length === 0 ? (
            <ThemedText style={[styles.emptyText, { color: colors.textTertiary }]}>
              No scans yet. Start scanning pilgrims at checkpoints.
            </ThemedText>
          ) : (
            recentScans.map((scan, index) => (
              <View
                key={scan.id}
                style={[
                  styles.activityRow,
                  index < recentScans.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
                ]}
              >
                <View style={[styles.activityIcon, { backgroundColor: colors.successLight }]}>
                  <IconSymbol name="checkmark.circle.fill" size={16} color={colors.success} />
                </View>
                <View style={styles.activityInfo}>
                  <ThemedText style={[styles.activityName, { color: colors.text }]}>
                    {getParticipantName(scan.participantId)}
                  </ThemedText>
                  <ThemedText style={[styles.activityDetail, { color: colors.textSecondary }]}>
                    {getCheckpointName(scan.checkpointId)}
                  </ThemedText>
                </View>
                <ThemedText style={[styles.activityTime, { color: colors.textTertiary }]}>
                  {formatTime(new Date(scan.timestamp))}
                </ThemedText>
              </View>
            ))
          )}
        </GlassCard>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.base,
  },
  header: {
    borderRadius: Radius["2xl"],
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: Typography.size["2xl"],
    fontWeight: Typography.weight.bold,
    color: "#FFFFFF",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  liveText: {
    fontSize: Typography.size.xs,
    color: "rgba(255,255,255,0.8)",
  },
  refreshButton: {
    padding: Spacing.sm,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: Radius.full,
  },
  mainStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xl,
  },
  completionRing: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  completionText: {
    position: "absolute",
    alignItems: "center",
  },
  completionPercent: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: "#FFFFFF",
  },
  completionLabel: {
    fontSize: Typography.size.xs,
    color: "rgba(255,255,255,0.8)",
  },
  statsColumn: {
    flex: 1,
    gap: Spacing.sm,
  },
  statItem: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statValue: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: Typography.size.sm,
    color: "rgba(255,255,255,0.8)",
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.md,
  },
  checkpointCard: {
    marginBottom: Spacing.xl,
  },
  checkpointRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.sm,
  },
  checkpointInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  checkpointNumber: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  checkpointNumberText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  checkpointName: {
    fontSize: Typography.size.sm,
    flex: 1,
  },
  checkpointProgress: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  progressBar: {
    width: 80,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  checkpointCount: {
    fontSize: Typography.size.xs,
    width: 50,
    textAlign: "right",
  },
  activityCard: {
    marginBottom: Spacing.xl,
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  activityDetail: {
    fontSize: Typography.size.xs,
  },
  activityTime: {
    fontSize: Typography.size.xs,
  },
  emptyText: {
    fontSize: Typography.size.sm,
    textAlign: "center",
    paddingVertical: Spacing.xl,
  },
});
