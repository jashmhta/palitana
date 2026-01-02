/**
 * Centralized Sync Service
 * Handles real-time sync with Google Sheets and duplicate prevention
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Participant, ScanLog, Volunteer, AppSettings } from "@/types";

const SYNC_QUEUE_KEY = "@palitana_sync_queue";
const LAST_SYNC_KEY = "@palitana_last_sync";

interface SyncQueueItem {
  id: string;
  type: "scan" | "participant" | "volunteer";
  action: "create" | "update" | "delete";
  data: ScanLog | Participant | Volunteer;
  timestamp: string;
  retryCount: number;
}

interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: string | null;
  pendingCount: number;
  isSyncing: boolean;
}

class SyncService {
  private syncQueue: SyncQueueItem[] = [];
  private isSyncing = false;
  private listeners: ((status: SyncStatus) => void)[] = [];

  /**
   * Initialize the sync service
   */
  async init(): Promise<void> {
    try {
      const queueData = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (queueData) {
        this.syncQueue = JSON.parse(queueData);
      }
    } catch (error) {
      console.error("[SyncService] Failed to load sync queue:", error);
    }
  }

  /**
   * Add a listener for sync status changes
   */
  addListener(callback: (status: SyncStatus) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    const status = this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return {
      isOnline: true, // Will be updated by network hook
      lastSyncTime: null,
      pendingCount: this.syncQueue.length,
      isSyncing: this.isSyncing,
    };
  }

  /**
   * Check for duplicate scan at the same checkpoint
   * Returns true if duplicate exists
   */
  async checkDuplicateScan(
    participantId: string,
    checkpointId: number,
    existingLogs: ScanLog[]
  ): Promise<{ isDuplicate: boolean; existingLog?: ScanLog }> {
    // Check local logs first
    const existingLog = existingLogs.find(
      log => log.participantId === participantId && log.checkpointId === checkpointId
    );

    if (existingLog) {
      return { isDuplicate: true, existingLog };
    }

    // Check pending queue for unsynced duplicates
    const pendingDuplicate = this.syncQueue.find(
      item =>
        item.type === "scan" &&
        item.action === "create" &&
        (item.data as ScanLog).participantId === participantId &&
        (item.data as ScanLog).checkpointId === checkpointId
    );

    if (pendingDuplicate) {
      return { isDuplicate: true, existingLog: pendingDuplicate.data as ScanLog };
    }

    return { isDuplicate: false };
  }

  /**
   * Add a scan log to the sync queue
   */
  async queueScan(scanLog: ScanLog): Promise<void> {
    const queueItem: SyncQueueItem = {
      id: scanLog.id,
      type: "scan",
      action: "create",
      data: scanLog,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    this.syncQueue.push(queueItem);
    await this.saveQueue();
    this.notifyListeners();
  }

  /**
   * Add a participant to the sync queue
   */
  async queueParticipant(participant: Participant, action: "create" | "update" = "create"): Promise<void> {
    const queueItem: SyncQueueItem = {
      id: participant.id,
      type: "participant",
      action,
      data: participant,
      timestamp: new Date().toISOString(),
      retryCount: 0,
    };

    this.syncQueue.push(queueItem);
    await this.saveQueue();
    this.notifyListeners();
  }

  /**
   * Save the sync queue to storage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error("[SyncService] Failed to save sync queue:", error);
    }
  }

  /**
   * Process the sync queue
   * Called when device comes online or manually triggered
   */
  async processQueue(settings: AppSettings): Promise<{ success: number; failed: number }> {
    if (this.isSyncing || this.syncQueue.length === 0) {
      return { success: 0, failed: 0 };
    }

    if (!settings.googleSheetsId) {
      console.log("[SyncService] No Google Sheet ID configured, skipping sync");
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.notifyListeners();

    let success = 0;
    let failed = 0;

    const itemsToProcess = [...this.syncQueue];

    for (const item of itemsToProcess) {
      try {
        await this.syncItem(item, settings);
        // Remove from queue on success
        this.syncQueue = this.syncQueue.filter(q => q.id !== item.id || q.timestamp !== item.timestamp);
        success++;
      } catch (error) {
        console.error(`[SyncService] Failed to sync item ${item.id}:`, error);
        // Increment retry count
        const queueItem = this.syncQueue.find(q => q.id === item.id && q.timestamp === item.timestamp);
        if (queueItem) {
          queueItem.retryCount++;
          // Remove items that have failed too many times
          if (queueItem.retryCount >= 5) {
            this.syncQueue = this.syncQueue.filter(q => q !== queueItem);
            console.warn(`[SyncService] Removed item ${item.id} after 5 failed attempts`);
          }
        }
        failed++;
      }
    }

    await this.saveQueue();
    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

    this.isSyncing = false;
    this.notifyListeners();

    return { success, failed };
  }

  /**
   * Sync a single item to Google Sheets
   */
  private async syncItem(item: SyncQueueItem, settings: AppSettings): Promise<void> {
    const { googleSheetsId } = settings;

    if (!googleSheetsId) {
      throw new Error("Google Sheet ID not configured");
    }

    // For now, we'll use the Google Sheets API directly
    // In production, you'd want to use a proper backend service
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${googleSheetsId}`;

    switch (item.type) {
      case "scan": {
        const scanLog = item.data as ScanLog;
        const row: string[] = [
          scanLog.id,
          scanLog.participantId,
          scanLog.checkpointId.toString(),
          scanLog.timestamp,
          scanLog.deviceId || "",
          scanLog.synced ? "true" : "false",
        ];

        // Append to ScanLogs sheet
        await this.appendRow(baseUrl, "ScanLogs", row, googleSheetsId);
        break;
      }

      case "participant": {
        const participant = item.data as Participant;
        const row = [
          participant.id,
          participant.name,
          participant.mobile,
          participant.qrToken,
          participant.createdAt,
          (participant as any).group || "",
          (participant as any).emergencyContact || "",
          (participant as any).photoUri || "",
        ];

        if (item.action === "create") {
          await this.appendRow(baseUrl, "Participants", row, googleSheetsId);
        }
        break;
      }

      default:
        console.warn(`[SyncService] Unknown item type: ${item.type}`);
    }
  }

  /**
   * Append a row to a Google Sheet
   */
  private async appendRow(
    baseUrl: string,
    sheetName: string,
    row: string[],
    apiKey?: string
  ): Promise<void> {
    const url = `${baseUrl}/values/${sheetName}:append?valueInputOption=RAW${apiKey ? `&key=${apiKey}` : ""}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [row],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to append row: ${error}`);
    }
  }

  /**
   * Fetch latest data from Google Sheets
   * Used for real-time sync across devices
   */
  async fetchLatestScans(settings: AppSettings): Promise<ScanLog[]> {
    if (!settings.googleSheetsId) {
      return [];
    }

    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${settings.googleSheetsId}/values/ScanLogs${settings.googleSheetsId ? `?key=${settings.googleSheetsId}` : ""}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch scan logs");
      }

      const data = await response.json();
      const rows = data.values || [];

      // Skip header row
      return rows.slice(1).map((row: string[]) => ({
        id: row[0],
        participantId: row[1],
        checkpointId: parseInt(row[2], 10),
        timestamp: row[3],
        deviceId: row[4],
        volunteerId: row[5] || undefined,
        synced: row[6] === "true",
      }));
    } catch (error) {
      console.error("[SyncService] Failed to fetch latest scans:", error);
      return [];
    }
  }

  /**
   * Clear the sync queue (use with caution)
   */
  async clearQueue(): Promise<void> {
    this.syncQueue = [];
    await this.saveQueue();
    this.notifyListeners();
  }

  /**
   * Get pending items count
   */
  getPendingCount(): number {
    return this.syncQueue.length;
  }

  /**
   * Get all pending items (for debugging)
   */
  getPendingItems(): SyncQueueItem[] {
    return [...this.syncQueue];
  }
}

// Export singleton instance
export const syncService = new SyncService();
