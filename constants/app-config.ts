/**
 * Application Constants
 * 
 * Centralized constants to avoid magic numbers throughout the codebase.
 * All hardcoded values should be defined here for easy maintenance.
 */

// ==================== BADGE CONFIGURATION ====================

/**
 * Minimum valid badge number
 */
export const MIN_BADGE_NUMBER = 1;

/**
 * Maximum valid badge number for this event
 * Update this if the number of participants changes
 */
export const MAX_BADGE_NUMBER = 413;

/**
 * Badge number range for validation (extended for flexibility)
 */
export const BADGE_NUMBER_VALIDATION_MAX = 999;

/**
 * QR Token prefix format
 */
export const QR_TOKEN_PREFIX = "PALITANA_YATRA_";

// ==================== SYNC CONFIGURATION ====================

/**
 * Polling interval when online (milliseconds)
 * 5 seconds provides real-time feel without overwhelming server
 */
export const SYNC_POLL_INTERVAL_ONLINE = 5000;

/**
 * Polling interval when offline (milliseconds)
 * Longer interval to conserve battery
 */
export const SYNC_POLL_INTERVAL_OFFLINE = 30000;

/**
 * Base retry delay for exponential backoff (milliseconds)
 */
export const SYNC_BASE_RETRY_DELAY = 1000;

/**
 * Maximum retry delay (milliseconds)
 */
export const SYNC_MAX_RETRY_DELAY = 30000;

/**
 * Maximum number of retries before giving up
 */
export const SYNC_MAX_RETRIES = 10;

/**
 * Batch size for sync operations
 */
export const SYNC_BATCH_SIZE = 50;

// ==================== RATE LIMITING ====================

/**
 * Rate limit window for scans (milliseconds)
 */
export const SCAN_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Maximum scans per rate limit window per device
 */
export const SCAN_RATE_LIMIT_MAX = 60;

/**
 * Rate limit window for AI queries (milliseconds)
 */
export const AI_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

/**
 * Maximum AI queries per rate limit window per device
 */
export const AI_RATE_LIMIT_MAX = 10;

/**
 * Duplicate scan rate limit window (milliseconds)
 * Same pilgrim at same checkpoint blocked within this time
 */
export const DUPLICATE_SCAN_RATE_LIMIT_MS = 10 * 60 * 1000; // 10 minutes

// ==================== UI CONFIGURATION ====================

/**
 * Scan timeout (milliseconds)
 * Maximum time to wait for scan processing before showing timeout message
 */
export const SCAN_TIMEOUT_MS = 3000;

/**
 * Duplicate message auto-dismiss delay (milliseconds)
 */
export const DUPLICATE_MESSAGE_DISMISS_MS = 1000;

/**
 * Scan button size in pixels
 */
export const SCAN_BUTTON_SIZE = 140;

/**
 * Number of recent scans to show on mobile
 */
export const RECENT_SCANS_MOBILE = 10;

/**
 * Number of recent scans to show on desktop
 */
export const RECENT_SCANS_DESKTOP = 20;

// ==================== JATRA VALIDATION ====================

/**
 * Minimum Jatra time (minutes)
 * Jatras faster than this are flagged as suspicious
 */
export const JATRA_MIN_TIME_MINUTES = 15;

/**
 * Maximum reasonable Jatra time (minutes)
 * Jatras slower than this are flagged
 */
export const JATRA_MAX_TIME_MINUTES = 180;

/**
 * Typical Jatra time range for display (minutes)
 */
export const JATRA_TYPICAL_TIME_MINUTES = { min: 30, max: 60 };

// ==================== MEMORY MANAGEMENT ====================

/**
 * TTL for recent scans in memory (milliseconds)
 * Old scans are cleaned up to prevent memory leaks
 */
export const SCAN_MEMORY_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Cleanup interval for memory management (milliseconds)
 */
export const MEMORY_CLEANUP_INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Maximum scans to keep per participant in memory
 */
export const MAX_SCANS_PER_PARTICIPANT = 50;

// ==================== DATABASE ====================

/**
 * Maximum database connection pool size
 */
export const DB_CONNECTION_POOL_SIZE = 20;

/**
 * Maximum database connection attempts
 */
export const DB_MAX_CONNECTION_ATTEMPTS = 3;

/**
 * Database connection retry delay (milliseconds)
 */
export const DB_CONNECTION_RETRY_DELAY = 30000;

// ==================== CHECKPOINTS ====================

/**
 * Checkpoint IDs
 */
export const CHECKPOINT_IDS = {
  AAMLI: 1,
  GHETI: 2,
  X: 3,
} as const;

/**
 * Total number of checkpoints
 */
export const TOTAL_CHECKPOINTS = 3;

/**
 * Checkpoint that marks Jatra completion
 */
export const JATRA_COMPLETION_CHECKPOINT = CHECKPOINT_IDS.GHETI;

// ==================== EVENT CONFIGURATION ====================

/**
 * Number of days the event spans
 */
export const EVENT_DAYS = 2;

/**
 * Start date of the event (update for each event)
 */
export const EVENT_START_DATE = "2026-01-02";
