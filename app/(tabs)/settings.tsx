import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LanguageToggle } from "@/components/language-toggle";
import { ThemedText } from "@/components/themed-text";
import { useLanguage } from "@/contexts/language-context";
import { ThemedView } from "@/components/themed-view";
import { IconSymbol } from "@/components/ui/icon-symbol";

import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useNetwork } from "@/hooks/use-network";
import {
  clearSyncQueue,
  getSyncQueue,
  useScanLogs,
  useSettings,
} from "@/hooks/use-storage";
import { useUnifiedData } from "@/hooks/use-unified-data";
import { trpc } from "@/lib/trpc";

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const network = useNetwork();
  const { t } = useLanguage();

  const { settings, updateSettings } = useSettings();
  const { participants } = useUnifiedData();
  const { scanLogs, markAsSynced, getUnsyncedLogs, clearAll: clearScanLogs } = useScanLogs();
  
  // tRPC utilities for refreshing data
  const utils = trpc.useUtils();

  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSheetsConfig, setShowSheetsConfig] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [sheetsId, setSheetsId] = useState(settings.googleSheetsId || "");

  const isOnline = network.isConnected && network.isInternetReachable !== false;

  const loadPendingCount = useCallback(async () => {
    const queue = await getSyncQueue();
    setPendingCount(queue.length);
  }, []);

  useEffect(() => {
    loadPendingCount();
    const interval = setInterval(loadPendingCount, 5000);
    return () => clearInterval(interval);
  }, [loadPendingCount]);

  const handleSync = async () => {
    if (!isOnline) {
      Alert.alert("Offline", "Please connect to the internet to sync data.");
      return;
    }

    if (!settings.googleSheetsId) {
      Alert.alert(
        "Configuration Required",
        "Please configure your Google Sheets ID first.",
        [{ text: "Configure", onPress: () => setShowSheetsConfig(true) }, { text: "Cancel" }]
      );
      return;
    }

    setIsSyncing(true);
    try {
      const queue = await getSyncQueue();
      const unsyncedLogs = getUnsyncedLogs();

      if (queue.length === 0 && unsyncedLogs.length === 0) {
        Alert.alert("Up to Date", "All data is already synced.");
        setIsSyncing(false);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const logIds = unsyncedLogs.map((log) => log.id);
      await markAsSynced(logIds);

      const queueIds = queue.map((item) => item.id);
      await clearSyncQueue(queueIds);

      await updateSettings({ lastSyncTime: new Date().toISOString() });
      await loadPendingCount();

      Alert.alert("Success", `Synced ${queue.length} items to Google Sheets.`);
    } catch (error) {
      console.error("Sync error:", error);
      Alert.alert("Sync Failed", "Please try again later.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveSheetsConfig = async () => {
    if (!sheetsId.trim()) {
      Alert.alert("Error", "Please enter a valid Google Sheets ID.");
      return;
    }

    await updateSettings({ googleSheetsId: sheetsId.trim() });
    setShowSheetsConfig(false);
    Alert.alert("Success", "Google Sheets configuration saved.");
  };

  const copyDeviceId = async () => {
    await Clipboard.setStringAsync(settings.deviceId);
    Alert.alert("Copied", "Device ID copied to clipboard.");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const doClearAllData = async () => {
    try {
      // Clear local scan logs cache ONLY (does NOT affect database or Google Sheets)
      await clearScanLogs();
      
      // Clear sync queue from AsyncStorage
      const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
      
      // Clear all local storage keys (local device only)
      await AsyncStorage.multiRemove([
        "palitana_sync_queue",
        "palitana_pending_scans",
        "palitana_local_scans",
        "palitana_last_sync",
        "palitana_scan_logs",
        "palitana_settings",
        "palitana_participants",
      ]);
      
      // Reset pending count
      setPendingCount(0);
      
      // Invalidate the cache to refresh data from server
      utils.scanLogs.list.invalidate();
      utils.participants.list.invalidate();
      utils.sync.fullSync.invalidate();
      
      // Show success message
      if (Platform.OS === "web") {
        window.alert("Local data cleared! App will sync fresh data from server.");
      } else {
        Alert.alert("Success", "Local data cleared! App will sync fresh data from server.", [{ text: "OK" }]);
      }
    } catch (error) {
      console.error("Failed to clear data:", error);
      if (Platform.OS === "web") {
        window.alert("Failed to clear data. Please try again.");
      } else {
        Alert.alert("Error", "Failed to clear data. Please try again.");
      }
    }
  };

  const clearAllData = () => {
    // Show custom modal for confirmation (works on both web and mobile)
    setShowClearConfirm(true);
  };

  const confirmClearAllData = async () => {
    setShowClearConfirm(false);
    await doClearAllData();
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
          <ThemedText style={styles.headerTitle}>{t("settings_title")}</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {t("settings_title")}
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
        {/* Connection Status Card */}
        <Animated.View
          entering={FadeInUp.delay(200)}
          style={[styles.statusCard, { backgroundColor: colors.card }, Shadows.sm]}
        >
          <View style={styles.statusHeader}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: isOnline ? colors.successLight : colors.errorLight },
              ]}
            >
              <IconSymbol
                name={isOnline ? "wifi" : "wifi.slash"}
                size={20}
                color={isOnline ? colors.success : colors.error}
              />
            </View>
            <View style={styles.statusInfo}>
              <ThemedText style={styles.statusTitle}>
                {isOnline ? t("settings_title") === "Settings" ? "Connected" : "कनेक्टेड" : t("settings_title") === "Settings" ? "Offline" : "ऑफलाइन"}
              </ThemedText>
              <ThemedText style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
                Last sync: {formatDate(settings.lastSyncTime)}
              </ThemedText>
            </View>
            <View style={[styles.pendingBadge, { backgroundColor: colors.backgroundSecondary }]}>
              <ThemedText style={[styles.pendingText, { color: colors.textSecondary }]}>
                {pendingCount} pending
              </ThemedText>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.syncButton,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              (isSyncing || !isOnline) && { opacity: 0.6 },
            ]}
            onPress={handleSync}
            disabled={isSyncing || !isOnline}
          >
            {isSyncing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <IconSymbol name="arrow.clockwise" size={18} color="#FFFFFF" />
                <ThemedText style={styles.syncButtonText}>{t("settings_sync")}</ThemedText>
              </>
            )}
          </Pressable>
        </Animated.View>

        {/* Language Section */}
        <Animated.View entering={FadeIn.delay(250)}>
          <ThemedText style={styles.sectionLabel}>{t("settings_language")} / ભાષા</ThemedText>
          <View style={[styles.settingsCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <View style={styles.languageSection}>
              <LanguageToggle showLabel={false} />
            </View>
          </View>
        </Animated.View>

        {/* Settings Sections */}
        <Animated.View entering={FadeIn.delay(300)}>
          <ThemedText style={styles.sectionLabel}>{t("settings_sync")}</ThemedText>
          <View style={[styles.settingsCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.primaryLight }]}>
                  <IconSymbol name="arrow.clockwise" size={18} color={colors.primary} />
                </View>
                <View>
                  <ThemedText style={styles.settingTitle}>{t("settings_auto_sync")}</ThemedText>
                  <ThemedText style={[styles.settingDesc, { color: colors.textTertiary }]}>
                    {t("settings_auto_sync_desc")}
                  </ThemedText>
                </View>
              </View>
              <Switch
                value={settings.autoSync}
                onValueChange={(value) => updateSettings({ autoSync: value })}
                trackColor={{ false: colors.backgroundSecondary, true: colors.primary + "80" }}
                thumbColor={settings.autoSync ? colors.primary : colors.textTertiary}
              />
            </View>

            <Pressable
              style={styles.settingRow}
              onPress={() => setShowSheetsConfig(true)}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.successLight }]}>
                  <IconSymbol name="doc.text" size={18} color={colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.settingTitle}>{t("settings_google_sheets")}</ThemedText>
                  <ThemedText
                    style={[styles.settingDesc, { color: colors.textTertiary }]}
                    numberOfLines={1}
                  >
                    {settings.googleSheetsId || t("settings_not_configured")}
                  </ThemedText>
                </View>
              </View>
              <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(400)}>
          <ThemedText style={styles.sectionLabel}>{t("settings_participants")}</ThemedText>
          <View style={[styles.settingsCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <View style={styles.participantStats}>
              <View style={styles.participantStat}>
                <ThemedText style={styles.participantStatValue}>{participants.length}</ThemedText>
                <ThemedText style={[styles.participantStatLabel, { color: colors.textSecondary }]}>
                  {t("settings_registered")}
                </ThemedText>
              </View>
              <View style={styles.participantStat}>
                <ThemedText style={styles.participantStatValue}>{scanLogs.length}</ThemedText>
                <ThemedText style={[styles.participantStatLabel, { color: colors.textSecondary }]}>
                  {t("settings_total_scans")}
                </ThemedText>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(500)}>
          <ThemedText style={styles.sectionLabel}>{t("settings_device")}</ThemedText>
          <View style={[styles.settingsCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <Pressable style={styles.settingRow} onPress={copyDeviceId}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: colors.backgroundSecondary }]}>
                  <IconSymbol name="iphone" size={18} color={colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText style={styles.settingTitle}>{t("settings_device_id")}</ThemedText>
                  <ThemedText
                    style={[styles.settingDesc, { color: colors.textTertiary }]}
                    numberOfLines={1}
                  >
                    {settings.deviceId}
                  </ThemedText>
                </View>
              </View>
              <IconSymbol name="doc.on.doc" size={16} color={colors.textTertiary} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(600)}>
          <ThemedText style={styles.sectionLabel}>{t("settings_danger_zone")}</ThemedText>
          <View style={[styles.settingsCard, { backgroundColor: colors.card }, Shadows.sm]}>
            <Pressable
              testID="clear-all-data-button"
              style={({ pressed }) => [
                styles.dangerButton,
                { borderColor: colors.error },
                pressed && { backgroundColor: colors.errorLight },
              ]}
              onPress={clearAllData}
            >
              <IconSymbol name="trash.fill" size={18} color={colors.error} />
              <ThemedText style={[styles.dangerButtonText, { color: colors.error }]}>
                {t("settings_clear_all_data")}
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Google Sheets Config Modal */}
      <Modal visible={showSheetsConfig} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>Google Sheets</ThemedText>
              <Pressable onPress={() => setShowSheetsConfig(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={colors.textTertiary} />
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Spreadsheet ID
              </ThemedText>
              <TextInput
                style={[styles.input, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}
                placeholder="Enter Google Sheets ID"
                placeholderTextColor={colors.textTertiary}
                value={sheetsId}
                onChangeText={setSheetsId}
                autoCapitalize="none"
              />
              <ThemedText style={[styles.inputHint, { color: colors.textTertiary }]}>
                Find this in your Google Sheets URL between /d/ and /edit
              </ThemedText>
            </View>

            <Pressable
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={handleSaveSheetsConfig}
            >
              <ThemedText style={styles.modalButtonText}>Save Configuration</ThemedText>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Clear Data Confirmation Modal */}
      <Modal visible={showClearConfirm} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, maxWidth: 340 }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={[styles.modalTitle, { color: colors.error }]}>Clear All Data</ThemedText>
              <Pressable onPress={() => setShowClearConfirm(false)}>
                <IconSymbol name="xmark.circle.fill" size={28} color={colors.textTertiary} />
              </Pressable>
            </View>
            <ThemedText style={{ marginBottom: Spacing.lg, lineHeight: 22 }}>
              This will clear local data on this device only. Your scan data in the database and Google Sheets will NOT be affected. The app will sync fresh data from the server.
            </ThemedText>
            <View style={{ flexDirection: "row", gap: Spacing.md }}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.backgroundSecondary, flex: 1 }]}
                onPress={() => setShowClearConfirm(false)}
              >
                <ThemedText style={[styles.modalButtonText, { color: colors.text }]}>Cancel</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.error, flex: 1 }]}
                onPress={confirmClearAllData}
              >
                <ThemedText style={styles.modalButtonText}>Clear All</ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  statusCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  statusIndicator: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statusInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  statusTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  statusSubtitle: {
    fontSize: Typography.size.xs,
    marginTop: 2,
  },
  pendingBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  pendingText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  syncButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  syncButtonText: {
    color: "#FFFFFF",
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  sectionLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.semibold,
    color: "#888",
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingsCard: {
    borderRadius: Radius.xl,
    marginBottom: Spacing.xl,
    overflow: "hidden",
  },
  languageSection: {
    padding: Spacing.lg,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  settingTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.medium,
  },
  settingDesc: {
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  participantStats: {
    flexDirection: "row",
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  participantStat: {
    flex: 1,
    alignItems: "center",
  },
  participantStatValue: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  participantStatLabel: {
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  dangerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    gap: Spacing.sm,
  },
  dangerButtonText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: Radius["2xl"],
    borderTopRightRadius: Radius["2xl"],
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing.sm,
  },
  input: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    fontSize: Typography.size.md,
  },
  inputHint: {
    fontSize: Typography.size.xs,
    marginTop: Spacing.sm,
  },
  modalButton: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
});
