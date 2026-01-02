/**
 * Hook for centralized database sync
 * Ensures all volunteers see the same data across all devices
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

import { Participant, ScanLog } from "@/types";
import { useNetwork } from "./use-network";

// Server response types for tRPC format
interface ServerParticipant {
  uuid: string;
  name: string;
  mobile: string | null;
  qrToken: string;
  createdAt: string;
  groupName: string | null;
  emergencyContact: string | null;
  emergencyContactName: string | null;
  emergencyContactRelation: string | null;
  notes: string | null;
  photoUri: string | null;
  bloodGroup: string | null;
  medicalConditions: string | null;
  allergies: string | null;
  medications: string | null;
  age: number | null;
  gender: string | null;
}

interface ServerScanLog {
  uuid: string;
  participantUuid: string;
  checkpointId: number;
  scannedAt: string;
  deviceId: string | null;
}

// Storage keys
const STORAGE_KEYS = {
  PARTICIPANTS: "palitana_participants",
  SCAN_LOGS: "palitana_scan_logs",
  LAST_SYNC: "palitana_last_db_sync",
  DEVICE_ID: "palitana_device_id",
};

// API base URL - will be set from environment
const getApiUrl = () => {
  // In production, this will be the deployed server URL
  // For development, use localhost or the exposed URL
  if (typeof window !== "undefined" && window.location) {
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    // Use port 3000 for API server
    return `${protocol}//${host}:3000`;
  }
  return "http://localhost:3000";
};

interface SyncState {
  isSyncing: boolean;
  lastSyncTime: string | null;
  error: string | null;
  isOnline: boolean;
}

interface UseDatabaseSyncReturn {
  // Data
  participants: Participant[];
  scanLogs: ScanLog[];
  
  // State
  syncState: SyncState;
  loading: boolean;
  
  // Actions
  addParticipant: (participant: Omit<Participant, "id" | "qrToken">) => Promise<Participant>;
  addScanLog: (participantId: string, checkpointId: number, deviceId?: string) => Promise<{ success: boolean; duplicate: boolean; scanLog?: ScanLog }>;
  syncNow: () => Promise<void>;
  clearAllData: () => Promise<void>;
  
  // Helpers
  findByQrToken: (qrToken: string) => Participant | undefined;
  getLogsForParticipant: (participantId: string) => ScanLog[];
  getLogsForCheckpoint: (checkpointId: number) => ScanLog[];
}

/**
 * Generate a UUID
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
 * Hook for managing data with centralized database sync
 * All volunteers see the same data - changes sync automatically
 */
export function useDatabaseSync(): UseDatabaseSyncReturn {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSyncTime: null,
    error: null,
    isOnline: true,
  });
  
  const networkStatus = useNetwork();
  const isOnline = networkStatus.isConnected;
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const deviceIdRef = useRef<string>("");

  // Initialize device ID
  useEffect(() => {
    const initDeviceId = async () => {
      let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
      if (!deviceId) {
        deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
      }
      deviceIdRef.current = deviceId;
    };
    initDeviceId();
  }, []);

  // Load local data first (for offline support)
  const loadLocalData = useCallback(async () => {
    try {
      const [participantsData, scanLogsData, lastSync] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PARTICIPANTS),
        AsyncStorage.getItem(STORAGE_KEYS.SCAN_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC),
      ]);

      if (participantsData) {
        setParticipants(JSON.parse(participantsData));
      }
      if (scanLogsData) {
        setScanLogs(JSON.parse(scanLogsData));
      }
      if (lastSync) {
        setSyncState(prev => ({ ...prev, lastSyncTime: lastSync }));
      }
    } catch (error) {
      console.error("[useDatabaseSync] Failed to load local data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save data locally
  const saveLocalData = useCallback(async (newParticipants: Participant[], newScanLogs: ScanLog[]) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.PARTICIPANTS, JSON.stringify(newParticipants)),
        AsyncStorage.setItem(STORAGE_KEYS.SCAN_LOGS, JSON.stringify(newScanLogs)),
      ]);
    } catch (error) {
      console.error("[useDatabaseSync] Failed to save local data:", error);
    }
  }, []);

  // Fetch data from server
  const fetchFromServer = useCallback(async (): Promise<{ participants: Participant[]; scanLogs: ScanLog[] }> => {
    const apiUrl = getApiUrl();
    
    try {
      // Fetch participants
      const participantsRes = await fetch(`${apiUrl}/api/trpc/participants.list`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      // Fetch scan logs
      const scanLogsRes = await fetch(`${apiUrl}/api/trpc/scanLogs.list`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!participantsRes.ok || !scanLogsRes.ok) {
        throw new Error("Failed to fetch from server");
      }

      const participantsJson = await participantsRes.json();
      const scanLogsJson = await scanLogsRes.json();

      // Parse tRPC response format
      const serverParticipants: ServerParticipant[] = participantsJson.result?.data || [];
      const serverScanLogs: ServerScanLog[] = scanLogsJson.result?.data || [];

      // Convert server format to local format
      const localParticipants: Participant[] = serverParticipants.map((p) => ({
        id: p.uuid,
        name: p.name,
        mobile: p.mobile || "",
        qrToken: p.qrToken,
        createdAt: p.createdAt,
        group: p.groupName || undefined,
        emergencyContact: p.emergencyContact || undefined,
        emergencyContactName: p.emergencyContactName || undefined,
        emergencyContactRelation: p.emergencyContactRelation || undefined,
        notes: p.notes || undefined,
        photoUri: p.photoUri || undefined,
        bloodGroup: p.bloodGroup || undefined,
        medicalConditions: p.medicalConditions || undefined,
        allergies: p.allergies || undefined,
        medications: p.medications || undefined,
        age: p.age || undefined,
        gender: p.gender as Participant["gender"] || undefined,
      }));

      const localScanLogs: ScanLog[] = serverScanLogs.map((s) => ({
        id: s.uuid,
        participantId: s.participantUuid,
        checkpointId: s.checkpointId,
        timestamp: s.scannedAt,
        deviceId: s.deviceId || undefined,
        synced: true,
      }));

      return { participants: localParticipants, scanLogs: localScanLogs };
    } catch (error) {
      console.error("[useDatabaseSync] Fetch from server failed:", error);
      throw error;
    }
  }, []);

  // Push participant to server
  const pushParticipantToServer = useCallback(async (participant: Participant): Promise<boolean> => {
    const apiUrl = getApiUrl();
    
    try {
      const response = await fetch(`${apiUrl}/api/trpc/participants.upsert`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uuid: participant.id,
          name: participant.name,
          mobile: participant.mobile || null,
          qrToken: participant.qrToken,
          groupName: participant.group || null,
          emergencyContact: participant.emergencyContact || null,
          emergencyContactName: participant.emergencyContactName || null,
          emergencyContactRelation: participant.emergencyContactRelation || null,
          notes: participant.notes || null,
          photoUri: participant.photoUri || null,
          bloodGroup: participant.bloodGroup || null,
          medicalConditions: participant.medicalConditions || null,
          allergies: participant.allergies || null,
          medications: participant.medications || null,
          age: participant.age || null,
          gender: participant.gender || null,
        }),
      });
      
      return response.ok;
    } catch (error) {
      console.error("[useDatabaseSync] Push participant failed:", error);
      return false;
    }
  }, []);

  // Push scan log to server
  const pushScanLogToServer = useCallback(async (scanLog: ScanLog): Promise<{ success: boolean; duplicate: boolean }> => {
    const apiUrl = getApiUrl();
    
    try {
      const response = await fetch(`${apiUrl}/api/trpc/scanLogs.create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uuid: scanLog.id,
          participantUuid: scanLog.participantId,
          checkpointId: scanLog.checkpointId,
          deviceId: scanLog.deviceId || deviceIdRef.current || null,
          gpsLat: scanLog.gpsLat?.toString() || null,
          gpsLng: scanLog.gpsLng?.toString() || null,
          scannedAt: scanLog.timestamp,
        }),
      });
      
      if (!response.ok) {
        return { success: false, duplicate: false };
      }
      
      const result = await response.json();
      return {
        success: result.result?.data?.success || false,
        duplicate: result.result?.data?.duplicate || false,
      };
    } catch (error) {
      console.error("[useDatabaseSync] Push scan log failed:", error);
      return { success: false, duplicate: false };
    }
  }, []);

  // Sync with server
  const syncNow = useCallback(async () => {
    if (syncState.isSyncing || !isOnline) {
      return;
    }

    setSyncState(prev => ({ ...prev, isSyncing: true, error: null }));

    try {
      // Fetch latest data from server
      const { participants: serverParticipants, scanLogs: serverScanLogs } = await fetchFromServer();

      // Merge with local data (server wins for conflicts)
      // But keep local-only items that haven't been synced yet
      const localOnlyParticipants = participants.filter(
        local => !serverParticipants.some(server => server.id === local.id)
      );
      const localOnlyScanLogs = scanLogs.filter(
        local => !local.synced && !serverScanLogs.some(server => server.id === local.id)
      );

      // Push local-only items to server
      for (const participant of localOnlyParticipants) {
        await pushParticipantToServer(participant);
      }
      for (const scanLog of localOnlyScanLogs) {
        await pushScanLogToServer(scanLog);
      }

      // Re-fetch to get the complete merged data
      const { participants: finalParticipants, scanLogs: finalScanLogs } = await fetchFromServer();

      // Update state
      setParticipants(finalParticipants);
      setScanLogs(finalScanLogs);

      // Save locally
      await saveLocalData(finalParticipants, finalScanLogs);

      // Update sync time
      const now = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, now);
      
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: now,
        error: null,
      }));
    } catch (error) {
      console.error("[useDatabaseSync] Sync failed:", error);
      setSyncState(prev => ({
        ...prev,
        isSyncing: false,
        error: error instanceof Error ? error.message : "Sync failed",
      }));
    }
  }, [syncState.isSyncing, isOnline, participants, scanLogs, fetchFromServer, pushParticipantToServer, pushScanLogToServer, saveLocalData]);

  // Add participant
  const addParticipant = useCallback(async (participantData: Omit<Participant, "id" | "qrToken">): Promise<Participant> => {
    const newParticipant: Participant = {
      ...participantData,
      id: generateUUID(),
      qrToken: generateQRToken(),
      createdAt: new Date().toISOString(),
    };

    // Add locally first
    const updatedParticipants = [...participants, newParticipant];
    setParticipants(updatedParticipants);
    await saveLocalData(updatedParticipants, scanLogs);

    // Push to server if online
    if (isOnline) {
      const success = await pushParticipantToServer(newParticipant);
      if (success) {
        // Sync to get any other updates
        setTimeout(() => syncNow(), 500);
      }
    }

    return newParticipant;
  }, [participants, scanLogs, isOnline, saveLocalData, pushParticipantToServer, syncNow]);

  // Add scan log
  const addScanLog = useCallback(async (
    participantId: string,
    checkpointId: number,
    deviceId?: string
  ): Promise<{ success: boolean; duplicate: boolean; scanLog?: ScanLog }> => {
    // Check for local duplicate within 10-minute rate limit
    const RATE_LIMIT_MS = 10 * 60 * 1000; // 10 minutes
    const now = new Date().getTime();
    
    const recentDuplicate = scanLogs.some(log => {
      if (log.participantId !== participantId || log.checkpointId !== checkpointId) {
        return false;
      }
      const logTime = new Date(log.timestamp).getTime();
      return (now - logTime) < RATE_LIMIT_MS;
    });

    if (recentDuplicate) {
      return { success: false, duplicate: true };
    }

    const newScanLog: ScanLog = {
      id: generateUUID(),
      participantId,
      checkpointId,
      timestamp: new Date().toISOString(),
      deviceId: deviceId || deviceIdRef.current,
      synced: false,
    };

    // Add locally first
    const updatedScanLogs = [...scanLogs, newScanLog];
    setScanLogs(updatedScanLogs);
    await saveLocalData(participants, updatedScanLogs);

    // Push to server if online
    if (isOnline) {
      const result = await pushScanLogToServer(newScanLog);
      
      if (result.duplicate) {
        // Remove from local if server says duplicate
        const filteredLogs = updatedScanLogs.filter(log => log.id !== newScanLog.id);
        setScanLogs(filteredLogs);
        await saveLocalData(participants, filteredLogs);
        return { success: false, duplicate: true };
      }
      
      if (result.success) {
        // Mark as synced
        const syncedLogs = updatedScanLogs.map(log =>
          log.id === newScanLog.id ? { ...log, synced: true } : log
        );
        setScanLogs(syncedLogs);
        await saveLocalData(participants, syncedLogs);
        
        // Sync to get any other updates from other devices
        setTimeout(() => syncNow(), 500);
      }
    }

    return { success: true, duplicate: false, scanLog: newScanLog };
  }, [participants, scanLogs, isOnline, saveLocalData, pushScanLogToServer, syncNow]);

  // Find participant by QR token
  const findByQrToken = useCallback((qrToken: string): Participant | undefined => {
    return participants.find(p => p.qrToken === qrToken);
  }, [participants]);

  // Get logs for participant
  const getLogsForParticipant = useCallback((participantId: string): ScanLog[] => {
    return scanLogs.filter(log => log.participantId === participantId);
  }, [scanLogs]);

  // Get logs for checkpoint
  const getLogsForCheckpoint = useCallback((checkpointId: number): ScanLog[] => {
    return scanLogs.filter(log => log.checkpointId === checkpointId);
  }, [scanLogs]);

  // Clear all data
  const clearAllData = useCallback(async () => {
    setParticipants([]);
    setScanLogs([]);
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.PARTICIPANTS),
      AsyncStorage.removeItem(STORAGE_KEYS.SCAN_LOGS),
      AsyncStorage.removeItem(STORAGE_KEYS.LAST_SYNC),
    ]);
  }, []);

  // Initial load
  useEffect(() => {
    loadLocalData().then(() => {
      // Sync with server after loading local data
      if (isOnline) {
        syncNow();
      }
    });
  }, []);

  // Update online status
  useEffect(() => {
    setSyncState(prev => ({ ...prev, isOnline }));
    
    // Sync when coming back online
    if (isOnline && !syncState.isSyncing) {
      syncNow();
    }
  }, [isOnline]);

  // Auto-sync every 30 seconds when online
  useEffect(() => {
    if (isOnline) {
      syncIntervalRef.current = setInterval(() => {
        syncNow();
      }, 30000); // 30 seconds
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isOnline, syncNow]);

  // Sync when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && isOnline) {
        syncNow();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription?.remove();
  }, [isOnline, syncNow]);

  return {
    participants,
    scanLogs,
    syncState,
    loading,
    addParticipant,
    addScanLog,
    syncNow,
    clearAllData,
    findByQrToken,
    getLogsForParticipant,
    getLogsForCheckpoint,
  };
}
