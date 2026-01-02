/**
 * Add Participant Modal
 * Form to add new participants with auto-generated QR codes
 */

import * as Haptics from "expo-haptics";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedButton } from "@/components/animated-button";
import { ThemedText } from "@/components/themed-text";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Participant } from "@/types";
import { generateParticipantId, generateQRToken } from "@/utils/qr-token";

interface AddParticipantModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (participant: Participant) => void;
  existingIds: string[];
  groupOptions?: string[];
}

export function AddParticipantModal({
  visible,
  onClose,
  onAdd,
  existingIds,
}: AddParticipantModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");

  const [emergencyContact, setEmergencyContact] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName("");
    setMobile("");

    setEmergencyContact("");
    setNotes("");
  };

  const validateForm = (): string | null => {
    if (!name.trim()) {
      return "Please enter participant name";
    }
    if (!mobile.trim()) {
      return "Please enter mobile number";
    }
    if (!/^[6-9]\d{9}$/.test(mobile.replace(/\D/g, ""))) {
      return "Please enter a valid 10-digit Indian mobile number";
    }
    return null;
  };

  const handleAdd = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert("Validation Error", error);
      return;
    }

    setLoading(true);
    try {
      const id = await generateParticipantId(existingIds);
      const qrToken = await generateQRToken();

      const newParticipant: Participant = {
        id,
        name: name.trim(),
        mobile: mobile.replace(/\D/g, ""),
        qrToken,
        createdAt: new Date().toISOString(),
  
        emergencyContact: emergencyContact.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onAdd(newParticipant);
      resetForm();
      onClose();
    } catch {
      Alert.alert("Error", "Failed to create participant. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.5)" }]}
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              paddingBottom: insets.bottom + Spacing.base,
              backgroundColor: colors.background,
              borderTopLeftRadius: Radius["2xl"],
              borderTopRightRadius: Radius["2xl"],
            },
          ]}
          entering={SlideInDown.springify().damping(15)}
          exiting={SlideOutDown.springify().damping(15)}
        >
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={[styles.title, { color: colors.text }]}>
              Add New Pilgrim
            </ThemedText>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <ThemedText style={[styles.closeText, { color: colors.textSecondary }]}>
                ✕
              </ThemedText>
            </Pressable>
          </View>

          {/* Form Content - Using View instead of ScrollView for reliability */}
          <ScrollView 
            style={styles.formContainer}
            contentContainerStyle={styles.formContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                Full Name *
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Enter pilgrim's full name"
                placeholderTextColor={colors.textTertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            {/* Mobile Input */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                Mobile Number *
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="10-digit mobile number"
                placeholderTextColor={colors.textTertiary}
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>


            {/* Emergency Contact */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                Emergency Contact (Optional)
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Emergency contact number"
                placeholderTextColor={colors.textTertiary}
                value={emergencyContact}
                onChangeText={setEmergencyContact}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <ThemedText style={[styles.label, { color: colors.textSecondary }]}>
                Notes (Optional)
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Any special requirements or notes"
                placeholderTextColor={colors.textTertiary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Info Text */}
            <View style={[styles.infoCard, { backgroundColor: colors.primaryLight }]}>
              <ThemedText style={[styles.infoText, { color: colors.primary }]}>
                ✨ A unique QR code will be automatically generated for this pilgrim
              </ThemedText>
            </View>
          </ScrollView>

          {/* Actions - Fixed at bottom */}
          <View style={styles.actions}>
            <AnimatedButton
              title="Cancel"
              variant="outline"
              onPress={handleClose}
              style={styles.cancelButton}
            />
            <AnimatedButton
              title="Add Pilgrim"
              variant="primary"
              onPress={handleAdd}
              loading={loading}
              style={styles.addButton}
            />
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContainer: {
    maxHeight: "85%",
    ...Shadows.xl,
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.base,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  closeText: {
    fontSize: Typography.size.xl,
  },
  formContainer: {
    flexGrow: 1,
    flexShrink: 1,
  },
  formContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.base,
  },
  inputGroup: {
    marginBottom: Spacing.base,
  },
  label: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
    marginBottom: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Platform.OS === "ios" ? Spacing.md : Spacing.sm,
    fontSize: Typography.size.md,
    minHeight: 48,
  },
  textArea: {
    minHeight: 80,
    paddingTop: Spacing.md,
  },
  infoCard: {
    padding: Spacing.base,
    borderRadius: Radius.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.base,
  },
  infoText: {
    fontSize: Typography.size.sm,
    textAlign: "center",
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.base,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  addButton: {
    flex: 2,
  },
});
