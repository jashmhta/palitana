/**
 * Script to clear scan log data from Google Sheet
 * Keeps the header row intact
 */

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const SHEET_ID = '1BYVEW7FDb9Q2UW1aEvrYJUwPxB5XP94YAGkzpy_eJt4';
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../server/google-service-account.json');

async function clearGoogleSheet() {
  try {
    // Load service account credentials
    const credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    
    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Get sheet info to find the data range
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID,
    });

    console.log('Connected to Google Sheet:', sheetInfo.data.properties?.title);

    // Get the first sheet name
    const firstSheet = sheetInfo.data.sheets?.[0]?.properties?.title || 'Sheet1';
    
    // Get current data to see how many rows exist
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${firstSheet}!A:Z`,
    });

    const rows = response.data.values || [];
    console.log(`Found ${rows.length} rows (including header)`);

    if (rows.length <= 1) {
      console.log('No data rows to clear (only header exists)');
      return;
    }

    // Clear all rows except the header (row 1)
    // Clear from row 2 to the last row
    const clearRange = `${firstSheet}!A2:Z${rows.length}`;
    
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range: clearRange,
    });

    console.log(`✅ Cleared ${rows.length - 1} data rows from Google Sheet`);
    console.log('Header row preserved');

  } catch (error) {
    console.error('Error clearing Google Sheet:', error);
    throw error;
  }
}

clearGoogleSheet();
