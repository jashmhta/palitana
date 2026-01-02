/**
 * Sound Feedback Service
 * Provides audio feedback for scan results
 */

import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";

// Sound types for different scan results
export type SoundType = "success" | "error" | "warning" | "scan";

// Sound URLs (using system-like sounds)
const SOUND_CONFIG = {
  success: {
    frequency: 880, // A5 note
    duration: 150,
    haptic: Haptics.NotificationFeedbackType.Success,
  },
  error: {
    frequency: 220, // A3 note
    duration: 300,
    haptic: Haptics.NotificationFeedbackType.Error,
  },
  warning: {
    frequency: 440, // A4 note
    duration: 200,
    haptic: Haptics.NotificationFeedbackType.Warning,
  },
  scan: {
    frequency: 660, // E5 note
    duration: 100,
    haptic: Haptics.ImpactFeedbackStyle.Medium,
  },
};

let isAudioEnabled = true;
let isHapticEnabled = true;

/**
 * Initialize audio mode for the app
 */
export async function initializeAudio(): Promise<void> {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (error) {
    console.warn("Failed to initialize audio:", error);
  }
}

/**
 * Enable or disable sound feedback
 */
export function setSoundEnabled(enabled: boolean): void {
  isAudioEnabled = enabled;
}

/**
 * Enable or disable haptic feedback
 */
export function setHapticEnabled(enabled: boolean): void {
  isHapticEnabled = enabled;
}

/**
 * Get current sound enabled state
 */
export function isSoundEnabled(): boolean {
  return isAudioEnabled;
}

/**
 * Get current haptic enabled state
 */
export function isHapticEnabledState(): boolean {
  return isHapticEnabled;
}

/**
 * Play haptic feedback based on type
 */
export async function playHaptic(type: SoundType): Promise<void> {
  if (!isHapticEnabled) return;

  try {
    const config = SOUND_CONFIG[type];
    if (type === "scan") {
      await Haptics.impactAsync(config.haptic as Haptics.ImpactFeedbackStyle);
    } else {
      await Haptics.notificationAsync(config.haptic as Haptics.NotificationFeedbackType);
    }
  } catch (error) {
    console.warn("Haptic feedback failed:", error);
  }
}

/**
 * Play combined feedback (haptic + visual indication)
 * Note: Actual audio playback requires sound files or expo-audio tone generation
 */
export async function playFeedback(type: SoundType): Promise<void> {
  // Play haptic feedback
  await playHaptic(type);
  
  // For now, we rely on haptic feedback
  // Audio can be added later with actual sound files
}

/**
 * Play success feedback for successful scan
 */
export async function playSuccessFeedback(): Promise<void> {
  await playFeedback("success");
}

/**
 * Play error feedback for failed scan
 */
export async function playErrorFeedback(): Promise<void> {
  await playFeedback("error");
}

/**
 * Play warning feedback for duplicate scan
 */
export async function playWarningFeedback(): Promise<void> {
  await playFeedback("warning");
}

/**
 * Play scan feedback when QR code is detected
 */
export async function playScanFeedback(): Promise<void> {
  await playFeedback("scan");
}

/**
 * Play a pattern of haptic feedback for completion celebration
 */
export async function playCompletionCelebration(): Promise<void> {
  if (!isHapticEnabled) return;

  try {
    // Play a celebratory pattern
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    console.warn("Celebration haptic failed:", error);
  }
}
