/**
 * Unified Data Hook
 * Provides a single source of truth for participants and scan logs
 * with automatic database synchronization
 * 
 * This hook resolves the issue where local storage and database
 * were operating independently, causing data inconsistencies.
 */

import { useCallback, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Participant, ScanLog } from "@/types";
import { DEFAULT_CHECKPOINTS } from "@/constants/checkpoints";

interface AddParticipantInput {
  name: string;
  mobile: string;
  groupName?: string;
  emergencyContact?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  notes?: string;
  photoUri?: string;
  bloodGroup?: string;
  medicalConditions?: string;
  allergies?: string;
  medications?: string;
  age?: number;
  gender?: "male" | "female" | "other";
}

/**
 * Generate a unique QR token
 * Uses a combination of timestamp and random characters for guaranteed uniqueness
 * Format: PYT-XXXXXX (6 alphanumeric characters)
 */
function generateQRToken(existingTokens: string[]): string {
  const existingSet = new Set(existingTokens);
  
  // Generate a unique token with retry logic
  let attempts = 0;
  const maxAttempts = 100;
  
  while (attempts < maxAttempts) {
    // Use timestamp base36 + random characters for uniqueness
    const timestamp = Date.now().toString(36).slice(-4).toUpperCase();
    const random = Math.random().toString(36).slice(2, 4).toUpperCase();
    const token = `PYT-${timestamp}${random}`;
    
    if (!existingSet.has(token)) {
      return token;
    }
    
    attempts++;
  }
  
  // Fallback: Use full UUID if all attempts fail (extremely unlikely)
  const uuid = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `PYT-${uuid}`;
}

/**
 * Main unified data hook
 * Use this instead of separate useParticipants/useScanLogs for database-synced data
 */
export function useUnifiedData() {
  const utils = trpc.useUtils();

  // Fetch participants from database
  const { 
    data: dbParticipants = [], 
    isLoading: participantsLoading,
    refetch: refetchParticipants,
  } = trpc.participants.list.useQuery(undefined, {
    refetchInterval: 5000, // Poll every 5 seconds
    staleTime: 2000,
  });

  // Fetch scan logs from database
  const { 
    data: dbScanLogs = [], 
    isLoading: scanLogsLoading,
    refetch: refetchScanLogs,
  } = trpc.scanLogs.list.useQuery(undefined, {
    refetchInterval: 5000,
    staleTime: 2000,
  });

  // Mutations
  const createParticipantMutation = trpc.participants.upsert.useMutation({
    onSuccess: () => {
      utils.participants.list.invalidate();
    },
  });

  const createScanLogMutation = trpc.scanLogs.create.useMutation({
    onSuccess: () => {
      utils.scanLogs.list.invalidate();
    },
  });

  // Map database participants to app format
  const participants: Participant[] = useMemo(() => 
    dbParticipants.map((p) => ({
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
    })),
    [dbParticipants]
  );

  // Map database scan logs to app format
  const scanLogs: ScanLog[] = useMemo(() =>
    dbScanLogs.map((log) => ({
      id: log.uuid,
      participantId: log.participantUuid,
      checkpointId: log.checkpointId,
      timestamp: log.scannedAt.toISOString(),
      deviceId: log.deviceId || undefined,
      gpsLat: log.gpsLat ? parseFloat(log.gpsLat) : undefined,
      gpsLng: log.gpsLng ? parseFloat(log.gpsLng) : undefined,
      synced: true,
    })),
    [dbScanLogs]
  );

  /**
   * Add a new participant to the database
   * This ensures all volunteers see the new participant immediately
   */
  const addParticipant = useCallback(
    async (input: AddParticipantInput): Promise<{ success: boolean; participant?: Participant; error?: string }> => {
      try {
        // Validate required fields
        if (!input.name.trim()) {
          return { success: false, error: "Name is required" };
        }

        // Generate UUID and QR token
        const uuid = crypto.randomUUID();
        const existingTokens = participants.map(p => p.qrToken);
        const qrToken = generateQRToken(existingTokens);

        // Create participant in database
        await createParticipantMutation.mutateAsync({
          uuid,
          name: input.name.trim(),
          mobile: input.mobile?.trim() || null,
          qrToken,
          groupName: input.groupName || null,
          emergencyContact: input.emergencyContact || null,
          emergencyContactName: input.emergencyContactName || null,
          emergencyContactRelation: input.emergencyContactRelation || null,
          notes: input.notes || null,
          photoUri: input.photoUri || null,
          bloodGroup: input.bloodGroup || null,
          medicalConditions: input.medicalConditions || null,
          allergies: input.allergies || null,
          medications: input.medications || null,
          age: input.age || null,
          gender: input.gender || null,
        });

        // Refresh participants list
        await refetchParticipants();

        const newParticipant: Participant = {
          id: uuid,
          name: input.name.trim(),
          mobile: input.mobile?.trim() || "",
          qrToken,
          createdAt: new Date().toISOString(),
        };

        return { success: true, participant: newParticipant };
      } catch (error) {
        console.error("[useUnifiedData] Failed to add participant:", error);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Failed to add participant" 
        };
      }
    },
    [participants, createParticipantMutation, refetchParticipants]
  );

  /**
   * Add a scan log to the database
   */
  const addScan = useCallback(
    async (
      participantId: string,
      checkpointId: number,
      deviceId?: string,
      gpsLat?: number,
      gpsLng?: number
    ): Promise<{ success: boolean; duplicate: boolean; scanLog?: ScanLog }> => {
      try {
        // Check for duplicate locally first (faster)
        const isDuplicate = scanLogs.some(
          log => log.participantId === participantId && log.checkpointId === checkpointId
        );

        if (isDuplicate) {
          return { success: false, duplicate: true };
        }

        const uuid = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        const result = await createScanLogMutation.mutateAsync({
          uuid,
          participantUuid: participantId,
          checkpointId,
          deviceId: deviceId || null,
          gpsLat: gpsLat?.toString() || null,
          gpsLng: gpsLng?.toString() || null,
          scannedAt: timestamp,
        });

        if (result.duplicate) {
          return { success: false, duplicate: true };
        }

        // Refresh scan logs
        await refetchScanLogs();

        return {
          success: true,
          duplicate: false,
          scanLog: {
            id: uuid,
            participantId,
            checkpointId,
            timestamp,
            deviceId,
            gpsLat,
            gpsLng,
            synced: true,
          },
        };
      } catch (error) {
        console.error("[useUnifiedData] Failed to add scan:", error);
        return { success: false, duplicate: false };
      }
    },
    [scanLogs, createScanLogMutation, refetchScanLogs]
  );

  /**
   * Find participant by QR token
   */
  const findByQrToken = useCallback(
    (qrToken: string) => participants.find(p => p.qrToken === qrToken),
    [participants]
  );

  /**
   * Get logs for a specific participant
   */
  const getLogsForParticipant = useCallback(
    (participantId: string) => scanLogs.filter(log => log.participantId === participantId),
    [scanLogs]
  );

  /**
   * Get logs for a specific checkpoint
   */
  const getLogsForCheckpoint = useCallback(
    (checkpointId: number) => scanLogs.filter(log => log.checkpointId === checkpointId),
    [scanLogs]
  );

  /**
   * Force refresh all data
   */
  const refresh = useCallback(async () => {
    await Promise.all([refetchParticipants(), refetchScanLogs()]);
  }, [refetchParticipants, refetchScanLogs]);

  /**
   * Get statistics
   */
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const todayScans = scanLogs.filter(log => new Date(log.timestamp) >= today);
    
    const checkpointStats = DEFAULT_CHECKPOINTS.map(cp => ({
      ...cp,
      scanCount: scanLogs.filter(log => log.checkpointId === cp.id).length,
      percentage: participants.length > 0 
        ? Math.round((scanLogs.filter(log => log.checkpointId === cp.id).length / participants.length) * 100)
        : 0,
    }));

    return {
      totalParticipants: participants.length,
      totalScans: scanLogs.length,
      todayScans: todayScans.length,
      checkpointStats,
    };
  }, [participants, scanLogs]);

  return {
    // Data
    participants,
    scanLogs,
    
    // Loading states
    isLoading: participantsLoading || scanLogsLoading,
    participantsLoading,
    scanLogsLoading,
    
    // Actions
    addParticipant,
    addScan,
    findByQrToken,
    getLogsForParticipant,
    getLogsForCheckpoint,
    refresh,
    
    // Statistics
    stats,
    
    // Mutation states
    isAddingParticipant: createParticipantMutation.isPending,
    isAddingScan: createScanLogMutation.isPending,
  };
}
