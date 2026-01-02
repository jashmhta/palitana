/**
 * Palitana Yatra Tracker - Data Types
 */

// Participant data from Google Sheets
export interface Participant {
  id: string;
  name: string;
  mobile: string;
  qrToken: string;
  createdAt?: string;
  group?: string;
  emergencyContact?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  notes?: string;
  photoUri?: string;
  // Medical information
  bloodGroup?: string;
  medicalConditions?: string;
  allergies?: string;
  medications?: string;
  age?: number;
  gender?: "male" | "female" | "other";
}

// Scan log entry
export interface ScanLog {
  id: string;
  participantId: string;
  checkpointId: number;
  timestamp: string;
  deviceId?: string;
  gpsLat?: number;
  gpsLng?: number;
  synced: boolean;
}

// Checkpoint definition
export interface Checkpoint {
  id: number;
  number: number;
  description: string;
  day: 1 | 2;
}

// Sync queue item
export interface SyncQueueItem {
  id: string;
  type: 'scan_log';
  data: ScanLog;
  createdAt: string;
  retryCount: number;
}

// App settings
export interface AppSettings {
  currentCheckpoint: number;
  deviceId: string;
  lastSyncTime: string | null;
  googleSheetsId: string | null;
  autoSync: boolean;
}

// Participant with scan progress
export interface ParticipantWithProgress extends Participant {
  scannedCheckpoints: number[];
  totalScans: number;
  lastScanTime?: string;
}

// Checkpoint with scan count
export interface CheckpointWithStats extends Checkpoint {
  scanCount: number;
  lastScanTime?: string;
}

// Sync status
export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  lastError: string | null;
}

// Google Sheets configuration
export interface GoogleSheetsConfig {
  spreadsheetId: string;
  participantsSheetName: string;
  scanLogsSheetName: string;
  checkpointsSheetName: string;
}


// Family/Group tracking
export interface FamilyGroup {
  id: string;
  name: string;
  memberIds: string[];
  createdAt: string;
  headOfFamily?: string; // participant ID of the group leader
  notes?: string;
}

// Volunteer data
export interface Volunteer {
  id: string;
  name: string;
  mobile: string;
  pin: string;
  assignedCheckpoints: number[];
  createdAt: string;
  isActive: boolean;
}

// Lost and Found item
export interface LostFoundItem {
  id: string;
  type: "lost" | "found";
  description: string;
  location: string;
  reportedBy: string;
  reportedAt: string;
  status: "open" | "resolved";
  resolvedAt?: string;
  photoUri?: string;
}

// Checkpoint note
export interface CheckpointNote {
  id: string;
  checkpointId: number;
  participantId?: string;
  volunteerId: string;
  note: string;
  createdAt: string;
  type: "general" | "medical" | "assistance" | "other";
}

// Analytics data
export interface TimeAnalytics {
  checkpointId: number;
  averageTimeFromPrevious: number; // in minutes
  minTime: number;
  maxTime: number;
  sampleSize: number;
}

// Language options
export type Language = "en" | "hi" | "gu";

// App preferences
export interface AppPreferences {
  language: Language;
  darkMode: "system" | "light" | "dark";
  hapticFeedback: boolean;
  soundEffects: boolean;
  autoSync: boolean;
  showOnboarding: boolean;
}
