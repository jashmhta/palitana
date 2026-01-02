/**
 * Certificate Generator Component
 * Generate completion certificates for pilgrims
 */

import * as Haptics from "expo-haptics";

import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Rect, Stop, Text as SvgText } from "react-native-svg";

import { AnimatedButton } from "@/components/animated-button";
import { GlassCard } from "@/components/glass-card";
import { ThemedText } from "@/components/themed-text";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Participant } from "@/types";

interface CertificateGeneratorProps {
  visible: boolean;
  onClose: () => void;
  participant: Participant | null;
  completedCheckpoints: number;
  totalCheckpoints: number;
}

export function CertificateGenerator({
  visible,
  onClose,
  participant,
  completedCheckpoints,
  totalCheckpoints,
}: CertificateGeneratorProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [generating, setGenerating] = useState(false);

  const isComplete = completedCheckpoints >= totalCheckpoints;
  const completionDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleGenerate = async () => {
    if (!participant) return;

    setGenerating(true);
    try {
      // In a real app, this would generate a PDF
      // For now, we'll show a success message
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        "Certificate Generated! 🎉",
        `Certificate for ${participant.name} has been created. In the full version, this would generate a PDF that can be shared or printed.`,
        [{ text: "OK", onPress: onClose }]
      );
    } catch (error) {
      console.error("Certificate generation error:", error);
      Alert.alert("Error", "Failed to generate certificate. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  if (!participant) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View
        style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.6)" }]}
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <View style={styles.centerContainer}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.background,
              borderRadius: Radius["2xl"],
              paddingBottom: insets.bottom + Spacing.xl,
            },
            Shadows.xl,
          ]}
          entering={SlideInDown.springify().damping(15)}
          exiting={SlideOutDown.springify().damping(15)}
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={[styles.title, { color: colors.text }]}>
              Completion Certificate
            </ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <ThemedText style={[styles.closeText, { color: colors.textSecondary }]}>
                ✕
              </ThemedText>
            </Pressable>
          </View>

          {/* Certificate Preview */}
          <View style={[styles.certificatePreview, { backgroundColor: colors.backgroundSecondary }]}>
            <Svg width="100%" height={200} viewBox="0 0 300 200">
              {/* Background */}
              <Defs>
                <SvgGradient id="certGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#C9A227" />
                  <Stop offset="100%" stopColor="#8B6914" />
                </SvgGradient>
              </Defs>
              <Rect x="0" y="0" width="300" height="200" fill="white" rx="8" />
              <Rect x="5" y="5" width="290" height="190" fill="none" stroke="url(#certGrad)" strokeWidth="2" rx="6" />
              
              {/* Decorative corners */}
              <Path d="M 20 20 L 40 20 M 20 20 L 20 40" stroke="#C9A227" strokeWidth="2" />
              <Path d="M 280 20 L 260 20 M 280 20 L 280 40" stroke="#C9A227" strokeWidth="2" />
              <Path d="M 20 180 L 40 180 M 20 180 L 20 160" stroke="#C9A227" strokeWidth="2" />
              <Path d="M 280 180 L 260 180 M 280 180 L 280 160" stroke="#C9A227" strokeWidth="2" />

              {/* Title */}
              <SvgText
                x="150"
                y="35"
                textAnchor="middle"
                fontSize="14"
                fontWeight="bold"
                fill="#C9A227"
              >
                CERTIFICATE OF COMPLETION
              </SvgText>

              {/* Subtitle */}
              <SvgText
                x="150"
                y="55"
                textAnchor="middle"
                fontSize="8"
                fill="#666"
              >
                Palitana Yatra 2025
              </SvgText>

              {/* Name */}
              <SvgText
                x="150"
                y="90"
                textAnchor="middle"
                fontSize="16"
                fontWeight="bold"
                fill="#333"
              >
                {participant.name}
              </SvgText>

              {/* Description */}
              <SvgText
                x="150"
                y="115"
                textAnchor="middle"
                fontSize="8"
                fill="#666"
              >
                has successfully completed the sacred pilgrimage
              </SvgText>
              <SvgText
                x="150"
                y="128"
                textAnchor="middle"
                fontSize="8"
                fill="#666"
              >
                visiting all {totalCheckpoints} checkpoints
              </SvgText>

              {/* Date */}
              <SvgText
                x="150"
                y="155"
                textAnchor="middle"
                fontSize="8"
                fill="#333"
              >
                {completionDate}
              </SvgText>

              {/* Seal */}
              <Circle cx="150" cy="175" r="12" fill="none" stroke="#C9A227" strokeWidth="1" />
              <SvgText
                x="150"
                y="178"
                textAnchor="middle"
                fontSize="6"
                fill="#C9A227"
              >
                ✓
              </SvgText>
            </Svg>
          </View>

          {/* Status */}
          <GlassCard
            variant={isComplete ? "success" : "warning"}
            padding="md"
            style={styles.statusCard}
          >
            <View style={styles.statusRow}>
              <ThemedText style={styles.statusEmoji}>
                {isComplete ? "🎉" : "⏳"}
              </ThemedText>
              <View style={styles.statusInfo}>
                <ThemedText style={[styles.statusTitle, { color: colors.text }]}>
                  {isComplete ? "Pilgrimage Complete!" : "In Progress"}
                </ThemedText>
                <ThemedText style={[styles.statusText, { color: colors.textSecondary }]}>
                  {completedCheckpoints} of {totalCheckpoints} checkpoints visited
                </ThemedText>
              </View>
            </View>
          </GlassCard>

          {/* Info */}
          {!isComplete && (
            <ThemedText style={[styles.infoText, { color: colors.textTertiary }]}>
              Complete all checkpoints to generate the certificate
            </ThemedText>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            <AnimatedButton
              title="Cancel"
              variant="outline"
              onPress={onClose}
              style={styles.cancelButton}
            />
            <AnimatedButton
              title={isComplete ? "Generate PDF" : "Not Available"}
              variant="primary"
              onPress={handleGenerate}
              loading={generating}
              disabled={!isComplete}
              style={styles.generateButton}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    padding: Spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
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
  certificatePreview: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    alignItems: "center",
  },
  statusCard: {
    marginBottom: Spacing.md,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusEmoji: {
    fontSize: 32,
    marginRight: Spacing.md,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  statusText: {
    fontSize: Typography.size.sm,
  },
  infoText: {
    fontSize: Typography.size.sm,
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
  },
  generateButton: {
    flex: 2,
  },
});
