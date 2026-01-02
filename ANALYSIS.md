# Comprehensive Codebase Analysis - Palitana Yatra App

## Goal
Ensure the app works **100% offline** for scanning and badge input, with automatic sync to database and Google Sheets when online.

---

## Phase 1: Data Flow Analysis

### Expected Flow:
1. **App Launch** → Load cached participants from AsyncStorage
2. **Online** → Fetch fresh participants from server, update cache
3. **Scan/Badge Input** → Save to local pending queue immediately (no API call blocking)
4. **Background Sync** → Push pending scans to server when online
5. **Server** → Save to database + log to Google Sheets

### Current Issues to Investigate:
- [ ] Are participants cached locally for offline access?
- [ ] Does badge input work without network?
- [ ] Is the scan saved locally before API call?
- [ ] Does the UI block on API calls?

---

## Analysis Results:

### 1. hooks/use-offline-sync.ts - CRITICAL ISSUES FOUND

**Issue 1: Participants NOT using cached data**
- Line 509: `participants` is returned directly from `dbParticipants.map()`
- Line 146-164: `participants` comes from tRPC query, NOT from `cachedParticipants`
- **Problem**: If API fails, `participants` is empty array, badge input can't find anyone
- **Fix needed**: Use `cachedParticipants` as fallback when `dbParticipants` is empty

**Issue 2: Cache is loaded but never used**
- Lines 214-223: Cache is loaded from AsyncStorage into `cachedParticipants` and `cachedScanLogs`
- But these cached values are NEVER used in the return statement (lines 507-539)
- **Fix needed**: Merge cached data with API data, prioritize API when available

**Issue 3: Cache is never updated**
- When API successfully fetches data, it's never saved to cache
- **Fix needed**: Save participants and scan logs to cache after successful API fetch

**What's working correctly:**
- `addScan` is truly offline-first (saves to pending queue immediately)
- Pending scans are persisted to AsyncStorage
- Background sync works when online
- Duplicate detection works locally

---
