/**
 * Audio Feedback Service
 * Provides distinct audio cues for scan results in noisy pilgrimage environments
 */

import { Audio } from "expo-av";
import { Platform } from "react-native";

// Sound objects cache
let successSound: Audio.Sound | null = null;
let errorSound: Audio.Sound | null = null;
let duplicateSound: Audio.Sound | null = null;

// Audio configuration
const AUDIO_CONFIG = {
  playsInSilentModeIOS: true,
  staysActiveInBackground: false,
  shouldDuckAndroid: true,
};

/**
 * Initialize audio mode for playback
 */
async function initAudioMode() {
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
  } catch (error) {
    console.warn("Failed to set audio mode:", error);
  }
}

/**
 * Generate a beep sound using oscillator (Web) or use system sounds
 * For mobile, we use simple tone generation
 */
async function createBeepSound(
  frequency: number,
  duration: number,
  type: "success" | "error" | "duplicate"
): Promise<Audio.Sound | null> {
  if (Platform.OS === "web") {
    // Web Audio API for browser
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type === "success" ? "sine" : type === "error" ? "square" : "triangle";
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
      
      return null; // Web doesn't use expo-av Sound objects
    } catch (error) {
      console.warn("Web audio failed:", error);
      return null;
    }
  }
  
  // For native platforms, we'll use a simple approach
  // In production, you'd bundle actual audio files
  return null;
}

/**
 * Play success sound - pleasant ascending tone
 * Used when scan is successfully recorded
 */
export async function playSuccessSound(): Promise<void> {
  try {
    await initAudioMode();
    
    if (Platform.OS === "web") {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Two-tone success beep (ascending)
      const playTone = (freq: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = "sine";
        
        gainNode.gain.setValueAtTime(0.3, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = audioContext.currentTime;
      playTone(880, now, 0.1); // A5
      playTone(1320, now + 0.1, 0.15); // E6 (higher)
    } else {
      // Native: Use haptics as fallback (audio files would be better)
      // The haptic feedback is already handled in the scanner
    }
  } catch (error) {
    console.warn("Failed to play success sound:", error);
  }
}

/**
 * Play error sound - harsh descending tone
 * Used when scan fails (participant not found)
 */
export async function playErrorSound(): Promise<void> {
  try {
    await initAudioMode();
    
    if (Platform.OS === "web") {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Harsh error beep (descending)
      const playTone = (freq: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = "square"; // Harsher sound
        
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = audioContext.currentTime;
      playTone(440, now, 0.15); // A4
      playTone(220, now + 0.15, 0.2); // A3 (lower)
    }
  } catch (error) {
    console.warn("Failed to play error sound:", error);
  }
}

/**
 * Play duplicate sound - warning tone
 * Used when pilgrim already scanned at this checkpoint
 */
export async function playDuplicateSound(): Promise<void> {
  try {
    await initAudioMode();
    
    if (Platform.OS === "web") {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Double beep warning
      const playTone = (freq: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = "triangle";
        
        gainNode.gain.setValueAtTime(0.25, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const now = audioContext.currentTime;
      playTone(660, now, 0.1); // E5
      playTone(660, now + 0.15, 0.1); // E5 again (double beep)
    }
  } catch (error) {
    console.warn("Failed to play duplicate sound:", error);
  }
}

/**
 * Cleanup audio resources
 */
export async function cleanupAudio(): Promise<void> {
  try {
    if (successSound) {
      await successSound.unloadAsync();
      successSound = null;
    }
    if (errorSound) {
      await errorSound.unloadAsync();
      errorSound = null;
    }
    if (duplicateSound) {
      await duplicateSound.unloadAsync();
      duplicateSound = null;
    }
  } catch (error) {
    console.warn("Failed to cleanup audio:", error);
  }
}
