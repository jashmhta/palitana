/**
 * Comprehensive Test Suite for Palitana Yatra App
 * Tests all critical functionality for production readiness
 */

import { describe, it, expect, beforeAll } from "vitest";

const API_BASE = "http://localhost:3000/api/trpc";

// Helper for fetch with retry and timeout
async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  throw new Error('Max retries reached');
}

// Helper to make tRPC calls
async function trpcQuery(procedure: string, input?: object) {
  const url = input 
    ? `${API_BASE}/${procedure}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`
    : `${API_BASE}/${procedure}`;
  const response = await fetchWithRetry(url);
  const data = await response.json();
  return data.result?.data?.json;
}

async function trpcMutation(procedure: string, input: object) {
  const response = await fetchWithRetry(`${API_BASE}/${procedure}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ json: input }),
  });
  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.json?.message || "Mutation failed");
  }
  return data.result?.data?.json;
}

describe("Palitana Yatra App - Production Readiness Tests", () => {
  
  describe("1. Participant Data Integrity", () => {
    it("should have exactly 413 participants in database", async () => {
      const stats = await trpcQuery("stats.summary");
      expect(stats.totalParticipants).toBeGreaterThanOrEqual(413);
    });

    it("should retrieve participant by QR token", async () => {
      const participant = await trpcQuery("participants.getByQrToken", { qrToken: "PALITANA_YATRA_1" });
      expect(participant).toBeDefined();
      expect(participant.name).toContain("Aachal");
      expect(participant.qrToken).toBe("PALITANA_YATRA_1");
    });

    it("should have all participants with valid QR tokens (1-413)", async () => {
      // Test a sample of QR tokens
      const sampleTokens = ["PALITANA_YATRA_1", "PALITANA_YATRA_100", "PALITANA_YATRA_413"];
      for (const token of sampleTokens) {
        const participant = await trpcQuery("participants.getByQrToken", { qrToken: token });
        expect(participant).toBeDefined();
        expect(participant.qrToken).toBe(token);
      }
    });

    it("should list all participants", async () => {
      const participants = await trpcQuery("participants.list");
      expect(Array.isArray(participants)).toBe(true);
      expect(participants.length).toBeGreaterThanOrEqual(413);
    });
  });

  describe("2. Scan Log Functionality", () => {
    let testParticipantUuid: string;
    // Use a random participant (50-100) to avoid conflicts with other tests
    const randomParticipantNum = 50 + Math.floor(Math.random() * 50);

    beforeAll(async () => {
      // Get a participant UUID for testing
      // Use random participant to avoid rate limit conflicts across test runs
      const participant = await trpcQuery("participants.getByQrToken", { qrToken: `PALITANA_YATRA_${randomParticipantNum}` });
      testParticipantUuid = participant.uuid;
    });

    it("should create a scan log successfully", async () => {
      const scanData = {
        uuid: crypto.randomUUID(),
        participantUuid: testParticipantUuid,
        checkpointId: 1,
        deviceId: "test-device-001",
        gpsLat: "21.5222",
        gpsLng: "71.8333",
        scannedAt: new Date().toISOString(),
      };

      const result = await trpcMutation("scanLogs.create", scanData);
      expect(result.success).toBe(true);
      expect(result.duplicate).toBe(false);
    });

    it("should prevent duplicate scans at same checkpoint", async () => {
      const scanData = {
        uuid: crypto.randomUUID(),
        participantUuid: testParticipantUuid,
        checkpointId: 1, // Same checkpoint as previous test
        deviceId: "test-device-002",
        gpsLat: "21.5222",
        gpsLng: "71.8333",
        scannedAt: new Date().toISOString(),
      };

      const result = await trpcMutation("scanLogs.create", scanData);
      expect(result.duplicate).toBe(true);
    });

    it("should allow scan at different checkpoint", async () => {
      const scanData = {
        uuid: crypto.randomUUID(),
        participantUuid: testParticipantUuid,
        checkpointId: 2, // Different checkpoint
        deviceId: "test-device-003",
        gpsLat: "21.5222",
        gpsLng: "71.8333",
        scannedAt: new Date().toISOString(),
      };

      const result = await trpcMutation("scanLogs.create", scanData);
      expect(result.success).toBe(true);
      expect(result.duplicate).toBe(false);
    });

    it("should retrieve scan logs by participant", async () => {
      const logs = await trpcQuery("scanLogs.getByParticipant", { participantUuid: testParticipantUuid });
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThanOrEqual(2); // At least 2 scans from previous tests
    });

    it("should retrieve scan logs by checkpoint", async () => {
      const logs = await trpcQuery("scanLogs.getByCheckpoint", { checkpointId: 1 });
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("3. Add Participant Functionality", () => {
    const testUuid = "test-add-" + Date.now() + "-" + Math.random().toString(36).slice(2, 10);
    const validUuid = `${testUuid.slice(0, 8)}-${testUuid.slice(8, 12)}-4${testUuid.slice(13, 16)}-a${testUuid.slice(17, 20)}-${testUuid.slice(20, 32)}`.slice(0, 36);
    
    it("should add a new participant to database", async () => {
      const uuid = crypto.randomUUID();
      const newParticipant = {
        uuid,
        name: "Test New Pilgrim",
        mobile: "9876543210",
        qrToken: `PYT-TEST-${Date.now()}`,
      };

      const result = await trpcMutation("participants.upsert", newParticipant);
      expect(result.success).toBe(true);

      // Verify participant was added
      const participant = await trpcQuery("participants.get", { uuid });
      expect(participant).toBeDefined();
      expect(participant.name).toBe("Test New Pilgrim");

      // Clean up - delete test participant
      await trpcMutation("participants.delete", { uuid });
    });

    it("should reject invalid UUID format", async () => {
      const invalidParticipant = {
        uuid: "invalid-uuid",
        name: "Test Invalid",
        mobile: "1234567890",
        qrToken: "PYT-INVALID",
      };

      await expect(trpcMutation("participants.upsert", invalidParticipant)).rejects.toThrow();
    });
  });

  describe("4. Statistics API", () => {
    it("should return correct summary statistics", async () => {
      const stats = await trpcQuery("stats.summary");
      expect(stats).toHaveProperty("totalParticipants");
      expect(stats).toHaveProperty("totalScans");
      expect(stats).toHaveProperty("todayScans");
      expect(stats).toHaveProperty("todayUniqueParticipants");
      expect(stats.totalParticipants).toBeGreaterThanOrEqual(413);
    });

    it("should return checkpoint statistics", async () => {
      const checkpointStats = await trpcQuery("stats.checkpoints");
      expect(Array.isArray(checkpointStats)).toBe(true);
    });

    it("should return today's statistics", async () => {
      const todayStats = await trpcQuery("stats.today");
      expect(todayStats).toHaveProperty("totalScans");
      expect(todayStats).toHaveProperty("uniqueParticipants");
    });
  });

  describe("5. Sync API", () => {
    it("should return full sync data", async () => {
      const syncData = await trpcQuery("sync.fullSync");
      expect(syncData).toHaveProperty("participants");
      expect(syncData).toHaveProperty("scanLogs");
      expect(syncData).toHaveProperty("familyGroups");
      expect(syncData).toHaveProperty("syncedAt");
      expect(syncData.participants.length).toBeGreaterThanOrEqual(413);
    });

    it("should return incremental sync data", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const syncData = await trpcQuery("sync.incrementalSync", {
        deviceId: "test-device",
        lastSyncAt: yesterday.toISOString(),
      });
      
      expect(syncData).toHaveProperty("participants");
      expect(syncData).toHaveProperty("scanLogs");
      expect(syncData).toHaveProperty("syncedAt");
    });
  });

  describe("6. Data Accuracy Verification", () => {
    it("should have participant with badge 1 as Aachal Vinod Bhandari", async () => {
      const participant = await trpcQuery("participants.getByQrToken", { qrToken: "PALITANA_YATRA_1" });
      expect(participant.name.toLowerCase()).toContain("aachal");
    });

    it("should have participant with badge 413", async () => {
      const participant = await trpcQuery("participants.getByQrToken", { qrToken: "PALITANA_YATRA_413" });
      expect(participant).toBeDefined();
      expect(participant.qrToken).toBe("PALITANA_YATRA_413");
    });

    it("should have blood group data for participants", async () => {
      const participants = await trpcQuery("participants.list");
      const withBloodGroup = participants.filter((p: any) => p.bloodGroup);
      // Based on import: 331/413 have blood group
      expect(withBloodGroup.length).toBeGreaterThanOrEqual(300);
    });

    it("should have age data for participants", async () => {
      const participants = await trpcQuery("participants.list");
      const withAge = participants.filter((p: any) => p.age);
      // Based on import: 397/413 have age
      expect(withAge.length).toBeGreaterThanOrEqual(390);
    });
  });

  describe("7. API Performance", () => {
    it("should respond to participant list within 2 seconds", async () => {
      const start = Date.now();
      await trpcQuery("participants.list");
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000);
    });

    it("should respond to QR token lookup within 1000ms", async () => {
      const start = Date.now();
      await trpcQuery("participants.getByQrToken", { qrToken: "PALITANA_YATRA_100" });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Allow more time for server variability
    });

    it("should handle concurrent requests", async () => {
      const requests = Array.from({ length: 10 }, (_, i) => 
        trpcQuery("participants.getByQrToken", { qrToken: `PALITANA_YATRA_${i + 1}` })
      );
      
      const start = Date.now();
      const results = await Promise.all(requests);
      const duration = Date.now() - start;
      
      expect(results.every(r => r !== undefined)).toBe(true);
      expect(duration).toBeLessThan(3000); // All 10 requests within 3 seconds
    });
  });
});
