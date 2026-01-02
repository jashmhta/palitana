/**
 * Volunteer Login Component
 * PIN-based authentication for checkpoint volunteers
 */

import * as Haptics from "expo-haptics";
import { useState, useRef, useEffect } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";

import { ThemedText } from "@/components/themed-text";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Volunteer } from "@/types";

interface VolunteerLoginProps {
  visible: boolean;
  onClose: () => void;
  onLogin: (volunteer: Volunteer) => void;
  volunteers: Volunteer[];
}

export function VolunteerLogin({
  visible,
  onClose,
  onLogin,
  volunteers,
}: VolunteerLoginProps) {
  const colorScheme = useColorScheme() ?? "light";
  const colors = Colors[colorScheme];

  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  
  const shakeX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  useEffect(() => {
    if (visible) {
      setPin(["", "", "", ""]);
      setError(null);
      setTimeout(() => inputRefs.current[0]?.focus(), 300);
    }
  }, [visible]);

  const handlePinChange = (value: string, index: number) => {
    if (value.length > 1) return;
    
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(null);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check PIN when all digits entered
    if (index === 3 && value) {
      const fullPin = newPin.join("");
      verifyPin(fullPin);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyPin = (fullPin: string) => {
    const volunteer = volunteers.find(v => v.pin === fullPin);
    
    if (volunteer) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onLogin(volunteer);
      onClose();
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      shake();
      setError("Invalid PIN. Please try again.");
      setPin(["", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  };

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
            },
            Shadows.xl,
          ]}
          entering={SlideInDown.springify().damping(15)}
          exiting={SlideOutDown.springify().damping(15)}
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={[styles.emoji]}>👋</ThemedText>
            <ThemedText style={[styles.title, { color: colors.text }]}>
              Volunteer Login
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
              Enter your 4-digit PIN to continue
            </ThemedText>
          </View>

          {/* PIN Input */}
          <Animated.View style={[styles.pinContainer, animatedStyle]}>
            {pin.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[
                  styles.pinInput,
                  {
                    backgroundColor: colors.backgroundSecondary,
                    borderColor: digit ? colors.primary : colors.border,
                    color: colors.text,
                  },
                ]}
                value={digit}
                onChangeText={(value) => handlePinChange(value, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                secureTextEntry
                selectTextOnFocus
              />
            ))}
          </Animated.View>

          {/* Error */}
          {error && (
            <Animated.View entering={FadeIn} style={styles.errorContainer}>
              <ThemedText style={[styles.errorText, { color: colors.error }]}>
                {error}
              </ThemedText>
            </Animated.View>
          )}

          {/* Help text */}
          <ThemedText style={[styles.helpText, { color: colors.textTertiary }]}>
            Contact your coordinator if you forgot your PIN
          </ThemedText>

          {/* Cancel button */}
          <Pressable
            style={[styles.cancelButton, { backgroundColor: colors.backgroundSecondary }]}
            onPress={onClose}
          >
            <ThemedText style={[styles.cancelText, { color: colors.textSecondary }]}>
              Cancel
            </ThemedText>
          </Pressable>
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
    maxWidth: 340,
    padding: Spacing["2xl"],
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  emoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.size.sm,
    textAlign: "center",
  },
  pinContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  pinInput: {
    width: 56,
    height: 64,
    borderRadius: Radius.lg,
    borderWidth: 2,
    fontSize: Typography.size["2xl"],
    fontWeight: Typography.weight.bold,
    textAlign: "center",
  },
  errorContainer: {
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: Typography.size.sm,
    textAlign: "center",
  },
  helpText: {
    fontSize: Typography.size.xs,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  cancelButton: {
    width: "100%",
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: "center",
  },
  cancelText: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.medium,
  },
});
