/**
 * Missing Pilgrim Alerts Component
 * Shows pilgrims who haven't been scanned at expected checkpoints
 */

import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DEFAULT_CHECKPOINTS } from "@/constants/checkpoints";
import { Checkpoint , Participant, ScanLog } from "@/types";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useLanguage } from "@/contexts/language-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

interface MissingPilgrimAlertsProps {
  participants: Participant[];
  scanLogs: ScanLog[];
  maxAlerts?: number;
}

interface MissingPilgrim {
  participant: Participant;
  lastCheckpoint: number;
  expectedCheckpoint: number;
  hoursSinceLastScan: number;
}

export function MissingPilgrimAlerts({
  participants,
  scanLogs,
  maxAlerts = 5,
}: MissingPilgrimAlertsProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { t } = useLanguage();

  // Calculate missing pilgrims based on expected progress
  const missingPilgrims = useMemo(() => {
    const now = new Date();
    const alerts: MissingPilgrim[] = [];

    // Expected time between checkpoints (in hours)
    const EXPECTED_TIME_PER_CHECKPOINT = 1.5;
    // Alert threshold (hours since last scan)
    const ALERT_THRESHOLD_HOURS = 2;

    participants.forEach((participant) => {
      // Get all scans for this participant
      const participantScans = scanLogs
        .filter((log) => log.participantId === participant.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      if (participantScans.length === 0) {
        // Pilgrim hasn't started yet - not an alert
        return;
      }

      // Get the last scan
      const lastScan = participantScans[0];
      const lastScanTime = new Date(lastScan.timestamp);
      const hoursSinceLastScan = (now.getTime() - lastScanTime.getTime()) / (1000 * 60 * 60);

      // Find the checkpoint number of the last scan
      const lastCheckpointId = lastScan.checkpointId;
      const lastCheckpoint = DEFAULT_CHECKPOINTS.find((cp: Checkpoint) => cp.id === lastCheckpointId);
      const lastCheckpointNumber = lastCheckpoint?.number || 0;

      // If they've completed all checkpoints, no alert needed
      if (lastCheckpointNumber >= 16) {
        return;
      }

      // Calculate expected checkpoint based on time elapsed
      const expectedCheckpointsCompleted = Math.floor(
        hoursSinceLastScan / EXPECTED_TIME_PER_CHECKPOINT
      );
      const expectedCheckpoint = Math.min(lastCheckpointNumber + expectedCheckpointsCompleted, 16);

      // Alert if they're behind schedule and it's been more than threshold
      if (hoursSinceLastScan >= ALERT_THRESHOLD_HOURS && expectedCheckpoint > lastCheckpointNumber) {
        alerts.push({
          participant,
          lastCheckpoint: lastCheckpointNumber,
          expectedCheckpoint,
          hoursSinceLastScan,
        });
      }
    });

    // Sort by hours since last scan (most urgent first)
    return alerts.sort((a, b) => b.hoursSinceLastScan - a.hoursSinceLastScan).slice(0, maxAlerts);
  }, [participants, scanLogs, maxAlerts]);

  if (missingPilgrims.length === 0) {
    return null;
  }

  const handleViewPilgrim = (participantId: string) => {
    router.push(`/participant/${participantId}`);
  };

  return (
    <Animated.View entering={FadeIn} style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.alertIcon, { backgroundColor: colors.errorLight }]}>
          <IconSymbol name="exclamationmark.triangle.fill" size={18} color={colors.error} />
        </View>
        <ThemedText style={styles.title}>{t("alert_missing_pilgrims")}</ThemedText>
        <View style={[styles.badge, { backgroundColor: colors.error }]}>
          <ThemedText style={styles.badgeText}>{missingPilgrims.length}</ThemedText>
        </View>
      </View>

      <View style={[styles.alertsCard, { backgroundColor: colors.card }, Shadows.sm]}>
        {missingPilgrims.map((alert, index) => {
          const lastCp = DEFAULT_CHECKPOINTS.find((cp: Checkpoint) => cp.number === alert.lastCheckpoint);
          const expectedCp = DEFAULT_CHECKPOINTS.find((cp: Checkpoint) => cp.number === alert.expectedCheckpoint);

          return (
            <Pressable
              key={alert.participant.id}
              style={[
                styles.alertItem,
                index < missingPilgrims.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                },
              ]}
              onPress={() => handleViewPilgrim(alert.participant.id)}
            >
              <View style={styles.alertContent}>
                <View style={styles.alertTop}>
                  <ThemedText style={styles.pilgrimName} numberOfLines={1}>
                    {alert.participant.name}
                  </ThemedText>
                  <ThemedText style={[styles.timeAgo, { color: colors.error }]}>
                    {Math.round(alert.hoursSinceLastScan)}h {t("alert_hours_ago")}
                  </ThemedText>
                </View>
                <View style={styles.alertDetails}>
                  <ThemedText style={[styles.alertText, { color: colors.textSecondary }]}>
                    {t("alert_last_seen")}: CP{alert.lastCheckpoint} ({lastCp?.description || "Unknown"})
                  </ThemedText>
                </View>
                <View style={styles.alertDetails}>
                  <ThemedText style={[styles.expectedText, { color: colors.warning }]}>
                    {t("alert_expected_at")}: CP{alert.expectedCheckpoint} ({expectedCp?.description || "Unknown"})
                  </ThemedText>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  title: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    flex: 1,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    minWidth: 24,
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  alertsCard: {
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  alertContent: {
    flex: 1,
  },
  alertTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  pilgrimName: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
    flex: 1,
    marginRight: Spacing.sm,
  },
  timeAgo: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  alertDetails: {
    marginTop: 2,
  },
  alertText: {
    fontSize: Typography.size.sm,
  },
  expectedText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
});
