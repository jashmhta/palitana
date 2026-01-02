/**
 * GPS Location Hook
 * Provides location capture functionality for scans
 * 
 * Features:
 * - Permission handling
 * - Location caching for performance
 * - Background location updates
 * - Error handling
 */

import { useState, useEffect, useCallback, useRef } from "react";
import * as Location from "expo-location";
import { Platform } from "react-native";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
}

interface UseLocationResult {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
  refreshLocation: () => Promise<LocationData | null>;
}

// Cache location for 30 seconds to avoid constant GPS polling
const LOCATION_CACHE_MS = 30 * 1000;

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  
  const lastFetchTime = useRef<number>(0);
  const cachedLocation = useRef<LocationData | null>(null);

  /**
   * Check if we have location permission
   */
  const checkPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      const granted = status === "granted";
      setHasPermission(granted);
      return granted;
    } catch (err) {
      console.error("[Location] Permission check failed:", err);
      setHasPermission(false);
      return false;
    }
  }, []);

  /**
   * Request location permission
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === "granted";
      setHasPermission(granted);
      
      if (!granted) {
        setError("Location permission denied");
      }
      
      return granted;
    } catch (err) {
      console.error("[Location] Permission request failed:", err);
      setError("Failed to request location permission");
      return false;
    }
  }, []);

  /**
   * Get current location
   */
  const getLocation = useCallback(async (): Promise<LocationData | null> => {
    // Check cache first
    const now = Date.now();
    if (cachedLocation.current && now - lastFetchTime.current < LOCATION_CACHE_MS) {
      return cachedLocation.current;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check permission
      const hasAccess = await checkPermission();
      if (!hasAccess) {
        setError("Location permission not granted");
        return null;
      }

      // Get location with timeout
      const result = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
      });

      const locationData: LocationData = {
        latitude: result.coords.latitude,
        longitude: result.coords.longitude,
        accuracy: result.coords.accuracy,
        timestamp: result.timestamp,
      };

      // Cache the result
      cachedLocation.current = locationData;
      lastFetchTime.current = now;
      
      setLocation(locationData);
      return locationData;
    } catch (err) {
      console.error("[Location] Failed to get location:", err);
      setError("Failed to get location");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [checkPermission]);

  /**
   * Force refresh location (bypass cache)
   */
  const refreshLocation = useCallback(async (): Promise<LocationData | null> => {
    lastFetchTime.current = 0; // Clear cache
    return getLocation();
  }, [getLocation]);

  // Check permission on mount
  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  // Get initial location on mount if we have permission
  useEffect(() => {
    if (hasPermission && !location) {
      getLocation();
    }
  }, [hasPermission, location, getLocation]);

  return {
    location,
    isLoading,
    error,
    hasPermission,
    requestPermission,
    refreshLocation,
  };
}

/**
 * Get location for a scan (simplified interface)
 * Returns null if location unavailable - scan should still proceed
 */
export async function getLocationForScan(): Promise<{ lat: number; lng: number } | null> {
  try {
    // Check permission first
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status !== "granted") {
      return null;
    }

    // Get location with short timeout
    const result = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    return {
      lat: result.coords.latitude,
      lng: result.coords.longitude,
    };
  } catch (err) {
    // Location is optional - don't fail the scan
    console.warn("[Location] Could not get location for scan:", err);
    return null;
  }
}
