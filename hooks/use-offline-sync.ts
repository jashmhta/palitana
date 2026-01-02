/**
 * Offline-First Sync Hook
 * Handles network fluctuations and ensures data integrity across 20+ devices
 * 
 * Architecture:
 * 1. All scans are saved locally first (instant feedback)
 * 2. Background sync pushes to centralized database when online
 * 3. Periodic polling fetches updates from other devices
 * 4. Duplicate prevention at both local and server level
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { trpc } from "@/lib/trpc";
import { Participant, ScanLog } from "@/types";

// Storage keys
const STORAGE_KEYS = {
  PENDING_SCANS: "palitana_pending_scans",
  LOCAL_SCANS: "palitana_local_scans",
  LAST_SYNC: "palitana_last_sync",
  DEVICE_ID: "palitana_device_id",
  CACHED_PARTICIPANTS: "palitana_cached_participants",
  CACHED_SCAN_LOGS: "palitana_cached_scan_logs",
};

// Sync configuration - optimized for 25+ concurrent volunteers
const SYNC_CONFIG = {
  POLL_INTERVAL_ONLINE: 5000,    // 5 seconds when online - fast enough for real-time feel
  POLL_INTERVAL_OFFLINE: 30000,  // 30 seconds when offline (check connectivity)
  BASE_RETRY_DELAY: 1000,        // Base delay for exponential backoff (1 second)
  MAX_RETRY_DELAY: 30000,        // Maximum retry delay (30 seconds)
  MAX_RETRIES: 10,               // Max retries before marking as failed
  BATCH_SIZE: 50,                // Max scans to sync at once
};

/**
 * Calculate exponential backoff delay
 * @param retryCount - Number of retries so far
 * @returns Delay in milliseconds
 */
function getRetryDelay(retryCount: number): number {
  const delay = SYNC_CONFIG.BASE_RETRY_DELAY * Math.pow(2, retryCount);
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 500;
  return Math.min(delay + jitter, SYNC_CONFIG.MAX_RETRY_DELAY);
}

interface PendingScan {
  id: string;
  participantId: string;
  checkpointId: number;
  timestamp: string;
  deviceId: string;
  gpsLat?: number;
  gpsLng?: number;
  retryCount: number;
  createdAt: string;
}

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  error: string | null;
}

/**
 * Generate a unique device ID for this installation
 * Uses crypto.randomUUID for cryptographically secure IDs
 */
async function getOrCreateDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
  if (!deviceId) {
    // Use crypto.randomUUID for secure, unique device identification
    deviceId = `device-${crypto.randomUUID()}`;
    await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
}

/**
 * Main hook for offline-first sync functionality
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingScans, setPendingScans] = useState<PendingScan[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string>("");
  
  // Local cache for offline access
  const [cachedParticipants, setCachedParticipants] = useState<Participant[]>([]);
  const [cachedScanLogs, setCachedScanLogs] = useState<ScanLog[]>([]);
  
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // tRPC utilities
  const utils = trpc.useUtils();
  
  // Fetch scan logs from database with polling
  const { 
    data: dbScanLogs = [], 
    refetch: refetchScanLogs,
    isLoading: isLoadingScanLogs,
    isError: isScanLogsError,
  } = trpc.scanLogs.list.useQuery(
    undefined,
    {
      refetchInterval: isOnline ? SYNC_CONFIG.POLL_INTERVAL_ONLINE : false,
      staleTime: 2000,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    }
  );

  // Fetch participants from database
  const { 
    data: dbParticipants = [], 
    refetch: refetchParticipants,
    isLoading: isLoadingParticipants,
    isError: isParticipantsError,
  } = trpc.participants.list.useQuery(
    undefined,
    {
      refetchInterval: isOnline ? SYNC_CONFIG.POLL_INTERVAL_ONLINE : false,
      staleTime: 2000,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    }
  );

  // Create scan mutation
  const createScanMutation = trpc.scanLogs.create.useMutation({
    onSuccess: () => {
      utils.scanLogs.list.invalidate();
    },
  });

  // Map database participants to app format
  const apiParticipants: Participant[] = dbParticipants.map((p) => ({
    id: p.uuid,
    name: p.name,
    mobile: p.mobile || "",
    qrToken: p.qrToken,
    createdAt: p.createdAt?.toISOString(),
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
    gender: p.gender || undefined,
  }));
  
  // Use API data if available, otherwise fall back to cached data
  // This ensures offline functionality works
  const participants: Participant[] = apiParticipants.length > 0 ? apiParticipants : cachedParticipants;

  // Map database scan logs to app format
  const apiScanLogs: ScanLog[] = dbScanLogs.map((log) => ({
    id: log.uuid,
    participantId: log.participantUuid,
    checkpointId: log.checkpointId,
    timestamp: log.scannedAt.toISOString(),
    deviceId: log.deviceId || undefined,
    gpsLat: log.gpsLat ? parseFloat(log.gpsLat) : undefined,
    gpsLng: log.gpsLng ? parseFloat(log.gpsLng) : undefined,
    synced: true,
  }));
  
  // Use API data if available, otherwise fall back to cached data
  const scanLogs: ScanLog[] = apiScanLogs.length > 0 ? apiScanLogs : cachedScanLogs;

  // Combine with pending scans for complete view
  const allScanLogs: ScanLog[] = [
    ...scanLogs,
    ...pendingScans.map((p) => ({
      id: p.id,
      participantId: p.participantId,
      checkpointId: p.checkpointId,
      timestamp: p.timestamp,
      deviceId: p.deviceId,
      gpsLat: p.gpsLat,
      gpsLng: p.gpsLng,
      synced: false,
    })),
  ];

  /**
   * Initialize device ID and load pending scans
   */
  useEffect(() => {
    const init = async () => {
      const id = await getOrCreateDeviceId();
      setDeviceId(id);
      
      // Load pending scans from storage
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_SCANS);
      if (stored) {
        setPendingScans(JSON.parse(stored));
      }
      
      // Load last sync time
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      if (lastSync) {
        setLastSyncTime(new Date(lastSync));
      }
      
      // Load cached participants for offline access
      const cachedParts = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_PARTICIPANTS);
      if (cachedParts) {
        setCachedParticipants(JSON.parse(cachedParts));
      }
      
      // Load cached scan logs for offline access
      const cachedLogs = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_SCAN_LOGS);
      if (cachedLogs) {
        setCachedScanLogs(JSON.parse(cachedLogs));
      }
    };
    
    init();
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Update cache when API successfully fetches new data
   * This ensures offline access to the latest data
   */
  useEffect(() => {
    if (apiParticipants.length > 0) {
      // Save to cache for offline access
      AsyncStorage.setItem(
        STORAGE_KEYS.CACHED_PARTICIPANTS,
        JSON.stringify(apiParticipants)
      ).catch((err) => console.error("[OfflineSync] Failed to cache participants:", err));
      setCachedParticipants(apiParticipants);
    }
  }, [apiParticipants]);

  useEffect(() => {
    if (apiScanLogs.length > 0) {
      // Save to cache for offline access
      AsyncStorage.setItem(
        STORAGE_KEYS.CACHED_SCAN_LOGS,
        JSON.stringify(apiScanLogs)
      ).catch((err) => console.error("[OfflineSync] Failed to cache scan logs:", err));
      setCachedScanLogs(apiScanLogs);
    }
  }, [apiScanLogs]);

  /**
   * Monitor network connectivity
   */
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = state.isConnected && state.isInternetReachable !== false;
      setIsOnline(Boolean(online));
      
      // Trigger sync when coming back online
      if (online && pendingScans.length > 0) {
        syncPendingScans();
      }
    });

    // Check initial state
    NetInfo.fetch().then((state) => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });

    return () => unsubscribe();
  }, [pendingScans.length]);

  /**
   * Handle app state changes (background/foreground)
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active" && isOnline) {
        // Refresh data when app comes to foreground
        refetchScanLogs();
        refetchParticipants();
        
        // Sync pending scans
        if (pendingScans.length > 0) {
          syncPendingScans();
        }
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => subscription?.remove();
  }, [isOnline, pendingScans.length]);

  /**
   * Save pending scans to storage
   */
  const savePendingScans = useCallback(async (scans: PendingScan[]) => {
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_SCANS, JSON.stringify(scans));
    setPendingScans(scans);
  }, []);

  /**
   * Check for duplicate scan (same participant at same checkpoint)
   */
  const isDuplicateScan = useCallback(
    (participantId: string, checkpointId: number): boolean => {
      // Check in synced scans
      const inSynced = scanLogs.some(
        (log) => log.participantId === participantId && log.checkpointId === checkpointId
      );
      
      // Check in pending scans
      const inPending = pendingScans.some(
        (scan) => scan.participantId === participantId && scan.checkpointId === checkpointId
      );
      
      return inSynced || inPending;
    },
    [scanLogs, pendingScans]
  );

  /**
   * Add a new scan (offline-first)
   */
  const addScan = useCallback(
    async (
      participantId: string,
      checkpointId: number,
      gpsLat?: number,
      gpsLng?: number
    ): Promise<{ success: boolean; duplicate: boolean; scanLog?: ScanLog }> => {
      // Check for duplicate
      if (isDuplicateScan(participantId, checkpointId)) {
        return { success: false, duplicate: true };
      }

      const newScan: PendingScan = {
        id: crypto.randomUUID(),
        participantId,
        checkpointId,
        timestamp: new Date().toISOString(),
        deviceId,
        gpsLat,
        gpsLng,
        retryCount: 0,
        createdAt: new Date().toISOString(),
      };

      // Update state immediately (non-blocking for instant UI feedback)
      const updatedPending = [...pendingScans, newScan];
      setPendingScans(updatedPending);
      
      // Save to AsyncStorage in background (non-blocking)
      savePendingScans(updatedPending).catch((err) => {
        console.error("[OfflineSync] Failed to save pending scans:", err);
      });

      // Try to sync immediately if online (non-blocking)
      if (isOnline) {
        syncSingleScan(newScan);
      }

      return {
        success: true,
        duplicate: false,
        scanLog: {
          id: newScan.id,
          participantId: newScan.participantId,
          checkpointId: newScan.checkpointId,
          timestamp: newScan.timestamp,
          deviceId: newScan.deviceId,
          gpsLat: newScan.gpsLat,
          gpsLng: newScan.gpsLng,
          synced: false,
        },
      };
    },
    [deviceId, isOnline, isDuplicateScan, pendingScans, savePendingScans]
  );

  /**
   * Sync a single scan to the server
   */
  const syncSingleScan = useCallback(
    async (scan: PendingScan): Promise<boolean> => {
      try {
        const result = await createScanMutation.mutateAsync({
          uuid: scan.id,
          participantUuid: scan.participantId,
          checkpointId: scan.checkpointId,
          deviceId: scan.deviceId,
          gpsLat: scan.gpsLat?.toString() || null,
          gpsLng: scan.gpsLng?.toString() || null,
          scannedAt: scan.timestamp,
        });

        if (result.success || result.duplicate) {
          // Remove from pending queue
          const updated = pendingScans.filter((s) => s.id !== scan.id);
          await savePendingScans(updated);
          return true;
        }
        
        return false;
      } catch (error) {
        console.error("[OfflineSync] Failed to sync scan:", error);
        
        // Increment retry count
        const updated = pendingScans.map((s) =>
          s.id === scan.id ? { ...s, retryCount: s.retryCount + 1 } : s
        );
        
        // Remove scans that have exceeded max retries
        const filtered = updated.filter((s) => s.retryCount < SYNC_CONFIG.MAX_RETRIES);
        await savePendingScans(filtered);
        
        return false;
      }
    },
    [createScanMutation, pendingScans, savePendingScans]
  );

  /**
   * Sync all pending scans to the server with exponential backoff
   */
  const syncPendingScans = useCallback(async () => {
    if (!isOnline || isSyncing || pendingScans.length === 0) {
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      // Sort by retry count (prioritize scans with fewer retries)
      const sortedScans = [...pendingScans].sort((a, b) => a.retryCount - b.retryCount);
      const scansToSync = sortedScans.slice(0, SYNC_CONFIG.BATCH_SIZE);
      
      for (const scan of scansToSync) {
        if (!isMountedRef.current) break;
        
        // Apply exponential backoff based on retry count
        if (scan.retryCount > 0) {
          const delay = getRetryDelay(scan.retryCount);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
        
        const success = await syncSingleScan(scan);
        
        // Small delay between successful syncs to avoid overwhelming the server
        if (success) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      // Update last sync time
      const now = new Date();
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, now.toISOString());
      setLastSyncTime(now);
      
      // Refresh data from server
      await refetchScanLogs();
    } catch (error) {
      console.error("[OfflineSync] Sync failed:", error);
      setSyncError("Sync failed. Will retry automatically.");
    } finally {
      if (isMountedRef.current) {
        setIsSyncing(false);
      }
    }
  }, [isOnline, isSyncing, pendingScans, syncSingleScan, refetchScanLogs]);

  /**
   * Force a manual sync
   */
  const forceSync = useCallback(async () => {
    if (!isOnline) {
      setSyncError("No internet connection. Scans will sync when online.");
      return;
    }

    await syncPendingScans();
    await refetchScanLogs();
    await refetchParticipants();
  }, [isOnline, syncPendingScans, refetchScanLogs, refetchParticipants]);

  /**
   * Get sync status
   */
  const getSyncStatus = useCallback((): SyncStatus => {
    return {
      isOnline,
      isSyncing,
      pendingCount: pendingScans.length,
      lastSyncTime,
      error: syncError,
    };
  }, [isOnline, isSyncing, pendingScans.length, lastSyncTime, syncError]);

  /**
   * Find participant by QR token
   */
  const findByQrToken = useCallback(
    (qrToken: string) => {
      return participants.find((p) => p.qrToken === qrToken);
    },
    [participants]
  );

  /**
   * Get logs for a specific participant
   */
  const getLogsForParticipant = useCallback(
    (participantId: string) => {
      return allScanLogs.filter((log) => log.participantId === participantId);
    },
    [allScanLogs]
  );

  /**
   * Get logs for a specific checkpoint
   */
  const getLogsForCheckpoint = useCallback(
    (checkpointId: number) => {
      return allScanLogs.filter((log) => log.checkpointId === checkpointId);
    },
    [allScanLogs]
  );

  return {
    // Data
    participants,
    scanLogs: allScanLogs,
    
    // Status
    isOnline,
    isSyncing,
    pendingCount: pendingScans.length,
    lastSyncTime,
    syncError,
    deviceId,
    
    // Loading states
    isLoading: isLoadingScanLogs || isLoadingParticipants,
    isLoadingParticipants,
    isLoadingScanLogs,
    isError: isScanLogsError || isParticipantsError,
    
    // Actions
    addScan,
    forceSync,
    findByQrToken,
    getLogsForParticipant,
    getLogsForCheckpoint,
    getSyncStatus,
    
    // Reload functions
    reload: async () => {
      await refetchScanLogs();
      await refetchParticipants();
    },
  };
}

/**
 * Hook for just the sync status (lightweight)
 */
export function useSyncStatusOnly() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });

    // Load pending count
    AsyncStorage.getItem(STORAGE_KEYS.PENDING_SCANS).then((stored) => {
      if (stored) {
        const pending = JSON.parse(stored);
        setPendingCount(pending.length);
      }
    });

    return () => unsubscribe();
  }, []);

  return { isOnline, pendingCount };
}
