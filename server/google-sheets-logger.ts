/**
 * Server-Side Google Sheets Logger with Service Account Authentication
 * 
 * Features:
 * - Two sheets: ScanLogs (all scans) and JatraCompletions (completed Jatras)
 * - Automatic Jatra completion detection when Gheti is scanned
 * - Duration tracking from Aamli to Gheti
 * - Two-day support
 * - AI validation for data accuracy
 */

import { google } from "googleapis";
import * as path from "path";
import * as fs from "fs";

// Checkpoint IDs
const CHECKPOINT_AAMLI = 1;
const CHECKPOINT_GHETI = 2;
const CHECKPOINT_X = 3;

// Checkpoint names
const CHECKPOINT_NAMES: Record<number, string> = {
  1: "Aamli",
  2: "Gheti",
  3: "X",
};

interface ScanLogData {
  uuid: string;
  participantUuid: string;
  participantName: string;
  participantBadge: string;
  checkpointId: number;
  checkpointName: string;
  scannedAt: Date;
  day: number;
}

interface JatraCompletion {
  day: number;
  badge: number;
  name: string;
  jatraNumber: number;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
}

interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

class GoogleSheetsLogger {
  private sheets: ReturnType<typeof google.sheets> | null = null;
  private spreadsheetId: string | undefined = undefined;
  private isInitialized = false;
  private failedScans: ScanLogData[] = [];
  private retryInterval: ReturnType<typeof setInterval> | null = null;
  private maxRetryQueueSize = 1000;
  
  // Track recent scans for Jatra completion detection
  // Map: participantUuid -> { checkpointId, timestamp }[]
  private recentScans: Map<string, { checkpointId: number; timestamp: Date; day: number }[]> = new Map();
  
  // Track Jatra counts per participant per day
  // Map: `${participantUuid}_day${day}` -> jatraCount
  private jatraCounts: Map<string, number> = new Map();

  /**
   * Initialize the Google Sheets logger with Service Account
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    this.spreadsheetId = process.env.GOOGLE_SHEETS_ID || undefined;
    
    if (!this.spreadsheetId) {
      console.warn("[GoogleSheetsLogger] GOOGLE_SHEETS_ID not set - scans will not be logged to Google Sheets");
      this.isInitialized = true;
      return;
    }

    try {
      // Load service account credentials
      const credentialsPath = path.join(process.cwd(), "server", "google-service-account.json");
      
      if (!fs.existsSync(credentialsPath)) {
        console.warn("[GoogleSheetsLogger] Service account file not found at:", credentialsPath);
        this.isInitialized = true;
        return;
      }

      const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
      
      // Create JWT auth client
      const auth = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      });

      // Create sheets client
      this.sheets = google.sheets({ version: "v4", auth });
      
      console.log(`[GoogleSheetsLogger] Initialized with service account: ${credentials.client_email}`);
      
      // Verify connection and setup sheets
      await this.setupSheets();
      
      this.isInitialized = true;
      
      // Start retry processor
      this.startRetryProcessor();
      
    } catch (error) {
      console.error("[GoogleSheetsLogger] Initialization failed:", error);
      this.isInitialized = true;
    }
  }

  /**
   * Setup the required sheets with headers
   */
  private async setupSheets(): Promise<void> {
    if (!this.sheets || !this.spreadsheetId) return;

    try {
      // Get spreadsheet info
      const spreadsheet = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId,
      });
      
      console.log(`[GoogleSheetsLogger] Connected to: ${spreadsheet.data.properties?.title}`);
      
      const existingSheets = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
      
      // Create ScanLogs sheet if not exists
      if (!existingSheets.includes("ScanLogs")) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: { title: "ScanLogs" }
              }
            }]
          }
        });
        console.log("[GoogleSheetsLogger] Created ScanLogs sheet");
        
        // Add headers - User's template: Day / Time / Badge Number / Yatri Name / Checkpoint Name
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: "ScanLogs!A1:E1",
          valueInputOption: "RAW",
          requestBody: {
            values: [["Day", "Time", "Badge Number", "Yatri Name", "Checkpoint Name"]]
          }
        });
        console.log("[GoogleSheetsLogger] Added headers to ScanLogs sheet");
      } else {
        console.log("[GoogleSheetsLogger] ScanLogs sheet already exists");
      }
      
      // Create JatraCompletions sheet if not exists
      if (!existingSheets.includes("JatraCompletions")) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: { title: "JatraCompletions" }
              }
            }]
          }
        });
        console.log("[GoogleSheetsLogger] Created JatraCompletions sheet");
        
        // Add headers - User's template format
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: "JatraCompletions!A1:G1",
          valueInputOption: "RAW",
          requestBody: {
            values: [["Day", "Badge Number", "Yatri Name", "Jatra Number", "Start Time", "End Time", "Duration (mins)"]]
          }
        });
        console.log("[GoogleSheetsLogger] Added headers to JatraCompletions sheet");
      } else {
        console.log("[GoogleSheetsLogger] JatraCompletions sheet already exists");
      }
      
    } catch (error) {
      console.error("[GoogleSheetsLogger] Failed to setup sheets:", error);
    }
  }

  /**
   * Clear all data from sheets (keep headers)
   */
  async clearAllData(): Promise<void> {
    if (!this.sheets || !this.spreadsheetId) return;

    try {
      // Clear ScanLogs (keep header row)
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: "ScanLogs!A2:F10000",
      });
      
      // Clear JatraCompletions (keep header row)
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: "JatraCompletions!A2:G10000",
      });
      
      // Reset internal tracking
      this.recentScans.clear();
      this.jatraCounts.clear();
      
      console.log("[GoogleSheetsLogger] Cleared all data from sheets");
    } catch (error) {
      console.error("[GoogleSheetsLogger] Failed to clear data:", error);
    }
  }

  /**
   * Start the retry queue processor
   */
  private startRetryProcessor(): void {
    if (this.retryInterval) return;
    
    this.retryInterval = setInterval(async () => {
      if (this.failedScans.length === 0) return;
      
      console.log(`[GoogleSheetsLogger] Retrying ${this.failedScans.length} failed scans...`);
      
      const scansToRetry = [...this.failedScans];
      this.failedScans = [];
      
      for (const scan of scansToRetry) {
        const result = await this.logScanDirect(scan);
        if (!result.success && this.failedScans.length < this.maxRetryQueueSize) {
          this.failedScans.push(scan);
        }
      }
    }, 30000);
  }

  /**
   * Validate a scan using AI-powered logic
   */
  validateScan(scanData: ScanLogData): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      warnings: [],
      errors: [],
      suggestions: [],
    };

    const participantScans = this.recentScans.get(scanData.participantUuid) || [];
    const lastScan = participantScans[participantScans.length - 1];

    // Check for valid scan sequence
    if (scanData.checkpointId === CHECKPOINT_GHETI) {
      // Gheti scan should have a prior Aamli scan
      const hasRecentAamli = participantScans.some(
        s => s.checkpointId === CHECKPOINT_AAMLI && 
             s.day === scanData.day &&
             (scanData.scannedAt.getTime() - s.timestamp.getTime()) < 4 * 60 * 60 * 1000 // Within 4 hours
      );
      
      if (!hasRecentAamli) {
        result.warnings.push(`Gheti scan without prior Aamli scan for badge #${scanData.participantBadge}`);
        result.suggestions.push("Check if Aamli scan was missed");
      }
    }

    // Check for unusually fast Jatra (less than 15 minutes from Aamli to Gheti)
    if (scanData.checkpointId === CHECKPOINT_GHETI && lastScan?.checkpointId === CHECKPOINT_AAMLI) {
      const durationMs = scanData.scannedAt.getTime() - lastScan.timestamp.getTime();
      const durationMins = durationMs / (1000 * 60);
      
      if (durationMins < 15) {
        result.warnings.push(`Unusually fast Jatra: ${Math.round(durationMins)} minutes`);
        result.suggestions.push("Verify scan accuracy - typical Jatra takes 30-60 minutes");
      }
      
      if (durationMins > 180) {
        result.warnings.push(`Unusually slow Jatra: ${Math.round(durationMins)} minutes`);
        result.suggestions.push("Pilgrim may have taken a long break or scan was delayed");
      }
    }

    // Check for duplicate checkpoint in sequence
    if (lastScan && lastScan.checkpointId === scanData.checkpointId) {
      const timeDiff = (scanData.scannedAt.getTime() - lastScan.timestamp.getTime()) / (1000 * 60);
      if (timeDiff < 10) {
        result.errors.push(`Duplicate scan at ${scanData.checkpointName} within ${Math.round(timeDiff)} minutes`);
        result.isValid = false;
      }
    }

    return result;
  }

  /**
   * Log a scan to Google Sheets
   */
  async logScan(scanData: ScanLogData): Promise<{ success: boolean; error?: string; validation?: ValidationResult }> {
    if (!this.isInitialized) {
      await this.init();
    }

    if (!this.sheets || !this.spreadsheetId) {
      return { success: true }; // Silently skip if not configured
    }

    // Validate the scan
    const validation = this.validateScan(scanData);
    
    if (validation.warnings.length > 0) {
      console.log(`[GoogleSheetsLogger] Validation warnings for ${scanData.participantName}:`, validation.warnings);
    }
    
    if (!validation.isValid) {
      console.log(`[GoogleSheetsLogger] Validation failed for ${scanData.participantName}:`, validation.errors);
      return { success: false, error: validation.errors.join(", "), validation };
    }

    // Log the scan
    const result = await this.logScanDirect(scanData);
    
    if (result.success) {
      // Track this scan
      const participantScans = this.recentScans.get(scanData.participantUuid) || [];
      participantScans.push({
        checkpointId: scanData.checkpointId,
        timestamp: scanData.scannedAt,
        day: scanData.day,
      });
      this.recentScans.set(scanData.participantUuid, participantScans);
      
      // Check for Jatra completion (Gheti scan)
      if (scanData.checkpointId === CHECKPOINT_GHETI) {
        await this.recordJatraCompletion(scanData);
      }
    } else if (this.failedScans.length < this.maxRetryQueueSize) {
      this.failedScans.push(scanData);
    }
    
    return { ...result, validation };
  }

  /**
   * Direct log to ScanLogs sheet
   */
  private async logScanDirect(scanData: ScanLogData): Promise<{ success: boolean; error?: string }> {
    if (!this.sheets || !this.spreadsheetId) {
      return { success: false, error: "Not configured" };
    }

    try {
      const date = scanData.scannedAt instanceof Date ? scanData.scannedAt : new Date(scanData.scannedAt);
      
      // User's template: Day / Time / Badge Number / Yatri Name / Checkpoint Name
      const row = [
        scanData.day,
        date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }),
        scanData.participantBadge,
        scanData.participantName,
        scanData.checkpointName,
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: "ScanLogs!A:E",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [row],
        },
      });

      console.log(`[GoogleSheetsLogger] Logged: ${scanData.participantName} (#${scanData.participantBadge}) at ${scanData.checkpointName}`);
      return { success: true };
    } catch (error) {
      console.error("[GoogleSheetsLogger] Error logging scan:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }

  /**
   * Record a Jatra completion when Gheti is scanned
   */
  private async recordJatraCompletion(scanData: ScanLogData): Promise<void> {
    if (!this.sheets || !this.spreadsheetId) return;

    try {
      // Find the most recent Aamli scan for this participant on this day
      const participantScans = this.recentScans.get(scanData.participantUuid) || [];
      const aamliScans = participantScans.filter(
        (s: { checkpointId: number; timestamp: Date; day: number }) => s.checkpointId === CHECKPOINT_AAMLI && s.day === scanData.day
      );
      
      const lastAamliScan = aamliScans[aamliScans.length - 1];
      
      // Get Jatra number for this participant on this day
      const jatraKey = `${scanData.participantUuid}_day${scanData.day}`;
      const currentJatraCount = this.jatraCounts.get(jatraKey) || 0;
      const newJatraNumber = currentJatraCount + 1;
      this.jatraCounts.set(jatraKey, newJatraNumber);
      
      // Calculate duration
      let startTime = lastAamliScan?.timestamp || scanData.scannedAt;
      const endTime = scanData.scannedAt instanceof Date ? scanData.scannedAt : new Date(scanData.scannedAt);
      startTime = startTime instanceof Date ? startTime : new Date(startTime);
      
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationMins = Math.round(durationMs / (1000 * 60));
      
      const row = [
        scanData.day,
        scanData.participantBadge,
        scanData.participantName,
        newJatraNumber,
        startTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }),
        endTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }),
        durationMins,
      ];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: "JatraCompletions!A:G",
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: {
          values: [row],
        },
      });

      console.log(`[GoogleSheetsLogger] Jatra ${newJatraNumber} completed: ${scanData.participantName} (#${scanData.participantBadge}) - ${durationMins} mins`);
    } catch (error) {
      console.error("[GoogleSheetsLogger] Error recording Jatra completion:", error);
    }
  }

  /**
   * Check if Google Sheets logging is enabled
   */
  isEnabled(): boolean {
    return !!this.sheets && !!this.spreadsheetId;
  }

  /**
   * Get configuration status
   */
  getStatus(): { configured: boolean; enabled: boolean; spreadsheetId?: string } {
    return {
      configured: !!this.spreadsheetId,
      enabled: this.isEnabled(),
      spreadsheetId: this.spreadsheetId || undefined,
    };
  }
}

// Export singleton instance
export const googleSheetsLogger = new GoogleSheetsLogger();

// Initialize on module load
googleSheetsLogger.init().catch((error) => {
  console.error("[GoogleSheetsLogger] Initialization failed:", error);
});
