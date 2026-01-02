import { z } from "zod";
import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import * as db from "./db";

// Zod schemas for validation
const participantSchema = z.object({
  uuid: z.string().uuid(),
  name: z.string().min(1).max(255),
  mobile: z.string().max(20).optional().nullable(),
  qrToken: z.string().min(1).max(64),
  groupName: z.string().max(255).optional().nullable(),
  emergencyContact: z.string().max(20).optional().nullable(),
  emergencyContactName: z.string().max(255).optional().nullable(),
  emergencyContactRelation: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
  photoUri: z.string().optional().nullable(),
  bloodGroup: z.string().max(10).optional().nullable(),
  medicalConditions: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  medications: z.string().optional().nullable(),
  age: z.number().int().positive().optional().nullable(),
  gender: z.enum(["male", "female", "other"]).optional().nullable(),
});

const scanLogSchema = z.object({
  uuid: z.string().uuid(),
  participantUuid: z.string().uuid(),
  checkpointId: z.number().int().positive(),
  deviceId: z.string().max(64).optional().nullable(),
  gpsLat: z.string().optional().nullable(),
  gpsLng: z.string().optional().nullable(),
  scannedAt: z.string().datetime(),
});

const familyGroupSchema = z.object({
  uuid: z.string().uuid(),
  name: z.string().min(1).max(255),
  headOfFamilyUuid: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  memberUuids: z.array(z.string().uuid()).optional(),
});

const checkpointNoteSchema = z.object({
  uuid: z.string().uuid(),
  checkpointId: z.number().int().positive(),
  participantUuid: z.string().uuid().optional().nullable(),
  volunteerUuid: z.string().uuid().optional().nullable(),
  note: z.string().min(1),
  noteType: z.enum(["general", "medical", "assistance", "other"]).default("general"),
});

const lostFoundItemSchema = z.object({
  uuid: z.string().uuid(),
  itemType: z.enum(["lost", "found"]),
  description: z.string().min(1),
  location: z.string().max(255).optional().nullable(),
  reportedBy: z.string().max(255).optional().nullable(),
  photoUri: z.string().optional().nullable(),
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== PARTICIPANTS API ====================
  participants: router({
    // Get all participants
    list: publicProcedure.query(async () => {
      return db.getAllParticipants();
    }),

    // Get participant by UUID
    get: publicProcedure
      .input(z.object({ uuid: z.string().uuid() }))
      .query(async ({ input }) => {
        return db.getParticipantByUuid(input.uuid);
      }),

    // Get participant by QR token
    getByQrToken: publicProcedure
      .input(z.object({ qrToken: z.string() }))
      .query(async ({ input }) => {
        return db.getParticipantByQrToken(input.qrToken);
      }),

    // Get participants updated since a timestamp (for sync)
    getUpdatedSince: publicProcedure
      .input(z.object({ since: z.string().datetime() }))
      .query(async ({ input }) => {
        return db.getParticipantsUpdatedSince(new Date(input.since));
      }),

    // Create or update a participant
    upsert: publicProcedure
      .input(participantSchema)
      .mutation(async ({ input }) => {
        await db.upsertParticipant(input);
        return { success: true };
      }),

    // Bulk create/update participants
    bulkUpsert: publicProcedure
      .input(z.object({ participants: z.array(participantSchema) }))
      .mutation(async ({ input }) => {
        await db.bulkUpsertParticipants(input.participants);
        return { success: true, count: input.participants.length };
      }),

    // Delete a participant
    delete: publicProcedure
      .input(z.object({ uuid: z.string().uuid() }))
      .mutation(async ({ input }) => {
        await db.deleteParticipant(input.uuid);
        return { success: true };
      }),
  }),

  // ==================== SCAN LOGS API ====================
  scanLogs: router({
    // Get all scan logs
    list: publicProcedure.query(async () => {
      return db.getAllScanLogs();
    }),

    // Get scan logs by participant
    getByParticipant: publicProcedure
      .input(z.object({ participantUuid: z.string().uuid() }))
      .query(async ({ input }) => {
        return db.getScanLogsByParticipant(input.participantUuid);
      }),

    // Get scan logs by checkpoint
    getByCheckpoint: publicProcedure
      .input(z.object({ checkpointId: z.number().int() }))
      .query(async ({ input }) => {
        return db.getScanLogsByCheckpoint(input.checkpointId);
      }),

    // Get scan logs created since a timestamp (for sync)
    getUpdatedSince: publicProcedure
      .input(z.object({ since: z.string().datetime() }))
      .query(async ({ input }) => {
        return db.getScanLogsUpdatedSince(new Date(input.since));
      }),

    // Create a scan log
    create: publicProcedure
      .input(scanLogSchema)
      .mutation(async ({ input }) => {
        const result = await db.createScanLog({
          ...input,
          scannedAt: new Date(input.scannedAt),
        });
        return result;
      }),

    // Bulk create scan logs
    bulkCreate: publicProcedure
      .input(z.object({ scanLogs: z.array(scanLogSchema) }))
      .mutation(async ({ input }) => {
        const results = await db.bulkCreateScanLogs(
          input.scanLogs.map(log => ({
            ...log,
            scannedAt: new Date(log.scannedAt),
          }))
        );
        return { success: true, results };
      }),

    // Clear all scan logs (admin function)
    clearAll: publicProcedure
      .mutation(async () => {
        await db.clearAllScanLogs();
        return { success: true };
      }),
  }),

  // ==================== FAMILY GROUPS API ====================
  familyGroups: router({
    // Get all family groups
    list: publicProcedure.query(async () => {
      return db.getAllFamilyGroups();
    }),

    // Get family group members
    getMembers: publicProcedure
      .input(z.object({ familyGroupUuid: z.string().uuid() }))
      .query(async ({ input }) => {
        return db.getFamilyGroupMembers(input.familyGroupUuid);
      }),

    // Create or update a family group
    upsert: publicProcedure
      .input(familyGroupSchema)
      .mutation(async ({ input }) => {
        const { memberUuids, ...groupData } = input;
        await db.upsertFamilyGroup(groupData);
        
        // Add members if provided
        if (memberUuids && memberUuids.length > 0) {
          for (const memberUuid of memberUuids) {
            await db.addFamilyGroupMember({
              familyGroupUuid: input.uuid,
              participantUuid: memberUuid,
            });
          }
        }
        
        return { success: true };
      }),
  }),

  // ==================== CHECKPOINT NOTES API ====================
  checkpointNotes: router({
    // Get notes for a checkpoint
    getByCheckpoint: publicProcedure
      .input(z.object({ checkpointId: z.number().int() }))
      .query(async ({ input }) => {
        return db.getCheckpointNotes(input.checkpointId);
      }),

    // Create a checkpoint note
    create: publicProcedure
      .input(checkpointNoteSchema)
      .mutation(async ({ input }) => {
        await db.createCheckpointNote(input);
        return { success: true };
      }),
  }),

  // ==================== LOST & FOUND API ====================
  lostFound: router({
    // Get all lost and found items
    list: publicProcedure.query(async () => {
      return db.getAllLostFoundItems();
    }),

    // Create a lost/found item
    create: publicProcedure
      .input(lostFoundItemSchema)
      .mutation(async ({ input }) => {
        await db.createLostFoundItem(input);
        return { success: true };
      }),

    // Update item status
    updateStatus: publicProcedure
      .input(z.object({
        uuid: z.string().uuid(),
        status: z.enum(["open", "resolved"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateLostFoundItemStatus(input.uuid, input.status);
        return { success: true };
      }),
  }),

  // ==================== SYNC API ====================
  sync: router({
    // Get all data for initial sync
    fullSync: publicProcedure.query(async () => {
      const [participantsList, scanLogsList, familyGroupsList] = await Promise.all([
        db.getAllParticipants(),
        db.getAllScanLogs(),
        db.getAllFamilyGroups(),
      ]);
      
      return {
        participants: participantsList,
        scanLogs: scanLogsList,
        familyGroups: familyGroupsList,
        syncedAt: new Date().toISOString(),
      };
    }),

    // Get incremental updates since last sync
    incrementalSync: publicProcedure
      .input(z.object({ 
        deviceId: z.string(),
        lastSyncAt: z.string().datetime(),
      }))
      .query(async ({ input }) => {
        const since = new Date(input.lastSyncAt);
        
        const [participantsList, scanLogsList] = await Promise.all([
          db.getParticipantsUpdatedSince(since),
          db.getScanLogsUpdatedSince(since),
        ]);
        
        return {
          participants: participantsList,
          scanLogs: scanLogsList,
          syncedAt: new Date().toISOString(),
        };
      }),

    // Push local changes to server
    pushChanges: publicProcedure
      .input(z.object({
        deviceId: z.string(),
        participants: z.array(participantSchema).optional(),
        scanLogs: z.array(scanLogSchema).optional(),
      }))
      .mutation(async ({ input }) => {
        const results = {
          participantsUpserted: 0,
          scanLogsCreated: 0,
          scanLogsDuplicate: 0,
        };
        
        // Upsert participants
        if (input.participants && input.participants.length > 0) {
          await db.bulkUpsertParticipants(input.participants);
          results.participantsUpserted = input.participants.length;
        }
        
        // Create scan logs
        if (input.scanLogs && input.scanLogs.length > 0) {
          const scanResults = await db.bulkCreateScanLogs(
            input.scanLogs.map(log => ({
              ...log,
              scannedAt: new Date(log.scannedAt),
            }))
          );
          results.scanLogsCreated = scanResults.filter(r => r.success).length;
          results.scanLogsDuplicate = scanResults.filter(r => r.duplicate).length;
        }
        
        // Update sync metadata
        await db.updateSyncMetadata(input.deviceId);
        
        return {
          success: true,
          ...results,
          syncedAt: new Date().toISOString(),
        };
      }),
  }),

  // ==================== AI ANALYSIS API ====================
  ai: router({
    // Analyze Yatra data using AI with direct database access
    analyzeYatraData: publicProcedure
      .input(z.object({
        question: z.string().min(1).max(500),
      }))
      .mutation(async ({ input }) => {
        try {
          // Fetch all data directly from database for comprehensive analysis
          const [participants, scanLogs, todayStats, checkpointStats] = await Promise.all([
            db.getAllParticipants(),
            db.getAllScanLogs(),
            db.getTodayStats(),
            db.getCheckpointStats(),
          ]);

          // Calculate Jatra completions (Gheti scans = checkpoint 2)
          const ghetiScans = scanLogs.filter(s => s.checkpointId === 2);
          const totalJatras = ghetiScans.length;

          // Calculate per-pilgrim stats
          const pilgrimStats = new Map<string, { name: string; badge: number; scans: number; jatras: number; lastScan: Date | null }>();
          
          for (const p of participants) {
            const badge = parseInt(p.qrToken.replace('PALITANA_YATRA_', ''));
            pilgrimStats.set(p.uuid, { name: p.name, badge, scans: 0, jatras: 0, lastScan: null });
          }
          
          for (const scan of scanLogs) {
            const stat = pilgrimStats.get(scan.participantUuid);
            if (stat) {
              stat.scans++;
              if (scan.checkpointId === 2) stat.jatras++; // Gheti = Jatra complete
              if (!stat.lastScan || new Date(scan.scannedAt) > stat.lastScan) {
                stat.lastScan = new Date(scan.scannedAt);
              }
            }
          }

          // Find top performers
          const pilgrimArray = Array.from(pilgrimStats.values());
          const topByJatras = [...pilgrimArray].sort((a, b) => b.jatras - a.jatras).slice(0, 10);
          const notStarted = pilgrimArray.filter(p => p.scans === 0);
          const inProgress = pilgrimArray.filter(p => p.scans > 0 && p.jatras === 0);
          const completed = pilgrimArray.filter(p => p.jatras > 0);

          // Recent activity (last 2 hours)
          const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
          const recentScans = scanLogs.filter(s => new Date(s.scannedAt) > twoHoursAgo);

          // Build comprehensive context for AI
          const systemPrompt = `You are a dedicated AI assistant ONLY for the Palitana Yatra pilgrimage tracking app.
You have DIRECT ACCESS to the database and can answer specific questions about pilgrims and the Yatra.

**LANGUAGE SUPPORT:**
- If the user asks in Gujarati (ગુજરાતી), respond in Gujarati
- If the user asks in Hindi (हिंदी), respond in Hindi
- Otherwise, respond in English
- Always use "Jai Jinendra" (જય જિનેંદ્ર) greeting

**IMPORTANT: You MUST ONLY answer questions related to:**
- Palitana Yatra pilgrimage data (pilgrims, scans, checkpoints, Jatras)
- Pilgrim statistics and progress
- Checkpoint information
- Scan logs and activity
- Jain pilgrimage context

**You MUST REFUSE to answer questions about:**
- General knowledge, news, weather, sports, politics
- Coding, programming, or technical help unrelated to this app
- Personal advice, health, finance, or legal matters
- Any topic not directly related to the Palitana Yatra pilgrimage

If someone asks an off-topic question in English, politely respond:
"Jai Jinendra! 🙏 I'm specifically designed to help with Palitana Yatra pilgrimage data only. Please ask me about pilgrim progress, Jatra completions, checkpoint statistics, or specific pilgrims by name or badge number."

If someone asks an off-topic question in Gujarati, politely respond:
"જય જિનેંદ્ર! 🙏 હું ફક્ત પાલિતાણા યાત્રા ડેટા માટે ડિઝાઇન કરેલ છું. કૃપા કરીને યાત્રિકોની પ્રગતિ, જાત્રા પૂર્ણતા, ચેકપોઇન્ટ આંકડા, અથવા નામ અથવા બેજ નંબર દ્વારા યાત્રિકો વિશે પૂછો."

Context about the Yatra:
- Pilgrims climb Shatrunjaya hill multiple times (called Jatras)
- 3 checkpoints: Aamli (1-midway on descent), Gheti (2-bottom, marks Jatra completion), X (3-front side, final descent)
- Each Gheti scan = 1 completed Jatra
- Event spans 2 days

=== LIVE DATABASE STATISTICS ===
Total Pilgrims: ${participants.length}
Total Scans: ${scanLogs.length}
Total Jatras Completed: ${totalJatras}

Pilgrim Status:
- Not Started: ${notStarted.length} pilgrims
- In Progress: ${inProgress.length} pilgrims (scanned but no Jatra complete)
- Completed at least 1 Jatra: ${completed.length} pilgrims

Checkpoint Breakdown:
${checkpointStats.map(c => `- Checkpoint ${c.checkpointId}: ${c.scanCount} scans`).join('\n')}

Top 10 Pilgrims by Jatras:
${topByJatras.map((p, i) => `${i + 1}. ${p.name} (#${p.badge}): ${p.jatras} Jatras, ${p.scans} total scans`).join('\n')}

Recent Activity (last 2 hours): ${recentScans.length} scans

=== FULL PILGRIM DATABASE ===
${pilgrimArray.slice(0, 50).map(p => `#${p.badge} ${p.name}: ${p.scans} scans, ${p.jatras} Jatras${p.lastScan ? ', last: ' + p.lastScan.toLocaleTimeString() : ''}`).join('\n')}
${pilgrimArray.length > 50 ? `\n... and ${pilgrimArray.length - 50} more pilgrims` : ''}

You can answer questions like:
- "How many Jatras has badge #50 completed?"
- "Who completed the most Jatras?"
- "Which pilgrims haven't started yet?"
- "What's the average Jatras per pilgrim?"
- "Show me pilgrims with 3+ Jatras"

Provide helpful, accurate answers based on the data. Use Jai Jinendra greeting. Keep responses concise but informative.`;

          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: input.question },
            ],
          });

          const answer = response.choices?.[0]?.message?.content || "I couldn't analyze the data. Please try again.";
          return { answer: typeof answer === 'string' ? answer : String(answer) };
        } catch (error) {
          console.error("[AI] Error analyzing Yatra data:", error);
          return { answer: "Sorry, I couldn't process your question right now. Please try again later." };
        }
      }),
  }),

  // ==================== STATISTICS API ====================
  stats: router({
    // Get checkpoint statistics
    checkpoints: publicProcedure.query(async () => {
      return db.getCheckpointStats();
    }),

    // Get today's statistics
    today: publicProcedure.query(async () => {
      return db.getTodayStats();
    }),

    // Get overall summary
    summary: publicProcedure.query(async () => {
      const [participantsList, scanLogsList, todayStats] = await Promise.all([
        db.getAllParticipants(),
        db.getAllScanLogs(),
        db.getTodayStats(),
      ]);
      
      return {
        totalParticipants: participantsList.length,
        totalScans: scanLogsList.length,
        todayScans: todayStats.totalScans,
        todayUniqueParticipants: todayStats.uniqueParticipants,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
