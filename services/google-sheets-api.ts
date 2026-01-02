/**
 * Google Sheets Direct API Integration
 * Provides real-time read/write access to Google Sheets for centralized data management
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Participant, ScanLog } from "@/types";

const GOOGLE_SHEETS_CONFIG_KEY = "@palitana_google_sheets_config";

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  apiKey: string;
  isConnected: boolean;
  lastSyncTime: string | null;
  sheetsSetup: {
    participants: boolean;
    scanLogs: boolean;
    checkpoints: boolean;
  };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _SheetRange {
  sheetName: string;
  range?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _SheetData {
  values: string[][];
}

class GoogleSheetsAPI {
  private config: GoogleSheetsConfig | null = null;
  private baseUrl = "https://sheets.googleapis.com/v4/spreadsheets";

  /**
   * Initialize the Google Sheets API service
   */
  async init(): Promise<void> {
    try {
      const configData = await AsyncStorage.getItem(GOOGLE_SHEETS_CONFIG_KEY);
      if (configData) {
        this.config = JSON.parse(configData);
      }
    } catch (error) {
      console.error("[GoogleSheetsAPI] Failed to load config:", error);
    }
  }

  /**
   * Save configuration
   */
  async saveConfig(config: GoogleSheetsConfig): Promise<void> {
    this.config = config;
    await AsyncStorage.setItem(GOOGLE_SHEETS_CONFIG_KEY, JSON.stringify(config));
  }

  /**
   * Get current configuration
   */
  getConfig(): GoogleSheetsConfig | null {
    return this.config;
  }

  /**
   * Test connection to Google Sheets
   */
  async testConnection(spreadsheetId: string, apiKey: string): Promise<{ success: boolean; error?: string; title?: string }> {
    try {
      const url = `${this.baseUrl}/${spreadsheetId}?key=${apiKey}&fields=properties.title,sheets.properties.title`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const error = await response.json();
        return { 
          success: false, 
          error: error.error?.message || "Failed to connect to Google Sheets" 
        };
      }

      const data = await response.json();
      return { 
        success: true, 
        title: data.properties?.title || "Untitled Spreadsheet"
      };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Network error" 
      };
    }
  }

  /**
   * Get sheet names from spreadsheet
   */
  async getSheetNames(spreadsheetId: string, apiKey: string): Promise<string[]> {
    try {
      const url = `${this.baseUrl}/${spreadsheetId}?key=${apiKey}&fields=sheets.properties.title`;
      
      const response = await fetch(url);
      if (!response.ok) return [];

      const data = await response.json();
      return data.sheets?.map((s: any) => s.properties.title) || [];
    } catch (error) {
      console.error("[GoogleSheetsAPI] Failed to get sheet names:", error);
      return [];
    }
  }

  /**
   * Read data from a sheet
   */
  async readSheet(sheetName: string, range?: string): Promise<string[][] | null> {
    if (!this.config?.spreadsheetId || !this.config?.apiKey) {
      console.error("[GoogleSheetsAPI] Not configured");
      return null;
    }

    try {
      const rangeStr = range ? `${sheetName}!${range}` : sheetName;
      const url = `${this.baseUrl}/${this.config.spreadsheetId}/values/${encodeURIComponent(rangeStr)}?key=${this.config.apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        const error = await response.json();
        console.error("[GoogleSheetsAPI] Read error:", error);
        return null;
      }

      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error("[GoogleSheetsAPI] Failed to read sheet:", error);
      return null;
    }
  }

  /**
   * Append data to a sheet (for adding new rows)
   */
  async appendToSheet(sheetName: string, rows: string[][]): Promise<boolean> {
    if (!this.config?.spreadsheetId || !this.config?.apiKey) {
      console.error("[GoogleSheetsAPI] Not configured");
      return false;
    }

    try {
      const url = `${this.baseUrl}/${this.config.spreadsheetId}/values/${encodeURIComponent(sheetName)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS&key=${this.config.apiKey}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: rows,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("[GoogleSheetsAPI] Append error:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("[GoogleSheetsAPI] Failed to append to sheet:", error);
      return false;
    }
  }

  /**
   * Read participants from Google Sheet
   */
  async readParticipants(): Promise<Participant[]> {
    const data = await this.readSheet("Participants");
    if (!data || data.length <= 1) return []; // Skip header row

    // Skip header row and map to Participant objects
    return data.slice(1).map((row) => ({
      id: row[0] || "",
      name: row[1] || "",
      mobile: row[2] || "",
      qrToken: row[3] || "",
      createdAt: row[4] || new Date().toISOString(),
    })).filter(p => p.id && p.name && p.qrToken);
  }

  /**
   * Write a new participant to Google Sheet
   */
  async writeParticipant(participant: Participant): Promise<boolean> {
    const row: string[] = [
      participant.id,
      participant.name,
      participant.mobile || "",
      participant.qrToken,
      participant.createdAt || new Date().toISOString(),
    ];

    return this.appendToSheet("Participants", [row]);
  }

  /**
   * Write multiple participants to Google Sheet
   */
  async writeParticipants(participants: Participant[]): Promise<boolean> {
    const rows: string[][] = participants.map(p => [
      p.id,
      p.name,
      p.mobile || "",
      p.qrToken,
      p.createdAt || new Date().toISOString(),
    ]);

    return this.appendToSheet("Participants", rows);
  }

  /**
   * Read scan logs from Google Sheet
   */
  async readScanLogs(): Promise<ScanLog[]> {
    const data = await this.readSheet("ScanLogs");
    if (!data || data.length <= 1) return [];

    return data.slice(1).map((row) => ({
      id: row[0] || "",
      participantId: row[1] || "",
      checkpointId: parseInt(row[2], 10) || 0,
      timestamp: row[3] || "",
      deviceId: row[4] || "",
      synced: row[5] === "true",
    })).filter(log => log.id && log.participantId);
  }

  /**
   * Write a scan log to Google Sheet
   */
  async writeScanLog(scanLog: ScanLog): Promise<boolean> {
    const row = [
      scanLog.id,
      scanLog.participantId,
      scanLog.checkpointId.toString(),
      scanLog.timestamp,
      scanLog.deviceId || "",
      "true", // synced
    ];

    return this.appendToSheet("ScanLogs", [row]);
  }

  /**
   * Write multiple scan logs to Google Sheet
   */
  async writeScanLogs(scanLogs: ScanLog[]): Promise<boolean> {
    const rows = scanLogs.map(log => [
      log.id,
      log.participantId,
      log.checkpointId.toString(),
      log.timestamp,
      log.deviceId || "",
      "true",
    ]);

    return this.appendToSheet("ScanLogs", rows);
  }

  /**
   * Check if a scan already exists (for duplicate prevention)
   */
  async checkDuplicateScan(participantId: string, checkpointId: number): Promise<boolean> {
    const scanLogs = await this.readScanLogs();
    return scanLogs.some(
      log => log.participantId === participantId && log.checkpointId === checkpointId
    );
  }

  /**
   * Sync local data with Google Sheets
   */
  async syncData(
    localParticipants: Participant[],
    localScanLogs: ScanLog[]
  ): Promise<{
    newParticipants: Participant[];
    newScanLogs: ScanLog[];
    uploadedScans: number;
  }> {
    // Read remote data
    const remoteParticipants = await this.readParticipants();
    const remoteScanLogs = await this.readScanLogs();

    // Find new participants from remote
    const localParticipantIds = new Set(localParticipants.map(p => p.id));
    const newParticipants = remoteParticipants.filter(p => !localParticipantIds.has(p.id));

    // Find new scan logs from remote
    const localScanLogIds = new Set(localScanLogs.map(s => s.id));
    const newScanLogs = remoteScanLogs.filter(s => !localScanLogIds.has(s.id));

    // Find local scan logs that haven't been synced
    const remoteScanLogIds = new Set(remoteScanLogs.map(s => s.id));
    const unsyncedLocalScans = localScanLogs.filter(s => !s.synced && !remoteScanLogIds.has(s.id));

    // Upload unsynced local scans
    let uploadedScans = 0;
    if (unsyncedLocalScans.length > 0) {
      const success = await this.writeScanLogs(unsyncedLocalScans);
      if (success) {
        uploadedScans = unsyncedLocalScans.length;
      }
    }

    // Update last sync time
    if (this.config) {
      this.config.lastSyncTime = new Date().toISOString();
      await this.saveConfig(this.config);
    }

    return {
      newParticipants,
      newScanLogs,
      uploadedScans,
    };
  }

  /**
   * Setup sheets with headers if they don't exist
   */
  async setupSheets(): Promise<{ success: boolean; message: string }> {
    if (!this.config?.spreadsheetId || !this.config?.apiKey) {
      return { success: false, message: "Not configured" };
    }

    const sheetNames = await this.getSheetNames(this.config.spreadsheetId, this.config.apiKey);
    
    const requiredSheets = ["Participants", "ScanLogs", "Checkpoints"];
    const missingSheets = requiredSheets.filter(s => !sheetNames.includes(s));

    if (missingSheets.length > 0) {
      return {
        success: false,
        message: `Missing sheets: ${missingSheets.join(", ")}. Please create these sheets in your Google Spreadsheet.`,
      };
    }

    // Check if headers exist, if not this is informational
    const participantsData = await this.readSheet("Participants", "A1:E1");
    const scanLogsData = await this.readSheet("ScanLogs", "A1:F1");

    const setupStatus = {
      participants: !!(participantsData && participantsData.length > 0),
      scanLogs: !!(scanLogsData && scanLogsData.length > 0),
      checkpoints: true,
    };

    if (this.config) {
      this.config.sheetsSetup = setupStatus;
      this.config.isConnected = true;
      await this.saveConfig(this.config);
    }

    const missingHeaders: string[] = [];
    if (!setupStatus.participants) missingHeaders.push("Participants (add headers: id, name, mobile, qr_token, created_at)");
    if (!setupStatus.scanLogs) missingHeaders.push("ScanLogs (add headers: id, participant_id, checkpoint_id, timestamp, device_id, synced)");

    if (missingHeaders.length > 0) {
      return {
        success: true,
        message: `Connected! Please add headers to: ${missingHeaders.join("; ")}`,
      };
    }

    return {
      success: true,
      message: "Google Sheets connected and configured successfully!",
    };
  }

  /**
   * Disconnect from Google Sheets
   */
  async disconnect(): Promise<void> {
    this.config = null;
    await AsyncStorage.removeItem(GOOGLE_SHEETS_CONFIG_KEY);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return !!this.config?.isConnected && !!this.config?.spreadsheetId && !!this.config?.apiKey;
  }
}

// Export singleton instance
export const googleSheetsAPI = new GoogleSheetsAPI();

// Export helper functions
export const initGoogleSheets = () => googleSheetsAPI.init();
export const testGoogleSheetsConnection = (spreadsheetId: string, apiKey: string) => 
  googleSheetsAPI.testConnection(spreadsheetId, apiKey);
export const readParticipantsFromSheet = () => googleSheetsAPI.readParticipants();
export const writeParticipantToSheet = (participant: Participant) => 
  googleSheetsAPI.writeParticipant(participant);
export const writeScanLogToSheet = (scanLog: ScanLog) => 
  googleSheetsAPI.writeScanLog(scanLog);
export const syncWithGoogleSheets = (participants: Participant[], scanLogs: ScanLog[]) =>
  googleSheetsAPI.syncData(participants, scanLogs);
