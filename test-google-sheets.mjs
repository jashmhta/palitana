// Test Google Sheets logging by creating a scan
import { randomUUID } from 'crypto';

const API_BASE = "http://127.0.0.1:3000/api/trpc";

async function testGoogleSheetsLogging() {
  console.log("=== Testing Google Sheets Integration ===\n");
  
  // Get a participant
  const participantsRes = await fetch(`${API_BASE}/participants.list`);
  const participantsData = await participantsRes.json();
  const participants = participantsData.result?.data?.json || [];
  
  console.log(`Found ${participants.length} participants`);
  
  if (participants.length === 0) {
    console.error("No participants found!");
    return;
  }
  
  // Pick a random participant
  const randomIndex = Math.floor(Math.random() * participants.length);
  const participant = participants[randomIndex];
  
  console.log(`\nTesting with: ${participant.name} (Badge: ${participant.qrToken})`);
  
  // Create a scan
  const scanUuid = randomUUID();
  const timestamp = new Date().toISOString();
  
  console.log(`\nCreating scan at Aamli checkpoint...`);
  console.log(`UUID: ${scanUuid}`);
  console.log(`Timestamp: ${timestamp}`);
  
  const scanRes = await fetch(`${API_BASE}/scanLogs.create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uuid: scanUuid,
      participantUuid: participant.uuid,
      checkpointId: 1, // Aamli
      deviceId: "google-sheets-test",
      scannedAt: timestamp,
    }),
  });
  
  const scanData = await scanRes.json();
  
  if (scanData.error) {
    console.log("\n❌ Scan creation failed (might be rate limited):");
    console.log(scanData.error.json?.message?.substring(0, 200));
  } else {
    console.log("\n✅ Scan created successfully!");
    console.log("→ Google Sheets logging should have been triggered");
    console.log("→ Check your Google Sheet for the new entry");
  }
  
  // Check scan logs
  const logsRes = await fetch(`${API_BASE}/scanLogs.list`);
  const logsData = await logsRes.json();
  const logs = logsData.result?.data?.json || [];
  
  console.log(`\n=== Current Scan Logs: ${logs.length} ===`);
  
  if (logs.length > 0) {
    console.log("\nLatest 3 scans:");
    logs.slice(0, 3).forEach((log, i) => {
      const p = participants.find(p => p.uuid === log.participantUuid);
      console.log(`${i+1}. ${p?.name || 'Unknown'} at Checkpoint ${log.checkpointId} (${log.scannedAt})`);
    });
  }
  
  console.log("\n=== Test Complete ===");
}

testGoogleSheetsLogging().catch(console.error);
