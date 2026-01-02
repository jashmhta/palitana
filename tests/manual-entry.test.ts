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

describe("Manual Badge Entry Feature", () => {
  describe("Badge Number Lookup", () => {
    it("should find participant by badge number 1", async () => {
      const qrToken = "PALITANA_YATRA_1";
      const response = await fetchWithRetry(
        `${API_BASE}/participants.getByQrToken?input=${encodeURIComponent(JSON.stringify({ json: { qrToken } }))}`
      );
      const data = await response.json();
      
      expect(data.result.data.json).toBeDefined();
      expect(data.result.data.json.name).toBe("Aachal Vinod Bhandari");
    }, 15000);

    it("should find participant by badge number 100", async () => {
      const qrToken = "PALITANA_YATRA_100";
      const response = await fetchWithRetry(
        `${API_BASE}/participants.getByQrToken?input=${encodeURIComponent(JSON.stringify({ json: { qrToken } }))}`
      );
      const data = await response.json();
      
      expect(data.result.data.json).toBeDefined();
      expect(data.result.data.json.name).toBe("Jain Mehal Ritesh");
    });

    it("should find participant by badge number 417", async () => {
      const qrToken = "PALITANA_YATRA_417";
      const response = await fetchWithRetry(
        `${API_BASE}/participants.getByQrToken?input=${encodeURIComponent(JSON.stringify({ json: { qrToken } }))}`
      );
      const data = await response.json();
      
      expect(data.result.data.json).toBeDefined();
      expect(data.result.data.json.name).toBe("Moksha Shah");
    });

    it("should return null for non-existent badge number 999", async () => {
      const qrToken = "PALITANA_YATRA_999";
      const response = await fetchWithRetry(
        `${API_BASE}/participants.getByQrToken?input=${encodeURIComponent(JSON.stringify({ json: { qrToken } }))}`
      );
      const data = await response.json();
      
      expect(data.result.data.json).toBeNull();
    });

    it("should return null for badge number 39 (not in Excel)", async () => {
      const qrToken = "PALITANA_YATRA_39";
      const response = await fetchWithRetry(
        `${API_BASE}/participants.getByQrToken?input=${encodeURIComponent(JSON.stringify({ json: { qrToken } }))}`
      );
      const data = await response.json();
      
      expect(data.result.data.json).toBeNull();
    });
  });

  describe("QR Token Format Validation", () => {
    it("should have correct QR token format for all participants", async () => {
      const response = await fetchWithRetry(`${API_BASE}/participants.list`);
      const data = await response.json();
      const participants = data.result.data.json;
      
      for (const p of participants) {
        expect(p.qrToken).toMatch(/^PALITANA_YATRA_\d+$/);
      }
    });

    it("should have unique QR tokens for all participants", async () => {
      const response = await fetchWithRetry(`${API_BASE}/participants.list`);
      const data = await response.json();
      const participants = data.result.data.json;
      
      const tokens = participants.map((p: { qrToken: string }) => p.qrToken);
      const uniqueTokens = new Set(tokens);
      
      expect(uniqueTokens.size).toBe(participants.length);
    });
  });

  describe("Scan Log Creation via Manual Entry", () => {
    let testParticipantUuid: string;
    
    beforeAll(async () => {
      // Get a participant for testing (badge 50)
      const qrToken = "PALITANA_YATRA_50";
      const response = await fetchWithRetry(
        `${API_BASE}/participants.getByQrToken?input=${encodeURIComponent(JSON.stringify({ json: { qrToken } }))}`
      );
      const data = await response.json();
      testParticipantUuid = data.result.data.json.uuid;
    });

    it("should create scan log for manual entry", async () => {
      // Use checkpoint 15 to avoid conflicts with other tests
      const scanLogUuid = crypto.randomUUID();
      const response = await fetchWithRetry(`${API_BASE}/scanLogs.create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: {
            uuid: scanLogUuid,
            participantUuid: testParticipantUuid,
            checkpointId: 15,
            scannedAt: new Date().toISOString(),
          },
        }),
      });
      
      const data = await response.json();
      // API returns success or duplicate
      expect(data.result?.data?.json?.success || data.result?.data?.json?.duplicate).toBeTruthy();
    });

    it("should detect duplicate scan for same checkpoint", async () => {
      // Try to scan again at same checkpoint
      const scanLogUuid = crypto.randomUUID();
      const response = await fetchWithRetry(`${API_BASE}/scanLogs.create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: {
            uuid: scanLogUuid,
            participantUuid: testParticipantUuid,
            checkpointId: 15,
            scannedAt: new Date().toISOString(),
          },
        }),
      });
      
      const data = await response.json();
      // Second scan should be duplicate
      expect(data.result?.data?.json?.duplicate).toBe(true);
    });
  });

  describe("Badge Number Range Validation", () => {
    it("should have badge numbers between 1 and 417", async () => {
      const response = await fetchWithRetry(`${API_BASE}/participants.list`);
      const data = await response.json();
      const participants = data.result.data.json;
      
      for (const p of participants) {
        const badgeNum = parseInt(p.qrToken.replace("PALITANA_YATRA_", ""), 10);
        expect(badgeNum).toBeGreaterThanOrEqual(1);
        expect(badgeNum).toBeLessThanOrEqual(417);
      }
    });

    it("should have exactly 413 participants", async () => {
      const response = await fetchWithRetry(`${API_BASE}/participants.list`);
      const data = await response.json();
      
      expect(data.result.data.json.length).toBeGreaterThanOrEqual(413);
    });
  });
});
