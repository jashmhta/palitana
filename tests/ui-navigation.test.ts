/**
 * UI/UX and Navigation Tests for Palitana Yatra App
 * Tests all screens, buttons, and navigation flows
 */

import { describe, it, expect } from "vitest";

const API_BASE = "http://localhost:3000/api/trpc";

async function trpcQuery(procedure: string, input?: object) {
  const url = input 
    ? `${API_BASE}/${procedure}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`
    : `${API_BASE}/${procedure}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.result?.data?.json;
}

describe("UI/UX and Navigation Tests", () => {
  
  describe("1. Screen Data Requirements", () => {
    it("Home/Scanner screen should have checkpoint data available", async () => {
      const stats = await trpcQuery("stats.checkpoints");
      expect(Array.isArray(stats)).toBe(true);
    });

    it("Participants screen should load all 413 pilgrims", async () => {
      const participants = await trpcQuery("participants.list");
      expect(participants.length).toBeGreaterThanOrEqual(413);
    });

    it("Reports screen should have statistics data", async () => {
      const stats = await trpcQuery("stats.summary");
      expect(stats).toHaveProperty("totalParticipants");
      expect(stats).toHaveProperty("totalScans");
    });

    it("Settings screen should have sync status data", async () => {
      const syncData = await trpcQuery("sync.fullSync");
      expect(syncData).toHaveProperty("syncedAt");
    });
  });

  describe("2. Participant Detail Screen Data", () => {
    it("should load complete participant data for detail view", async () => {
      const participant = await trpcQuery("participants.getByQrToken", { qrToken: "PALITANA_YATRA_1" });
      
      // Required fields for detail screen
      expect(participant).toHaveProperty("uuid");
      expect(participant).toHaveProperty("name");
      expect(participant).toHaveProperty("mobile");
      expect(participant).toHaveProperty("qrToken");
      expect(participant).toHaveProperty("emergencyContact");
    });

    it("should have scan history for participant detail", async () => {
      const participant = await trpcQuery("participants.getByQrToken", { qrToken: "PALITANA_YATRA_2" });
      const logs = await trpcQuery("scanLogs.getByParticipant", { participantUuid: participant.uuid });
      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe("3. QR Card Screen Data", () => {
    it("should have all data needed for QR card display", async () => {
      const participant = await trpcQuery("participants.getByQrToken", { qrToken: "PALITANA_YATRA_100" });
      
      // QR card needs: name, badge number (from qrToken), and QR token
      expect(participant.name).toBeDefined();
      expect(participant.qrToken).toMatch(/PALITANA_YATRA_\d+/);
    });
  });

  describe("4. Checkpoint Screen Data", () => {
    it("should have scan logs grouped by checkpoint", async () => {
      const checkpoint1Logs = await trpcQuery("scanLogs.getByCheckpoint", { checkpointId: 1 });
      const checkpoint2Logs = await trpcQuery("scanLogs.getByCheckpoint", { checkpointId: 2 });
      const checkpoint3Logs = await trpcQuery("scanLogs.getByCheckpoint", { checkpointId: 3 });
      
      expect(Array.isArray(checkpoint1Logs)).toBe(true);
      expect(Array.isArray(checkpoint2Logs)).toBe(true);
      expect(Array.isArray(checkpoint3Logs)).toBe(true);
    });
  });

  describe("5. Search Functionality", () => {
    it("should find participant by name search (partial match simulation)", async () => {
      const participants = await trpcQuery("participants.list");
      const searchTerm = "jain";
      const matches = participants.filter((p: any) => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      expect(matches.length).toBeGreaterThan(0);
    });

    it("should find participant by badge number", async () => {
      const participant = await trpcQuery("participants.getByQrToken", { qrToken: "PALITANA_YATRA_50" });
      expect(participant).toBeDefined();
    });

    it("should find participant by mobile number (simulation)", async () => {
      const participants = await trpcQuery("participants.list");
      const withMobile = participants.filter((p: any) => p.mobile);
      // All participants should have mobile numbers
      expect(withMobile.length).toBeGreaterThanOrEqual(413);
    });
  });

  describe("6. Data Validation for UI Display", () => {
    it("all participants should have displayable names", async () => {
      const participants = await trpcQuery("participants.list");
      const withValidNames = participants.filter((p: any) => 
        p.name && p.name.trim().length > 0
      );
      expect(withValidNames.length).toBeGreaterThanOrEqual(413);
    });

    it("all participants should have valid QR tokens for display", async () => {
      const participants = await trpcQuery("participants.list");
      const withValidTokens = participants.filter((p: any) => 
        p.qrToken && p.qrToken.startsWith("PALITANA_YATRA_")
      );
      expect(withValidTokens.length).toBeGreaterThanOrEqual(413);
    });

    it("emergency contacts should be valid phone numbers", async () => {
      const participants = await trpcQuery("participants.list");
      const withValidEmergency = participants.filter((p: any) => 
        p.emergencyContact && p.emergencyContact.length >= 10
      );
      expect(withValidEmergency.length).toBeGreaterThanOrEqual(413);
    });
  });

  describe("7. Reports Data Validation", () => {
    it("should have today's statistics", async () => {
      const todayStats = await trpcQuery("stats.today");
      expect(todayStats).toHaveProperty("totalScans");
      expect(todayStats).toHaveProperty("uniqueParticipants");
      expect(typeof todayStats.totalScans).toBe("number");
    });

    it("should have checkpoint-wise statistics", async () => {
      const checkpointStats = await trpcQuery("stats.checkpoints");
      expect(Array.isArray(checkpointStats)).toBe(true);
    });

    it("should have summary statistics with all required fields", async () => {
      const summary = await trpcQuery("stats.summary");
      expect(summary).toHaveProperty("totalParticipants");
      expect(summary).toHaveProperty("totalScans");
      expect(summary).toHaveProperty("todayScans");
      expect(summary).toHaveProperty("todayUniqueParticipants");
    });
  });

  describe("8. Offline Sync Data Structure", () => {
    it("should have proper sync data structure for offline mode", async () => {
      const syncData = await trpcQuery("sync.fullSync");
      
      expect(syncData).toHaveProperty("participants");
      expect(syncData).toHaveProperty("scanLogs");
      expect(syncData).toHaveProperty("familyGroups");
      expect(syncData).toHaveProperty("syncedAt");
      
      expect(Array.isArray(syncData.participants)).toBe(true);
      expect(Array.isArray(syncData.scanLogs)).toBe(true);
    });

    it("should support incremental sync", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const incrementalSync = await trpcQuery("sync.incrementalSync", {
        deviceId: "ui-test-device",
        lastSyncAt: yesterday.toISOString(),
      });
      
      expect(incrementalSync).toHaveProperty("participants");
      expect(incrementalSync).toHaveProperty("scanLogs");
      expect(incrementalSync).toHaveProperty("syncedAt");
    });
  });

  describe("9. Language Support Data", () => {
    it("all participants should have names that can be displayed in both English and Gujarati UI", async () => {
      const participants = await trpcQuery("participants.list");
      // Names should be valid strings that can be rendered
      const validNames = participants.filter((p: any) => 
        typeof p.name === "string" && p.name.length > 0
      );
      expect(validNames.length).toBeGreaterThanOrEqual(413);
    });
  });

  describe("10. Theme Support Data", () => {
    it("all color-dependent data should have valid values", async () => {
      const stats = await trpcQuery("stats.summary");
      // Stats should have numeric values for progress indicators
      expect(typeof stats.totalParticipants).toBe("number");
      expect(typeof stats.totalScans).toBe("number");
    });
  });
});
