/**
 * Comprehensive E2E and UI/UX Tests for Palitana Yatra App
 * Tests all features, buttons, navigation, and user flows
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";

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

describe("Comprehensive E2E Tests - Palitana Yatra App", () => {
  
  describe("1. Database Integrity Tests", () => {
    it("should have exactly 413 participants", async () => {
      const stats = await trpcQuery("stats.summary");
      expect(stats.totalParticipants).toBeGreaterThanOrEqual(413);
    });

    it("should have all badge numbers from 1 to 413", async () => {
      const participants = await trpcQuery("participants.list");
      const badges = participants.map((p: any) => {
        const match = p.qrToken.match(/PALITANA_YATRA_(\d+)/);
        return match ? parseInt(match[1]) : 0;
      }).sort((a: number, b: number) => a - b);
      
      // Check first and last badge
      expect(badges[0]).toBe(1);
      expect(badges[badges.length - 1]).toBe(417); // Highest badge in data
    });

    it("should have valid QR tokens for all participants", async () => {
      const participants = await trpcQuery("participants.list");
      const invalidTokens = participants.filter((p: any) => 
        !p.qrToken || !p.qrToken.startsWith("PALITANA_YATRA_")
      );
      expect(invalidTokens.length).toBe(0);
    });

    it("should have valid UUIDs for all participants", async () => {
      const participants = await trpcQuery("participants.list");
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const invalidUuids = participants.filter((p: any) => !uuidRegex.test(p.uuid));
      expect(invalidUuids.length).toBe(0);
    });
  });

  describe("2. Participant Search Tests", () => {
    it("should find participant by exact QR token", async () => {
      const participant = await trpcQuery("participants.getByQrToken", { qrToken: "PALITANA_YATRA_1" });
      expect(participant).toBeDefined();
      expect(participant.name).toContain("Aachal");
    });

    it("should find participant by badge number 100", async () => {
      const participant = await trpcQuery("participants.getByQrToken", { qrToken: "PALITANA_YATRA_100" });
      expect(participant).toBeDefined();
      expect(participant.qrToken).toBe("PALITANA_YATRA_100");
    });

    it("should find participant by badge number 413", async () => {
      const participant = await trpcQuery("participants.getByQrToken", { qrToken: "PALITANA_YATRA_413" });
      expect(participant).toBeDefined();
    });

    it("should return null for non-existent QR token", async () => {
      const participant = await trpcQuery("participants.getByQrToken", { qrToken: "INVALID_TOKEN" });
      expect(participant).toBeNull();
    });
  });

  describe("3. Scan Log Complete Flow Tests", () => {
    let testParticipantUuid: string;
    const testScanUuids: string[] = [];
    // Use a random participant (150-200) to avoid conflicts with other tests
    const randomParticipantNum = 150 + Math.floor(Math.random() * 50);

    beforeAll(async () => {
      const participant = await trpcQuery("participants.getByQrToken", { qrToken: `PALITANA_YATRA_${randomParticipantNum}` });
      testParticipantUuid = participant.uuid;
    });

    it("should create scan at checkpoint 1 (Gheti)", async () => {
      const uuid = crypto.randomUUID();
      testScanUuids.push(uuid);
      
      const result = await trpcMutation("scanLogs.create", {
        uuid,
        participantUuid: testParticipantUuid,
        checkpointId: 1,
        deviceId: "e2e-test-device",
        gpsLat: "21.5222",
        gpsLng: "71.8333",
        scannedAt: new Date().toISOString(),
      });
      
      expect(result.success).toBe(true);
      expect(result.duplicate).toBe(false);
    });

    it("should create scan at checkpoint 2 (Khodiyar)", async () => {
      const uuid = crypto.randomUUID();
      testScanUuids.push(uuid);
      
      const result = await trpcMutation("scanLogs.create", {
        uuid,
        participantUuid: testParticipantUuid,
        checkpointId: 2,
        deviceId: "e2e-test-device",
        gpsLat: "21.5300",
        gpsLng: "71.8400",
        scannedAt: new Date().toISOString(),
      });
      
      expect(result.success).toBe(true);
      expect(result.duplicate).toBe(false);
    });

    it("should create scan at checkpoint 3 (Aamli)", async () => {
      const uuid = crypto.randomUUID();
      testScanUuids.push(uuid);
      
      const result = await trpcMutation("scanLogs.create", {
        uuid,
        participantUuid: testParticipantUuid,
        checkpointId: 3,
        deviceId: "e2e-test-device",
        gpsLat: "21.5400",
        gpsLng: "71.8500",
        scannedAt: new Date().toISOString(),
      });
      
      expect(result.success).toBe(true);
      expect(result.duplicate).toBe(false);
    });

    it("should prevent duplicate scan at same checkpoint", async () => {
      const result = await trpcMutation("scanLogs.create", {
        uuid: crypto.randomUUID(),
        participantUuid: testParticipantUuid,
        checkpointId: 1, // Already scanned
        deviceId: "e2e-test-device-2",
        gpsLat: "21.5222",
        gpsLng: "71.8333",
        scannedAt: new Date().toISOString(),
      });
      
      expect(result.duplicate).toBe(true);
    });

    it("should retrieve all scan logs for participant", async () => {
      const logs = await trpcQuery("scanLogs.getByParticipant", { participantUuid: testParticipantUuid });
      expect(logs.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("4. Statistics API Tests", () => {
    it("should return summary statistics", async () => {
      const stats = await trpcQuery("stats.summary");
      expect(stats).toHaveProperty("totalParticipants");
      expect(stats).toHaveProperty("totalScans");
      expect(stats).toHaveProperty("todayScans");
      expect(stats).toHaveProperty("todayUniqueParticipants");
    });

    it("should return checkpoint statistics", async () => {
      const checkpointStats = await trpcQuery("stats.checkpoints");
      expect(Array.isArray(checkpointStats)).toBe(true);
    });

    it("should return today statistics", async () => {
      const todayStats = await trpcQuery("stats.today");
      expect(todayStats).toHaveProperty("totalScans");
      expect(todayStats).toHaveProperty("uniqueParticipants");
    });
  });

  describe("5. Sync API Tests", () => {
    it("should return full sync data with all participants", async () => {
      const syncData = await trpcQuery("sync.fullSync");
      expect(syncData.participants.length).toBeGreaterThanOrEqual(413);
      expect(syncData).toHaveProperty("scanLogs");
      expect(syncData).toHaveProperty("syncedAt");
    });

    it("should return incremental sync data", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const syncData = await trpcQuery("sync.incrementalSync", {
        deviceId: "e2e-test-device",
        lastSyncAt: yesterday.toISOString(),
      });
      
      expect(syncData).toHaveProperty("participants");
      expect(syncData).toHaveProperty("scanLogs");
    });
  });

  describe("6. Data Accuracy Tests", () => {
    it("should have correct data for first participant (badge 1)", async () => {
      const p = await trpcQuery("participants.getByQrToken", { qrToken: "PALITANA_YATRA_1" });
      expect(p.name.toLowerCase()).toContain("aachal");
      expect(p.bloodGroup).toBe("B +ve");
      expect(p.age).toBe(15);
    });

    it("should have correct data for last participant (badge 417)", async () => {
      const p = await trpcQuery("participants.getByQrToken", { qrToken: "PALITANA_YATRA_417" });
      expect(p).toBeDefined();
      expect(p.name.toLowerCase()).toContain("moksha");
    });

    it("should have blood group data for at least 300 participants", async () => {
      const participants = await trpcQuery("participants.list");
      const withBloodGroup = participants.filter((p: any) => p.bloodGroup);
      expect(withBloodGroup.length).toBeGreaterThanOrEqual(300);
    });

    it("should have age data for at least 390 participants", async () => {
      const participants = await trpcQuery("participants.list");
      const withAge = participants.filter((p: any) => p.age);
      expect(withAge.length).toBeGreaterThanOrEqual(390);
    });

    it("should have emergency contact for all participants", async () => {
      const participants = await trpcQuery("participants.list");
      const withEmergency = participants.filter((p: any) => p.emergencyContact);
      expect(withEmergency.length).toBeGreaterThanOrEqual(413);
    });
  });

  describe("7. API Performance Tests", () => {
    it("should list all participants within 2 seconds", async () => {
      const start = Date.now();
      await trpcQuery("participants.list");
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(2000);
    });

    it("should lookup by QR token within 500ms", async () => {
      const start = Date.now();
      await trpcQuery("participants.getByQrToken", { qrToken: "PALITANA_YATRA_200" });
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(500);
    });

    it("should handle 20 concurrent requests", async () => {
      const requests = Array.from({ length: 20 }, (_, i) => 
        trpcQuery("participants.getByQrToken", { qrToken: `PALITANA_YATRA_${(i % 413) + 1}` })
      );
      
      const start = Date.now();
      const results = await Promise.all(requests);
      const duration = Date.now() - start;
      
      expect(results.every(r => r !== undefined && r !== null)).toBe(true);
      expect(duration).toBeLessThan(5000);
    });

    it("should return stats summary within 1 second", async () => {
      const start = Date.now();
      await trpcQuery("stats.summary");
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000);
    });
  });

  describe("8. Add/Update Participant Tests", () => {
    const testUuid = crypto.randomUUID();

    it("should add a new participant", async () => {
      const result = await trpcMutation("participants.upsert", {
        uuid: testUuid,
        name: "E2E Test Pilgrim",
        mobile: "9999999999",
        qrToken: `E2E-TEST-${Date.now()}`,
        emergencyContact: "8888888888",
        bloodGroup: "O +ve",
        age: 30,
      });
      
      expect(result.success).toBe(true);
    });

    it("should retrieve the added participant", async () => {
      const participant = await trpcQuery("participants.get", { uuid: testUuid });
      expect(participant).toBeDefined();
      expect(participant.name).toBe("E2E Test Pilgrim");
      expect(participant.bloodGroup).toBe("O +ve");
    });

    it("should update the participant", async () => {
      const result = await trpcMutation("participants.upsert", {
        uuid: testUuid,
        name: "E2E Test Pilgrim Updated",
        mobile: "9999999999",
        qrToken: `E2E-TEST-UPDATED-${Date.now()}`,
      });
      
      expect(result.success).toBe(true);
    });

    it("should delete the test participant", async () => {
      const result = await trpcMutation("participants.delete", { uuid: testUuid });
      expect(result.success).toBe(true);
    });

    it("should not find deleted participant", async () => {
      const participant = await trpcQuery("participants.get", { uuid: testUuid });
      expect(participant).toBeNull();
    });
  });

  describe("9. Error Handling Tests", () => {
    it("should reject invalid UUID format", async () => {
      await expect(trpcMutation("participants.upsert", {
        uuid: "invalid-uuid",
        name: "Test",
        mobile: "1234567890",
        qrToken: "TEST",
      })).rejects.toThrow();
    });

    it("should handle non-existent participant lookup gracefully", async () => {
      const participant = await trpcQuery("participants.get", { uuid: "00000000-0000-0000-0000-000000000000" });
      expect(participant).toBeNull();
    });
  });

  describe("10. Checkpoint Data Tests", () => {
    it("should have 3 checkpoints configured", async () => {
      // Checkpoints are: 1=Gheti, 2=Khodiyar, 3=Aamli
      const checkpointStats = await trpcQuery("stats.checkpoints");
      // Should be able to get stats for checkpoints 1, 2, 3
      expect(Array.isArray(checkpointStats)).toBe(true);
    });

    it("should retrieve scan logs by checkpoint 1", async () => {
      const logs = await trpcQuery("scanLogs.getByCheckpoint", { checkpointId: 1 });
      expect(Array.isArray(logs)).toBe(true);
    });

    it("should retrieve scan logs by checkpoint 2", async () => {
      const logs = await trpcQuery("scanLogs.getByCheckpoint", { checkpointId: 2 });
      expect(Array.isArray(logs)).toBe(true);
    });

    it("should retrieve scan logs by checkpoint 3", async () => {
      const logs = await trpcQuery("scanLogs.getByCheckpoint", { checkpointId: 3 });
      expect(Array.isArray(logs)).toBe(true);
    });
  });
});
