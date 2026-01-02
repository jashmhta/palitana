/**
 * Volunteer Shift Management Component
 * Tracks volunteer shifts and scan statistics
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { DEFAULT_CHECKPOINTS } from "@/constants/checkpoints";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useLanguage } from "@/contexts/language-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Checkpoint, ScanLog } from "@/types";

const VOLUNTEER_STORAGE_KEY = "palitana_volunteer_info";

interface VolunteerInfo {
  name: string;
  checkpointId: number | null;
  shiftStartTime: string | null;
  scansThisShift: number;
}

interface VolunteerShiftProps {
  scanLogs: ScanLog[];
  currentCheckpoint: number;
}

export function VolunteerShift({ scanLogs, currentCheckpoint }: VolunteerShiftProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const [volunteerInfo, setVolunteerInfo] = useState<VolunteerInfo>({
    name: "",
    checkpointId: null,
    shiftStartTime: null,
    scansThisShift: 0,
  });
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [tempName, setTempName] = useState("");

  // Load volunteer info on mount
  useEffect(() => {
    loadVolunteerInfo();
  }, []);

  // Calculate scans this shift
  useEffect(() => {
    if (volunteerInfo.shiftStartTime && volunteerInfo.checkpointId) {
      const shiftStart = new Date(volunteerInfo.shiftStartTime);
      const scansThisShift = scanLogs.filter((log) => {
        const logTime = new Date(log.timestamp);
        return (
          log.checkpointId === volunteerInfo.checkpointId &&
          logTime >= shiftStart
        );
      }).length;
      
      setVolunteerInfo((prev) => ({ ...prev, scansThisShift }));
    }
  }, [scanLogs, volunteerInfo.shiftStartTime, volunteerInfo.checkpointId]);

  const loadVolunteerInfo = async () => {
    try {
      const stored = await AsyncStorage.getItem(VOLUNTEER_STORAGE_KEY);
      if (stored) {
        setVolunteerInfo(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load volunteer info:", error);
    }
  };

  const saveVolunteerInfo = async (info: VolunteerInfo) => {
    try {
      await AsyncStorage.setItem(VOLUNTEER_STORAGE_KEY, JSON.stringify(info));
      setVolunteerInfo(info);
    } catch (error) {
      console.error("Failed to save volunteer info:", error);
    }
  };

  const handleStartShift = () => {
    if (!volunteerInfo.name) {
      setShowSetupModal(true);
      return;
    }

    const newInfo: VolunteerInfo = {
      ...volunteerInfo,
      checkpointId: currentCheckpoint,
      shiftStartTime: new Date().toISOString(),
      scansThisShift: 0,
    };
    saveVolunteerInfo(newInfo);
  };

  const handleEndShift = () => {
    Alert.alert(
      "End Shift",
      `You scanned ${volunteerInfo.scansThisShift} pilgrims this shift. End shift now?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "End Shift",
          onPress: () => {
            const newInfo: VolunteerInfo = {
              ...volunteerInfo,
              checkpointId: null,
              shiftStartTime: null,
              scansThisShift: 0,
            };
            saveVolunteerInfo(newInfo);
          },
        },
      ]
    );
  };

  const handleSetName = () => {
    if (!tempName.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }
    const newInfo: VolunteerInfo = {
      ...volunteerInfo,
      name: tempName.trim(),
    };
    saveVolunteerInfo(newInfo);
    setShowSetupModal(false);
    setTempName("");
  };

  const formatShiftDuration = () => {
    if (!volunteerInfo.shiftStartTime) return "";
    const start = new Date(volunteerInfo.shiftStartTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const currentCp = DEFAULT_CHECKPOINTS.find(
    (cp: Checkpoint) => cp.id === volunteerInfo.checkpointId
  );

  const isOnShift = volunteerInfo.shiftStartTime !== null;

  return (
    <>
      <Animated.View entering={FadeIn} style={styles.container}>
        <View style={[styles.card, { backgroundColor: colors.card }, Shadows.sm]}>
          {/* Volunteer Header */}
          <View style={styles.header}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.primaryLight }]}>
              <IconSymbol name="person.fill" size={24} color={colors.primary} />
            </View>
            <View style={styles.headerInfo}>
              {volunteerInfo.name ? (
                <>
                  <ThemedText style={styles.volunteerName}>{volunteerInfo.name}</ThemedText>
                  <ThemedText style={[styles.volunteerRole, { color: colors.textSecondary }]}>
                    {t("volunteer_title")}
                  </ThemedText>
                </>
              ) : (
                <Pressable onPress={() => setShowSetupModal(true)}>
                  <ThemedText style={[styles.setupText, { color: colors.primary }]}>
                    {t("volunteer_set_name")} →
                  </ThemedText>
                </Pressable>
              )}
            </View>
            {isOnShift && (
              <View style={[styles.onShiftBadge, { backgroundColor: colors.success }]}>
                <View style={styles.pulsingDot} />
                <ThemedText style={styles.onShiftText}>ON SHIFT</ThemedText>
              </View>
            )}
          </View>

          {/* Shift Info */}
          {isOnShift && (
            <View style={[styles.shiftInfo, { borderTopColor: colors.border }]}>
              <View style={styles.shiftStat}>
                <ThemedText style={[styles.shiftLabel, { color: colors.textSecondary }]}>
                  {t("volunteer_checkpoint")}
                </ThemedText>
                <ThemedText style={styles.shiftValue}>
                  CP{volunteerInfo.checkpointId} - {currentCp?.description || "Unknown"}
                </ThemedText>
              </View>
              <View style={styles.shiftStats}>
                <View style={styles.shiftStatItem}>
                  <ThemedText style={styles.statNumber}>{volunteerInfo.scansThisShift}</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                    {t("volunteer_scans_today")}
                  </ThemedText>
                </View>
                <View style={styles.shiftStatItem}>
                  <ThemedText style={styles.statNumber}>{formatShiftDuration()}</ThemedText>
                  <ThemedText style={[styles.statLabel, { color: colors.textSecondary }]}>
                    Duration
                  </ThemedText>
                </View>
              </View>
            </View>
          )}

          {/* Action Button */}
          <Pressable
            style={[
              styles.actionButton,
              { backgroundColor: isOnShift ? colors.error : colors.success },
            ]}
            onPress={isOnShift ? handleEndShift : handleStartShift}
          >
            <IconSymbol
              name={isOnShift ? "stop.fill" : "play.fill"}
              size={18}
              color="#fff"
            />
            <ThemedText style={styles.actionButtonText}>
              {isOnShift ? "End Shift" : "Start Shift"}
            </ThemedText>
          </Pressable>
        </View>
      </Animated.View>

      {/* Setup Modal */}
      <Modal
        visible={showSetupModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSetupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={FadeInDown}
            style={[
              styles.modalContent,
              { backgroundColor: colors.background },
              { paddingBottom: Math.max(insets.bottom, 20) },
            ]}
          >
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>{t("volunteer_set_name")}</ThemedText>
              <Pressable onPress={() => setShowSetupModal(false)}>
                <IconSymbol name="xmark" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <TextInput
              style={[
                styles.nameInput,
                { backgroundColor: colors.backgroundSecondary, color: colors.text },
              ]}
              placeholder={t("volunteer_name")}
              placeholderTextColor={colors.textTertiary}
              value={tempName}
              onChangeText={setTempName}
              autoFocus
            />

            <Pressable
              style={[styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSetName}
            >
              <ThemedText style={styles.saveButtonText}>{t("save")}</ThemedText>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  card: {
    borderRadius: Radius.xl,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  volunteerName: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
  },
  volunteerRole: {
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  setupText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.medium,
  },
  onShiftBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 4,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  onShiftText: {
    color: "#fff",
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  shiftInfo: {
    padding: Spacing.lg,
    borderTopWidth: 1,
  },
  shiftStat: {
    marginBottom: Spacing.md,
  },
  shiftLabel: {
    fontSize: Typography.size.sm,
    marginBottom: 4,
  },
  shiftValue: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.medium,
  },
  shiftStats: {
    flexDirection: "row",
    gap: Spacing.xl,
  },
  shiftStatItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  statLabel: {
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    margin: Spacing.lg,
    marginTop: 0,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
  },
  nameInput: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    fontSize: Typography.size.md,
    marginBottom: Spacing.lg,
  },
  saveButton: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
});
