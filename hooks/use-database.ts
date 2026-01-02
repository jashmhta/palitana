/**
 * Database-backed hooks using tRPC for centralized data sync
 */

import { useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Participant, ScanLog, ParticipantWithProgress } from "@/types";
import { TOTAL_CHECKPOINTS } from "@/constants/checkpoints";

/**
 * Hook for managing participants from centralized database
 */
export function useParticipantsDB() {
  const { data: dbParticipants = [], isLoading, refetch } = trpc.participants.list.useQuery();
  
  // Map database participants to app Participant type
  const participants: Participant[] = dbParticipants.map(p => ({
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
  const upsertMutation = trpc.participants.upsert.useMutation();
  const deleteMutation = trpc.participants.delete.useMutation();
  const bulkUpsertMutation = trpc.participants.bulkUpsert.useMutation();

  const addParticipant = useCallback(
    async (participant: Omit<Participant, "id">) => {
      await upsertMutation.mutateAsync(participant as any);
      await refetch();
    },
    [upsertMutation, refetch]
  );

  const updateParticipant = useCallback(
    async (uuid: string, updates: Partial<Participant>) => {
      const existing = dbParticipants.find(p => p.uuid === uuid);
      if (!existing) throw new Error("Participant not found");
      
      await upsertMutation.mutateAsync({
        ...existing,
        ...updates,
      } as any);
      await refetch();
    },
    [participants, upsertMutation, refetch]
  );

  const deleteParticipant = useCallback(
    async (uuid: string) => {
      await deleteMutation.mutateAsync({ uuid });
      await refetch();
    },
    [deleteMutation, refetch]
  );

  const bulkAddParticipants = useCallback(
    async (newParticipants: Participant[]) => {
      await bulkUpsertMutation.mutateAsync({ participants: newParticipants as any });
      await refetch();
    },
    [bulkUpsertMutation, refetch]
  );

  const clearAllParticipants = useCallback(
    async () => {
      // Delete all participants one by one
      for (const participant of dbParticipants) {
        await deleteMutation.mutateAsync({ uuid: participant.uuid });
      }
      await refetch();
    },
    [participants, deleteMutation, refetch]
  );

  return {
    participants,
    loading: isLoading,
    reload: refetch,
    addParticipant,
    updateParticipant,
    deleteParticipant,
    bulkAddParticipants,
    clearAllParticipants,
  };
}

/**
 * Hook for managing scan logs from centralized database
 */
export function useScanLogsDB() {
  const { data: dbScanLogs = [], isLoading, refetch } = trpc.scanLogs.list.useQuery();
  
  // Map database scan logs to app ScanLog type
  const scanLogs: ScanLog[] = dbScanLogs.map(log => ({
    id: log.uuid,
    participantId: log.participantUuid,
    checkpointId: log.checkpointId,
    timestamp: log.scannedAt.toISOString(),
    deviceId: log.deviceId || undefined,
    gpsLat: log.gpsLat ? parseFloat(log.gpsLat) : undefined,
    gpsLng: log.gpsLng ? parseFloat(log.gpsLng) : undefined,
    synced: true,
  }));
  const createMutation = trpc.scanLogs.create.useMutation();
  const bulkCreateMutation = trpc.scanLogs.bulkCreate.useMutation();

  const addScanLog = useCallback(
    async (scanLog: Omit<ScanLog, "id">) => {
      await createMutation.mutateAsync({
        uuid: crypto.randomUUID(),
        participantUuid: scanLog.participantId,
        checkpointId: scanLog.checkpointId,
        deviceId: scanLog.deviceId || null,
        gpsLat: scanLog.gpsLat?.toString() || null,
        gpsLng: scanLog.gpsLng?.toString() || null,
        scannedAt: scanLog.timestamp,
      });
      await refetch();
    },
    [createMutation, refetch]
  );

  const bulkAddScanLogs = useCallback(
    async (logs: ScanLog[]) => {
      await bulkCreateMutation.mutateAsync({
        scanLogs: logs.map(log => ({
          uuid: log.id || crypto.randomUUID(),
          participantUuid: log.participantId,
          checkpointId: log.checkpointId,
          deviceId: log.deviceId || null,
          gpsLat: log.gpsLat?.toString() || null,
          gpsLng: log.gpsLng?.toString() || null,
          scannedAt: log.timestamp,
        })),
      });
      await refetch();
    },
    [bulkCreateMutation, refetch]
  );

  return {
    scanLogs,
    loading: isLoading,
    reload: refetch,
    addScanLog,
    bulkAddScanLogs,
  };
}

/**
 * Get participants with their progress
 */
export function getParticipantsWithProgress(
  participants: Participant[],
  scanLogs: ScanLog[]
): ParticipantWithProgress[] {
  return participants.map((participant) => {
      const participantLogs = scanLogs.filter(
      (log) => log.participantId === participant.id
    );

    const checkpointsReached = participantLogs.length;
    const progress = (checkpointsReached / TOTAL_CHECKPOINTS) * 100;
    const lastCheckpoint = participantLogs.length > 0
      ? Math.max(...participantLogs.map((log) => log.checkpointId))
      : null;
    const lastScanTime = participantLogs.length > 0
      ? participantLogs.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0].timestamp
      : null;

    return {
      ...participant,
      scannedCheckpoints: participantLogs.map(log => log.checkpointId),
      totalScans: participantLogs.length,
      lastScanTime: lastScanTime || undefined,
    };
  });
}
