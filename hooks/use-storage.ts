/**
 * Offline-first storage hooks using AsyncStorage
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useState } from "react";

import { DEFAULT_CHECKPOINTS } from "@/constants/checkpoints";
import { DEFAULT_PARTICIPANTS } from "@/constants/default-participants";
import {
  AppSettings,
  Checkpoint,
  Participant,
  ParticipantWithProgress,
  ScanLog,
  SyncQueueItem,
} from "@/types";

// Storage keys
const STORAGE_KEYS = {
  PARTICIPANTS: "palitana_participants",
  SCAN_LOGS: "palitana_scan_logs",
  CHECKPOINTS: "palitana_checkpoints",
  SYNC_QUEUE: "palitana_sync_queue",
  SETTINGS: "palitana_settings",
};

// Default settings
// Google Sheets ID is pre-configured for Palitana Yatra event
const DEFAULT_SETTINGS: AppSettings = {
  currentCheckpoint: 1,
  deviceId: "",
  lastSyncTime: null,
  googleSheetsId: "1BYVEW7FDb9Q2UW1aEvrYJUwPxB5XP94YAGkzpy_eJt4",
  autoSync: true,
};

/**
 * Generate a UUID using expo-crypto
 */
function generateUUID(): string {
  return Crypto.randomUUID();
}

/**
 * Generate a short QR token (12 characters)
 */
function generateQRToken(): string {
  const uuid = Crypto.randomUUID();
  return uuid.replace(/-/g, "").substring(0, 12).toUpperCase();
}

/**
 * Hook for managing participants
 */
export function useParticipants() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);

  const loadParticipants = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PARTICIPANTS);
      if (data) {
        const parsed = JSON.parse(data);
        // Load whatever is stored (even if empty array after clear)
        setParticipants(parsed);
      } else {
        // First run only - check if onboarding is complete
        // If onboarding is complete but no participants, user cleared data - don't reload defaults
        const onboardingComplete = await AsyncStorage.getItem("palitana_onboarding_complete");
        if (!onboardingComplete && DEFAULT_PARTICIPANTS.length > 0) {
          // First time app launch - load default participants
          await AsyncStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(DEFAULT_PARTICIPANTS));
          setParticipants(DEFAULT_PARTICIPANTS);
        } else {
          // User cleared data or no defaults - start with empty
          setParticipants([]);
        }
      }
    } catch (error) {
      console.error("Failed to load participants:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveParticipants = useCallback(async (data: Participant[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(data));
      setParticipants(data);
    } catch (error) {
      console.error("Failed to save participants:", error);
    }
  }, []);

  const addParticipant = useCallback(
    async (participant: Omit<Participant, "id" | "qrToken">) => {
      const newParticipant: Participant = {
        ...participant,
        id: generateUUID(),
        qrToken: generateQRToken(),
        createdAt: new Date().toISOString(),
      };
      const updated = [...participants, newParticipant];
      await saveParticipants(updated);
      return newParticipant;
    },
    [participants, saveParticipants]
  );

  const findByQrToken = useCallback(
    (qrToken: string) => {
      return participants.find((p) => p.qrToken === qrToken);
    },
    [participants]
  );

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  const clearAll = useCallback(async () => {
    await saveParticipants([]);
  }, [saveParticipants]);

  return {
    participants,
    loading,
    saveParticipants,
    addParticipant,
    findByQrToken,
    reload: loadParticipants,
    clearAll,
  };
}

/**
 * Hook for managing scan logs
 */
export function useScanLogs() {
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadScanLogs = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SCAN_LOGS);
      if (data) {
        setScanLogs(JSON.parse(data));
      }
    } catch (error) {
      console.error("Failed to load scan logs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveScanLogs = useCallback(async (data: ScanLog[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SCAN_LOGS, JSON.stringify(data));
      setScanLogs(data);
    } catch (error) {
      console.error("Failed to save scan logs:", error);
    }
  }, []);

  const addScanLog = useCallback(
    async (
      participantId: string,
      checkpointId: number,
      deviceId?: string,
      gpsLat?: number,
      gpsLng?: number
    ): Promise<{ success: boolean; duplicate: boolean; scanLog?: ScanLog }> => {
      // Check for duplicate
      const isDuplicate = scanLogs.some(
        (log) => log.participantId === participantId && log.checkpointId === checkpointId
      );

      if (isDuplicate) {
        return { success: false, duplicate: true };
      }

      const newScanLog: ScanLog = {
        id: generateUUID(),
        participantId,
        checkpointId,
        timestamp: new Date().toISOString(),
        deviceId,
        gpsLat,
        gpsLng,
        synced: false,
      };

      const updated = [...scanLogs, newScanLog];
      await saveScanLogs(updated);

      // Add to sync queue
      await addToSyncQueue(newScanLog);

      return { success: true, duplicate: false, scanLog: newScanLog };
    },
    [scanLogs, saveScanLogs]
  );

  const getLogsForParticipant = useCallback(
    (participantId: string) => {
      return scanLogs.filter((log) => log.participantId === participantId);
    },
    [scanLogs]
  );

  const getLogsForCheckpoint = useCallback(
    (checkpointId: number) => {
      return scanLogs.filter((log) => log.checkpointId === checkpointId);
    },
    [scanLogs]
  );

  const markAsSynced = useCallback(
    async (logIds: string[]) => {
      const updated = scanLogs.map((log) =>
        logIds.includes(log.id) ? { ...log, synced: true } : log
      );
      await saveScanLogs(updated);
    },
    [scanLogs, saveScanLogs]
  );

  const getUnsyncedLogs = useCallback(() => {
    return scanLogs.filter((log) => !log.synced);
  }, [scanLogs]);

  useEffect(() => {
    loadScanLogs();
  }, [loadScanLogs]);

  const clearAll = useCallback(async () => {
    await saveScanLogs([]);
  }, [saveScanLogs]);

  return {
    scanLogs,
    loading,
    addScanLog,
    getLogsForParticipant,
    getLogsForCheckpoint,
    markAsSynced,
    getUnsyncedLogs,
    reload: loadScanLogs,
    clearAll,
  };
}

/**
 * Hook for managing checkpoints
 */
export function useCheckpoints() {
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(DEFAULT_CHECKPOINTS);
  const [loading, setLoading] = useState(true);

  const loadCheckpoints = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CHECKPOINTS);
      if (data) {
        setCheckpoints(JSON.parse(data));
      } else {
        // Initialize with defaults
        await AsyncStorage.setItem(STORAGE_KEYS.CHECKPOINTS, JSON.stringify(DEFAULT_CHECKPOINTS));
      }
    } catch (error) {
      console.error("Failed to load checkpoints:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCheckpoints();
  }, [loadCheckpoints]);

  return { checkpoints, loading };
}

/**
 * Hook for managing app settings
 */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        const parsed = JSON.parse(data);
        // Always ensure Google Sheets ID is set from defaults if not configured
        const merged = { 
          ...DEFAULT_SETTINGS, 
          ...parsed,
          // Force Google Sheets ID from defaults if null or empty
          googleSheetsId: parsed.googleSheetsId || DEFAULT_SETTINGS.googleSheetsId,
        };
        // Update storage if Google Sheets ID was missing
        if (!parsed.googleSheetsId && DEFAULT_SETTINGS.googleSheetsId) {
          await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
        }
        setSettings(merged);
      } else {
        // Initialize with device ID
        const newSettings = {
          ...DEFAULT_SETTINGS,
          deviceId: generateUUID(),
        };
        await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
        setSettings(newSettings);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<AppSettings>) => {
      const updated = { ...settings, ...updates };
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
        setSettings(updated);
      } catch (error) {
        console.error("Failed to save settings:", error);
      }
    },
    [settings]
  );

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return { settings, loading, updateSettings };
}

/**
 * Sync queue management
 */
async function addToSyncQueue(scanLog: ScanLog) {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    const queue: SyncQueueItem[] = data ? JSON.parse(data) : [];

    const queueItem: SyncQueueItem = {
      id: generateUUID(),
      type: "scan_log",
      data: scanLog,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    queue.push(queueItem);
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  } catch (error) {
    console.error("Failed to add to sync queue:", error);
  }
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to get sync queue:", error);
    return [];
  }
}

export async function clearSyncQueue(itemIds: string[]) {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
    const queue: SyncQueueItem[] = data ? JSON.parse(data) : [];
    const filtered = queue.filter((item) => !itemIds.includes(item.id));
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to clear sync queue:", error);
  }
}

/**
 * Get participants with their scan progress
 */
export function getParticipantsWithProgress(
  participants: Participant[],
  scanLogs: ScanLog[]
): ParticipantWithProgress[] {
  return participants.map((participant) => {
    const participantLogs = scanLogs.filter((log) => log.participantId === participant.id);
    const scannedCheckpoints = [...new Set(participantLogs.map((log) => log.checkpointId))];
    const lastLog = participantLogs.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    return {
      ...participant,
      scannedCheckpoints,
      totalScans: scannedCheckpoints.length,
      lastScanTime: lastLog?.timestamp,
    };
  });
}
