/**
 * Audio Feedback Service
 * Provides distinct audio cues for scan results in noisy pilgrimage environments
 * 
 * Supports:
 * - Web: Uses Web Audio API oscillators
 * - Native (iOS/Android): Uses expo-av with programmatic audio generation
 */

import { Audio } from "expo-av";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

// Audio configuration
let audioInitialized = false;
let audioEnabled = true;
let hapticEnabled = true;

/**
 * Audio mode settings for mobile playback
 */
const AUDIO_MODE = {
  playsInSilentModeIOS: true,
  staysActiveInBackground: false,
  shouldDuckAndroid: true,
};

/**
 * Sound specifications for different feedback types
 */
const SOUND_SPECS = {
  success: {
    // Pleasant ascending two-tone (A5 -> E6)
    tones: [
      { frequency: 880, duration: 100, delay: 0 },
      { frequency: 1320, duration: 150, delay: 100 },
    ],
    waveform: "sine" as OscillatorType,
    volume: 0.3,
    haptic: Haptics.NotificationFeedbackType.Success,
  },
  error: {
    // Harsh descending two-tone (A4 -> A3)
    tones: [
      { frequency: 440, duration: 150, delay: 0 },
      { frequency: 220, duration: 200, delay: 150 },
    ],
    waveform: "square" as OscillatorType,
    volume: 0.25,
    haptic: Haptics.NotificationFeedbackType.Error,
  },
  duplicate: {
    // Warning double beep (E5 -> E5)
    tones: [
      { frequency: 660, duration: 100, delay: 0 },
      { frequency: 660, duration: 100, delay: 150 },
    ],
    waveform: "triangle" as OscillatorType,
    volume: 0.25,
    haptic: Haptics.NotificationFeedbackType.Warning,
  },
  jatra: {
    // Celebration: ascending arpeggio (C5 -> E5 -> G5 -> C6)
    tones: [
      { frequency: 523, duration: 100, delay: 0 },    // C5
      { frequency: 659, duration: 100, delay: 100 },  // E5
      { frequency: 784, duration: 100, delay: 200 },  // G5
      { frequency: 1047, duration: 200, delay: 300 }, // C6
    ],
    waveform: "sine" as OscillatorType,
    volume: 0.35,
    haptic: Haptics.NotificationFeedbackType.Success,
  },
};

/**
 * Initialize audio mode for playback
 */
async function initAudioMode(): Promise<void> {
  if (audioInitialized) return;
  
  try {
    if (Platform.OS !== "web") {
      await Audio.setAudioModeAsync(AUDIO_MODE);
    }
    audioInitialized = true;
  } catch (error) {
    console.warn("[Audio] Failed to initialize audio mode:", error);
  }
}

/**
 * Play tones using Web Audio API (for web platform)
 */
function playWebAudio(
  tones: Array<{ frequency: number; duration: number; delay: number }>,
  waveform: OscillatorType,
  volume: number
): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn("[Audio] Web Audio API not available");
      return;
    }

    const audioContext = new AudioContextClass();
    const now = audioContext.currentTime;

    tones.forEach(({ frequency, duration, delay }) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = waveform;

      const startTime = now + delay / 1000;
      const endTime = startTime + duration / 1000;

      gainNode.gain.setValueAtTime(volume, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);

      oscillator.start(startTime);
      oscillator.stop(endTime);
    });

    // Clean up context after sounds finish
    const totalDuration = Math.max(...tones.map(t => t.delay + t.duration));
    setTimeout(() => {
      audioContext.close().catch(() => {});
    }, totalDuration + 100);
  } catch (error) {
    console.warn("[Audio] Web audio playback failed:", error);
  }
}

/**
 * Play tones using native audio (iOS/Android)
 * Uses a simple beep approach since programmatic tone generation
 * requires additional native modules
 */
async function playNativeAudio(
  tones: Array<{ frequency: number; duration: number; delay: number }>,
  _waveform: OscillatorType,
  _volume: number
): Promise<void> {
  try {
    await initAudioMode();
    
    // For native platforms, we use haptic feedback as the primary feedback mechanism
    // True audio generation would require bundling audio files or using a native module
    // like react-native-sound or a custom native implementation
    
    // The haptic feedback is handled separately in playWithHaptics()
    // This function is a placeholder for future audio file integration
    
    // If you want to add actual audio files in the future:
    // 1. Add .mp3/.wav files to assets/sounds/
    // 2. Use: const { sound } = await Audio.Sound.createAsync(require('../assets/sounds/success.mp3'));
    // 3. Play: await sound.playAsync();
    
    console.debug("[Audio] Native audio placeholder - using haptics for feedback");
  } catch (error) {
    console.warn("[Audio] Native audio failed:", error);
  }
}

/**
 * Play haptic feedback
 */
async function playHaptic(type: keyof typeof SOUND_SPECS): Promise<void> {
  if (!hapticEnabled) return;
  
  try {
    const spec = SOUND_SPECS[type];
    await Haptics.notificationAsync(spec.haptic);
    
    // For jatra completion, play additional celebration haptics
    if (type === "jatra") {
      await new Promise(r => setTimeout(r, 100));
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      await new Promise(r => setTimeout(r, 100));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch (error) {
    console.warn("[Audio] Haptic feedback failed:", error);
  }
}

/**
 * Play sound with haptic feedback
 */
async function playWithHaptics(type: keyof typeof SOUND_SPECS): Promise<void> {
  const spec = SOUND_SPECS[type];
  
  // Play haptic feedback (always on mobile)
  const hapticPromise = playHaptic(type);
  
  // Play audio if enabled
  if (audioEnabled) {
    if (Platform.OS === "web") {
      playWebAudio(spec.tones, spec.waveform, spec.volume);
    } else {
      await playNativeAudio(spec.tones, spec.waveform, spec.volume);
    }
  }
  
  await hapticPromise;
}

/**
 * Play success sound - pleasant ascending tone
 * Used when scan is successfully recorded
 */
export async function playSuccessSound(): Promise<void> {
  await playWithHaptics("success");
}

/**
 * Play error sound - harsh descending tone
 * Used when scan fails (participant not found)
 */
export async function playErrorSound(): Promise<void> {
  await playWithHaptics("error");
}

/**
 * Play duplicate sound - warning double beep
 * Used when pilgrim already scanned at this checkpoint
 */
export async function playDuplicateSound(): Promise<void> {
  await playWithHaptics("duplicate");
}

/**
 * Play jatra completion sound - celebratory arpeggio
 * Used when pilgrim completes a full Jatra (Gheti checkpoint)
 */
export async function playJatraSound(): Promise<void> {
  await playWithHaptics("jatra");
}

/**
 * Enable or disable audio feedback
 */
export function setAudioEnabled(enabled: boolean): void {
  audioEnabled = enabled;
  console.log(`[Audio] Audio feedback ${enabled ? "enabled" : "disabled"}`);
}

/**
 * Enable or disable haptic feedback
 */
export function setHapticEnabled(enabled: boolean): void {
  hapticEnabled = enabled;
  console.log(`[Audio] Haptic feedback ${enabled ? "enabled" : "disabled"}`);
}

/**
 * Check if audio is enabled
 */
export function isAudioEnabled(): boolean {
  return audioEnabled;
}

/**
 * Check if haptic is enabled
 */
export function isHapticEnabled(): boolean {
  return hapticEnabled;
}

/**
 * Cleanup audio resources (called on app unmount)
 */
export async function cleanupAudio(): Promise<void> {
  audioInitialized = false;
  console.log("[Audio] Audio resources cleaned up");
}

/**
 * Pre-initialize audio system (call on app start)
 */
export async function initializeAudio(): Promise<void> {
  await initAudioMode();
  console.log("[Audio] Audio system initialized");
}
