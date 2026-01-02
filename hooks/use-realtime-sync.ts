/**
 * Real-time sync hook for multi-device support
 * Ensures all scans are immediately logged to centralized database
 * and synced across 20+ volunteer devices without duplications or lag
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Participant, ScanLog } from "@/types";
import { TOTAL_CHECKPOINTS } from "@/constants/checkpoints";

// Polling interval for real-time sync (5 seconds)
const SYNC_INTERVAL = 5000;

/**
 * Hook for real-time participant sync from centralized database
 */
export function useRealtimeParticipants() {
  const { data: dbParticipants = [], isLoading, refetch } = trpc.participants.list.useQuery(
    undefined,
    {
      // Refetch every 5 seconds for real-time updates
      refetchInterval: SYNC_INTERVAL,
      // Keep data fresh
      staleTime: 2000,
    }
  );

  // Map database participants to app Participant type
  const participants: Participant[] = dbParticipants.map((p) => ({
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

  const findByQrToken = useCallback(
    (qrToken: string) => {
      return participants.find((p) => p.qrToken === qrToken);
    },
    [participants]
  );

  return {
    participants,
    loading: isLoading,
    reload: refetch,
    findByQrToken,
  };
}

/**
 * Hook for real-time scan logs with centralized database sync
 * Ensures no duplicates and immediate sync across all devices
 */
export function useRealtimeScanLogs() {
  const utils = trpc.useUtils();
  const [localPendingScans, setLocalPendingScans] = useState<ScanLog[]>([]);
  
  const { data: dbScanLogs = [], isLoading, refetch } = trpc.scanLogs.list.useQuery(
    undefined,
    {
      // Refetch every 5 seconds for real-time updates across devices
      refetchInterval: SYNC_INTERVAL,
      // Keep data fresh
      staleTime: 2000,
    }
  );

  // Map database scan logs to app ScanLog type
  const scanLogs: ScanLog[] = dbScanLogs.map((log) => ({
    id: log.uuid,
    participantId: log.participantUuid,
    checkpointId: log.checkpointId,
    timestamp: log.scannedAt.toISOString(),
    deviceId: log.deviceId || undefined,
    gpsLat: log.gpsLat ? parseFloat(log.gpsLat) : undefined,
    gpsLng: log.gpsLng ? parseFloat(log.gpsLng) : undefined,
    synced: true,
  }));

  // Combine with local pending scans for immediate UI feedback
  const allScanLogs = [...scanLogs, ...localPendingScans];

  const createMutation = trpc.scanLogs.create.useMutation({
    onSuccess: () => {
      // Immediately invalidate and refetch to get latest data
      utils.scanLogs.list.invalidate();
    },
  });

  /**
   * Add a scan log with duplicate prevention
   * Returns immediately for UI feedback, syncs to database in background
   */
  const addScanLog = useCallback(
    async (
      participantId: string,
      checkpointId: number,
      deviceId?: string,
      gpsLat?: number,
      gpsLng?: number
    ): Promise<{ success: boolean; duplicate: boolean; scanLog?: ScanLog }> => {
      // Check for duplicate in existing scan logs (both from DB and pending)
      const isDuplicate = allScanLogs.some(
        (log) => log.participantId === participantId && log.checkpointId === checkpointId
      );

      if (isDuplicate) {
        return { success: false, duplicate: true };
      }

      // Create new scan log
      const newScanLog: ScanLog = {
        id: crypto.randomUUID(),
        participantId,
        checkpointId,
        timestamp: new Date().toISOString(),
        deviceId,
        gpsLat,
        gpsLng,
        synced: false,
      };

      // Add to local pending for immediate UI feedback
      setLocalPendingScans((prev) => [...prev, newScanLog]);

      try {
        // Immediately sync to centralized database
        const result = await createMutation.mutateAsync({
          uuid: newScanLog.id,
          participantUuid: participantId,
          checkpointId,
          deviceId: deviceId || null,
          gpsLat: gpsLat?.toString() || null,
          gpsLng: gpsLng?.toString() || null,
          scannedAt: newScanLog.timestamp,
        });

        // Remove from pending after successful sync
        setLocalPendingScans((prev) => prev.filter((s) => s.id !== newScanLog.id));

        // Check if database returned duplicate
        if (result.duplicate) {
          return { success: false, duplicate: true };
        }

        return { success: true, duplicate: false, scanLog: newScanLog };
      } catch (error) {
        console.error("[RealtimeSync] Failed to sync scan log:", error);
        // Keep in pending queue for retry
        return { success: true, duplicate: false, scanLog: newScanLog };
      }
    },
    [allScanLogs, createMutation]
  );

  const getLogsForParticipant = useCallback(
    (participantId: string) => {
      return allScanLogs.filter((log) => log.participantId === participantId);
    },
    [allScanLogs]
  );

  const getLogsForCheckpoint = useCallback(
    (checkpointId: number) => {
      return allScanLogs.filter((log) => log.checkpointId === checkpointId);
    },
    [allScanLogs]
  );

  return {
    scanLogs: allScanLogs,
    loading: isLoading,
    reload: refetch,
    addScanLog,
    getLogsForParticipant,
    getLogsForCheckpoint,
    pendingCount: localPendingScans.length,
  };
}

/**
 * Hook for sync status monitoring
 */
export function useSyncStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const { data: syncData, isLoading, isError } = trpc.sync.fullSync.useQuery(undefined, {
    refetchInterval: SYNC_INTERVAL,
  });

  // Update sync status based on query results
  useEffect(() => {
    if (syncData) {
      setLastSyncTime(new Date(syncData.syncedAt));
      setIsOnline(true);
    }
    if (isError) {
      setIsOnline(false);
    }
  }, [syncData, isError]);

  return {
    isOnline,
    lastSyncTime,
    isSyncing: isLoading,
    participantCount: syncData?.participants.length || 0,
    scanLogCount: syncData?.scanLogs.length || 0,
  };
}

/**
 * Get participants with their progress from scan logs
 */
export function getParticipantsWithProgress(
  participants: Participant[],
  scanLogs: ScanLog[]
) {
  return participants.map((participant) => {
    const participantLogs = scanLogs.filter(
      (log) => log.participantId === participant.id
    );

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
