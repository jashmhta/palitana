/**
 * Missing Pilgrim Alert Component
 * 
 * Identifies pilgrims who may be in distress:
 * - Scanned at Aamli (descending) but not at Gheti for > 5 hours
 * - Started pilgrimage but no activity for > 5 hours
 * 
 * This is a critical safety feature for the pilgrimage.
 */

import { useMemo } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Participant, ScanLog } from "@/types";
import { calculateJatraStats } from "@/utils/jatra-calculator";

// Alert thresholds in milliseconds
const TRANSIT_ALERT_THRESHOLD = 5 * 60 * 60 * 1000; // 5 hours between Aamli and Gheti
const INACTIVE_ALERT_THRESHOLD = 5 * 60 * 60 * 1000; // 5 hours since last scan

interface MissingPilgrim {
  participant: Participant;
  alertType: "in_transit" | "inactive";
  lastScanTime: Date;
  lastCheckpoint: string;
  timeSinceLastScan: number; // in minutes
}

interface MissingPilgrimAlertProps {
  participants: Participant[];
  scanLogs: ScanLog[];
  onCallEmergency: (phone: string) => void;
}

export function MissingPilgrimAlert({
  participants,
  scanLogs,
  onCallEmergency,
}: MissingPilgrimAlertProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Identify potentially missing pilgrims
  const missingPilgrims = useMemo(() => {
    const now = new Date();
    const alerts: MissingPilgrim[] = [];

    for (const participant of participants) {
      const stats = calculateJatraStats(participant.id, scanLogs);
      
      if (!stats.lastScanTime) continue; // Never scanned, not started
      
      const lastScanDate = new Date(stats.lastScanTime);
      const timeSinceLastScan = now.getTime() - lastScanDate.getTime();
      const timeSinceLastScanMinutes = Math.floor(timeSinceLastScan / 60000);
      
      // Check if in transit (descending) for too long
      if (stats.isCurrentlyDescending && timeSinceLastScan > TRANSIT_ALERT_THRESHOLD) {
        alerts.push({
          participant,
          alertType: "in_transit",
          lastScanTime: lastScanDate,
          lastCheckpoint: "Aamli",
          timeSinceLastScan: timeSinceLastScanMinutes,
        });
      }
      // Check if inactive for too long
      else if (timeSinceLastScan > INACTIVE_ALERT_THRESHOLD) {
        // Determine last checkpoint
        const lastLog = scanLogs
          .filter((log) => log.participantId === participant.id)
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        
        const checkpointNames: Record<number, string> = {
          1: "Aamli",
          2: "Gheti",
          3: "Front Side",
        };
        
        alerts.push({
          participant,
          alertType: "inactive",
          lastScanTime: lastScanDate,
          lastCheckpoint: checkpointNames[lastLog?.checkpointId] || "Unknown",
          timeSinceLastScan: timeSinceLastScanMinutes,
        });
      }
    }

    // Sort by time since last scan (most urgent first)
    return alerts.sort((a, b) => b.timeSinceLastScan - a.timeSinceLastScan);
  }, [participants, scanLogs]);

  const handleCall = async (phone: string) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onCallEmergency(phone);
  };

  const formatTimeSince = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m ago`;
  };

  if (missingPilgrims.length === 0) {
    return null; // No alerts
  }

  const renderAlertCard = ({ item, index }: { item: MissingPilgrim; index: number }) => {
    const badgeNumber = parseInt(item.participant.qrToken.replace("PALITANA_YATRA_", ""), 10);
    const isUrgent = item.alertType === "in_transit";

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        style={[
          styles.alertCard,
          { 
            backgroundColor: isUrgent ? colors.errorLight : colors.warningLight,
            borderLeftColor: isUrgent ? colors.error : colors.warning,
          },
        ]}
      >
        <View style={styles.alertHeader}>
          <View style={styles.alertIcon}>
            <IconSymbol 
              name={isUrgent ? "exclamationmark.triangle.fill" : "clock.fill"} 
              size={24} 
              color={isUrgent ? colors.error : colors.warning} 
            />
          </View>
          <View style={styles.alertInfo}>
            <ThemedText style={styles.alertTitle}>
              {isUrgent ? "⚠️ In Transit Too Long" : "⏰ No Recent Activity"}
            </ThemedText>
            <ThemedText style={[styles.alertSubtitle, { color: colors.textSecondary }]}>
              Last seen at {item.lastCheckpoint} • {formatTimeSince(item.timeSinceLastScan)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.pilgrimRow}>
          <View style={[styles.badgeCircle, { backgroundColor: isUrgent ? colors.error : colors.warning }]}>
            <ThemedText style={styles.badgeText}>#{badgeNumber}</ThemedText>
          </View>
          <View style={styles.pilgrimDetails}>
            <ThemedText style={styles.pilgrimName}>{item.participant.name}</ThemedText>
            <ThemedText style={[styles.pilgrimPhone, { color: colors.textSecondary }]}>
              {item.participant.mobile}
            </ThemedText>
            {item.participant.bloodGroup && (
              <View style={[styles.bloodBadge, { backgroundColor: colors.error }]}>
                <ThemedText style={styles.bloodText}>{item.participant.bloodGroup}</ThemedText>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <Pressable
            style={[styles.callButton, { backgroundColor: colors.success }]}
            onPress={() => handleCall(item.participant.mobile)}
          >
            <IconSymbol name="phone.fill" size={18} color="#FFFFFF" />
            <ThemedText style={styles.callButtonText}>Call Pilgrim</ThemedText>
          </Pressable>
          
          {item.participant.emergencyContact && (
            <Pressable
              style={[styles.callButton, { backgroundColor: colors.error }]}
              onPress={() => handleCall(item.participant.emergencyContact!)}
            >
              <IconSymbol name="phone.fill" size={18} color="#FFFFFF" />
              <ThemedText style={styles.callButtonText}>Emergency</ThemedText>
            </Pressable>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconSymbol name="exclamationmark.triangle.fill" size={20} color={colors.error} />
        <ThemedText style={[styles.headerTitle, { color: colors.error }]}>
          {missingPilgrims.length} Pilgrim{missingPilgrims.length > 1 ? "s" : ""} Need Attention
        </ThemedText>
      </View>
      
      <FlatList
        data={missingPilgrims}
        keyExtractor={(item) => item.participant.id}
        renderItem={renderAlertCard}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  alertCard: {
    width: 280,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderLeftWidth: 4,
    ...Shadows.md,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  alertIcon: {
    marginTop: 2,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  alertSubtitle: {
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  pilgrimRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  badgeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
  pilgrimDetails: {
    flex: 1,
  },
  pilgrimName: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  pilgrimPhone: {
    fontSize: Typography.size.sm,
  },
  bloodBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    marginTop: Spacing.xs,
  },
  bloodText: {
    color: "#FFFFFF",
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  callButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  callButtonText: {
    color: "#FFFFFF",
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
});
