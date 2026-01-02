/**
 * Google Sheets Setup Wizard
 * Step-by-step guide to connect the app with Google Sheets
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Linking,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Colors, Spacing, Radius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { googleSheetsAPI, GoogleSheetsConfig } from "@/services/google-sheets-api";

interface GoogleSheetsWizardProps {
  visible: boolean;
  onClose: () => void;
  onConnected: (config: GoogleSheetsConfig) => void;
}

type WizardStep = "intro" | "create" | "configure" | "apikey" | "connect" | "success";

export function GoogleSheetsWizard({ visible, onClose, onConnected }: GoogleSheetsWizardProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [step, setStep] = useState<WizardStep>("intro");
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [spreadsheetTitle, setSpreadsheetTitle] = useState("");

  useEffect(() => {
    if (visible) {
      setStep("intro");
      setError(null);
      // Load existing config if any
      const config = googleSheetsAPI.getConfig();
      if (config) {
        setSpreadsheetId(config.spreadsheetId);
        setApiKey(config.apiKey);
      }
    }
  }, [visible]);

  const handleTestConnection = async () => {
    if (!spreadsheetId.trim()) {
      setError("Please enter a Spreadsheet ID");
      return;
    }
    if (!apiKey.trim()) {
      setError("Please enter an API Key");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await googleSheetsAPI.testConnection(spreadsheetId.trim(), apiKey.trim());
      
      if (result.success) {
        setSpreadsheetTitle(result.title || "");
        
        // Save config
        const config: GoogleSheetsConfig = {
          spreadsheetId: spreadsheetId.trim(),
          apiKey: apiKey.trim(),
          isConnected: true,
          lastSyncTime: null,
          sheetsSetup: {
            participants: false,
            scanLogs: false,
            checkpoints: false,
          },
        };
        
        await googleSheetsAPI.saveConfig(config);
        
        // Setup sheets
        const setupResult = await googleSheetsAPI.setupSheets();
        if (!setupResult.success) {
          setError(setupResult.message);
          setIsLoading(false);
          return;
        }

        setStep("success");
        onConnected(config);
      } else {
        setError(result.error || "Failed to connect");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenConsole = async () => {
    const consoleUrl = "https://console.cloud.google.com/apis/credentials";
    if (Platform.OS === "web") {
      window.open(consoleUrl, "_blank");
    } else {
      await Linking.openURL(consoleUrl);
    }
  };

  const handlePasteSpreadsheetId = async () => {
    const text = await Clipboard.getStringAsync();
    // Extract spreadsheet ID from URL if pasted
    const match = text.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      setSpreadsheetId(match[1]);
    } else {
      setSpreadsheetId(text);
    }
  };

  if (!visible) return null;

  const renderStep = () => {
    switch (step) {
      case "intro":
        return (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContent}>
            <View style={[styles.iconCircle, { backgroundColor: colors.primary + "20" }]}>
              <MaterialIcons name="cloud-sync" size={48} color={colors.primary} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Connect to Google Sheets
            </Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Sync your pilgrim data and scan logs with Google Sheets for centralized management across all volunteer devices.
            </Text>
            
            <View style={styles.featureList}>
              {[
                "Real-time sync across all devices",
                "Prevent duplicate scans",
                "Backup data to the cloud",
                "View reports in Google Sheets",
              ].map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <MaterialIcons name="check-circle" size={20} color={colors.success} />
                  <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
                </View>
              ))}
            </View>

            <Pressable
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => setStep("create")}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#fff" />
            </Pressable>
          </Animated.View>
        );

      case "create":
        return (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepBadgeText}>Step 1</Text>
              </View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Create Your Spreadsheet
              </Text>
            </View>
            
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Create a new Google Spreadsheet with three sheets named exactly:
            </Text>

            <View style={[styles.codeBlock, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.codeText, { color: colors.text }]}>• Participants</Text>
              <Text style={[styles.codeText, { color: colors.text }]}>• ScanLogs</Text>
              <Text style={[styles.codeText, { color: colors.text }]}>• Checkpoints</Text>
            </View>

            <Text style={[styles.stepDescription, { color: colors.textSecondary, marginTop: 16 }]}>
              Add these headers to the Participants sheet (Row 1):
            </Text>
            <View style={[styles.codeBlock, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.codeText, { color: colors.text }]}>id | name | mobile | qr_token | created_at</Text>
            </View>

            <Text style={[styles.stepDescription, { color: colors.textSecondary, marginTop: 16 }]}>
              Add these headers to the ScanLogs sheet (Row 1):
            </Text>
            <View style={[styles.codeBlock, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.codeText, { color: colors.text }]}>id | participant_id | checkpoint_id | timestamp | device_id | synced</Text>
            </View>

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => setStep("intro")}
              >
                <MaterialIcons name="arrow-back" size={20} color={colors.text} />
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Back</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryButton, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={() => setStep("configure")}
              >
                <Text style={styles.primaryButtonText}>Next</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#fff" />
              </Pressable>
            </View>
          </Animated.View>
        );

      case "configure":
        return (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepBadgeText}>Step 2</Text>
              </View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Get Spreadsheet ID
              </Text>
            </View>
            
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Open your Google Spreadsheet and copy the ID from the URL:
            </Text>

            <View style={[styles.codeBlock, { backgroundColor: colors.backgroundSecondary }]}>
              <Text style={[styles.codeText, { color: colors.textSecondary }]}>
                docs.google.com/spreadsheets/d/
              </Text>
              <Text style={[styles.codeText, { color: colors.primary, fontWeight: "bold" }]}>
                YOUR_SPREADSHEET_ID
              </Text>
              <Text style={[styles.codeText, { color: colors.textSecondary }]}>
                /edit
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Spreadsheet ID</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: colors.backgroundSecondary,
                      color: colors.text,
                      borderColor: colors.border,
                    }
                  ]}
                  value={spreadsheetId}
                  onChangeText={setSpreadsheetId}
                  placeholder="Paste spreadsheet ID or URL"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Pressable
                  style={[styles.pasteButton, { backgroundColor: colors.primary }]}
                  onPress={handlePasteSpreadsheetId}
                >
                  <MaterialIcons name="content-paste" size={20} color="#fff" />
                </Pressable>
              </View>
            </View>

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => setStep("create")}
              >
                <MaterialIcons name="arrow-back" size={20} color={colors.text} />
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Back</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.primaryButton, 
                  { backgroundColor: spreadsheetId ? colors.primary : colors.textSecondary, flex: 1 }
                ]}
                onPress={() => setStep("apikey")}
                disabled={!spreadsheetId}
              >
                <Text style={styles.primaryButtonText}>Next</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#fff" />
              </Pressable>
            </View>
          </Animated.View>
        );

      case "apikey":
        return (
          <Animated.View entering={FadeInDown.duration(300)} style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepBadgeText}>Step 3</Text>
              </View>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Get API Key
              </Text>
            </View>
            
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              You need a Google Cloud API key to access your spreadsheet. Follow these steps:
            </Text>

            <View style={styles.instructionList}>
              <Text style={[styles.instructionItem, { color: colors.text }]}>
                1. Go to Google Cloud Console
              </Text>
              <Text style={[styles.instructionItem, { color: colors.text }]}>
                2. Create a new project (or select existing)
              </Text>
              <Text style={[styles.instructionItem, { color: colors.text }]}>
                3. Enable &quot;Google Sheets API&quot;
              </Text>
              <Text style={[styles.instructionItem, { color: colors.text }]}>
                4. Go to Credentials → Create API Key
              </Text>
              <Text style={[styles.instructionItem, { color: colors.text }]}>
                5. Copy the API key and paste below
              </Text>
            </View>

            <Pressable
              style={[styles.linkButton, { borderColor: colors.primary }]}
              onPress={handleOpenConsole}
            >
              <MaterialIcons name="open-in-new" size={20} color={colors.primary} />
              <Text style={[styles.linkButtonText, { color: colors.primary }]}>
                Open Google Cloud Console
              </Text>
            </Pressable>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>API Key</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.text,
                    borderColor: colors.border,
                  }
                ]}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="Paste your API key"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </View>

            {error && (
              <View style={[styles.errorBox, { backgroundColor: colors.error + "20" }]}>
                <MaterialIcons name="error" size={20} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            <View style={styles.buttonRow}>
              <Pressable
                style={[styles.secondaryButton, { borderColor: colors.border }]}
                onPress={() => setStep("configure")}
              >
                <MaterialIcons name="arrow-back" size={20} color={colors.text} />
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Back</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.primaryButton, 
                  { backgroundColor: apiKey ? colors.primary : colors.textSecondary, flex: 1 }
                ]}
                onPress={handleTestConnection}
                disabled={!apiKey || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>Connect</Text>
                    <MaterialIcons name="link" size={20} color="#fff" />
                  </>
                )}
              </Pressable>
            </View>
          </Animated.View>
        );

      case "success":
        return (
          <Animated.View entering={FadeInUp.duration(300)} style={styles.stepContent}>
            <View style={[styles.successCircle, { backgroundColor: colors.success + "20" }]}>
              <MaterialIcons name="check-circle" size={64} color={colors.success} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Connected Successfully!
            </Text>
            <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
              Your app is now connected to &quot;{spreadsheetTitle || "Google Sheets"}&quot;. 
              All scan logs will be synced automatically.
            </Text>

            <View style={[styles.infoBox, { backgroundColor: colors.primary + "10" }]}>
              <MaterialIcons name="info" size={20} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.text }]}>
                Make sure to share your spreadsheet with volunteers who need to view the data.
              </Text>
            </View>

            <Pressable
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={onClose}
            >
              <Text style={styles.primaryButtonText}>Done</Text>
              <MaterialIcons name="check" size={20} color="#fff" />
            </Pressable>
          </Animated.View>
        );
    }
  };

  return (
    <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}>
      <Animated.View 
        entering={FadeInUp.duration(300)}
        style={[
          styles.modal,
          { 
            backgroundColor: colors.background,
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom, 20),
          }
        ]}
      >
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderStep()}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-end",
    zIndex: 1000,
  },
  modal: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    maxHeight: "90%",
    minHeight: "60%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  stepContent: {
    alignItems: "center",
  },
  stepHeader: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  stepBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  stepBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  stepDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  featureList: {
    width: "100%",
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  featureText: {
    fontSize: 16,
  },
  codeBlock: {
    width: "100%",
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
  },
  codeText: {
    fontFamily: "monospace",
    fontSize: 14,
    lineHeight: 22,
  },
  instructionList: {
    width: "100%",
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  instructionItem: {
    fontSize: 15,
    lineHeight: 28,
  },
  inputContainer: {
    width: "100%",
    marginTop: Spacing.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  inputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  pasteButton: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%",
    marginTop: Spacing.xl,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    minWidth: 120,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: 1,
    width: "100%",
    marginTop: Spacing.md,
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    width: "100%",
    marginTop: Spacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    width: "100%",
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
