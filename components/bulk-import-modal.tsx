/**
 * Bulk Import Modal Component
 * Allows importing multiple participants from CSV/Excel files
 */

import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Pressable,
  KeyboardAvoidingView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import * as Sharing from "expo-sharing";
import { Paths, File } from "expo-file-system";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "@/contexts/language-context";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { ThemedText } from "@/components/themed-text";
import {
  pickImportFile,
  parseImportFile,
  validateImportData,
  importParticipants,
  generateSampleCSV,
  ImportPreview,
  ImportResult,
} from "@/services/bulk-import";
import { Participant } from "@/types";

interface BulkImportModalProps {
  visible: boolean;
  onClose: () => void;
  onImportComplete: (participants: Participant[]) => void;
  existingParticipants: Participant[];
}

type ImportStep = "select" | "preview" | "importing" | "complete";

export function BulkImportModal({
  visible,
  onClose,
  onImportComplete,
  existingParticipants,
}: BulkImportModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];
  const { t } = useLanguage();
  
  const [step, setStep] = useState<ImportStep>("select");
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string>("");

  const resetState = useCallback(() => {
    setStep("select");
    setSelectedFileName("");
    setPreview(null);
    setResult(null);
    setError("");
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const handleSelectFile = async () => {
    try {
      setError("");
      const fileResult = await pickImportFile();
      
      if (!fileResult) {
        return; // User cancelled
      }
      
      setSelectedFileName(fileResult.name);
      
      const rawData = await parseImportFile(fileResult.uri, fileResult.name);
      if (!rawData) {
        setError("Failed to parse file. Please check the format.");
        return;
      }
      const existingMobiles = existingParticipants.map(p => p.mobile);
      const validationResult = validateImportData(rawData.headers, rawData.rows, existingMobiles);
      
      setPreview(validationResult);
      setStep("preview");
    } catch (err) {
      console.error("[BulkImport] Error selecting file:", err);
      setError("Failed to read file. Please try again.");
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const csvContent = generateSampleCSV();
      const templateFileName = `pilgrim_import_template.csv`;
      
      // Create file in cache directory
      const cacheDir = Paths.cache;
      const filePath = `${cacheDir}/${templateFileName}`;
      const file = new File(filePath);
      await file.create();
      await file.write(csvContent);
      
      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: "text/csv",
          dialogTitle: "Download Template CSV",
        });
      }
    } catch (err) {
      console.error("[BulkImport] Error downloading template:", err);
      setError("Failed to download template.");
    }
  };

  const handleImport = async () => {
    if (!preview || preview.validRows.length === 0) return;
    
    setStep("importing");
    
    try {
      const existingIds = existingParticipants.map(p => p.id);
      const importResult = await importParticipants(preview.validRows, existingIds);
      
      setResult(importResult);
      setStep("complete");
      
      if (importResult.participants.length > 0) {
        onImportComplete(importResult.participants);
      }
    } catch (err) {
      console.error("[BulkImport] Import error:", err);
      setError("Import failed. Please try again.");
      setStep("preview");
    }
  };

  const renderSelectStep = () => (
    <View style={styles.stepContainer}>
      <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
        <MaterialIcons name="upload-file" size={64} color={colors.primary} />
      </View>
      
      <ThemedText style={[styles.title, { color: colors.text }]}>{t("bulk_import_title")}</ThemedText>
      <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>{t("bulk_import_supported_formats")}</ThemedText>
      
      <TouchableOpacity 
        style={[styles.primaryButton, { backgroundColor: colors.primary }]} 
        onPress={handleSelectFile}
      >
        <MaterialIcons name="folder-open" size={24} color="#fff" />
        <ThemedText style={styles.primaryButtonText}>{t("bulk_import_select_file")}</ThemedText>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.secondaryButton, { borderColor: colors.primary }]} 
        onPress={handleDownloadTemplate}
      >
        <MaterialIcons name="download" size={20} color={colors.primary} />
        <ThemedText style={[styles.secondaryButtonText, { color: colors.primary }]}>{t("bulk_import_download_template")}</ThemedText>
      </TouchableOpacity>
      
      {error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={20} color="#dc2626" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      ) : null}
    </View>
  );

  const renderPreviewStep = () => {
    if (!preview) return null;
    
    return (
      <View style={styles.stepContainer}>
        <ThemedText style={[styles.title, { color: colors.text }]}>{t("bulk_import_preview")}</ThemedText>
        {selectedFileName ? (
          <ThemedText style={[styles.fileNameText, { color: colors.textSecondary }]}>
            File: {selectedFileName}
          </ThemedText>
        ) : null}
        
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: "#dcfce7" }]}>
            <ThemedText style={[styles.statNumber, { color: "#16a34a" }]}>{preview.validRows.length}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: "#16a34a" }]}>{t("bulk_import_valid_rows")}</ThemedText>
          </View>
          <View style={[styles.statBox, { backgroundColor: "#fef3c7" }]}>
            <ThemedText style={[styles.statNumber, { color: "#d97706" }]}>{preview.duplicates.length}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: "#d97706" }]}>{t("bulk_import_duplicates")}</ThemedText>
          </View>
          <View style={[styles.statBox, { backgroundColor: "#fee2e2" }]}>
            <ThemedText style={[styles.statNumber, { color: "#dc2626" }]}>{preview.errors.length}</ThemedText>
            <ThemedText style={[styles.statLabel, { color: "#dc2626" }]}>{t("bulk_import_errors")}</ThemedText>
          </View>
        </View>
        
        {preview.errors.length > 0 && (
          <View style={styles.errorList}>
            <ThemedText style={[styles.errorListTitle, { color: colors.text }]}>Errors:</ThemedText>
            {preview.errors.slice(0, 5).map((err, i) => (
              <ThemedText key={i} style={styles.errorItem}>
                Row {err.row}: {err.message}
              </ThemedText>
            ))}
            {preview.errors.length > 5 && (
              <ThemedText style={styles.errorItem}>
                ...and {preview.errors.length - 5} more errors
              </ThemedText>
            )}
          </View>
        )}
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.secondaryButton, { borderColor: colors.border, flex: 1 }]} 
            onPress={handleClose}
          >
            <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>{t("cancel")}</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.primaryButton, 
              { backgroundColor: colors.primary, flex: 1 },
              preview.validRows.length === 0 && { opacity: 0.5 }
            ]} 
            onPress={handleImport}
            disabled={preview.validRows.length === 0}
          >
            <ThemedText style={styles.primaryButtonText}>{t("bulk_import_now")}</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderImportingStep = () => (
    <View style={styles.stepContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <ThemedText style={[styles.title, { color: colors.text, marginTop: 16 }]}>{t("bulk_import_importing")}</ThemedText>
    </View>
  );

  const renderCompleteStep = () => {
    if (!result) return null;
    
    return (
      <View style={styles.stepContainer}>
        <View style={[styles.iconContainer, { backgroundColor: "#dcfce7" }]}>
          <MaterialIcons name="check-circle" size={64} color="#16a34a" />
        </View>
        
        <ThemedText style={[styles.title, { color: colors.text }]}>{t("bulk_import_complete")}</ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          {`${result.participants.length} ${t("bulk_import_pilgrims_imported")}`}
        </ThemedText>
        
        <TouchableOpacity 
          style={[styles.primaryButton, { backgroundColor: colors.primary }]} 
          onPress={handleClose}
        >
          <ThemedText style={styles.primaryButtonText}>{t("done")}</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View
            style={[
              styles.modalContainer,
              {
                paddingBottom: insets.bottom + Spacing.base,
                backgroundColor: colors.background,
                borderTopLeftRadius: Radius["2xl"],
                borderTopRightRadius: Radius["2xl"],
              },
            ]}
          >
            {/* Handle bar */}
            <View style={styles.handleContainer}>
              <View style={[styles.handle, { backgroundColor: colors.border }]} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <ThemedText style={[styles.headerTitle, { color: colors.text }]}>
                {t("bulk_import_title")}
              </ThemedText>
              <Pressable onPress={handleClose} style={styles.closeButton}>
                <ThemedText style={[styles.closeText, { color: colors.textSecondary }]}>
                  ✕
                </ThemedText>
              </Pressable>
            </View>

            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {step === "select" && renderSelectStep()}
              {step === "preview" && renderPreviewStep()}
              {step === "importing" && renderImportingStep()}
              {step === "complete" && renderCompleteStep()}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  keyboardView: {
    justifyContent: "flex-end",
  },
  modalContainer: {
    maxHeight: "90%",
    ...Shadows.lg,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerTitle: {
    fontSize: Typography.size.lg,
    fontWeight: "600",
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  stepContainer: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: "bold",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: Typography.size.base,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  fileNameText: {
    fontSize: Typography.size.sm,
    textAlign: "center",
    marginBottom: Spacing.base,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: Radius.lg,
    marginBottom: Spacing.base,
    gap: 8,
    width: "100%",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: Typography.size.base,
    fontWeight: "600",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 8,
    width: "100%",
  },
  secondaryButtonText: {
    fontSize: Typography.size.base,
    fontWeight: "500",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: Spacing.base,
    padding: Spacing.base,
    backgroundColor: "#fee2e2",
    borderRadius: Radius.md,
  },
  errorText: {
    color: "#dc2626",
    fontSize: Typography.size.sm,
  },
  statsRow: {
    flexDirection: "row",
    gap: Spacing.base,
    marginBottom: Spacing.lg,
    width: "100%",
  },
  statBox: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.base,
    borderRadius: Radius.md,
  },
  statNumber: {
    fontSize: Typography.size["2xl"],
    fontWeight: "bold",
  },
  statLabel: {
    fontSize: Typography.size.sm,
  },
  errorList: {
    width: "100%",
    marginBottom: Spacing.lg,
  },
  errorListTitle: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  errorItem: {
    color: "#dc2626",
    fontSize: Typography.size.sm,
    marginBottom: 4,
  },
  buttonRow: {
    flexDirection: "row",
    gap: Spacing.base,
    width: "100%",
  },
});
