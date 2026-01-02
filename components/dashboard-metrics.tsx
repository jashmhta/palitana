/**
 * Dashboard Metrics Component
 * Real-time statistics and analytics for volunteer dashboard
 */

import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { IconSymbol } from "./ui/icon-symbol";
import { ThemedText } from "./themed-text";
import { Colors, Shadows } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Participant, ScanLog } from "@/types";
import { DEFAULT_CHECKPOINTS } from "@/constants/checkpoints";

interface DashboardMetricsProps {
  participants: Participant[];
  scanLogs: ScanLog[];
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color: string;
  delay?: number;
}

function MetricCard({ title, value, subtitle, icon, color, delay = 0 }: MetricCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={[
        styles.metricCard,
        { backgroundColor: colors.card },
        Shadows.md,
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
        <IconSymbol name={icon as any} size={24} color={color} />
      </View>
      <View style={styles.metricContent}>
        <ThemedText style={[styles.metricTitle, { color: colors.textSecondary }]}>
          {title}
        </ThemedText>
        <ThemedText style={styles.metricValue}>{value}</ThemedText>
        {subtitle && (
          <ThemedText style={[styles.metricSubtitle, { color: colors.textTertiary }]}>
            {subtitle}
          </ThemedText>
        )}
      </View>
    </Animated.View>
  );
}

export function DashboardMetrics({ participants, scanLogs }: DashboardMetricsProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const metrics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Today's scans
    const todayScans = scanLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= today;
    });

    // Last hour scans
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const lastHourScans = scanLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= oneHourAgo;
    });

    // Scans per checkpoint
    const checkpointScans = DEFAULT_CHECKPOINTS.map(cp => ({
      checkpoint: cp,
      count: scanLogs.filter(log => log.checkpointId === cp.id).length,
    }));

    // Most active checkpoint
    const mostActive = checkpointScans.reduce((max, current) => 
      current.count > max.count ? current : max
    , checkpointScans[0]);

    // Completion rate
    const totalPossibleScans = participants.length * DEFAULT_CHECKPOINTS.length;
    const completionRate = totalPossibleScans > 0 
      ? Math.round((scanLogs.length / totalPossibleScans) * 100)
      : 0;

    // Participants with all checkpoints
    const participantScans = new Map<string, Set<number>>();
    scanLogs.forEach(log => {
      if (!participantScans.has(log.participantId)) {
        participantScans.set(log.participantId, new Set());
      }
      participantScans.get(log.participantId)!.add(log.checkpointId);
    });

    const completedParticipants = Array.from(participantScans.values()).filter(
      checkpoints => checkpoints.size === DEFAULT_CHECKPOINTS.length
    ).length;

    // Average scans per hour (today)
    const hoursElapsed = Math.max(1, (now.getTime() - today.getTime()) / (1000 * 60 * 60));
    const avgScansPerHour = Math.round(todayScans.length / hoursElapsed);

    // Pending sync count
    const pendingScans = scanLogs.filter(log => !log.synced).length;

    return {
      totalScans: scanLogs.length,
      todayScans: todayScans.length,
      lastHourScans: lastHourScans.length,
      totalParticipants: participants.length,
      completedParticipants,
      completionRate,
      mostActiveCheckpoint: mostActive,
      avgScansPerHour,
      pendingScans,
    };
  }, [participants, scanLogs]);

  return (
    <View style={styles.container}>
      {/* Row 1: Total & Today */}
      <View style={styles.row}>
        <MetricCard
          title="Total Scans"
          value={metrics.totalScans}
          subtitle="All checkpoints"
          icon="qrcode"
          color={colors.primary}
          delay={0}
        />
        <MetricCard
          title="Today's Scans"
          value={metrics.todayScans}
          subtitle={`${metrics.avgScansPerHour}/hr avg`}
          icon="calendar"
          color={colors.success}
          delay={50}
        />
      </View>

      {/* Row 2: Last Hour & Completion */}
      <View style={styles.row}>
        <MetricCard
          title="Last Hour"
          value={metrics.lastHourScans}
          subtitle="Recent activity"
          icon="clock"
          color={colors.pending}
          delay={100}
        />
        <MetricCard
          title="Completion"
          value={`${metrics.completionRate}%`}
          subtitle={`${metrics.completedParticipants} finished`}
          icon="checkmark.circle.fill"
          color={colors.success}
          delay={150}
        />
      </View>

      {/* Row 3: Most Active & Pending */}
      <View style={styles.row}>
        <MetricCard
          title="Most Active"
          value={`CP ${metrics.mostActiveCheckpoint.checkpoint.number}`}
          subtitle={`${metrics.mostActiveCheckpoint.count} scans`}
          icon="location.fill"
          color={colors.primary}
          delay={200}
        />
        <MetricCard
          title="Pending Sync"
          value={metrics.pendingScans}
          subtitle={metrics.pendingScans > 0 ? "Syncing..." : "All synced"}
          icon={metrics.pendingScans > 0 ? "arrow.clockwise" : "checkmark.circle.fill"}
          color={metrics.pendingScans > 0 ? colors.error : colors.success}
          delay={250}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    flexDirection: "row",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  metricContent: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  metricSubtitle: {
    fontSize: 11,
    fontWeight: "500",
  },
});
