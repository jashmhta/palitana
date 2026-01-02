/**
 * Jatra Calculator Utility
 * 
 * Calculates the number of complete Jatras (round trips) for each pilgrim
 * based on their scan logs at checkpoints.
 * 
 * Jatra Logic:
 * - Checkpoint 1 (Aamli): Midway point on descent
 * - Checkpoint 2 (Gheti): Bottom of Gheti route - EVEN scans here = Jatra complete
 * - Checkpoint 3 (X): Front side route (final descent of day)
 * 
 * A complete Jatra = Pilgrim descended via Gheti route (scanned at Gheti)
 * Even number of Gheti scans = that many complete Jatras
 */

import { ScanLog } from "@/types";

// Checkpoint IDs
const CHECKPOINT_GHETI = 2; // Gheti is checkpoint 2

export interface JatraStats {
  participantId: string;
  totalJatras: number;
  ghetiScans: number;
  aamliScans: number;
  frontSideScans: number;
  lastScanTime: string | null;
  isCurrentlyDescending: boolean; // Odd Aamli scans = currently descending
}

/**
 * Calculate Jatra count for a single participant
 * @param participantId - The participant's UUID
 * @param scanLogs - All scan logs (will be filtered for this participant)
 * @returns JatraStats object with complete statistics
 */
export function calculateJatraStats(
  participantId: string,
  scanLogs: ScanLog[]
): JatraStats {
  // Filter logs for this participant
  const participantLogs = scanLogs
    .filter((log) => log.participantId === participantId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Count scans at each checkpoint
  const ghetiScans = participantLogs.filter((log) => log.checkpointId === 2).length;
  const aamliScans = participantLogs.filter((log) => log.checkpointId === 1).length;
  const frontSideScans = participantLogs.filter((log) => log.checkpointId === 3).length;

  // Each scan at Gheti = 1 Jatra complete (they reached the bottom)
  // This is the primary metric for Jatra counting
  const totalJatras = ghetiScans;

  // Get last scan time
  const lastScan = participantLogs[participantLogs.length - 1];
  const lastScanTime = lastScan?.timestamp || null;

  // Determine if currently descending (odd Aamli scans without matching Gheti)
  // If Aamli scans > Gheti scans, pilgrim is currently between Aamli and Gheti
  const isCurrentlyDescending = aamliScans > ghetiScans;

  return {
    participantId,
    totalJatras,
    ghetiScans,
    aamliScans,
    frontSideScans,
    lastScanTime,
    isCurrentlyDescending,
  };
}

/**
 * Calculate Jatra stats for all participants
 * @param participantIds - Array of participant UUIDs
 * @param scanLogs - All scan logs
 * @returns Map of participantId to JatraStats
 */
export function calculateAllJatraStats(
  participantIds: string[],
  scanLogs: ScanLog[]
): Map<string, JatraStats> {
  const statsMap = new Map<string, JatraStats>();

  for (const participantId of participantIds) {
    statsMap.set(participantId, calculateJatraStats(participantId, scanLogs));
  }

  return statsMap;
}

/**
 * Get participants sorted by Jatra count (leaderboard)
 * @param participantIds - Array of participant UUIDs
 * @param scanLogs - All scan logs
 * @returns Array of JatraStats sorted by totalJatras descending
 */
export function getJatraLeaderboard(
  participantIds: string[],
  scanLogs: ScanLog[]
): JatraStats[] {
  const allStats = participantIds.map((id) => calculateJatraStats(id, scanLogs));
  return allStats
    .filter((stats) => stats.totalJatras > 0)
    .sort((a, b) => b.totalJatras - a.totalJatras);
}

/**
 * Get participants currently in transit (between checkpoints)
 * These are pilgrims who have been scanned at Aamli but not yet at Gheti
 * @param participantIds - Array of participant UUIDs
 * @param scanLogs - All scan logs
 * @returns Array of participantIds currently descending
 */
export function getParticipantsInTransit(
  participantIds: string[],
  scanLogs: ScanLog[]
): string[] {
  return participantIds.filter((id) => {
    const stats = calculateJatraStats(id, scanLogs);
    return stats.isCurrentlyDescending;
  });
}

/**
 * Format Jatra count for display
 * @param count - Number of Jatras
 * @returns Formatted string (e.g., "3 Jatras" or "1 Jatra")
 */
export function formatJatraCount(count: number): string {
  if (count === 0) return "No Jatras";
  if (count === 1) return "1 Jatra";
  return `${count} Jatras`;
}

/**
 * Get Jatra status text for display
 * @param stats - JatraStats object
 * @returns Human-readable status string
 */
export function getJatraStatusText(stats: JatraStats): string {
  if (stats.isCurrentlyDescending) {
    return `${formatJatraCount(stats.totalJatras)} • Currently descending`;
  }
  if (stats.totalJatras === 0 && stats.aamliScans === 0) {
    return "Not started";
  }
  return formatJatraCount(stats.totalJatras);
}
