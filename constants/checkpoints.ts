/**
 * Palitana Yatra Checkpoints Configuration
 * 
 * Based on research of Shatrunjaya pilgrimage routes:
 * 
 * Geography:
 * - Main Route (Front Side): 3,750 steps from Palitana town (Jay Taleti)
 * - Gheti Route: Alternative route on other side of hill
 * - Aamli: Midway point on Gheti route (between top and Gheti bottom)
 * 
 * Yatra Flow:
 * 1. Pilgrim climbs from Front Side → reaches top (Sagaal Pol area)
 * 2. Descends toward Gheti → Scan at AAMLI (midway point)
 * 3. Reaches bottom → Scan at GHETI (even scan = Jatra complete)
 * 4. Climbs back to top → descends again → repeat
 * 5. Final descent of day → Scan at X (Front Side route)
 * 
 * Scan Logic:
 * - Odd scans = Descending (at Aamli)
 * - Even scans at Gheti = Jatra completed
 * - Final scan at X = Day complete
 * 
 * Rate Limit: 10 minutes per checkpoint per pilgrim to prevent duplicate scans
 * by multiple volunteers at the same checkpoint.
 */

import { Checkpoint } from "@/types";

export const DEFAULT_CHECKPOINTS: Checkpoint[] = [
  { 
    id: 1, 
    number: 1, 
    description: "Aamli", 
    day: 1 
  },
  { 
    id: 2, 
    number: 2, 
    description: "Gheti", 
    day: 1 
  },
  { 
    id: 3, 
    number: 3, 
    description: "X", 
    day: 1 
  },
];

export const TOTAL_CHECKPOINTS = 3;

// Rate limit in milliseconds (10 minutes)
// Same pilgrim at same checkpoint blocked within this time
// This prevents duplicate scans by multiple volunteers
export const DUPLICATE_RATE_LIMIT_MS = 10 * 60 * 1000;
