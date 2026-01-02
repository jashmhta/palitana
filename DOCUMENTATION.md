# Palitana Yatra Tracker - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Core Features](#core-features)
6. [Data Flow](#data-flow)
7. [API Reference](#api-reference)
8. [Database Schema](#database-schema)
9. [Key Components](#key-components)
10. [Hooks Reference](#hooks-reference)
11. [Services](#services)
12. [Configuration](#configuration)
13. [Environment Variables](#environment-variables)
14. [Google Sheets Integration](#google-sheets-integration)
15. [Offline-First Architecture](#offline-first-architecture)
16. [Known Issues & Debugging](#known-issues--debugging)
17. [Development Setup](#development-setup)
18. [Deployment](#deployment)

---

## Overview

Palitana Yatra Tracker is a mobile application designed to track pilgrims during the Shatrunjaya Hill pilgrimage in Palitana, Gujarat. The app enables 40+ volunteers to scan QR codes at 3 checkpoints, with real-time synchronization across all devices.

**Key Capabilities:**
- QR code scanning (camera + gallery)
- Manual badge number entry
- Offline-first operation with background sync
- Real-time data sync across all volunteer devices
- Automatic Google Sheets logging
- CSV export for reports

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         MOBILE APP                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Scanner   │  │  Offline    │  │     Local Storage       │  │
│  │   Screen    │──│   Sync      │──│    (AsyncStorage)       │  │
│  │             │  │   Hook      │  │  - Cached Participants  │  │
│  └─────────────┘  └──────┬──────┘  │  - Pending Scans        │  │
│                          │         │  - Settings             │  │
│                          │         └─────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           │ tRPC API (HTTP)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API SERVER                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   tRPC      │  │  Database   │  │   Google Sheets         │  │
│  │   Router    │──│   Layer     │──│   Logger                │  │
│  │             │  │  (Drizzle)  │  │   (Async, Non-blocking) │  │
│  └─────────────┘  └──────┬──────┘  └─────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ participants│  │  scan_logs  │  │       users             │  │
│  │   (413)     │  │             │  │                         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile Framework | React Native 0.81 + Expo SDK 54 |
| Language | TypeScript 5.9 |
| Styling | NativeWind 4 (Tailwind CSS) |
| Navigation | Expo Router 6 |
| State Management | React Query + Zustand |
| API Layer | tRPC |
| Database | PostgreSQL + Drizzle ORM |
| Backend | Express.js |
| Google Sheets | googleapis npm package |

---

## Project Structure

```
palitana-yatra-app/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab-based navigation
│   │   ├── _layout.tsx           # Tab bar configuration
│   │   ├── index.tsx             # Home/Scanner screen (MAIN)
│   │   ├── checkpoints.tsx       # Checkpoints list
│   │   ├── participants.tsx      # Pilgrims list
│   │   ├── reports.tsx           # Reports & export
│   │   └── settings.tsx          # App settings
│   ├── onboarding/               # Onboarding flow
│   ├── participant/[id].tsx      # Participant detail
│   └── _layout.tsx               # Root layout
├── components/                   # Reusable components
│   ├── screen-container.tsx      # SafeArea wrapper
│   ├── error-boundary.tsx        # Crash recovery
│   ├── offline-banner.tsx        # Network status
│   └── ui/                       # UI primitives
├── hooks/                        # Custom React hooks
│   ├── use-offline-sync.ts       # CRITICAL: Offline sync logic
│   ├── use-storage.ts            # Settings persistence
│   ├── use-database.ts           # Database operations
│   └── use-colors.ts             # Theme colors
├── server/                       # Backend server
│   ├── _core/                    # Core server utilities
│   ├── routers.ts                # tRPC API routes
│   ├── db.ts                     # Database operations
│   └── google-sheets-logger.ts   # Google Sheets integration
├── services/                     # App services
│   ├── qr-scanner.ts             # QR scanning logic
│   └── audio-feedback.ts         # Sound effects
├── constants/                    # App constants
│   ├── checkpoints.ts            # Checkpoint definitions
│   └── theme.ts                  # Theme colors
├── drizzle/                      # Database schema
│   └── schema.ts                 # Table definitions
└── types/                        # TypeScript types
    └── index.ts                  # Shared types
```

---

## Core Features

### 1. QR Code Scanner

**Location:** `app/(tabs)/index.tsx`

The scanner supports three modes:
- **Camera Scan:** Real-time QR code detection using `expo-camera`
- **Gallery Scan:** Import QR code image from device gallery
- **Manual Entry:** Enter badge number (1-413) manually

**QR Token Format:** `PALITANA_YATRA_{badge_number}`

Example: Badge #56 → QR Token: `PALITANA_YATRA_56`

### 2. Checkpoint System

**Location:** `constants/checkpoints.ts`

Three checkpoints configured:
| ID | Name | Description |
|----|------|-------------|
| 1 | Aamli | Midway point on Gheti route |
| 2 | Gheti | Bottom of the route (Jatra completion) |
| 3 | X | Front Side route (placeholder name) |

### 3. Offline-First Sync

**Location:** `hooks/use-offline-sync.ts`

The app operates fully offline:
1. Scans are saved to local AsyncStorage immediately
2. Background sync attempts to push to server
3. Cached participants used when API unavailable
4. Pending scans queue with retry logic

### 4. Real-Time Multi-Device Sync

All volunteer devices see the same data:
- 5-second polling interval for scan logs
- Instant local updates, background server sync
- Duplicate prevention (same participant + checkpoint)

---

## Data Flow

### Scan Flow (Badge Input / QR Scan)

```
User Action: Enter badge #56 or scan QR code
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 1. Find participant in local cache      │
│    participants.find(p => p.qrToken     │
│    === "PALITANA_YATRA_56")             │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 2. Check for duplicate scan             │
│    isDuplicateScan(participantId,       │
│    checkpointId)                        │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 3. Create pending scan (local)          │
│    - Generate UUID                      │
│    - Add to pendingScans state          │
│    - Save to AsyncStorage (background)  │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 4. Return success immediately           │
│    - Play success sound                 │
│    - Show green checkmark               │
│    - Haptic feedback                    │
└─────────────────────────────────────────┘
                    │
                    ▼ (Background, non-blocking)
┌─────────────────────────────────────────┐
│ 5. Sync to server (if online)           │
│    - POST to /api/trpc/scanLogs.create  │
│    - Server logs to Google Sheets       │
│    - Remove from pending queue          │
└─────────────────────────────────────────┘
```

---

## API Reference

### tRPC Endpoints

**Base URL:** `{API_BASE_URL}/api/trpc`

#### Participants

| Endpoint | Method | Description |
|----------|--------|-------------|
| `participants.list` | GET | Get all participants |
| `participants.get` | GET | Get single participant by UUID |
| `participants.getByQrToken` | GET | Get participant by QR token |
| `participants.create` | POST | Create new participant |

#### Scan Logs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `scanLogs.list` | GET | Get all scan logs |
| `scanLogs.create` | POST | Create new scan log |
| `scanLogs.clearAll` | POST | Clear all scan logs |

#### Sync

| Endpoint | Method | Description |
|----------|--------|-------------|
| `sync.fullSync` | GET | Get all participants + scan logs |

### Create Scan Log Input

```typescript
{
  uuid: string;              // Unique scan ID (crypto.randomUUID())
  participantUuid: string;   // Participant's UUID
  checkpointId: number;      // 1, 2, or 3
  deviceId: string;          // Device identifier
  gpsLat?: string;           // GPS latitude (optional)
  gpsLng?: string;           // GPS longitude (optional)
  scannedAt: string;         // ISO timestamp
}
```

---

## Database Schema

**Location:** `drizzle/schema.ts`

### participants Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Full name |
| qrToken | VARCHAR(100) | Unique QR code token |
| badgeNumber | INTEGER | Badge number (1-413) |
| age | INTEGER | Age in years |
| bloodGroup | VARCHAR(10) | Blood type |
| mobileNumber | VARCHAR(20) | Contact number |
| emergencyContact | VARCHAR(20) | Emergency contact |
| emergencyContactName | VARCHAR(255) | Emergency contact name |
| emergencyContactRelation | VARCHAR(100) | Relationship |
| photoUri | TEXT | Photo URL |
| createdAt | TIMESTAMP | Creation timestamp |

### scan_logs Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| participantUuid | UUID | Foreign key to participants |
| checkpointId | INTEGER | Checkpoint ID (1-3) |
| deviceId | VARCHAR(100) | Scanning device ID |
| gpsLat | VARCHAR(50) | GPS latitude |
| gpsLng | VARCHAR(50) | GPS longitude |
| scannedAt | TIMESTAMP | Scan timestamp |
| createdAt | TIMESTAMP | Record creation |

### Indexes

```sql
CREATE INDEX idx_scan_logs_participant ON scan_logs(participant_uuid);
CREATE INDEX idx_scan_logs_checkpoint ON scan_logs(checkpoint_id);
CREATE INDEX idx_scan_logs_scanned_at ON scan_logs(scanned_at);
CREATE INDEX idx_scan_logs_device ON scan_logs(device_id);
```

---

## Key Components

### 1. useOfflineSync Hook

**Location:** `hooks/use-offline-sync.ts`

This is the **most critical** hook in the app. It manages:
- Participant caching
- Scan log caching
- Pending scans queue
- Background sync
- Duplicate detection

**Key Functions:**

```typescript
// Add a new scan (non-blocking)
const addScan = async (
  participantId: string,
  checkpointId: number
): Promise<{ success: boolean; duplicate: boolean }>

// Check for duplicate scan
const isDuplicateScan = (
  participantId: string,
  checkpointId: number
): boolean

// Force sync pending scans
const syncPendingScans = async (): Promise<void>
```

**IMPORTANT:** The `addScan` function is designed to be **non-blocking**:
1. Updates React state immediately (instant UI feedback)
2. Saves to AsyncStorage in background (non-awaited)
3. Syncs to server in background (non-awaited)

### 2. Scanner Screen

**Location:** `app/(tabs)/index.tsx`

Main screen with:
- Camera scanner (expo-camera)
- Manual badge entry modal
- Quick pilgrim search modal
- Bulk scan mode toggle
- Last scan result display

**State Variables:**

```typescript
const [isScannerOpen, setIsScannerOpen] = useState(false);
const [isProcessing, setIsProcessing] = useState(false);
const [showManualEntry, setShowManualEntry] = useState(false);
const [manualBadgeNumber, setManualBadgeNumber] = useState("");
const [bulkScanMode, setBulkScanMode] = useState(false);
const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
```

### 3. Error Boundary

**Location:** `components/error-boundary.tsx`

Catches React errors and provides recovery UI:
- Shows error message
- "Try Again" button to reload
- Prevents app crashes

---

## Hooks Reference

### useOfflineSync

```typescript
const {
  participants,        // Participant[] - All participants (cached + API)
  scanLogs,           // ScanLog[] - All scan logs
  pendingScans,       // PendingScan[] - Unsynced scans
  isOnline,           // boolean - Network status
  isSyncing,          // boolean - Sync in progress
  lastSyncTime,       // Date | null - Last successful sync
  addScan,            // Function - Add new scan
  isDuplicateScan,    // Function - Check duplicate
  syncPendingScans,   // Function - Force sync
  isLoading,          // boolean - Initial loading
  error,              // Error | null - Last error
} = useOfflineSync();
```

### useSettings

```typescript
const {
  settings,           // Settings object
  updateSettings,     // Function to update settings
  clearSettings,      // Function to clear all settings
} = useSettings();

// Settings shape:
interface Settings {
  currentCheckpoint: number;  // Selected checkpoint (1-3)
  language: "en" | "gu";      // Language preference
  googleSheetsId: string;     // Google Sheets ID
  soundEnabled: boolean;      // Sound feedback toggle
  hapticEnabled: boolean;     // Haptic feedback toggle
  theme: "light" | "dark" | "system";
}
```

### useDatabase

```typescript
const {
  participants,       // Participant[] from database
  scanLogs,          // ScanLog[] from database
  isLoading,         // Loading state
  error,             // Error state
  refetch,           // Refetch data
} = useDatabase();
```

---

## Services

### QR Scanner Service

**Location:** `services/qr-scanner.ts`

```typescript
// Scan QR from gallery image
export async function scanFromGallery(): Promise<{
  success: boolean;
  data?: string;
  error?: string;
}>
```

### Audio Feedback Service

**Location:** `services/audio-feedback.ts`

```typescript
export function playSuccessSound(): void;
export function playErrorSound(): void;
export function playDuplicateSound(): void;
```

---

## Configuration

### Checkpoints Configuration

**Location:** `constants/checkpoints.ts`

```typescript
export const CHECKPOINTS = [
  { id: 1, name: "Aamli", description: "Midway point on Gheti route" },
  { id: 2, name: "Gheti", description: "Bottom of the route" },
  { id: 3, name: "X", description: "Front Side route" },
];
```

### Theme Configuration

**Location:** `theme.config.js`

```javascript
const themeColors = {
  primary: { light: '#F97316', dark: '#F97316' },  // Saffron orange
  background: { light: '#ffffff', dark: '#151718' },
  surface: { light: '#f5f5f5', dark: '#1e2022' },
  foreground: { light: '#11181C', dark: '#ECEDEE' },
  muted: { light: '#687076', dark: '#9BA1A6' },
  border: { light: '#E5E7EB', dark: '#334155' },
  success: { light: '#22C55E', dark: '#4ADE80' },
  warning: { light: '#F59E0B', dark: '#FBBF24' },
  error: { light: '#EF4444', dark: '#F87171' },
};
```

---

## Environment Variables

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `GOOGLE_SHEETS_ID` | Google Sheets spreadsheet ID | `1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `EXPO_PUBLIC_API_BASE_URL` | API server URL | `https://api.example.com` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `EXPO_PORT` | Metro bundler port | `8081` |

---

## Google Sheets Integration

### Setup

1. Create a Google Cloud project
2. Enable Google Sheets API
3. Create a service account
4. Download JSON credentials
5. Save as `server/google-service-account.json`
6. Share your Google Sheet with the service account email

### Sheet Structure

**Sheet 1: ScanLogs**

| Column | Description |
|--------|-------------|
| Day | Day number (1-7) |
| Time | Scan time (HH:MM:SS) |
| Badge Number | Pilgrim badge (1-413) |
| Yatri Name | Pilgrim name |
| Checkpoint Name | Checkpoint name |

**Sheet 2: JatraCompletions**

| Column | Description |
|--------|-------------|
| Day | Day number |
| Badge Number | Pilgrim badge |
| Yatri Name | Pilgrim name |
| Jatra Number | Completion count |
| Start Time | Aamli scan time |
| End Time | Gheti scan time |
| Duration (mins) | Time taken |

### Logger Implementation

**Location:** `server/google-sheets-logger.ts`

The logger:
- Initializes on server start
- Logs scans asynchronously (non-blocking)
- Has retry queue for failed logs
- Calculates Jatra completions automatically

---

## Offline-First Architecture

### How It Works

1. **Participant Caching:**
   - On first load, participants fetched from API
   - Saved to AsyncStorage as cache
   - On subsequent loads, cache used immediately
   - API data updates cache in background

2. **Scan Queue:**
   - New scans saved to `pendingScans` state
   - Immediately saved to AsyncStorage
   - Background task syncs to server
   - Retry with exponential backoff on failure

3. **Network Detection:**
   - Uses `@react-native-community/netinfo`
   - Automatic sync when network returns
   - Offline banner shown when disconnected

### Key Code Paths

**Participant Loading:**
```typescript
// In useOfflineSync.ts
const participants = apiParticipants.length > 0 
  ? apiParticipants 
  : cachedParticipants;
```

**Scan Saving:**
```typescript
// In useOfflineSync.ts - addScan function
// 1. Update state immediately (non-blocking)
setPendingScans(updatedPending);

// 2. Save to AsyncStorage in background (non-blocking)
savePendingScans(updatedPending).catch(console.error);

// 3. Sync to server in background (non-blocking)
if (isOnline) {
  syncSingleScan(newScan);
}

// 4. Return success immediately
return { success: true, duplicate: false };
```

---

## Known Issues & Debugging

### Issue 1: Badge Input Shows Infinite Loading

**Symptoms:** User enters badge number, taps "Record Checkpoint", loading spinner never stops.

**Root Cause:** The `addScan` function was blocking on `AsyncStorage.setItem`.

**Fix Applied:** Made `savePendingScans` non-blocking by removing `await` and using `.catch()`.

**If Still Occurring:**
1. Check if `participants` array is populated (not empty)
2. Check network connectivity
3. Check AsyncStorage for corruption
4. Clear app data and re-sync

### Issue 2: Scanner Buttons Disappear

**Symptoms:** After first scan, the Manual/Search/Bulk buttons disappear.

**Root Cause:** `isProcessing` state not being reset properly.

**Fix Applied:** Added `finally` block to always reset `isProcessing`.

**If Still Occurring:**
1. Check for JavaScript errors in console
2. Verify `finally` block executes
3. Add timeout fallback (3 seconds)

### Issue 3: Participants Show 0

**Symptoms:** Home screen shows "0 Pilgrims" instead of 413.

**Root Cause:** API not reachable, and no cached data.

**Fix Applied:** Added local cache fallback.

**If Still Occurring:**
1. Check API server is running
2. Check `EXPO_PUBLIC_API_BASE_URL` is correct
3. Check network connectivity
4. Manually sync from Settings

### Debugging Tips

1. **Check API Health:**
   ```bash
   curl http://localhost:3000/api/trpc/participants.list
   ```

2. **Check Database:**
   ```bash
   curl http://localhost:3000/api/trpc/sync.fullSync
   ```

3. **Clear AsyncStorage:**
   - Go to Settings → Clear Local Data
   - This only clears local cache, not database

4. **Check Logs:**
   - Server logs: Terminal running `pnpm dev`
   - App logs: React Native debugger

---

## Development Setup

### Prerequisites

- Node.js 18+
- pnpm 9+
- PostgreSQL database
- Google Cloud service account (for Sheets)

### Installation

```bash
# Clone repository
git clone https://github.com/jashmhta/palitana.git
cd palitana

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test __tests__/app.test.ts
```

---

## Deployment

### Manus Cloud (Recommended)

1. Click "Publish" button in Manus UI
2. Wait for build to complete
3. Download APK from the provided link
4. Distribute to volunteers

### Manual Deployment

1. **Build APK:**
   ```bash
   eas build --platform android --profile production
   ```

2. **Deploy Server:**
   ```bash
   pnpm build
   pnpm start
   ```

3. **Configure Environment:**
   - Set `EXPO_PUBLIC_API_BASE_URL` to production server URL
   - Set `DATABASE_URL` to production database
   - Set `GOOGLE_SHEETS_ID` to production sheet

---

## Support

For issues or questions:
1. Check this documentation
2. Review the code comments
3. Check the `todo.md` file for known issues
4. Contact the development team

---

*Documentation generated by Manus AI - January 2, 2026*
