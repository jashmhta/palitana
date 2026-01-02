/**
 * Clear all data from Google Sheets (ScanLogs and JatraCompletions)
 */

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const SHEET_ID = '1BYVEW7FDb9Q2UW1aEvrYJUwPxB5XP94YAGkzpy_eJt4';
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../server/google-service-account.json');

async function clearAllSheets() {
  try {
    // Load service account credentials
    const credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    
    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('Connected to Google Sheets');

    // Clear ScanLogs sheet (keep header row 1)
    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SHEET_ID,
        range: 'ScanLogs!A2:Z10000',
      });
      console.log('✅ Cleared ScanLogs sheet');
    } catch (e) {
      console.log('ScanLogs sheet not found or already empty');
    }

    // Clear JatraCompletions sheet (keep header row 1)
    try {
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SHEET_ID,
        range: 'JatraCompletions!A2:Z10000',
      });
      console.log('✅ Cleared JatraCompletions sheet');
    } catch (e) {
      console.log('JatraCompletions sheet not found or already empty');
    }

    // Also check and clear the default Sheet1 if it has data
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'Sheet1!A:Z',
      });
      
      const rows = response.data.values || [];
      if (rows.length > 1) {
        await sheets.spreadsheets.values.clear({
          spreadsheetId: SHEET_ID,
          range: 'Sheet1!A2:Z10000',
        });
        console.log(`✅ Cleared Sheet1 (${rows.length - 1} data rows)`);
      }
    } catch (e) {
      console.log('Sheet1 not found or already empty');
    }

    console.log('\n✅ All sheets cleared successfully!');

  } catch (error) {
    console.error('Error clearing sheets:', error);
    throw error;
  }
}

clearAllSheets();
