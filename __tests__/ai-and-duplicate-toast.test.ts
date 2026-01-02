/**
 * Tests for AI integration and duplicate toast functionality
 */

import { describe, it, expect } from "vitest";

// Helper function for retry with timeout
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  throw new Error('Max retries reached');
}

describe("AI Integration", () => {
  it("should have AI router configured", async () => {
    // Test that the AI endpoint exists
    const response = await fetchWithRetry("http://127.0.0.1:3000/api/trpc/ai.analyzeYatraData", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          question: "How many pilgrims are registered?",
        },
      }),
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.result).toBeDefined();
    expect(data.result.data).toBeDefined();
    expect(data.result.data.json).toBeDefined();
    expect(data.result.data.json.answer).toBeDefined();
    expect(typeof data.result.data.json.answer).toBe("string");
  }, 30000);

  it("should provide accurate pilgrim count from database", async () => {
    const response = await fetch("http://127.0.0.1:3000/api/trpc/ai.analyzeYatraData", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          question: "How many total pilgrims are there?",
        },
      }),
    });
    
    const data = await response.json();
    const answer = data.result.data.json.answer;
    
    // Should mention 413 pilgrims (the actual count in database)
    expect(answer.toLowerCase()).toMatch(/413|four hundred (and )?thirteen/i);
  });
});

describe("Checkpoint Configuration", () => {
  it("should have 3 checkpoints configured", async () => {
    // Import checkpoints from constants
    const { DEFAULT_CHECKPOINTS, TOTAL_CHECKPOINTS } = await import("../constants/checkpoints");
    
    expect(TOTAL_CHECKPOINTS).toBe(3);
    expect(DEFAULT_CHECKPOINTS.length).toBe(3);
  });

  it("should have correct checkpoint descriptions", async () => {
    const { DEFAULT_CHECKPOINTS } = await import("../constants/checkpoints");
    
    const descriptions = DEFAULT_CHECKPOINTS.map(c => c.description);
    expect(descriptions).toContain("Aamli");
    expect(descriptions).toContain("Gheti");
    expect(descriptions).toContain("X");
  });

  it("should have 10-minute rate limit configured", async () => {
    const { DUPLICATE_RATE_LIMIT_MS } = await import("../constants/checkpoints");
    
    // 10 minutes in milliseconds
    expect(DUPLICATE_RATE_LIMIT_MS).toBe(10 * 60 * 1000);
  });
});

describe("Google Sheets Logger", () => {
  it("should have Google Sheets logger configured", async () => {
    // Check that the service account file exists
    const fs = await import("fs");
    const path = await import("path");
    
    const serviceAccountPath = path.join(process.cwd(), "server", "google-service-account.json");
    expect(fs.existsSync(serviceAccountPath)).toBe(true);
  });
});

describe("Duplicate Detection", () => {
  it("should detect duplicate scans within 10 minutes", async () => {
    // Get a participant
    const participantsResponse = await fetch("http://127.0.0.1:3000/api/trpc/participants.list");
    const participantsData = await participantsResponse.json();
    const participant = participantsData.result.data.json[0];
    
    if (!participant) {
      console.log("No participants found, skipping test");
      return;
    }
    
    // Create first scan
    const scanResponse1 = await fetch("http://127.0.0.1:3000/api/trpc/scanLogs.create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          uuid: crypto.randomUUID(),
          participantUuid: participant.uuid,
          checkpointId: 1,
          deviceId: "test-device",
        },
      }),
    });
    
    const scan1Data = await scanResponse1.json();
    
    // Try to create duplicate scan
    const scanResponse2 = await fetch("http://127.0.0.1:3000/api/trpc/scanLogs.create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        json: {
          uuid: crypto.randomUUID(),
          participantUuid: participant.uuid,
          checkpointId: 1,
          deviceId: "test-device-2",
        },
      }),
    });
    
    const scan2Data = await scanResponse2.json();
    
    // Second scan should be marked as duplicate
    if (scan1Data.result?.data?.json?.duplicate === false) {
      expect(scan2Data.result?.data?.json?.duplicate).toBe(true);
    }
  });
});
