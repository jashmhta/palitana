/**
 * Google Sheets Integration Service
 * 
 * This service handles syncing data with Google Sheets using the Google Sheets API.
 * 
 * Setup Instructions:
 * 1. Create a Google Cloud Project
 * 2. Enable the Google Sheets API
 * 3. Create a Service Account and download the JSON key
 * 4. Share your Google Sheet with the service account email
 * 5. Store the API key in the app settings
 * 
 * Sheet Structure:
 * - Sheet 1 "Participants": id, name, mobile, qr_token, created_at
 * - Sheet 2 "ScanLogs": id, participant_id, checkpoint_id, timestamp, device_id, synced
 * - Sheet 3 "Checkpoints": id, number, description, day
 */

import { Participant, ScanLog } from "@/types";

const SHEETS_API_BASE = "https://sheets.googleapis.com/v4/spreadsheets";

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  apiKey?: string;
}

export interface SyncResult {
  success: boolean;
  message: string;
  syncedCount?: number;
  errors?: string[];
}

/**
 * Fetch participants from Google Sheets
 */
export async function fetchParticipantsFromSheets(
  config: GoogleSheetsConfig
): Promise<{ success: boolean; participants: Participant[]; error?: string }> {
  try {
    const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/Participants!A2:E?key=${config.apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to fetch participants:", error);
      return { success: false, participants: [], error: "Failed to fetch from Google Sheets" };
    }

    const data = await response.json();
    const rows = data.values || [];

    const participants: Participant[] = rows.map((row: string[]) => ({
      id: row[0] || "",
      name: row[1] || "",
      mobile: row[2] || "",
      qrToken: row[3] || "",
      createdAt: row[4] || new Date().toISOString(),
    }));

    return { success: true, participants };
  } catch (error) {
    console.error("Error fetching participants:", error);
    return { success: false, participants: [], error: String(error) };
  }
}

/**
 * Append scan logs to Google Sheets
 * Note: This requires OAuth or service account authentication for write access
 */
export async function appendScanLogsToSheets(
  config: GoogleSheetsConfig,
  scanLogs: ScanLog[],
  accessToken: string
): Promise<SyncResult> {
  try {
    if (scanLogs.length === 0) {
      return { success: true, message: "No logs to sync", syncedCount: 0 };
    }

    const values = scanLogs.map((log) => [
      log.id,
      log.participantId,
      log.checkpointId,
      log.timestamp,
      log.deviceId || "",
      log.gpsLat || "",
      log.gpsLng || "",
      "true", // synced
    ]);

    const url = `${SHEETS_API_BASE}/${config.spreadsheetId}/values/ScanLogs!A:H:append?valueInputOption=USER_ENTERED`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Failed to append scan logs:", error);
      return { success: false, message: "Failed to sync to Google Sheets", errors: [error] };
    }

    return {
      success: true,
      message: `Successfully synced ${scanLogs.length} scan logs`,
      syncedCount: scanLogs.length,
    };
  } catch (error) {
    console.error("Error appending scan logs:", error);
    return { success: false, message: String(error), errors: [String(error)] };
  }
}

/**
 * Create a new Google Sheet with the required structure
 * This is a helper function for initial setup
 */
export function getSheetSetupInstructions(): string {
  return `
To set up Google Sheets integration:

1. Create a new Google Sheet
2. Rename Sheet1 to "Participants" with columns:
   A: id, B: name, C: mobile, D: qr_token, E: created_at

3. Create Sheet2 named "ScanLogs" with columns:
   A: id, B: participant_id, C: checkpoint_id, D: timestamp, 
   E: device_id, F: gps_lat, G: gps_lng, H: synced

4. Create Sheet3 named "Checkpoints" with columns:
   A: id, B: number, C: description, D: day

5. Copy the Spreadsheet ID from the URL:
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit

6. For read-only access (fetching participants):
   - Make the sheet publicly viewable
   - Get an API key from Google Cloud Console

7. For write access (syncing scan logs):
   - Set up OAuth 2.0 or Service Account authentication
   - Share the sheet with the service account email

Enter the Spreadsheet ID in the app settings to connect.
`;
}

/**
 * Validate Google Sheets connection
 */
export async function validateSheetsConnection(
  config: GoogleSheetsConfig
): Promise<{ valid: boolean; error?: string }> {
  try {
    const url = `${SHEETS_API_BASE}/${config.spreadsheetId}?key=${config.apiKey}&fields=properties.title`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return { valid: false, error: "Unable to access spreadsheet. Check ID and permissions." };
    }

    const data = await response.json();
    console.log("Connected to sheet:", data.properties?.title);
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: String(error) };
  }
}

/**
 * Parse CSV data to participants
 */
export function parseCSVToParticipants(csvContent: string): Participant[] {
  const lines = csvContent.trim().split("\n");
  const participants: Participant[] = [];

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parsing (handles basic cases)
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    
    if (values.length >= 2) {
      participants.push({
        id: values[0] || `p_${Date.now()}_${i}`,
        name: values[1] || "",
        mobile: values[2] || "",
        qrToken: values[3] || generateQRToken(),
        createdAt: values[4] || new Date().toISOString(),
      });
    }
  }

  return participants;
}

/**
 * Generate a unique QR token
 */
function generateQRToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let token = "";
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Export participants to CSV format
 */
export function exportParticipantsToCSV(participants: Participant[]): string {
  let csv = "id,name,mobile,qr_token,created_at\n";
  
  participants.forEach((p) => {
    csv += `"${p.id}","${p.name}","${p.mobile}","${p.qrToken}","${p.createdAt || ""}"\n`;
  });

  return csv;
}

/**
 * Export scan logs to CSV format
 */
export function exportScanLogsToCSV(
  scanLogs: ScanLog[],
  participants: Participant[]
): string {
  let csv = "id,participant_id,participant_name,checkpoint_id,timestamp,device_id,synced\n";
  
  scanLogs.forEach((log) => {
    const participant = participants.find((p) => p.id === log.participantId);
    csv += `"${log.id}","${log.participantId}","${participant?.name || "Unknown"}",${log.checkpointId},"${log.timestamp}","${log.deviceId || ""}",${log.synced}\n`;
  });

  return csv;
}
