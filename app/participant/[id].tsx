import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Alert, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DEFAULT_CHECKPOINTS, TOTAL_CHECKPOINTS } from "@/constants/checkpoints";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useParticipantsDB, useScanLogsDB } from "@/hooks/use-database";

// Convert Google Drive sharing link to direct image URL
function getDirectImageUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  
  // Handle Google Drive links
  // Format: https://drive.google.com/open?id=FILE_ID
  // Convert to: https://drive.google.com/uc?export=view&id=FILE_ID
  const driveMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return `https://drive.google.com/uc?export=view&id=${driveMatch[1]}`;
  }
  
  // Handle other Google Drive formats
  const driveMatch2 = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch2) {
    return `https://drive.google.com/uc?export=view&id=${driveMatch2[1]}`;
  }
  
  return url;
}

function ProgressRing({
  progress,
  size = 100,
  strokeWidth = 8,
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

export default function ParticipantDetailScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { participants } = useParticipantsDB();
  const { scanLogs } = useScanLogsDB();

  const participant = useMemo(
    () => participants.find((p: any) => p.id === id),
    [participants, id]
  );

  const participantLogs = useMemo(
    () => scanLogs.filter((log: any) => log.participantId === id),
    [scanLogs, id]
  );

  const scannedCheckpointIds = useMemo(
    () => new Set(participantLogs.map((log: any) => log.checkpointId)),
    [participantLogs]
  );

  if (!participant) {
    return (
      <ThemedView style={styles.container}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color={colors.text} />
          </Pressable>
        </View>
        <View style={styles.emptyState}>
          <ThemedText>Participant not found</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const progressPercentage = Math.round(
    (scannedCheckpointIds.size / TOTAL_CHECKPOINTS) * 100
  );

  const isCompleted = scannedCheckpointIds.size === TOTAL_CHECKPOINTS;

  const handleViewQRCard = () => {
    router.push(`/qr-card/${id}` as any);
  };

  const handleCallPilgrim = () => {
    if (participant?.mobile) {
      Linking.openURL(`tel:${participant.mobile}`);
    }
  };

  const handleCallEmergencyContact = () => {
    if (participant?.emergencyContact) {
      Alert.alert(
        "Call Emergency Contact",
        `Call ${participant.emergencyContactName || "Emergency Contact"}?\n${participant.emergencyContact}`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Call", onPress: () => Linking.openURL(`tel:${participant.emergencyContact}`) },
        ]
      );
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        <View style={styles.headerRow}>
          <Pressable
            style={[styles.backButton, { backgroundColor: "rgba(255,255,255,0.2)" }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={20} color="#FFFFFF" />
          </Pressable>
          <ThemedText style={styles.headerTitle}>Pilgrim Details</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        {/* Profile Card */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.profileCard}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: isCompleted ? colors.successLight : colors.primaryLight,
              },
            ]}
          >
            {participant.photoUri ? (
              <Image
                source={{ uri: getDirectImageUrl(participant.photoUri) }}
                style={styles.avatarImage}
                contentFit="cover"
                transition={200}
              />
            ) : isCompleted ? (
              <IconSymbol name="checkmark.circle.fill" size={40} color={colors.success} />
            ) : (
              <ThemedText style={[styles.avatarText, { color: colors.primary }]}>
                {participant.name.charAt(0).toUpperCase()}
              </ThemedText>
            )}
          </View>
          <ThemedText style={styles.profileName}>{participant.name}</ThemedText>
          <ThemedText style={styles.profileMobile}>{participant.mobile}</ThemedText>
          {participant.age && (
            <ThemedText style={[styles.profileAge, { color: colors.textSecondary }]}>
              Age: {participant.age}
            </ThemedText>
          )}
          <Pressable
            style={styles.qrBadge}
            onPress={handleViewQRCard}
          >
            <IconSymbol name="qrcode" size={16} color="#FFFFFF" />
            <ThemedText style={styles.qrBadgeText}>{participant.qrToken}</ThemedText>
            <IconSymbol name="chevron.right" size={14} color="rgba(255,255,255,0.8)" />
          </Pressable>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 20 },
        ]}
      >
        {/* Progress Card */}
        <Animated.View
          entering={FadeInUp.delay(200)}
          style={[styles.progressCard, { backgroundColor: colors.card }, Shadows.md]}
        >
          <View style={styles.progressContent}>
            <View style={styles.progressRingContainer}>
              <ProgressRing
                progress={progressPercentage / 100}
                size={100}
                strokeWidth={10}
                color={isCompleted ? colors.success : colors.primary}
                backgroundColor={colors.backgroundSecondary}
              />
              <View style={styles.progressRingCenter}>
                <ThemedText style={styles.progressValue}>{progressPercentage}%</ThemedText>
              </View>
            </View>
            <View style={styles.progressStats}>
              <View style={styles.progressStat}>
                <ThemedText style={[styles.progressStatValue, { color: colors.primary }]}>
                  {scannedCheckpointIds.size}
                </ThemedText>
                <ThemedText style={[styles.progressStatLabel, { color: colors.textSecondary }]}>
                  Completed
                </ThemedText>
              </View>
              <View style={styles.progressStatDivider} />
              <View style={styles.progressStat}>
                <ThemedText style={[styles.progressStatValue, { color: colors.textTertiary }]}>
                  {TOTAL_CHECKPOINTS - scannedCheckpointIds.size}
                </ThemedText>
                <ThemedText style={[styles.progressStatLabel, { color: colors.textSecondary }]}>
                  Remaining
                </ThemedText>
              </View>
            </View>
          </View>
          {isCompleted && (
            <View style={[styles.completedBanner, { backgroundColor: colors.successLight }]}>
              <IconSymbol name="checkmark.seal.fill" size={18} color={colors.success} />
              <ThemedText style={[styles.completedText, { color: colors.success }]}>
                Pilgrimage Completed!
              </ThemedText>
            </View>
          )}
        </Animated.View>

        {/* Checkpoint Grid */}
        <Animated.View entering={FadeIn.delay(300)}>
          <ThemedText style={styles.sectionTitle}>Checkpoints</ThemedText>
          <View style={styles.checkpointGrid}>
            {DEFAULT_CHECKPOINTS.map((checkpoint, index) => {
              const isScanned = scannedCheckpointIds.has(checkpoint.id);
              const scanLog = participantLogs.find(
                (log) => log.checkpointId === checkpoint.id
              );

              return (
                <Animated.View
                  key={checkpoint.id}
                  entering={FadeInUp.delay(300 + index * 20)}
                  style={[
                    styles.checkpointItem,
                    { backgroundColor: colors.card },
                    Shadows.sm,
                    isScanned && { borderColor: colors.success, borderWidth: 2 },
                  ]}
                >
                  <View style={styles.checkpointHeader}>
                    <View
                      style={[
                        styles.checkpointNumber,
                        {
                          backgroundColor: isScanned
                            ? colors.successLight
                            : colors.backgroundSecondary,
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.checkpointNumberText,
                          { color: isScanned ? colors.success : colors.textSecondary },
                        ]}
                      >
                        {checkpoint.number}
                      </ThemedText>
                    </View>
                    {isScanned && (
                      <IconSymbol name="checkmark.circle.fill" size={18} color={colors.success} />
                    )}
                  </View>
                  <ThemedText
                    style={[styles.checkpointName, { color: colors.text }]}
                    numberOfLines={2}
                  >
                    {checkpoint.description}
                  </ThemedText>
                  {isScanned && scanLog && (
                    <ThemedText style={[styles.checkpointTime, { color: colors.success }]}>
                      {formatTime(scanLog.timestamp)}
                    </ThemedText>
                  )}
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>

        {/* Emergency Contact Section */}
        {(participant.emergencyContact || participant.emergencyContactName) && (
          <Animated.View entering={FadeIn.delay(400)}>
            <ThemedText style={styles.sectionTitle}>Emergency Contact</ThemedText>
            <View style={[styles.infoCard, { backgroundColor: colors.card }, Shadows.sm]}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: colors.errorLight }]}>
                  <IconSymbol name="phone.circle.fill" size={20} color={colors.error} />
                </View>
                <View style={styles.infoContent}>
                  {participant.emergencyContactName && (
                    <ThemedText style={styles.infoLabel}>
                      {participant.emergencyContactName}
                      {participant.emergencyContactRelation && (
                        <ThemedText style={[styles.infoSubtext, { color: colors.textSecondary }]}>
                          {" "}({participant.emergencyContactRelation})
                        </ThemedText>
                      )}
                    </ThemedText>
                  )}
                  <ThemedText style={[styles.infoValue, { color: colors.primary }]}>
                    {participant.emergencyContact}
                  </ThemedText>
                </View>
                <Pressable
                  style={[styles.callButton, { backgroundColor: colors.error }]}
                  onPress={handleCallEmergencyContact}
                >
                  <IconSymbol name="phone.fill" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.callButtonText}>Call</ThemedText>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Medical Information Section */}
        {(participant.bloodGroup || participant.medicalConditions || participant.allergies || participant.medications) && (
          <Animated.View entering={FadeIn.delay(450)}>
            <ThemedText style={styles.sectionTitle}>Medical Information</ThemedText>
            <View style={[styles.infoCard, { backgroundColor: colors.card }, Shadows.sm]}>
              {participant.bloodGroup && (
                <View style={[styles.medicalRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.medicalIcon, { backgroundColor: colors.errorLight }]}>
                    <ThemedText style={[styles.bloodGroupText, { color: colors.error }]}>
                      {participant.bloodGroup}
                    </ThemedText>
                  </View>
                  <View style={styles.medicalContent}>
                    <ThemedText style={[styles.medicalLabel, { color: colors.textSecondary }]}>Blood Group</ThemedText>
                    <ThemedText style={styles.medicalValue}>{participant.bloodGroup}</ThemedText>
                  </View>
                </View>
              )}
              {participant.medicalConditions && (
                <View style={[styles.medicalRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.medicalIcon, { backgroundColor: colors.warningLight }]}>
                    <IconSymbol name="heart.text.square.fill" size={18} color={colors.warning} />
                  </View>
                  <View style={styles.medicalContent}>
                    <ThemedText style={[styles.medicalLabel, { color: colors.textSecondary }]}>Medical Conditions</ThemedText>
                    <ThemedText style={styles.medicalValue}>{participant.medicalConditions}</ThemedText>
                  </View>
                </View>
              )}
              {participant.allergies && (
                <View style={[styles.medicalRow, { borderBottomColor: colors.border }]}>
                  <View style={[styles.medicalIcon, { backgroundColor: colors.errorLight }]}>
                    <IconSymbol name="exclamationmark.triangle.fill" size={18} color={colors.error} />
                  </View>
                  <View style={styles.medicalContent}>
                    <ThemedText style={[styles.medicalLabel, { color: colors.textSecondary }]}>Allergies</ThemedText>
                    <ThemedText style={[styles.medicalValue, { color: colors.error }]}>{participant.allergies}</ThemedText>
                  </View>
                </View>
              )}
              {participant.medications && (
                <View style={styles.medicalRow}>
                  <View style={[styles.medicalIcon, { backgroundColor: colors.primaryLight }]}>
                    <IconSymbol name="cross.case.fill" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.medicalContent}>
                    <ThemedText style={[styles.medicalLabel, { color: colors.textSecondary }]}>Current Medications</ThemedText>
                    <ThemedText style={styles.medicalValue}>{participant.medications}</ThemedText>
                  </View>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* Quick Actions */}
        <Animated.View entering={FadeIn.delay(480)}>
          <ThemedText style={styles.sectionTitle}>Quick Actions</ThemedText>
          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleCallPilgrim}
            >
              <IconSymbol name="phone.fill" size={20} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>Call Pilgrim</ThemedText>
            </Pressable>
            <Pressable
              style={[styles.actionButton, { backgroundColor: colors.success }]}
              onPress={handleViewQRCard}
            >
              <IconSymbol name="qrcode" size={20} color="#FFFFFF" />
              <ThemedText style={styles.actionButtonText}>View QR Card</ThemedText>
            </Pressable>
          </View>
        </Animated.View>

        {/* Scan History */}
        {participantLogs.length > 0 && (
          <Animated.View entering={FadeIn.delay(500)}>
            <ThemedText style={styles.sectionTitle}>Recent Activity</ThemedText>
            <View style={[styles.historyCard, { backgroundColor: colors.card }, Shadows.sm]}>
              {participantLogs
                .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 5)
                .map((log: any, index: number) => {
                  const checkpoint = DEFAULT_CHECKPOINTS.find((c) => c.id === log.checkpointId);
                  const isLast = index === Math.min(participantLogs.length - 1, 4);

                  return (
                    <View
                      key={log.id}
                      style={[
                        styles.historyItem,
                        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
                      ]}
                    >
                      <View style={[styles.historyIcon, { backgroundColor: colors.successLight }]}>
                        <IconSymbol name="checkmark" size={14} color={colors.success} />
                      </View>
                      <View style={styles.historyContent}>
                        <ThemedText style={styles.historyTitle}>
                          Checkpoint #{checkpoint?.number}
                        </ThemedText>
                        <ThemedText style={[styles.historyDesc, { color: colors.textSecondary }]}>
                          {checkpoint?.description}
                        </ThemedText>
                      </View>
                      <ThemedText style={[styles.historyTime, { color: colors.textTertiary }]}>
                        {formatTime(log.timestamp)}
                      </ThemedText>
                    </View>
                  );
                })}
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: Radius["2xl"],
    borderBottomRightRadius: Radius["2xl"],
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    color: "#FFFFFF",
  },
  profileCard: {
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: Typography.size["3xl"],
    fontWeight: Typography.weight.bold,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
  },
  profileName: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: "#FFFFFF",
  },
  profileMobile: {
    fontSize: Typography.size.md,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  profileAge: {
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  qrBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  qrBadgeText: {
    color: "#FFFFFF",
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  progressCard: {
    borderRadius: Radius.xl,
    marginBottom: Spacing.xl,
    overflow: "hidden",
  },
  progressContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.xl,
  },
  progressRingContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  progressRingCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  progressValue: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  progressStats: {
    flex: 1,
    flexDirection: "row",
    marginLeft: Spacing.xl,
  },
  progressStat: {
    flex: 1,
    alignItems: "center",
  },
  progressStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  progressStatValue: {
    fontSize: Typography.size["2xl"],
    fontWeight: Typography.weight.bold,
  },
  progressStatLabel: {
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  completedBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  completedText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  sectionTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.md,
  },
  checkpointGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  checkpointItem: {
    width: "48%",
    padding: Spacing.md,
    borderRadius: Radius.lg,
  },
  checkpointHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  checkpointNumber: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  checkpointNumberText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  checkpointName: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    lineHeight: 18,
  },
  checkpointTime: {
    fontSize: Typography.size.xs,
    marginTop: Spacing.xs,
  },
  historyCard: {
    borderRadius: Radius.xl,
    overflow: "hidden",
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  historyIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  historyContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  historyTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  historyDesc: {
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  historyTime: {
    fontSize: Typography.size.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  // Emergency contact and medical info styles
  infoCard: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  infoLabel: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  infoSubtext: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.normal,
  },
  infoValue: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.medium,
    marginTop: 2,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    gap: Spacing.xs,
  },
  callButtonText: {
    color: "#FFFFFF",
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
  },
  medicalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  medicalIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  medicalContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  medicalLabel: {
    fontSize: Typography.size.sm,
  },
  medicalValue: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.medium,
    marginTop: 2,
  },
  bloodGroupText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.bold,
  },
  actionsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
});
