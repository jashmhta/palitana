/**
 * Script to clear all data from Google Sheets (keeps headers)
 */

import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function clearGoogleSheets() {
  console.log("=== Clearing Google Sheets Data ===\n");
  
  // Load environment
  const envPath = path.join(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach(line => {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join("=").trim();
      }
    });
  }
  
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
  
  if (!spreadsheetId) {
    console.error("❌ GOOGLE_SHEETS_ID not found in environment");
    return;
  }
  
  console.log(`Spreadsheet ID: ${spreadsheetId}`);
  
  // Load service account credentials
  const credentialsPath = path.join(__dirname, "..", "server", "google-service-account.json");
  
  if (!fs.existsSync(credentialsPath)) {
    console.error("❌ Service account file not found at:", credentialsPath);
    return;
  }
  
  const credentials = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
  console.log(`Service Account: ${credentials.client_email}`);
  
  // Create JWT auth client
  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  
  // Create sheets client
  const sheets = google.sheets({ version: "v4", auth });
  
  try {
    // Get spreadsheet info
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId,
    });
    
    console.log(`\nConnected to: ${spreadsheet.data.properties?.title}`);
    
    // Clear ScanLogs (keep header row)
    console.log("\nClearing ScanLogs sheet...");
    await sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetId,
      range: "ScanLogs!A2:F10000",
    });
    console.log("✅ ScanLogs cleared");
    
    // Clear JatraCompletions (keep header row)
    console.log("Clearing JatraCompletions sheet...");
    await sheets.spreadsheets.values.clear({
      spreadsheetId: spreadsheetId,
      range: "JatraCompletions!A2:G10000",
    });
    console.log("✅ JatraCompletions cleared");
    
    console.log("\n=== Google Sheets Data Cleared Successfully ===");
    
  } catch (error) {
    console.error("❌ Error clearing sheets:", error.message);
    if (error.code === 403) {
      console.log("\nMake sure the Google Sheet is shared with:");
      console.log(`  ${credentials.client_email}`);
      console.log("  (with Editor access)");
    }
  }
}

clearGoogleSheets();
