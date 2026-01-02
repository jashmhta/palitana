/**
 * Check and fix Google Sheet headers
 */

import { google } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

const SHEET_ID = '1BYVEW7FDb9Q2UW1aEvrYJUwPxB5XP94YAGkzpy_eJt4';
const SERVICE_ACCOUNT_PATH = path.join(__dirname, '../server/google-service-account.json');

// Expected headers based on user's template
const EXPECTED_SCANLOGS_HEADERS = ["Day", "Time", "Badge Number", "Yatri Name", "Checkpoint Name"];
const EXPECTED_JATRA_HEADERS = ["Day", "Badge Number", "Yatri Name", "Jatra Number", "Start Time", "End Time", "Duration (mins)"];

async function checkAndFixHeaders() {
  try {
    const credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf8'));
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    console.log('Checking Google Sheet headers...\n');

    // Check ScanLogs sheet
    try {
      const scanLogsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'ScanLogs!A1:Z1',
      });
      
      const currentScanLogsHeaders = scanLogsResponse.data.values?.[0] || [];
      console.log('ScanLogs Current Headers:', currentScanLogsHeaders);
      console.log('ScanLogs Expected Headers:', EXPECTED_SCANLOGS_HEADERS);
      
      const scanLogsMatch = JSON.stringify(currentScanLogsHeaders) === JSON.stringify(EXPECTED_SCANLOGS_HEADERS);
      console.log('ScanLogs Headers Match:', scanLogsMatch ? '✅ YES' : '❌ NO');
      
      if (!scanLogsMatch) {
        console.log('\nFixing ScanLogs headers...');
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: 'ScanLogs!A1:E1',
          valueInputOption: 'RAW',
          requestBody: {
            values: [EXPECTED_SCANLOGS_HEADERS],
          },
        });
        console.log('✅ ScanLogs headers fixed!');
      }
    } catch (e) {
      console.log('ScanLogs sheet not found, creating...');
    }

    console.log('');

    // Check JatraCompletions sheet
    try {
      const jatraResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: 'JatraCompletions!A1:Z1',
      });
      
      const currentJatraHeaders = jatraResponse.data.values?.[0] || [];
      console.log('JatraCompletions Current Headers:', currentJatraHeaders);
      console.log('JatraCompletions Expected Headers:', EXPECTED_JATRA_HEADERS);
      
      const jatraMatch = JSON.stringify(currentJatraHeaders) === JSON.stringify(EXPECTED_JATRA_HEADERS);
      console.log('JatraCompletions Headers Match:', jatraMatch ? '✅ YES' : '❌ NO');
      
      if (!jatraMatch) {
        console.log('\nFixing JatraCompletions headers...');
        await sheets.spreadsheets.values.update({
          spreadsheetId: SHEET_ID,
          range: 'JatraCompletions!A1:G1',
          valueInputOption: 'RAW',
          requestBody: {
            values: [EXPECTED_JATRA_HEADERS],
          },
        });
        console.log('✅ JatraCompletions headers fixed!');
      }
    } catch (e) {
      console.log('JatraCompletions sheet not found');
    }

    console.log('\n✅ Header check complete!');

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAndFixHeaders();
