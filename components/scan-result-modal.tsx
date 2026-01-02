/**
 * Enhanced Scan Result Modal
 * Large, prominent feedback for scan success/failure with auto-dismiss
 */

import { Modal, Pressable, StyleSheet } from "react-native";
import Animated, { FadeIn, ZoomIn, ZoomOut } from "react-native-reanimated";
import { IconSymbol } from "./ui/icon-symbol";
import { ThemedText } from "./themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useEffect } from "react";

interface ScanResultModalProps {
  visible: boolean;
  success: boolean;
  participantName?: string;
  message: string;
  onDismiss: () => void;
  autoDismiss?: boolean;
  autoDismissDelay?: number;
}

export function ScanResultModal({
  visible,
  success,
  participantName,
  message,
  onDismiss,
  autoDismiss = true,
  autoDismissDelay = 3000,
}: ScanResultModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Auto-dismiss after delay
  useEffect(() => {
    if (visible && autoDismiss) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoDismissDelay);
      return () => clearTimeout(timer);
    }
  }, [visible, autoDismiss, autoDismissDelay, onDismiss]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <Pressable 
        style={styles.overlay} 
        onPress={onDismiss}
      >
        <Animated.View
          entering={ZoomIn.springify().damping(15)}
          exiting={ZoomOut.springify().damping(15)}
          style={[
            styles.container,
            {
              backgroundColor: colors.card,
              borderColor: success ? colors.success : colors.error,
            },
          ]}
        >
          {/* Icon */}
          <Animated.View
            entering={FadeIn.delay(100)}
            style={[
              styles.iconContainer,
              {
                backgroundColor: success ? colors.successLight : colors.errorLight,
              },
            ]}
          >
            <IconSymbol
              name={success ? "checkmark.circle.fill" : "xmark.circle.fill"}
              size={64}
              color={success ? colors.success : colors.error}
            />
          </Animated.View>

          {/* Participant Name */}
          {participantName && (
            <Animated.View entering={FadeIn.delay(200)}>
              <ThemedText style={styles.participantName}>
                {participantName}
              </ThemedText>
            </Animated.View>
          )}

          {/* Message */}
          <Animated.View entering={FadeIn.delay(300)}>
            <ThemedText
              style={[
                styles.message,
                {
                  color: success ? colors.success : colors.error,
                },
              ]}
            >
              {message}
            </ThemedText>
          </Animated.View>

          {/* Dismiss Button */}
          <Animated.View entering={FadeIn.delay(400)}>
            <Pressable
              style={[
                styles.dismissButton,
                {
                  backgroundColor: success ? colors.success : colors.error,
                },
              ]}
              onPress={onDismiss}
            >
              <ThemedText style={styles.dismissButtonText}>
                OK
              </ThemedText>
            </Pressable>
          </Animated.View>

          {/* Auto-dismiss indicator */}
          {autoDismiss && (
            <Animated.View entering={FadeIn.delay(500)}>
              <ThemedText style={[styles.autoDismissText, { color: colors.textTertiary }]}>
                Auto-dismiss in {autoDismissDelay / 1000}s
              </ThemedText>
            </Animated.View>
          )}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 32,
    alignItems: "center",
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  participantName: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 24,
  },
  dismissButton: {
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 120,
  },
  dismissButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  autoDismissText: {
    fontSize: 12,
    marginTop: 16,
    textAlign: "center",
  },
});
