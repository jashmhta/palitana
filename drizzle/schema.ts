import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, index } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Participants table - stores all pilgrims registered for the yatra
 */
export const participants = mysqlTable("participants", {
  id: int("id").autoincrement().primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(), // Client-generated UUID for sync
  name: varchar("name", { length: 255 }).notNull(),
  mobile: varchar("mobile", { length: 20 }),
  qrToken: varchar("qrToken", { length: 64 }).notNull().unique(),
  groupName: varchar("groupName", { length: 255 }),
  emergencyContact: varchar("emergencyContact", { length: 20 }),
  emergencyContactName: varchar("emergencyContactName", { length: 255 }),
  emergencyContactRelation: varchar("emergencyContactRelation", { length: 100 }),
  notes: text("notes"),
  photoUri: text("photoUri"),
  // Medical information
  bloodGroup: varchar("bloodGroup", { length: 10 }),
  medicalConditions: text("medicalConditions"),
  allergies: text("allergies"),
  medications: text("medications"),
  age: int("age"),
  gender: mysqlEnum("gender", ["male", "female", "other"]),
  // Timestamps
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Participant = typeof participants.$inferSelect;
export type InsertParticipant = typeof participants.$inferInsert;

/**
 * Scan logs table - records each QR scan at checkpoints
 */
export const scanLogs = mysqlTable("scan_logs", {
  id: int("id").autoincrement().primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(), // Client-generated UUID for sync
  participantUuid: varchar("participantUuid", { length: 36 }).notNull(),
  checkpointId: int("checkpointId").notNull(),
  deviceId: varchar("deviceId", { length: 64 }),
  gpsLat: decimal("gpsLat", { precision: 10, scale: 7 }),
  gpsLng: decimal("gpsLng", { precision: 10, scale: 7 }),
  scannedAt: timestamp("scannedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  // Performance indexes for faster queries
  participantIdx: index("idx_scan_logs_participant").on(table.participantUuid),
  checkpointIdx: index("idx_scan_logs_checkpoint").on(table.checkpointId),
  scannedAtIdx: index("idx_scan_logs_scanned_at").on(table.scannedAt),
  // Composite index for duplicate detection queries
  participantCheckpointIdx: index("idx_scan_logs_participant_checkpoint").on(table.participantUuid, table.checkpointId),
}));

export type ScanLog = typeof scanLogs.$inferSelect;
export type InsertScanLog = typeof scanLogs.$inferInsert;

/**
 * Family groups table - groups participants into families
 */
export const familyGroups = mysqlTable("family_groups", {
  id: int("id").autoincrement().primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  headOfFamilyUuid: varchar("headOfFamilyUuid", { length: 36 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FamilyGroup = typeof familyGroups.$inferSelect;
export type InsertFamilyGroup = typeof familyGroups.$inferInsert;

/**
 * Family group members - links participants to family groups
 */
export const familyGroupMembers = mysqlTable("family_group_members", {
  id: int("id").autoincrement().primaryKey(),
  familyGroupUuid: varchar("familyGroupUuid", { length: 36 }).notNull(),
  participantUuid: varchar("participantUuid", { length: 36 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FamilyGroupMember = typeof familyGroupMembers.$inferSelect;
export type InsertFamilyGroupMember = typeof familyGroupMembers.$inferInsert;

/**
 * Volunteers table - stores volunteer information
 */
export const volunteers = mysqlTable("volunteers", {
  id: int("id").autoincrement().primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  mobile: varchar("mobile", { length: 20 }),
  pin: varchar("pin", { length: 10 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Volunteer = typeof volunteers.$inferSelect;
export type InsertVolunteer = typeof volunteers.$inferInsert;

/**
 * Volunteer checkpoint assignments
 */
export const volunteerCheckpoints = mysqlTable("volunteer_checkpoints", {
  id: int("id").autoincrement().primaryKey(),
  volunteerUuid: varchar("volunteerUuid", { length: 36 }).notNull(),
  checkpointId: int("checkpointId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VolunteerCheckpoint = typeof volunteerCheckpoints.$inferSelect;
export type InsertVolunteerCheckpoint = typeof volunteerCheckpoints.$inferInsert;

/**
 * Checkpoint notes - notes added by volunteers at checkpoints
 */
export const checkpointNotes = mysqlTable("checkpoint_notes", {
  id: int("id").autoincrement().primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  checkpointId: int("checkpointId").notNull(),
  participantUuid: varchar("participantUuid", { length: 36 }),
  volunteerUuid: varchar("volunteerUuid", { length: 36 }),
  note: text("note").notNull(),
  noteType: mysqlEnum("noteType", ["general", "medical", "assistance", "other"]).default("general").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CheckpointNote = typeof checkpointNotes.$inferSelect;
export type InsertCheckpointNote = typeof checkpointNotes.$inferInsert;

/**
 * Lost and found items
 */
export const lostFoundItems = mysqlTable("lost_found_items", {
  id: int("id").autoincrement().primaryKey(),
  uuid: varchar("uuid", { length: 36 }).notNull().unique(),
  itemType: mysqlEnum("itemType", ["lost", "found"]).notNull(),
  description: text("description").notNull(),
  location: varchar("location", { length: 255 }),
  reportedBy: varchar("reportedBy", { length: 255 }),
  photoUri: text("photoUri"),
  status: mysqlEnum("status", ["open", "resolved"]).default("open").notNull(),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LostFoundItem = typeof lostFoundItems.$inferSelect;
export type InsertLostFoundItem = typeof lostFoundItems.$inferInsert;

/**
 * Sync metadata - tracks last sync time per device
 */
export const syncMetadata = mysqlTable("sync_metadata", {
  id: int("id").autoincrement().primaryKey(),
  deviceId: varchar("deviceId", { length: 64 }).notNull().unique(),
  lastSyncAt: timestamp("lastSyncAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SyncMetadata = typeof syncMetadata.$inferSelect;
export type InsertSyncMetadata = typeof syncMetadata.$inferInsert;
