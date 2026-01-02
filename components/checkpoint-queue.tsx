/**
 * Checkpoint Queue Component
 * 
 * Shows volunteers only their checkpoint's recent scans and queue.
 * Optimized for single-checkpoint operation during pilgrimage.
 */

import { useMemo } from "react";
import {
  FlatList,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DEFAULT_CHECKPOINTS } from "@/constants/checkpoints";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Participant, ScanLog } from "@/types";
import { calculateJatraStats, formatJatraCount } from "@/utils/jatra-calculator";

interface CheckpointQueueProps {
  checkpointId: number;
  participants: Participant[];
  scanLogs: ScanLog[];
  maxItems?: number;
}

interface QueueItem {
  participant: Participant;
  scanTime: Date;
  jatraCount: number;
  badgeNumber: number;
}

export function CheckpointQueue({
  checkpointId,
  participants,
  scanLogs,
  maxItems = 20,
}: CheckpointQueueProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const checkpoint = DEFAULT_CHECKPOINTS.find((c) => c.id === checkpointId);

  // Get recent scans at this checkpoint
  const recentScans = useMemo(() => {
    const checkpointLogs = scanLogs
      .filter((log) => log.checkpointId === checkpointId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, maxItems);

    return checkpointLogs.map((log) => {
      const participant = participants.find((p) => p.id === log.participantId);
      if (!participant) return null;

      const stats = calculateJatraStats(participant.id, scanLogs);
      const badgeNumber = parseInt(participant.qrToken.replace("PALITANA_YATRA_", ""), 10);

      return {
        participant,
        scanTime: new Date(log.timestamp),
        jatraCount: stats.totalJatras,
        badgeNumber,
      };
    }).filter(Boolean) as QueueItem[];
  }, [checkpointId, participants, scanLogs, maxItems]);

  // Statistics for this checkpoint
  const stats = useMemo(() => {
    const checkpointLogs = scanLogs.filter((log) => log.checkpointId === checkpointId);
    const uniquePilgrims = new Set(checkpointLogs.map((log) => log.participantId)).size;
    
    // Scans in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const lastHourScans = checkpointLogs.filter(
      (log) => new Date(log.timestamp) > oneHourAgo
    ).length;

    // Scans in last 10 minutes
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentScans = checkpointLogs.filter(
      (log) => new Date(log.timestamp) > tenMinsAgo
    ).length;

    return {
      totalScans: checkpointLogs.length,
      uniquePilgrims,
      lastHourScans,
      recentScans,
    };
  }, [checkpointId, scanLogs]);

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const renderQueueItem = ({ item, index }: { item: QueueItem; index: number }) => (
    <Animated.View
      entering={FadeInDown.delay(index * 30).springify()}
      style={[styles.queueItem, { backgroundColor: colors.card }, Shadows.sm]}
    >
      <View style={[styles.badgeCircle, { backgroundColor: colors.primary }]}>
        <ThemedText style={styles.badgeText}>#{item.badgeNumber}</ThemedText>
      </View>
      <View style={styles.itemInfo}>
        <ThemedText style={styles.itemName} numberOfLines={1}>
          {item.participant.name}
        </ThemedText>
        <View style={styles.itemMeta}>
          <ThemedText style={[styles.itemTime, { color: colors.textSecondary }]}>
            {formatTime(item.scanTime)}
          </ThemedText>
          <View style={[styles.jatraBadge, { backgroundColor: colors.successLight }]}>
            <ThemedText style={[styles.jatraText, { color: colors.success }]}>
              {formatJatraCount(item.jatraCount)}
            </ThemedText>
          </View>
        </View>
      </View>
      <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Checkpoint Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerContent}>
          <View style={styles.checkpointBadge}>
            <ThemedText style={styles.checkpointNumber}>#{checkpoint?.number}</ThemedText>
          </View>
          <View style={styles.headerInfo}>
            <ThemedText style={styles.checkpointName}>{checkpoint?.description}</ThemedText>
            <ThemedText style={styles.headerSubtitle}>Checkpoint Queue</ThemedText>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View style={[styles.statsRow, { backgroundColor: colors.backgroundSecondary }]}>
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: colors.primary }]}>
            {stats.recentScans}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
            Last 10 min
          </ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: colors.primary }]}>
            {stats.lastHourScans}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
            Last hour
          </ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: colors.primary }]}>
            {stats.uniquePilgrims}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
            Unique
          </ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <ThemedText style={[styles.statValue, { color: colors.primary }]}>
            {stats.totalScans}
          </ThemedText>
          <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
            Total
          </ThemedText>
        </View>
      </View>

      {/* Queue List */}
      {recentScans.length > 0 ? (
        <FlatList
          data={recentScans}
          keyExtractor={(item, index) => `${item.participant.id}-${index}`}
          renderItem={renderQueueItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <IconSymbol name="person.crop.circle.badge.clock" size={48} color={colors.textSecondary} />
          <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
            No scans yet at this checkpoint
          </ThemedText>
          <ThemedText style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            Scans will appear here as pilgrims pass through
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  checkpointBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkpointNumber: {
    color: "#FFFFFF",
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  headerInfo: {
    flex: 1,
  },
  checkpointName: {
    color: "#FFFFFF",
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: Typography.size.sm,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingVertical: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginTop: -Spacing.md,
    borderRadius: Radius.lg,
    ...Shadows.sm,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  statLabel: {
    fontSize: Typography.size.xs,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  queueItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.md,
  },
  badgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  itemTime: {
    fontSize: Typography.size.sm,
  },
  jatraBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  jatraText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.semibold,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.medium,
  },
  emptySubtext: {
    fontSize: Typography.size.sm,
    textAlign: "center",
  },
});
