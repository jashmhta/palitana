import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View, Platform } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
// AsyncStorage import removed - not needed after bulk import removal

// BulkImportModal removed - all 413 pilgrims are pre-registered
import { exportBatchQRCardsPDF } from "@/services/pdf-export-service";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useLanguage } from "@/contexts/language-context";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { SortFilterBar, SortOption, FilterStatus } from "@/components/sort-filter";
import { TOTAL_CHECKPOINTS } from "@/constants/checkpoints";
import { Colors, Radius, Shadows, Spacing, Typography } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useResponsive } from "@/hooks/use-responsive";
import { useParticipantsDB, useScanLogsDB, getParticipantsWithProgress } from "@/hooks/use-database";
import { ParticipantWithProgress } from "@/types";

export default function ParticipantsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isDesktop, containerWidth } = useResponsive();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [refreshing, setRefreshing] = useState(false);
  // Bulk import removed - all pilgrims pre-registered
  const [isExporting, setIsExporting] = useState(false);

  const { participants, loading: participantsLoading } = useParticipantsDB();
  const { scanLogs, loading: logsLoading } = useScanLogsDB();

  const participantsWithProgress = useMemo(
    () => getParticipantsWithProgress(participants, scanLogs),
    [participants, scanLogs]
  );

  const filteredAndSortedParticipants = useMemo(() => {
    let result = participantsWithProgress;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const isNumericQuery = /^\d+$/.test(query);
      
      result = result.filter(
        (p) => {
          // Extract badge number from QR token (e.g., "PALITANA_YATRA_1" -> "1")
          const badgeNumber = p.qrToken.split('_').pop() || '';
          
          return (
            p.name.toLowerCase().includes(query) ||
            p.mobile.includes(query) ||
            p.qrToken.toLowerCase().includes(query) ||
            badgeNumber.includes(query)
          );
        }
      );
      
      // If searching by number, sort by badge number relevance (exact match first)
      if (isNumericQuery) {
        result = [...result].sort((a, b) => {
          const aBadge = a.qrToken.split('_').pop() || '';
          const bBadge = b.qrToken.split('_').pop() || '';
          
          // Exact match comes first
          const aExact = aBadge === query;
          const bExact = bBadge === query;
          if (aExact && !bExact) return -1;
          if (!aExact && bExact) return 1;
          
          // Then sort by badge number numerically
          return parseInt(aBadge) - parseInt(bBadge);
        });
        
        return result; // Skip other sorting for numeric searches
      }
    }
    
    // Apply status filter
    if (filterStatus !== "all") {
      result = result.filter((p) => {
        if (filterStatus === "completed") return p.totalScans === TOTAL_CHECKPOINTS;
        if (filterStatus === "in_progress") return p.totalScans > 0 && p.totalScans < TOTAL_CHECKPOINTS;
        if (filterStatus === "not_started") return p.totalScans === 0;
        return true;
      });
    }
    
    // Apply sorting
    result = [...result].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "progress") return b.totalScans - a.totalScans;
      if (sortBy === "recent") {
        const aTime = a.lastScanTime ? new Date(a.lastScanTime).getTime() : 0;
        const bTime = b.lastScanTime ? new Date(b.lastScanTime).getTime() : 0;
        return bTime - aTime;
      }
      return 0;
    });
    
    return result;
  }, [participantsWithProgress, searchQuery, sortBy, filterStatus]);

  // Keep old variable name for compatibility
  const filteredParticipants = filteredAndSortedParticipants;

  const handleExportAll = useCallback(async () => {
    if (participants.length === 0) return;
    
    setIsExporting(true);
    try {
      await exportBatchQRCardsPDF(participants);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
    }
  }, [participants]);

  const handleRefresh = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  // Stats
  const completedCount = participantsWithProgress.filter(
    (p) => p.totalScans === TOTAL_CHECKPOINTS
  ).length;
  const inProgressCount = participantsWithProgress.filter(
    (p) => p.totalScans > 0 && p.totalScans < TOTAL_CHECKPOINTS
  ).length;

  const getProgressColor = useCallback((totalScans: number) => {
    const percentage = (totalScans / TOTAL_CHECKPOINTS) * 100;
    if (percentage >= 100) return colors.success;
    if (percentage >= 50) return colors.pending;
    if (percentage > 0) return colors.primary;
    return colors.textTertiary;
  }, [colors.success, colors.pending, colors.primary, colors.textTertiary]);

  const getStatusText = (totalScans: number) => {
    if (totalScans === TOTAL_CHECKPOINTS) return "Completed";
    if (totalScans === 0) return "Not started";
    return `${totalScans}/${TOTAL_CHECKPOINTS}`;
  };

  const renderParticipant = useCallback(
    ({ item, index }: { item: ParticipantWithProgress; index: number }) => {
      const progressPercentage = Math.round((item.totalScans / TOTAL_CHECKPOINTS) * 100);
      const statusColor = getProgressColor(item.totalScans);
      const isCompleted = item.totalScans === TOTAL_CHECKPOINTS;

      return (
        <Animated.View 
          entering={FadeInDown.delay(Math.min(index * 20, 300)).springify()}
          style={isDesktop && styles.participantCardWrapper}
        >
          <Pressable
            style={[
              styles.participantCard, 
              { backgroundColor: colors.card }, 
              Shadows.sm,
              isDesktop && styles.participantCardDesktop,
            ]}
            onPress={() => router.push(`/participant/${item.id}` as any)}
          >
            {/* Avatar */}
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: isCompleted
                    ? colors.successLight
                    : item.totalScans > 0
                    ? colors.primaryLight
                    : colors.backgroundSecondary,
                },
              ]}
            >
              {isCompleted ? (
                <IconSymbol name="checkmark.circle.fill" size={24} color={colors.success} />
              ) : (
                <ThemedText
                  style={[
                    styles.avatarText,
                    { color: item.totalScans > 0 ? colors.primary : colors.textTertiary },
                  ]}
                >
                  {item.name.charAt(0).toUpperCase()}
                </ThemedText>
              )}
            </View>

            {/* Info */}
            <View style={styles.participantInfo}>
              <ThemedText style={styles.participantName} numberOfLines={1}>
                {item.name} (#{item.qrToken.split('_').pop()})
              </ThemedText>
              <ThemedText style={[styles.participantMobile, { color: colors.textSecondary }]}>
                {item.mobile}
              </ThemedText>

              {/* Progress Bar */}
              <View style={styles.progressRow}>
                <View style={[styles.progressBarBg, { backgroundColor: colors.backgroundSecondary }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        backgroundColor: statusColor,
                        width: `${progressPercentage}%`,
                      },
                    ]}
                  />
                </View>
                <ThemedText style={[styles.statusText, { color: statusColor }]}>
                  {getStatusText(item.totalScans)}
                </ThemedText>
              </View>
            </View>

            {/* Chevron */}
            <View style={[styles.chevronCircle, { backgroundColor: colors.backgroundSecondary }]}>
              <IconSymbol name="chevron.right" size={14} color={colors.textTertiary} />
            </View>
          </Pressable>
        </Animated.View>
      );
    },
    [colors, router, isDesktop, getProgressColor]
  );

  const loading = participantsLoading || logsLoading;

  // Desktop Layout
  if (isDesktop) {
    return (
      <ThemedView style={styles.container}>
        <ScrollView
          style={styles.desktopScrollView}
          contentContainerStyle={[
            styles.desktopContent,
            { paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 20) + 80 }
          ]}
        >
          <View style={[styles.desktopContainer, { maxWidth: containerWidth }]}>
            {/* Desktop Header */}
            <LinearGradient
              colors={[colors.gradientPrimaryStart, colors.gradientPrimaryEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.desktopHeader}
            >
              <View style={styles.desktopHeaderContent}>
                <View>
                  <ThemedText style={styles.headerTitle}>{t("pilgrims_title")}</ThemedText>
                  <ThemedText style={styles.headerSubtitle}>
                    {participants.length} registered participants
                  </ThemedText>
                </View>
                <View style={styles.desktopStatsRow}>
                  <View style={styles.desktopStatCard}>
                    <ThemedText style={styles.statValue}>{completedCount}</ThemedText>
                    <ThemedText style={styles.statLabel}>Completed</ThemedText>
                  </View>
                  <View style={styles.desktopStatCard}>
                    <ThemedText style={styles.statValue}>{inProgressCount}</ThemedText>
                    <ThemedText style={styles.statLabel}>In Progress</ThemedText>
                  </View>
                  <View style={styles.desktopStatCard}>
                    <ThemedText style={styles.statValue}>
                      {participants.length - completedCount - inProgressCount}
                    </ThemedText>
                    <ThemedText style={styles.statLabel}>Not Started</ThemedText>
                  </View>
                </View>
                {/* Action Buttons */}
                <View style={styles.headerButtonsRow}>
                  {/* Export Button */}
                  <Pressable
                    style={[styles.exportAllButton, isExporting && { opacity: 0.6 }]}
                    onPress={handleExportAll}
                    disabled={isExporting || participants.length === 0}
                  >
                    {isExporting ? (
                      <ThemedText style={styles.exportAllButtonText}>Exporting...</ThemedText>
                    ) : (
                      <>
                        <IconSymbol name="arrow.down.doc.fill" size={18} color="#FFFFFF" />
                        <ThemedText style={styles.exportAllButtonText}>Export All QR Cards</ThemedText>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            </LinearGradient>

            {/* Search Bar */}
            <View
              style={[
                styles.searchContainer,
                styles.searchContainerDesktop,
                { backgroundColor: colors.card },
                Shadows.sm,
                isSearchFocused && { borderColor: colors.primary, borderWidth: 2 },
              ]}
            >
              <IconSymbol
                name="magnifyingglass"
                size={20}
                color={isSearchFocused ? colors.primary : colors.textTertiary}
              />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search name, mobile, or QR token (e.g., PLT001)..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                  <IconSymbol name="xmark.circle.fill" size={20} color={colors.textTertiary} />
                </Pressable>
              )}
            </View>

            {/* Results Count */}
            {searchQuery.length > 0 && (
              <Animated.View entering={FadeIn} style={styles.resultsCount}>
                <ThemedText style={[styles.resultsText, { color: colors.textSecondary }]}>
                  {filteredParticipants.length} result{filteredParticipants.length !== 1 ? "s" : ""} found
                </ThemedText>
              </Animated.View>
            )}

            {/* Participant Grid */}
            {loading ? (
              <View style={styles.emptyState}>
                <ThemedText style={{ color: colors.textSecondary }}>Loading participants...</ThemedText>
              </View>
            ) : filteredParticipants.length === 0 ? (
              <View style={[styles.emptyState, styles.desktopEmptyState]}>
                <View style={[styles.emptyIcon, { backgroundColor: colors.backgroundSecondary }]}>
                  <IconSymbol name="person.2.fill" size={40} color={colors.textTertiary} />
                </View>
                <ThemedText style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                  {searchQuery ? "No results found" : "No pilgrims yet"}
                </ThemedText>
                <ThemedText style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                  {searchQuery
                    ? "Try a different search term"
                    : "Add participants in Settings to get started"}
                </ThemedText>
              </View>
            ) : (
              <View style={styles.desktopGrid}>
                {filteredParticipants.map((item, index) => (
                  <View key={item.id} style={styles.desktopGridItem}>
                    {renderParticipant({ item, index })}
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </ThemedView>
    );
  }

  // Mobile Layout
  return (
    <ThemedView style={styles.container}>
      {/* Premium Header */}
      <LinearGradient
        colors={[colors.gradientPrimaryStart, colors.gradientPrimaryEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: Math.max(insets.top, 20) + 10 }]}
      >
        <Animated.View entering={FadeInDown.delay(100)}>
          <ThemedText style={styles.headerTitle}>{t("pilgrims_title")}</ThemedText>
          <ThemedText style={styles.headerSubtitle}>
            {participants.length} registered participants
          </ThemedText>
        </Animated.View>

        {/* Stats Row */}
        <Animated.View entering={FadeIn.delay(200)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{completedCount}</ThemedText>
            <ThemedText style={styles.statLabel}>Completed</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>{inProgressCount}</ThemedText>
            <ThemedText style={styles.statLabel}>In Progress</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText style={styles.statValue}>
              {participants.length - completedCount - inProgressCount}
            </ThemedText>
            <ThemedText style={styles.statLabel}>Not Started</ThemedText>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View entering={FadeIn.delay(250)} style={styles.mobileButtonsRow}>
          {/* Export Button */}
          <Pressable
            style={[styles.mobileExportButton, isExporting && { opacity: 0.6 }]}
            onPress={handleExportAll}
            disabled={isExporting || participants.length === 0}
          >
            {isExporting ? (
              <ThemedText style={styles.exportAllButtonText}>Exporting...</ThemedText>
            ) : (
              <>
                <IconSymbol name="arrow.down.doc.fill" size={16} color="#FFFFFF" />
                <ThemedText style={styles.exportAllButtonText}>Export QR Cards</ThemedText>
              </>
            )}
          </Pressable>
        </Animated.View>
      </LinearGradient>

      {/* Search Bar */}
      <Animated.View
        entering={FadeIn.delay(300)}
        style={[
          styles.searchContainer,
          { backgroundColor: colors.card },
          Shadows.sm,
          isSearchFocused && { borderColor: colors.primary, borderWidth: 2 },
        ]}
      >
        <IconSymbol
          name="magnifyingglass"
          size={20}
          color={isSearchFocused ? colors.primary : colors.textTertiary}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search name, mobile, or QR token (e.g., PLT001)..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
            <IconSymbol name="xmark.circle.fill" size={20} color={colors.textTertiary} />
          </Pressable>
        )}
      </Animated.View>

      {/* Sort & Filter */}
      <SortFilterBar
        sortBy={sortBy}
        filterStatus={filterStatus}
        onSortChange={setSortBy}
        onFilterChange={setFilterStatus}
      />

      {/* Results Count */}
      {(searchQuery.length > 0 || filterStatus !== "all") && (
        <Animated.View entering={FadeIn} style={styles.resultsCount}>
          <ThemedText style={[styles.resultsText, { color: colors.textSecondary }]}>
            {filteredParticipants.length} result{filteredParticipants.length !== 1 ? "s" : ""} found
          </ThemedText>
        </Animated.View>
      )}

      {/* Participant List */}
      {loading ? (
        <View style={styles.emptyState}>
          <ThemedText style={{ color: colors.textSecondary }}>Loading participants...</ThemedText>
        </View>
      ) : filteredParticipants.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.backgroundSecondary }]}>
            <IconSymbol name="person.2.fill" size={40} color={colors.textTertiary} />
          </View>
          <ThemedText style={[styles.emptyTitle, { color: colors.textSecondary }]}>
            {searchQuery ? "No results found" : "No pilgrims yet"}
          </ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
            {searchQuery
              ? "Try a different search term"
              : "Add participants in Settings to get started"}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={filteredParticipants}
          renderItem={renderParticipant}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 20) + 70 },
          ]}
          showsVerticalScrollIndicator={false}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={5}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      )}
      {/* Bulk Import removed - all 413 pilgrims are pre-registered */}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Desktop styles
  desktopScrollView: {
    flex: 1,
  },
  desktopContent: {
    alignItems: "center",
    paddingHorizontal: 24,
  },
  desktopContainer: {
    width: "100%",
  },
  desktopHeader: {
    borderRadius: Radius["2xl"],
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  desktopHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  desktopStatsRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  desktopStatCard: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  headerButtonsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginLeft: Spacing.lg,
  },
  mobileButtonsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    justifyContent: "center",
  },
  exportAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
    marginLeft: Spacing.lg,
  },
  exportAllButtonText: {
    color: "#FFFFFF",
    fontWeight: Typography.weight.semibold,
    fontSize: Typography.size.sm,
  },
  mobileExportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  searchContainerDesktop: {
    marginHorizontal: 0,
    marginTop: 0,
    maxWidth: 500,
  },
  desktopGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  desktopGridItem: {
    width: "48%",
    minWidth: 300,
  },
  desktopEmptyState: {
    paddingVertical: Spacing["3xl"],
  },
  participantCardWrapper: {
    flex: 1,
  },
  participantCardDesktop: {
    marginBottom: 0,
  },
  // Mobile styles
  header: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: Radius["2xl"],
    borderBottomRightRadius: Radius["2xl"],
  },
  headerTitle: {
    fontSize: Typography.size["2xl"],
    fontWeight: Typography.weight.bold,
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: Typography.size.sm,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  statsRow: {
    flexDirection: "row",
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: "center",
  },
  statValue: {
    fontSize: Typography.size.xl,
    fontWeight: Typography.weight.bold,
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: Typography.size.xs,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.lg,
    marginTop: -Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.xl,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.size.md,
    paddingVertical: Spacing.xs,
  },
  resultsCount: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  resultsText: {
    fontSize: Typography.size.sm,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  participantCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.bold,
  },
  participantInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  participantName: {
    fontSize: Typography.size.md,
    fontWeight: Typography.weight.semibold,
  },
  participantMobile: {
    fontSize: Typography.size.sm,
    marginTop: 2,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    maxWidth: 100,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  statusText: {
    fontSize: Typography.size.xs,
    fontWeight: Typography.weight.medium,
  },
  chevronCircle: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.size.lg,
    fontWeight: Typography.weight.semibold,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: Typography.size.md,
    textAlign: "center",
    lineHeight: 22,
  },
  fab: {
    position: "absolute",
    bottom: 100,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
