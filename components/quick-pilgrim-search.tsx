/**
 * Quick Pilgrim Search Component
 * 
 * Provides instant search by badge number or name with large result cards
 * for easy identification in noisy pilgrimage environments.
 */

import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Participant, ScanLog } from "@/types";
import { calculateJatraStats, getJatraStatusText } from "@/utils/jatra-calculator";

interface QuickPilgrimSearchProps {
  visible: boolean;
  onClose: () => void;
  participants: Participant[];
  scanLogs: ScanLog[];
  onSelectPilgrim: (participant: Participant) => void;
  currentCheckpoint: number;
}

export function QuickPilgrimSearch({
  visible,
  onClose,
  participants,
  scanLogs,
  onSelectPilgrim,
  currentCheckpoint,
}: QuickPilgrimSearchProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  
  const [searchQuery, setSearchQuery] = useState("");

  // Filter participants based on search query
  const filteredParticipants = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase().trim();
    const badgeNum = parseInt(query, 10);
    
    // If it's a number, search by badge number first
    if (!isNaN(badgeNum)) {
      const exactMatch = participants.filter((p) => {
        const pBadge = parseInt(p.qrToken.replace("PALITANA_YATRA_", ""), 10);
        return pBadge === badgeNum;
      });
      
      if (exactMatch.length > 0) return exactMatch;
      
      // Partial badge number match
      return participants.filter((p) => {
        const pBadge = p.qrToken.replace("PALITANA_YATRA_", "");
        return pBadge.includes(query);
      }).slice(0, 10);
    }
    
    // Search by name
    return participants.filter((p) =>
      p.name.toLowerCase().includes(query)
    ).slice(0, 10);
  }, [searchQuery, participants]);

  const handleCallEmergency = useCallback(async (phone: string) => {
    if (Platform.OS !== "web") {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const url = `tel:${phone}`;
    if (await Linking.canOpenURL(url)) {
      await Linking.openURL(url);
    }
  }, []);

  const handleClose = useCallback(() => {
    setSearchQuery("");
    onClose();
  }, [onClose]);

  const renderPilgrimCard = useCallback(({ item, index }: { item: Participant; index: number }) => {
    const badgeNumber = parseInt(item.qrToken.replace("PALITANA_YATRA_", ""), 10);
    const jatraStats = calculateJatraStats(item.id, scanLogs);
    const statusText = getJatraStatusText(jatraStats);
    
    // Check if scanned at current checkpoint
    const scannedAtCurrent = scanLogs.some(
      (log) => log.participantId === item.id && log.checkpointId === currentCheckpoint
    );

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 50).springify()}
        style={[styles.pilgrimCard, { backgroundColor: colors.card }, Shadows.md]}
      >
        <Pressable
          style={styles.cardContent}
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            onSelectPilgrim(item);
            handleClose();
          }}
        >
          {/* Badge Number - Large and prominent */}
          <View style={[styles.badgeCircle, { backgroundColor: colors.primary }]}>
            <ThemedText style={styles.badgeNumber}>#{badgeNumber}</ThemedText>
          </View>
          
          {/* Pilgrim Info */}
          <View style={styles.pilgrimInfo}>
            <ThemedText style={styles.pilgrimName} numberOfLines={1}>
              {item.name}
            </ThemedText>
            
            <View style={styles.infoRow}>
              <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
                {item.mobile}
              </ThemedText>
              {item.bloodGroup && (
                <View style={[styles.bloodGroupBadge, { backgroundColor: colors.errorLight }]}>
                  <ThemedText style={[styles.bloodGroupText, { color: colors.error }]}>
                    {item.bloodGroup}
                  </ThemedText>
                </View>
              )}
            </View>
            
            {/* Jatra Status */}
            <View style={styles.jatraRow}>
              <IconSymbol 
                name={jatraStats.totalJatras > 0 ? "checkmark.circle.fill" : "circle"} 
                size={16} 
                color={jatraStats.totalJatras > 0 ? colors.success : colors.textSecondary} 
              />
              <ThemedText style={[
                styles.jatraText, 
                { color: jatraStats.totalJatras > 0 ? colors.success : colors.textSecondary }
              ]}>
                {statusText}
              </ThemedText>
              {scannedAtCurrent && (
                <View style={[styles.scannedBadge, { backgroundColor: colors.warningLight }]}>
                  <ThemedText style={[styles.scannedText, { color: colors.warning }]}>
                    Already Scanned
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
          
          {/* Emergency Call Button */}
          {item.emergencyContact && (
            <Pressable
              style={[styles.emergencyButton, { backgroundColor: colors.errorLight }]}
              onPress={(e) => {
                e.stopPropagation();
                handleCallEmergency(item.emergencyContact!);
              }}
            >
              <IconSymbol name="phone.fill" size={20} color={colors.error} />
            </Pressable>
          )}
        </Pressable>
      </Animated.View>
    );
  }, [colors, scanLogs, currentCheckpoint, onSelectPilgrim, handleClose, handleCallEmergency]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          entering={FadeIn}
          exiting={FadeOut}
          style={[styles.modalContent, { backgroundColor: colors.background }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>Quick Pilgrim Search</ThemedText>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <IconSymbol name="xmark.circle.fill" size={28} color={colors.textSecondary} />
            </Pressable>
          </View>
          
          {/* Search Input */}
          <View style={[styles.searchContainer, { backgroundColor: colors.backgroundSecondary }]}>
            <IconSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Enter badge # or name..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              keyboardType="default"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <IconSymbol name="xmark.circle.fill" size={20} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>
          
          {/* Results */}
          {searchQuery.length > 0 && filteredParticipants.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="person.crop.circle.badge.questionmark" size={48} color={colors.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                No pilgrim found for &quot;{searchQuery}&quot;
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={filteredParticipants}
              keyExtractor={(item) => item.id}
              renderItem={renderPilgrimCard}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
          
          {/* Hint */}
          {searchQuery.length === 0 && (
            <View style={styles.hintContainer}>
              <IconSymbol name="lightbulb.fill" size={24} color={colors.warning} />
              <ThemedText style={[styles.hintText, { color: colors.textSecondary }]}>
                Type badge number (e.g., 42) or name to search
              </ThemedText>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: "85%",
    minHeight: "60%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.lg,
    paddingVertical: Spacing.xs,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  pilgrimCard: {
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    overflow: "hidden",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  badgeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeNumber: {
    color: "#FFFFFF",
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  pilgrimInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  pilgrimName: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: Typography.size.sm,
  },
  bloodGroupBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  bloodGroupText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  jatraRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  jatraText: {
    fontSize: Typography.size.sm,
    fontWeight: Typography.weight.medium,
  },
  scannedBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    marginLeft: Spacing.xs,
  },
  scannedText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.bold,
  },
  emergencyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: Typography.size.md,
    textAlign: "center",
  },
  hintContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  hintText: {
    fontSize: Typography.size.sm,
  },
});
