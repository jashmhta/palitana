/**
 * Sound Feedback Service
 * 
 * @deprecated Use audio-feedback.ts instead. This file re-exports for backwards compatibility.
 * 
 * Migration:
 * - playSuccessFeedback() -> playSuccessSound()
 * - playErrorFeedback() -> playErrorSound()
 * - playWarningFeedback() -> playDuplicateSound()
 * - playScanFeedback() -> (removed - use haptic directly)
 */

import * as Haptics from "expo-haptics";

// Re-export from audio-feedback for backwards compatibility
export {
  playSuccessSound,
  playErrorSound,
  playDuplicateSound,
  playJatraSound,
  setAudioEnabled,
  setHapticEnabled,
  isAudioEnabled,
  isHapticEnabled,
  cleanupAudio,
  initializeAudio,
} from "./audio-feedback";

// Compatibility aliases
export {
  playSuccessSound as playSuccessFeedback,
  playErrorSound as playErrorFeedback,
  playDuplicateSound as playWarningFeedback,
} from "./audio-feedback";

// Legacy types
export type SoundType = "success" | "error" | "warning" | "scan";

/**
 * @deprecated Use setHapticEnabled from audio-feedback.ts
 */
export function setSoundEnabled(enabled: boolean): void {
  console.warn("[sound-feedback] setSoundEnabled is deprecated. Use setAudioEnabled from audio-feedback.ts");
}

/**
 * @deprecated Use isHapticEnabled from audio-feedback.ts
 */
export function isSoundEnabled(): boolean {
  return true;
}

/**
 * @deprecated Use isHapticEnabled from audio-feedback.ts
 */
export function isHapticEnabledState(): boolean {
  return true;
}

/**
 * Play haptic feedback based on type
 */
export async function playHaptic(type: SoundType): Promise<void> {
  try {
    switch (type) {
      case "success":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case "error":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case "warning":
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case "scan":
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
    }
  } catch (error) {
    console.warn("Haptic feedback failed:", error);
  }
}

/**
 * @deprecated Use specific functions from audio-feedback.ts
 */
export async function playFeedback(type: SoundType): Promise<void> {
  await playHaptic(type);
}

/**
 * Play scan feedback when QR code is detected
 */
export async function playScanFeedback(): Promise<void> {
  await playHaptic("scan");
}

/**
 * Play a pattern of haptic feedback for completion celebration
 */
export async function playCompletionCelebration(): Promise<void> {
  try {
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
