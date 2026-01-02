/**
 * Sync status bar component showing online/offline status and pending syncs
 */

import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useNetwork } from "@/hooks/use-network";
import { getSyncQueue } from "@/hooks/use-storage";

export function SyncStatusBar() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const network = useNetwork();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const loadPendingCount = async () => {
      const queue = await getSyncQueue();
      setPendingCount(queue.length);
    };
    loadPendingCount();

    // Refresh every 5 seconds
    const interval = setInterval(loadPendingCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const isOnline = network.isConnected && network.isInternetReachable !== false;

  return (
    <View style={styles.container}>
      <View style={styles.statusItem}>
        <IconSymbol
          name={isOnline ? "wifi" : "wifi.slash"}
          size={16}
          color={isOnline ? "#FFFFFF" : colors.error}
        />
        <ThemedText style={[styles.statusText, !isOnline && { color: colors.error }]}>
          {isOnline ? "Online" : "Offline"}
        </ThemedText>
      </View>
      {pendingCount > 0 && (
        <View style={styles.statusItem}>
          <IconSymbol name="icloud.and.arrow.up" size={16} color="#FFFFFF" />
          <ThemedText style={styles.statusText}>{pendingCount} pending</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.9,
  },
});
