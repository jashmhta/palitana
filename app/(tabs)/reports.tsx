import * as Sharing from "expo-sharing";
import { Paths, File } from "expo-file-system";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import { DayPicker } from "@/components/day-picker";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useLanguage } from "@/contexts/language-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DEFAULT_CHECKPOINTS, TOTAL_CHECKPOINTS } from "@/constants/checkpoints";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useOfflineSync } from "@/hooks/use-offline-sync";
import { AIChat } from "@/components/ai-chat";
import { getParticipantsWithProgress } from "@/hooks/use-storage";

// Animated Progress Ring Component
function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 10,
  color,
  backgroundColor,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  backgroundColor: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <Svg width={size} height={size}>
      <Circle
        stroke={backgroundColor}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
      />
      <Circle
        stroke={color}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

export default function ReportsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const [isExporting, setIsExporting] = useState(false);
  const [selectedDay, setSelectedDay] = useState<1 | 2 | "all">("all");

  const { participants, scanLogs } = useOfflineSync();

  const participantsWithProgress = useMemo(
    () => getParticipantsWithProgress(participants, scanLogs),
    [participants, scanLogs]
  );

  // Filter checkpoints by selected day
  const filteredCheckpoints = selectedDay === "all"
    ? DEFAULT_CHECKPOINTS
    : DEFAULT_CHECKPOINTS.filter((c) => c.day === selectedDay);

  const dayCheckpointCount = selectedDay === "all" ? TOTAL_CHECKPOINTS : 8;

  // Calculate statistics (day-filtered)
  const stats = useMemo(() => {
    const totalParticipants = participants.length;
    
    // Filter scan logs by day if a specific day is selected
    const filteredScanLogs = selectedDay === "all"
      ? scanLogs
      : scanLogs.filter((log) => {
          const checkpoint = DEFAULT_CHECKPOINTS.find((c) => c.id === log.checkpointId);
          return checkpoint?.day === selectedDay;
        });
    
    const totalScans = filteredScanLogs.length;
    
    // Calculate progress based on filtered checkpoints
    const getFilteredProgress = (p: typeof participantsWithProgress[0]) => {
      if (selectedDay === "all") return p.totalScans;
      return p.scannedCheckpoints.filter((cpId) => {
        const cp = DEFAULT_CHECKPOINTS.find((c) => c.id === cpId);
        return cp?.day === selectedDay;
      }).length;
    };
    
    const completedParticipants = participantsWithProgress.filter(
      (p) => getFilteredProgress(p) === dayCheckpointCount
    ).length;
    const notStartedParticipants = participantsWithProgress.filter(
      (p) => getFilteredProgress(p) === 0
    ).length;
    const inProgressParticipants =
      totalParticipants - completedParticipants - notStartedParticipants;

    const checkpointStats = filteredCheckpoints.map((checkpoint) => {
      const checkpointLogs = scanLogs.filter((log) => log.checkpointId === checkpoint.id);
      return {
        ...checkpoint,
        scanCount: checkpointLogs.length,
        percentage:
          totalParticipants > 0
            ? Math.round((checkpointLogs.length / totalParticipants) * 100)
            : 0,
      };
    });

    // Calculate total Jatras - each scan at Gheti (checkpoint 2) = 1 Jatra complete
    // Gheti is checkpoint ID 2
    const ghetiScans = filteredScanLogs.filter((log) => log.checkpointId === 2).length;
    const totalJatras = ghetiScans;

    // Get recent scans with timestamps (last 10)
    const recentScans = filteredScanLogs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
      .map((log) => {
        const participant = participants.find((p) => p.id === log.participantId);
        const checkpoint = DEFAULT_CHECKPOINTS.find((c) => c.id === log.checkpointId);
        return {
          id: log.id,
          participantName: participant?.name || "Unknown",
          checkpointName: checkpoint?.description || `Checkpoint ${log.checkpointId}`,
          checkpointNumber: checkpoint?.number || log.checkpointId,
          timestamp: log.timestamp,
        };
      });

    return {
      totalParticipants,
      totalScans,
      totalJatras,
      completedParticipants,
      notStartedParticipants,
      inProgressParticipants,
      completionRate:
        totalParticipants > 0
          ? Math.round((completedParticipants / totalParticipants) * 100)
          : 0,
      checkpointStats,
      recentScans,
    };
  }, [participants, scanLogs, participantsWithProgress, selectedDay, filteredCheckpoints, dayCheckpointCount]);

  // Helper function to extract badge number from QR token (e.g., "PALITANA_YATRA_123" -> "123")
  const extractBadgeNumber = (qrToken: string): string => {
    const match = qrToken.match(/PALITANA_YATRA_(\d+)/);
    return match ? match[1] : qrToken;
  };

  // Helper function to format time as HH:MM:SS
  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-IN", { 
      hour: "2-digit", 
      minute: "2-digit", 
      second: "2-digit",
      hour12: false 
    });
  };

  // Helper function to determine day from timestamp (Day 1 or Day 2)
  const getDayFromTimestamp = (timestamp: string): number => {
    // For now, all checkpoints are Day 1
    // This can be enhanced to check actual date if needed
    return 1;
  };

  const exportToCSV = async () => {
    setIsExporting(true);
    try {
      // ScanLogs sheet format: Day / Time / Badge Number / Yatri Name / Checkpoint Name
      let csvContent = "=== ScanLogs ===\n";
      csvContent += "Day,Time,Badge Number,Yatri Name,Checkpoint Name\n";

      // Sort scan logs by timestamp (newest first)
      const sortedScanLogs = [...scanLogs].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      sortedScanLogs.forEach((log) => {
        const participant = participants.find((p) => p.id === log.participantId);
        const checkpoint = DEFAULT_CHECKPOINTS.find((c) => c.id === log.checkpointId);
        const badgeNumber = participant ? extractBadgeNumber(participant.qrToken) : "Unknown";
        const day = getDayFromTimestamp(log.timestamp);
        const time = formatTime(log.timestamp);
        const checkpointName = checkpoint?.description || `Checkpoint ${log.checkpointId}`;
        
        csvContent += `${day},${time},${badgeNumber},"${participant?.name || "Unknown"}",${checkpointName}\n`;
      });

      // JatraCompletions section: Day / Badge Number / Yatri Name / Jatra Number / Start Time / End Time / Duration
      csvContent += "\n=== JatraCompletions ===\n";
      csvContent += "Day,Badge Number,Yatri Name,Jatra Number,Start Time,End Time,Duration (mins)\n";

      // Calculate Jatra completions (Gheti scans with prior Aamli scans)
      // Group scans by participant
      const participantScans: Map<string, typeof scanLogs> = new Map();
      sortedScanLogs.forEach((log) => {
        const existing = participantScans.get(log.participantId) || [];
        existing.push(log);
        participantScans.set(log.participantId, existing);
      });

      // For each participant, find Jatra completions (Aamli -> Gheti pairs)
      participantScans.forEach((logs, participantId) => {
        const participant = participants.find((p) => p.id === participantId);
        if (!participant) return;

        const badgeNumber = extractBadgeNumber(participant.qrToken);
        
        // Sort logs by timestamp (oldest first for pairing)
        const sortedLogs = [...logs].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        // Find Aamli (checkpoint 1) -> Gheti (checkpoint 2) pairs
        let jatraCount = 0;
        let lastAamliScan: typeof logs[0] | null = null;

        sortedLogs.forEach((log) => {
          if (log.checkpointId === 1) {
            // Aamli scan - potential start of Jatra
            lastAamliScan = log;
          } else if (log.checkpointId === 2 && lastAamliScan) {
            // Gheti scan after Aamli - Jatra complete!
            jatraCount++;
            const startTime = formatTime(lastAamliScan.timestamp);
            const endTime = formatTime(log.timestamp);
            const durationMs = new Date(log.timestamp).getTime() - new Date(lastAamliScan.timestamp).getTime();
            const durationMins = Math.round(durationMs / (1000 * 60));
            const day = getDayFromTimestamp(log.timestamp);

            csvContent += `${day},${badgeNumber},"${participant.name}",${jatraCount},${startTime},${endTime},${durationMins}\n`;
            lastAamliScan = null; // Reset for next Jatra
          }
        });
      });

      const fileName = `palitana_yatra_report_${new Date().toISOString().split("T")[0]}.csv`;
      const file = new File(Paths.cache, fileName);
      await file.write(csvContent);
      const filePath = file.uri;

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: "text/csv",
          dialogTitle: "Export Yatra Report",
        });
      } else {
        Alert.alert("Success", `Report saved to ${fileName}`);
      }
    } catch (error) {
      console.error("Export error:", error);
      Alert.alert("Error", "Failed to export report. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return colors.success;
    if (percentage >= 50) return colors.pending;
    if (percentage > 0) return colors.primary;
    return colors.textTertiary;
  };

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
          <ThemedText style={styles.headerTitle}>{t("reports_title")}</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            Pilgrimage progress and statistics
          </ThemedText>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 70 },
        ]}
      >
        {/* Day Picker */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.dayPickerSection}>
          <DayPicker
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            showAllOption
          />
        </Animated.View>

        {/* Day Info Banner */}
        {selectedDay !== "all" && (
          <Animated.View
            entering={FadeIn}
            style={[styles.dayBanner, { backgroundColor: selectedDay === 1 ? colors.primaryLight : colors.successLight }]}
          >
            <IconSymbol
              name="calendar"
              size={24}
              color={selectedDay === 1 ? colors.primary : colors.success}
            />
            <View style={styles.dayBannerText}>
              <ThemedText style={[styles.dayBannerTitle, { color: selectedDay === 1 ? colors.primary : colors.success }]}>
                Day {selectedDay} Statistics
              </ThemedText>
              <ThemedText style={[styles.dayBannerSubtitle, { color: colors.textSecondary }]}>
                Showing all checkpoints for Day {selectedDay}
              </ThemedText>
            </View>
          </Animated.View>
        )}

        {/* Completion Ring Card */}
        <Animated.View
          entering={FadeInUp.delay(200)}
          style={[styles.ringCard, { backgroundColor: colors.card }, Shadows.md]}
        >
          <View style={styles.ringContainer}>
            <ProgressRing
              progress={stats.completionRate / 100}
              size={140}
              strokeWidth={12}
              color={colors.success}
              backgroundColor={colors.backgroundSecondary}
            />
            <View style={styles.ringCenter}>
              <ThemedText style={styles.ringValue}>
                {stats.completionRate}%
              </ThemedText>
              <ThemedText style={[styles.ringLabel, { color: colors.textSecondary }]}>
                Completed
              </ThemedText>
            </View>
          </View>

          <View style={styles.ringStats}>
            <View style={styles.ringStat}>
              <View style={[styles.statDot, { backgroundColor: colors.success }]} />
              <ThemedText style={[styles.ringStatLabel, { color: colors.textSecondary }]}>
                Completed
              </ThemedText>
              <ThemedText style={styles.ringStatValue}>{stats.completedParticipants}</ThemedText>
            </View>
            <View style={styles.ringStat}>
              <View style={[styles.statDot, { backgroundColor: colors.pending }]} />
              <ThemedText style={[styles.ringStatLabel, { color: colors.textSecondary }]}>
                In Progress
              </ThemedText>
              <ThemedText style={styles.ringStatValue}>{stats.inProgressParticipants}</ThemedText>
            </View>
            <View style={styles.ringStat}>
              <View style={[styles.statDot, { backgroundColor: colors.textTertiary }]} />
              <ThemedText style={[styles.ringStatLabel, { color: colors.textSecondary }]}>
                Not Started
              </ThemedText>
              <ThemedText style={styles.ringStatValue}>{stats.notStartedParticipants}</ThemedText>
            </View>
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View entering={FadeIn.delay(300)} style={styles.quickStats}>
          <View style={[styles.quickStatCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <View style={[styles.quickStatIcon, { backgroundColor: colors.primaryLight }]}>
              <IconSymbol name="person.2.fill" size={20} color={colors.primary} />
            </View>
            <ThemedText style={styles.quickStatValue}>{stats.totalParticipants}</ThemedText>
            <ThemedText style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
              Total Pilgrims
            </ThemedText>
          </View>

          <View style={[styles.quickStatCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <View style={[styles.quickStatIcon, { backgroundColor: colors.successLight }]}>
              <IconSymbol name="checkmark.circle.fill" size={20} color={colors.success} />
            </View>
            <ThemedText style={styles.quickStatValue}>{stats.totalScans}</ThemedText>
            <ThemedText style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
              Total Scans
            </ThemedText>
          </View>

          <View style={[styles.quickStatCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <View style={[styles.quickStatIcon, { backgroundColor: '#FEF3C7' }]}>
              <IconSymbol name="arrow.triangle.2.circlepath" size={20} color={colors.pending} />
            </View>
            <ThemedText style={styles.quickStatValue}>{stats.totalJatras}</ThemedText>
            <ThemedText style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
              Total Jatras
            </ThemedText>
          </View>
        </Animated.View>

        {/* Checkpoint Progress */}
        <Animated.View entering={FadeInUp.delay(400)}>
          <ThemedText style={styles.sectionTitle}>Checkpoint Progress</ThemedText>
          <View style={[styles.checkpointList, { backgroundColor: colors.card }, Shadows.sm]}>
            {stats.checkpointStats.map((checkpoint, index) => {
              const statusColor = getProgressColor(checkpoint.percentage);

              return (
                <View
                  key={checkpoint.id}
                  style={[
                    styles.checkpointRow,
                    index < stats.checkpointStats.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={[styles.cpNumber, { backgroundColor: colors.backgroundSecondary }]}>
                    <ThemedText style={[styles.cpNumberText, { color: colors.textSecondary }]}>
                      {checkpoint.number}
                    </ThemedText>
                  </View>
                  <View style={styles.cpInfo}>
                    <ThemedText style={styles.cpName} numberOfLines={1}>
                      {checkpoint.description}
                    </ThemedText>
                    <View style={[styles.cpProgressBg, { backgroundColor: colors.backgroundSecondary }]}>
                      <View
                        style={[
                          styles.cpProgressFill,
                          { backgroundColor: statusColor, width: `${checkpoint.percentage}%` },
                        ]}
                      />
                    </View>
                  </View>
                  <View style={styles.cpCount}>
                    <ThemedText style={[styles.cpCountValue, { color: statusColor }]}>
                      {checkpoint.scanCount}
                    </ThemedText>
                    <ThemedText style={[styles.cpCountPercent, { color: colors.textTertiary }]}>
                      {checkpoint.percentage}%
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* Recent Activity with Timestamps */}
        {stats.recentScans.length > 0 && (
          <Animated.View entering={FadeInUp.delay(450)}>
            <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
            <View style={[styles.recentActivityCard, { backgroundColor: colors.card }, Shadows.sm]}>
              {stats.recentScans.map((scan, index) => {
                const scanDate = new Date(scan.timestamp);
                const timeStr = scanDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const dateStr = scanDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                
                return (
                  <View
                    key={scan.id}
                    style={[
                      styles.recentScanRow,
                      index < stats.recentScans.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <View style={[styles.recentScanIcon, { backgroundColor: colors.primaryLight }]}>
                      <IconSymbol name="checkmark.circle.fill" size={16} color={colors.primary} />
                    </View>
                    <View style={styles.recentScanInfo}>
                      <ThemedText style={styles.recentScanName} numberOfLines={1}>
                        {scan.participantName}
                      </ThemedText>
                      <ThemedText style={[styles.recentScanCheckpoint, { color: colors.textSecondary }]}>
                        {scan.checkpointName}
                      </ThemedText>
                    </View>
                    <View style={styles.recentScanTime}>
                      <ThemedText style={[styles.recentScanTimeText, { color: colors.primary }]}>
                        {timeStr}
                      </ThemedText>
                      <ThemedText style={[styles.recentScanDateText, { color: colors.textTertiary }]}>
                        {dateStr}
                      </ThemedText>
                    </View>
                  </View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Export Button */}
        <Animated.View entering={FadeIn.delay(500)}>
          <Pressable
            style={({ pressed }) => [
              styles.exportButton,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              isExporting && { opacity: 0.6 },
            ]}
            onPress={exportToCSV}
            disabled={isExporting}
          >
            <IconSymbol name="square.and.arrow.up" size={20} color="#FFFFFF" />
            <ThemedText style={styles.exportButtonText}>
              {isExporting ? "Exporting..." : "Export Report (CSV)"}
            </ThemedText>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* AI Chat Floating Button */}
      <AIChat />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  scrollContent: {
    padding: Spacing.lg,
  },
  ringCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  ringContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
  },
  ringValue: {
    fontSize: Typography.size["3xl"],
    fontWeight: Typography.weight.bold,
  },
  ringLabel: {
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  ringStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  ringStat: {
    alignItems: "center",
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: Spacing.xs,
  },
  ringStatLabel: {
    fontSize: Typography.size.xs,
    marginBottom: 2,
  },
  ringStatValue: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  quickStats: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  quickStatCard: {
    flex: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: "center",
  },
  quickStatIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  quickStatValue: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  quickStatLabel: {
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.md,
  },
  checkpointList: {
    borderRadius: Radius.xl,
    overflow: "hidden",
    marginBottom: Spacing.xl,
  },
  checkpointRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  cpNumber: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  cpNumberText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  cpInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  cpName: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing.xs,
  },
  cpProgressBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  cpProgressFill: {
    height: "100%",
    borderRadius: 2,
  },
  cpCount: {
    alignItems: "flex-end",
    marginLeft: Spacing.md,
  },
  cpCountValue: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.bold,
  },
  cpCountPercent: {
    fontSize: Typography.size.xs,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    gap: Spacing.sm,
  },
  exportButtonText: {
    color: "#FFFFFF",
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  // Day picker styles
  dayPickerSection: {
    marginBottom: Spacing.lg,
  },
  dayBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  dayBannerText: {
    flex: 1,
  },
  dayBannerTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  dayBannerSubtitle: {
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  // Recent Activity styles
  recentActivityCard: {
    borderRadius: Radius.xl,
    overflow: "hidden",
    marginBottom: Spacing.xl,
  },
  recentScanRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
  },
  recentScanIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  recentScanInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  recentScanName: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  recentScanCheckpoint: {
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  recentScanTime: {
    alignItems: "flex-end",
    marginLeft: Spacing.md,
  },
  recentScanTimeText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  recentScanDateText: {
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
});
