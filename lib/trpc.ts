import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppRouter } from "@/server/routers";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "@/lib/auth";

// Storage key for device ID
const DEVICE_ID_KEY = "palitana_device_id";

// Cached device ID
let cachedDeviceId: string | null = null;

/**
 * Get or create a unique device ID for this installation
 */
async function getDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;
  
  try {
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = `device-${crypto.randomUUID()}`;
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    cachedDeviceId = deviceId;
    return deviceId;
  } catch (err) {
    console.warn("[tRPC] Failed to get device ID:", err);
    return `device-${Date.now()}`;
  }
}

/**
 * tRPC React client for type-safe API calls.
 *
 * IMPORTANT (tRPC v11): The `transformer` must be inside `httpBatchLink`,
 * NOT at the root createClient level. This ensures client and server
 * use the same serialization format (superjson).
 */
export const trpc = createTRPCReact<AppRouter>();

// Request timeout in milliseconds (10 seconds)
const REQUEST_TIMEOUT = 10000;

/**
 * Creates a fetch function with timeout support
 */
function fetchWithTimeout(url: RequestInfo | URL, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  
  return fetch(url, {
    ...options,
    credentials: "include",
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));
}

/**
 * Creates the tRPC client with proper configuration.
 * Call this once in your app's root layout.
 * 
 * Features:
 * - Request timeout (10s) to prevent hanging requests
 * - Automatic retry handled by React Query
 * - Cookie-based auth with credentials included
 * - Device ID header for volunteer authentication
 */
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getApiBaseUrl()}/api/trpc`,
        // tRPC v11: transformer MUST be inside httpBatchLink, not at root
        transformer: superjson,
        async headers() {
          const [token, deviceId] = await Promise.all([
            Auth.getSessionToken(),
            getDeviceId(),
          ]);
          
          const headers: Record<string, string> = {
            "x-device-id": deviceId,
          };
          
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
          
          return headers;
        },
        // Custom fetch with timeout and credentials
        fetch: fetchWithTimeout,
      }),
    ],
  });
}
